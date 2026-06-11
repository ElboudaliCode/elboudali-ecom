import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { storageUrl } from '../api/config';

const AdminProductsPage = () => {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Formulaire d'édition / création
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        old_price: '',
        is_promo: false,
        quantity: '',
        category_id: '',
    });
    const [imageFile, setImageFile] = useState(null);

    // Recherche / pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCat, setSelectedCat] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'superviseur')) {
            fetchProducts();
            fetchCategories();
        }
    }, [user, page, selectedCat]);

    if (!user || (user.role !== 'admin' && user.role !== 'superviseur')) {
        return <Navigate to="/" />;
    }

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCat) params.append('category_id', selectedCat);

            const response = await api.get(`/products?${params.toString()}`);
            setProducts(response.data.data || []);
            setTotalPages(response.data.last_page || 1);
        } catch (err) {
            setError('Erreur lors du chargement des produits.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            // Aplatir pour le select (principales + enfants)
            const list = [];
            response.data.categories.forEach(cat => {
                list.push(cat);
                if (cat.children) list.push(...cat.children);
            });
            setCategories(list);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const handleResetSearch = () => {
        setSearchTerm('');
        setSelectedCat('');
        setPage(1);
    };

    const openCreateForm = () => {
        setEditId(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            old_price: '',
            is_promo: false,
            quantity: '',
            category_id: categories[0]?.id || '',
        });
        setImageFile(null);
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    const openEditForm = (prod) => {
        setEditId(prod.id);
        setFormData({
            name: prod.name,
            description: prod.description || '',
            price: prod.price,
            old_price: prod.old_price || '',
            is_promo: Boolean(prod.is_promo),
            quantity: prod.quantity,
            category_id: prod.category_id || '',
        });
        setImageFile(null);
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (formData.is_promo && formData.old_price && Number(formData.old_price) <= Number(formData.price)) {
            setError("L'ancien prix doit etre superieur au prix actuel pour une promotion.");
            return;
        }

        if (Number(formData.quantity) < 0 || Number(formData.price) < 0) {
            setError('Le prix et la quantite doivent etre positifs.');
            return;
        }

        // Préparation du FormData (nécessaire pour l'upload d'image)
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('old_price', formData.old_price || '');
        data.append('is_promo', formData.is_promo ? '1' : '0');
        data.append('quantity', formData.quantity);
        data.append('category_id', formData.category_id);
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (editId) {
                // Laravel attend POST avec _method=PUT ou une route personnalisée POST
                await api.post(`/products/${editId}/update`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setSuccess('Produit mis à jour avec succès.');
            } else {
                await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setSuccess('Produit créé avec succès.');
            }
            setShowForm(false);
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la validation du formulaire.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
        setError(null);
        setSuccess(null);
        try {
            await api.delete(`/products/${id}`);
            setSuccess('Produit supprimé.');
            fetchProducts();
        } catch (err) {
            setError('Erreur lors de la suppression.');
        }
    };

    return (
        <Layout>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '0.83rem', color: '#888' }}>
                        <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> › Gestion Produits
                    </span>
                    <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>📦 Gestion des Produits</h2>
                </div>
                <button className="btn-cart" onClick={openCreateForm} style={{ padding: '8px 18px', borderRadius: '5px' }}>
                    + Ajouter un produit
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* ---- FORMULAIRE D'AJOUT / MODIFICATION ---- */}
            {showForm && (
                <div className="card-white" style={{ marginBottom: '20px' }}>
                    <h3>{editId ? '📝 Modifier le produit' : '➕ Ajouter un produit'}</h3>
                    <form onSubmit={handleFormSubmit} style={{ marginTop: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Nom du produit</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Catégorie</label>
                                <select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }} required>
                                    <option value="">Sélectionner...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Prix (Dhs)</label>
                                <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Ancien prix promo</label>
                                <input type="number" step="0.01" value={formData.old_price} onChange={e => setFormData({ ...formData, old_price: e.target.value })} placeholder="Optionnel" />
                            </div>
                            <div className="form-group">
                                <label>Quantité en stock</label>
                                <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '28px', fontSize: '0.88rem', fontWeight: 600 }}>
                                <input type="checkbox" checked={formData.is_promo} onChange={e => setFormData({ ...formData, is_promo: e.target.checked })} />
                                Produit en promo
                            </label>
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }} />
                        </div>
                        <div className="form-group">
                            <label>Image du produit</label>
                            <input type="file" onChange={e => setImageFile(e.target.files[0])} accept="image/*" style={{ border: 'none', background: 'transparent' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn-cart" style={{ flex: 1, padding: '10px' }}>
                                {editId ? 'Enregistrer les modifications' : 'Créer le produit'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ---- BARRE DE RECHERCHE ---- */}
            <div className="card-white" style={{ marginBottom: '20px' }}>
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }} />
                    <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }}>
                        <option value="">Toutes les catégories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <button type="submit" className="btn-cart" style={{ padding: '8px 16px', borderRadius: '5px' }}>Filtrer</button>
                    <button type="button" onClick={handleResetSearch} style={{ padding: '8px 16px', background: 'none', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>Réinitialiser</button>
                </form>
            </div>

            {/* ---- TABLEAU DES PRODUITS ---- */}
            <div className="card-white">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>⏳ Chargement...</div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Aucun produit disponible.</div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Nom</th>
                                        <th>Catégorie</th>
                                        <th>Prix</th>
                                        <th>Stock</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(prod => {
                                        const imgUrl = storageUrl(prod.image);
                                        return (
                                            <tr key={prod.id}>
                                                <td>
                                                    <div style={{ width: '45px', height: '45px', borderRadius: '4px', overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {imgUrl ? <img src={imgUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🏷️</span>}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{prod.name}</td>
                                                <td><span className="badge badge-secondary">{prod.category?.name || 'N/A'}</span></td>
                                                <td style={{ color: '#FFA500', fontWeight: 600 }}>
                                                    {prod.is_promo && prod.old_price && (
                                                        <div style={{ color: '#999', textDecoration: 'line-through', fontSize: '0.75rem' }}>
                                                            {Number(prod.old_price).toFixed(2)} Dhs
                                                        </div>
                                                    )}
                                                    {Number(prod.price).toFixed(2)} Dhs
                                                    {prod.is_promo && <span className="badge badge-danger" style={{ marginLeft: '6px' }}>Promo</span>}
                                                </td>
                                                <td>
                                                    <span className={`badge ${prod.quantity === 0 ? 'badge-danger' : prod.quantity <= 5 ? 'badge-warning' : 'badge-success'}`}>
                                                        {prod.quantity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => openEditForm(prod)} style={{ padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                            Modifier
                                                        </button>
                                                        {user.role === 'admin' && (
                                                            <button onClick={() => handleDelete(prod.id)} style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                                Supprimer
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)} style={{ padding: '6px 12px', border: '1px solid #e0e0e0', background: page === p ? '#FFA500' : 'white', color: page === p ? 'white' : '#333', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default AdminProductsPage;
