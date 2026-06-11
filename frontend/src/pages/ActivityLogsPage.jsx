import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';

const ActivityLogsPage = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    useEffect(() => { fetchLogs(); }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const r = await api.get(`/admin/activity-logs?page=${page}`);
            setLogs(r.data.data || []);
            setLastPage(r.data.last_page || 1);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (!user || (user.role !== 'admin' && user.role !== 'superviseur')) return <Navigate to="/" />;

    const getActionStyle = (action) => {
        const styles = {
            'PRODUCT_CREATE': { bg: '#d4edda', color: '#155724', icon: '➕' },
            'PRODUCT_UPDATE': { bg: '#cce5ff', color: '#004085', icon: '✏️' },
            'PRODUCT_DELETE': { bg: '#f8d7da', color: '#721c24', icon: '🗑️' },
            'ROLE_CHANGE':    { bg: '#fff3cd', color: '#856404', icon: '🔑' },
        };
        return styles[action] || { bg: '#f5f5f5', color: '#555', icon: '📋' };
    };

    return (
        <Layout>
            <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/dashboard" style={{ color: '#FFA500' }}>Tableau de bord</Link> › Journal d'Activité
                </span>
                <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>📋 Journal d'Activité du Système</h2>
            </div>

            <div className="card-white">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>⏳ Chargement...</div>
                ) : logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#aaa' }}>
                        Aucune activité enregistrée pour l'instant.
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {logs.map(log => {
                                const style = getActionStyle(log.action);
                                return (
                                    <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', background: style.bg, borderRadius: '8px', borderLeft: `4px solid ${style.color}` }}>
                                        <div style={{ fontSize: '1.3rem', minWidth: '28px', textAlign: 'center' }}>{style.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: style.color, marginBottom: '3px' }}>
                                                {log.action.replace(/_/g, ' ')}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#333', marginBottom: '4px' }}>
                                                {log.description}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                👤 {log.user?.name || 'Système'} ({log.user?.role}) — {new Date(log.created_at).toLocaleString('fr-FR')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {lastPage > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                                {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)}
                                        style={{ padding: '6px 12px', border: '1px solid #e0e0e0', background: page === p ? '#FFA500' : 'white', color: page === p ? 'white' : '#333', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
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

export default ActivityLogsPage;
