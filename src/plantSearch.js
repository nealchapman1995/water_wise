import React, { useState } from 'react';
import { ref, get, update } from "firebase/database";
import { database } from "./configuration"; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';
import { Search, Plus, Leaf, Droplets, Sun, CheckCircle2, AlertCircle } from 'lucide-react';

function PlantSearch({ user }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [addedPlants, setAddedPlants] = useState(new Set());
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchTerm.trim()) {
            console.log('Search term is empty');
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            // Fetch all plants
            const plantRef = ref(database, 'plants/data');
            const snapshot = await get(plantRef);
            
            if (!snapshot.exists()) {
                setResults([]);
                setHasSearched(true);
                setIsSearching(false);
                return;
            }

            const searchResults = [];

            snapshot.forEach((childSnapshot) => {
                const plant = childSnapshot.val();
                
                // Check if common_name exists and filter plants
                if (plant.common_name && plant.common_name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    searchResults.push(plant);
                }
            });
            
            setResults(searchResults);
            setHasSearched(true);

        } catch (error) {
            console.error('Error searching plants:', error);
            setError('Failed to search plants. Please try again.');
            setResults([]);
            setHasSearched(true);
        } finally {
            setIsSearching(false);
        }
    };

    const addToUserGarden = async (plantName) => {
        if (!user) {
            console.error('User ID is not defined');
            return;
        }
        
        try {
            const userPlantsRef = ref(database, `users/${user.uid}/plants`);
            await update(userPlantsRef, {
                [plantName] : true
            });
            
            // Update local state to show plant as added
            setAddedPlants(prev => new Set([...prev, plantName]));
        } catch (error) {
            console.error('Error adding plant to garden:', error);
        }
    };

    const getCareLevel = (level) => {
        const levels = {
            beginner: { color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
            intermediate: { color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle },
            advanced: { color: 'text-red-600 bg-red-50', icon: AlertCircle }
        };
        return levels[level] || levels.beginner;
    };

    const getWateringInfo = (watering) => {
        const info = {
            frequent: { color: 'text-blue-600 bg-blue-50', text: 'Frequent watering' },
            average: { color: 'text-green-600 bg-green-50', text: 'Average watering' },
            minimum: { color: 'text-amber-600 bg-amber-50', text: 'Minimal watering' }
        };
        return info[watering] || info.average;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Search Section */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Find Your Perfect Plant</h2>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Search through our extensive database of plants to find the perfect addition to your garden
                        </p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                                placeholder="Search by plant name (e.g., Snake Plant, Monstera)..."
                                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                            />
                        </div>
                        <div className="flex justify-center mt-6">
                            <button 
                                onClick={handleSearch}
                                disabled={isSearching || !searchTerm.trim()}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                                {isSearching ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Searching...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        <span>Search Plants</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="max-w-2xl mx-auto mt-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {hasSearched && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <Leaf className="w-5 h-5 mr-2" />
                                Search Results ({results.length} plants found)
                            </h3>
                        </div>

                        <div className="p-6">
                            {results.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No plants found</h3>
                                    <p className="text-gray-600">
                                        Try searching with different keywords or check your spelling.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {results.map((plant, index) => {
                                        const careLevel = getCareLevel(plant.care_level);
                                        const wateringInfo = getWateringInfo(plant.watering);
                                        const isAdded = addedPlants.has(plant.common_name);
                                        const CareIcon = careLevel.icon;

                                        return (
                                            <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all duration-200 border border-gray-100">
                                                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                                                    {/* Plant Image */}
                                                    <div className="flex-shrink-0">
                                                        {plant.default_image?.thumbnail ? (
                                                            <img 
                                                                src={plant.default_image.thumbnail} 
                                                                alt={plant.common_name}
                                                                className="w-20 h-20 object-cover rounded-xl shadow-sm"
                                                            />
                                                        ) : (
                                                            <div className="w-20 h-20 bg-green-100 rounded-xl flex items-center justify-center">
                                                                <Leaf className="w-10 h-10 text-green-600" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Plant Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="text-xl font-bold text-gray-900 mb-1">{plant.common_name}</h4>
                                                                <p className="text-sm text-gray-600 mb-2 italic">{plant.scientific_name}</p>
                                                                <p className="text-gray-700 mb-4">{plant.description}</p>
                                                                
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${wateringInfo.color}`}>
                                                                        <Droplets className="w-3 h-3 mr-1" />
                                                                        {wateringInfo.text}
                                                                    </span>
                                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${careLevel.color}`}>
                                                                        <CareIcon className="w-3 h-3 mr-1" />
                                                                        {plant.care_level} level
                                                                    </span>
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-50">
                                                                        <Sun className="w-3 h-3 mr-1" />
                                                                        {plant.sunlight}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Add Button */}
                                                            <div className="mt-4 lg:mt-0 lg:ml-6">
                                                                <button 
                                                                    onClick={() => addToUserGarden(plant.common_name)}
                                                                    disabled={isAdded}
                                                                    className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 min-w-[140px] ${
                                                                        isAdded 
                                                                            ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                                                                            : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
                                                                    }`}
                                                                >
                                                                    {isAdded ? (
                                                                        <>
                                                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                            Added!
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Plus className="w-4 h-4 mr-2" />
                                                                            Add to Garden
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tips Section */}
                {!hasSearched && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Popular Plant Categories</h3>
                            <p className="text-gray-600">Try searching for these popular plant types</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['Snake Plant', 'Monstera', 'Pothos', 'Peace Lily'].map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSearchTerm(suggestion);
                                        const event = { preventDefault: () => {} };
                                        handleSearch(event);
                                    }}
                                    className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 text-center transition-colors"
                                >
                                    <Leaf className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p className="font-medium text-gray-900">{suggestion}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PlantSearch;