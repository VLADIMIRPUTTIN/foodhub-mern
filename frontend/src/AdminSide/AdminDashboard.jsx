import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import './AdminDashboard.scss';
import AdminSidebar from './AdminSidebar';
import DashboardOverview from './DashboardOverview';
import CreateRecipe from './CreateRecipe';
import CreateIngredient from './CreateIngredient';
import PendingRecipePage from './PendingRecipePage';
import axios from "axios";
import Swal from 'sweetalert2';
import ManageUsersPage from './ManageUsersPage';
import ManageRecipeAndIngredientsPage from './ManageRecipeAndIngredientsPage';
import { useSocket } from '../context/SocketContext';

const baseURL = import.meta.env.MODE === "development"
  ? "http://localhost:5000"
  : "";

const AdminDashboard = () => {
    const { user, isAdmin, logout } = useAuthStore();
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState('dashboard'); // ✅ Changed default to 'dashboard'
    const [isMinimized, setIsMinimized] = useState(false); // ✅ New state for sidebar
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // ✅ Mobile menu state
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

    // Real-time stats fetcher
    const fetchRealTimeStats = async () => {
        try {
            const [usersRes, recipesRes, pendingRes] = await Promise.all([
                axios.get(`${baseURL}/api/users`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                axios.get(`${baseURL}/api/recipes/admin/all`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                axios.get(`${baseURL}/api/recipes/admin/pending`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            const usersData = usersRes.data.users || [];
            const recipesData = recipesRes.data.recipes || [];
            const pendingData = pendingRes.data.recipes || [];

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

            setStats({
                totalUsers: usersData.length,
                totalRecipes: recipesData.length,
                pendingRecipes: pendingData.length,
                todayLogins: todayLogins
            });

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
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
            await fetchRealTimeStats();
            setLoading(false);
        };
        
        fetchInitialData();
    }, []);

    // Set up real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchRealTimeStats();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!loading) {
            fetchRealTimeStats();
        }
    }, [users.length, recipes.length, pendingCount]);

    // Socket.IO event listeners
    useEffect(() => {
        if (!socket) return;
        
        const handleRecipePending = () => {
            setPendingCount(prev => prev + 1);
            setStats(prev => ({ ...prev, pendingRecipes: prev.pendingRecipes + 1 }));
        };
        
        const handleRecipeStatusChange = () => {
            setPendingCount(prev => Math.max(0, prev - 1));
            setStats(prev => ({ ...prev, pendingRecipes: Math.max(0, prev.pendingRecipes - 1) }));
        };
        
        socket.on('recipePending', handleRecipePending);
        socket.on('recipeApproved', handleRecipeStatusChange);
        socket.on('recipeRejected', handleRecipeStatusChange);
        
        return () => {
            socket.off('recipePending', handleRecipePending);
            socket.off('recipeApproved');
            socket.off('recipeRejected');
        };
    }, [socket]);

    const handleLogout = () => {
        logout();
    };

    const handleUserAction = async (userId, action) => {
        try {
            if (action === 'active') {
                await axios.patch(`${baseURL}/api/users/${userId}/activate`, {}, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            } else if (action === 'banned') {
                await axios.patch(`${baseURL}/api/users/${userId}/ban`, { reason: "Banned by admin" }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
            }
            await fetchUsers();
            await fetchRealTimeStats();
        } catch (err) {
            Swal.fire('Error', 'Failed to update user status.', 'error');
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await axios.delete(`${baseURL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            await fetchUsers();
            await fetchRealTimeStats();
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
                    didOpen: () => { Swal.showLoading(); }
                });

                const response = await axios.delete(`${baseURL}/api/recipes/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 200) {
                    await fetchRecipes();
                    await fetchRealTimeStats();
                    Swal.fire('Deleted!', 'Recipe has been deleted successfully.', 'success');
                }
            } catch (error) {
                console.error('Delete recipe error:', error);
                let errorMessage = 'Failed to delete recipe.';
                
                if (error.response) {
                    switch (error.response.status) {
                        case 400: errorMessage = 'Invalid recipe ID.'; break;
                        case 401: errorMessage = 'You are not authorized to delete this recipe.'; break;
                        case 403: errorMessage = 'You do not have permission to delete recipes.'; break;
                        case 404: errorMessage = 'Recipe not found.'; break;
                        case 500: errorMessage = 'Server error. Please try again later.'; break;
                        default: errorMessage = error.response.data?.message || 'An unexpected error occurred.';
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
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                await fetchRecipes();
                await fetchRealTimeStats();
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
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                await fetchIngredients();
                Swal.fire('Saved!', 'Ingredient name updated.', 'success');
            } catch {
                Swal.fire('Error', 'Failed to update ingredient.', 'error');
            }
        }
    };

    const handleRecipeModerated = async () => {
        await fetchPendingCount();
        await fetchRealTimeStats();
    };

    const handleRecipeSaved = async () => {
        setActiveTab('recipes');
        await fetchRecipes();
        await fetchRealTimeStats();
    };

    const handleIngredientCreated = async () => {
        setActiveTab('recipes');
        await fetchIngredients();
    };

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
            {/* Mobile Menu Toggle */}
            <button 
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <i className="bx bx-menu"></i>
            </button>

            {/* Sidebar Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="sidebar-overlay active"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <AdminSidebar 
                    activeTab={activeTab} 
                    setActiveTab={(tab) => {
                        setActiveTab(tab);
                        setIsMobileMenuOpen(false); // Close mobile menu on tab change
                    }}
                    pendingCount={stats.pendingRecipes}
                    isMinimized={isMinimized}
                    setIsMinimized={setIsMinimized}
                />
            </div>

            {/* Main Content Area */}
            <div className={`admin-main-content ${isMinimized ? 'sidebar-minimized' : ''}`}>
                {/* Header */}
                <motion.div 
                    className="admin-header"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="header-content">
                        <motion.div 
                            className="header-info"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <h1>
                                <motion.i 
                                    className="bx bx-user-check"
                                    animate={{ 
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ 
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatDelay: 3
                                    }}
                                ></motion.i>
                                Admin Dashboard
                            </h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                Welcome back, {user?.name}!
                            </motion.p>
                        </motion.div>
                        <motion.button 
                            className="logout-btn" 
                            onClick={logout}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            whileHover={{ 
                                scale: 1.05,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <motion.i 
                                className="bx bx-log-out"
                                whileHover={{ rotate: -10 }}
                                transition={{ duration: 0.2 }}
                            ></motion.i>
                            Logout
                        </motion.button>
                    </div>
                </motion.div>

                {/* Content Area Based on Active Tab */}
                <motion.div className="admin-content">
                    {activeTab === 'dashboard' && (
                        <DashboardOverview 
                            stats={stats}
                            users={users}
                            recipes={recipes}
                            ingredients={ingredients}  // ✅ Add this line
                        />
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
                            fetchRecipes={fetchRecipes}
                            fetchIngredients={fetchIngredients}
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