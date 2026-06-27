import React, { useState, useEffect, useContext } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const CheckoutPage = () => {
    const { cart, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [paymentConfig, setPaymentConfig] = useState({ cod_enabled: true, card_enabled: false, paypal_enabled: false, provider: 'none' });
    const [deliveryMethod, setDeliveryMethod] = useState('standard');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
    const [couponError, setCouponError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    
    const [newAddress, setNewAddress] = useState({ title: '', address_line1: '', city: '', postal_code: '', country: '', phone: '' });
    const [showNewForm, setShowNewForm] = useState(false);

    useEffect(() => {
        if (!cart || !cart.items || cart.items.length === 0) {
            navigate('/cart');
            return;
        }
        fetchAddresses();
        fetchStoreConfig();
    }, [cart, navigate]);

    const fetchStoreConfig = async () => {
        try {
            const response = await api.get('/store/config');
            const payments = response.data.payments || {};
            setPaymentConfig((current) => ({ ...current, ...payments }));

            if (!payments.cod_enabled) {
                if (payments.card_enabled) setPaymentMethod('card');
                else if (payments.paypal_enabled) setPaymentMethod('paypal');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const r = await api.get('/addresses');
            setAddresses(r.data);
            const def = r.data.find(a => a.is_default);
            if (def) setSelectedAddress(def.id);
            else if (r.data.length > 0) setSelectedAddress(r.data[0].id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAddress = async (e) => {
        e.preventDefault();
        try {
            await api.post('/addresses', newAddress);
            setNewAddress({ title: '', address_line1: '', city: '', postal_code: '', country: '', phone: '' });
            setShowNewForm(false);
            fetchAddresses();
        } catch (err) {
            setError('Erreur lors de l\'ajout de l\'adresse.');
        }
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        setCouponError(null);
        if (!couponCode.trim()) {
            setCouponError('Veuillez saisir un code promo.');
            return;
        }
        try {
            const r = await api.post('/coupons/apply', { code: couponCode });
            setAppliedCoupon(r.data.coupon);
        } catch (err) {
            setCouponError(err.response?.data?.error || 'Code invalide.');
            setAppliedCoupon(null);
        }
    };

    const handleCheckout = async () => {
        if (!selectedAddress) { setError('Veuillez sélectionner une adresse.'); return; }
        if (total <= 0) { setError('Le total de la commande est invalide.'); return; }
        setSubmitting(true);
        try {
            await api.post('/checkout', {
                address_id: selectedAddress,
                payment_method: paymentMethod,
                coupon_code: appliedCoupon?.code || null,
                use_loyalty_points: useLoyaltyPoints,
                delivery_method: deliveryMethod
            });
            await clearCart();
            navigate('/orders');
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.error || 'Erreur lors de la commande.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Layout><div style={{ textAlign: 'center', padding: '60px' }}>⏳ Chargement...</div></Layout>;

    const items = cart?.items || [];
    const subtotal = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    let discount = 0;
    if (appliedCoupon) {
        discount = appliedCoupon.type === 'percentage' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value;
    }
    const totalAfterCoupon = Math.max(0, subtotal - discount);
    const availableLoyaltyDiscount = Math.floor((user?.loyalty_points || 0) / 100) * 10;
    const loyaltyDiscount = useLoyaltyPoints ? Math.min(availableLoyaltyDiscount, totalAfterCoupon) : 0;
    const loyaltyPointsUsed = Math.floor(loyaltyDiscount / 10) * 100;
    const deliveryOptions = {
        standard: { label: 'Livraison standard', fee: 20, days: '4-5 jours' },
        express: { label: 'Livraison express', fee: 35, days: '1-2 jours' },
        pickup: { label: 'Retrait magasin', fee: 0, days: '24h' },
    };
    const deliveryFee = deliveryOptions[deliveryMethod].fee;
    const total = Math.max(0, totalAfterCoupon - loyaltyDiscount) + deliveryFee;
    const loyaltyPointsEarned = Math.floor(total / 10);
    const paymentOptions = [
        paymentConfig.card_enabled && ['card', 'Carte bancaire'],
        paymentConfig.paypal_enabled && ['paypal', 'PayPal'],
        paymentConfig.cod_enabled && ['cod', 'Paiement a la livraison'],
    ].filter(Boolean);

    return (
        <Layout>
            <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> ›{' '}
                    <Link to="/cart" style={{ color: '#FFA500' }}>Panier</Link> › Validation
                </span>
                <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>Finaliser la commande</h2>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="checkout-layout">
                <div className="checkout-main">

                    <div className="card-white">
                        <h3>1. Adresse de livraison</h3>
                        {addresses.length === 0 || showNewForm ? (
                            <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <input placeholder="Titre (ex: Maison)" required value={newAddress.title} onChange={e => setNewAddress({...newAddress, title: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                <input placeholder="Adresse" required value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input placeholder="Ville" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    <input placeholder="Code Postal" required value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <input placeholder="Pays" required value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                <input placeholder="Téléphone" required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                <button type="submit" style={{ background: '#FFA500', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Enregistrer l'adresse</button>
                            </form>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {addresses.map(addr => (
                                        <label key={addr.id} style={{ display: 'flex', gap: '12px', padding: '12px', border: `2px solid ${selectedAddress === addr.id ? '#FFA500' : '#e0e0e0'}`, borderRadius: '6px', cursor: 'pointer', background: selectedAddress === addr.id ? '#fff3e0' : 'white' }}>
                                            <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{addr.title}</div>
                                                <div style={{ fontSize: '0.83rem', color: '#666' }}>{addr.address_line1}, {addr.city}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <button onClick={() => setShowNewForm(true)} style={{ marginTop: '10px', background: 'none', border: '1px solid #FFA500', color: '#FFA500', padding: '8px', cursor: 'pointer', borderRadius: '4px' }}>+ Ajouter une autre adresse</button>
                            </>
                        )}
                    </div>

                    <div className="card-white">
                        <h3>2. Mode de paiement</h3>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {paymentOptions.map(([val, label]) => (
                                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: `2px solid ${paymentMethod === val ? '#FFA500' : '#e0e0e0'}`, borderRadius: '6px', cursor: 'pointer', background: paymentMethod === val ? '#fff3e0' : 'white', fontSize: '0.88rem' }}>
                                    <input type="radio" name="payment" value={val} checked={paymentMethod === val} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    {label}
                                </label>
                            ))}
                        </div>
                        {!paymentConfig.card_enabled && (
                            <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
                                Le paiement par carte sera active apres affiliation CMI/Payzone. Aucun numero de carte n est collecte par ce site.
                            </div>
                        )}
                    </div>

                    <div className="card-white">
                        <h3>3. Livraison</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginTop: '8px' }}>
                            {Object.entries(deliveryOptions).map(([value, option]) => (
                                <label key={value} style={{ padding: '12px', border: `2px solid ${deliveryMethod === value ? '#F59E0B' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer', background: deliveryMethod === value ? '#FFF7ED' : 'white' }}>
                                    <input type="radio" name="delivery" value={value} checked={deliveryMethod === value} onChange={(e) => setDeliveryMethod(e.target.value)} />
                                    <div style={{ fontWeight: 800, marginTop: '6px' }}>{option.label}</div>
                                    <div style={{ color: '#64748B', fontSize: '0.8rem' }}>{option.days}</div>
                                    <div style={{ color: '#F59E0B', fontWeight: 800, marginTop: '4px' }}>{option.fee.toFixed(2)} Dhs</div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="checkout-summary-column">
                    <div className="card-white">
                        <h3>Votre commande</h3>
                        {items.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                                <span>{item.quantity}× {item.product.name}</span>
                                <span style={{ fontWeight: 600 }}>{(item.product.price * item.quantity).toFixed(2)} Dhs</span>
                            </div>
                        ))}
                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
                        <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                            <input type="text" placeholder="Code promo" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={{ flex: 1, padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: '5px', fontSize: '0.85rem' }} />
                            <button type="submit" style={{ padding: '7px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>OK</button>
                        </form>
                        {couponError && <div className="alert alert-danger" style={{ padding: 8 }}>{couponError}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                            <span>Sous-total</span><span>{subtotal.toFixed(2)} Dhs</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                            <span>Livraison ({deliveryOptions[deliveryMethod].label})</span><span>{deliveryFee.toFixed(2)} Dhs</span>
                        </div>
                        {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px', color: '#28a745', fontWeight: 700 }}>
                                <span>Reduction coupon</span><span>-{discount.toFixed(2)} Dhs</span>
                            </div>
                        )}

                        <div style={{ margin: '12px 0', padding: '12px', background: '#fff8e8', border: '1px solid #ffe0a3', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#9a6400' }}>Points fidelite</div>
                                    <div style={{ fontSize: '0.78rem', color: '#777' }}>
                                        {user?.loyalty_points || 0} point(s) disponible(s) - 100 points = 10 Dhs
                                    </div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#9a6400' }}>
                                    <input
                                        type="checkbox"
                                        checked={useLoyaltyPoints}
                                        disabled={availableLoyaltyDiscount <= 0}
                                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                                    />
                                    Utiliser
                                </label>
                            </div>
                            {useLoyaltyPoints && loyaltyDiscount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745', fontWeight: 700, fontSize: '0.84rem' }}>
                                    <span>{loyaltyPointsUsed} points utilises</span>
                                    <span>-{loyaltyDiscount.toFixed(2)} Dhs</span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px', color: '#FFA500' }}>
                            <span>Total</span><span>{total.toFixed(2)} Dhs</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#28a745', fontWeight: 700, marginBottom: '12px', textAlign: 'center' }}>
                            Vous gagnerez {loyaltyPointsEarned} point(s) fidelite avec cette commande.
                        </div>
                        <button className="btn-checkout" onClick={handleCheckout} disabled={!selectedAddress || submitting || showNewForm}>
                            {submitting ? '⏳ Traitement...' : '✓ Confirmer la commande'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CheckoutPage;
