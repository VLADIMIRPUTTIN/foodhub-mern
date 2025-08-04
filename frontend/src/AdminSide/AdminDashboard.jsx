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
import QuickActionModal from '../components/QuickActionModal';

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
        totalUsers: 0,
        totalRecipes: 0,
        pendingRecipes: 0,
        todayLogins: 0
    });
    const [loading, setLoading] = useState(true);

    // Search states for manage recipes/ingredients
    const [recipeSearch, setRecipeSearch] = useState('');
    const [ingredientSearch, setIngredientSearch] = useState('');

    // Modal state
    const [modalState, setModalState] = useState({
        overview: false,
        users: false,
        recipes: false,
        pending: false,
        stats: false,
        createRecipe: false,
        createIngredient: false
    });

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
                pendingRecipes: pendingData.length,
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

    const openModal = (modalType) => {
        setModalState(prev => ({ ...prev, [modalType]: true }));
    };

    const closeModal = (modalType) => {
        setModalState(prev => ({ ...prev, [modalType]: false }));
    };

    const closeAllModals = () => {
        setModalState({
            overview: false,
            users: false,
            recipes: false,
            pending: false,
            stats: false,
            createRecipe: false,
            createIngredient: false
        });
    };

    const handleNavigateToTab = (tabName) => {
        setActiveTab(tabName);
        closeAllModals();
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
                        <h1>
                            <i className="bx bx-user-check"></i>
                            FoodHub Admin Panel
                        </h1>
                        <p>Welcome back, {user?.name}!</p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <i className="bx bx-log-out"></i>
                        Logout
                    </button>
                </div>
            </div>

            <div className="admin-container">
                {/* Real-time Stats Cards */}
                <div className="stats-grid">
                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        key="total-users"
                    >
                        <div className="stat-icon users">
                            <i className="bx bx-group"></i>
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
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        key="total-recipes"
                    >
                        <div className="stat-icon recipes">
                            <i className="bx bx-book-open"></i>
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
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        key="pending-recipes"
                    >
                        <div className="stat-icon pending">
                            <i className="bx bx-time-five"></i>
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
                    </motion.div>

                    <motion.div 
                        className="stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        key="today-logins"
                    >
                        <div className="stat-icon logins">
                            <i className="bx bx-trending-up"></i>
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
                    </motion.div>
                </div>

                {/* Navigation Tabs */}
                <div className="admin-tabs">
                    <button 
                        className={`tab-btn`}
                        onClick={() => openModal('overview')}
                    >
                        <i className="bx bx-bar-chart-alt-2"></i>
                        <span className="tab-text">Overview</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => openModal('users')}
                    >
                        <i className="bx bx-group"></i>
                        <span className="tab-text">Users</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
                        onClick={() => openModal('recipes')}
                    >
                        <i className="bx bx-book-open"></i>
                        <span className="tab-text">Recipes</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => openModal('pending')}
                    >
                        <i className="bx bx-time-five"></i>
                        <span className="tab-text">Pending</span>
                        {stats.pendingRecipes > 0 && (
                            <span className="notification-badge">{stats.pendingRecipes}</span>
                        )}
                    </button>
                    <button 
                        className={`tab-btn ${modalState.createRecipe ? 'active' : ''}`}
                        onClick={() => openModal('createRecipe')}
                    >
                        <i className="bx bx-plus-circle"></i>
                        <span className="tab-text">Create Recipe</span>
                    </button>
                    <button 
                        className={`tab-btn ${modalState.createIngredient ? 'active' : ''}`}
                        onClick={() => openModal('createIngredient')}
                    >
                        <i className="bx bx-leaf"></i>
                        <span className="tab-text">Create Ingredient</span>
                    </button>
                </div>

                {/* Content Area */}
                <motion.div>
                    {/* Remove the overview content since we're using modals */}
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

            {/* Users Modal - Full Content */}
            <QuickActionModal
                isOpen={modalState.users}
                onClose={() => closeModal('users')}
                title="User Management"
                type="users"
                isFullContent={true}
            >
                <ManageUsersPage
                    users={users}
                    fetchUsers={fetchUsers}
                    handleDeleteUser={handleDeleteUser}
                    handleUserAction={handleUserAction}
                />
            </QuickActionModal>

            {/* Recipes Modal - Enhanced with create options */}
            <QuickActionModal
                isOpen={modalState.recipes}
                onClose={() => closeModal('recipes')}
                title="Recipe & Ingredient Management"
                type="recipes"
                isFullContent={true}
            >
                <div style={{ padding: '1rem', borderBottom: '1px solid #e9ecef', background: '#f8f9fa' }}>
                    <div className="modal-quick-actions" style={{ flexDirection: 'row', gap: '0.5rem', marginBottom: '0' }}>
                        <button 
                            className="modal-action-btn recipes"
                            style={{ flex: 1, minHeight: '48px', padding: '0.5rem 1rem' }}
                            onClick={() => {
                                closeModal('recipes');
                                openModal('createRecipe');
                            }}
                        >
                            <i className="bx bx-plus-circle"></i>
                            <div className="btn-content">
                                <div className="btn-title" style={{ fontSize: '0.85rem' }}>Create Recipe</div>
                            </div>
                        </button>
                        
                        <button 
                            className="modal-action-btn pending"
                            style={{ flex: 1, minHeight: '48px', padding: '0.5rem 1rem' }}
                            onClick={() => {
                                closeModal('recipes');
                                openModal('createIngredient');
                            }}
                        >
                            <i className="bx bx-leaf"></i>
                            <div className="btn-content">
                                <div className="btn-title" style={{ fontSize: '0.85rem' }}>Create Ingredient</div>
                            </div>
                        </button>
                    </div>
                </div>
                
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
                    fetchRecipes={fetchRecipes}
                    fetchIngredients={fetchIngredients}
                />
            </QuickActionModal>

            {/* Pending Recipes Modal - Full Content */}
            <QuickActionModal
                isOpen={modalState.pending}
                onClose={() => closeModal('pending')}
                title="Pending Recipe Reviews"
                type="pending"
                isFullContent={true}
            >
                <PendingRecipePage 
                    onRecipeModerated={handleRecipeModerated}
                />
            </QuickActionModal>

            {/* Overview Modal - Enhanced with create actions */}
            <QuickActionModal
                isOpen={modalState.overview}
                onClose={() => closeModal('overview')}
                title="System Overview"
                type="stats"
            >
                <div className="modal-stats-grid">
                    <div className="modal-stat-item">
                        <div className="stat-number">{stats.totalUsers}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="modal-stat-item">
                        <div className="stat-number">{stats.totalRecipes}</div>
                        <div className="stat-label">Total Recipes</div>
                    </div>
                    <div className="modal-stat-item">
                        <div className="stat-number">{stats.pendingRecipes}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="modal-stat-item">
                        <div className="stat-number">{stats.todayLogins}</div>
                        <div className="stat-label">Today's Logins</div>
                    </div>
                </div>

                <div className="modal-quick-actions">
                    <button 
                        className="modal-action-btn pending"
                        onClick={() => {
                            closeModal('overview');
                            openModal('pending');
                        }}
                    >
                        <i className="bx bx-time-five"></i>
                        <div className="btn-content">
                            <div className="btn-title">Review Pending Recipes</div>
                            <div className="btn-description">
                                {stats.pendingRecipes} recipes awaiting your review
                            </div>
                        </div>
                    </button>
                    
                    <button 
                        className="modal-action-btn users"
                        onClick={() => {
                            closeModal('overview');
                            openModal('users');
                        }}
                    >
                        <i className="bx bx-group"></i>
                        <div className="btn-content">
                            <div className="btn-title">Manage Users</div>
                            <div className="btn-description">
                                Oversee {stats.totalUsers} registered users
                            </div>
                        </div>
                    </button>
                    
                    <button 
                        className="modal-action-btn recipes"
                        onClick={() => {
                            closeModal('overview');
                            openModal('recipes');
                        }}
                    >
                        <i className="bx bx-book-open"></i>
                        <div className="btn-content">
                            <div className="btn-title">Manage Recipes</div>
                            <div className="btn-description">
                                Edit and organize {stats.totalRecipes} recipes
                            </div>
                        </div>
                    </button>
                    
                    {/* New Create Recipe Button */}
                    <button 
                        className="modal-action-btn recipes"
                        onClick={() => {
                            closeModal('overview');
                            openModal('createRecipe');
                        }}
                    >
                        <i className="bx bx-plus-circle"></i>
                        <div className="btn-content">
                            <div className="btn-title">Create New Recipe</div>
                            <div className="btn-description">
                                Add a delicious new recipe to the collection
                            </div>
                        </div>
                    </button>

                    {/* New Create Ingredient Button */}
                    <button 
                        className="modal-action-btn pending"
                        onClick={() => {
                            closeModal('overview');
                            openModal('createIngredient');
                        }}
                    >
                        <i className="bx bx-leaf"></i>
                        <div className="btn-content">
                            <div className="btn-title">Create New Ingredient</div>
                            <div className="btn-description">
                                Add new ingredients to expand recipe options
                            </div>
                        </div>
                    </button>
                    
                    <button 
                        className="modal-action-btn stats"
                        onClick={() => fetchRealTimeStats()}
                    >
                        <i className="bx bx-refresh"></i>
                        <div className="btn-content">
                            <div className="btn-title">Refresh Statistics</div>
                            <div className="btn-description">
                                Update all system statistics
                            </div>
                        </div>
                    </button>
                </div>
            </QuickActionModal>

            {/* Create Recipe Modal - Full Content */}
            <QuickActionModal
                isOpen={modalState.createRecipe}
                onClose={() => closeModal('createRecipe')}
                title="Create New Recipe"
                type="recipes"
                isFullContent={true}
            >
                <CreateRecipe
                    onRecipeSaved={() => {
                        handleRecipeSaved();
                        closeModal('createRecipe');
                    }}
                />
            </QuickActionModal>

            {/* Create Ingredient Modal - Full Content */}
            <QuickActionModal
                isOpen={modalState.createIngredient}
                onClose={() => closeModal('createIngredient')}
                title="Create New Ingredient"
                type="recipes"
                isFullContent={true}
            >
                <CreateIngredient
                    onCreated={() => {
                        handleIngredientCreated();
                        closeModal('createIngredient');
                    }}
                />
            </QuickActionModal>
        </div>
    );
};

export default AdminDashboard;