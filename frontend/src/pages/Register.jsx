import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState(null);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        if (password !== passwordConfirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            setError('Le mot de passe doit contenir au moins 8 caracteres, une lettre et un chiffre.');
            return;
        }

        try {
            await register({ name, email, password, password_confirmation: passwordConfirmation });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'inscription.");
        }
    };

    return (
        <Layout>
            <div className="form-page">
                <div className="form-box">
                    <div className="form-box-header">
                        Creer un compte
                        <span style={{ display: 'block', marginTop: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
                            Rejoignez la boutique et profitez du programme fidelite.
                        </span>
                    </div>
                    <div className="form-box-body">
                        {error && <div className="form-error">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nom complet</label>
                                <input type="text" placeholder="Votre nom" value={name} onChange={(event) => setName(event.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Adresse email</label>
                                <input type="email" placeholder="email@exemple.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input type="password" placeholder="********" value={password} onChange={(event) => setPassword(event.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Confirmer le mot de passe</label>
                                <input type="password" placeholder="********" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required />
                            </div>
                            <button type="submit" className="btn-primary-full">S'inscrire</button>
                        </form>
                        <div className="form-footer-link">
                            Deja un compte ? <Link to="/login">Se connecter</Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Register;
