<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderReturn;
use Illuminate\Http\Request;

class OrderReturnController extends Controller
{
    public function store(Request $request, $orderId)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
            'details' => 'nullable|string|max:2000',
        ]);

        $order = Order::where('user_id', $request->user()->id)->findOrFail($orderId);

        if ($order->status !== 'delivered') {
            return response()->json(['message' => 'Retour disponible uniquement pour une commande livree.'], 422);
        }

        $return = OrderReturn::updateOrCreate(
            ['order_id' => $order->id, 'user_id' => $request->user()->id],
            [
                'reason' => $validated['reason'],
                'details' => $validated['details'] ?? null,
                'status' => 'requested',
            ]
        );

        NotificationController::createNotification(
            null,
            "Nouvelle demande de retour pour la commande #{$order->id}.",
            'warning'
        );

        return response()->json([
            'message' => 'Demande de retour envoyee.',
            'return' => $return,
        ], 201);
    }

    public function adminIndex()
    {
        $returns = OrderReturn::with(['order.user:id,name,email', 'user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($returns);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:requested,accepted,refused,refunded',
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $return = OrderReturn::with('order')->findOrFail($id);
        $return->update($validated);

        NotificationController::createNotification(
            $return->user_id,
            "Votre demande de retour pour la commande #{$return->order_id} est maintenant : {$return->status}.",
            $return->status === 'refused' ? 'danger' : 'info'
        );

        return response()->json([
            'message' => 'Statut du retour mis a jour.',
            'return' => $return,
        ]);
    }
}
