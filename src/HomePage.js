import React, { useEffect, useState } from 'react';
import { ref, get } from "firebase/database";
import { database } from "./configuration"; // Your Firebase database configuration

const HomePage = ({ user }) => {
    const [data, setData] = useState(null);
    const [selectedCity, setSelectedCity] = useState('');
    const [inputCity, setInputCity] = useState('');
    const [error, setError] = useState('');
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
                    setUserPlants(Object.keys(userPlants));
                    setSelectedCity(userCity); // Corrected function call
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
            console.log("Data fetched:", data); // Debug log
            setData(data);
            setError(''); // Clear any previous errors
          })
          .catch(error => {
            console.error('Error fetching data:', error);
            setError('City not found. Please check the spelling and try again.');
          });
      };

    const handleInputChange = (e) => {
        setInputCity(e.target.value);
    };

    const handleChangeCity = () => {
        setSelectedCity(inputCity);
        //setSelectedDay(null);
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

  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <h1>What's the Forecast Looking Like?</h1>
      <div className='citySelector'>
        <label htmlFor='cityInput'>Pick a City! </label>
        <input 
          type='text' 
          id='cityInput' 
          value={inputCity} 
          onChange={handleInputChange} 
          placeholder='Enter city name' 
        />
        <button onClick={handleChangeCity}>Change City</button>
      </div>
      {error && <p className='error'>{error}</p>} {/* Display error message if there is an error */}
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
        {userPlants.length > 0 ? (userPlants.map((plantName, index) => (
            <li key={index}>{plantName}</li>
        ))
    ) : (
        <p>You don't have any plants</p>
    )}
      </ul>
    </div>
  );
};

export default HomePage;
