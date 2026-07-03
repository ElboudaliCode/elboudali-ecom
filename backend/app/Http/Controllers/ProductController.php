<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Liste des produits avec filtres et recherche.
     */
    public function index(Request $request)
    {
        $query = Product::with('category')
            ->where('is_active', true)
            ->withAvg('reviews', 'rating')
            ->withCount('reviews');

        // Filtrer par recherche (nom ou description)
        if ($request->has('search') && ! empty($request->search)) {
            $searchTerm = '%'.$request->search.'%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'LIKE', $searchTerm)
                    ->orWhere('description', 'LIKE', $searchTerm);
            });
        }

        // Filtrer par catégorie
        if ($request->has('category_id') && ! empty($request->category_id)) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('brand')) {
            $query->where('brand', $request->brand);
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->filled('stock_status')) {
            if ($request->stock_status === 'in_stock') {
                $query->where('quantity', '>', 5);
            } elseif ($request->stock_status === 'low_stock') {
                $query->whereBetween('quantity', [1, 5]);
            } elseif ($request->stock_status === 'out_of_stock') {
                $query->where('quantity', 0);
            }
        }

        if ($request->boolean('promo_only')) {
            $query->where('is_promo', true);
        }

        if ($request->filled('min_rating')) {
            $query->having('reviews_avg_rating', '>=', (float) $request->min_rating);
        }

        // Logique de tri
        $sort = $request->input('sort', 'newest');
        switch ($sort) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'rating_desc':
                $query->orderByDesc('reviews_avg_rating');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = min((int) $request->input('per_page', 24), 48);
        $products = $query->paginate(max($perPage, 12));

        $products->getCollection()->transform(function ($product) {
            $badges = [];

            if ($product->is_promo) {
                $badges[] = ['label' => 'Promo', 'type' => 'promo'];
            }

            if ($product->created_at && $product->created_at->greaterThanOrEqualTo(now()->subDays(14))) {
                $badges[] = ['label' => 'Nouveau', 'type' => 'new'];
            }

            if ($product->quantity === 0) {
                $badges[] = ['label' => 'Rupture', 'type' => 'danger'];
            } elseif ($product->quantity <= 5) {
                $badges[] = ['label' => 'Stock limite', 'type' => 'warning'];
            }

            if (($product->reviews_avg_rating ?? 0) >= 4) {
                $badges[] = ['label' => 'Bien note', 'type' => 'rating'];
            }

            $product->badges = $badges;

            return $product;
        });

        return response()->json($products);
    }

    /**
     * Obtenir des suggestions de recherche (Autocomplete).
     */
    public function searchSuggestions(Request $request)
    {
        if (! $request->has('q') || empty($request->q)) {
            return response()->json([]);
        }

        $searchTerm = '%'.$request->q.'%';
        $suggestions = Product::where('is_active', true)
            ->where('name', 'LIKE', $searchTerm)
            ->select('id', 'name', 'price', 'image')
            ->take(5)
            ->get();

        return response()->json($suggestions);
    }

    /**
     * Ajouter un nouveau produit (Admin/Superviseur).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'is_promo' => 'nullable|boolean',
            'quantity' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Gestion de l'upload d'image
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = $imagePath;
        }

        $validated['is_promo'] = $request->boolean('is_promo');
        if (! $validated['is_promo']) {
            $validated['old_price'] = null;
        }

        $product = Product::create($validated);

        // Upload des images supplémentaires (galerie)
        if ($request->hasFile('gallery_images')) {
            $files = $request->file('gallery_images');
            foreach ($files as $index => $file) {
                $path = $file->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                    'sort_order' => $index,
                ]);
            }
        }

        // Enregistrer l'activité
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'PRODUCT_CREATE',
            'description' => "Création du produit '{$product->name}' (Stock initial: {$product->quantity}, Prix: {$product->price} Dhs)",
        ]);

        return response()->json([
            'message' => 'Produit ajouté avec succès',
            'product' => $product->load('images'),
        ], 201);
    }

    /**
     * Afficher les détails d'un seul produit.
     */
    public function show($id)
    {
        $product = Product::with(['category', 'images', 'reviews.user:id,name', 'reviews.images'])
            ->where('is_active', true)
            ->findOrFail($id);

        // Récupérer 4 produits de la même catégorie (différents de celui-ci)
        $similarProducts = Product::where('category_id', $product->category_id)
            ->where('is_active', true)
            ->where('id', '!=', $product->id)
            ->inRandomOrder()
            ->take(4)
            ->get();

        return response()->json([
            'product' => $product,
            'similarProducts' => $similarProducts,
        ]);
    }

    /**
     * Modifier un produit (Admin/Superviseur).
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $wasPromo = (bool) $product->is_promo;

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'old_price' => 'nullable|numeric|min:0',
            'is_promo' => 'nullable|boolean',
            'quantity' => 'sometimes|required|integer|min:0',
            'category_id' => 'sometimes|required|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Gestion de la mise à jour de l'image
        if ($request->hasFile('image')) {
            // Supprimer l'ancienne image si elle existe
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['image'] = $imagePath;
        }

        $validated['is_promo'] = $request->boolean('is_promo');
        if (! $validated['is_promo']) {
            $validated['old_price'] = null;
        }

        $product->update($validated);

        if (! $wasPromo && $product->is_promo) {
            $favoriteUserIds = $product->favoritedBy()->pluck('users.id');
            foreach ($favoriteUserIds as $userId) {
                NotificationController::createNotification(
                    $userId,
                    "Bonne nouvelle : {$product->name} est maintenant en promotion.",
                    'success'
                );
            }
        }

        // Upload des nouvelles images de galerie
        if ($request->hasFile('gallery_images')) {
            $files = $request->file('gallery_images');
            $maxOrder = $product->images()->max('sort_order') ?? -1;
            foreach ($files as $index => $file) {
                $path = $file->store('products', 'public');
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_path' => $path,
                    'sort_order' => $maxOrder + $index + 1,
                ]);
            }
        }

        // Enregistrer l'activité
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'PRODUCT_UPDATE',
            'description' => "Modification du produit '{$product->name}' (Nouveau Stock: {$product->quantity}, Nouveau Prix: {$product->price} Dhs)",
        ]);

        return response()->json([
            'message' => 'Produit mis à jour avec succès',
            'product' => $product->load('images'),
        ]);
    }

    /**
     * Supprimer un produit (Restreint aux Admins).
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        // Supprimer l'image principale
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        // Supprimer les images de galerie
        foreach ($product->images as $img) {
            Storage::disk('public')->delete($img->image_path);
        }

        $productName = $product->name;
        $product->delete();

        // Enregistrer l'activité
        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'PRODUCT_DELETE',
            'description' => "Suppression définitive du produit '{$productName}'",
        ]);

        return response()->json([
            'message' => 'Produit supprimé avec succès',
        ]);
    }

    /**
     * Supprimer une image spécifique de la galerie.
     */
    public function deleteGalleryImage($id)
    {
        $image = ProductImage::findOrFail($id);

        // Supprimer le fichier physique
        if (Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->delete();

        return response()->json([
            'message' => 'Image de galerie supprimée avec succès',
        ]);
    }

    /**
     * Remplacer une image spécifique de la galerie.
     */
    public function updateGalleryImage(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $image = ProductImage::findOrFail($id);

        // Supprimer l'ancien fichier
        if (Storage::disk('public')->exists($image->image_path)) {
            Storage::disk('public')->delete($image->image_path);
        }

        // Sauvegarder la nouvelle image
        $path = $request->file('image')->store('products', 'public');
        $image->update([
            'image_path' => $path,
        ]);

        return response()->json([
            'message' => 'Image mise à jour avec succès',
            'image' => $image,
        ]);
    }
}
