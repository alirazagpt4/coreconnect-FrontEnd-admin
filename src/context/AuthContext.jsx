import React, { createContext, useState, useEffect } from 'react';

// 1. Context Create karna
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initial State: LocalStorage se data uthana (agar pehle se login ho)
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // 2. Login Function: Jo Login page par use hoga
    const login = (newToken, userData) => {
        // State update karna
        setToken(newToken);
        setUser(userData);

        // LocalStorage mein save karna taake refresh par data na urey
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // 3. Logout Function: Header ke logout button ke liye
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // 4. Check if token is expired (Optional but good for later)
    useEffect(() => {
        if (!token) {
            logout();
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};