import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { storeConfig } from '../config/store';

const ContactPage = () => {
    const [sent, setSent] = useState(false);
    const [reference, setReference] = useState(null);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSent(false);
        setError(null);
        setSending(true);

        const form = event.currentTarget;
        const data = new FormData(form);

        try {
            const response = await api.post('/contact', {
                name: data.get('name'),
                email: data.get('email'),
                phone: data.get('phone') || null,
                subject: data.get('subject'),
                message: data.get('message'),
                consent: data.get('consent') === 'yes',
                website: data.get('website') || '',
            });
            setSent(true);
            setReference(response.data.reference);
            form.reset();
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : 'Impossible d envoyer le message maintenant.');
        } finally {
            setSending(false);
        }
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
                    {sent && <div className="alert alert-success">Message envoye avec succes. Reference: {reference}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}
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
                            <label>Telephone (optionnel)</label>
                            <input type="text" name="phone" placeholder="+212 6..." />
                        </div>
                        <div className="form-group">
                            <label>Sujet</label>
                            <input type="text" name="subject" placeholder="Commande, produit, partenariat..." required />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea name="message" rows="5" placeholder="Ecrivez votre message..." required />
                        </div>
                        <input className="contact-honeypot" type="text" name="website" tabIndex="-1" autoComplete="off" />
                        <label className="form-check legal-consent">
                            <input type="checkbox" name="consent" value="yes" required />
                            J accepte que mes informations soient utilisees pour traiter ma demande.
                        </label>
                        <button type="submit" className="btn-primary-full" disabled={sending}>{sending ? 'Envoi...' : 'Envoyer'}</button>
                    </form>
                </section>

                <aside className="contact-side">
                    <div className="card-white">
                        <h3>Informations</h3>
                        <div className="contact-line"><strong>Telephone</strong><span>{storeConfig.phone}</span></div>
                        <div className="contact-line"><strong>Email</strong><span>{storeConfig.email}</span></div>
                        <div className="contact-line"><strong>Adresse</strong><span>{storeConfig.address}</span></div>
                        <div className="contact-line"><strong>Horaires</strong><span>{storeConfig.supportHours}</span></div>
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
