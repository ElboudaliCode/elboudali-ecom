import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';

const SupportPage = () => {
    const { user } = useContext(AuthContext);
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [firstMsg, setFirstMsg] = useState('');
    const messagesEndRef = useRef(null);

    const isAdmin = user && (user.role === 'admin' || user.role === 'superviseur');

    useEffect(() => { 
        if (user) {
            fetchConversations(); 
        }
    }, [user]);

    useEffect(() => { 
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [messages]);

    if (!user) return <Navigate to="/login" />;

    const fetchConversations = async () => {
        try {
            const url = isAdmin ? '/admin/support/conversations' : '/support/conversations';
            const r = await api.get(url);
            setConversations(r.data);
        } catch (e) { console.error(e); }
    };

    const openConversation = async (convId) => {
        setIsCreating(false);
        try {
            const r = await api.get(`/support/conversations/${convId}`);
            setSelected(r.data);
            setMessages(r.data.messages || []);
        } catch (e) { console.error(e); }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selected) return;
        try {
            const url = isAdmin 
                ? `/admin/support/conversations/${selected.id}/messages` 
                : `/support/conversations/${selected.id}/messages`;
            const r = await api.post(url, { message: newMessage });
            
            // Recharger les messages pour avoir l'expéditeur formaté
            const updatedConv = await api.get(`/support/conversations/${selected.id}`);
            setMessages(updatedConv.data.messages || []);
            setNewMessage('');
            fetchConversations();
        } catch (e) { console.error(e); }
    };

    const handleCloseTicket = async () => {
        if (!selected) return;
        try {
            await api.post(`/admin/support/conversations/${selected.id}/close`);
            openConversation(selected.id);
            fetchConversations();
        } catch (e) { console.error(e); }
    };

    const createConversation = async (e) => {
        e.preventDefault();
        if (!newSubject.trim() || !firstMsg.trim()) return;
        try {
            const r = await api.post('/support/conversations', { subject: newSubject, message: firstMsg });
            setNewSubject(''); setFirstMsg(''); setIsCreating(false);
            fetchConversations();
            openConversation(r.data.id);
        } catch (e) { console.error(e); }
    };

    const getStatusBadge = (status) => {
        if (status === 'open') return { label: 'Ouvert', cls: 'badge-success' };
        if (status === 'replied') return { label: 'Répondu', cls: 'badge-info' };
        return { label: 'Fermé', cls: 'badge-secondary' };
    };

    return (
        <Layout>
            <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.83rem', color: '#888' }}>
                    <Link to="/" style={{ color: '#FFA500' }}>Accueil</Link> › Support
                </span>
                <h2 style={{ marginTop: '6px', fontSize: '1.3rem', fontWeight: 700 }}>
                    💬 {isAdmin ? 'Centre de Support (Staff)' : 'Assistance Client'}
                </h2>
            </div>

            <div style={{ display: 'flex', gap: '0', height: '580px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>

                {/* ---- LISTE CONVERSATIONS ---- */}
                <div style={{ width: '280px', minWidth: '280px', background: '#f8f8f8', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', background: '#FFA500' }}>
                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                            {isAdmin ? '📋 Toutes les demandes' : '📋 Mes demandes'}
                        </span>
                    </div>

                    {!isAdmin && (
                        <div style={{ padding: '10px' }}>
                            <button onClick={() => { setIsCreating(true); setSelected(null); }} style={{ width: '100%', padding: '8px', background: '#FFA500', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                + Nouvelle demande
                            </button>
                        </div>
                    )}

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {conversations.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                                Aucune conversation.
                            </div>
                        )}
                        {conversations.map(conv => {
                            const { label, cls } = getStatusBadge(conv.status);
                            return (
                                <div key={conv.id} onClick={() => openConversation(conv.id)}
                                    style={{ padding: '12px', borderBottom: '1px solid #efefef', cursor: 'pointer', background: selected?.id === conv.id ? '#fff3e0' : 'transparent', borderLeft: selected?.id === conv.id ? '3px solid #FFA500' : '3px solid transparent', transition: 'all 0.15s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: selected?.id === conv.id ? '#FFA500' : '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                                            {conv.subject}
                                        </div>
                                        <span className={`badge ${cls}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{label}</span>
                                    </div>
                                    {isAdmin && conv.user && (
                                        <div style={{ fontSize: '0.77rem', color: '#888', marginBottom: '3px' }}>👤 {conv.user.name}</div>
                                    )}
                                    <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                        {new Date(conv.updated_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ---- ZONE MESSAGES ---- */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {isCreating ? (
                        /* Formulaire nouvelle conversation */
                        <div style={{ padding: '24px' }}>
                            <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: '#333' }}>Nouvelle demande de support</h3>
                            <form onSubmit={createConversation}>
                                <div className="form-group">
                                    <label>Sujet</label>
                                    <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Décrivez brièvement votre problème..." required />
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea value={firstMsg} onChange={e => setFirstMsg(e.target.value)} placeholder="Détaillez votre demande ici..." required rows="5"
                                        style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '5px', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="btn-primary-full" style={{ flex: 1 }}>Envoyer la demande</button>
                                    <button type="button" onClick={() => setIsCreating(false)} style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid #e0e0e0', borderRadius: '5px', cursor: 'pointer' }}>Annuler</button>
                                </div>
                            </form>
                        </div>
                    ) : selected ? (
                        <>
                            {/* Header conversation */}
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selected.subject}</div>
                                    {isAdmin && <div style={{ fontSize: '0.78rem', color: '#888' }}>Client : {selected.user?.name}</div>}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className={`badge ${getStatusBadge(selected.status).cls}`}>
                                        {getStatusBadge(selected.status).label}
                                    </span>
                                    {isAdmin && selected.status !== 'closed' && (
                                        <button
                                            onClick={handleCloseTicket}
                                            style={{
                                                padding: '4px 10px', background: '#dc3545', color: 'white',
                                                border: 'none', borderRadius: '4px', cursor: 'pointer',
                                                fontSize: '0.75rem', fontWeight: 600
                                            }}
                                        >
                                            Fermer le ticket
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fcfcfc' }}>
                                {messages.map(msg => {
                                    const isMe = msg.sender_id === user.id;
                                    const senderIsStaff = msg.sender_type === 'admin' || msg.sender_type === 'superviseur';
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '3px' }}>
                                                {msg.sender?.name} · {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div
                                                style={{ 
                                                    maxWidth: '70%', padding: '10px 14px', 
                                                    borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0', 
                                                    fontSize: '0.88rem', lineHeight: 1.5, 
                                                    background: isMe ? '#FFA500' : senderIsStaff ? '#28a745' : '#e9ecef', 
                                                    color: isMe || senderIsStaff ? 'white' : '#333' 
                                                }}
                                            >
                                                {msg.message}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Barre d'envoi (visible si le ticket n'est pas fermé) */}
                            {selected.status !== 'closed' ? (
                                <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px', background: 'white' }}>
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Écrivez votre réponse..."
                                        style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: '20px', fontSize: '0.88rem', outline: 'none' }} />
                                    <button type="submit" style={{ padding: '10px 20px', background: '#FFA500', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 600 }}>
                                        Répondre
                                    </button>
                                </form>
                            ) : (
                                <div style={{ padding: '15px', textAlign: 'center', background: '#f5f5f5', color: '#888', fontSize: '0.88rem', fontStyle: 'italic' }}>
                                    Cette conversation est clôturée. Les réponses ne sont plus autorisées.
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
                            <p style={{ fontSize: '0.9rem' }}>Sélectionnez une conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SupportPage;
