import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const ContactPage = () => {
    const [sent, setSent] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        setSent(true);
        event.currentTarget.reset();
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <div className="page-breadcrumb"><Link to="/">Accueil</Link> / Contact</div>
                    <h2>Contact</h2>
                    <p>Besoin d'une information, d'un devis ou d'une aide sur une commande ? Envoyez-nous un message.</p>
                </div>
            </div>

            <div className="contact-layout">
                <section className="card-white contact-card">
                    <h3>Envoyer un message</h3>
                    {sent && <div className="alert alert-success">Message prepare avec succes. Notre equipe vous repondra rapidement.</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nom complet</label>
                            <input type="text" name="name" placeholder="Votre nom" required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" placeholder="exemple@gmail.com" required />
                        </div>
                        <div className="form-group">
                            <label>Sujet</label>
                            <input type="text" name="subject" placeholder="Commande, produit, partenariat..." required />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea name="message" rows="5" placeholder="Ecrivez votre message..." required />
                        </div>
                        <button type="submit" className="btn-primary-full">Envoyer</button>
                    </form>
                </section>

                <aside className="contact-side">
                    <div className="card-white">
                        <h3>Informations</h3>
                        <div className="contact-line"><strong>Telephone</strong><span>(+212) 6 00 00 00 00</span></div>
                        <div className="contact-line"><strong>Email</strong><span>contact@elboudali-store.com</span></div>
                        <div className="contact-line"><strong>Ville</strong><span>Casablanca, Maroc</span></div>
                    </div>
                    <div className="card-white">
                        <h3>Reponse rapide</h3>
                        <p>Pour les clients connectes, le support integre permet de garder l'historique des messages dans le site.</p>
                        <Link to="/support" className="btn-detail">Ouvrir le support</Link>
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default ContactPage;
