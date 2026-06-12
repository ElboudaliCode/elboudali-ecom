import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);
        setLoading(true);

        try {
            const response = await api.post('/forgot-password', { email: email.trim().toLowerCase() });
            setMessage(response.data.message);
            setEmail('');
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : 'Impossible de traiter cette demande maintenant.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="form-page">
                <div className="form-box">
                    <div className="form-box-header">
                        Mot de passe oublie
                        <span style={{ display: 'block', marginTop: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
                            Entrez votre email pour demander une recuperation.
                        </span>
                    </div>
                    <div className="form-box-body">
                        {message && <div className="alert alert-success">{message}</div>}
                        {error && <div className="form-error">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Adresse email</label>
                                <input
                                    type="email"
                                    placeholder="user00@gmail.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    inputMode="email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary-full" disabled={loading}>
                                {loading ? 'Envoi...' : 'Demander la recuperation'}
                            </button>
                        </form>
                        <div className="form-footer-link">
                            Vous avez le mot de passe ? <Link to="/login">Se connecter</Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ForgotPassword;
