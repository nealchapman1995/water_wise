import React, { useEffect, useState, useMemo } from 'react';
import { ref, get, update, push, set } from "firebase/database";
import { database } from "./configuration"; // Your Firebase database configuration
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMapMarker, faCloud, faThermometerHalf, faTint, faCalendar, faSun, faCloudRain, faLeaf } from '@fortawesome/free-solid-svg-icons'


const HomePage = ({ user }) => { //Initialize all of the states that I use in the homepage
    const [data, setData] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [inputCity, setInputCity] = useState('');
    const [userPlants, setUserPlants] = useState({}); 
    const [rainProbability, setRainProbability] = useState(0);
    const [currentTemp, setCurrentTemp] = useState(0); 

    const getUserData = async (user) => {
        const userID = user.uid;
        const userRef = ref(database, 'users/' + userID);

        get(userRef)
            .then(async (snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const userCity = userData.city;
                    const userPlants = userData.plants || {};

                    const plantDataPromises = Object.keys(userPlants).map(async (plantName) => {
                        const plantRef = ref(database, `plants/data`);
                        const snapshot = await get(plantRef);
                        let plantData = null;
                        
                        snapshot.forEach((childSnapshot) => {
                            const plant = childSnapshot.val();
                            if (plant.common_name === plantName) {
                                plantData = { ...plant, ...userPlants[plantName] };
                            }
                        });
                        return plantData;
                    });

                    const combinedPlantData = (await Promise.all(plantDataPromises)).filter(Boolean);

                    setUserPlants(combinedPlantData.reduce((acc, plant) => {
                        acc[plant.common_name] = plant;
                        return acc;
                    }, {}));

                    setSelectedCity(userCity); 
                    setInputCity(userCity);
                }
            })
            .catch((error) => {
                console.error("Issue getting data:", error);
            });
    };

    useEffect(() => {
        if (user) {
            getUserData(user);
        }
    }, [user]);

    useEffect(() => {
        if (selectedCity) { 
            fetchWeatherData(selectedCity);
        }
    }, [selectedCity]);
    
    const fetchWeatherData = (city) => {
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.REACT_APP_WEATHER_KEY}&units=imperial`)
          .then(response => {
            if (!response.ok) {
              throw new Error('City not found');
            }
            return response.json();
          })
          .then(data => {
            setData(data);
            if (data && data.list && data.list.length > 0) {
                setCurrentTemp(data.list[0].main.temp.toFixed(0)); // Get current temp and round it
              }
          })
          .catch(error => {
            console.error('Error fetching data:', error);
          });
      };

    // Use useMemo to memoize the calculation of dates
    const dates = useMemo(() => {
        return data ? Object.keys(data.list.reduce((acc, item) => {
            const date = new Date(item.dt * 1000).toLocaleDateString();
            if (!acc[date]) {
              acc[date] = { count: 0, totalPop: 0, temp_min: item.main.temp_min, temp_max: item.main.temp_max, icon: item.weather[0].icon };
            }
            acc[date].count += 1;
            acc[date].totalPop += item.pop;
            if (acc[date].temp_min > item.main.temp_min) {
              acc[date].temp_min = item.main.temp_min;
            }
            if (acc[date].temp_max < item.main.temp_max) {
              acc[date].temp_max = item.main.temp_max;
            }
            return acc;
        }, {})).map(date => {
            const groupedData = data.list.reduce((acc, item) => {
                const date = new Date(item.dt * 1000).toLocaleDateString();
                if (!acc[date]) {
                    acc[date] = {
                        count: 0,
                        totalPop: 0,
                        temp_min: item.main.temp_min,
                        temp_max: item.main.temp_max,
                        icon: item.weather[0].icon,
                    };
                }
                acc[date].count += 1;
                acc[date].totalPop += item.pop;
                acc[date].temp_min = Math.min(acc[date].temp_min, item.main.temp_min);
                acc[date].temp_max = Math.max(acc[date].temp_max, item.main.temp_max);
                return acc;
            }, {});

            const averagePop = (groupedData[date].totalPop / groupedData[date].count) * 100;
            return { 
                date, 
                averagePop: averagePop.toFixed(1), 
                temp_min: groupedData[date].temp_min.toFixed(0), 
                temp_max: groupedData[date].temp_max.toFixed(0), 
                icon: groupedData[date].icon 
            };
        }) : [];
    }, [data]); // Only recompute dates when data changes

    useEffect(() => {
        if (dates.length > 0) {
          setRainProbability(parseFloat(dates[0].averagePop)); // Set today's rain probability
        }
    }, [dates]);

      const waterPlantsWithHose = async (plantName) => {
        const timestamp = new Date().toISOString();
        const userPlantsRef = ref(database, `users/${user.uid}/plants/${plantName}`);
        await update(userPlantsRef, { lastWatered: timestamp });

        setUserPlants(prevState => ({
            ...prevState,
            [plantName]: {
                ...prevState[plantName],
                lastWatered: timestamp
            }
        }));
      };

      const waterPlantsWithRain = async (plantName) => {
        const timestamp = new Date().toISOString();
        const userPlantsRef = ref(database, `users/${user.uid}/plants/${plantName}`);
        await update(userPlantsRef, { lastWatered: timestamp });

        setUserPlants(prevState => ({
            ...prevState,
            [plantName]: {
                ...prevState[plantName],
                lastWatered: timestamp
            }
        }));

        const waterSaved = 0.125;
        const userProfileRef = ref(database, `users/${user.uid}/waterusage`);
        const newEventRef = push(userProfileRef);
        await set(newEventRef, {
            plantName,
            waterSaved,
            timestamp
        });
    }
    const calculateNextWaterDate = (plant) => {
        if (!plant.lastWatered) return "Today"; // Default to today if never watered
    
        const lastWateredDate = new Date(plant.lastWatered); 
        if (isNaN(lastWateredDate)) return "Invalid date"; // Prevents issues with bad date parsing
    
        const wateringFrequency = plant.watering?.toLowerCase() || "average"; // Ensure it's lowercase for matching
    
        // Define watering intervals based on frequency
        const wateringIntervals = {
            frequent: 2,   // Every 2 days
            average: 4,    // Every 4 days
            minimum: 7     // Every 7 days
        };
    
        const defaultWaterInterval = wateringIntervals[wateringFrequency] || 4;
    
        // Correctly add days to last watered date
        let nextWaterDate = new Date(lastWateredDate);
        nextWaterDate.setDate(lastWateredDate.getDate() + defaultWaterInterval); 
    
        // Adjust next water date if forecast predicts rain (≥ 50%)
        if (dates.length > 0) {
            for (const forecast of dates) {
                const forecastDate = new Date(forecast.date);
                if (forecastDate >= nextWaterDate && forecast.averagePop >= 50) {
                    nextWaterDate = forecastDate;
                    break;
                }
            }
        }
    
        // If the calculated next watering date is in the past, use today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to avoid time mismatches
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
    
        if (nextWaterDate < today) {
            return "Today";
        } else if (nextWaterDate.toDateString() === today.toDateString()) {
            return "Today";
        } else if (nextWaterDate.toDateString() === tomorrow.toDateString()) {
            return "Tomorrow";
        } else {
            return nextWaterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const getWateringFrequencyColor = (frequency) => {
        switch(frequency?.toLowerCase()) {
            case 'frequent': return 'text-blue-600 bg-blue-50';
            case 'average': return 'text-green-600 bg-green-50';
            case 'minimum': return 'text-amber-600 bg-amber-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getNextWaterUrgency = (nextWaterDate) => {
        if (nextWaterDate === "Today") return 'text-red-600 bg-red-50';
        if (nextWaterDate === "Tomorrow") return 'text-orange-600 bg-orange-50';
        return 'text-green-600 bg-green-50';
    };
    

    return (
        <div className='min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50'>
            <div >
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Weather Dashboard */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center">
                        <FontAwesomeIcon icon={faCloud} className="w-5 h-5 mr-2" />
                            Today's Weather
                        </h2>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FontAwesomeIcon icon={faMapMarker} className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Location</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedCity}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faThermometerHalf} className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Temperature</p>
                                    <p className="text-lg font-bold text-gray-900">{currentTemp}°F</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faTint} className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Rain Chance</p>
                                    <p className="text-lg font-bold text-gray-900">{rainProbability}%</p>
                                </div>
                            </div>
                        </div>

                        {/* 4-Day Forecast */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 mr-2" />
                                4-Day Forecast
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {dates.slice(1, 5).map((day, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                                        <p className="text-sm font-medium text-gray-600 mb-2">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                        <div className="flex items-center justify-center mb-2">
                                            {day.icon && day.icon.includes('rain') ?
                                                <FontAwesomeIcon icon={faCloudRain} className="w-8 h-8 text-blue-500" /> :
                                                <FontAwesomeIcon icon={faSun} className="w-8 h-8 text-yellow-500" />
                                            }
                                        </div>
                                        <p className="text-xs text-gray-600">{day.temp_min}° - {day.temp_max}°</p>
                                        <p className="text-xs text-blue-600 font-medium">{day.averagePop}% rain</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className=" bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <FontAwesomeIcon icon={faLeaf} className="w-5 h-5 mr-2" />
                                Your Plants ({Object.keys(userPlants).length})
                            </h2>
                            <div className="text-white text-sm">
                                {Object.values(userPlants).filter(plant => calculateNextWaterDate(plant) === "Today").length} need watering today
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {Object.keys(userPlants).length > 0 ? (
                            <div className="grid gap-6">
                                {Object.keys(userPlants).map((plantName, index) => {
                                    const plant = userPlants[plantName];
                                    const lastWatered = plant?.lastWatered
                                        ? new Date(plant.lastWatered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                        : 'Never';
                                    const nextWaterDate = calculateNextWaterDate(plant);

                                    return (
                                        <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                                                {/* Plant Image */}
                                                <div className="flex-shrink-0">
                                                    <img 
                                                        alt={plant.common_name} 
                                                        src={plant.default_image.medium_url} 
                                                        className="w-20 h-24 object-cover rounded-lg shadow-sm"
                                                    />
                                                </div>

                                                {/* Plant Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{plant.common_name}</h3>
                                                            <p className="text-sm text-gray-600 mb-3 italic">{plant.scientific_name}</p>
                                                            
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWateringFrequencyColor(plant.watering)}`}>
                                                                    {plant.watering} watering
                                                                </span>
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getNextWaterUrgency(nextWaterDate)}`}>
                                                                    Next: {nextWaterDate}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <p className="text-gray-600">Last watered</p>
                                                                    <p className="font-medium text-gray-900">{lastWatered}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-600">Watering frequency</p>
                                                                    <p className="font-medium text-gray-900 capitalize">{plant.watering}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex flex-col space-y-3 lg:ml-6 mt-4 lg:mt-0">
                                                            <button
                                                                disabled={rainProbability < 50}
                                                                onClick={() => waterPlantsWithRain(plant.common_name)}
                                                                className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                                                    rainProbability < 50 
                                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                                                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                                                                }`}
                                                            >
                                                                <fontAwesomeIcon icon={faCloudRain} className="w-4 h-4 mr-2" />
                                                                Water by Rain
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={() => waterPlantsWithHose(plant.common_name)}
                                                                className="flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm hover:shadow-md"
                                                            >
                                                                <fontAwesomeIcon icon={faTint} className="w-4 h-4 mr-2" />
                                                                Water by Hose
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                    <FontAwesomeIcon icon={faLeaf} className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No plants yet!</h3>
                                <p className="text-gray-600 mb-6">Start your plant care journey by adding your first plant.</p>
                                <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                    Add Your First Plant
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                </div>

                
            <div class="flex flex-wrap justify-between gap-3 p-4"><p class="text-[#141414] tracking-light text-[32px] font-bold leading-tight min-w-72">Welcome {user.displayName}</p></div>
            <h3 class="text-[#141414] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Today's weather</h3>
            <div class="p-4 grid grid-cols-2">
                <div class="flex flex-col gap-1 border-t border-solid border-t-[#DBE1E6] py-4 pr-2">
                    <p class="text-[#3E4D5B] text-sm font-normal leading-normal">Hometown</p>
                    <p class="text-[#141414] text-sm font-normal leading-normal">{inputCity}</p>
                </div>
                <div class="flex flex-col gap-1 border-t border-solid border-t-[#DBE1E6] py-4 pl-2">
                    <p class="text-[#3E4D5B] text-sm font-normal leading-normal">Rain Probability</p>
                    <p class="text-[#141414] text-sm font-normal leading-normal">{rainProbability}%</p>
                </div>
            </div>
            <h3 class="text-[#0d1c12] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Plants</h3>
            <ul className="divide-y divide-gray-100">
            {Object.keys(userPlants).length > 0 ? (
                        Object.keys(userPlants).map((plantName, index) => {
                            const plant = userPlants[plantName];
                            const lastWatered = plant?.lastWatered
                                ? new Date(plant.lastWatered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Never';
                            const nextWaterDate = calculateNextWaterDate(plant);

                            return (
                                <li key={index} className="flex justify-between gap-x-6 py-5">
                                    <div className="flex min-w-0 gap-x-4">
                                        <img alt="Plant" src={plant.default_image.medium_url} className="bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-lg w-[70px]" />
                                        <div className="flex flex-1 flex-col justify-center">
                                            <p className="text-[#0d1c12] text-base font-medium leading-normal">{plant.common_name}</p>
                                            <p className="text-[#2c587d] text-sm font-normal leading-normal">Last Watered Date: {lastWatered}</p>
                                            <p className="text-[#2c587d] text-sm font-normal leading-normal">Next Water Date: {nextWaterDate}</p>
                                        </div>
                                        </div>
                                        <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                                            <button disabled={rainProbability < 50} // Disable button if rain probability is less than 50%
                                                
                                                onClick={() => waterPlantsWithRain(plant.common_name)}
                                                className={`flex w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 text-[#141414] text-sm font-medium leading-normal ${
                                                    rainProbability < 50 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6eb5f0]'
                                                }`}>
                                            <span class="truncate">Water by rain</span>
                                            </button>
                                            <button onClick={() => waterPlantsWithHose(plant.common_name)}
                                            className=" w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full h-8 px-4 bg-[#F0F2F5] text-[#141414] text-sm font-medium leading-normal mt-4">
                                            <span className="truncate">Water by hose</span>
                                            </button>
                                        </div>
                                </li>
                            );
                        })
                    ) : (
                        <p>You don't have any plants yet! Start by adding some on the Plant Search feature</p>
                    )}
            </ul>
            </div>
        </div>
    );
};

export default HomePage;


