<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\StoreController;

// ==========================================
// ROUTES PUBLIQUES
// ==========================================
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:support');
Route::get('/store/config', [StoreController::class, 'config']);
Route::get('/health', [StoreController::class, 'health']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/search/suggestions', [ProductController::class, 'searchSuggestions']);
Route::get('/products/{id}', [ProductController::class, 'show']);

use App\Http\Controllers\CartController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\OrderController;

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderReturnController;

// ==========================================
// ROUTES PROTÉGÉES (Connecté)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::get('/client/stats', [AuthController::class, 'clientStats']);

    // --- NOTIFICATIONS ---
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markAllRead']);

    // --- PANIER ---
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/add', [CartController::class, 'add']);
    Route::put('/cart/items/{id}', [CartController::class, 'update']);
    Route::delete('/cart/items/{id}', [CartController::class, 'remove']);
    Route::delete('/cart/clear', [CartController::class, 'clear']);

    // --- ADRESSES ---
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);
    Route::put('/addresses/{id}/default', [AddressController::class, 'setDefault']);

    // --- COUPONS ---
    Route::post('/coupons/apply', [CouponController::class, 'apply']);

    // --- COMMANDES ---
    Route::post('/checkout', [OrderController::class, 'checkout'])->middleware('throttle:checkout');
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}/invoice', [OrderController::class, 'invoice']);

    // --- FAVORIS ---
    Route::get('/favorites', [\App\Http\Controllers\FavoriteController::class, 'index']);
    Route::post('/favorites', [\App\Http\Controllers\FavoriteController::class, 'store']);
    Route::put('/favorites/{productId}/note', [\App\Http\Controllers\FavoriteController::class, 'updateNote']);
    Route::delete('/favorites/{productId}', [\App\Http\Controllers\FavoriteController::class, 'destroy']);

    // --- AVIS ---
    Route::post('/products/{productId}/reviews', [\App\Http\Controllers\ReviewController::class, 'store'])->middleware('throttle:uploads');

    // --- RETOURS / REMBOURSEMENTS ---
    Route::post('/orders/{orderId}/return', [OrderReturnController::class, 'store']);

    // --- SUPPORT / CHAT (routes client) ---
    Route::get('/support/conversations', [ConversationController::class, 'index']);
    Route::post('/support/conversations', [ConversationController::class, 'store'])->middleware('throttle:support');
    Route::get('/support/conversations/{id}', [ConversationController::class, 'show']);
    Route::post('/support/conversations/{id}/messages', [ConversationController::class, 'sendMessage'])->middleware('throttle:support');
});

// ==========================================
Route::middleware(['auth:sanctum', 'superviseur'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboardStats']);
    Route::get('/admin/activity-logs', [AdminController::class, 'activityLogs']);
    Route::get('/admin/contact-messages', [ContactController::class, 'index']);
    Route::put('/admin/contact-messages/{contactMessage}/status', [ContactController::class, 'updateStatus']);
    Route::get('/admin/orders', [OrderController::class, 'adminOrders']);
    Route::put('/admin/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::get('/admin/returns', [OrderReturnController::class, 'adminIndex']);
    Route::put('/admin/returns/{id}/status', [OrderReturnController::class, 'updateStatus']);
    
    Route::post('/products', [ProductController::class, 'store'])->middleware('throttle:uploads');
    // On utilise POST ou PUT avec _method=PUT si upload de fichier multipart/form-data
    Route::post('/products/{id}/update', [ProductController::class, 'update'])->middleware('throttle:uploads'); 
    Route::delete('/admin/product-images/{id}', [ProductController::class, 'deleteGalleryImage']);
    Route::post('/admin/product-images/{id}/update', [ProductController::class, 'updateGalleryImage'])->middleware('throttle:uploads');

    // --- GESTION DU SUPPORT (ADMIN/SUPERVISEUR) ---
    // --- GESTION DU SUPPORT (ADMIN/SUPERVISEUR) ---
    Route::get('/admin/support/conversations', [ConversationController::class, 'adminIndex']);
    Route::post('/admin/support/conversations/{id}/messages', [ConversationController::class, 'adminSendMessage'])->middleware('throttle:support');
    Route::post('/admin/support/conversations/{id}/close', [ConversationController::class, 'closeConversation']);

    // --- EXPORT CSV ---
    Route::get('/admin/export/orders', [AdminController::class, 'exportOrdersCsv']);
    Route::get('/admin/export/products', [AdminController::class, 'exportProductsCsv']);
});



// ==========================================
// ROUTES ADMIN UNIQUEMENT
// ==========================================
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // --- GESTION DES UTILISATEURS ---
    Route::get('/admin/users', [AdminController::class, 'usersList']);
    Route::put('/admin/users/{id}/role', [AdminController::class, 'updateUserRole']);

    // --- GESTION DES COUPONS ---
    Route::get('/admin/coupons', [CouponController::class, 'index']);
    Route::post('/admin/coupons', [CouponController::class, 'store']);
    Route::put('/admin/coupons/{id}', [CouponController::class, 'update']);
    Route::delete('/admin/coupons/{id}', [CouponController::class, 'destroy']);
});
