# Pack de vente - Elboudali Ecom

## Positionnement

Elboudali Ecom est une application e-commerce complete pour une boutique en ligne marocaine: catalogue, panier, commandes, livraison, retours, coupons, fidelite, notifications, support et dashboard admin.

## Demo rapide

Backend: `http://localhost:8000`
Frontend: `http://localhost:5173`

Comptes demo:

- Admin: `admin@demo.com` / `Password123`
- Superviseur: `superviseur@demo.com` / `Password123`
- Client: `client@demo.com` / `Password123`

## Parcours de presentation

1. Ouvrir l'accueil et montrer le design, les categories, les promotions et les filtres.
2. Ouvrir un produit et montrer galerie, avis, stock, badges et ajout panier.
3. Se connecter comme client et montrer favoris, panier, checkout, historique, retours et support.
4. Se connecter comme admin et montrer dashboard, exports, produits, commandes, livraison, retours, coupons et utilisateurs.
5. Se connecter comme superviseur et montrer les actions stock/livraison sans acces total admin.

## Fonctionnalites vendables

- Catalogue de demonstration avec 784 produits actifs, galeries coherentes, categories, badges, promotions et filtres avances.
- Panier, checkout, adresse, paiement a la livraison securise et suivi commande.
- Back-office admin avec statistiques, gestion produits, categories, commandes et exports.
- Gestion livraison avec statut, frais, date estimee et tracking.
- Retours clients avec validation admin.
- Coupons et points fidelite.
- Favoris avec notes personnelles.
- Avis clients avec images.
- Notifications client/admin.
- Support/tickets entre client et equipe.
- Formulaire contact public avec suivi dans l administration.
- Pages confidentialite, CGV, livraison, retours et remboursements.
- Securite: throttling, validation mot de passe, headers securite, gestion 401.
- Documentation installation et configuration production.

## Captures conseillees

Captures deja generees dans le dossier Codex outputs:

- `sales-screenshots/01-home.png`
- `sales-screenshots/02-login.png`
- `sales-screenshots/03-product-detail.png`

Captures a prendre manuellement apres login:

- Dashboard admin
- Liste produits admin
- Commandes admin
- Livraison admin
- Retours admin
- Profil client ou favoris
- Panier/checkout client

## Prix possible

Prix demo/projet etudiant ameliore: 1 500 - 3 000 MAD.
Prix petit client avec installation: 3 500 - 7 000 MAD.
Prix avec personnalisation, domaine, hebergement et formation: 7 000 - 15 000 MAD.

Le prix depend surtout de:

- Personnalisation design/logo/couleurs.
- Hebergement et mise en ligne.
- Ajout paiement reel.
- Formation admin.
- Maintenance apres livraison.

## Options a vendre en plus

- Integration paiement en ligne CMI ou Payzone apres affiliation marchand.
- Dashboard financier plus avance.
- Emails automatiques facture/livraison.
- Module WhatsApp commande/support.
- Multi-boutique ou multi-vendeur.
- App mobile client.
- Optimisation SEO.
- Deploiement production avec nom de domaine.

## Checklist avant remise client

- Remplacer le nom, logo, couleurs et images selon le client.
- Remplacer le catalogue de demonstration par les references, prix, stocks et images autorisees du fournisseur du client.
- Creer une base propre avec `php artisan migrate --force` et importer uniquement les donnees du client.
- Changer tous les comptes demo.
- Mettre `APP_ENV=production` et `APP_DEBUG=false`.
- Configurer `APP_URL`, `FRONTEND_URL`, `VITE_API_URL`, `VITE_STORAGE_URL`.
- Configurer identite, contact, SMTP et `SEED_DEMO_DATA=false`.
- Lancer `php artisan storage:link`.
- Tester login, achat, commande, livraison, retour, support et dashboard.
- Faire une sauvegarde de la base apres installation.
