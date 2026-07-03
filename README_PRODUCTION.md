# Elboudali Ecom - Guide production et livraison client

Ce document est la checklist de passage de la demo vers une boutique exploitable. Ne livrez jamais la production avec les comptes demo, `APP_DEBUG=true`, un domaine provisoire ou un moyen de paiement simule.

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

## 1. Identite du commerce

Renseigner les memes valeurs dans Railway et Vercel: nom commercial, raison sociale, email, telephone, WhatsApp, adresse, ICE et RC. Ces valeurs alimentent le header, le footer, les pages legales, le contact et les factures.

## 2. Configuration Railway

Backend `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.votre-domaine.com
FRONTEND_URL=https://votre-domaine.com
SEED_DEMO_DATA=false
DB_CONNECTION=mysql
DB_DATABASE=nom_base
DB_USERNAME=utilisateur
DB_PASSWORD=mot_de_passe_fort
FILESYSTEM_DISK=public
STORE_NAME="Nom boutique"
STORE_LEGAL_NAME="Raison sociale"
STORE_EMAIL=contact@votre-domaine.com
STORE_PHONE=+212600000000
STORE_WHATSAPP=212600000000
STORE_ADDRESS="Adresse complete"
STORE_CITY=Casablanca
STORE_COUNTRY=Maroc
STORE_ICE=
STORE_RC=
PAYMENT_PROVIDER=none
PAYMENT_COD_ENABLED=true
PAYMENT_CARD_ENABLED=false
PAYMENT_PAYPAL_ENABLED=false
```

`SEED_DEMO_DATA=false` evite de recreer ou de reinitialiser les comptes demo a chaque deploiement.
Le catalogue de demonstration reste synchronise; seuls les utilisateurs, commandes, avis et conversations de demo sont desactives par ce drapeau.

## 3. Configuration Vercel

```env
VITE_API_URL=https://api.votre-domaine.com/api
VITE_STORAGE_URL=https://api.votre-domaine.com/storage
VITE_STORE_NAME="Nom boutique"
VITE_STORE_TAGLINE="Votre slogan"
VITE_STORE_LEGAL_NAME="Raison sociale"
VITE_STORE_EMAIL=contact@votre-domaine.com
VITE_STORE_PHONE="+212 6 00 00 00 00"
VITE_STORE_WHATSAPP=212600000000
VITE_STORE_ADDRESS="Adresse complete"
VITE_STORE_ICE=
VITE_STORE_RC=
```

## Catalogue de demonstration

Le seeder synchronise 776 SKU issus d un snapshot local de 194 produits, puis conserve 8 produits selectionnes, soit 784 produits actifs. Les variantes d un meme produit partagent uniquement sa propre galerie.

```bash
php artisan db:seed --class=DatabaseSeeder --force
php artisan catalog:audit
```

Le catalogue est destine a la demonstration et au prototypage. Avant ouverture commerciale, importer les references, prix, stocks et medias autorises du fournisseur du marchand. Les produits ajoutes manuellement dans l administration ne sont pas desactives par la synchronisation.

## 4. Email SMTP Gmail

Le reset password envoie un vrai email lorsque SMTP est configure. Dans Google,
activer la validation en deux etapes, puis creer un mot de passe d'application.
Ajouter ensuite ces variables au service backend Railway (onglet `Variables`):

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre-adresse@gmail.com
MAIL_PASSWORD=mot-de-passe-application-google-16-caracteres
MAIL_FROM_ADDRESS=votre-adresse@gmail.com
MAIL_FROM_NAME="Nom boutique"
```

`MAIL_FROM_ADDRESS` doit etre la meme adresse Gmail que `MAIL_USERNAME`. Coller le
mot de passe d'application sans espaces, puis redeployer le backend. Ne jamais
utiliser le mot de passe normal du compte Gmail et ne jamais committer les
identifiants SMTP. Tester ensuite avec un compte client utilisant une vraie adresse.

## 5. Paiement

- Le paiement a la livraison est operationnel et reste `pending` jusqu a la livraison.
- Le statut passe a `completed` a la livraison; les points fidelite sont alors attribues.
- Le paiement carte est volontairement bloque tant qu une affiliation et une integration serveur CMI/Payzone ne sont pas terminees.
- Ne jamais collecter un numero de carte dans React ou dans la base locale. Utiliser uniquement la page hebergee/tokenisee du prestataire et verifier le callback cote serveur.

Pour activer la carte, obtenir le contrat marchand, les identifiants de test, les URLs de callback et la documentation correspondant au compte. Ensuite seulement implementer l adaptateur du prestataire et passer `PAYMENT_CARD_ENABLED=true`.

## 6. Domaine

Architecture recommandee:

- `www.votre-domaine.ma` ou `votre-domaine.ma` vers Vercel.
- `api.votre-domaine.ma` vers Railway.
- Mettre a jour `APP_URL`, `FRONTEND_URL`, `VITE_API_URL` et `VITE_STORAGE_URL`, puis redeployer les deux services.

Verifier HTTPS, les redirections vers le domaine principal et les headers de securite.

## 7. Legal et donnees personnelles

Les pages `/privacy`, `/terms` et `/shipping-returns` sont fournies comme base de travail. Elles doivent etre completees avec les donnees juridiques reelles et validees par un professionnel avant exploitation. La boutique doit fournir une information claire sur les prix, conditions de vente, livraison et retours, et encadrer le traitement des donnees personnelles.

References officielles utiles:

- CNDP, textes et loi 09-08: https://www.cndp.ma/textes-et-lois/
- Ministere de l Industrie et du Commerce, droits du consommateur: https://www.mcinet.gov.ma/fr/content/protection-consommateur/droits-garantis-aux-consommateurs
- CMI e-commerce: https://www.cmi.co.ma/fr/solutions-paiement-carte-paiement-ligne/ecommerce
- Payzone E-Com: https://payzone.ma/payzone-e-com/

## 8. Sauvegardes et supervision

- Activer les sauvegardes automatiques MySQL chez l hebergeur.
- Faire une sauvegarde avant chaque migration ou import catalogue.
- Tester regulierement la restauration, pas uniquement la creation du backup.
- Surveiller `GET /api/health`; le statut attendu est `200` avec `database: connected`.
- Conserver les logs applicatifs sans y enregistrer mots de passe, tokens ou donnees carte.

Exemple de sauvegarde manuelle:

```bash
mysqldump --single-transaction --routines --triggers -h DB_HOST -u DB_USER -p DB_NAME > backup.sql
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

## 9. Checklist avant livraison client

- Changer tous les mots de passe demo.
- Supprimer les utilisateurs et commandes demo inutiles.
- Garder `SEED_DEMO_DATA=false`.
- Mettre `APP_DEBUG=false`.
- Configurer et tester SMTP.
- Remplacer telephone, WhatsApp, email, adresse, ICE et RC.
- Relire les pages legales.
- Ne pas activer le paiement carte sans contrat et callbacks verifies.
- Verifier les droits du dossier `storage`.
- Tester inscription, login, achat, paiement, facture, retour et dashboard admin.
- Tester le formulaire contact et sa page admin.
- Tester mobile 390px et desktop.
- Verifier `/api/health` et les sauvegardes.
- Faire une sauvegarde de la base avant chaque mise a jour.

## Valeur commerciale du produit

- Back-office complet pour administrateur et superviseur.
- Parcours client complet: catalogue, filtres, favoris, panier, commande et historique.
- Modules avances: promotions, coupons, points fidelite, retours, notifications, support et exports.
- Interface moderne responsive prete a personnaliser pour un client final.
