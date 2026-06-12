import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api/axios';
import { apiUrl } from '../api/config';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const money = (value) => `${Number(value || 0).toFixed(2)} Dhs`;

const statusConfig = {
    pending: { label: 'En attente', color: '#f59e0b' },
    confirmed: { label: 'Confirmee', color: '#16a34a' },
    shipped: { label: 'Expediee', color: '#0284c7' },
    delivered: { label: 'Livree', color: '#15803d' },
    cancelled: { label: 'Annulee', color: '#dc2626' },
};

const MetricCard = ({ title, value, hint, color }) => (
    <div className="card-white" style={{ padding: 16, borderLeft: `4px solid ${color}` }}>
        <div style={{ fontSize: '0.76rem', color: '#777', fontWeight: 700, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '1.45rem', fontWeight: 800, color, margin: '8px 0 4px' }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: '#666' }}>{hint}</div>
    </div>
);

const DashboardPage = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'superviseur')) {
            setLoading(false);
            return;
        }

        api.get('/admin/dashboard')
            .then((response) => setStats(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const maxCategorySales = useMemo(() => {
        if (!stats?.categorySales?.length) return 0;
        return Math.max(...stats.categorySales.map((category) => Number(category.sales)));
    }, [stats]);

    const maxMonthlyRevenue = useMemo(() => {
        if (!stats?.monthlyRevenue?.length) return 0;
        return Math.max(...stats.monthlyRevenue.map((month) => Number(month.revenue)));
    }, [stats]);

    const paidOrdersCount = useMemo(() => {
        if (!stats?.statusCounts) return 0;
        return ['confirmed', 'shipped', 'delivered'].reduce((total, status) => total + Number(stats.statusCounts[status] || 0), 0);
    }, [stats]);

    if (!user || (user.role !== 'admin' && user.role !== 'superviseur')) return <Navigate to="/" />;
    if (loading) return <Layout><div style={{ textAlign: 'center', padding: 60 }}>Chargement du tableau de bord...</div></Layout>;
    if (!stats) return <Layout><div className="card-white">Impossible de charger les statistiques.</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ fontSize: '0.83rem', color: '#888', marginBottom: 4 }}>
                        <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> / Administration
                    </div>
                    <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Tableau de bord admin</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => window.open(apiUrl('/admin/export/orders'), '_blank')} style={buttonStyle('#16a34a')}>
                        Export commandes
                    </button>
                    <button onClick={() => window.open(apiUrl('/admin/export/products'), '_blank')} style={buttonStyle('#0284c7')}>
                        Export produits
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 10, flexWrap: 'wrap' }}>
                {[
                    ['overview', "Vue d'ensemble"],
                    ['sales', 'Ventes'],
                    ['activity', 'Activite'],
                ].map(([key, label]) => (
                    <button key={key} onClick={() => setActiveTab(key)} style={tabStyle(activeTab === key)}>
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
                        <MetricCard title="Chiffre d'affaires" value={money(stats.revenue)} hint="Commandes confirmees, expediees et livrees" color="#16a34a" />
                        <MetricCard title="Revenu du mois" value={money(stats.monthRevenue)} hint="Performance du mois courant" color="#0284c7" />
                        <MetricCard title="Commandes" value={stats.ordersCount} hint={`${stats.todayOrdersCount || 0} commande(s) aujourd'hui`} color="#7c3aed" />
                        <MetricCard title="Panier moyen" value={money(stats.averageOrderValue)} hint="Valeur moyenne par commande" color="#f97316" />
                        <MetricCard title="Clients" value={stats.clientsCount} hint="Comptes clients inscrits" color="#0f766e" />
                        <MetricCard title="Alertes stock" value={stats.lowStockProducts?.length || 0} hint="Produits sous le seuil d'alerte" color="#dc2626" />
                        <MetricCard title="Support ouvert" value={stats.openSupportCount || 0} hint="Conversations client a suivre" color="#8b5cf6" />
                        <MetricCard title="Categories" value={stats.categoriesCount || 0} hint="Structure du catalogue" color="#2563eb" />
                    </div>

                    <div className="card-white" style={{ marginBottom: 24, padding: 16 }}>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: 14 }}>Actions rapides</h3>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Link to="/admin/products" style={quickLinkStyle('#FFA500')}>Ajouter un produit</Link>
                            <Link to="/admin/orders" style={quickLinkStyle('#0284c7')}>Suivre les commandes</Link>
                            <Link to="/admin/coupons" style={quickLinkStyle('#16a34a')}>Creer un coupon</Link>
                            <Link to="/support" style={quickLinkStyle('#0f766e')}>Support clients</Link>
                        </div>
                    </div>

                    <div className="card-white" style={{ marginBottom: 24, padding: 18 }}>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: 14 }}>Sante commerciale</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
                            <HealthPill label="Commandes payables" value={`${paidOrdersCount}/${stats.ordersCount || 0}`} color="#16a34a" />
                            <HealthPill label="Revenu aujourd'hui" value={money(stats.todayRevenue)} color="#0284c7" />
                            <HealthPill label="Alerte stock" value={(stats.lowStockProducts?.length || 0) > 0 ? 'A verifier' : 'Stable'} color={(stats.lowStockProducts?.length || 0) > 0 ? '#dc2626' : '#16a34a'} />
                            <HealthPill label="Support" value={(stats.openSupportCount || 0) > 0 ? 'Actif' : 'Calme'} color={(stats.openSupportCount || 0) > 0 ? '#8b5cf6' : '#16a34a'} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                        <div className="card-white" style={{ padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Commandes recentes</h3>
                                <Link to="/admin/orders" style={{ fontSize: '0.8rem', color: '#FFA500', fontWeight: 700, textDecoration: 'none' }}>Tout voir</Link>
                            </div>
                            {!stats.recentOrders?.length ? (
                                <p style={{ color: '#888', fontSize: '0.85rem' }}>Aucune commande enregistree.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {stats.recentOrders.map((order) => {
                                        const status = statusConfig[order.status] || { label: order.status, color: '#64748b' };
                                        return (
                                            <div key={order.id} style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 6, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.86rem' }}>Commande #{order.id} - {order.user?.name || 'Client'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#777', marginTop: 2 }}>
                                                        {new Date(order.created_at).toLocaleDateString('fr-FR')} - <span style={{ color: status.color, fontWeight: 700 }}>{status.label}</span>
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 800, color: '#FFA500', fontSize: '0.9rem' }}>{money(order.total_amount)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="card-white" style={{ padding: 18 }}>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: 14 }}>Top produits vendus</h3>
                            {!stats.topProducts?.length ? (
                                <p style={{ color: '#888', fontSize: '0.85rem' }}>Aucune vente pour le moment.</p>
                            ) : stats.topProducts.map((product, index) => (
                                <div key={product.product_id || product.product_name} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: index !== stats.topProducts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <strong style={{ color: '#FFA500' }}>#{index + 1}</strong>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{product.product_name}</div>
                                        <div style={{ color: '#777', fontSize: '0.75rem' }}>{product.quantity_sold} unite(s) vendue(s)</div>
                                    </div>
                                    <strong>{money(product.revenue)}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="card-white" style={{ padding: 18 }}>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: 14 }}>Statuts des commandes</h3>
                            {Object.entries(statusConfig).map(([key, status]) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: status.color, fontWeight: 700 }}>{status.label}</span>
                                    <strong>{stats.statusCounts?.[key] || 0}</strong>
                                </div>
                            ))}
                        </div>

                        <div className="card-white" style={{ padding: 18 }}>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, marginBottom: 14 }}>Alertes stock bas</h3>
                            {!stats.lowStockProducts?.length ? (
                                <div style={{ padding: 20, textAlign: 'center', background: 'rgba(22,163,74,0.07)', border: '1px dashed #16a34a', borderRadius: 6, color: '#16a34a', fontSize: '0.85rem', fontWeight: 700 }}>
                                    Tous les niveaux de stock sont corrects.
                                </div>
                            ) : stats.lowStockProducts.map((product) => (
                                <div key={product.id} style={{ padding: '10px 12px', background: '#fff1f2', borderLeft: '4px solid #dc2626', borderRadius: 6, marginBottom: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{product.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#777' }}>{product.category?.name || 'Sans categorie'}</div>
                                    </div>
                                    <strong style={{ color: '#dc2626' }}>Stock: {product.quantity}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'sales' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    <BarList title="Ventes par categorie" items={stats.categorySales || []} labelKey="category" valueKey="sales" maxValue={maxCategorySales} />
                    <BarList title="Evolution mensuelle" items={stats.monthlyRevenue || []} labelKey="month" valueKey="revenue" maxValue={maxMonthlyRevenue} secondaryKey="orders" />
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="card-white" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>Dernieres activites</h3>
                    {!stats.recentLogs?.length ? (
                        <div style={{ textAlign: 'center', padding: 30, color: '#888', fontSize: '0.88rem' }}>Aucune activite recente enregistree.</div>
                    ) : stats.recentLogs.map((log, index) => (
                        <div key={log.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: index !== stats.recentLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{log.action}</div>
                            <div style={{ fontSize: '0.76rem', color: '#777', marginTop: 3 }}>
                                Par {log.user?.name || 'Systeme'} ({log.user?.role || 'n/a'}) - {new Date(log.created_at).toLocaleString('fr-FR')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

const BarList = ({ title, items, labelKey, valueKey, maxValue, secondaryKey }) => (
    <div className="card-white" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 18 }}>{title}</h3>
        {!items.length ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#888', fontSize: '0.88rem' }}>Aucune donnee disponible.</div>
        ) : items.map((item, index) => {
            const pct = maxValue > 0 ? (Number(item[valueKey]) / maxValue) * 100 : 0;
            return (
                <div key={`${item[labelKey]}-${index}`} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6, fontSize: '0.84rem' }}>
                        <strong>{item[labelKey]}</strong>
                        <span>{money(item[valueKey])}{secondaryKey ? ` - ${item[secondaryKey]} commande(s)` : ''}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 999, height: 12, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: '#FFA500', height: '100%', borderRadius: 999 }} />
                    </div>
                </div>
            );
        })}
    </div>
);

const HealthPill = ({ label, value, color }) => (
    <div style={{ background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 10, padding: 14 }}>
        <div style={{ color, fontWeight: 900, fontSize: '1.05rem', marginBottom: 4 }}>{value}</div>
        <span style={{ color: '#64748B', fontWeight: 700, fontSize: '0.78rem' }}>{label}</span>
    </div>
);

const buttonStyle = (background) => ({
    padding: '8px 14px',
    background,
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.82rem',
});

const tabStyle = (active) => ({
    padding: '8px 16px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.85rem',
    background: active ? '#FFA500' : 'rgba(0,0,0,0.05)',
    color: active ? 'white' : 'var(--dark)',
});

const quickLinkStyle = (color) => ({
    textDecoration: 'none',
    padding: '10px 14px',
    background: `${color}16`,
    color,
    borderRadius: 6,
    fontWeight: 700,
    fontSize: '0.82rem',
});

export default DashboardPage;
