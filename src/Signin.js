import React, { useState } from "react";
import { auth } from "./configuration"; // Import the database instance
// import { ref, onValue, set } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";

const SignInForm = ({ setUser }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError(null);

        try{
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
        } catch (error) {
            setError(error.message);
        }
    };

  return (
    <div>
        <h2>Sign In Here!</h2>
        <form onSubmit={handleSignIn}>
            <div>
                <label>Email:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required></input>
            </div>
            <div>
                <label>Password:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required></input>
            </div>
            <button type="submit">Sign In</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SignInForm;