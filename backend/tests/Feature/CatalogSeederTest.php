<?php

namespace Tests\Feature;

use App\Models\Product;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seeds_more_than_600_products_with_matching_images(): void
    {
        $this->seed(CatalogSeeder::class);

        $this->assertSame(776, Product::where('catalog_source', 'dummyjson')->count());
        $this->assertSame(776, Product::where('catalog_source', 'dummyjson')->where('is_active', true)->count());
        $this->assertSame(776, Product::whereNotNull('sku')->distinct()->count('sku'));

        $mascara = Product::with('images')->where('catalog_key', 'dummyjson:1:unit')->firstOrFail();
        $this->assertStringContainsString('Essence Mascara Lash Princess', $mascara->name);
        $this->assertStringContainsString('/beauty/essence-mascara-lash-princess/', $mascara->image);
        $this->assertNotEmpty($mascara->images);

        foreach ($mascara->images as $image) {
            $this->assertStringContainsString('/beauty/essence-mascara-lash-princess/', $image->image_path);
        }

        $this->assertSame(0, Artisan::call('catalog:audit'));
    }

    public function test_catalog_import_is_idempotent(): void
    {
        $this->seed(CatalogSeeder::class);
        $this->seed(CatalogSeeder::class);

        $this->assertSame(776, Product::where('catalog_source', 'dummyjson')->count());
        $this->assertSame(1, Product::where('catalog_key', 'dummyjson:1:unit')->count());
    }

    public function test_production_database_seeder_builds_the_complete_active_catalog(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(776, Product::where('catalog_source', 'dummyjson')->where('is_active', true)->count());
        $this->assertSame(8, Product::where('catalog_source', 'curated')->where('is_active', true)->count());
        $this->assertSame(784, Product::where('is_active', true)->count());
        $this->assertDatabaseMissing('users', ['email' => 'admin@demo.com']);
        $this->assertSame(0, Artisan::call('catalog:audit'));
    }

    public function test_demo_accounts_require_the_explicit_seed_flag(): void
    {
        config()->set('app.seed_demo_data', true);

        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('users', ['email' => 'admin@demo.com', 'role' => 'admin']);
        $this->assertDatabaseHas('users', ['email' => 'client@demo.com', 'role' => 'client']);
        $this->assertDatabaseHas('orders', ['tracking_number' => 'TRK-DEMO-1001']);
    }

    public function test_catalog_snapshot_never_mixes_images_between_products(): void
    {
        $catalog = json_decode(
            file_get_contents(database_path('data/catalog-products.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        foreach ($catalog['products'] as $product) {
            $images = array_values(array_filter([
                $product['thumbnail'] ?? null,
                ...($product['images'] ?? []),
            ]));
            $directories = array_unique(array_map(
                fn (string $image) => dirname((string) parse_url($image, PHP_URL_PATH)),
                $images
            ));

            $this->assertCount(1, $directories, "Images melangees pour {$product['title']}");
        }
    }
}
