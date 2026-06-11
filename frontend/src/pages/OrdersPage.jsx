import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders').then(r => setOrders(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const statusConfig = {
        pending:   { label: 'En attente', cls: 'badge-warning' },
        confirmed: { label: 'Confirmée',  cls: 'badge-success' },
        shipped:   { label: 'Expédiée',   cls: 'badge-info'    },
        delivered: { label: 'Livrée',     cls: 'badge-success' },
        cancelled: { label: 'Annulée',    cls: 'badge-danger'  },
    };

    const handlePrintInvoice = (order) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const itemsRows = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${Number(item.unit_price).toFixed(2)} Dhs</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${(item.unit_price * item.quantity).toFixed(2)} Dhs</td>
            </tr>
        `).join('');

        const totalHT = order.total_amount / 1.2;
        const tva = order.total_amount - totalHT;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Facture Elboudali Ecom #${order.id}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 20px; line-height: 1.5; }
                        .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #FFA500; padding-bottom: 15px; margin-bottom: 25px; }
                        .logo { font-size: 1.8rem; font-weight: bold; color: #FFA500; }
                        .invoice-title { text-align: right; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                        .info-block h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px; color: #555; font-size: 0.95rem; }
                        .info-block p { margin: 4px 0; font-size: 0.88rem; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #fafafa; padding: 10px; text-align: left; font-size: 0.88rem; border-bottom: 2px solid #ddd; }
                        .totals { width: 300px; margin-left: auto; font-size: 0.9rem; }
                        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
                        .totals-row.grand-total { border-top: 2px solid #FFA500; font-size: 1.1rem; font-weight: bold; color: #FFA500; padding-top: 10px; }
                        .footer { text-align: center; margin-top: 50px; font-size: 0.75rem; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="invoice-header">
                        <div class="logo">🍊 ELBOUDALI Ecom</div>
                        <div class="invoice-title">
                            <h2 style="margin: 0; font-size: 1.5rem;">FACTURE</h2>
                            <p style="margin: 5px 0 0 0; font-size: 0.88rem; color: #666;">Référence : #FAC-${order.id}</p>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-block">
                            <h3>Émetteur :</h3>
                            <p><strong>Elboudali E-commerce SARL</strong></p>
                            <p>123 Boulevard Hassan II</p>
                            <p>Casablanca, Maroc</p>
                            <p>Contact : support@elboudaliecom.ma</p>
                        </div>
                        <div class="info-block" style="text-align: right;">
                            <h3>Détails :</h3>
                            <p>Date d'émission : <strong>${dateStr}</strong></p>
                            <p>Mode de paiement : <strong>Carte Bancaire / Cash</strong></p>
                            <p>Statut : <strong>Payée (Confirmée)</strong></p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: left;">Désignation</th>
                                <th style="text-align: right;">Prix unitaire</th>
                                <th style="text-align: center;">Qté</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsRows}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="totals-row">
                            <span>Total HT :</span>
                            <span>${totalHT.toFixed(2)} Dhs</span>
                        </div>
                        <div class="totals-row">
                            <span>TVA (20%) :</span>
                            <span>${tva.toFixed(2)} Dhs</span>
                        </div>
                        <div class="totals-row grand-total">
                            <span>Total TTC :</span>
                            <span>${Number(order.total_amount).toFixed(2)} Dhs</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Merci pour votre confiance et à bientôt sur Elboudali Ecom !</p>
                        <p>Document généré électroniquement et ne nécessitant pas de signature manuscrite.</p>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); };
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Layout>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '0.83rem', color: '#888' }}>
                        <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> › Mes commandes
                    </span>
                    <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>📦 Historique des commandes</h2>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>⏳ Chargement...</div>
            ) : orders.length === 0 ? (
                <div className="card-white" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                    <p style={{ color: '#888' }}>Vous n'avez passé aucune commande.</p>
                    <Link to="/" className="btn-cart" style={{ display: 'inline-block', marginTop: '16px', padding: '10px 20px', borderRadius: '5px' }}>
                        Voir les produits
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.map(order => {
                        const { label, cls } = statusConfig[order.status] || { label: order.status, cls: 'badge-secondary' };
                        return (
                            <div key={order.id} className="card-white">
                                {/* Header commande */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                                    <div>
                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Commande #{order.id}</span>
                                        <span style={{ marginLeft: '12px', color: '#888', fontSize: '0.83rem' }}>
                                            {new Date(order.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className={`badge ${cls}`}>{label}</span>
                                        <button
                                            onClick={() => handlePrintInvoice(order)}
                                            style={{
                                                padding: '4px 10px', background: '#FFA500', color: 'white',
                                                border: 'none', borderRadius: '4px', cursor: 'pointer',
                                                fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            🖨️ Facture
                                        </button>
                                    </div>
                                </div>

                                {/* Timeline de Suivi de Commande */}
                                {order.status === 'cancelled' ? (
                                    <div style={{ background: '#fce8e6', border: '1px solid #f5c2c2', color: '#c53929', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600 }}>
                                        ❌ Cette commande a été annulée.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 25px 0', position: 'relative', padding: '0 10px' }}>
                                        {/* Ligne grise en arrière-plan */}
                                        <div style={{ position: 'absolute', top: '15px', left: '40px', right: '40px', height: '4px', background: '#e0e0e0', zIndex: 1 }} />
                                        
                                        {/* Remplissage de ligne selon le statut */}
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: '15px', 
                                            left: '40px', 
                                            width: order.status === 'delivered' ? 'calc(100% - 80px)' : (order.status === 'shipped' ? '50%' : '0%'), 
                                            height: '4px', 
                                            background: '#28a745', 
                                            zIndex: 2, 
                                            transition: 'width 0.4s ease' 
                                        }} />

                                        {/* Etape 1: Confirmée */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '80px' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#28a745', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>✓</div>
                                            <span style={{ fontSize: '0.78rem', marginTop: '6px', fontWeight: 600, color: '#28a745', textAlign: 'center' }}>Confirmée</span>
                                        </div>

                                        {/* Etape 2: Expédiée */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '80px' }}>
                                            <div style={{ 
                                                width: '30px', 
                                                height: '30px', 
                                                borderRadius: '50%', 
                                                background: (order.status === 'shipped' || order.status === 'delivered') ? '#28a745' : '#e0e0e0', 
                                                color: (order.status === 'shipped' || order.status === 'delivered') ? 'white' : '#888', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.85rem' 
                                            }}>
                                                🚚
                                            </div>
                                            <span style={{ 
                                                fontSize: '0.78rem', 
                                                marginTop: '6px', 
                                                fontWeight: 600, 
                                                color: (order.status === 'shipped' || order.status === 'delivered') ? '#28a745' : '#888',
                                                textAlign: 'center'
                                            }}>Expédiée</span>
                                        </div>

                                        {/* Etape 3: Livrée */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '80px' }}>
                                            <div style={{ 
                                                width: '30px', 
                                                height: '30px', 
                                                borderRadius: '50%', 
                                                background: order.status === 'delivered' ? '#28a745' : '#e0e0e0', 
                                                color: order.status === 'delivered' ? 'white' : '#888', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.85rem' 
                                            }}>
                                                🎉
                                            </div>
                                            <span style={{ 
                                                fontSize: '0.78rem', 
                                                marginTop: '6px', 
                                                fontWeight: 600, 
                                                color: order.status === 'delivered' ? '#28a745' : '#888',
                                                textAlign: 'center'
                                            }}>Livrée</span>
                                        </div>
                                    </div>
                                )}

                                {/* Articles */}
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Produit</th>
                                                <th>Prix unit.</th>
                                                <th>Qté</th>
                                                <th>Sous-total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items && order.items.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.product_name}</td>
                                                    <td style={{ color: '#FFA500', fontWeight: 600 }}>{Number(item.unit_price).toFixed(2)} Dhs</td>
                                                    <td>{item.quantity}</td>
                                                    <td style={{ fontWeight: 700 }}>{(item.unit_price * item.quantity).toFixed(2)} Dhs</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Total */}
                                <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '1rem', fontWeight: 700 }}>
                                    Total payé : <span style={{ color: '#FFA500' }}>{Number(order.total_amount).toFixed(2)} Dhs</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Layout>
    );
};

export default OrdersPage;
