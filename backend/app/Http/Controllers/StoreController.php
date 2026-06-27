<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class StoreController extends Controller
{
    public function config()
    {
        return response()->json([
            'store' => [
                'name' => config('store.name'),
                'email' => config('store.email'),
                'phone' => config('store.phone'),
                'whatsapp' => config('store.whatsapp'),
                'city' => config('store.city'),
                'country' => config('store.country'),
                'currency' => config('store.currency'),
                'support_hours' => config('store.support_hours'),
            ],
            'payments' => [
                'provider' => config('store.payments.provider'),
                'cod_enabled' => (bool) config('store.payments.cod_enabled'),
                'card_enabled' => (bool) config('store.payments.card_enabled'),
                'paypal_enabled' => (bool) config('store.payments.paypal_enabled'),
            ],
        ]);
    }

    public function health()
    {
        try {
            DB::select('select 1');

            return response()->json([
                'status' => 'ok',
                'database' => 'connected',
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'status' => 'degraded',
                'database' => 'unavailable',
                'timestamp' => now()->toIso8601String(),
            ], 503);
        }
    }
}
