import React, { useState } from 'react';
import { ref, get, update } from "firebase/database";
import { database } from "./configuration"; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';

function PlantSearch({ user }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        e.preventDefault();

        // Fetch all plants
        const plantRef = ref(database, 'plants/data');
        const snapshot = await get(plantRef);
        const searchResults = [];

        snapshot.forEach((childSnapshot) => {
            const plant = childSnapshot.val();
            // Filter plants by checking if the common_name includes the searchTerm case-insensitive
            if (plant.common_name.toLowerCase().includes(searchTerm.toLowerCase())) {
                searchResults.push(plant);
            }
        });

        setResults(searchResults);
    };

    const addToUserGarden = async (plantName) => {
        if (!user) {
            console.error('User ID is not defined');
            return;
        }
        const userPlantsRef = ref(database, `users/${user.uid}/plants`);
        await update(userPlantsRef, {
            [plantName] : true
        });
    };

    return (
        <div>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for plants"
                    className="border p-2 rounded-md"
                />
                <button type="submit" className="ml-2 bg-blue-500 text-white p-2 rounded-md">
                    Search
                </button>
            </form>
            <div className='border-solid border-orange-950'>
            <ul class="divide-y divide-gray-100 w-2/4 m-auto">
                {results.map((result, index) => (
                        <li class={`flex justify-between gap-x-6 py-2 rounded-xl my-px ${index % 2 === 0 ? 'bg-sky-50' : 'bg-white'}`}>
                            <div class="flex min-w-0 gap-x-4">
                                <div class="min-w-0 flex-auto">
                                    <p class="text-sm px-1 font-semibold leading-6 text-gray-900">{result.default_image && result.default_image.thumbnail ? (
                                                                                                        <img className='h-12 rounded-full inline' src={`${result.default_image.thumbnail}`} alt="Plant thumbnail" />
                                                                                                    ) : (
                                                                                                        <FontAwesomeIcon className='h-10 ' icon={faLeaf} alt="Plant icon" /> //if there is no image, show an icon
                                                                                                    )} {result.common_name}</p>
                                </div>
                            </div>
                            <div class="hidden sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                <p class="text-sm leading-6 text-gray-900">{result.watering}</p>
                                <button onClick={() => addToUserGarden(result.common_name)} class="text-xs leading-5 text-gray-500">Add to Garden</button>
                            </div>
                        </li>
                ))}
            </ul>
            </div>
        </div>
    );
}

export default PlantSearch;
