import React, { useState } from 'react';
import { ref, get } from "firebase/database";
import { database } from "./configuration"; // Adjust the path as needed
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';

function PlantSearch() {
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
            // Filter plants by checking if the common_name includes the searchTerm (case-insensitive)
            if (plant.common_name.toLowerCase().includes(searchTerm.toLowerCase())) {
                searchResults.push(plant);
            }
        });

        setResults(searchResults);
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
            <ul class="divide-y divide-gray-100 w-2/4 m-auto">
                {results.map((result, index) => (
                        <li class="flex justify-between gap-x-6 py-2">
                            <div class="flex min-w-0 gap-x-4">
                                <div class="min-w-0 flex-auto">
                                    <p class="text-sm font-semibold leading-6 text-gray-900"><FontAwesomeIcon icon={faLeaf} />  {result.common_name}</p>
                                </div>
                            </div>
                            <div class="hidden sm:flex sm:flex-row sm:items-center sm:space-x-2">
                                <p class="text-sm leading-6 text-gray-900">{result.watering}</p>
                                <button class="text-xs leading-5 text-gray-500">Add to Garden</button>
                            </div>
                        </li>
                ))}
            </ul>
        </div>
    );
}

export default PlantSearch;
