import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { getStatus, returnStatuses } from '../config/statusConfig';

const AdminReturnsPage = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    const fetchReturns = () => {
        setLoading(true);
        api.get('/admin/returns')
            .then((response) => setReturns(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReturns(); }, []);

    const updateStatus = async (id, status) => {
        await api.put(`/admin/returns/${id}/status`, { status });
        setMessage('Statut du retour mis a jour.');
        fetchReturns();
        setTimeout(() => setMessage(null), 2500);
    };

    return (
        <Layout>
            <PageHeader backTo="/dashboard" backLabel="Admin" eyebrow="Retours" title="Retours et remboursements" />

            {message && <div className="alert alert-success">{message}</div>}

            <div className="card-white">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 35 }}>Chargement...</div>
                ) : returns.length === 0 ? (
                    <EmptyState title="Aucune demande de retour" description="Les demandes clients apparaitront ici." />
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Commande</th>
                                    <th>Client</th>
                                    <th>Raison</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map((item) => (
                                    <tr key={item.id}>
                                        <td>#{item.order_id}</td>
                                        <td>{item.user?.name || item.order?.user?.name || 'Client'}</td>
                                        <td>
                                            <strong>{item.reason}</strong>
                                            {item.details && <div style={{ color: '#64748B', fontSize: '0.78rem' }}>{item.details}</div>}
                                        </td>
                                        <td><StatusBadge status={getStatus(returnStatuses, item.status)} /></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {['accepted', 'refused', 'refunded'].map((status) => (
                                                    <button key={status} className="btn-detail" onClick={() => updateStatus(item.id, status)}>
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminReturnsPage;
