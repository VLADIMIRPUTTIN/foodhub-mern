import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedCreateButton = ({ className, children, to = "/create-recipe" }) => {
    const { user } = useAuthStore();
    
    if (!user) {
        return (
            <Link to="/login" className={className}>
                {children}
            </Link>
        );
    }
    
    return (
        <Link to={to} className={className}>
            {children}
        </Link>
    );
};

export default ProtectedCreateButton;