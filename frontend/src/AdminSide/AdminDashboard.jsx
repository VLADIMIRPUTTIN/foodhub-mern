import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import './AdminDashboard.scss';
import CreateRecipe from './CreateRecipe';
import CreateIngredient from './CreateIngredient';
import PendingRecipePage from './PendingRecipePage';
import axios from "axios";
import Swal from 'sweetalert2';
import ManageUsersPage from './ManageUsersPage';
import ManageRecipeAndIngredientsPage from './ManageRecipeAndIngredientsPage';

const baseURL = import.meta.env.MODE === "development"
  ? "http://localhost:5000"
  : "";

const AdminDashboard = () => {
    const { user, isAdmin, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [stats, setStats] = useState({
       
    });
    const [loading, setLoading] = useState(true);

    // Search states for manage recipes/ingredients
    const [recipeSearch, setRecipeSearch] = useState('');
    const [ingredientSearch, setIngredientSearch] = useState('');

    // Real-time stats fetcher
    const fetchRealTimeStats = async () => {
        try {
            const [usersRes, recipesRes, pendingRes] = await Promise.all([
                // Fetch all users
                axios.get(`${baseURL}/api/users`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }),
                // Fetch all recipes for admin
                axios.get(`${baseURL}/api/recipes/admin/all`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }),
                // Fetch pending recipes
                axios.get(`${baseURL}/api/recipes/admin/pending`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            ]);

            const usersData = usersRes.data.users || [];
            const recipesData = recipesRes.data.recipes || [];
            const pendingData = pendingRes.data.recipes || [];

            // Calculate today's logins
            const today = new Date();
            const todayLogins = usersData.filter(user => {
                if (!user.lastLogin) return false;
                const loginDate = new Date(user.lastLogin);
                return (
                    loginDate.getDate() === today.getDate() &&
                    loginDate.getMonth() === today.getMonth() &&
                    loginDate.getFullYear() === today.getFullYear()
                );
            }).length;

            // Update all stats with real data
            setStats({
                totalUsers: usersData.length,
                totalRecipes: recipesData.length,
                pendingRecipes: pendingData.length, // Changed from pendingReviews to pendingRecipes
                todayLogins: todayLogins
            });

            // Update state arrays
            setUsers(usersData);
            setRecipes(recipesData);
            setPendingCount(pendingData.length);

        } catch (error) {
            console.error('Error fetching real-time stats:', error);
        }
    };

    // Fetch functions
    const fetchRecipes = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/recipes/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setRecipes(res.data.recipes || []);
            return res.data.recipes || [];
        } catch (error) {
            console.error('Error fetching recipes:', error);
            setRecipes([]);
            return [];
        }
    };

    const fetchPendingCount = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/recipes/admin/pending`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const pendingRecipes = res.data.recipes || [];
            setPendingCount(pendingRecipes.length);
            return pendingRecipes.length;
        } catch (error) {
            console.error('Error fetching pending count:', error);
            setPendingCount(0);
            return 0;
        }
    };

    const fetchIngredients = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/ingredients`);
            setIngredients(res.data.ingredients || []);
        } catch (error) {
            console.error('Error fetching ingredients:', error);
            setIngredients([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${baseURL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUsers(res.data.users || []);
            return res.data.users || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
            return [];
        }
    };

    // Initial data load
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            await Promise.all([
                fetchUsers(),
                fetchRecipes(),
                fetchIngredients(),
                fetchPendingCount()
            ]);
            await fetchRealTimeStats(); // Get real-time stats
            setLoading(false);
        };
        
        fetchInitialData();
    }, []);

    // Set up real-time updates every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchRealTimeStats();
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Update stats when data changes
    useEffect(() => {
        if (!loading) {
            fetchRealTimeStats();
        }
    }, [users.length, recipes.length, pendingCount]);

    const handleLogout = () => {
        logout();
    };

    const handleUserAction = async (userId, action) => {
        try {
            if (action === 'active') {
                await axios.patch(`${baseURL}/api/users/${userId}/activate`, {}, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            } else if (action === 'banned') {
                await axios.patch(`${baseURL}/api/users/${userId}/ban`, { reason: "Banned by admin" }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            }
            await fetchUsers();
            await fetchRealTimeStats(); // Update stats immediately
        } catch (err) {
            Swal.fire('Error', 'Failed to update user status.', 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await axios.delete(`${baseURL}/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            await fetchUsers();
            await fetchRealTimeStats(); // Update stats immediately
        } catch {
            Swal.fire('Error', 'Failed to delete user.', 'error');
        }
    };

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
                Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the recipe.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await axios.delete(`${baseURL}/api/recipes/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    await fetchRecipes();
                    await fetchRealTimeStats(); // Update stats immediately
                    Swal.fire('Deleted!', 'Recipe has been deleted successfully.', 'success');
                }
            } catch (error) {
                console.error('Delete recipe error:', error);
                
                let errorMessage = 'Failed to delete recipe.';
                
                if (error.response) {
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
                await axios.delete(`${baseURL}/api/ingredients/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                await fetchIngredients();
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
                await axios.patch(`${baseURL}/api/recipes/${recipe._id}`, { title: newTitle }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                await fetchRecipes();
                await fetchRealTimeStats(); // Update stats immediately
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
                await axios.patch(`${baseURL}/api/ingredients/${ingredient._id}`, { name: newName }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                await fetchIngredients();
                Swal.fire('Saved!', 'Ingredient name updated.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to update ingredient.', 'error');
            }
        }
    };

    // Callback for when pending recipes are moderated
    const handleRecipeModerated = async () => {
        await fetchPendingCount();
        await fetchRealTimeStats();
    };

    // Callback for when new recipe is created
    const handleRecipeSaved = async () => {
        setActiveTab('recipes');
        await fetchRecipes();
        await fetchRealTimeStats();
    };

    // Callback for when new ingredient is created
    const handleIngredientCreated = async () => {
        setActiveTab('recipes');
        await fetchIngredients();
    };

    // Filtered lists
    const filteredRecipes = recipes.filter(r =>
        (r.title || r.name)?.toLowerCase().includes(recipeSearch.toLowerCase())
    );
    const filteredIngredients = ingredients.filter(i =>
        i.name?.toLowerCase().includes(ingredientSearch.toLowerCase())
    );

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
                {/* Real-time Stats Cards - REMOVED LOADING OVERLAYS */}
                <div className="stats-grid">
                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        key={stats.totalUsers}
                    >
                        <div className="stat-icon users">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-info">
                            <motion.h3
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.3 }}
                                key={`users-${stats.totalUsers}`}
                            >
                                {stats.totalUsers}
                            </motion.h3>
                            <p>Total Users</p>
                        </div>
                        {/* REMOVED: {loading && <div className="stat-loading">Loading...</div>} */}
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        key={stats.totalRecipes}
                    >
                        <div className="stat-icon recipes">
                            <i className="fas fa-utensils"></i>
                        </div>
                        <div className="stat-info">
                            <motion.h3
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.3 }}
                                key={`recipes-${stats.totalRecipes}`}
                            >
                                {stats.totalRecipes}
                            </motion.h3>
                            <p>Total Recipes</p>
                        </div>
                        {/* REMOVED: {loading && <div className="stat-loading">Loading...</div>} */}
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        key={stats.pendingRecipes}
                    >
                        <div className="stat-icon pending">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-info">
                            <motion.h3
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.3 }}
                                key={`pending-${stats.pendingRecipes}`}
                            >
                                {stats.pendingRecipes}
                            </motion.h3>
                            <p>Pending Recipes</p>
                        </div>
                        {/* REMOVED: {loading && <div className="stat-loading">Loading...</div>} */}
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        key={stats.todayLogins}
                    >
                        <div className="stat-icon logins">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="stat-info">
                            <motion.h3
                                initial={{ scale: 1 }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.3 }}
                                key={`logins-${stats.todayLogins}`}
                            >
                                {stats.todayLogins}
                            </motion.h3>
                            <p>Today's Logins</p>
                        </div>
                        {/* REMOVED: {loading && <div className="stat-loading">Loading...</div>} */}
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
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        <i className="fas fa-clock"></i>
                        Pending Recipes
                        {stats.pendingRecipes > 0 && (
                            <span className="notification-badge">{stats.pendingRecipes}</span>
                        )}
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
                            <div className="overview-header">
                                <h2>System Overview</h2>
                                <div className="last-updated">
                                    <i className="fas fa-sync-alt"></i>
                                    Auto-updates every 30 seconds
                                </div>
                            </div>
                            <div className="overview-grid">
                                <div className="overview-card">
                                    <h3>Today's Activity</h3>
                                    <ul>
                                        <li>👥 {stats.todayLogins} users logged in today</li>
                                        <li>📋 {stats.pendingRecipes} recipes awaiting review</li>
                                        <li>🍳 {stats.totalRecipes} total recipes in system</li>
                                        <li>👨‍👩‍👧‍👦 {stats.totalUsers} registered users</li>
                                    </ul>
                                </div>
                                <div className="overview-card">
                                    <h3>Quick Actions</h3>
                                    <div className="quick-actions">
                                        <button 
                                            className="action-btn" 
                                            onClick={() => setActiveTab('pending')}
                                        >
                                            <i className="fas fa-clock"></i>
                                            Review Pending Recipes ({stats.pendingRecipes})
                                        </button>
                                        <button 
                                            className="action-btn" 
                                            onClick={() => setActiveTab('users')}
                                        >
                                            <i className="fas fa-users"></i>
                                            Manage Users ({stats.totalUsers})
                                        </button>
                                        <button 
                                            className="action-btn" 
                                            onClick={() => fetchRealTimeStats()}
                                        >
                                            <i className="fas fa-sync-alt"></i>
                                            Refresh Statistics
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

                    {activeTab === 'pending' && (
                        <PendingRecipePage 
                            onRecipeModerated={handleRecipeModerated}
                        />
                    )}

                    {activeTab === 'create' && (
                        <CreateRecipe
                            onRecipeSaved={handleRecipeSaved}
                        />
                    )}

                    {activeTab === 'create-ingredient' && (
                        <CreateIngredient
                            onCreated={handleIngredientCreated}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;