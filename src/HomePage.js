import React, { useEffect, useState } from 'react';

const HomePage = ({ user }) => {
    const [data, setData] = useState(null);
    const [selectedCity, setSelectedCity] = useState('Denver');
    const [inputCity, setInputCity] = useState('Denver');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchWeatherData(selectedCity);
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
    
      const plants = [
        {Name: 'Rocky Mountain Maple', rain: 60 }, 
        {Name: 'Ponderosa Pine', rain: 20}, 
        {Name: 'Blue Grama', rain: 20}, 
        {Name: 'Western Wild Rose', rain: 40}
      ]

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
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
              <div className='tempContainer'>
                <div>
                  <h5 className='tempBox'>Highest temp!</h5>
                  <p>{item.temp_max}°F</p>
                </div>
                <div>
                  <h5 className='tempBox'>Lowest temp!</h5>
                  <p>{item.temp_min}°F</p>
                </div>
              </div>
              <p>Rain Probability: {item.averagePop}%</p>
              <table>
              <thead>
                <tr>
                <th className='Plants'>Plant Name</th>
                <th>Should you Water it?</th>
                </tr>
              </thead>
              <tbody>
                {plants.map((plant, plantindex) => (
                  <tr>
                    <td  className='Plants'>{plant.Name}</td>
                    <td>{item.averagePop >= plant.rain ? 'No' : 'Yes'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
