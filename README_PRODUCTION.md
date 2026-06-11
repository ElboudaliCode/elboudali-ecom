# Elboudali Ecom - Guide installation et vente

Application e-commerce Laravel + React avec back-office, gestion produits, commandes, livraison, retours, favoris, coupons, support, avis clients, notifications et tableau de bord.

## Comptes demo

- Admin: `admin@demo.com` / `Password123`
- Superviseur: `superviseur@demo.com` / `Password123`
- Client: `client@demo.com` / `Password123`

## Installation locale

### Backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Par defaut:

- Backend API: `http://localhost:8000/api`
- Frontend: `http://localhost:5173`
- Storage public: `http://localhost:8000/storage`

## Configuration production

Backend `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.votre-domaine.com
FRONTEND_URL=https://votre-domaine.com
DB_CONNECTION=mysql
DB_DATABASE=nom_base
DB_USERNAME=utilisateur
DB_PASSWORD=mot_de_passe_fort
FILESYSTEM_DISK=public
```

Frontend `.env`:

```env
VITE_API_URL=https://api.votre-domaine.com/api
VITE_STORAGE_URL=https://api.votre-domaine.com/storage
```

Build frontend:

```bash
npm run build
```

Commandes backend utiles en production:

```bash
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Checklist avant livraison client

- Changer tous les mots de passe demo.
- Mettre `APP_DEBUG=false`.
- Configurer un vrai SMTP si les emails sont actives.
- Verifier les droits du dossier `storage`.
- Tester inscription, login, achat, paiement, facture, retour et dashboard admin.
- Faire une sauvegarde de la base avant chaque mise a jour.

## Valeur commerciale du produit

- Back-office complet pour administrateur et superviseur.
- Parcours client complet: catalogue, filtres, favoris, panier, commande et historique.
- Modules avances: promotions, coupons, points fidelite, retours, notifications, support et exports.
- Interface moderne responsive prete a personnaliser pour un client final.
