import React, { useEffect, useState } from "react";
import { database } from "./configuration"; // Import the database instance
import { ref, onValue } from "firebase/database";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignUp from './Signup';
import SignIn from './Signin';
import HomePage from './HomePage';



function App() {
  const [user, setUser] = useState(null);

  

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="./home" /> : <SignIn setUser={setUser} />} />
        <Route path="/signup" element={<SignUp setUser={setUser} />} />
        <Route path="/home" element={user ? <HomePage user={user} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
