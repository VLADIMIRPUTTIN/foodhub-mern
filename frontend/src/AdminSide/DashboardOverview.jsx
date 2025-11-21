import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './DashboardOverview.scss';

const DashboardOverview = ({ stats, users, recipes, ingredients }) => {
    const [timeRange, setTimeRange] = useState('week');
    const [exportLoading, setExportLoading] = useState(false);

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

    // Export all data to Excel with better styling and time range filtering
    const exportToExcel = async () => {
        setExportLoading(true);
        
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Helper function to get date range based on timeRange
            const getDateRange = () => {
                const now = new Date();
                const start = new Date();
                
                if (timeRange === 'week') {
                    start.setDate(now.getDate() - 7);
                } else if (timeRange === 'month') {
                    start.setMonth(now.getMonth() - 1);
                } else if (timeRange === 'year') {
                    start.setFullYear(now.getFullYear() - 1);
                }
                
                return { start, end: now };
            };

            const dateRange = getDateRange();
            const timeRangeLabel = timeRange.charAt(0).toUpperCase() + timeRange.slice(1);

            // Filter data based on time range
            const filteredUsers = users.filter(user => {
                const createdDate = new Date(user.createdAt);
                return createdDate >= dateRange.start && createdDate <= dateRange.end;
            });

            const filteredRecipes = recipes.filter(recipe => {
                const createdDate = new Date(recipe.createdAt);
                return createdDate >= dateRange.start && createdDate <= dateRange.end;
            });

            // 1. Summary Sheet with Styling
            const summaryData = [
                ['🍽️ FOODHUB SYSTEM REPORT'],
                [`📊 ${timeRangeLabel} Overview Report`],
                [`📅 Generated on: ${new Date().toLocaleString()}`],
                [`📆 Date Range: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`],
                [''],
                ['📈 OVERALL STATISTICS'],
                ['Metric', 'Value', 'Status'],
                ['Total Users', stats.totalUsers, stats.totalUsers > 0 ? '✅ Active' : '⚠️ No Data'],
                ['Total Recipes', stats.totalRecipes, stats.totalRecipes > 0 ? '✅ Active' : '⚠️ No Data'],
                ['Pending Recipes', stats.pendingRecipes, stats.pendingRecipes > 0 ? '⏳ Pending' : '✅ Clear'],
                ['Today\'s Logins', stats.todayLogins, stats.todayLogins > 0 ? '✅ Active' : '⚠️ Low'],
                ['Total Ingredients', ingredients?.length || 0, ingredients?.length > 0 ? '✅ Available' : '⚠️ Empty'],
                [''],
                [`📊 ${timeRangeLabel.toUpperCase()} DATA`],
                ['Metric', 'Value'],
                [`New Users (${timeRangeLabel})`, filteredUsers.length],
                [`New Recipes (${timeRangeLabel})`, filteredRecipes.length],
                [''],
                ['🍳 RECIPE BREAKDOWN'],
                ['Type', 'Count', 'Percentage'],
                ['Admin Recipes', recipes.filter(r => r.createdBy?.role === 'admin' || r.isPublic).length, `${((recipes.filter(r => r.createdBy?.role === 'admin' || r.isPublic).length / recipes.length) * 100).toFixed(1)}%`],
                ['User Recipes', recipes.filter(r => r.createdBy?.role === 'user' && !r.isPublic).length, `${((recipes.filter(r => r.createdBy?.role === 'user' && !r.isPublic).length / recipes.length) * 100).toFixed(1)}%`],
                ['Community Shared', recipes.filter(r => r.isShared && r.shareStatus === 'approved').length, `${((recipes.filter(r => r.isShared && r.shareStatus === 'approved').length / recipes.length) * 100).toFixed(1)}%`],
                [''],
                ['👥 USER ENGAGEMENT'],
                ['Status', 'Count', 'Percentage'],
                ['Active Users (7 days)', users.filter(u => {
                    if (!u.lastLogin) return false;
                    const daysSinceLogin = (Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceLogin <= 7;
                }).length, `${((users.filter(u => {
                    if (!u.lastLogin) return false;
                    const daysSinceLogin = (Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceLogin <= 7;
                }).length / users.length) * 100).toFixed(1)}%`],
                ['Inactive Users', users.filter(u => {
                    if (!u.lastLogin) return true;
                    const daysSinceLogin = (Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceLogin > 7;
                }).length, `${((users.filter(u => {
                    if (!u.lastLogin) return true;
                    const daysSinceLogin = (Date.now() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
                    return daysSinceLogin > 7;
                }).length / users.length) * 100).toFixed(1)}%`],
                [''],
                ['✅ RECIPE STATUS BREAKDOWN'],
                ['Status', 'Count', 'Percentage'],
                ['Approved', recipes.filter(r => r.shareStatus === 'approved').length, `${((recipes.filter(r => r.shareStatus === 'approved').length / recipes.length) * 100).toFixed(1)}%`],
                ['Pending', recipes.filter(r => r.shareStatus === 'pending').length, `${((recipes.filter(r => r.shareStatus === 'pending').length / recipes.length) * 100).toFixed(1)}%`],
                ['Rejected', recipes.filter(r => r.shareStatus === 'rejected').length, `${((recipes.filter(r => r.shareStatus === 'rejected').length / recipes.length) * 100).toFixed(1)}%`],
                ['Not Shared', recipes.filter(r => r.shareStatus === 'not_shared').length, `${((recipes.filter(r => r.shareStatus === 'not_shared').length / recipes.length) * 100).toFixed(1)}%`]
            ];
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            
            // Apply column widths
            summarySheet['!cols'] = [
                { wch: 30 },
                { wch: 20 },
                { wch: 20 }
            ];
            
            XLSX.utils.book_append_sheet(wb, summarySheet, '📊 Summary');

            // 2. Users Sheet (Filtered by time range)
            const usersData = [
                [`👥 USERS - ${timeRangeLabel} Data`],
                [''],
                ['Name', 'Email', 'Role', 'Status', 'Verified', 'Created At', 'Last Login', 'Days Since Login']
            ];
            
            const displayUsers = timeRange === 'week' || timeRange === 'month' || timeRange === 'year' ? filteredUsers : users;
            
            displayUsers.forEach(user => {
                const daysSinceLogin = user.lastLogin 
                    ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
                    : 'Never';
                    
                usersData.push([
                    user.name,
                    user.email,
                    user.role.toUpperCase(),
                    user.status === 'active' ? '✅ Active' : '❌ Inactive',
                    user.isVerified ? '✅ Yes' : '❌ No',
                    new Date(user.createdAt).toLocaleDateString(),
                    user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
                    daysSinceLogin
                ]);
            });
            
            usersData.push([''], [`Total Users in ${timeRangeLabel}:`, displayUsers.length]);
            
            const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
            usersSheet['!cols'] = [
                { wch: 20 },
                { wch: 30 },
                { wch: 10 },
                { wch: 12 },
                { wch: 10 },
                { wch: 15 },
                { wch: 15 },
                { wch: 18 }
            ];
            XLSX.utils.book_append_sheet(wb, usersSheet, '👥 Users');

            // 3. Recipes Sheet (Filtered by time range)
            const recipesData = [
                [`🍳 RECIPES - ${timeRangeLabel} Data`],
                [''],
                ['Title', 'Category', 'Cuisine', 'Created By', 'Type', 'Status', 'Shared', 'Cooking Time', 'Difficulty', 'Rating', 'Created At']
            ];
            
            const displayRecipes = timeRange === 'week' || timeRange === 'month' || timeRange === 'year' ? filteredRecipes : recipes;
            
            displayRecipes.forEach(recipe => {
                recipesData.push([
                    recipe.title,
                    recipe.category || 'N/A',
                    recipe.cuisine || 'N/A',
                    recipe.createdBy?.name || 'Unknown',
                    recipe.isPublic ? '👨‍🍳 Admin' : '👤 User',
                    recipe.shareStatus === 'approved' ? '✅ Approved' : 
                    recipe.shareStatus === 'pending' ? '⏳ Pending' : 
                    recipe.shareStatus === 'rejected' ? '❌ Rejected' : '🔒 Not Shared',
                    recipe.isShared ? '✅ Yes' : '❌ No',
                    recipe.cookingTime ? `${recipe.cookingTime} mins` : 'N/A',
                    recipe.difficulty ? `${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}` : 'N/A',
                    recipe.averageRating ? `⭐ ${recipe.averageRating.toFixed(1)}` : '⭐ 0',
                    new Date(recipe.createdAt).toLocaleDateString()
                ]);
            });
            
            recipesData.push([''], [`Total Recipes in ${timeRangeLabel}:`, displayRecipes.length]);
            
            const recipesSheet = XLSX.utils.aoa_to_sheet(recipesData);
            recipesSheet['!cols'] = [
                { wch: 30 },
                { wch: 15 },
                { wch: 15 },
                { wch: 20 },
                { wch: 12 },
                { wch: 15 },
                { wch: 10 },
                { wch: 15 },
                { wch: 12 },
                { wch: 10 },
                { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, recipesSheet, '🍳 Recipes');

            // 4. Ingredients Sheet
            if (ingredients && ingredients.length > 0) {
                const ingredientsData = [
                    ['🥬 INGREDIENTS DATABASE'],
                    [''],
                    ['#', 'Ingredient Name', 'ID']
                ];
                ingredients.forEach((ingredient, index) => {
                    ingredientsData.push([
                        index + 1,
                        ingredient.name,
                        ingredient._id
                    ]);
                });
                ingredientsData.push([''], ['Total Ingredients:', ingredients.length]);
                
                const ingredientsSheet = XLSX.utils.aoa_to_sheet(ingredientsData);
                ingredientsSheet['!cols'] = [
                    { wch: 8 },
                    { wch: 40 },
                    { wch: 30 }
                ];
                XLSX.utils.book_append_sheet(wb, ingredientsSheet, '🥬 Ingredients');
            }

            // 5. Recipe Categories Distribution
            const categoriesData = [
                [`📁 RECIPE CATEGORIES - ${timeRangeLabel}`],
                [''],
                ['Category', 'Count', 'Percentage', 'Visual']
            ];
            const totalCategoryRecipes = getRecipeCategoriesData().reduce((sum, cat) => sum + cat.value, 0);
            getRecipeCategoriesData().forEach((cat, index) => {
                const percentage = ((cat.value / totalCategoryRecipes) * 100).toFixed(1);
                const bars = '█'.repeat(Math.round(percentage / 5));
                categoriesData.push([
                    cat.name,
                    cat.value,
                    `${percentage}%`,
                    bars
                ]);
            });
            categoriesData.push([''], ['Total:', totalCategoryRecipes, '100%']);
            
            const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
            categoriesSheet['!cols'] = [
                { wch: 20 },
                { wch: 10 },
                { wch: 12 },
                { wch: 30 }
            ];
            XLSX.utils.book_append_sheet(wb, categoriesSheet, '📁 Categories');

            // 6. Popular Cuisines
            const cuisinesData = [
                [`🌍 POPULAR CUISINES - ${timeRangeLabel}`],
                [''],
                ['Rank', 'Cuisine', 'Count', 'Percentage', 'Visual']
            ];
            const totalCuisineRecipes = getPopularCuisinesData().reduce((sum, c) => sum + c.value, 0);
            getPopularCuisinesData().forEach((cuisine, index) => {
                const percentage = ((cuisine.value / totalCuisineRecipes) * 100).toFixed(1);
                const bars = '█'.repeat(Math.round(percentage / 5));
                cuisinesData.push([
                    `#${index + 1}`,
                    cuisine.name,
                    cuisine.value,
                    `${percentage}%`,
                    bars
                ]);
            });
            cuisinesData.push([''], ['', 'Total:', totalCuisineRecipes, '100%']);
            
            const cuisinesSheet = XLSX.utils.aoa_to_sheet(cuisinesData);
            cuisinesSheet['!cols'] = [
                { wch: 8 },
                { wch: 20 },
                { wch: 10 },
                { wch: 12 },
                { wch: 30 }
            ];
            XLSX.utils.book_append_sheet(wb, cuisinesSheet, '🌍 Cuisines');

            // 7. User Growth Data
            const userGrowthData = [
                [`📈 USER GROWTH - ${timeRangeLabel}`],
                [''],
                ['Date', 'Total Users', 'Growth']
            ];
            const growthData = getUserGrowthData();
            growthData.forEach((item, index) => {
                const growth = index > 0 ? item.users - growthData[index - 1].users : 0;
                const growthIcon = growth > 0 ? '📈' : growth < 0 ? '📉' : '➡️';
                userGrowthData.push([
                    item.date,
                    item.users,
                    `${growthIcon} ${growth >= 0 ? '+' : ''}${growth}`
                ]);
            });
            
            const userGrowthSheet = XLSX.utils.aoa_to_sheet(userGrowthData);
            userGrowthSheet['!cols'] = [
                { wch: 15 },
                { wch: 15 },
                { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, userGrowthSheet, '📈 User Growth');

            // 8. Recipe Creation Trend
            const recipeTrendData = [
                [`📊 RECIPE CREATION TREND - ${timeRangeLabel}`],
                [''],
                ['Date', 'Total Recipes', 'Admin Recipes', 'User Recipes', 'Trend']
            ];
            const trendData = getRecipeCreationTrendData();
            trendData.forEach((item, index) => {
                const trend = index > 0 ? item.total - trendData[index - 1].total : 0;
                const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
                recipeTrendData.push([
                    item.date,
                    item.total,
                    item.admin,
                    item.user,
                    `${trendIcon} ${trend >= 0 ? '+' : ''}${trend}`
                ]);
            });
            
            const recipeTrendSheet = XLSX.utils.aoa_to_sheet(recipeTrendData);
            recipeTrendSheet['!cols'] = [
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(wb, recipeTrendSheet, '📊 Recipe Trend');

            // 9. Dietary Preferences
            if (dietaryPreferencesData.length > 0) {
                const dietaryData = [
                    ['🥗 DIETARY PREFERENCES'],
                    [''],
                    ['Dietary Tag', 'Recipe Count', 'Percentage', 'Visual']
                ];
                const totalDietary = dietaryPreferencesData.reduce((sum, d) => sum + d.value, 0);
                dietaryPreferencesData.forEach(diet => {
                    const percentage = ((diet.value / totalDietary) * 100).toFixed(1);
                    const bars = '█'.repeat(Math.round(percentage / 5));
                    dietaryData.push([
                        diet.subject,
                        diet.value,
                        `${percentage}%`,
                        bars
                    ]);
                });
                dietaryData.push([''], ['Total:', totalDietary, '100%']);
                
                const dietarySheet = XLSX.utils.aoa_to_sheet(dietaryData);
                dietarySheet['!cols'] = [
                    { wch: 20 },
                    { wch: 15 },
                    { wch: 12 },
                    { wch: 30 }
                ];
                XLSX.utils.book_append_sheet(wb, dietarySheet, '🥗 Dietary');
            }

            // Generate Excel file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Save file with time range in filename
            const fileName = `FoodHub_${timeRangeLabel}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            saveAs(data, fileName);
            
            setExportLoading(false);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            setExportLoading(false);
            alert('Failed to export data to Excel. Please try again.');
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
                    <motion.button
                        className="export-btn"
                        onClick={exportToExcel}
                        disabled={exportLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <i className={`bx ${exportLoading ? 'bx-loader-alt bx-spin' : 'bx-download'}`}></i>
                        {exportLoading ? 'Exporting...' : 'Export to Excel'}
                    </motion.button>
                </div>
            </motion.div>

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