import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../styles/NavBar.css';

const NavBar = () => {
    const { user, logout, kidMode } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogOut = () => {
        logout();
        navigate('/vigilkura');
    };

    return (
        <nav className="navbar">
            {user ? (
                <>
                    <div className="leftNav">{kidMode ? <span>VigilKura</span> : <Link to="/monitor">VigilKura</Link>}</div>
                    {!kidMode && (
                        <div className="rightNav">
                            <Link to="/history">History</Link>
                            <Link to="/settings">Settings</Link>
                            <Link to={`/user/${user.username}`}>{user.name.length > 15 ? `${user.name.slice(0, 15)}...` : user.name}</Link>
                            <button className="navbar-link-btn" onClick={handleLogOut}>Log out</button>
                        </div>
                    )}
                </>
            ) : (
                <nav>
                    {location.pathname === '/' && <Link to="/vigilkura">Sign In</Link>}
                    {location.pathname === '/vigilkura' && <Link to="/">About</Link>}
                </nav>
            )}
        </nav>
    );
};

export default NavBar;
