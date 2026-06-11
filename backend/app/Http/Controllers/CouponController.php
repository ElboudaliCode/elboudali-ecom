<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * Vérifier et appliquer un code promo au panier.
     */
    public function apply(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|exists:coupons,code'
        ]);

        $coupon = Coupon::where('code', $validated['code'])->first();

        if (!$coupon || !$coupon->isValid()) {
            return response()->json(['error' => 'Ce code promo est invalide ou expiré.'], 400);
        }

        return response()->json([
            'message' => 'Code promo appliqué avec succès.',
            'coupon' => [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value
            ]
        ]);
    }

    /**
     * Liste complète des coupons (Admin uniquement).
     */
    public function index()
    {
        $coupons = Coupon::orderBy('created_at', 'desc')->get();
        return response()->json($coupons);
    }

    /**
     * Créer un nouveau coupon (Admin uniquement).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons,code|max:50',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date|after_or_equal:today',
        ]);

        $coupon = Coupon::create($validated);

        return response()->json([
            'message' => 'Coupon créé avec succès.',
            'coupon' => $coupon
        ], 201);
    }

    /**
     * Mettre à jour un coupon (Admin uniquement).
     */
    public function update(Request $request, $id)
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:coupons,code,' . $id,
            'type' => 'sometimes|required|in:fixed,percentage',
            'value' => 'sometimes|required|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active' => 'sometimes|required|boolean',
        ]);

        $coupon->update($validated);

        return response()->json([
            'message' => 'Coupon mis à jour avec succès.',
            'coupon' => $coupon
        ]);
    }

    /**
     * Supprimer un coupon (Admin uniquement).
     */
    public function destroy($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'message' => 'Coupon supprimé avec succès.'
        ]);
    }
}
