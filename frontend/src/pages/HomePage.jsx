import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import SkeletonCard from '../components/SkeletonCard';
import { storageUrl } from '../api/config';

const initialFilters = {
    min_price: '',
    max_price: '',
    stock_status: '',
    min_rating: '',
    promo_only: false,
};

const badgeStyle = {
    promo: { background: '#dc2626', color: 'white' },
    new: { background: '#2563eb', color: 'white' },
    warning: { background: '#f59e0b', color: 'white' },
    danger: { background: '#dc2626', color: 'white' },
    rating: { background: '#16a34a', color: 'white' },
};

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [totalProducts, setTotalProducts] = useState(0);
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [sortOption, setSortOption] = useState('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [searchHistory, setSearchHistory] = useState(() => JSON.parse(localStorage.getItem('search_history') || '[]'));

    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const isClient = user && user.role === 'client';

    const fetchProducts = async (overrides = {}) => {
        setLoading(true);
        try {
            const next = {
                search: searchTerm,
                categoryId: selectedCategory,
                sort: sortOption,
                filters,
                ...overrides,
            };

            const params = new URLSearchParams();
            if (next.search) params.append('search', next.search);
            if (next.categoryId) params.append('category_id', next.categoryId);
            params.append('sort', next.sort);

            Object.entries(next.filters).forEach(([key, value]) => {
                if (value === true) params.append(key, '1');
                else if (value !== false && value !== '') params.append(key, value);
            });

            const response = await api.get(`/products?${params.toString()}`);
            setProducts(response.data.data || []);
            setTotalProducts(response.data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.categories || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFavorites = async () => {
        if (!isClient) return;
        try {
            const response = await api.get('/favorites');
            setFavoriteIds(response.data.map((favorite) => favorite.product_id));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchFavorites();
    }, [sortOption]);

    const handleCategorySelect = (catId) => {
        setSelectedCategory(catId);
        fetchProducts({ categoryId: catId });
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.trim()) {
            const nextHistory = [term.trim(), ...searchHistory.filter((item) => item !== term.trim())].slice(0, 5);
            setSearchHistory(nextHistory);
            localStorage.setItem('search_history', JSON.stringify(nextHistory));
        }
        fetchProducts({ search: term });
    };

    const applyFilters = (event) => {
        event.preventDefault();
        fetchProducts();
    };

    const resetFilters = () => {
        setFilters(initialFilters);
        setSearchTerm('');
        setSelectedCategory(null);
        fetchProducts({ search: '', categoryId: null, filters: initialFilters });
    };

    const showPromotions = () => {
        const promoFilters = { ...initialFilters, promo_only: true };
        setFilters(promoFilters);
        fetchProducts({ filters: promoFilters });
    };

    const handleAddToCart = async (event, product) => {
        event.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            await addToCart(product.id, 1);
        } catch (err) {
            alert("Erreur lors de l'ajout au panier.");
        }
    };

    const toggleFavorite = async (event, productId) => {
        event.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (favoriteIds.includes(productId)) {
                await api.delete(`/favorites/${productId}`);
                setFavoriteIds((prev) => prev.filter((id) => id !== productId));
            } else {
                await api.post('/favorites', { product_id: productId });
                setFavoriteIds((prev) => [...prev, productId]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getImageUrl = storageUrl;
    const promoProducts = products.filter((product) => product.is_promo).slice(0, 4);
    const newProducts = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);
    const topRatedProducts = [...products].filter((product) => Number(product.reviews_avg_rating || 0) > 0).sort((a, b) => Number(b.reviews_avg_rating || 0) - Number(a.reviews_avg_rating || 0)).slice(0, 4);
    const lowStockProducts = products.filter((product) => product.quantity > 0 && product.quantity <= 5).slice(0, 4);

    return (
        <Layout
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onSearch={handleSearch}
        >
            <section className="home-hero">
                <div className="hero-content">
                    <span className="hero-kicker">Boutique en ligne</span>
                    <h1>Des produits selectionnes, livres rapidement.</h1>
                    <p>
                        Decouvrez les nouveautes, les promotions et les meilleures ventes avec une experience simple et rapide.
                    </p>
                    <div className="hero-actions">
                        <button className="hero-btn" onClick={showPromotions}>
                            Voir les promotions
                        </button>
                        <button className="hero-btn secondary" onClick={resetFilters}>
                            Tous les produits
                        </button>
                    </div>
                </div>
                <div className="hero-panel">
                    <div className="hero-stat">
                        <strong>{totalProducts}</strong>
                        <span>Produits disponibles</span>
                    </div>
                    <div className="hero-stat">
                        <strong>24h</strong>
                        <span>Traitement rapide</span>
                    </div>
                    <div className="hero-stat">
                        <strong>100 pts</strong>
                        <span>10 Dhs fidelite</span>
                    </div>
                </div>
            </section>

            <section className="service-strip">
                <div><strong>Paiement simule</strong><span>Carte, PayPal ou livraison</span></div>
                <div><strong>Suivi commande</strong><span>Confirmee, expediee, livree</span></div>
                <div><strong>Support client</strong><span>Messagerie et notifications</span></div>
            </section>

            {!loading && (
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
                    <DynamicMiniSection title="Promotions" items={promoProducts} />
                    <DynamicMiniSection title="Nouveautes" items={newProducts} />
                    <DynamicMiniSection title="Mieux notes" items={topRatedProducts} />
                    <DynamicMiniSection title="Stock limite" items={lowStockProducts} />
                </section>
            )}

            <div className="card-white" style={{ marginBottom: 18, padding: 14 }}>
                <form onSubmit={applyFilters} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'end' }}>
                    <div>
                        <label style={labelStyle}>Prix min</label>
                        <input style={inputStyle} type="number" min="0" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} placeholder="0" />
                    </div>
                    <div>
                        <label style={labelStyle}>Prix max</label>
                        <input style={inputStyle} type="number" min="0" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} placeholder="9999" />
                    </div>
                    <div>
                        <label style={labelStyle}>Stock</label>
                        <select style={inputStyle} value={filters.stock_status} onChange={(e) => setFilters({ ...filters, stock_status: e.target.value })}>
                            <option value="">Tous</option>
                            <option value="in_stock">En stock</option>
                            <option value="low_stock">Stock limite</option>
                            <option value="out_of_stock">Rupture</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Note min</label>
                        <select style={inputStyle} value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })}>
                            <option value="">Toutes</option>
                            <option value="3">3/5 ou plus</option>
                            <option value="4">4/5 ou plus</option>
                            <option value="5">5/5</option>
                        </select>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.84rem', paddingBottom: 8 }}>
                        <input type="checkbox" checked={filters.promo_only} onChange={(e) => setFilters({ ...filters, promo_only: e.target.checked })} />
                        Promo seulement
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" className="btn-cart" style={{ padding: '9px 12px' }}>Filtrer</button>
                        <button type="button" onClick={resetFilters} style={{ padding: '9px 12px', border: '1px solid var(--border)', background: 'white', borderRadius: 5, cursor: 'pointer', fontWeight: 700 }}>Reset</button>
                    </div>
                </form>
                {searchHistory.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <strong style={{ color: '#64748B', fontSize: '0.82rem' }}>Recherches recentes :</strong>
                        {searchHistory.map((term) => (
                            <button key={term} onClick={() => handleSearch(term)} style={{ border: '1px solid var(--border)', background: '#F8FAFC', borderRadius: 999, padding: '5px 10px', cursor: 'pointer', fontWeight: 700 }}>
                                {term}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!loading && (
                <div className="products-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--dark)' }}>Catalogue produits</h2>
                        <span><strong>{totalProducts}</strong> produit(s) trouve(s)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Trier par :</span>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            style={{ padding: '7px 12px', border: '1px solid #ccc', borderRadius: 5, fontSize: '0.85rem', outline: 'none' }}
                        >
                            <option value="newest">Nouveautes d'abord</option>
                            <option value="price_asc">Prix croissant</option>
                            <option value="price_desc">Prix decroissant</option>
                            <option value="rating_desc">Mieux notes</option>
                            <option value="name_asc">Nom (A-Z)</option>
                        </select>
                    </div>
                </div>
            )}

            {loading ? (
                <SkeletonCard count={8} />
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Aucun produit trouve.</div>
            ) : (
                <div className="product-grid">
                    {products.map((product) => {
                        const imgUrl = getImageUrl(product.image);
                        const isFav = favoriteIds.includes(product.id);
                        const rating = Number(product.reviews_avg_rating || 0);

                        return (
                            <div key={product.id} className="product-card" onClick={() => navigate(`/products/${product.id}`)} style={{ cursor: 'pointer' }}>
                                <div style={{ position: 'absolute', top: 9, left: 9, zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: '72%' }}>
                                    {(product.badges || []).map((badge) => (
                                        <span key={`${product.id}-${badge.type}-${badge.label}`} style={{ ...productBadgeStyle, ...(badgeStyle[badge.type] || badgeStyle.new) }}>
                                            {badge.label}
                                        </span>
                                    ))}
                                </div>

                                {isClient && (
                                    <button
                                        onClick={(event) => toggleFavorite(event, product.id)}
                                        style={{
                                            position: 'absolute', top: 8, right: 8, zIndex: 3,
                                            width: 30, height: 30, borderRadius: '50%',
                                            border: 'none', cursor: 'pointer', fontSize: '0.9rem',
                                            background: isFav ? '#dc3545' : 'rgba(255,255,255,0.9)',
                                            color: isFav ? 'white' : '#dc3545',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                                        }}
                                    >
                                        {isFav ? '♥' : '♡'}
                                    </button>
                                )}

                                {imgUrl ? (
                                    <img src={imgUrl} alt={product.name} className="card-img" />
                                ) : (
                                    <div className="card-img-placeholder">Produit</div>
                                )}

                                <div className="card-body">
                                    <div className="card-category">{product.category?.name}</div>
                                    <div className="card-name">{product.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                                        {product.is_promo && product.old_price && (
                                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.78rem' }}>
                                                {Number(product.old_price).toFixed(2)}
                                            </span>
                                        )}
                                        <div className="card-price" style={{ marginBottom: 0 }}>{Number(product.price).toFixed(2)} Dhs</div>
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: rating > 0 ? '#f59e0b' : '#888', marginBottom: 10, fontWeight: 700 }}>
                                        {rating > 0 ? `Note ${rating.toFixed(1)}/5 (${product.reviews_count || 0})` : 'Pas encore note'}
                                    </div>
                                    <div className="card-actions">
                                        <Link to={`/products/${product.id}`} className="btn-detail" onClick={(event) => event.stopPropagation()}>
                                            Details
                                        </Link>
                                        {(!user || user.role === 'client') && (
                                            <button className="btn-cart" disabled={product.quantity <= 0} onClick={(event) => handleAddToCart(event, product)}>
                                                Ajouter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
};

const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    color: '#666',
    fontWeight: 700,
    marginBottom: 5,
};

const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 5,
    outline: 'none',
    fontSize: '0.84rem',
};

const productBadgeStyle = {
    borderRadius: 999,
    padding: '3px 8px',
    fontSize: '0.68rem',
    fontWeight: 800,
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
};

export default HomePage;

const DynamicMiniSection = ({ title, items }) => (
    <div className="card-white" style={{ padding: 14 }}>
        <h3 style={{ marginBottom: 10 }}>{title}</h3>
        {items.length === 0 ? (
            <div style={{ color: '#94A3B8', fontSize: '0.82rem' }}>Aucune donnee.</div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((product) => (
                    <Link key={`${title}-${product.id}`} to={`/products/${product.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.82rem' }}>
                        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                        <span style={{ color: '#F59E0B', fontWeight: 900 }}>{Number(product.price).toFixed(0)} Dhs</span>
                    </Link>
                ))}
            </div>
        )}
    </div>
);
