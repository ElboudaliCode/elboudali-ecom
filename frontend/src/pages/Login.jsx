import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        try {
            await login({ email: email.trim().toLowerCase(), password });
            navigate('/');
        } catch (err) {
            const errors = err.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : 'Email ou mot de passe incorrect. Verifiez que vous utilisez la meme adresse email que lors de l inscription.');
        }
    };

    return (
        <Layout>
            <div className="form-page">
                <div className="form-box">
                    <div className="form-box-header">
                        Connexion
                        <span style={{ display: 'block', marginTop: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
                            Accedez a votre espace client ou administration.
                        </span>
                    </div>
                    <div className="form-box-body">
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
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={remember}
                                    onChange={(event) => setRemember(event.target.checked)}
                                />
                                <label htmlFor="remember">Se souvenir de moi</label>
                            </div>
                            <button type="submit" className="btn-primary-full">
                                Se connecter
                            </button>
                        </form>
                        <div className="form-footer-link">
                            Pas encore de compte ? <Link to="/register">S'inscrire</Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Login;
