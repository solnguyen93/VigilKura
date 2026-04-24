import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();
const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        return token ? jwtDecode(token).user : null;
    });
    const [kidMode, setKidMode] = useState(false);
    const [msg, setMsg] = useState({ message: '', type: '' });

    // Auto-clear status messages after 3 seconds
    useEffect(() => {
        if (!msg.message) return;
        const timer = setTimeout(() => setMsg({ message: '', type: '' }), 3000);
        return () => clearTimeout(timer);
    }, [msg]);

    const register = async (name, username, email, password) => {
        try {
            const res = await axios.post(`${BASE_URL}/auth/register`, { name, username, email, password });
            localStorage.setItem('token', res.data.token);
            const decoded = jwtDecode(res.data.token).user;
            setUser(decoded);
            setMsg({ message: `Welcome, ${decoded.username}! Your account has been successfully created.`, type: 'success' });
        } catch (error) {
            setMsg({ message: error.response.data.message, type: 'danger' });
            throw new Error(error.response.data.message);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            const decoded = jwtDecode(res.data.token).user;
            setUser(decoded);
            setMsg({ message: `Welcome back, ${decoded.username}`, type: 'success' });
        } catch (error) {
            setMsg({ message: error.response.data.message, type: 'danger' });
            throw new Error(error.response.data.message);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setMsg({ message: 'Logged out successfully', type: 'success' });
    };

    return (
        <AuthContext.Provider value={{ user, setUser, kidMode, setKidMode, register, login, logout, msg, setMsg }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
