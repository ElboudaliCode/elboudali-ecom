import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const { user } = useContext(AuthContext);

    // Charger le panier depuis l'API si l'utilisateur est connecté
    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            setCart(null);
            setCartItemsCount(0);
        }
    }, [user]);

    const fetchCart = async () => {
        try {
            const response = await api.get('/cart');
            setCart(response.data);
            
            // Calculer le nombre total d'articles
            if (response.data && response.data.items) {
                const total = response.data.items.reduce((acc, item) => acc + item.quantity, 0);
                setCartItemsCount(total);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération du panier", error);
        }
    };

    const addToCart = async (productId, quantity = 1) => {
        try {
            await api.post('/cart/add', { product_id: productId, quantity });
            await fetchCart(); // Rafraîchir le panier
            return true;
        } catch (error) {
            console.error("Erreur ajout panier", error);
            throw error;
        }
    };

    const updateQuantity = async (itemId, newQuantity) => {
        try {
            await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });
            await fetchCart();
        } catch (error) {
            console.error("Erreur mise à jour quantité", error);
            throw error;
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            await api.delete(`/cart/items/${itemId}`);
            await fetchCart();
        } catch (error) {
            console.error("Erreur suppression article", error);
        }
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart/clear');
            setCart(null);
            setCartItemsCount(0);
        } catch (error) {
            console.error("Erreur vidage panier", error);
        }
    };

    return (
        <CartContext.Provider value={{ cart, cartItemsCount, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
