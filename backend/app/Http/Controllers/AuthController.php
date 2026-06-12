<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Support\Str;
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
     * Demande de recuperation du mot de passe.
     */
    public function forgotPassword(Request $request)
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'email' => 'required|string|email',
        ]);

        $user = User::where('email', $validated['email'])->first();
        $payload = [
            'message' => 'Si cette adresse existe, un lien de recuperation a ete envoye.',
        ];

        if ($user) {
            ResetPassword::createUrlUsing(function (User $notifiable, string $token) {
                return $this->passwordResetUrl($notifiable, $token);
            });

            try {
                $token = PasswordBroker::createToken($user);
                $user->sendPasswordResetNotification($token);
            } catch (\Throwable $exception) {
                report($exception);

                NotificationController::createNotification(
                    null,
                    "Erreur email reset password pour {$user->email}. Verifiez la configuration SMTP.",
                    'security'
                );

                if (isset($token) && $this->canExposeDemoResetLink($user->email)) {
                    return response()->json([
                        'message' => 'Mode demo: SMTP non configure, utilisez le lien de recuperation ci-dessous.',
                        'reset_url' => $this->passwordResetUrl($user, $token),
                    ]);
                }

                return response()->json([
                    'message' => 'Demande enregistree, mais l email de recuperation ne peut pas etre envoye maintenant.',
                ], 500);
            }

            if ($this->canExposeDemoResetLink($user->email)) {
                $payload['reset_url'] = $this->passwordResetUrl($user, $token);
            }

            NotificationController::createNotification(
                null,
                "Lien de recuperation envoye pour {$user->email}.",
                'security'
            );
        }

        return response()->json($payload);
    }

    /**
     * Reinitialiser le mot de passe avec un token valide.
     */
    public function resetPassword(Request $request)
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'token' => 'required|string',
            'email' => 'required|string|email',
            'password' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $status = PasswordBroker::reset(
            $validated,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === PasswordBroker::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Mot de passe reinitialise avec succes. Vous pouvez vous connecter.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Le lien de recuperation est invalide ou expire.'],
        ]);
    }

    private function passwordResetUrl(User $user, string $token): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'https://elboudali-ecom.vercel.app'), '/');

        return $frontendUrl . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode($user->getEmailForPasswordReset());
    }

    private function canExposeDemoResetLink(string $email): bool
    {
        return app()->environment('local') || in_array($email, [
            'admin@demo.com',
            'client@demo.com',
            'noura@demo.com',
            'superviseur@demo.com',
        ], true);
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

        if ($request->has('email')) {
            $request->merge([
                'email' => strtolower(trim((string) $request->input('email'))),
            ]);
        }

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
