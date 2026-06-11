<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    /**
     * Obtenir toutes les adresses de l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $addresses = Address::where('user_id', $request->user()->id)->get();
        return response()->json($addresses);
    }

    /**
     * Ajouter une nouvelle adresse.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'is_default' => 'boolean'
        ]);

        // Si l'utilisateur définit cette adresse comme "par défaut", on retire ce statut des autres
        if (isset($validated['is_default']) && $validated['is_default']) {
            Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        // Si c'est sa première adresse, elle devient par défaut automatiquement
        $count = Address::where('user_id', $request->user()->id)->count();
        if ($count === 0) {
            $validated['is_default'] = true;
        }

        $address = Address::create(array_merge($validated, ['user_id' => $request->user()->id]));

        return response()->json([
            'message' => 'Adresse ajoutée avec succès.',
            'address' => $address
        ], 201);
    }

    /**
     * Modifier une adresse existante.
     */
    public function update(Request $request, $id)
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:100',
            'address_line1' => 'sometimes|required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'sometimes|required|string|max:100',
            'postal_code' => 'sometimes|required|string|max:20',
            'country' => 'sometimes|required|string|max:100',
            'phone' => 'sometimes|required|string|max:20',
            'is_default' => 'boolean'
        ]);

        if (isset($validated['is_default']) && $validated['is_default']) {
            Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
        }

        $address->update($validated);

        return response()->json([
            'message' => 'Adresse modifiée avec succès.',
            'address' => $address
        ]);
    }

    /**
     * Supprimer une adresse.
     */
    public function destroy(Request $request, $id)
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        $address->delete();

        // Si c'était l'adresse par défaut, et qu'il en reste d'autres, on définit la première trouvée comme défaut
        if ($address->is_default) {
            $firstRemaining = Address::where('user_id', $request->user()->id)->first();
            if ($firstRemaining) {
                $firstRemaining->update(['is_default' => true]);
            }
        }

        return response()->json(['message' => 'Adresse supprimée.']);
    }

    /**
     * Définir une adresse comme adresse par défaut.
     */
    public function setDefault(Request $request, $id)
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        
        Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return response()->json([
            'message' => 'Adresse définie par défaut avec succès.'
        ]);
    }
}
