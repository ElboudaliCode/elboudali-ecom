<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Obtenir le panier de l'utilisateur connecté avec ses articles.
     */
    public function index(Request $request)
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);
        $cart->load('items.product:id,name,price,image,quantity'); // On charge les infos produit
        
        return response()->json($cart);
    }

    /**
     * Ajouter un produit au panier.
     */
    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $product = Product::findOrFail($validated['product_id']);
        
        // Vérification des stocks
        if ($product->quantity < $validated['quantity']) {
            return response()->json(['error' => 'Stock insuffisant.'], 400);
        }

        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        // Vérifier si le produit est déjà dans le panier
        $cartItem = CartItem::where('cart_id', $cart->id)
                            ->where('product_id', $validated['product_id'])
                            ->first();

        if ($cartItem) {
            // Mettre à jour la quantité si le stock le permet
            $newQuantity = $cartItem->quantity + $validated['quantity'];
            if ($product->quantity < $newQuantity) {
                return response()->json(['error' => 'Stock insuffisant pour augmenter la quantité.'], 400);
            }
            $cartItem->update(['quantity' => $newQuantity]);
        } else {
            // Ajouter un nouvel article
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
            ]);
        }

        return response()->json(['message' => 'Produit ajouté au panier avec succès.']);
    }

    /**
     * Mettre à jour la quantité d'un article dans le panier.
     */
    public function update(Request $request, $itemId)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $cartItem = CartItem::whereHas('cart', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($itemId);

        // Vérifier le stock
        if ($cartItem->product->quantity < $validated['quantity']) {
            return response()->json(['error' => 'Stock insuffisant.'], 400);
        }

        $cartItem->update(['quantity' => $validated['quantity']]);

        return response()->json(['message' => 'Quantité mise à jour.']);
    }

    /**
     * Retirer un produit du panier.
     */
    public function remove(Request $request, $itemId)
    {
        $cartItem = CartItem::whereHas('cart', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($itemId);

        $cartItem->delete();

        return response()->json(['message' => 'Produit retiré du panier.']);
    }

    /**
     * Vider complètement le panier.
     */
    public function clear(Request $request)
    {
        $cart = Cart::where('user_id', $request->user()->id)->first();
        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json(['message' => 'Panier vidé.']);
    }
}
