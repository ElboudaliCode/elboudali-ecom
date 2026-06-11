import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import SkeletonCard from '../components/SkeletonCard';
import { storageUrl } from '../api/config';

const FavoritesPage = () => {
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sort, setSort] = useState('newest');
    const [notes, setNotes] = useState({});

    useEffect(() => { fetchFavorites(); }, []);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const response = await api.get('/favorites');
            setFavorites(response.data);
            setNotes(Object.fromEntries(response.data.map((favorite) => [favorite.product_id, favorite.note || ''])));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        return [...new Set(favorites.map((favorite) => favorite.product?.category?.name).filter(Boolean))];
    }, [favorites]);

    const filteredFavorites = useMemo(() => {
        let list = [...favorites];
        if (categoryFilter) {
            list = list.filter((favorite) => favorite.product?.category?.name === categoryFilter);
        }
        if (sort === 'price_asc') list.sort((a, b) => Number(a.product?.price || 0) - Number(b.product?.price || 0));
        if (sort === 'price_desc') list.sort((a, b) => Number(b.product?.price || 0) - Number(a.product?.price || 0));
        if (sort === 'name') list.sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));
        if (sort === 'newest') list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return list;
    }, [favorites, categoryFilter, sort]);

    const removeFavorite = async (productId) => {
        try {
            await api.delete(`/favorites/${productId}`);
            setFavorites((prev) => prev.filter((favorite) => favorite.product_id !== productId));
            flash('Produit retire des favoris.');
        } catch (error) {
            console.error(error);
        }
    };

    const saveNote = async (productId) => {
        try {
            await api.put(`/favorites/${productId}/note`, { note: notes[productId] || '' });
            flash('Note sauvegardee.');
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddToCart = async (product) => {
        await addToCart(product.id, 1);
        flash(`"${product.name}" ajoute au panier.`);
    };

    const flash = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 2200);
    };

    if (!user) return <Navigate to="/login" />;

    return (
        <Layout>
            <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/" style={{ color: '#F59E0B' }}>Accueil</Link> / Mes favoris
                </span>
                <h2 style={{ marginTop: 6, fontSize: '1.35rem', fontWeight: 900 }}>Wishlist et favoris</h2>
            </div>

            {success && <div className="alert alert-success">{success}</div>}

            <div className="card-white" style={{ marginBottom: 18, padding: 14 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} style={{ padding: '9px 12px' }}>
                        <option value="">Toutes les categories</option>
                        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <select value={sort} onChange={(event) => setSort(event.target.value)} style={{ padding: '9px 12px' }}>
                        <option value="newest">Ajout recent</option>
                        <option value="name">Nom</option>
                        <option value="price_asc">Prix croissant</option>
                        <option value="price_desc">Prix decroissant</option>
                    </select>
                    <strong style={{ color: '#64748B' }}>{filteredFavorites.length} favori(s)</strong>
                </div>
            </div>

            {loading ? (
                <SkeletonCard count={6} />
            ) : filteredFavorites.length === 0 ? (
                <div className="card-white" style={{ textAlign: 'center', padding: 45 }}>
                    <p style={{ color: '#888', marginBottom: 16 }}>Aucun favori pour ces filtres.</p>
                    <Link to="/" className="btn-cart" style={{ padding: '10px 24px', display: 'inline-block' }}>Decouvrir les produits</Link>
                </div>
            ) : (
                <div className="product-grid">
                    {filteredFavorites.map((favorite) => {
                        const product = favorite.product;
                        if (!product) return null;
                        const imgUrl = storageUrl(product.image);
                        return (
                            <div key={favorite.id} className="product-card">
                                {imgUrl ? <img src={imgUrl} alt={product.name} className="card-img" /> : <div className="card-img-placeholder">Produit</div>}
                                <div className="card-body">
                                    <div className="card-category">{product.category?.name}</div>
                                    <div className="card-name">{product.name}</div>
                                    <div className="card-price">{Number(product.price).toFixed(2)} Dhs</div>
                                    <textarea
                                        value={notes[product.id] || ''}
                                        onChange={(event) => setNotes({ ...notes, [product.id]: event.target.value })}
                                        placeholder="Note personnelle..."
                                        rows="2"
                                        style={{ width: '100%', padding: 8, fontSize: '0.8rem', marginBottom: 8 }}
                                    />
                                    <div className="card-actions">
                                        <Link to={`/products/${product.id}`} className="btn-detail">Details</Link>
                                        <button onClick={() => handleAddToCart(product)} className="btn-cart">Panier</button>
                                    </div>
                                    <div className="card-actions" style={{ marginTop: 8 }}>
                                        <button onClick={() => saveNote(product.id)} className="btn-detail" style={{ flex: 1 }}>Sauver note</button>
                                        <button onClick={() => removeFavorite(product.id)} style={{ flex: 1, border: 'none', borderRadius: 7, background: '#DC2626', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Retirer</button>
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

export default FavoritesPage;
