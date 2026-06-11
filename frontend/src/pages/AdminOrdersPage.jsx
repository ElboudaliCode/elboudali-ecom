import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const money = (value) => `${Number(value || 0).toFixed(2)} Dhs`;

const statuses = [
    { key: 'confirmed', label: 'Confirmee', color: '#16a34a' },
    { key: 'shipped', label: 'Expediee', color: '#0284c7' },
    { key: 'delivered', label: 'Livree', color: '#15803d' },
    { key: 'cancelled', label: 'Annulee', color: '#dc2626' },
];

const statusConfig = {
    pending: { label: 'En attente', color: '#f59e0b' },
    confirmed: { label: 'Confirmee', color: '#16a34a' },
    shipped: { label: 'Expediee', color: '#0284c7' },
    delivered: { label: 'Livree', color: '#15803d' },
    cancelled: { label: 'Annulee', color: '#dc2626' },
};

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [filter, setFilter] = useState('all');

    const fetchOrders = () => {
        setLoading(true);
        api.get('/admin/orders')
            .then((response) => setOrders(response.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        if (filter === 'all') return orders;
        return orders.filter((order) => order.status === filter);
    }, [orders, filter]);

    const summary = useMemo(() => ({
        total: orders.length,
        revenue: orders
            .filter((order) => ['confirmed', 'shipped', 'delivered'].includes(order.status))
            .reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        delivered: orders.filter((order) => order.status === 'delivered').length,
        active: orders.filter((order) => ['confirmed', 'shipped'].includes(order.status)).length,
    }), [orders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
            setMessage(`Statut de la commande #${orderId} mis a jour.`);
            fetchOrders();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            alert('Erreur lors du changement de statut');
        }
    };

    const handlePrintInvoice = (order) => {
        const printWindow = window.open('', '_blank', 'width=800,height=650');
        const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const itemsRows = (order.items || []).map((item) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${money(item.unit_price)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${money(item.unit_price * item.quantity)}</td>
            </tr>
        `).join('');

        const totalHT = Number(order.total_amount || 0) / 1.2;
        const tva = Number(order.total_amount || 0) - totalHT;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Facture #${order.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; margin: 24px; line-height: 1.5; }
                        .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #FFA500; padding-bottom: 15px; margin-bottom: 25px; }
                        .logo { font-size: 1.6rem; font-weight: bold; color: #FFA500; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                        .info-block h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #555; font-size: 0.95rem; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #fafafa; padding: 10px; text-align: left; font-size: 0.88rem; border-bottom: 2px solid #ddd; }
                        .totals { width: 300px; margin-left: auto; font-size: 0.9rem; }
                        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
                        .grand-total { border-top: 2px solid #FFA500; font-size: 1.1rem; font-weight: bold; color: #FFA500; padding-top: 10px; }
                        .footer { text-align: center; margin-top: 50px; font-size: 0.75rem; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="invoice-header">
                        <div class="logo">ELBOUDALI Ecom</div>
                        <div style="text-align: right;">
                            <h2 style="margin: 0;">FACTURE</h2>
                            <p style="margin: 5px 0 0; color: #666;">Reference : #FAC-${order.id}</p>
                            <p style="margin: 5px 0 0; color: #666;">Date : ${dateStr}</p>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-block">
                            <h3>Emetteur</h3>
                            <p><strong>Elboudali E-commerce SARL</strong></p>
                            <p>123 Boulevard Hassan II</p>
                            <p>Casablanca, Maroc</p>
                            <p>support@elboudaliecom.ma</p>
                        </div>
                        <div class="info-block" style="text-align: right;">
                            <h3>Client</h3>
                            <p><strong>${order.user?.name || 'N/A'}</strong></p>
                            <p>${order.user?.email || ''}</p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Designation</th>
                                <th style="text-align: right;">Prix unitaire</th>
                                <th style="text-align: center;">Qte</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${itemsRows}</tbody>
                    </table>

                    <div class="totals">
                        <div class="totals-row"><span>Total HT :</span><span>${money(totalHT)}</span></div>
                        <div class="totals-row"><span>TVA (20%) :</span><span>${money(tva)}</span></div>
                        <div class="totals-row grand-total"><span>Total TTC :</span><span>${money(order.total_amount)}</span></div>
                    </div>
                    <div class="footer">Merci pour votre confiance.</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    };

    return (
        <Layout>
            <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/dashboard" style={{ color: '#FFA500' }}>Admin</Link> / Commandes clients
                </span>
                <h2 style={{ marginTop: 6, fontSize: '1.35rem', fontWeight: 800 }}>Gestion des commandes</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
                <SummaryCard title="Commandes" value={summary.total} color="#0284c7" />
                <SummaryCard title="Revenu valide" value={money(summary.revenue)} color="#16a34a" />
                <SummaryCard title="En cours" value={summary.active} color="#f97316" />
                <SummaryCard title="Livrees" value={summary.delivered} color="#15803d" />
            </div>

            <div className="card-white" style={{ padding: 12, marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <strong style={{ marginRight: 4, fontSize: '0.86rem' }}>Filtrer :</strong>
                <button onClick={() => setFilter('all')} style={filterButtonStyle(filter === 'all')}>Toutes</button>
                {Object.entries(statusConfig).map(([key, status]) => (
                    <button key={key} onClick={() => setFilter(key)} style={filterButtonStyle(filter === key)}>
                        {status.label}
                    </button>
                ))}
            </div>

            {message && <div className="alert alert-success">{message}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>Chargement...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="card-white" style={{ textAlign: 'center', padding: 30 }}>Aucune commande trouvee.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filteredOrders.map((order) => {
                        const status = statusConfig[order.status] || { label: order.status, color: '#64748b' };
                        return (
                            <div key={order.id} className="card-white" style={{ borderLeft: `4px solid ${status.color}`, padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f0f0f0', paddingBottom: 12, marginBottom: 12, gap: 14, flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>Commande #{order.id}</div>
                                        <div style={{ color: '#666', fontSize: '0.82rem', marginTop: 3 }}>
                                            Client : <strong>{order.user?.name || 'N/A'}</strong> ({order.user?.email || ''})
                                        </div>
                                        <div style={{ color: '#777', fontSize: '0.78rem', marginTop: 3 }}>
                                            Date : {new Date(order.created_at).toLocaleString('fr-FR')}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <select
                                            value={order.status}
                                            onChange={(event) => handleStatusChange(order.id, event.target.value)}
                                            style={{ padding: '7px 9px', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.82rem' }}
                                        >
                                            {statuses.map((item) => (
                                                <option key={item.key} value={item.key}>{item.label}</option>
                                            ))}
                                        </select>
                                        <span style={{ background: `${status.color}18`, color: status.color, padding: '5px 9px', borderRadius: 999, fontWeight: 800, fontSize: '0.75rem' }}>
                                            {status.label}
                                        </span>
                                        <button onClick={() => handlePrintInvoice(order)} style={{ padding: '7px 10px', background: '#FFA500', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                                            Facture
                                        </button>
                                    </div>
                                </div>

                                <OrderTimeline currentStatus={order.status} />

                                <div className="table-wrapper" style={{ marginTop: 14 }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Produit</th>
                                                <th>Prix</th>
                                                <th>Qte</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.product_name}</td>
                                                    <td>{money(item.unit_price)}</td>
                                                    <td>{item.quantity}</td>
                                                    <td style={{ fontWeight: 700 }}>{money(item.unit_price * item.quantity)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div style={{ textAlign: 'right', marginTop: 10, fontWeight: 800, fontSize: '0.98rem' }}>
                                    Montant TTC : <span style={{ color: '#FFA500' }}>{money(order.total_amount)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
};

const SummaryCard = ({ title, value, color }) => (
    <div className="card-white" style={{ padding: 14, borderLeft: `4px solid ${color}` }}>
        <div style={{ color: '#777', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ color, fontSize: '1.25rem', fontWeight: 900, marginTop: 5 }}>{value}</div>
    </div>
);

const OrderTimeline = ({ currentStatus }) => {
    if (currentStatus === 'cancelled') {
        return (
            <div style={{ background: '#fff1f2', color: '#dc2626', border: '1px solid #fecdd3', borderRadius: 6, padding: 10, fontWeight: 700, fontSize: '0.84rem' }}>
                Cette commande est annulee.
            </div>
        );
    }

    const steps = ['confirmed', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(currentStatus);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {steps.map((step, index) => {
                const status = statusConfig[step];
                const done = index <= currentIndex;
                return (
                    <div key={step} style={{ background: done ? `${status.color}18` : 'rgba(0,0,0,0.04)', color: done ? status.color : '#888', borderRadius: 6, padding: '9px 10px', fontWeight: 800, fontSize: '0.78rem', textAlign: 'center' }}>
                        {index + 1}. {status.label}
                    </div>
                );
            })}
        </div>
    );
};

const filterButtonStyle = (active) => ({
    padding: '7px 12px',
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    background: active ? '#FFA500' : 'rgba(0,0,0,0.06)',
    color: active ? 'white' : 'var(--dark)',
    fontWeight: 700,
    fontSize: '0.8rem',
});

export default AdminOrdersPage;
