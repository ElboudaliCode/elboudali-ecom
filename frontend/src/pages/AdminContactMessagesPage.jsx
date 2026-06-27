import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const AdminContactMessagesPage = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/contact-messages');
            setMessages(response.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Impossible de charger les messages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMessages(); }, []);

    const updateStatus = async (id, status) => {
        await api.put(`/admin/contact-messages/${id}/status`, { status });
        setMessages((current) => current.map((message) => message.id === id ? { ...message, status } : message));
    };

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <div className="page-breadcrumb"><Link to="/">Accueil</Link> / Administration</div>
                    <h2>Messages de contact</h2>
                    <p>{messages.length} message(s) charge(s).</p>
                </div>
                <button className="btn-detail" onClick={fetchMessages}>Actualiser</button>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? <div className="card-white">Chargement...</div> : messages.length === 0 ? (
                <div className="empty-state"><h3>Aucun message</h3><p>Les demandes du formulaire public apparaitront ici.</p></div>
            ) : (
                <div className="contact-admin-list">
                    {messages.map((message) => (
                        <article key={message.id} className="card-white contact-admin-card">
                            <div className="contact-admin-head">
                                <div>
                                    <strong>{message.subject}</strong>
                                    <span>{message.name} - {message.email}{message.phone ? ` - ${message.phone}` : ''}</span>
                                </div>
                                <select value={message.status} onChange={(event) => updateStatus(message.id, event.target.value)}>
                                    <option value="new">Nouveau</option>
                                    <option value="read">Lu</option>
                                    <option value="closed">Ferme</option>
                                </select>
                            </div>
                            <p>{message.message}</p>
                            <small>{new Date(message.created_at).toLocaleString('fr-FR')}</small>
                        </article>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default AdminContactMessagesPage;
