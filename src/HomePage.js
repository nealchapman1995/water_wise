import React, { useEffect, useState } from 'react';
import { ref, get, update, push, set } from "firebase/database";
import { database } from "./configuration"; // Your Firebase database configuration

const HomePage = ({ user }) => {
    const [data, setData] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [inputCity, setInputCity] = useState('');
    const [userPlants, setUserPlants] = useState({}); // Initialize as an empty object
    const [rainProbability, setRainProbability] = useState(0);

    const getUserData = async (user) => {
        const userID = user.uid;
        const userRef = ref(database, 'users/' + userID);

        get(userRef)
            .then(async (snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const userCity = userData.city;
                    const userPlants = userData.plants || {}; // Default to an empty object if plants don't exist

                    const plantDataPromises = Object.keys(userPlants).map(async (plantName) => {
                        const plantRef = ref(database, `plants/data`); //get plants data using the name on the usersprofile
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
                        acc[plant.common_name] = plant; //combines the data from the database and adds it to an object with the common name being the key
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
        if (selectedCity) { // Only call fetchWeatherData if selectedCity is not an empty string
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

      const groupedData = data?.list.reduce((acc, item) => {
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
      }, {});
    
      const dates = data ? Object.keys(groupedData).map(date => {
        const averagePop = (groupedData[date].totalPop / groupedData[date].count) * 100;
        return { date, averagePop: averagePop.toFixed(1), temp_min: groupedData[date].temp_min.toFixed(0), temp_max: groupedData[date].temp_max.toFixed(0), icon: groupedData[date].icon };
      }) : [];

      const waterPlantsWithHose = async (plantName) => {
        const timestamp = new Date().toISOString();
        console.log("watered with hose");
        const userPlantsRef = ref(database, `users/${user.uid}/plants/${plantName}`);
        await update(userPlantsRef, { lastWatered: timestamp });

        setUserPlants(prevState => ({
            ...prevState, // Saving previous state and then updating it with the newest watered date
            [plantName]: {
                ...prevState[plantName],
                lastWatered: timestamp
            }
        }));
      };

      useEffect(() => {
        if (dates.length > 0) {
          setRainProbability(parseFloat(dates[0].averagePop)); // Set today's rain probability
        }
      }, [dates]);

      const waterPlantsWithRain = async (plantName) => {
        const today = new Date().toLocaleDateString();

        const todayWeather = dates.find(dateObj => dateObj.date === today);
        console.log(todayWeather.averagePop);

        if (todayWeather && todayWeather.averagePop > 50) {
            const timestamp = new Date().toISOString();
            const userPlantsRef = ref(database, `users/${user.uid}/plants/${plantName}`);
            await update(userPlantsRef, 
                { lastWatered: timestamp
                });

            setUserPlants(prevState => ({
                ...prevState, // Saving previous state and then updating it with the newest watered date
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
        } else {
            alert("can't water with rain today");
        }
    }

  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <h1>Hows the weather in {inputCity}?</h1>
      {data && (
        <div className='dayContainer'>
            <p>Rain Probability today: {dates[0].averagePop}%</p>
        </div>
      )}
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <h3>Your Plants</h3>
      <div className='mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8'>
        {Object.keys(userPlants).length > 0 ? (
            Object.keys(userPlants).map((plantName, index) => {
                const plant = userPlants[plantName];
                const lastWatered = plant?.lastWatered  // checking if the last watered data exists, if it doesn't it just sets last watered to "Never"
                    ? new Date(plant.lastWatered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                    : 'Never';
                //const wateringSchedule = plant.watering;

                return (
                    <div key={index} className='group relative rounded-2xl'>
                        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-2xl bg-gray-200 h-40">
                            <img
                            alt='Plant'
                            src={plant.default_image.medium_url}
                            className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                            />
                        </div>
                        <div className="mt-4 flex justify-between">
                        <div>
                        <h3 className="text-sm text-gray-700">
                            <span aria-hidden="true" className="absolute inset-0" />
                            {plant.common_name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{lastWatered}</p>
                        </div>
                        <button onClick={() => waterPlantsWithRain(plant.common_name)} disabled={rainProbability< 50} className={`shadow-sm  text-sky-950 rounded-lg px-3 py-2 text-sm font-medium ${rainProbability < 50 ? 'bg-gray-400 cursor-not-allowed shadow-gray-400' : 'bg-lite-blue hover:bg-teal shadow-teal'}`}>Water with Rain</button>
                        <button onClick={() => waterPlantsWithHose(plant.common_name)} className=' mx-3 shadow-sm shadow-teal bg-lite-blue text-sky-950 hover:bg-teal rounded-lg px-3 py-2 text-sm font-medium'>Water with Hose</button>
                    </div>
                    </div>
                );
            })
        ) : (
            <p>You don't have any plants yet. Start by adding some on the Plant Search feature</p> // Message to display if no plants are available
        )}
      </div>
      </div>
    </div>
  );
};

export default HomePage;


