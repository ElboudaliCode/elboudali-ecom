import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { storeConfig } from '../config/store';

const pages = {
    privacy: {
        title: 'Politique de confidentialite',
        intro: 'Cette politique explique comment les donnees personnelles sont collectees et utilisees sur notre boutique.',
        sections: [
            ['Donnees collectees', 'Nous collectons les informations necessaires a la creation du compte, la livraison, le paiement, le support et la securite: nom, email, telephone, adresse, commandes et messages.'],
            ['Finalites', 'Ces donnees servent uniquement a executer les commandes, assurer le service client, prevenir la fraude et respecter les obligations legales.'],
            ['Conservation et securite', 'Les donnees sont conservees pendant la duree necessaire aux finalites annoncees. Les mots de passe sont hashes et les acces administratifs sont proteges.'],
            ['Vos droits', `Vous pouvez demander l acces, la rectification ou la suppression de vos donnees en contactant ${storeConfig.email}. Certaines donnees de facturation peuvent devoir etre conservees.`],
            ['Cookies', 'Le site utilise le stockage local pour la session, le panier et les preferences. Les outils de mesure optionnels doivent etre actives uniquement apres consentement.'],
        ],
    },
    terms: {
        title: 'Conditions generales de vente',
        intro: 'Ces conditions encadrent les commandes passees sur la boutique. Elles doivent etre relues avec un conseiller juridique avant une exploitation commerciale definitive.',
        sections: [
            ['Produits et prix', 'Les caracteristiques essentielles, la disponibilite et les prix en dirhams sont presentes avant la validation de la commande. Les frais de livraison sont affiches separement.'],
            ['Commande', 'La commande est confirmee apres verification du panier, de l adresse et du moyen de paiement. Une reference et un suivi sont fournis au client.'],
            ['Paiement', 'Les moyens disponibles sont affiches au checkout. Le paiement a la livraison reste en attente jusqu a la remise du colis. Le paiement par carte exige une plateforme affiliee et securisee.'],
            ['Livraison', 'Les delais sont des estimations. Le client doit fournir une adresse et un numero de telephone valides pour permettre la livraison.'],
            ['Retours et reclamations', `Les demandes sont traitees depuis l espace client ou par email a ${storeConfig.email}. Le droit de retractation applicable depend de la nature du produit et de la legislation en vigueur.`],
        ],
    },
    shipping: {
        title: 'Livraison, retours et remboursements',
        intro: 'Les modalites ci-dessous donnent un cadre clair au client avant son achat.',
        sections: [
            ['Livraison standard', 'Livraison estimee sous 4 a 5 jours ouvrables, selon la ville, la disponibilite du produit et le transporteur.'],
            ['Livraison express', 'Livraison estimee sous 1 a 2 jours ouvrables dans les zones couvertes. Le tarif est affiche avant confirmation.'],
            ['Retrait magasin', 'Le retrait est disponible uniquement lorsque cette option est proposee au checkout. Une confirmation est envoyee avant deplacement.'],
            ['Demande de retour', 'Une demande de retour peut etre deposee depuis l historique des commandes apres livraison. Le produit doit etre conserve avec ses accessoires et son emballage lorsque cela est applicable.'],
            ['Remboursement', 'Apres validation du retour, le remboursement est effectue selon le moyen de paiement et les delais de l operateur. Les produits exclus du droit de retractation restent soumis aux regles legales applicables.'],
        ],
    },
};

const LegalPage = ({ type }) => {
    const page = pages[type] || pages.terms;

    return (
        <Layout>
            <div className="page-header">
                <div>
                    <div className="page-breadcrumb"><Link to="/">Accueil</Link> / Informations legales</div>
                    <h2>{page.title}</h2>
                    <p>{page.intro}</p>
                </div>
            </div>

            <div className="legal-layout">
                <article className="card-white legal-content">
                    {page.sections.map(([title, content]) => (
                        <section key={title}>
                            <h3>{title}</h3>
                            <p>{content}</p>
                        </section>
                    ))}
                </article>
                <aside className="card-white legal-company">
                    <h3>Editeur du site</h3>
                    <strong>{storeConfig.legalName}</strong>
                    <span>{storeConfig.address}</span>
                    <span>{storeConfig.email}</span>
                    <span>{storeConfig.phone}</span>
                    {storeConfig.ice && <span>ICE: {storeConfig.ice}</span>}
                    {storeConfig.rc && <span>RC: {storeConfig.rc}</span>}
                    <small>Derniere mise a jour: 27/06/2026</small>
                </aside>
            </div>
        </Layout>
    );
};

export default LegalPage;
