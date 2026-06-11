import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { storageUrl } from '../api/config';

const ProductDetailPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const isClient = user && user.role === 'client';
    const isAdmin = user && user.role === 'admin';
    const isSuperviseurOrAdmin = user && (user.role === 'admin' || user.role === 'superviseur');

    // Favoris
    const [isFavorite, setIsFavorite] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    // Carrousel
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Avis
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [reviewError, setReviewError] = useState(null);
    const [reviewSuccess, setReviewSuccess] = useState(null);
    const [hoverRating, setHoverRating] = useState(0);

    // --- MODE ÉDITION ---
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '', price: '', quantity: '', category_id: '', description: ''
    });
    const [mainImageFile, setMainImageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);

    const [similarProducts, setSimilarProducts] = useState([]);

    const loadProductDetails = () => {
        setLoading(true);
        api.get(`/products/${id}`)
            .then(r => { 
                const p = r.data.product;
                setProduct(p); 
                setSimilarProducts(r.data.similarProducts || []);
                setCurrentImageIndex(0);
                setEditForm({
                    name: p.name,
                    price: p.price,
                    quantity: p.quantity,
                    category_id: p.category_id,
                    description: p.description || ''
                });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProductDetails();
        // Charger les catégories pour le formulaire
        api.get('/categories')
            .then(r => setCategories(r.data.categories || []))
            .catch(() => {});
    }, [id]);

    // Vérifier si le produit est dans les favoris (clients seulement)
    useEffect(() => {
        if (isClient && id) {
            api.get('/favorites')
                .then(r => {
                    const found = r.data.some(f => f.product_id === parseInt(id));
                    setIsFavorite(found);
                })
                .catch(() => {});
        }
    }, [isClient, id]);

    const handleAddToCart = async () => {
        if (!user) { navigate('/login'); return; }
        try {
            await addToCart(product.id, qty);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (e) {
            alert("Erreur lors de l'ajout.");
        }
    };

    const toggleFavorite = async () => {
        if (!user) { navigate('/login'); return; }
        setFavLoading(true);
        try {
            if (isFavorite) {
                await api.delete(`/favorites/${id}`);
                setIsFavorite(false);
            } else {
                await api.post('/favorites', { product_id: parseInt(id) });
                setIsFavorite(true);
            }
        } catch (e) { console.error(e); }
        finally { setFavLoading(false); }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        setReviewError(null); setReviewSuccess(null);
        if (!user) { navigate('/login'); return; }
        try {
            const data = new FormData();
            data.append('rating', reviewRating);
            data.append('comment', reviewComment);
            reviewImages.forEach((file) => data.append('images[]', file));

            const r = await api.post(`/products/${id}/reviews`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProduct(prev => ({
                ...prev,
                reviews: [...(prev.reviews || []), r.data.review]
            }));
            setReviewComment('');
            setReviewImages([]);
            setReviewRating(5);
            setReviewSuccess('Votre avis a été ajouté avec succès !');
        } catch (e) {
            setReviewError(e.response?.data?.message || 'Erreur lors de la soumission.');
        }
    };

    // --- ACTIONS D'ÉDITION ---
    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setEditError(null); setEditSuccess(null);

        const data = new FormData();
        data.append('name', editForm.name);
        data.append('price', editForm.price);
        data.append('quantity', editForm.quantity);
        data.append('category_id', editForm.category_id);
        data.append('description', editForm.description);

        if (mainImageFile) {
            data.append('image', mainImageFile);
        }

        if (galleryFiles.length > 0) {
            for (let i = 0; i < galleryFiles.length; i++) {
                data.append('gallery_images[]', galleryFiles[i]);
            }
        }

        try {
            // Note: POST avec id/update car multipart/form-data ne supporte pas PUT directement sous Laravel
            await api.post(`/products/${id}/update`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEditSuccess('Produit mis à jour avec succès !');
            setMainImageFile(null);
            setGalleryFiles([]);
            setIsEditing(false);
            loadProductDetails(); // Recharger les données à jour
        } catch (err) {
            const errors = err.response?.data?.errors;
            setEditError(errors ? Object.values(errors).flat().join(' | ') : 'Erreur lors de la modification.');
        }
    };

    const handleReplaceGalleryImage = async (imageId, file) => {
        if (!file) return;
        const data = new FormData();
        data.append('image', file);
        try {
            await api.post(`/admin/product-images/${imageId}/update`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            loadProductDetails();
        } catch (err) {
            alert("Erreur lors de la modification de l'image.");
        }
    };

    const handleDeleteGalleryImage = async (imageId) => {
        if (!window.confirm('Supprimer cette image de la galerie ?')) return;
        try {
            await api.delete(`/admin/product-images/${imageId}`);
            // Mettre à jour la galerie locale
            setProduct(prev => ({
                ...prev,
                images: prev.images.filter(img => img.id !== imageId)
            }));
            setCurrentImageIndex(0);
        } catch (err) {
            alert("Erreur lors de la suppression de l'image.");
        }
    };

    const handleDeleteProduct = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce produit ?')) return;
        try {
            await api.delete(`/products/${id}`);
            alert('Produit supprimé avec succès.');
            navigate('/');
        } catch (err) {
            alert('Erreur lors de la suppression du produit.');
        }
    };

    const userHasReviewed = user && product?.reviews?.some(r => r.user_id === user.id);

    if (loading) return (
        <Layout><div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>⏳ Chargement...</div></Layout>
    );
    if (!product) return (
        <Layout><div style={{ textAlign: 'center', padding: '60px', color: '#dc3545' }}>❌ Produit introuvable.</div></Layout>
    );

    // Construire la liste de toutes les images
    const allImages = [];
    if (product.image) {
        allImages.push({ id: 'main', path: storageUrl(product.image), isMain: true });
    }
    if (product.images && product.images.length > 0) {
        product.images.forEach(img => {
            allImages.push({ id: img.id, path: storageUrl(img.image_path), isMain: false });
        });
    }

    const inStock = product.quantity > 0;
    const avgRating = product.reviews && product.reviews.length > 0
        ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
        : null;

    const prevImage = () => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1);
    const nextImage = () => setCurrentImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0);

    return (
        <Layout>
            {/* Breadcrumb */}
            <div style={{ fontSize: '0.83rem', color: '#888', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link>
                    {' › '}
                    <span style={{ color: '#FFA500' }}>{product.category?.name}</span>
                    {' › '}
                    {product.name}
                </div>
                {/* Boutons d'édition rapides pour le staff */}
                {isSuperviseurOrAdmin && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            style={{ padding: '6px 14px', background: '#FFA500', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {isEditing ? '👀 Voir fiche' : '📝 Modifier le produit'}
                        </button>
                        {isAdmin && (
                            <button
                                onClick={handleDeleteProduct}
                                style={{ padding: '6px 14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                                🗑️ Supprimer le produit
                            </button>
                        )}
                    </div>
                )}
            </div>

            {editError && <div className="alert alert-danger">{editError}</div>}
            {editSuccess && <div className="alert alert-success">{editSuccess}</div>}

            {isEditing ? (
                /* ==========================================
                   🛠️ FORMULAIRE DE MODIFICATION DU PRODUIT
                   ========================================== */
                <div className="card-white">
                    <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 700 }}>📝 Modifier : {product.name}</h2>
                    <form onSubmit={handleUpdateProduct}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>Nom du produit</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Catégorie</label>
                                <select
                                    value={editForm.category_id}
                                    onChange={e => setEditForm({ ...editForm, category_id: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none' }}
                                >
                                    <option value="">Sélectionner...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Prix (Dhs)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantité en stock</label>
                                <input
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label>Description</label>
                            <textarea
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                rows="4"
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e0e0e0', outline: 'none', resize: 'vertical' }}
                            />
                        </div>

                        {/* Gestion des photos existantes */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>🖼️ Photos actuelles</h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {allImages.map((img, i) => (
                                    <div key={i} style={{ position: 'relative', width: '90px', height: '90px', border: '1px solid #ccc', borderRadius: '6px', overflow: 'hidden' }}>
                                        <img src={img.path} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {img.isMain ? (
                                            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.65rem', textAlign: 'center', padding: '1px' }}>Principale</span>
                                        ) : (
                                            <div style={{ position: 'absolute', top: '2px', right: '2px', display: 'flex', gap: '2px' }}>
                                                {/* Bouton Remplacer direct 🔄 */}
                                                <label
                                                    style={{
                                                        background: '#FFA500', color: 'white', borderRadius: '50%',
                                                        width: '20px', height: '20px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.65rem'
                                                    }}
                                                    title="Remplacer cette image"
                                                >
                                                    🔄
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e => handleReplaceGalleryImage(img.id, e.target.files[0])}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                                {/* Bouton Supprimer ✕ */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteGalleryImage(img.id)}
                                                    style={{
                                                        background: '#dc3545', color: 'white', border: 'none',
                                                        borderRadius: '50%', width: '20px', height: '20px',
                                                        cursor: 'pointer', fontSize: '0.7rem', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title="Supprimer cette image"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Upload de nouvelles photos */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <div className="form-group">
                                <label>Remplacer la photo principale</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setMainImageFile(e.target.files[0])}
                                    style={{ border: 'none', padding: 0 }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Ajouter des photos à la galerie (plusieurs possibles)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={e => setGalleryFiles(e.target.files)}
                                    style={{ border: 'none', padding: 0 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                            <button type="submit" className="btn-cart" style={{ flex: 1, padding: '12px' }}>
                                💾 Enregistrer les modifications
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsEditing(false); setMainImageFile(null); setGalleryFiles([]); }}
                                style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                /* ==========================================
                   👀 FICHE DÉTAIL CLASSIQUE
                   ========================================== */
                <>
                    <div className="product-detail-shell" style={{ display: 'flex', gap: '30px', background: 'white', borderRadius: '8px', padding: '25px', border: '1px solid #e0e0e0' }}>
                        {/* Carrousel d'images */}
                        <div style={{ flex: '0 0 400px', position: 'relative' }}>
                            {allImages.length > 0 ? (
                                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img
                                        src={allImages[currentImageIndex]?.path}
                                        alt={`${product.name} - Image ${currentImageIndex + 1}`}
                                        style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }}
                                    />

                                    {allImages.length > 1 && (
                                        <>
                                            <button onClick={prevImage} style={{
                                                position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                                                cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
                                            }}>◀</button>
                                            <button onClick={nextImage} style={{
                                                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                                                cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
                                            }}>▶</button>
                                        </>
                                    )}

                                    {allImages.length > 1 && (
                                        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
                                            {allImages.map((_, i) => (
                                                <span
                                                    key={i}
                                                    onClick={() => setCurrentImageIndex(i)}
                                                    style={{
                                                        width: '10px', height: '10px', borderRadius: '50%', cursor: 'pointer',
                                                        background: i === currentImageIndex ? '#FFA500' : 'rgba(255,255,255,0.6)',
                                                        border: '1px solid rgba(255,255,255,0.8)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {allImages.length > 1 && (
                                        <span style={{
                                            position: 'absolute', top: '10px', left: '10px',
                                            background: 'rgba(0,0,0,0.5)', color: 'white',
                                            padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', zIndex: 2
                                        }}>
                                            {currentImageIndex + 1} / {allImages.length}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: '400px', background: 'linear-gradient(135deg,#f0f0f0,#e0e0e0)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '4rem', color: '#ccc' }}>
                                    🏷️
                                </div>
                            )}

                            {/* Miniatures */}
                            {allImages.length > 1 && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto' }}>
                                    {allImages.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img.path}
                                            alt={`Miniature ${i + 1}`}
                                            onClick={() => setCurrentImageIndex(i)}
                                            style={{
                                                width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px',
                                                cursor: 'pointer', flexShrink: 0,
                                                border: i === currentImageIndex ? '2px solid #FFA500' : '2px solid transparent',
                                                opacity: i === currentImageIndex ? 1 : 0.6,
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Bouton Favori (clients seulement) */}
                            {isClient && (
                                <button
                                    onClick={toggleFavorite}
                                    disabled={favLoading}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        border: 'none', cursor: 'pointer', fontSize: '1.2rem',
                                        background: isFavorite ? '#dc3545' : 'rgba(255,255,255,0.9)',
                                        color: isFavorite ? 'white' : '#dc3545',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        transition: 'all 0.2s', zIndex: 3
                                    }}
                                >
                                    {isFavorite ? '❤️' : '🤍'}
                                </button>
                            )}
                        </div>

                        {/* Détails */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '6px' }}>{product.category?.name}</div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>{product.name}</h1>

                            {avgRating && (
                                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ color: '#FFA500', fontSize: '1.1rem' }}>{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                                    <span style={{ fontSize: '0.88rem', color: '#555' }}>{avgRating}/5 ({product.reviews.length} avis)</span>
                                </div>
                            )}

                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFA500', marginBottom: '16px' }}>
                                {Number(product.price).toFixed(2)} Dhs
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                {inStock ? (
                                    <span className="badge badge-success">✓ En stock ({product.quantity} disponibles)</span>
                                ) : (
                                    <span className="badge badge-danger">✗ Rupture de stock</span>
                                )}
                            </div>

                            {product.description && (
                                <div style={{ marginBottom: '20px', color: '#555', lineHeight: 1.6, fontSize: '0.9rem' }}>
                                    {product.description}
                                </div>
                            )}

                            {/* Quantité + Ajouter (clients seulement) */}
                            {inStock && (!user || user.role === 'client') && (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                                    <div className="qty-control">
                                        <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                                        <span>{qty}</span>
                                        <button onClick={() => setQty(q => Math.min(product.quantity, q + 1))}>+</button>
                                    </div>
                                    <button
                                        className="btn-cart"
                                        onClick={handleAddToCart}
                                        style={{ padding: '10px 24px', fontSize: '0.95rem' }}
                                    >
                                        {added ? '✓ Ajouté !' : '🛒 Ajouter au panier'}
                                    </button>
                                </div>
                            )}

                            <Link to="/" style={{ color: '#FFA500', fontSize: '0.85rem' }}>← Retour au catalogue</Link>
                        </div>
                    </div>

                    {/* ===== SECTION AVIS CLIENTS ===== */}
                    <div className="card-white" style={{ marginTop: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>⭐ Avis Clients ({product.reviews?.length || 0})</h3>

                        {/* Formulaire d'ajout d'avis */}
                        {isClient && !userHasReviewed && (
                            <div style={{ marginBottom: '20px', padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                                <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>📝 Laisser votre avis</h4>
                                {reviewError && <div className="alert alert-danger" style={{ marginBottom: '10px' }}>{reviewError}</div>}
                                {reviewSuccess && <div className="alert alert-success" style={{ marginBottom: '10px' }}>{reviewSuccess}</div>}
                                <form onSubmit={submitReview}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Note :</label>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setReviewRating(star)}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        fontSize: '1.5rem', color: star <= (hoverRating || reviewRating) ? '#FFA500' : '#ddd',
                                                        transition: 'color 0.15s'
                                                    }}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                            <span style={{ marginLeft: '8px', color: '#555', fontSize: '0.85rem', alignSelf: 'center' }}>{reviewRating}/5</span>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <textarea
                                            value={reviewComment}
                                            onChange={e => setReviewComment(e.target.value)}
                                            placeholder="Partagez votre expérience avec ce produit..."
                                            required rows="3"
                                            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '5px', fontSize: '0.88rem', outline: 'none', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Photos de votre avis (optionnel)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={e => setReviewImages(Array.from(e.target.files || []).slice(0, 3))}
                                        />
                                        {reviewImages.length > 0 && (
                                            <small style={{ color: '#64748B' }}>{reviewImages.length} image(s) selectionnee(s)</small>
                                        )}
                                    </div>
                                    <button type="submit" className="btn-cart" style={{ padding: '8px 20px', borderRadius: '5px', fontSize: '0.88rem' }}>
                                        Publier l'avis
                                    </button>
                                </form>
                            </div>
                        )}

                        {isClient && userHasReviewed && (
                            <div style={{ marginBottom: '16px', padding: '10px', background: '#d4edda', borderRadius: '6px', fontSize: '0.85rem', color: '#155724' }}>
                                ✅ Vous avez déjà évalué ce produit.
                            </div>
                        )}

                        {product.reviews && product.reviews.length > 0 ? (
                            product.reviews.map(review => (
                                <div key={review.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <strong style={{ fontSize: '0.9rem' }}>{review.user?.name}</strong>
                                        <span style={{ color: '#FFA500' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                    </div>
                                    <p style={{ color: '#555', fontSize: '0.85rem', margin: 0 }}>{review.comment}</p>
                                    {review.images && review.images.length > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                                            {review.images.map(img => (
                                                <img
                                                    key={img.id}
                                                    src={storageUrl(img.image_path)}
                                                    alt="Avis client"
                                                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#888', fontSize: '0.88rem' }}>Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
                        )}
                    </div>

                    {/* ===== PRODUITS SIMILAIRES ===== */}
                    {similarProducts.length > 0 && (
                        <div style={{ marginTop: '40px' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#333' }}>🛍️ Vous aimerez aussi...</h3>
                            <div className="product-grid">
                                {similarProducts.map(simProd => (
                                    <div key={simProd.id} className="product-card" onClick={() => navigate(`/products/${simProd.id}`)} style={{ cursor: 'pointer' }}>
                                        {simProd.image ? (
                                            <img src={storageUrl(simProd.image)} alt={simProd.name} className="card-img" />
                                        ) : (
                                            <div className="card-img-placeholder">🏷️</div>
                                        )}
                                        <div className="card-body">
                                            <div className="card-name" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{simProd.name}</div>
                                            <div className="card-price" style={{ fontSize: '0.9rem' }}>{Number(simProd.price).toFixed(2)} Dhs</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Layout>
    );
};

export default ProductDetailPage;
