import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { storeConfig } from '../config/store';

const AboutPage = () => (
    <Layout>
        <div className="page-header">
            <div>
                <div className="page-breadcrumb"><Link to="/">Accueil</Link> / A propos</div>
                <h2>A propos de {storeConfig.name}</h2>
                <p>Une boutique e-commerce complete pour vendre, gerer le stock, suivre les commandes et accompagner les clients.</p>
            </div>
        </div>

        <section className="about-hero">
            <div>
                <span className="hero-kicker">Boutique en ligne marocaine</span>
                <h1>Une experience e-commerce moderne pour le marche marocain.</h1>
                <p>
                    {storeConfig.name} combine un catalogue riche, une administration claire, des commandes suivies,
                    un support client et des statistiques pour presenter un projet credible a un client ou investisseur.
                </p>
                <div className="hero-actions">
                    <Link to="/" className="hero-btn">Voir le catalogue</Link>
                    <Link to="/contact" className="hero-btn secondary">Nous contacter</Link>
                </div>
            </div>
        </section>

        <section className="info-grid">
            <div className="card-white">
                <h3>Notre mission</h3>
                <p>Rendre la vente en ligne simple, rapide et facile a gerer pour une boutique locale ou un vendeur professionnel.</p>
            </div>
            <div className="card-white">
                <h3>Ce que la plateforme gere</h3>
                <p>Produits, categories, panier, commandes, coupons, retours, support, notifications, utilisateurs et tableau de bord.</p>
            </div>
            <div className="card-white">
                <h3>Pourquoi c'est vendable</h3>
                <p>Le site a un frontend public, un backend API, une base MySQL persistante et un espace admin utilisable en production.</p>
            </div>
        </section>

        <section className="process-strip">
            <div><strong>1</strong><span>Le client choisit ses produits.</span></div>
            <div><strong>2</strong><span>La commande passe par le checkout.</span></div>
            <div><strong>3</strong><span>L'admin suit livraison, paiement et stock.</span></div>
        </section>
    </Layout>
);

export default AboutPage;
