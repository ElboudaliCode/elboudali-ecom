import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';
import PasswordField from '../components/PasswordField';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [token, setToken] = useState(searchParams.get('token') || '');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);

        if (password !== passwordConfirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            setError('Le mot de passe doit contenir au moins 8 caracteres, une lettre et un chiffre.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/reset-password', {
                token,
                email: email.trim().toLowerCase(),
                password,
                password_confirmation: passwordConfirmation,
            });

            setMessage(response.data.message);
            setPassword('');
            setPasswordConfirmation('');
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : 'Lien invalide ou expire.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="form-page">
                <div className="form-box">
                    <div className="form-box-header">
                        Nouveau mot de passe
                        <span style={{ display: 'block', marginTop: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
                            Choisissez un nouveau mot de passe securise.
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
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    inputMode="email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Token de recuperation</label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(event) => setToken(event.target.value)}
                                    required
                                />
                            </div>
                            <PasswordField
                                label="Nouveau mot de passe"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <PasswordField
                                label="Confirmer le nouveau mot de passe"
                                value={passwordConfirmation}
                                onChange={(event) => setPasswordConfirmation(event.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button type="submit" className="btn-primary-full" disabled={loading}>
                                {loading ? 'Modification...' : 'Changer le mot de passe'}
                            </button>
                        </form>
                        <div className="form-footer-link">
                            Mot de passe change ? <Link to="/login">Se connecter</Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ResetPassword;
