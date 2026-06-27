import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api from '../api/axios';
import { storageUrl } from '../api/config';
import { storeConfig, whatsappUrl } from '../config/store';

const Layout = ({ children, onSearch, categories, selectedCategory, onCategorySelect }) => {
    const { user, logout } = useContext(AuthContext);
    const { cartItemsCount } = useContext(CartContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Toutes');
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (searchTerm.trim().length <= 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const delay = setTimeout(async () => {
            try {
                const response = await api.get(`/products/search/suggestions?q=${encodeURIComponent(searchTerm)}`);
                setSuggestions(response.data);
                setShowSuggestions(true);
            } catch (error) {
                console.error(error);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [searchTerm]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!event.target.closest('.search-bar-container')) setShowSuggestions(false);
            if (!event.target.closest('.notifications-container')) setShowNotifs(false);
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/read');
            fetchNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        if (onSearch) onSearch(searchTerm);
    };

    const unreadCount = notifications.filter((notification) => !notification.is_read).length;

    const roleLabel = user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

    return (
        <div>
            <div className="topbar">
                <div className="topbar-copy">Livraison rapide partout au Maroc - Support {storeConfig.supportHours} - Paiement securise</div>
                <div className="topbar-actions">
                    <button className="topbar-theme" onClick={() => setIsDarkMode(!isDarkMode)}>
                        {isDarkMode ? 'Mode clair' : 'Mode sombre'}
                    </button>
                    <Link to="/contact" className="topbar-link">Contact</Link>
                    <Link to="/" className="topbar-link">Accueil</Link>
                </div>
            </div>

            <header className="header">
                <Link to="/" className="logo">
                    <span className="logo-mark">{storeConfig.name.charAt(0).toUpperCase()}</span>
                    <span>
                        {storeConfig.name}
                        <small>{storeConfig.tagline}</small>
                    </span>
                </Link>

                <div className="search-bar-container">
                    <form className="search-bar" onSubmit={handleSearch}>
                        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                            <option>Toutes</option>
                            {categories?.map((category) => (
                                <option key={category.id} value={category.name}>{category.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        />
                        <button type="submit" className="search-btn">Rechercher</button>
                    </form>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="suggestions-dropdown">
                            {suggestions.map((product) => {
                                const imgUrl = storageUrl(product.image);
                                return (
                                    <Link
                                        key={product.id}
                                        to={`/products/${product.id}`}
                                        onClick={() => {
                                            setShowSuggestions(false);
                                            setSearchTerm('');
                                        }}
                                        className="suggestion-item"
                                    >
                                        {imgUrl ? <img src={imgUrl} alt={product.name} /> : <div className="suggestion-placeholder">P</div>}
                                        <div>
                                            <strong>{product.name}</strong>
                                            <span>{Number(product.price).toFixed(2)} Dhs</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="header-actions">
                    {user ? (
                        <>
                            <div className="notifications-container">
                                <button
                                    className="header-action-btn"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setShowNotifs((prev) => !prev);
                                        if (!showNotifs) fetchNotifications();
                                    }}
                                >
                                    Notifications
                                    {unreadCount > 0 && <span className="action-count">{unreadCount}</span>}
                                </button>

                                {showNotifs && (
                                    <div className="notifications-dropdown">
                                        <div className="notifications-head">
                                            <strong>Notifications</strong>
                                            {unreadCount > 0 && (
                                                <button onClick={(event) => { event.stopPropagation(); handleMarkAllRead(); }}>
                                                    Tout lire
                                                </button>
                                            )}
                                        </div>
                                        <div className="notifications-list">
                                            {notifications.length === 0 ? (
                                                <div className="empty-notification">Aucune notification</div>
                                            ) : notifications.map((notification) => (
                                                <div key={notification.id} className={`notification-item ${notification.is_read ? '' : 'unread'}`}>
                                                    <span>{notification.message}</span>
                                                    <small>{new Date(notification.created_at).toLocaleString('fr-FR')}</small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Link to="/profile" className="profile-link">
                                <span className="avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                <span>{user.name}</span>
                                <small>{roleLabel}</small>
                            </Link>

                            {user.role === 'client' && (
                                <Link to="/cart" className="header-action-btn">
                                    Panier
                                    {cartItemsCount > 0 && <span className="action-count">{cartItemsCount}</span>}
                                </Link>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className="login-link">Se connecter</Link>
                    )}
                </div>
            </header>

            <nav className="bottom-nav">
                <Link to="/">Accueil</Link>
                <Link to="/about">A propos</Link>
                <Link to="/contact">Contact</Link>
                {user && (user.role === 'admin' || user.role === 'superviseur') && (
                    <>
                        <Link to="/dashboard">Tableau de bord</Link>
                        <Link to="/admin/products">Produits</Link>
                        <Link to="/admin/orders">Commandes</Link>
                        <Link to="/admin/delivery">Livraison</Link>
                        <Link to="/admin/returns">Retours</Link>
                        <Link to="/admin/categories">Categories</Link>
                        <Link to="/admin/logs">Logs</Link>
                        <Link to="/admin/contact-messages">Messages</Link>
                    </>
                )}
                {user?.role === 'admin' && (
                    <>
                        <Link to="/admin/users">Utilisateurs</Link>
                        <Link to="/admin/coupons">Coupons</Link>
                    </>
                )}
                {user?.role === 'client' && (
                    <>
                        <Link to="/favorites">Favoris</Link>
                        <Link to="/compare">Comparer</Link>
                        <Link to="/orders">Historique</Link>
                        <Link to="/returns">Retours</Link>
                    </>
                )}
                {!user && <Link to="/compare">Comparer</Link>}
                {user && <Link to="/support">Support</Link>}
                {user ? (
                    <button onClick={logout} className="logout-btn">Deconnexion</button>
                ) : (
                    <>
                        <Link to="/register" className="nav-push">Creer un compte</Link>
                        <Link to="/login">Connexion</Link>
                    </>
                )}
            </nav>

            <div className="page-container">
                {categories && (
                    <aside className="sidebar">
                        <div className="sidebar-header">Categories</div>
                        <div className="sidebar-all-cat" onClick={() => onCategorySelect && onCategorySelect(null)}>
                            Toutes les categories
                        </div>
                        {categories.map((category) => (
                            <React.Fragment key={category.id}>
                                <div
                                    className={`sidebar-cat-item ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => onCategorySelect && onCategorySelect(category.id)}
                                >
                                    <span className="arrow">›</span>
                                    {category.name}
                                </div>
                                {category.children?.map((child) => (
                                    <div
                                        key={child.id}
                                        className={`sidebar-sub-item ${selectedCategory === child.id ? 'active' : ''}`}
                                        onClick={() => onCategorySelect && onCategorySelect(child.id)}
                                    >
                                        {child.name}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </aside>
                )}

                <main className="main-content">{children}</main>
            </div>

            <footer className="footer site-footer">
                <div className="footer-brand">
                    <span className="logo-mark footer-logo-mark">{storeConfig.name.charAt(0).toUpperCase()}</span>
                    <div>
                        <strong>{storeConfig.name}</strong>
                        <small>{storeConfig.tagline}</small>
                    </div>
                </div>
                <div className="footer-links">
                    <Link to="/">Accueil</Link>
                    <Link to="/about">A propos</Link>
                    <Link to="/contact">Contact</Link>
                    {user && <Link to="/support">Support</Link>}
                    <Link to="/compare">Comparer</Link>
                    <Link to="/privacy">Confidentialite</Link>
                    <Link to="/terms">CGV</Link>
                    <Link to="/shipping-returns">Livraison & retours</Link>
                </div>
                <div className="footer-contact">
                    <strong>{storeConfig.phone}</strong>
                    <span>{storeConfig.email}</span>
                </div>
            </footer>

            <a
                className="whatsapp-float"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
            >
                WhatsApp
            </a>
        </div>
    );
};

export default Layout;
