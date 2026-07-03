<?php

use App\Models\Product;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('catalog:audit', function () {
    $active = Product::where('is_active', true);
    $productCount = (clone $active)->count();
    $missingImages = (clone $active)->where(function ($query) {
        $query->whereNull('image')->orWhere('image', '');
    })->count();
    $missingSku = (clone $active)->where(function ($query) {
        $query->whereNull('sku')->orWhere('sku', '');
    })->count();
    $invalidPrices = (clone $active)->where('price', '<=', 0)->count();
    $withoutGallery = (clone $active)->whereDoesntHave('images')->count();

    $this->table(['Controle', 'Resultat'], [
        ['Produits actifs', $productCount],
        ['Sans image principale', $missingImages],
        ['Sans galerie', $withoutGallery],
        ['Sans SKU', $missingSku],
        ['Prix invalides', $invalidPrices],
    ]);

    if ($productCount < 600 || $missingImages > 0 || $withoutGallery > 0 || $missingSku > 0 || $invalidPrices > 0) {
        $this->error('Catalogue incomplet. Corrigez les controles en erreur.');

        return 1;
    }

    $this->info('Catalogue valide: 600+ produits avec SKU, prix et images.');

    return 0;
})->purpose('Verifier la qualite du catalogue produits');
