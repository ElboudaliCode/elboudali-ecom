import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';

const AdminCouponsPage = () => {
    const { user } = useContext(AuthContext);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        code: '', type: 'fixed', value: '', max_uses: '', expires_at: ''
    });

    useEffect(() => { fetchCoupons(); }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const r = await api.get('/admin/coupons');
            setCoupons(r.data);
        } catch (e) { setError('Erreur de chargement.'); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditId(null);
        setFormData({ code: '', type: 'fixed', value: '', max_uses: '', expires_at: '' });
        setShowForm(true); setError(null); setSuccess(null);
    };

    const openEdit = (c) => {
        setEditId(c.id);
        setFormData({
            code: c.code, type: c.type, value: c.value,
            max_uses: c.max_uses || '',
            expires_at: c.expires_at ? c.expires_at.split('T')[0] : ''
        });
        setShowForm(true); setError(null); setSuccess(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(null); setSuccess(null);
        const payload = { ...formData };
        if (!payload.max_uses) delete payload.max_uses;
        if (!payload.expires_at) delete payload.expires_at;
        try {
            if (editId) {
                await api.put(`/admin/coupons/${editId}`, payload);
                setSuccess('Coupon mis à jour.');
            } else {
                await api.post('/admin/coupons', payload);
                setSuccess('Coupon créé avec succès.');
            }
            setShowForm(false); fetchCoupons();
        } catch (e) {
            const errs = e.response?.data?.errors;
            setError(errs ? Object.values(errs).flat().join(' | ') : 'Erreur de validation.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce coupon ?')) return;
        try {
            await api.delete(`/admin/coupons/${id}`);
            setSuccess('Coupon supprimé.'); fetchCoupons();
        } catch (e) { setError('Erreur lors de la suppression.'); }
    };

    if (!user || user.role !== 'admin') return <Navigate to="/" />;

    return (
        <Layout>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '0.83rem', color: '#888' }}>
                        <Link to="/dashboard" style={{ color: '#FFA500' }}>Tableau de bord</Link> › Coupons Promotionnels
                    </span>
                    <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>🎟️ Gestion des Codes Promos</h2>
                </div>
                <button className="btn-cart" onClick={openCreate} style={{ padding: '8px 18px', borderRadius: '5px' }}>
                    + Nouveau coupon
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Formulaire */}
            {showForm && (
                <div className="card-white" style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '15px' }}>{editId ? '📝 Modifier le coupon' : '➕ Créer un coupon'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Code promo</label>
                                <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="Ex: PROMO20" required />
                            </div>
                            <div className="form-group">
                                <label>Type de réduction</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }}>
                                    <option value="fixed">Montant fixe (Dhs)</option>
                                    <option value="percentage">Pourcentage (%)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Valeur {formData.type === 'percentage' ? '(%)' : '(Dhs)'}</label>
                                <input type="number" step="0.01" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} required min="0" />
                            </div>
                            <div className="form-group">
                                <label>Nombre max d'utilisations</label>
                                <input type="number" value={formData.max_uses} onChange={e => setFormData({ ...formData, max_uses: e.target.value })} placeholder="Illimité si vide" min="1" />
                            </div>
                            <div className="form-group">
                                <label>Date d'expiration</label>
                                <input type="date" value={formData.expires_at} onChange={e => setFormData({ ...formData, expires_at: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn-cart" style={{ flex: 1, padding: '10px' }}>
                                {editId ? 'Enregistrer' : 'Créer le coupon'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tableau */}
            <div className="card-white">
                {loading ? <div style={{ textAlign: 'center', padding: '30px' }}>⏳ Chargement...</div> : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Type</th>
                                    <th>Valeur</th>
                                    <th>Utilisations</th>
                                    <th>Expiration</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>Aucun coupon créé.</td></tr>
                                ) : coupons.map(c => {
                                    const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                                    const isUsedUp = c.max_uses && c.used_count >= c.max_uses;
                                    const isActive = !isExpired && !isUsedUp;
                                    return (
                                        <tr key={c.id}>
                                            <td><code style={{ background: '#f5f5f5', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, color: '#FFA500' }}>{c.code}</code></td>
                                            <td><span className={`badge ${c.type === 'percentage' ? 'badge-info' : 'badge-secondary'}`}>{c.type === 'percentage' ? 'Pourcentage' : 'Fixe'}</span></td>
                                            <td style={{ fontWeight: 600 }}>{c.type === 'percentage' ? `${c.value}%` : `${c.value} Dhs`}</td>
                                            <td style={{ color: '#555' }}>{c.used_count || 0} / {c.max_uses || '∞'}</td>
                                            <td style={{ color: isExpired ? '#dc3545' : '#555', fontSize: '0.83rem' }}>
                                                {c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-FR') : 'Aucune'}
                                            </td>
                                            <td><span className={`badge ${isActive ? 'badge-warning' : 'badge-danger'}`}>{isActive ? 'Actif' : 'Expiré'}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => openEdit(c)} style={{ padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Modifier</button>
                                                    <button onClick={() => handleDelete(c.id)} style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Supprimer</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminCouponsPage;
