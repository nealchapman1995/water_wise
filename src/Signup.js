import React, { useState } from "react";
import { auth } from "./configuration"; // Import the database instance
import { ref, set } from "firebase/database";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { database } from "./configuration";

const SignUpForm = ({ setUser }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [name, setName] = useState("");
    const [city, setCity] = useState("");

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
                const userID = userCredential.user.uid;
                set(ref(database, 'users/' + userID), {
                    city: city,
                });

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
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Sign Up Here!</h2>
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSignUp} className="space-y-6">
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"></input>
                </div>
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"></input>
                </div>
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Display Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sku-600 sm:text-sm sm:leading-6"></input>
                </div>
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Home City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sku-600 sm:text-sm sm:leading-6"></input>
                </div>
                <button type="submit" className="flex w-full justify-center rounded-md bg-sky-400 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">Sign Up</button>
            </form>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SignUpForm;