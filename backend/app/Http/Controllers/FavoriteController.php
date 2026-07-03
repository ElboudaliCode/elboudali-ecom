<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    public function index()
    {
        $favorites = Favorite::where('user_id', Auth::id())
            ->whereHas('product', fn ($query) => $query->where('is_active', true))
            ->with('product.category')
            ->get();

        return response()->json($favorites);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'note' => 'nullable|string|max:1000',
        ]);

        Product::where('is_active', true)->findOrFail($request->product_id);

        $favorite = Favorite::firstOrCreate(
            [
                'user_id' => Auth::id(),
                'product_id' => $request->product_id,
            ],
            [
                'note' => $request->note,
            ]
        );

        return response()->json([
            'message' => 'Produit ajoute aux favoris.',
            'favorite' => $favorite,
        ], $favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function updateNote(Request $request, $productId)
    {
        $validated = $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        $favorite = Favorite::where('user_id', Auth::id())
            ->where('product_id', $productId)
            ->firstOrFail();

        $favorite->update(['note' => $validated['note'] ?? null]);

        return response()->json([
            'message' => 'Note du favori mise a jour.',
            'favorite' => $favorite,
        ]);
    }

    public function destroy($productId)
    {
        $favorite = Favorite::where('user_id', Auth::id())
            ->where('product_id', $productId)
            ->first();

        if (! $favorite) {
            return response()->json(['message' => 'Favori introuvable.'], 404);
        }

        $favorite->delete();

        return response()->json(['message' => 'Produit retire des favoris.']);
    }
}
