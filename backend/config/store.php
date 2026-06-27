<?php

return [
    'name' => env('STORE_NAME', 'Elboudali Store'),
    'legal_name' => env('STORE_LEGAL_NAME', 'Elboudali Store'),
    'email' => env('STORE_EMAIL', 'contact@elboudali-store.com'),
    'phone' => env('STORE_PHONE', '+212600000000'),
    'whatsapp' => env('STORE_WHATSAPP', '212600000000'),
    'address' => env('STORE_ADDRESS', 'Casablanca'),
    'city' => env('STORE_CITY', 'Casablanca'),
    'country' => env('STORE_COUNTRY', 'Maroc'),
    'ice' => env('STORE_ICE'),
    'rc' => env('STORE_RC'),
    'currency' => env('STORE_CURRENCY', 'MAD'),
    'support_hours' => env('STORE_SUPPORT_HOURS', 'Lun-Sam, 09:00-18:00'),

    'payments' => [
        'provider' => env('PAYMENT_PROVIDER', 'none'),
        'cod_enabled' => filter_var(env('PAYMENT_COD_ENABLED', true), FILTER_VALIDATE_BOOL),
        'card_enabled' => filter_var(env('PAYMENT_CARD_ENABLED', false), FILTER_VALIDATE_BOOL),
        'paypal_enabled' => filter_var(env('PAYMENT_PAYPAL_ENABLED', false), FILTER_VALIDATE_BOOL),
    ],
];
