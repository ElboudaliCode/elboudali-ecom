import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { storageUrl } from '../api/config';

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleAddToCart = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            await addToCart(product.id, 1);
            alert(`${product.name} a été ajouté au panier !`);
        } catch (error) {
            alert("Erreur lors de l'ajout au panier.");
        }
    };

    const imageUrl = product.image 
        ? storageUrl(product.image)
        : 'https://via.placeholder.com/300x200?text=Produit+sans+image';

    return (
        <div style={{ border: '1px solid #eaeaea', borderRadius: '8px', padding: '15px', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
            <h3 style={{ fontSize: '1.2rem', margin: '15px 0 10px' }}>{product.name}</h3>
            <p style={{ fontWeight: 'bold', color: '#e44d26', fontSize: '1.1rem' }}>{product.price} DH</p>
            {product.quantity > 0 ? (
                <p style={{ color: 'green', fontSize: '0.9rem' }}>En stock ({product.quantity})</p>
            ) : (
                <p style={{ color: 'red', fontSize: '0.9rem' }}>Rupture de stock</p>
            )}
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Link to={`/products/${product.id}`} style={{ padding: '8px 15px', backgroundColor: '#f8f9fa', color: '#333', textDecoration: 'none', borderRadius: '4px', border: '1px solid #ccc' }}>
                    Détails
                </Link>
                <button 
                    onClick={handleAddToCart}
                    disabled={product.quantity <= 0}
                    style={{ padding: '8px 15px', backgroundColor: product.quantity > 0 ? '#28a745' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: product.quantity > 0 ? 'pointer' : 'not-allowed' }}
                >
                    Au Panier
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
