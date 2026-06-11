import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const AdminCategoriesPage = () => {
    const { user } = useContext(AuthContext);
    const [categories, setCategories] = useState([]);
    const [allFlatCategories, setAllFlatCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Formulaire d'édition / création
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        seuil_alerte: 5,
        parent_id: ''
    });

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchCategories();
        }
    }, [user]);

    if (!user || user.role !== 'admin') {
        // Seuls les Admins peuvent gérer les catégories (les superviseurs consultent uniquement)
        return <Navigate to="/dashboard" />;
    }

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/categories');
            const tree = response.data.categories || [];
            setCategories(tree);

            // Créer une liste aplatie pour le sélecteur de catégories parentes (seulement les parents racines pour éviter des niveaux trop profonds)
            setAllFlatCategories(tree);
        } catch (err) {
            setError('Erreur lors du chargement des catégories.');
        } finally {
            setLoading(false);
        }
    };

    const openCreateForm = () => {
        setEditId(null);
        setFormData({
            name: '',
            description: '',
            seuil_alerte: 5,
            parent_id: ''
        });
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    const openEditForm = (cat) => {
        setEditId(cat.id);
        setFormData({
            name: cat.name,
            description: cat.description || '',
            seuil_alerte: cat.seuil_alerte || 5,
            parent_id: cat.parent_id || ''
        });
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const payload = {
            name: formData.name,
            description: formData.description,
            seuil_alerte: formData.seuil_alerte,
            parent_id: formData.parent_id === '' ? null : formData.parent_id
        };

        try {
            if (editId) {
                await api.put(`/categories/${editId}`, payload);
                setSuccess('Catégorie mise à jour avec succès.');
            } else {
                await api.post('/categories', payload);
                setSuccess('Catégorie créée avec succès.');
            }
            setShowForm(false);
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la validation.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie ? Toutes ses sous-catégories et produits associés pourraient être affectés.')) return;
        setError(null);
        setSuccess(null);
        try {
            await api.delete(`/categories/${id}`);
            setSuccess('Catégorie supprimée.');
            fetchCategories();
        } catch (err) {
            setError('Erreur lors de la suppression.');
        }
    };

    return (
        <Layout>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '0.83rem', color: '#888' }}>
                        <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> › Gestion Catégories
                    </span>
                    <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>🗂️ Gestion des Catégories</h2>
                </div>
                <button className="btn-cart" onClick={openCreateForm} style={{ padding: '8px 18px', borderRadius: '5px' }}>
                    + Ajouter une catégorie
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* ---- FORMULAIRE ---- */}
            {showForm && (
                <div className="card-white" style={{ marginBottom: '20px' }}>
                    <h3>{editId ? '📝 Modifier la catégorie' : '➕ Ajouter une catégorie'}</h3>
                    <form onSubmit={handleFormSubmit} style={{ marginTop: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Nom de la catégorie</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Catégorie parente (Optionnel)</label>
                                <select value={formData.parent_id} onChange={e => setFormData({ ...formData, parent_id: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }}>
                                    <option value="">Aucune (Catégorie principale)</option>
                                    {allFlatCategories.filter(c => c.id !== editId).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Seuil d'alerte de stock</label>
                                <input type="number" value={formData.seuil_alerte} onChange={e => setFormData({ ...formData, seuil_alerte: e.target.value })} required min="1" />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label>Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn-cart" style={{ flex: 1, padding: '10px' }}>
                                {editId ? 'Enregistrer les modifications' : 'Créer la catégorie'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ---- LISTE DES CATÉGORIES ---- */}
            <div className="card-white">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>⏳ Chargement...</div>
                ) : categories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Aucune catégorie configurée.</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Description</th>
                                    <th>Seuil Alerte</th>
                                    <th>Catégorie parente</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <React.Fragment key={cat.id}>
                                        {/* Catégorie principale */}
                                        <tr>
                                            <td style={{ fontWeight: 700, color: '#FFA500' }}>{cat.name}</td>
                                            <td>{cat.description || <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Aucune description</span>}</td>
                                            <td style={{ fontWeight: 600 }}>{cat.seuil_alerte}</td>
                                            <td><span className="badge badge-info">Principale</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => openEditForm(cat)} style={{ padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                        Modifier
                                                    </button>
                                                    <button onClick={() => handleDelete(cat.id)} style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Sous-catégories */}
                                        {cat.children && cat.children.map(child => (
                                            <tr key={child.id}>
                                                <td style={{ paddingLeft: '30px', fontWeight: 500 }}>↳ {child.name}</td>
                                                <td>{child.description || <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Aucune description</span>}</td>
                                                <td style={{ fontWeight: 600 }}>{child.seuil_alerte}</td>
                                                <td><span className="badge badge-secondary">{cat.name}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => openEditForm(child)} style={{ padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                            Modifier
                                                        </button>
                                                        <button onClick={() => handleDelete(child.id)} style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminCategoriesPage;
