import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products }) => {
    if (!products || products.length === 0) {
        return <p style={{ textAlign: 'center', marginTop: '30px' }}>Aucun produit trouvé.</p>;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', padding: '20px 0' }}>
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;
