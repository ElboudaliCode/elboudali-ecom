#!/bin/sh
set -e

php artisan storage:link || true
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
