import React, { useEffect, useState } from 'react';
import { ref, get, update, push, set } from "firebase/database";
import { database } from "./configuration"; // Your Firebase database configuration

const HomePage = ({ user }) => {
    const [data, setData] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [inputCity, setInputCity] = useState('');
    const [userPlants, setUserPlants] = useState('')


    const getUserData = async (user) => {
        const userID = user.uid;
        const userRef = ref(database, 'users/' + userID);

        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const userCity = userData.city;
                    const userPlants = userData.plants;
                    setUserPlants(userPlants);
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
        const userPlantsRef = ref(database, `users/${user.uid}/plants/${plantName}`);
        await update(userPlantsRef, { lastWatered: timestamp });

        setUserPlants(prevState => ({
            ...prevState, //Saving previous state and then updating it with the newest watered date
            [plantName]: {
                ...prevState[plantName],
                lastWatered: timestamp
            }
        }));
      };

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
            ...prevState, //Saving previous state and then updating it with the newest watered date
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
      else {
        alert("can't water with rain today")
      }
    }

  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <h1>Hows the weather in {inputCity}?</h1>
      {data && (
        <div className='dayContainer'>
          {dates.map((item, index) => (
            <div className='dayBox' key={index}>
              <h5>{item.date}</h5>
              <p>Rain Probability: {item.averagePop}%</p>
            </div>
          ))}
        </div>
      )}
      <h3>Your Plants</h3>
    <ul>
        {Object.keys(userPlants).length > 0 ? ( //checking if the plants array exists at all
            Object.keys(userPlants).map((plantName, index) => {
            const lastWatered = userPlants[plantName]?.lastWatered  //checking if the last watered data exisits, if it doesn't it just sets lastwattered to Never
                ? new Date(userPlants[plantName].lastWatered).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                : 'Never';

            return (
                <li key={index}>
                <span>{plantName}</span>
                <span>Last Watered: {lastWatered}</span>
                <button onClick={() => waterPlantsWithRain(plantName)}>Water Plant with Rain</button>
                <button onClick={() => waterPlantsWithHose(plantName)}>Water Plant with Hose</button>
                </li>
            );
            })
        ) : (
            <p>You don't have any plants</p>
        )}
    </ul>
    </div>
  );
};

export default HomePage;
