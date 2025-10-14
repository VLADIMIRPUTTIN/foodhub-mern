import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './PreferencesSetupPage.scss';

const PreferencesSetupPage = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [preferences, setPreferences] = useState({
        dietaryPreferences: [],
        allergies: [],
        preferredCuisines: []
    });
    
    const [isLoading, setIsLoading] = useState(false);

    const dietaryOptions = [
        { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
        { value: 'vegan', label: 'Vegan', icon: '🌱' },
        { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
        { value: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
        { value: 'keto', label: 'Keto', icon: '🥑' },
        { value: 'paleo', label: 'Paleo', icon: '🥩' },
        { value: 'halal', label: 'Halal', icon: '🕌' },
        { value: 'kosher', label: 'Kosher', icon: '✡️' }
    ];

    const allergyOptions = [
        'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 
        'Fish', 'Shellfish', 'Sesame', 'Corn'
    ];

    const cuisineOptions = [
        { value: 'Filipino', label: 'Filipino', icon: '🇵🇭' },
        { value: 'Italian', label: 'Italian', icon: '🇮🇹' },
        { value: 'Chinese', label: 'Chinese', icon: '🇨🇳' },
        { value: 'Japanese', label: 'Japanese', icon: '🇯🇵' },
        { value: 'Korean', label: 'Korean', icon: '🇰🇷' },
        { value: 'Mexican', label: 'Mexican', icon: '🇲🇽' },
        { value: 'Indian', label: 'Indian', icon: '🇮🇳' },
        { value: 'Thai', label: 'Thai', icon: '🇹🇭' }
    ];

    const handleMultiSelect = (category, value) => {
        setPreferences(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(item => item !== value)
                : [...prev[category], value]
        }));
    };

    const nextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";

            const response = await fetch(`${baseURL}/api/users/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...preferences,
                    hasCompletedOnboarding: true
                })
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                navigate('/recipes');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const skipSetup = () => {
        // Set hasCompletedOnboarding to true even if skipping
        handleSubmit();
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-content">
                        <h2>What's your dietary preference?</h2>
                        <p>This helps us recommend recipes that match your lifestyle</p>
                        <div className="options-grid">
                            {dietaryOptions.map(option => (
                                <motion.div
                                    key={option.value}
                                    className={`option-card ${preferences.dietaryPreferences.includes(option.value) ? 'selected' : ''}`}
                                    onClick={() => handleMultiSelect('dietaryPreferences', option.value)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="option-icon">{option.icon}</div>
                                    <div className="option-label">{option.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-content">
                        <h2>Any food allergies?</h2>
                        <p>Select all that apply so we can keep you safe</p>
                        <div className="options-grid">
                            <motion.div
                                className={`option-card ${preferences.allergies.length === 0 ? 'selected' : ''}`}
                                onClick={() => setPreferences(prev => ({ ...prev, allergies: [] }))}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="option-icon">✅</div>
                                <div className="option-label">No Allergies</div>
                            </motion.div>
                            {allergyOptions.map(allergy => (
                                <motion.div
                                    key={allergy}
                                    className={`option-card ${preferences.allergies.includes(allergy) ? 'selected' : ''}`}
                                    onClick={() => handleMultiSelect('allergies', allergy)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="option-icon">🚫</div>
                                    <div className="option-label">{allergy}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="step-content">
                        <h2>What cuisines do you enjoy?</h2>
                        <p>Select your favorite cuisines to get personalized recommendations</p>
                        <div className="options-grid">
                            {cuisineOptions.map(cuisine => (
                                <motion.div
                                    key={cuisine.value}
                                    className={`option-card ${preferences.preferredCuisines.includes(cuisine.value) ? 'selected' : ''}`}
                                    onClick={() => handleMultiSelect('preferredCuisines', cuisine.value)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="option-icon">{cuisine.icon}</div>
                                    <div className="option-label">{cuisine.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="preferences-setup">
            <div className="preferences-container">
                <div className="preferences-header">
                    <h1>Let's personalize your FoodHub experience!</h1>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${(currentStep / 3) * 100}%` }}
                        ></div>
                    </div>
                    <span className="step-counter">Step {currentStep} of 3</span>
                </div>

                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderStep()}
                </motion.div>

                <div className="preferences-footer">
                    <div className="button-group">
                        {currentStep > 1 && (
                            <button 
                                className="btn-secondary" 
                                onClick={prevStep}
                                disabled={isLoading}
                            >
                                Back
                            </button>
                        )}
                        
                        <button 
                            className="btn-skip" 
                            onClick={skipSetup}
                            disabled={isLoading}
                        >
                            Skip for now
                        </button>
                        
                        {currentStep < 3 ? (
                            <button 
                                className="btn-primary" 
                                onClick={nextStep}
                                disabled={isLoading}
                            >
                                Next
                            </button>
                        ) : (
                            <button 
                                className="btn-primary" 
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Complete Setup'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreferencesSetupPage;