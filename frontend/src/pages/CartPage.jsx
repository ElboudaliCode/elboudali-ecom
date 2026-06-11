import React, { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { storageUrl } from '../api/config';

const CartPage = () => {
    const { cart, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
    const navigate = useNavigate();

    const items = cart?.items || [];
    const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    if (items.length === 0) return (
        <Layout>
            <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛒</div>
                <h3 style={{ color: '#555', marginBottom: '16px' }}>Votre panier est vide</h3>
                <Link to="/" className="btn-cart" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '5px' }}>
                    Continuer mes achats
                </Link>
            </div>
        </Layout>
    );

    return (
        <Layout>
            {/* Titre + breadcrumb */}
            <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> › Mon Panier
                </span>
                <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>🛒 Mon Panier</h2>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                {/* Tableau articles */}
                <div style={{ flex: 2, background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Produit</th>
                                <th>Prix unitaire</th>
                                <th>Quantité</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const imgUrl = storageUrl(item.product.image);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '55px', height: '55px', borderRadius: '6px', overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {imgUrl ? <img src={imgUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>🏷️</span>}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.product.name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#888' }}>{item.product.category?.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: '#FFA500', fontWeight: 600 }}>{Number(item.product.price).toFixed(2)} Dhs</td>
                                        <td>
                                            <div className="qty-control">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{(item.product.price * item.quantity).toFixed(2)} Dhs</td>
                                        <td>
                                            <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#dc3545', fontSize: '1.2rem', cursor: 'pointer' }} title="Supprimer">✕</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '10px' }}>
                        <Link to="/" className="btn-detail">← Continuer mes achats</Link>
                        <button onClick={clearCart} style={{ padding: '7px 14px', background: 'none', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '5px', cursor: 'pointer', fontSize: '0.83rem' }}>
                            Vider le panier
                        </button>
                    </div>
                </div>

                {/* Résumé */}
                <div className="cart-summary" style={{ flex: 1, minWidth: '260px' }}>
                    <h3>Résumé de la commande</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                        <span>Sous-total ({items.length} article{items.length > 1 ? 's' : ''})</span>
                        <span style={{ fontWeight: 600 }}>{subtotal.toFixed(2)} Dhs</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem', color: '#888' }}>
                        <span>Livraison</span>
                        <span>Calculée à l'étape suivante</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.1rem', fontWeight: 700 }}>
                        <span>Total estimé</span>
                        <span style={{ color: '#FFA500' }}>{subtotal.toFixed(2)} Dhs</span>
                    </div>
                    <button className="btn-checkout" onClick={() => navigate('/checkout')}>
                        Passer à la caisse →
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default CartPage;
