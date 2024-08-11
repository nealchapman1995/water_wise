import React, { useState } from "react";
import { auth } from "./configuration"; // Import the database instance
//import { ref, onValue, set } from "firebase/database";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const SignUpForm = ({ setUser }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [name, setName] = useState("");

    const navigate = useNavigate();
    

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null);

        try{
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            updateProfile(auth.currentUser, {
                displayName: name
            }).then(() => {
                navigate("/home");
              }).catch((error) => {
                setError(error.message);
              });
            navigate("/home");
        } catch (error) {
            setError(error.message);
        }
    };

  return (
    <div>
        <h2>Sign Up Here!</h2>
        <form onSubmit={handleSignUp}>
            <div>
                <label>Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required></input>
            </div>
            <div>
                <label>Password:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required></input>
            </div>
            <div>
                <label>Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required></input>
            </div>
            <button type="submit">Sign Up</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SignUpForm;