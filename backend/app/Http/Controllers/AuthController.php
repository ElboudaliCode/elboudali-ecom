<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur.
     */
    public function register(Request $request)
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'client',
            'loyalty_points' => 0,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription reussie !',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Connexion de l'utilisateur.
     */
    public function login(Request $request)
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($validated)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion reussie !',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Deconnexion.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Deconnexion reussie !',
        ]);
    }

    /**
     * Obtenir les details de l'utilisateur connecte.
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Mettre a jour le profil de l'utilisateur connecte.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Profil mis a jour avec succes.',
            'user' => $user,
        ]);
    }

    /**
     * Statistiques du client connecte.
     */
    public function clientStats(Request $request)
    {
        $user = $request->user();
        $orders = Order::where('user_id', $user->id)->get();
        $favorites = Favorite::where('user_id', $user->id)->count();
        $loyaltyPoints = $user->loyalty_points ?? 0;
        $itemsPurchased = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.user_id', $user->id)
            ->sum('order_items.quantity');
        $favoriteCategory = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->where('orders.user_id', $user->id)
            ->select('categories.name', DB::raw('SUM(order_items.quantity) as total'))
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total')
            ->first();
        $totalSaved = $orders->sum('loyalty_discount');
        $loyaltyLevel = $loyaltyPoints >= 1000 ? 'Gold' : ($loyaltyPoints >= 400 ? 'Silver' : 'Bronze');

        return response()->json([
            'totalOrders' => $orders->count(),
            'totalSpent' => $orders->sum('total_amount'),
            'favoritesCount' => $favorites,
            'lastOrder' => $orders->sortByDesc('created_at')->first(),
            'loyaltyPoints' => $loyaltyPoints,
            'loyaltyDiscountAvailable' => floor($loyaltyPoints / 100) * 10,
            'loyaltyPointsEarned' => $orders->sum('loyalty_points_earned'),
            'loyaltyPointsUsed' => $orders->sum('loyalty_points_used'),
            'loyaltyLevel' => $loyaltyLevel,
            'itemsPurchased' => $itemsPurchased,
            'favoriteCategory' => $favoriteCategory?->name,
            'totalSaved' => $totalSaved,
        ]);
    }
}
