<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sku')->nullable()->unique()->after('name');
            $table->string('brand')->nullable()->index()->after('sku');
            $table->string('catalog_source')->nullable()->index()->after('brand');
            $table->string('catalog_key')->nullable()->unique()->after('catalog_source');
            $table->boolean('is_active')->default(true)->index()->after('catalog_key');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['sku', 'brand', 'catalog_source', 'catalog_key', 'is_active']);
        });
    }
};
