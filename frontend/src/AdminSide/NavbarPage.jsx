
import "./NavbarPage.scss";

const NavbarPage = ({ user, onLogout }) => (
    <nav className="admin-navbar">
        <div className="navbar-left">
            <span className="navbar-title">🍳 FoodHub Admin Panel</span>
        </div>
        <div className="navbar-center">
            <span className="navbar-welcome">
                Welcome back, {user?.name}!
            </span>
        </div>
        <div className="navbar-right">
            <button className="logout-btn" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i>
                Logout
            </button>
        </div>
    </nav>
);

export default NavbarPage;