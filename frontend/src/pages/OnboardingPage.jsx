import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './OnboardingPage.scss';

const OnboardingPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedDietary, setSelectedDietary] = useState([]);
    const [selectedAllergies, setSelectedAllergies] = useState([]);
    const [selectedCuisines, setSelectedCuisines] = useState([]);
    const [preferredDifficulty, setPreferredDifficulty] = useState('Any');
    const [preferredCookingTime, setPreferredCookingTime] = useState('Any');
    const [preferredBudgetLevel, setPreferredBudgetLevel] = useState('Any');
    const [isLoading, setIsLoading] = useState(false);
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();

    const dietaryOptions = [
        { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
        { id: 'vegan', label: 'Vegan', icon: '🌱' },
        { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
        { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
        { id: 'keto', label: 'Keto', icon: '🥑' },
        { id: 'paleo', label: 'Paleo', icon: '🥩' },
        { id: 'halal', label: 'Halal', icon: '🕌' },
        { id: 'kosher', label: 'Kosher', icon: '✡️' },
        { id: 'low-carb', label: 'Low Carb', icon: '📉' },
        { id: 'high-protein', label: 'High Protein', icon: '💪' }
    ];

    const commonAllergies = [
        'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 
        'Fish', 'Shellfish', 'Sesame', 'Corn', 'Tomatoes', 'Chocolate'
    ];

    const cuisineOptions = [
        { id: 'Filipino', label: 'Filipino', icon: '🇵🇭' },
        { id: 'Italian', label: 'Italian', icon: '🇮🇹' },
        { id: 'Chinese', label: 'Chinese', icon: '🇨🇳' },
        { id: 'Japanese', label: 'Japanese', icon: '🇯🇵' },
        { id: 'Korean', label: 'Korean', icon: '🇰🇷' },
        { id: 'Mexican', label: 'Mexican', icon: '🇲🇽' },
        { id: 'Indian', label: 'Indian', icon: '🇮🇳' },
        { id: 'Thai', label: 'Thai', icon: '🇹🇭' },
        { id: 'American', label: 'American', icon: '🇺🇸' },
        { id: 'French', label: 'French', icon: '🇫🇷' },
        { id: 'Mediterranean', label: 'Mediterranean', icon: '🌊' }
    ];

    const difficultyOptions = [
        { id: 'Any', label: 'Any', icon: '✨' },
        { id: 'Easy', label: 'Easy', icon: '🟢' },
        { id: 'Medium', label: 'Medium', icon: '🟡' },
        { id: 'Hard', label: 'Hard', icon: '🔴' }
    ];

    const cookingTimeOptions = [
        { id: 'Any', label: 'Any', icon: '⏱️' },
        { id: 'Quick', label: '< 30 mins', icon: '⚡' },
        { id: 'Balanced', label: '30-60 mins', icon: '🍳' },
        { id: 'Leisure', label: '> 60 mins', icon: '🫕' }
    ];

    const budgetOptions = [
        { id: 'Any', label: 'Any', icon: '💸' },
        { id: 'Budget', label: 'Budget', icon: '🪙' },
        { id: 'Moderate', label: 'Moderate', icon: '💵' },
        { id: 'Premium', label: 'Premium', icon: '💎' }
    ];

    const toggleSelection = (item, selectedItems, setSelectedItems) => {
        if (selectedItems.includes(item)) {
            setSelectedItems(selectedItems.filter(i => i !== item));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";

            const response = await axios.put(
                `${baseURL}/api/users/preferences`,
                {
                    dietaryPreferences: selectedDietary,
                    allergies: selectedAllergies,
                    preferredCuisines: selectedCuisines,
                    preferredDifficulty,
                    preferredCookingTime,
                    preferredBudgetLevel,
                    hasCompletedOnboarding: true
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setUser(response.data.user);
                toast.success('Preferences saved successfully! 🎉');
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                    ></div>
                </div>

                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="step-content"
                >
                    {currentStep === 1 && (
                        <div className="step">
                            <h2>Welcome to FoodHub! 🍳</h2>
                            <p>Let's personalize your experience. What are your food interests and dietary preferences?</p>
                            
                            <div className="options-grid">
                                {dietaryOptions.map(option => (
                                    <button
                                        key={option.id}
                                        className={`option-card ${selectedDietary.includes(option.id) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(option.id, selectedDietary, setSelectedDietary)}
                                    >
                                        <span className="option-icon">{option.icon}</span>
                                        <span className="option-label">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="step">
                            <h2>Any Food Allergies? 🚫</h2>
                            <p>Help us keep you safe by telling us what to avoid.</p>
                            
                            <div className="allergies-grid">
                                {commonAllergies.map(allergy => (
                                    <button
                                        key={allergy}
                                        className={`allergy-tag ${selectedAllergies.includes(allergy) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(allergy, selectedAllergies, setSelectedAllergies)}
                                    >
                                        {allergy}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="step">
                            <h2>Favorite Food Cuisines? 🌍</h2>
                            <p>Tell us the cuisines you are most interested in so we can tailor your feed.</p>
                            
                            <div className="cuisines-grid">
                                {cuisineOptions.map(cuisine => (
                                    <button
                                        key={cuisine.id}
                                        className={`cuisine-card ${selectedCuisines.includes(cuisine.id) ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(cuisine.id, selectedCuisines, setSelectedCuisines)}
                                    >
                                        <span className="cuisine-icon">{cuisine.icon}</span>
                                        <span className="cuisine-label">{cuisine.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="step">
                            <h2>More About Your Cooking Style 👨‍🍳</h2>
                            <p>Add more info so recommendations can match your preferred difficulty, time, and budget.</p>

                            <div className="preference-group">
                                <h3>Preferred Difficulty</h3>
                                <div className="extra-pref-grid">
                                    {difficultyOptions.map(option => (
                                        <button
                                            key={option.id}
                                            className={`extra-pref-card ${preferredDifficulty === option.id ? 'selected' : ''}`}
                                            onClick={() => setPreferredDifficulty(option.id)}
                                        >
                                            <span className="extra-pref-icon">{option.icon}</span>
                                            <span className="extra-pref-label">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="preference-group">
                                <h3>Preferred Cooking Time</h3>
                                <div className="extra-pref-grid">
                                    {cookingTimeOptions.map(option => (
                                        <button
                                            key={option.id}
                                            className={`extra-pref-card ${preferredCookingTime === option.id ? 'selected' : ''}`}
                                            onClick={() => setPreferredCookingTime(option.id)}
                                        >
                                            <span className="extra-pref-icon">{option.icon}</span>
                                            <span className="extra-pref-label">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="preference-group">
                                <h3>Preferred Budget</h3>
                                <div className="extra-pref-grid">
                                    {budgetOptions.map(option => (
                                        <button
                                            key={option.id}
                                            className={`extra-pref-card ${preferredBudgetLevel === option.id ? 'selected' : ''}`}
                                            onClick={() => setPreferredBudgetLevel(option.id)}
                                        >
                                            <span className="extra-pref-icon">{option.icon}</span>
                                            <span className="extra-pref-label">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                <div className="step-actions">
                    <button 
                        className="skip-btn" 
                        onClick={handleSkip}
                        disabled={isLoading}
                    >
                        Skip
                    </button>
                    
                    <button 
                        className="next-btn" 
                        onClick={handleNext}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="btn-spinner"></span>
                                Saving...
                            </>
                        ) : (
                            currentStep === 4 ? 'Complete Setup' : 'Next Step'
                        )}
                    </button>
                </div>
            </div>
            <Toaster position="top-center" />
        </div>
    );
};

export default OnboardingPage;