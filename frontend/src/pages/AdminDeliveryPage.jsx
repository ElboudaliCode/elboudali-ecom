import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const AdminDeliveryPage = () => {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('active');

    useEffect(() => {
        api.get('/admin/orders').then((response) => setOrders(response.data)).catch(console.error);
    }, []);

    const filteredOrders = useMemo(() => {
        if (filter === 'active') return orders.filter((order) => ['confirmed', 'shipped'].includes(order.status));
        if (filter === 'delivered') return orders.filter((order) => order.status === 'delivered');
        return orders;
    }, [orders, filter]);

    const updateStatus = async (id, status) => {
        await api.put(`/admin/orders/${id}/status`, { status });
        const response = await api.get('/admin/orders');
        setOrders(response.data);
    };

    return (
        <Layout>
            <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/dashboard" style={{ color: '#F59E0B' }}>Admin</Link> / Livraison
                </span>
                <h2 style={{ marginTop: 6, fontSize: '1.35rem', fontWeight: 900 }}>Gestion livraison</h2>
            </div>

            <div className="card-white" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                        ['active', 'A preparer / expedier'],
                        ['delivered', 'Livrees'],
                        ['all', 'Toutes'],
                    ].map(([key, label]) => (
                        <button key={key} className="btn-detail" onClick={() => setFilter(key)} style={{ background: filter === key ? '#FFF7ED' : undefined }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card-white">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Commande</th>
                                <th>Client</th>
                                <th>Ville</th>
                                <th>Methode</th>
                                <th>Date estimee</th>
                                <th>Tracking</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{order.user?.name || 'N/A'}</td>
                                    <td>{order.address?.city || 'N/A'}</td>
                                    <td>{order.delivery_method || 'standard'}</td>
                                    <td>{order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString('fr-FR') : 'N/A'}</td>
                                    <td>{order.tracking_number || 'N/A'}</td>
                                    <td><span className="badge badge-info">{order.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-detail" onClick={() => updateStatus(order.id, 'shipped')}>Expedier</button>
                                            <button className="btn-detail" onClick={() => updateStatus(order.id, 'delivered')}>Livrer</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDeliveryPage;
