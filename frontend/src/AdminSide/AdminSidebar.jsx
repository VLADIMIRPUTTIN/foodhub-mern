import { motion } from 'framer-motion';
import './AdminSidebar.scss';

const AdminSidebar = ({ activeTab, setActiveTab, pendingCount, isMinimized, setIsMinimized, isMobile, isMobileMenuOpen }) => {
    const menuItems = [
        { 
            key: 'dashboard', 
            icon: 'bx-grid-alt', 
            text: 'Dashboard',
            description: 'Overview & stats'
        },
        { 
            key: 'users', 
            icon: 'bx-group', 
            text: 'Users',
            description: 'Manage all users'
        },
        { 
            key: 'recipes', 
            icon: 'bx-book-open', 
            text: 'Recipes',
            description: 'View & edit recipes'
        },
        { 
            key: 'pending', 
            icon: 'bx-time-five', 
            text: 'Pending',
            description: 'Review submissions',
            badge: pendingCount
        },
        { 
            key: 'create', 
            icon: 'bx-plus-circle', 
            text: 'Create Recipe',
            description: 'Add new recipe'
        },
        { 
            key: 'create-ingredient', 
            icon: 'bx-leaf', 
            text: 'Add Ingredient',
            description: 'Add new ingredient'
        }
    ];

    const sidebarX = isMobile ? (isMobileMenuOpen ? 0 : -400) : 0;

    return (
        <motion.div 
            className={`admin-sidebar ${isMinimized ? 'minimized' : ''}`}
            initial={{ x: isMobile ? -400 : -300, opacity: 0 }}
animate={{
  x: sidebarX,
  opacity: 1,
  width: isMinimized ? '80px' : '280px',
}}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <div className="sidebar-header">
                <motion.button 
                    className="sidebar-logo-btn"
                    onClick={() => setIsMinimized(!isMinimized)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
                >
                    {isMinimized ? (
                        // When minimized, show just the icon
                        <motion.i 
                            className="bx bx-food-menu logo-icon"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 0 }}
                            transition={{ duration: 0.3 }}
                        ></motion.i>
                    ) : (
                        // When expanded, show icon + text
                        <>
                            <motion.i 
                                className="bx bx-food-menu logo-icon"
                                initial={{ rotate: 0 }}
                                animate={{ rotate: 0 }}
                                transition={{ duration: 0.3 }}
                            ></motion.i>
                            <motion.span
                                className="logo-text"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                FoodHub Admin
                            </motion.span>
                        </>
                    )}
                </motion.button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, index) => (
                    <motion.button
                        key={item.key}
                        className={`sidebar-item ${activeTab === item.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.key)}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                            delay: index * 0.1,
                            duration: 0.4,
                            ease: "easeOut"
                        }}
                        whileHover={{ 
                            x: isMinimized ? 0 : 8,
                            backgroundColor: "rgba(207, 153, 108, 0.1)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        title={isMinimized ? item.text : ''}
                    >
                        <div className="item-icon-wrapper">
                            <motion.i 
                                className={`bx ${item.icon}`}
                                whileHover={{ rotate: 8, scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            ></motion.i>
                        </div>
                        
                        {!isMinimized && (
                            <motion.div 
                                className="item-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="item-text">{item.text}</span>
                                <span className="item-description">{item.description}</span>
                            </motion.div>
                        )}

                        {item.badge > 0 && (
                            <motion.span 
                                className="item-badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.2 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                {item.badge}
                            </motion.span>
                        )}

                        {activeTab === item.key && (
                            <motion.div
                                className="active-indicator"
                                layoutId="activeTab"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <motion.div 
                    className="sidebar-stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <i className="bx bx-shield-quarter"></i>
                    {!isMinimized && (
                        <motion.div 
                            className="stats-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <span className="stats-label">Admin Panel</span>
                            <span className="stats-version">v2.0.0</span>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AdminSidebar;