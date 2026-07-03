# Elboudali Ecom

Modern e-commerce web application built with Laravel 12 and React/Vite.

## Features

- Demo catalog with 784 active products, matched galleries, categories, search, filters, promotions and stock badges.
- Product details with gallery, similar products and customer reviews.
- Cart, checkout, addresses, payment method and order history.
- Admin dashboard with revenue, orders, customers and exports.
- Product, category, user and coupon management.
- Delivery tracking with method, fee, estimated date and tracking number.
- Return requests workflow for clients and admins.
- Favorites with personal notes.
- Loyalty points and discounts.
- Notifications and support tickets.
- Public contact form with admin message management.
- Legal pages for privacy, sales terms, delivery and returns.
- Production-safe COD lifecycle; online card payment is blocked until a real provider is connected.
- Security improvements: rate limits, stronger passwords, security headers and token cleanup.

## Tech Stack

- Backend: Laravel 12, Sanctum, MySQL
- Frontend: React, Vite, Axios, React Router
- Database: MySQL

## Demo Accounts

Set `SEED_DEMO_DATA=true` before running the seeders to create these accounts:

- Admin: `admin@demo.com` / `Password123`
- Supervisor: `superviseur@demo.com` / `Password123`
- Client: `client@demo.com` / `Password123`

## Local Installation

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

Default URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api`
- Storage: `http://localhost:8000/storage`

## Production Setup

See [README_PRODUCTION.md](README_PRODUCTION.md) for deployment configuration and delivery checklist.

## Demo Catalog

The bundled snapshot contains 194 source products expanded into 776 tracked SKU offers, plus 8 curated products. Run `php artisan catalog:audit` after an import to verify the minimum product count, SKUs, prices and images.

The snapshot is prototype data from [DummyJSON](https://dummyjson.com/docs/products). Before operating a real store, replace demo titles, prices and images with the merchant's supplier catalog and licensed media.

## Sales Pack

See [PACK_VENTE.md](PACK_VENTE.md) for the commercial presentation, demo flow and pricing suggestions.

## Verification

Commands used during preparation:

```bash
php artisan test
npm run build
npm run lint
```

Current status:

- Backend tests passing.
- Frontend production build passing.
- Frontend lint exits with warnings only.
