import React, { useEffect, useState, useMemo } from 'react';
import { ref, get, update, push, set } from "firebase/database";
import { database } from "./configuration"; // Your Firebase database configuration

const HomePage = ({ user }) => { //Initialize all of the states that I use in the homepage
    const [data, setData] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [inputCity, setInputCity] = useState('');
    const [userPlants, setUserPlants] = useState({}); 
    const [rainProbability, setRainProbability] = useState(0); 

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

    return (
        <div>
            <h1>Welcome, {user.displayName}!</h1>
            <h1>Hows the weather in {inputCity}?</h1>
            {data && (
                <div className='dayContainer'>
                    <p>Rain Probability today: {rainProbability}%</p>
                </div>
            )}
            <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <h3>Your Plants</h3>
                <div className='mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8'>
                    {Object.keys(userPlants).length > 0 ? (
                        Object.keys(userPlants).map((plantName, index) => {
                            const plant = userPlants[plantName];
                            const lastWatered = plant?.lastWatered
                                ? new Date(plant.lastWatered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Never';

                            return (
                                <div key={index} className='group relative w-72 rounded-2xl'>
                                    <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-2xl bg-gray-200 h-40">
                                        <img
                                            alt='Plant'
                                            src={plant.default_image.medium_url}
                                            className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                                        />
                                    </div>
                                    <div className="mt-0 flex items-center justify-between">
                                        <div className='h-24'>
                                            <h3 className="text-sm text-gray-700">
                                                <span aria-hidden="true" className="absolute inset-0" />
                                                {plant.common_name}
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500">{lastWatered}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={rainProbability < 50} // Disable button if rain probability is less than 50%
                                                
                                                onClick={() => waterPlantsWithRain(plant.common_name)}
                                                className={`rounded-full w-24 h-16 ${
                                                    rainProbability < 50 ? 'bg-gray-400' : 'bg-blue-500'
                                                }`}>
                                                Water with Rain
                                            </button>
                                            <button onClick={() => waterPlantsWithHose(plant.common_name)} className="rounded-full w-24 h-10 ">Water with Hose</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p>You don't have any plants yet! Start by adding some on the Plant Search feature</p>
                    )}
                </div>
            </div>
            <div>
            <ul className="divide-y divide-gray-100 border-solid border-2 border-indigo-600 px-40 py-5">
            {Object.keys(userPlants).length > 0 ? (
                        Object.keys(userPlants).map((plantName, index) => {
                            const plant = userPlants[plantName];
                            const lastWatered = plant?.lastWatered
                                ? new Date(plant.lastWatered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Never';

                            return (
                                <li key={index} className="flex justify-between gap-x-6 py-5">
                                    <div className="flex min-w-0 gap-x-4">
                                        <img alt="" src={plant.default_image.medium_url} className="bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-lg w-[70px]" />
                                        <div className="min-w-0 flex-auto">
                                            <p className="text-sm/6 font-semibold text-gray-900">{plant.common_name}</p>
                                            <p className="mt-1 truncate text-xs/5 text-gray-500">{lastWatered}</p>
                                        </div>
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


