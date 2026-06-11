<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_method')->default('standard')->after('loyalty_discount');
            $table->decimal('delivery_fee', 10, 2)->default(0)->after('delivery_method');
            $table->date('estimated_delivery_date')->nullable()->after('delivery_fee');
            $table->string('tracking_number')->nullable()->after('estimated_delivery_date');
        });

        Schema::table('favorites', function (Blueprint $table) {
            $table->text('note')->nullable()->after('product_id');
        });
    }

    public function down(): void
    {
        Schema::table('favorites', function (Blueprint $table) {
            $table->dropColumn('note');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_method', 'delivery_fee', 'estimated_delivery_date', 'tracking_number']);
        });
    }
};
