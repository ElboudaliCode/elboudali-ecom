<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use RuntimeException;

class CatalogSeeder extends Seeder
{
    private const SOURCE = 'dummyjson';

    /**
     * Source categories are grouped into storefront categories in French.
     *
     * @var array<string, array{name: string, description: string, threshold: int}>
     */
    private const CATEGORIES = [
        'beauty' => ['name' => 'Beaute', 'description' => 'Maquillage et accessoires beaute.', 'threshold' => 12],
        'fragrances' => ['name' => 'Parfums', 'description' => 'Parfums et eaux de toilette.', 'threshold' => 8],
        'furniture' => ['name' => 'Mobilier', 'description' => 'Mobilier pour la maison et le bureau.', 'threshold' => 5],
        'groceries' => ['name' => 'Epicerie', 'description' => 'Produits alimentaires et epicerie.', 'threshold' => 15],
        'home-decoration' => ['name' => 'Decoration', 'description' => 'Decoration et accessoires maison.', 'threshold' => 8],
        'kitchen-accessories' => ['name' => 'Maison & Cuisine', 'description' => 'Equipement et accessoires de cuisine.', 'threshold' => 10],
        'laptops' => ['name' => 'Ordinateurs', 'description' => 'Ordinateurs portables personnels et professionnels.', 'threshold' => 4],
        'mens-shirts' => ['name' => 'Mode Homme', 'description' => 'Vetements et chemises pour homme.', 'threshold' => 12],
        'mens-shoes' => ['name' => 'Chaussures Homme', 'description' => 'Chaussures pour homme.', 'threshold' => 10],
        'mens-watches' => ['name' => 'Montres Homme', 'description' => 'Montres pour homme.', 'threshold' => 8],
        'mobile-accessories' => ['name' => 'Accessoires', 'description' => 'Accessoires pour smartphones et appareils mobiles.', 'threshold' => 10],
        'motorcycle' => ['name' => 'Moto', 'description' => 'Motos et accessoires moto.', 'threshold' => 3],
        'skin-care' => ['name' => 'Soins', 'description' => 'Soins du visage et du corps.', 'threshold' => 12],
        'smartphones' => ['name' => 'Telephones', 'description' => 'Smartphones et telephones mobiles.', 'threshold' => 8],
        'sports-accessories' => ['name' => 'Sport', 'description' => 'Fitness, training et accessoires sportifs.', 'threshold' => 10],
        'sunglasses' => ['name' => 'Lunettes', 'description' => 'Lunettes de soleil et accessoires.', 'threshold' => 8],
        'tablets' => ['name' => 'Tablettes', 'description' => 'Tablettes tactiles et accessoires.', 'threshold' => 6],
        'tops' => ['name' => 'Mode Femme', 'description' => 'Vetements et hauts pour femme.', 'threshold' => 12],
        'vehicle' => ['name' => 'Auto', 'description' => 'Vehicules et equipements automobiles.', 'threshold' => 3],
        'womens-bags' => ['name' => 'Sacs Femme', 'description' => 'Sacs a main et sacs de ville.', 'threshold' => 10],
        'womens-dresses' => ['name' => 'Mode Femme', 'description' => 'Vetements et robes pour femme.', 'threshold' => 12],
        'womens-jewellery' => ['name' => 'Bijoux Femme', 'description' => 'Bijoux et accessoires pour femme.', 'threshold' => 8],
        'womens-shoes' => ['name' => 'Chaussures Femme', 'description' => 'Chaussures pour femme.', 'threshold' => 10],
        'womens-watches' => ['name' => 'Montres Femme', 'description' => 'Montres pour femme.', 'threshold' => 8],
    ];

    public function run(): void
    {
        $catalog = $this->loadCatalog();
        $categoryIds = $this->syncCategories();
        $activeKeys = [];

        foreach ($catalog['products'] as $sourceProduct) {
            $sourceCategory = (string) $sourceProduct['category'];
            if (! isset($categoryIds[$sourceCategory])) {
                continue;
            }

            foreach ($this->offersFor($sourceCategory) as $offerIndex => $offer) {
                $catalogKey = self::SOURCE.':'.$sourceProduct['id'].':'.$offer['code'];
                $activeKeys[] = $catalogKey;
                $basePrice = $this->priceInDirhams((float) $sourceProduct['price']);
                $price = $this->roundedPrice($basePrice * $offer['multiplier']);
                $discount = (float) ($sourceProduct['discountPercentage'] ?? 0);
                $isPromo = $offerIndex === 0 && $discount >= 5;
                $oldPrice = $isPromo
                    ? $this->roundedPrice($price / max(0.5, 1 - ($discount / 100)))
                    : null;

                $product = Product::updateOrCreate(
                    ['catalog_key' => $catalogKey],
                    [
                        'name' => $sourceProduct['title'].' - '.$offer['label'],
                        'sku' => $this->sku($sourceProduct, $offer['code']),
                        'brand' => $sourceProduct['brand'] ?: null,
                        'catalog_source' => self::SOURCE,
                        'is_active' => true,
                        'description' => $this->description($sourceProduct, $offer['label']),
                        'price' => $price,
                        'old_price' => $oldPrice,
                        'is_promo' => $isPromo,
                        'quantity' => $this->stockFor((int) $sourceProduct['stock'], $offerIndex),
                        'category_id' => $categoryIds[$sourceCategory],
                        'image' => $this->primaryImage($sourceProduct),
                    ]
                );

                $this->syncGallery($product, $sourceProduct);
            }
        }

        Product::where('catalog_source', self::SOURCE)
            ->whereNotIn('catalog_key', $activeKeys)
            ->update(['is_active' => false]);
    }

    /** @return array{products: array<int, array<string, mixed>>} */
    private function loadCatalog(): array
    {
        $path = database_path('data/catalog-products.json');
        if (! File::exists($path)) {
            throw new RuntimeException("Catalogue source introuvable: {$path}");
        }

        $catalog = json_decode(File::get($path), true, 512, JSON_THROW_ON_ERROR);
        if (! isset($catalog['products']) || ! is_array($catalog['products'])) {
            throw new RuntimeException('Le catalogue source ne contient aucun produit.');
        }

        return $catalog;
    }

    /** @return array<string, int> */
    private function syncCategories(): array
    {
        $ids = [];
        foreach (self::CATEGORIES as $sourceCategory => $category) {
            $record = Category::updateOrCreate(
                ['name' => $category['name']],
                [
                    'description' => $category['description'],
                    'seuil_alerte' => $category['threshold'],
                ]
            );
            $ids[$sourceCategory] = $record->id;
        }

        return $ids;
    }

    /** @return array<int, array{code: string, label: string, multiplier: float}> */
    private function offersFor(string $category): array
    {
        if (in_array($category, ['mens-shirts', 'mens-shoes', 'tops', 'womens-dresses', 'womens-shoes'], true)) {
            return [
                ['code' => 'size-s', 'label' => 'Taille S', 'multiplier' => 1.0],
                ['code' => 'size-m', 'label' => 'Taille M', 'multiplier' => 1.0],
                ['code' => 'size-l', 'label' => 'Taille L', 'multiplier' => 1.0],
                ['code' => 'size-xl', 'label' => 'Taille XL', 'multiplier' => 1.03],
            ];
        }

        if (in_array($category, ['beauty', 'fragrances', 'groceries', 'skin-care'], true)) {
            return [
                ['code' => 'unit', 'label' => 'Unite', 'multiplier' => 1.0],
                ['code' => 'pack-2', 'label' => 'Pack de 2', 'multiplier' => 1.90],
                ['code' => 'pack-3', 'label' => 'Pack de 3', 'multiplier' => 2.75],
                ['code' => 'pack-6', 'label' => 'Pack de 6', 'multiplier' => 5.20],
            ];
        }

        if (in_array($category, ['laptops', 'mobile-accessories', 'smartphones', 'tablets'], true)) {
            return [
                ['code' => 'standard', 'label' => 'Standard', 'multiplier' => 1.0],
                ['code' => 'essential', 'label' => 'Pack Essentiel', 'multiplier' => 1.06],
                ['code' => 'protection', 'label' => 'Pack Protection', 'multiplier' => 1.10],
                ['code' => 'warranty-24', 'label' => 'Garantie 24 mois', 'multiplier' => 1.16],
            ];
        }

        return [
            ['code' => 'standard', 'label' => 'Standard', 'multiplier' => 1.0],
            ['code' => 'plus', 'label' => 'Selection Plus', 'multiplier' => 1.08],
            ['code' => 'premium', 'label' => 'Premium', 'multiplier' => 1.18],
            ['code' => 'pro', 'label' => 'Pro', 'multiplier' => 1.30],
        ];
    }

    /** @param array<string, mixed> $sourceProduct */
    private function sku(array $sourceProduct, string $offerCode): string
    {
        $baseSku = trim((string) ($sourceProduct['sku'] ?? ''));
        if ($baseSku === '') {
            $baseSku = 'DJ-'.str_pad((string) $sourceProduct['id'], 3, '0', STR_PAD_LEFT);
        }

        return strtoupper($baseSku.'-'.$offerCode);
    }

    /** @param array<string, mixed> $sourceProduct */
    private function description(array $sourceProduct, string $offerLabel): string
    {
        $brand = trim((string) ($sourceProduct['brand'] ?? ''));
        $brandText = $brand !== '' ? " par {$brand}" : '';

        return "{$sourceProduct['title']}{$brandText}, selectionne pour son bon rapport qualite-prix. "
            ."Offre {$offerLabel}, stock controle et livraison disponible partout au Maroc.";
    }

    private function priceInDirhams(float $sourcePrice): float
    {
        return max(49, $sourcePrice * 11.5);
    }

    private function roundedPrice(float $price): float
    {
        return (float) max(10, round($price / 10) * 10);
    }

    private function stockFor(int $sourceStock, int $offerIndex): int
    {
        return max(2, min(80, (int) floor($sourceStock / max(1, $offerIndex + 1))));
    }

    /** @param array<string, mixed> $sourceProduct */
    private function primaryImage(array $sourceProduct): ?string
    {
        return $sourceProduct['thumbnail'] ?: ($sourceProduct['images'][0] ?? null);
    }

    /** @param array<string, mixed> $sourceProduct */
    private function syncGallery(Product $product, array $sourceProduct): void
    {
        $images = array_values(array_unique(array_filter([
            $sourceProduct['thumbnail'] ?? null,
            ...($sourceProduct['images'] ?? []),
        ])));

        $product->images()->delete();
        foreach (array_slice($images, 0, 5) as $sortOrder => $image) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $image,
                'sort_order' => $sortOrder,
            ]);
        }
    }
}
