import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';
import {
    REPORT_CATEGORIES,
    REPORT_FORMATS,
    generateReport,
} from '../utils/reportGenerator';
import './DashboardOverview.scss';

const DashboardOverview = ({ stats, users, recipes, ingredients }) => {
    const { user, isAdmin } = useAuthStore();
    const [timeRange, setTimeRange] = useState('week');
    const [exportLoading, setExportLoading] = useState(false);
    const [showExportPanel, setShowExportPanel] = useState(false);
    const [exportCategory, setExportCategory] = useState('all');
    const [exportFormat, setExportFormat] = useState('excel');

    // Calculate user growth data
    const getUserGrowthData = () => {
        const now = new Date();
        const data = [];
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                ...(timeRange === 'year' && { year: '2-digit' })
            });
            
            const usersOnDate = users.filter(user => {
                const createdDate = new Date(user.createdAt);
                return createdDate <= date;
            }).length;
            
            data.push({
                date: dateStr,
                users: usersOnDate
            });
        }
        
        return data;
    };

    // Calculate recipe types distribution
    const getRecipeTypesData = () => {
        const adminRecipes = recipes.filter(r => r.createdBy?.role === 'admin' || r.isPublic).length;
        const userRecipes = recipes.filter(r => r.createdBy?.role === 'user' && !r.isPublic).length;
        const sharedRecipes = recipes.filter(r => r.isShared && r.shareStatus === 'approved').length;
        
        return [
            { name: 'Admin Recipes', value: adminRecipes, color: '#CF996C' },
            { name: 'User Recipes', value: userRecipes, color: '#3b82f6' },
            { name: 'Community Shared', value: sharedRecipes, color: '#22c55e' }
        ];
    };

    // Calculate recipe status distribution
    const getRecipeStatusData = () => {
        const approved = recipes.filter(r => r.shareStatus === 'approved').length;
        const pending = recipes.filter(r => r.shareStatus === 'pending').length;
        const rejected = recipes.filter(r => r.shareStatus === 'rejected').length;
        const notShared = recipes.filter(r => r.shareStatus === 'not_shared').length;
        
        return [
            { name: 'Approved', value: approved, color: '#22c55e' },
            { name: 'Pending', value: pending, color: '#f59e0b' },
            { name: 'Rejected', value: rejected, color: '#ef4444' },
            { name: 'Not Shared', value: notShared, color: '#94a3b8' }
        ];
    };

    // Calculate user activity (logins)
    const getUserActivityData = () => {
        const data = [];
        const now = new Date();
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: timeRange === 'week' ? 'short' : undefined,
                month: 'short',
                day: 'numeric'
            });
            
            const loginsOnDate = users.filter(user => {
                if (!user.lastLogin) return false;
                const loginDate = new Date(user.lastLogin);
                return loginDate >= date && loginDate < nextDate;
            }).length;
            
            data.push({
                day: dateStr,
                logins: loginsOnDate
            });
        }
        
        return data;
    };

    // Calculate popular cuisines
    const getPopularCuisinesData = () => {
        const cuisineCount = {};
        
        recipes.forEach(recipe => {
            if (recipe.cuisine) {
                cuisineCount[recipe.cuisine] = (cuisineCount[recipe.cuisine] || 0) + 1;
            }
        });
        
        return Object.entries(cuisineCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    };

    // Calculate recipe categories distribution
    const getRecipeCategoriesData = () => {
        const categoryCount = {};
        
        recipes.forEach(recipe => {
            if (recipe.category) {
                categoryCount[recipe.category] = (categoryCount[recipe.category] || 0) + 1;
            }
        });
        
        return Object.entries(categoryCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    };

    // Calculate user engagement metrics
    const getUserEngagementData = () => {
        const activeUsers = users.filter(u => {
            if (!u.lastLogin) return false;
            const daysSinceLogin = (Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceLogin <= 7;
        }).length;

        const inactiveUsers = users.length - activeUsers;
        
        return [
            { name: 'Active (7 days)', value: activeUsers, color: '#22c55e' },
            { name: 'Inactive', value: inactiveUsers, color: '#ef4444' }
        ];
    };

    // Calculate dietary preferences distribution
    const getDietaryPreferencesData = () => {
        const dietaryCount = {};
        
        recipes.forEach(recipe => {
            if (recipe.dietaryTags && Array.isArray(recipe.dietaryTags)) {
                recipe.dietaryTags.forEach(tag => {
                    dietaryCount[tag] = (dietaryCount[tag] || 0) + 1;
                });
            }
        });
        
        return Object.entries(dietaryCount)
            .map(([subject, value]) => ({ subject, value, fullMark: Math.max(...Object.values(dietaryCount)) }))
            .slice(0, 8);
    };

    // Calculate recipe creation trend
    const getRecipeCreationTrendData = () => {
        const data = [];
        const now = new Date();
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                ...(timeRange === 'year' && { year: '2-digit' })
            });
            
            const recipesCreated = recipes.filter(recipe => {
                const createdDate = new Date(recipe.createdAt);
                return createdDate >= date && createdDate < nextDate;
            }).length;
            
            const adminRecipes = recipes.filter(recipe => {
                const createdDate = new Date(recipe.createdAt);
                return createdDate >= date && createdDate < nextDate && (recipe.createdBy?.role === 'admin' || recipe.isPublic);
            }).length;
            
            const userRecipes = recipesCreated - adminRecipes;
            
            data.push({
                date: dateStr,
                total: recipesCreated,
                admin: adminRecipes,
                user: userRecipes
            });
        }
        
        return data;
    };

    const handleExportReport = async () => {
        if (!isAdmin()) {
            Swal.fire('Access Denied', 'Only administrators can generate reports.', 'error');
            return;
        }

        if (exportCategory === 'ingredients' && (!ingredients || ingredients.length === 0)) {
            Swal.fire('No Data', 'No ingredients available to export.', 'warning');
            return;
        }

        setExportLoading(true);

        try {
            await generateReport({
                adminUser: user,
                category: exportCategory,
                format: exportFormat,
                timeRange,
                stats,
                users,
                recipes,
                ingredients,
            });

            setShowExportPanel(false);
            Swal.fire({
                icon: 'success',
                title: 'Admin Report Generated',
                text: `Your ${REPORT_CATEGORIES[exportCategory].label} report has been downloaded.`,
                timer: 2500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error generating report:', error);
            const message = error.message?.includes('Access denied')
                ? 'Only administrators can generate reports.'
                : 'Failed to generate report. Please try again.';
            Swal.fire('Error', message, 'error');
        } finally {
            setExportLoading(false);
        }
    };

    const userGrowthData = getUserGrowthData();
    const recipeTypesData = getRecipeTypesData();
    const recipeStatusData = getRecipeStatusData();
    const userActivityData = getUserActivityData();
    const popularCuisinesData = getPopularCuisinesData();
    const recipeCategoriesData = getRecipeCategoriesData();
    const userEngagementData = getUserEngagementData();
    const dietaryPreferencesData = getDietaryPreferencesData();
    const recipeCreationTrendData = getRecipeCreationTrendData();

    const COLORS = ['#CF996C', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

    return (
        <div className="dashboard-overview">
            <motion.div 
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <h2>Dashboard Overview</h2>
                    <p>Real-time insights and analytics</p>
                </div>
                <div className="header-actions">
                    <div className="time-range-selector">
                        <button 
                            className={timeRange === 'week' ? 'active' : ''}
                            onClick={() => setTimeRange('week')}
                        >
                            Week
                        </button>
                        <button 
                            className={timeRange === 'month' ? 'active' : ''}
                            onClick={() => setTimeRange('month')}
                        >
                            Month
                        </button>
                        <button 
                            className={timeRange === 'year' ? 'active' : ''}
                            onClick={() => setTimeRange('year')}
                        >
                            Year
                        </button>
                    </div>
                    {isAdmin() && (
                        <motion.button
                            className="export-btn"
                            onClick={() => setShowExportPanel((prev) => !prev)}
                            disabled={exportLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <i className={`bx ${exportLoading ? 'bx-loader-alt bx-spin' : 'bx-export'}`}></i>
                            {exportLoading ? 'Generating...' : 'Generate Admin Report'}
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {isAdmin() && showExportPanel && (
                <motion.div
                    className="export-panel"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="export-panel-header">
                        <h3><i className="bx bx-shield-quarter"></i> Admin Report Generation</h3>
                        <p>Administrator-only export. Select category and format for your report.</p>
                    </div>

                    <div className="export-section">
                        <label className="export-label">Report Category</label>
                        <div className="category-grid">
                            {Object.values(REPORT_CATEGORIES).map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`category-option ${exportCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setExportCategory(cat.id)}
                                >
                                    <i className={`bx ${cat.icon}`}></i>
                                    <span className="cat-label">{cat.label}</span>
                                    <span className="cat-desc">{cat.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="export-section">
                        <label className="export-label">Export Format</label>
                        <div className="format-grid">
                            {Object.values(REPORT_FORMATS).map((fmt) => (
                                <button
                                    key={fmt.id}
                                    type="button"
                                    className={`format-option ${exportFormat === fmt.id ? 'active' : ''}`}
                                    onClick={() => setExportFormat(fmt.id)}
                                >
                                    <i className={`bx ${fmt.icon}`}></i>
                                    <span>{fmt.label}</span>
                                    {fmt.id === 'pdf' && (
                                        <small>Admin-only PDF with header, footer & page numbers</small>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="export-preview">
                        <i className="bx bx-info-circle"></i>
                        <span>
                            Admin <strong>{user?.name}</strong> will generate a
                            <strong> {REPORT_CATEGORIES[exportCategory].label}</strong> report
                            as <strong>{exportFormat.toUpperCase()}</strong> for the
                            <strong> {timeRange}</strong> period.
                            {exportFormat === 'pdf' && ' PDF includes admin-branded header, footer with your name, and page numbers.'}
                        </span>
                    </div>

                    <div className="export-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => setShowExportPanel(false)}
                            disabled={exportLoading}
                        >
                            Cancel
                        </button>
                        <motion.button
                            type="button"
                            className="generate-btn"
                            onClick={handleExportReport}
                            disabled={exportLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <i className={`bx ${exportLoading ? 'bx-loader-alt bx-spin' : 'bx-download'}`}></i>
                            {exportLoading ? 'Generating Admin Report...' : 'Download Admin Report'}
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* Quick Stats Cards */}
            <div className="quick-stats-grid">
                {[
                    { 
                        icon: 'bx-group', 
                        label: 'Total Users', 
                        value: stats.totalUsers,
                        change: '+12%',
                        color: '#3b82f6'
                    },
                    { 
                        icon: 'bx-book-open', 
                        label: 'Total Recipes', 
                        value: stats.totalRecipes,
                        change: '+8%',
                        color: '#22c55e'
                    },
                    { 
                        icon: 'bx-time-five', 
                        label: 'Pending', 
                        value: stats.pendingRecipes,
                        change: '-3%',
                        color: '#f59e0b'
                    },
                    { 
                        icon: 'bx-trending-up', 
                        label: "Today's Logins", 
                        value: stats.todayLogins,
                        change: '+15%',
                        color: '#8b5cf6'
                    },
                    { 
                        icon: 'bx-leaf', 
                        label: 'Total Ingredients', 
                        value: ingredients?.length || 0,
                        change: '+5%',
                        color: '#10b981'
                    },
                    { 
                        icon: 'bx-share-alt', 
                        label: 'Community Recipes', 
                        value: recipes.filter(r => r.isShared && r.shareStatus === 'approved').length,
                        change: '+20%',
                        color: '#ec4899'
                    }
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        className="quick-stat-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
                            <i className={`bx ${stat.icon}`} style={{ color: stat.color }}></i>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">{stat.label}</span>
                            <h3 className="stat-value">{stat.value}</h3>
                            <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                                {stat.change} vs last period
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
                {/* User Growth Chart */}
                <motion.div 
                    className="chart-card full-width"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="chart-header">
                        <h3>User Growth Over Time</h3>
                        <i className="bx bx-trending-up"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={userGrowthData}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#CF996C" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#CF996C" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="users" 
                                stroke="#CF996C" 
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Recipe Creation Trend */}
                <motion.div 
                    className="chart-card full-width"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                >
                    <div className="chart-header">
                        <h3>Recipe Creation Trend</h3>
                        <i className="bx bx-line-chart"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={recipeCreationTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#CF996C" strokeWidth={3} name="Total" />
                            <Line type="monotone" dataKey="admin" stroke="#3b82f6" strokeWidth={2} name="Admin" />
                            <Line type="monotone" dataKey="user" stroke="#22c55e" strokeWidth={2} name="User" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Recipe Types Distribution */}
                <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="chart-header">
                        <h3>Recipe Types Distribution</h3>
                        <i className="bx bx-pie-chart-alt"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={recipeTypesData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => {
                                    if (percent < 0.05) return ''; // Hide labels for very small slices
                                    return `${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={80}
                                innerRadius={40}
                                fill="#8884d8"
                                dataKey="value"
                                paddingAngle={2}
                            >
                                {recipeTypesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem'
                                }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={50}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '0.75rem' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Recipe Status Distribution */}
                <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                >
                    <div className="chart-header">
                        <h3>Recipe Status</h3>
                        <i className="bx bx-check-circle"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={recipeStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => {
                                    if (percent < 0.05) return ''; // Hide labels for very small slices
                                    return `${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={80}
                                innerRadius={40}
                                fill="#8884d8"
                                dataKey="value"
                                paddingAngle={2}
                            >
                                {recipeStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem'
                                }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={50}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '0.75rem' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* User Activity Chart */}
                <motion.div 
                    className="chart-card full-width"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="chart-header">
                        <h3>Daily Active Users</h3>
                        <i className="bx bx-user-check"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userActivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="day" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="logins" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Popular Cuisines */}
                <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 }}
                >
                    <div className="chart-header">
                        <h3>Popular Cuisines</h3>
                        <i className="bx bx-dish"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={popularCuisinesData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" stroke="#64748b" style={{ fontSize: '0.7rem' }} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                stroke="#64748b" 
                                width={80}
                                style={{ fontSize: '0.7rem' }}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem'
                                }}
                            />
                            <Bar dataKey="value" fill="#CF996C" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Recipe Categories */}
                <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="chart-header">
                        <h3>Recipe Categories</h3>
                        <i className="bx bx-category"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={recipeCategoriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                                dataKey="name" 
                                stroke="#64748b" 
                                angle={-35} 
                                textAnchor="end" 
                                height={80}
                                interval={0}
                                style={{ fontSize: '0.65rem' }}
                                tick={{ fontSize: 9 }}
                            />
                            <YAxis stroke="#64748b" style={{ fontSize: '0.7rem' }} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem'
                                }}
                            />
                            <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* User Engagement */}
                <motion.div 
                    className="chart-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.55 }}
                >
                    <div className="chart-header">
                        <h3>User Engagement</h3>
                        <i className="bx bx-pie-chart"></i>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={userEngagementData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => {
                                    if (percent < 0.05) return '';
                                    return `${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={80}
                                innerRadius={40}
                                fill="#8884d8"
                                dataKey="value"
                                paddingAngle={2}
                            >
                                {userEngagementData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem'
                                }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={50}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '0.75rem' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Dietary Preferences Radar */}
                {dietaryPreferencesData.length > 0 && (
                    <motion.div 
                        className="chart-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="chart-header">
                            <h3>Dietary Preferences</h3>
                            <i className="bx bx-food-tag"></i>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={dietaryPreferencesData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis 
                                    dataKey="subject" 
                                    style={{ fontSize: '0.7rem' }}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                />
                                <PolarRadiusAxis 
                                    angle={90} 
                                    style={{ fontSize: '0.65rem' }}
                                />
                                <Radar 
                                    name="Recipes" 
                                    dataKey="value" 
                                    stroke="#CF996C" 
                                    fill="#CF996C" 
                                    fillOpacity={0.5}
                                    strokeWidth={2}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem'
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}
            </div>

            {/* Recent Activity */}
            <motion.div 
                className="recent-activity-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
            >
                <div className="chart-header">
                    <h3>Recent User Activity</h3>
                    <i className="bx bx-time-five"></i>
                </div>
                <div className="activity-list">
                    {users.slice(0, 10).map((user, index) => (
                        <div key={user._id} className="activity-item">
                            <div className="activity-icon">
                                <i className="bx bx-user-plus"></i>
                            </div>
                            <div className="activity-content">
                                <p><strong>{user.name}</strong> joined FoodHub</p>
                                <span className="activity-time">
                                    {new Date(user.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardOverview;