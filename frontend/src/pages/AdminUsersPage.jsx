import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';

const AdminUsersPage = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const r = await api.get('/admin/users');
            setUsers(r.data);
        } catch (e) { setError('Erreur lors du chargement des utilisateurs.'); }
        finally { setLoading(false); }
    };

    const handleRoleChange = async (userId, newRole) => {
        setError(null); setSuccess(null);
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setSuccess('Rôle mis à jour avec succès.');
            setTimeout(() => setSuccess(null), 3000);
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur lors de la modification du rôle.');
        }
    };

    const getRoleBadgeStyle = (role) => {
        if (role === 'admin') return { background: '#dc3545', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 };
        if (role === 'superviseur') return { background: '#007bff', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 };
        return { background: '#28a745', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 };
    };

    if (!user || user.role !== 'admin') return <Navigate to="/" />;

    return (
        <Layout>
            <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/dashboard" style={{ color: '#FFA500' }}>Tableau de bord</Link> › Gestion Utilisateurs
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: '6px' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Gestion des Utilisateurs & Rôles</h2>
                    <button onClick={fetchUsers} className="btn-detail" disabled={loading}>
                        {loading ? 'Chargement...' : `Actualiser (${users.length})`}
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="card-white">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>⏳ Chargement...</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Rôle actuel</th>
                                    <th>Membre depuis</th>
                                    <th>Modifier le rôle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{u.id}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {u.name}
                                            {u.id === user.id && (
                                                <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#FFA500', color: 'white', padding: '1px 6px', borderRadius: '8px' }}>Vous</span>
                                            )}
                                        </td>
                                        <td style={{ color: '#555' }}>{u.email}</td>
                                        <td><span style={getRoleBadgeStyle(u.role)}>{u.role}</span></td>
                                        <td style={{ color: '#aaa', fontSize: '0.83rem' }}>
                                            {new Date(u.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td>
                                            {u.id === user.id ? (
                                                <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Non modifiable</span>
                                            ) : (
                                                <select
                                                    value={u.role}
                                                    onChange={e => handleRoleChange(u.id, e.target.value)}
                                                    style={{ padding: '5px 10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    <option value="client">client</option>
                                                    <option value="superviseur">superviseur</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div style={{ marginTop: '16px', padding: '12px', background: '#fff3cd', borderRadius: '6px', fontSize: '0.83rem', color: '#856404' }}>
                    ⚠️ <strong>Attention :</strong> La modification du rôle est immédiate et irréversible. Un utilisateur promu <strong>admin</strong> aura accès à toutes les fonctionnalités du système.
                </div>
            </div>
        </Layout>
    );
};

export default AdminUsersPage;
