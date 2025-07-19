import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import FoodHubFull from '../../public/Img/FoodHub-Full.png';
import './NavbarPage.scss';
import ProtectedCreateButton from '../components/ProtectedCreateButton';
import { Share2 } from "lucide-react";
import SideNavbar from '../components/SideNavbar';
import BottomNavbar from '../components/BottomNavbar';
import Webcam from "react-webcam";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from '@tensorflow/tfjs'; // ADD THIS
import '@tensorflow/tfjs-backend-webgl';
import axios from "axios";

const FOOD_CLASSES = [
    "broccoli", "carrot", "cucumber", "eggplant", "lettuce", "onion", "pepper", "potato", "tomato", "zucchini", "cabbage", "cauliflower", "garlic", "pumpkin", "radish", "spinach", "sweet potato",
    "chicken", "egg", "meat", "fish", "pork", "beef", "shrimp", "crab", "duck"
];

const getDetectedFoodItems = (objects) =>
    objects.filter(obj => FOOD_CLASSES.includes(obj.class.toLowerCase()));

const Navbar = () => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSideNavOpen, setIsSideNavOpen] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [detectedObjects, setDetectedObjects] = useState([]);
    const [suggestedRecipes, setSuggestedRecipes] = useState([]);
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastDetectionStatus, setLastDetectionStatus] = useState(""); // "success" | "none" | "error"
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    const closeProfileMenu = () => {
        setIsProfileMenuOpen(false);
    };

    const handleLogout = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Logout button clicked!');
        closeProfileMenu();
        logout();
    };

    const handleViewProfile = (e) => {
        e.stopPropagation();
        closeProfileMenu();
        navigate('/profile');
    };

    // Handle profile image click
    const handleProfileImageClick = (e) => {
        e.stopPropagation();
        navigate('/profile');
    };

    const DEFAULT_PROFILE_IMAGE = "https://i.ibb.co/WvG991xq/profile-default.png";

    const getProfileImageUrl = () => {
        if (!user) return DEFAULT_PROFILE_IMAGE;
        return user.profileImage || DEFAULT_PROFILE_IMAGE;
    };

    const openSideNav = () => setIsSideNavOpen(true);
    const closeSideNav = () => setIsSideNavOpen(false);

    // Camera button handler
    const handleCameraClick = () => {
        setIsCameraOpen(true);
    };

    const handleCloseCamera = () => {
        setIsCameraOpen(false);
    };

    // Draw boxes when detectedObjects change
    useEffect(() => {
        if (!isCameraOpen || detectedObjects.length === 0) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detectedObjects.forEach(obj => {
            const [x, y, width, height] = obj.bbox;
            ctx.strokeStyle = '#CF996C';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            ctx.fillStyle = '#CF996C';
            ctx.font = '16px Arial';
            ctx.fillText(`${obj.class} (${Math.round(obj.score * 100)}%)`, x, y > 20 ? y - 5 : y + 15);
        });
    }, [detectedObjects, isCameraOpen]);

    const handleDetectObjects = async () => {
        setIsDetecting(true);
        setLastDetectionStatus("");
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                setLastDetectionStatus("error");
                setIsDetecting(false);
                console.error("Webcam image not available.");
                return;
            }
            // Remove base64 header
            const base64 = imageSrc.replace(/^data:image\/\w+;base64,/, "");
            try {
                const baseURL = import.meta.env.MODE === "development"
                    ? "http://localhost:5000"
                    : "";
                const res = await axios.post(`${baseURL}/api/vision/detect`, { imageBase64: base64 });
                const objects = res.data.objects || [];
                setDetectedObjects(objects);

                if (objects.length > 0) {
                    setLastDetectionStatus("success");
                    console.log("Vision API detected objects:", objects.map(obj => obj.name));
                } else {
                    setLastDetectionStatus("none");
                    console.error("No cookable food detected.");
                }
            } catch (err) {
                setLastDetectionStatus("error");
                console.error("Vision API error:", err);
            }
            setIsDetecting(false);
        } else {
            setLastDetectionStatus("error");
            setIsDetecting(false);
            console.error("Webcam not available.");
        }
    };

    const handleFinishScan = async () => {
        // Get all detected object names (including non-food)
        const allDetectedNames = detectedObjects.map(obj => obj.class.toLowerCase());

        if (allDetectedNames.length === 0) {
            console.error("No objects detected. Please show a food item to the camera.");
            setSuggestedRecipes([{
                title: "AI Error",
                instructions: ["Walang na-detect na pagkain. Pakilapit ang gulay, karne, o itlog sa camera."]
            }]);
            return;
        }

        try {
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
            // Step 1: Ask Gemini to identify food items (vegetables, meat, egg, etc.)
            const res = await axios.post(`${baseURL}/api/gemini/identify-vegetables`, { detectedObjects: allDetectedNames });
            const foodItems = res.data.vegetables; // Gemini returns only food items

            if (!foodItems || foodItems.length === 0) {
                console.error("Gemini AI did not identify any food items.");
                setSuggestedRecipes([{
                    title: "AI Error",
                    instructions: ["Walang na-detect na pagkain mula sa AI. Subukan ulit o palitan ang ipapakita."]
                }]);
                return;
            }

            // Step 2: Ask Gemini for recipe suggestions using those food items
            const recipeRes = await axios.post(`${baseURL}/api/gemini/suggest-recipes`, { vegetables: foodItems });
            setSuggestedRecipes([{
                title: "AI Suggested Recipes",
                instructions: [recipeRes.data.suggestions]
            }]);
        } catch (err) {
            console.error("Failed to get suggestions from Gemini AI.", err);
            setSuggestedRecipes([{
                title: "AI Error",
                instructions: ["Failed to get suggestions."]
            }]);
        }
    };

    return (
        <>
            {/* Desktop Navbar */}
            <div className="navbar">
                <div className="nav-logo">
                    <Link to="/dashboard">
                        <img src={FoodHubFull} alt="FoodHub" className="logo-image" />
                    </Link>
                </div>
                
                <div className="nav-links">
                    <Link to="/dashboard" className="nav-link">
                        <i className="bx bx-home icon"></i>
                        <span className="text">Home</span>
                    </Link>
                    <Link to="/recipes" className="nav-link">
                        <i className="bx bx-book icon"></i>
                        <span className="text">Recipes</span>
                    </Link>
                    {/* Only show Shared Recipes if user is logged in */}
                    {user && (
                        <Link to="/shared-recipes" className="nav-link">
                            <span className="icon" style={{ display: "inline-flex", alignItems: "center" }}>
                                <Share2 size={20} style={{ verticalAlign: "middle" }} />
                            </span>
                            <span className="text">Shared Recipes</span>
                        </Link>
                    )}
                </div>

                <div className="profile-section">
                    {user ? (
                        <>
                            {/* Create Recipe button only visible on desktop */}
                            <div className="create-recipe desktop-only">
                                <Link to="/create-recipe" className="create-link">
                                    <i className="bx bx-plus icon"></i>
                                    <span className="text">Create Recipe</span>
                                </Link>
                            </div>
                            <div className="profile-container">
                                <div className="profile-image" onClick={handleProfileImageClick} style={{ cursor: 'pointer' }}>
                                    <img src={getProfileImageUrl()} alt="User Profile" />
                                </div>
                                <button className="dropdown-toggle" onClick={toggleProfileMenu}>
                                    <i className={`bx bx-chevron-down chevron ${isProfileMenuOpen ? 'rotated' : ''}`}></i>
                                </button>
                                {isProfileMenuOpen && (
                                    <div className="profile-dropdown">
                                        <button 
                                            className="dropdown-item" 
                                            onClick={handleViewProfile}
                                        >
                                            <i className="bx bxs-user-circle"></i>
                                            View Profile
                                        </button>
                                        <button 
                                            className="dropdown-item" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeProfileMenu();
                                                console.log('Settings clicked');
                                            }}
                                        >
                                            <i className="bx bxs-cog"></i>
                                            Settings
                                        </button>
                                        <hr className="dropdown-divider" />
                                        <button 
                                            className="logout-btn dropdown-item" 
                                            onClick={handleLogout}
                                            style={{
                                                pointerEvents: 'auto',
                                                cursor: 'pointer',
                                                zIndex: 9999
                                            }}
                                        >
                                            <i className="bx bx-log-out-circle"></i>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="create-recipe desktop-only">
                                <ProtectedCreateButton className="create-link">
                                    <i className="bx bx-plus icon"></i>
                                    <span className="text">Create Recipe</span>
                                </ProtectedCreateButton>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile SideNavbar Menu Button (top left) */}
            {!isSideNavOpen && (
                <button 
                    className="side-nav-toggle mobile-only"
                    onClick={openSideNav}
                    aria-label="Open menu"
                >
                    <i 
                        className="bx bx-menu icon"
                    ></i>
                </button>
            )}

            {/* Mobile Side Navbar */}
            <SideNavbar 
                open={isSideNavOpen}
                onClose={closeSideNav}
                user={user}
                getProfileImageUrl={getProfileImageUrl}
                handleProfileImageClick={handleProfileImageClick}
            />

            {/* Overlay for SideNavbar */}
            {isSideNavOpen && (
                <div 
                    className="overlay-mobile" 
                    onClick={closeSideNav}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.2)",
                        zIndex: 1999
                    }}
                />
            )}

            {/* Camera Modal */}
            {isCameraOpen && (
                <div className="camera-modal-overlay" style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(0,0,0,0.7)",
                    zIndex: 3000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div className="camera-modal" style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "24px",
                        position: "relative",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                    }}>
                        <div style={{ position: "relative", width: "100%" }}>
                            <Webcam
                                audio={false}
                                screenshotFormat="image/jpeg"
                                style={{ width: "100%", borderRadius: "12px" }}
                                ref={webcamRef}
                                width={400}
                                height={300}
                            />
                            <canvas
                                ref={canvasRef}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    pointerEvents: "none"
                                }}
                            />
                        </div>
                        <button
                            onClick={handleCloseCamera}
                            style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                background: "#CF996C",
                                color: "#fff",
                                border: "none",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                fontSize: "18px",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                            }}
                            aria-label="Close Camera"
                        >
                            &times;
                        </button>
                        <button
                            onClick={handleDetectObjects}
                            style={{
                                marginTop: "16px",
                                background: "#BB8860",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "10px 18px",
                                fontSize: "16px",
                                cursor: "pointer"
                            }}
                            disabled={isDetecting}
                        >
                            {isDetecting ? "Detecting..." : "Detect"}
                        </button>
                        {/* Detection status feedback */}
                        <div style={{ marginTop: "8px", minHeight: "24px" }}>
                            {lastDetectionStatus === "success" && (
                                <span style={{ color: "#4CAF50" }}>Detection successful!</span>
                            )}
                            {lastDetectionStatus === "none" && (
                                <span style={{ color: "#CF996C" }}>No food items detected. Try again.</span>
                            )}
                            {lastDetectionStatus === "error" && (
                                <span style={{ color: "#f44336" }}>Detection error. Please retry.</span>
                            )}
                        </div>
                        <button
                            onClick={handleFinishScan}
                            style={{
                                marginTop: "10px",
                                background: "#4CAF50",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "10px 18px",
                                fontSize: "16px",
                                cursor: "pointer"
                            }}
                        >
                            Finish
                        </button>
                        {suggestedRecipes.length > 0 && (
                            <div style={{ marginTop: "18px" }}>
                                <b>AI Suggested Recipes:</b>
                                {suggestedRecipes.map((recipe, idx) => (
                                    <div key={idx} className="full-recipe-steps-section" style={{ background: "#f7e6d1", borderRadius: "18px", padding: "2rem", marginBottom: "2rem" }}>
                                        <h2 style={{ color: "#c97a2b", fontSize: "2rem", fontWeight: "800", marginBottom: "1.2rem" }}>
                                            {recipe.title || `Recipe ${idx + 1}`}
                                        </h2>
                                        <div>
                                            {(recipe.instructions[0] || "").split('\n').map((step, sidx) => (
                                                <div key={sidx} className="full-recipe-step" style={{ marginBottom: "1.2rem" }}>
                                                    <span className="step-num" style={{
                                                        background: "linear-gradient(135deg, #e26a00 60%, #e7b57a 100%)",
                                                        color: "#fff",
                                                        fontSize: "1.2rem",
                                                        fontWeight: "700",
                                                        borderRadius: "50%",
                                                        width: "2rem",
                                                        height: "2rem",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        marginRight: "1rem"
                                                    }}>{sidx + 1}</span>
                                                    <b style={{ color: "#c97a2b" }}>{step}</b>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Navbar for mobile - only camera button */}
            <BottomNavbar onCameraClick={handleCameraClick} />
        </>
    );
};

export default Navbar;