import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import SignUp from './Signup';

// Import initialized Firebase app and services
import { app, database } from './configuration.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
        <SignUp />
    </BrowserRouter>
  </React.StrictMode>
);

// Measure performance
reportWebVitals();


