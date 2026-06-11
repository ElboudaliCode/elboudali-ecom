<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Obtenir toutes les catégories (avec leurs sous-catégories).
     */
    public function index()
    {
        // On récupère les catégories principales et on inclut leurs enfants
        $categories = Category::whereNull('parent_id')->with('children')->get();
        
        return response()->json([
            'categories' => $categories
        ]);
    }

    /**
     * Créer une nouvelle catégorie (Restreint aux Admins).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'seuil_alerte' => 'nullable|integer|min:1',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        $category = Category::create($validated);

        return response()->json([
            'message' => 'Catégorie créée avec succès',
            'category' => $category
        ], 201);
    }

    /**
     * Afficher une catégorie spécifique.
     */
    public function show($id)
    {
        $category = Category::with(['children', 'products'])->findOrFail($id);

        return response()->json([
            'category' => $category
        ]);
    }

    /**
     * Mettre à jour une catégorie (Restreint aux Admins).
     */
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'seuil_alerte' => 'nullable|integer|min:1',
            'parent_id' => 'nullable|exists:categories,id',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Catégorie mise à jour avec succès',
            'category' => $category
        ]);
    }

    /**
     * Supprimer une catégorie (Restreint aux Admins).
     */
    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Catégorie supprimée avec succès'
        ]);
    }
}
