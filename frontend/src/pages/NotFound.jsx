import React from 'react';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';

const NotFound = () => (
    <Layout>
        <EmptyState
            title="Page introuvable"
            description="La page demandee n'existe pas ou a ete deplacee."
            actionLabel="Retour a l'accueil"
            actionTo="/"
        />
    </Layout>
);

export default NotFound;
