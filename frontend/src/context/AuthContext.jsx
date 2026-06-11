import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
    const [loading, setLoading] = useState(true);

    // Charger les infos de l'utilisateur si un token existe
    useEffect(() => {
        if (token) {
            api.get('/me')
                .then(response => {
                    setUser(response.data.user);
                })
                .catch(() => {
                    // Token invalide ou expiré
                    logout();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (credentials) => {
        const response = await api.post('/login', credentials);
        const { token, user } = response.data;
        localStorage.setItem('auth_token', token);
        setToken(token);
        setUser(user);
        return response.data;
    };

    const register = async (userData) => {
        const response = await api.post('/register', userData);
        const { token, user } = response.data;
        localStorage.setItem('auth_token', token);
        setToken(token);
        setUser(user);
        return response.data;
    };

    const logout = async () => {
        try {
            if (token) {
                await api.post('/logout');
            }
        } catch (error) {
            console.error("Erreur lors de la déconnexion", error);
        } finally {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
