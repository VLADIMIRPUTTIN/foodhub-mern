import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import './AdminDashboard.scss';
import CreateRecipe from './CreateRecipe';
import CreateIngredient from './CreateIngredient';
import axios from "axios";
import Swal from 'sweetalert2';
import ManageUsersPage from './ManageUsersPage';
import ManageRecipeAndIngredientsPage from './ManageRecipeAndIngredientsPage';

const AdminDashboard = () => {
    const { user, isAdmin, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRecipes: 0,
        pendingReviews: 0,
        todayLogins: 0
    });

    // Search states for manage recipes/ingredients
    const [recipeSearch, setRecipeSearch] = useState('');
    const [ingredientSearch, setIngredientSearch] = useState('');

    // Fetch functions
    const fetchRecipes = async () => {
        try {
            // Use the new admin endpoint to get ALL recipes
            const res = await axios.get('http://localhost:5000/api/recipes/admin/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setRecipes(res.data.recipes);
            updateStats(users, res.data.recipes); // update stats after fetching recipes
        } catch {
            setRecipes([]);
            updateStats(users, []);
        }
    };
    const fetchIngredients = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/ingredients');
            setIngredients(res.data.ingredients);
        } catch {
            setIngredients([]);
        }
    };
    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setUsers(res.data.users);
            updateStats(res.data.users, recipes); // update stats after fetching users
        } catch {
            setUsers([]);
            updateStats([], recipes);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await fetchUsers();
            await fetchRecipes();
            await fetchIngredients();
            updateStats();
        };
        
        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
    };

    const handleUserAction = async (userId, action) => {
        try {
            if (action === 'active') {
                await axios.patch(`http://localhost:5000/api/users/${userId}/activate`);
            } else if (action === 'banned') {
                await axios.patch(`http://localhost:5000/api/users/${userId}/ban`, { reason: "Banned by admin" });
            } else if (action === 'suspended') {
                // For suspend, call from ManageUsersPage with minutes
                // See below
            }
            await fetchUsers();
        } catch (err) {
            Swal.fire('Error', 'Failed to update user status.', 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await axios.delete(`http://localhost:5000/api/users/${userId}`);
            await fetchUsers();
            updateStats();
        } catch {
            Swal.fire('Error', 'Failed to delete user.', 'error');
        }
    };

    // Delete handlers (implement backend delete endpoints for production)
    const handleDeleteRecipe = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This recipe will be deleted permanently!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, delete it!'
        });
        
        if (result.isConfirmed) {
            try {
                // Add loading state
                Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the recipe.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await axios.delete(`http://localhost:5000/api/recipes/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    const updatedRecipes = recipes.filter(r => r._id !== id);
                    setRecipes(updatedRecipes);
                    updateStats(users, updatedRecipes);
                    Swal.fire('Deleted!', 'Recipe has been deleted successfully.', 'success');
                }
            } catch (error) {
                console.error('Delete recipe error:', error);
                
                let errorMessage = 'Failed to delete recipe.';
                
                if (error.response) {
                    // Server responded with error status
                    switch (error.response.status) {
                        case 400:
                            errorMessage = 'Invalid recipe ID.';
                            break;
                        case 401:
                            errorMessage = 'You are not authorized to delete this recipe.';
                            break;
                        case 403:
                            errorMessage = 'You do not have permission to delete recipes.';
                            break;
                        case 404:
                            errorMessage = 'Recipe not found.';
                            break;
                        case 500:
                            errorMessage = 'Server error. Please try again later.';
                            break;
                        default:
                            errorMessage = error.response.data?.message || 'An unexpected error occurred.';
                    }
                } else if (error.request) {
                    // Network error
                    errorMessage = 'Network error. Please check your connection.';
                }
                
                Swal.fire('Error', errorMessage, 'error');
            }
        }
    };

    const handleDeleteIngredient = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This ingredient will be deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, delete it!'
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:5000/api/ingredients/${id}`);
                setIngredients(ingredients.filter(i => i._id !== id));
                Swal.fire('Deleted!', 'Ingredient has been deleted.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to delete ingredient.', 'error');
            }
        }
    };

    const handleEditRecipe = async (recipe) => {
        const { value: newTitle } = await Swal.fire({
            title: 'Edit Recipe Title',
            input: 'text',
            inputLabel: 'Recipe Title',
            inputValue: recipe.title || recipe.name,
            showCancelButton: true,
            confirmButtonText: 'Save',
            inputValidator: (value) => {
                if (!value) return 'Title cannot be empty!';
            }
        });
        if (newTitle && newTitle !== (recipe.title || recipe.name)) {
            try {
                await axios.patch(`http://localhost:5000/api/recipes/${recipe._id}`, { title: newTitle });
                setRecipes(recipes.map(r => r._id === recipe._id ? { ...r, title: newTitle } : r));
                Swal.fire('Saved!', 'Recipe title updated.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to update recipe.', 'error');
            }
        }
    };

    const handleEditIngredient = async (ingredient) => {
        const { value: newName } = await Swal.fire({
            title: 'Edit Ingredient Name',
            input: 'text',
            inputLabel: 'Ingredient Name',
            inputValue: ingredient.name,
            showCancelButton: true,
            confirmButtonText: 'Save',
            inputValidator: (value) => {
                if (!value) return 'Name cannot be empty!';
            }
        });
        if (newName && newName !== ingredient.name) {
            try {
                await axios.patch(`http://localhost:5000/api/ingredients/${ingredient._id}`, { name: newName });
                setIngredients(ingredients.map(i => i._id === ingredient._id ? { ...i, name: newName } : i));
                Swal.fire('Saved!', 'Ingredient name updated.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to update ingredient.', 'error');
            }
        }
    };

    // Filtered lists
    const filteredRecipes = recipes.filter(r =>
        (r.title || r.name)?.toLowerCase().includes(recipeSearch.toLowerCase())
    );
    const filteredIngredients = ingredients.filter(i =>
        i.name?.toLowerCase().includes(ingredientSearch.toLowerCase())
    );

    const updateStats = (usersList = users, recipesList = recipes) => {
        setStats({
            totalUsers: usersList.length,
            totalRecipes: recipesList.length,
            pendingReviews: 5, // Replace with real logic if you have review status
            todayLogins: usersList.filter(u => {
                if (!u.lastLogin) return false;
                const today = new Date();
                const loginDate = new Date(u.lastLogin);
                return (
                    loginDate.getDate() === today.getDate() &&
                    loginDate.getMonth() === today.getMonth() &&
                    loginDate.getFullYear() === today.getFullYear()
                );
            }).length
        });
    };

    if (!isAdmin()) {
        return (
            <div className="admin-dashboard">
                <div className="access-denied">
                    <h2>Access Denied</h2>
                    <p>You don't have administrator privileges.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div className="header-content">
                    <div className="header-info">
                        <h1>🍳 FoodHub Admin Panel</h1>
                        <p>Welcome back, {user?.name}!</p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </div>

            <div className="admin-container">
                {/* Stats Cards */}
                <div className="stats-grid">
                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="stat-icon users">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.totalUsers}</h3>
                            <p>Total Users</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="stat-icon recipes">
                            <i className="fas fa-utensils"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.totalRecipes}</h3>
                            <p>Total Recipes</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="stat-icon pending">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.pendingReviews}</h3>
                            <p>Pending Reviews</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="stat-icon logins">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.todayLogins}</h3>
                            <p>Today's Logins</p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Tabs */}
                <div className="admin-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-chart-bar"></i>
                        Overview
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <i className="fas fa-users"></i>
                        Manage Users
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recipes')}
                    >
                        <i className="fas fa-book-open"></i>
                        Manage Recipes & Ingredients
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <i className="fas fa-plus-circle"></i>
                        Create Recipe
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'create-ingredient' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create-ingredient')}
                    >
                        <i className="fas fa-leaf"></i>
                        Create Ingredient
                    </button>
                </div>

                {/* Content Area */}
                <motion.div 
                    className="admin-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'overview' && (
                        <div className="overview-content">
                            <h2>System Overview</h2>
                            <div className="overview-grid">
                                <div className="overview-card">
                                    <h3>Recent Activity</h3>
                                    <ul>
                                        <li>5 new users registered today</li>
                                        <li>3 recipes submitted for review</li>
                                        <li>12 users logged in today</li>
                                        <li>2 recipes approved</li>
                                    </ul>
                                </div>
                                <div className="overview-card">
                                    <h3>Quick Actions</h3>
                                    <div className="quick-actions">
                                        <button className="action-btn" onClick={() => setActiveTab('recipes')}>
                                            Review Pending Recipes
                                        </button>
                                        <button className="action-btn" onClick={() => setActiveTab('users')}>
                                            Manage Users
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <ManageUsersPage
                            users={users}
                            fetchUsers={fetchUsers}
                            handleDeleteUser={handleDeleteUser}
                            handleUserAction={handleUserAction}
                        />
                    )}

                    {activeTab === 'recipes' && (
                        <ManageRecipeAndIngredientsPage
                            recipes={recipes}
                            ingredients={ingredients}
                            recipeSearch={recipeSearch}
                            ingredientSearch={ingredientSearch}
                            setRecipeSearch={setRecipeSearch}
                            setIngredientSearch={setIngredientSearch}
                            filteredRecipes={filteredRecipes}
                            filteredIngredients={filteredIngredients}
                            handleEditRecipe={handleEditRecipe}
                            handleDeleteRecipe={handleDeleteRecipe}
                            handleEditIngredient={handleEditIngredient}
                            handleDeleteIngredient={handleDeleteIngredient}
                        />
                    )}

                    {activeTab === 'create' && (
                        <CreateRecipe
                            onRecipeSaved={() => {
                                setActiveTab('recipes');
                                fetchRecipes();
                            }}
                        />
                    )}

                    {activeTab === 'create-ingredient' && (
                        <CreateIngredient
                            onCreated={() => {
                                setActiveTab('recipes');
                                fetchIngredients();
                            }}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;