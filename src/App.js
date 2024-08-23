import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./configuration";
import { onAuthStateChanged } from "firebase/auth";
import SignUp from './Signup';
import SignIn from './Signin';
import HomePage from './HomePage';
import NavBar from "./nav";
import PlantSearch from "./plantSearch";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    }, (error) => {
      console.error("Auth state error:", error);
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      {user && <NavBar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home" /> : <SignIn setUser={setUser} />} />
        <Route path="/signup" element={<SignUp setUser={setUser} />} />
        <Route path="/home" element={user ? <HomePage user={user} /> : <Navigate to="/" />} />
        <Route path='/plantsearch' element={<PlantSearch user={user} />} />
      </Routes>
    </Router>
  );
};

export default App;

