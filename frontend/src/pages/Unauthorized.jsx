import React from 'react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';

const Unauthorized = () => (
    <Layout>
        <EmptyState
            title="Acces non autorise"
            description="Vous n'avez pas les permissions necessaires pour acceder a cette page."
            actionLabel="Retour a l'accueil"
            actionTo="/"
        />
    </Layout>
);

export default Unauthorized;
