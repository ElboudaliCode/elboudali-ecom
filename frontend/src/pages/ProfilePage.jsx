import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [msg, setMsg] = useState(null);
    const [error, setError] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const isClient = user && user.role === 'client';

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        setName(user.name);
        setEmail(user.email);

        if (isClient) {
            api.get('/client/stats')
                .then((response) => setStats(response.data))
                .catch(console.error)
                .finally(() => setLoadingStats(false));
        } else {
            setLoadingStats(false);
        }
    }, [user, navigate, isClient]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMsg(null);
        setError(null);

        if (password && password !== passwordConfirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password && (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password))) {
            setError('Le nouveau mot de passe doit contenir au moins 8 caracteres, une lettre et un chiffre.');
            return;
        }

        setSaving(true);
        try {
            const data = { name, email };
            if (password) {
                data.password = password;
                data.password_confirmation = passwordConfirmation;
            }

            await api.put('/profile', data);
            setMsg('Profil mis a jour avec succes.');
            setPassword('');
            setPasswordConfirmation('');

            const meRes = await api.get('/me');
            if (meRes.data.user) {
                localStorage.setItem('user', JSON.stringify(meRes.data.user));
                window.location.reload();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la mise a jour.');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <Layout>
            <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> / Profil
                </span>
                <h2 style={{ marginTop: 6, fontSize: '1.3rem', fontWeight: 800 }}>Mon profil</h2>
            </div>

            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="card-white" style={{ flex: 1, minWidth: 320 }}>
                    <h3>Informations personnelles</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Nom complet</label>
                            <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Adresse e-mail</label>
                            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
                        <h4 style={{ fontSize: '0.9rem', color: '#666', fontWeight: 700 }}>Changer le mot de passe (optionnel)</h4>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Nouveau mot de passe</label>
                            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Laisser vide pour ne pas modifier" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Confirmer le nouveau mot de passe</label>
                            <input type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Laisser vide pour ne pas modifier" />
                        </div>

                        <button type="submit" className="btn-primary-full" disabled={saving}>
                            {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                        </button>
                    </form>
                </div>

                <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card-white" style={{ borderLeft: '4px solid #FFA500' }}>
                        <h3>Statut du compte</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff3e0', color: '#FFA500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', color: '#FFA500' }}>{user.role}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}</div>
                            </div>
                        </div>
                    </div>

                    {isClient && !loadingStats && stats && (
                        <>
                            <div className="card-white" style={{ borderLeft: '4px solid #16a34a' }}>
                                <h3>Programme fidelite</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 10, marginTop: 10 }}>
                                    <StatBox label="Solde actuel" value={`${stats.loyaltyPoints || 0} pts`} color="#FFA500" />
                                    <StatBox label="Niveau" value={stats.loyaltyLevel || 'Bronze'} color="#7c3aed" />
                                    <StatBox label="Reduction dispo." value={`${Number(stats.loyaltyDiscountAvailable || 0).toFixed(2)} Dhs`} color="#16a34a" />
                                    <StatBox label="Points gagnes" value={`${stats.loyaltyPointsEarned || 0} pts`} color="#0284c7" />
                                    <StatBox label="Points utilises" value={`${stats.loyaltyPointsUsed || 0} pts`} color="#dc2626" />
                                </div>
                                <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#666' }}>
                                    Regle : chaque 10 Dhs payes donne 1 point. Chaque 100 points donnent 10 Dhs de reduction au checkout.
                                </p>
                            </div>

                            <div className="card-white">
                                <h3>Mes statistiques d'achat</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                                    <Row label="Commandes passees" value={stats.totalOrders} color="#FFA500" />
                                    <Row label="Depenses totales" value={`${Number(stats.totalSpent).toFixed(2)} Dhs`} color="#28a745" />
                                    <Row label="Favoris enregistres" value={stats.favoritesCount} color="#dc3545" />
                                    <Row label="Produits achetes" value={stats.itemsPurchased || 0} color="#0284c7" />
                                    <Row label="Categorie preferee" value={stats.favoriteCategory || 'Pas encore'} color="#7c3aed" />
                                    <Row label="Economies fidelite" value={`${Number(stats.totalSaved || 0).toFixed(2)} Dhs`} color="#16a34a" />

                                    {stats.lastOrder && (
                                        <div style={{ marginTop: 10, padding: 10, border: '1px solid #e0e0e0', borderRadius: 5 }}>
                                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>Derniere commande</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                                                <span>#{stats.lastOrder.id}</span>
                                                <span>{Number(stats.lastOrder.total_amount).toFixed(2)} Dhs</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const StatBox = ({ label, value, color }) => (
    <div style={{ padding: 10, background: `${color}12`, borderRadius: 6 }}>
        <div style={{ fontSize: '0.72rem', color: '#666', fontWeight: 700 }}>{label}</div>
        <div style={{ fontWeight: 900, color, marginTop: 4 }}>{value}</div>
    </div>
);

const Row = ({ label, value, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: '#f8f8f8', borderRadius: 5 }}>
        <span style={{ fontSize: '0.88rem', color: '#555' }}>{label}</span>
        <span style={{ fontWeight: 800, color }}>{value}</span>
    </div>
);

export default ProfilePage;
