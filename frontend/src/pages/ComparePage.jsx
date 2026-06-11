import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const ComparePage = () => {
    const [products, setProducts] = useState([]);
    const [selected, setSelected] = useState([]);
    const [catalog, setCatalog] = useState([]);

    useEffect(() => {
        api.get('/products?sort=newest')
            .then((response) => setCatalog(response.data.data || []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        Promise.all(selected.map((id) => api.get(`/products/${id}`).then((response) => response.data.product)))
            .then(setProducts)
            .catch(console.error);
    }, [selected]);

    const toggle = (id) => {
        setSelected((prev) => {
            if (prev.includes(id)) return prev.filter((item) => item !== id);
            if (prev.length >= 3) return prev;
            return [...prev, id];
        });
    };

    return (
        <Layout>
            <PageHeader eyebrow="Comparaison" title="Comparer des produits" subtitle="Choisissez jusqu'a 3 produits pour comparer les informations importantes." />

            <div className="card-white" style={{ marginBottom: 18 }}>
                <h3>Choisir 2 ou 3 produits</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {catalog.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => toggle(product.id)}
                            style={{
                                border: '1px solid var(--border)',
                                background: selected.includes(product.id) ? '#F59E0B' : 'white',
                                color: selected.includes(product.id) ? 'white' : 'var(--dark)',
                                borderRadius: 999,
                                padding: '8px 12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                            }}
                        >
                            {product.name}
                        </button>
                    ))}
                </div>
            </div>

            {products.length === 0 ? (
                <EmptyState title="Aucun produit selectionne" description="Selectionnez des produits pour comparer le prix, stock, note et categorie." />
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <tbody>
                            <CompareRow label="Produit" products={products} render={(p) => <strong>{p.name}</strong>} />
                            <CompareRow label="Categorie" products={products} render={(p) => p.category?.name || 'N/A'} />
                            <CompareRow label="Prix" products={products} render={(p) => `${Number(p.price).toFixed(2)} Dhs`} />
                            <CompareRow label="Stock" products={products} render={(p) => p.quantity} />
                            <CompareRow label="Note" products={products} render={(p) => p.reviews?.length ? `${(p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)}/5` : 'Pas encore'} />
                            <CompareRow label="Description" products={products} render={(p) => p.description || 'N/A'} />
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
};

const CompareRow = ({ label, products, render }) => (
    <tr>
        <th style={{ width: 160 }}>{label}</th>
        {products.map((product) => (
            <td key={`${label}-${product.id}`}>{render(product)}</td>
        ))}
    </tr>
);

export default ComparePage;
