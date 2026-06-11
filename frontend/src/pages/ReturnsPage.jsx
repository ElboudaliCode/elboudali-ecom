import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const ReturnsPage = () => {
    const [orders, setOrders] = useState([]);
    const [forms, setForms] = useState({});
    const [message, setMessage] = useState(null);

    const fetchOrders = () => {
        api.get('/orders').then((response) => setOrders(response.data)).catch(console.error);
    };

    useEffect(() => { fetchOrders(); }, []);

    const submitReturn = async (orderId) => {
        const form = forms[orderId] || {};
        if (!form.reason) {
            alert('Veuillez saisir une raison.');
            return;
        }

        await api.post(`/orders/${orderId}/return`, {
            reason: form.reason,
            details: form.details || '',
        });
        setMessage(`Demande envoyee pour la commande #${orderId}.`);
        fetchOrders();
    };

    const deliveredOrders = orders.filter((order) => order.status === 'delivered' || order.return_request);

    return (
        <Layout>
            <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/" style={{ color: '#F59E0B' }}>Accueil</Link> / Retours
                </span>
                <h2 style={{ marginTop: 6, fontSize: '1.35rem', fontWeight: 900 }}>Mes retours et remboursements</h2>
            </div>

            {message && <div className="alert alert-success">{message}</div>}

            {deliveredOrders.length === 0 ? (
                <div className="card-white" style={{ textAlign: 'center', padding: 35, color: '#64748B' }}>
                    Aucune commande livree disponible pour une demande de retour.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {deliveredOrders.map((order) => (
                        <div key={order.id} className="card-white">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                    <h3 style={{ marginBottom: 8 }}>Commande #{order.id}</h3>
                                    <div style={{ color: '#64748B', fontSize: '0.86rem' }}>
                                        Total: {Number(order.total_amount).toFixed(2)} Dhs - Tracking: {order.tracking_number || 'N/A'}
                                    </div>
                                </div>
                                <span className="badge badge-info">{order.return_request?.status || 'Disponible'}</span>
                            </div>

                            {order.return_request ? (
                                <div className="alert alert-warning" style={{ marginTop: 12 }}>
                                    Votre demande est en statut: <strong>{order.return_request.status}</strong>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginTop: 12 }}>
                                    <input
                                        placeholder="Raison du retour"
                                        value={forms[order.id]?.reason || ''}
                                        onChange={(event) => setForms({ ...forms, [order.id]: { ...(forms[order.id] || {}), reason: event.target.value } })}
                                        style={{ padding: 9 }}
                                    />
                                    <input
                                        placeholder="Details optionnels"
                                        value={forms[order.id]?.details || ''}
                                        onChange={(event) => setForms({ ...forms, [order.id]: { ...(forms[order.id] || {}), details: event.target.value } })}
                                        style={{ padding: 9 }}
                                    />
                                    <button className="btn-cart" onClick={() => submitReturn(order.id)}>Envoyer</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default ReturnsPage;
