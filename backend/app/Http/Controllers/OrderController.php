<?php

namespace App\Http\Controllers;

use App\Models\Address;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Valider le panier et creer la commande.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'address_id' => 'required|exists:addresses,id',
            'payment_method' => 'required|in:card,paypal,cod',
            'coupon_code' => 'nullable|string|exists:coupons,code',
            'use_loyalty_points' => 'nullable|boolean',
            'delivery_method' => 'nullable|in:standard,express,pickup',
        ]);

        $user = $request->user();
        $cart = Cart::with('items.product')->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->count() === 0) {
            return response()->json(['error' => 'Votre panier est vide.'], 400);
        }

        $address = Address::where('user_id', $user->id)->findOrFail($validated['address_id']);

        $subtotal = 0;
        foreach ($cart->items as $item) {
            if ($item->product->quantity < $item->quantity) {
                return response()->json(['error' => "Stock insuffisant pour le produit : {$item->product->name}"], 400);
            }
            $subtotal += $item->product->price * $item->quantity;
        }

        $discount = 0;
        $coupon = null;
        if (!empty($validated['coupon_code'])) {
            $coupon = Coupon::where('code', $validated['coupon_code'])->first();
            if ($coupon && $coupon->isValid()) {
                $discount = $coupon->type === 'percentage'
                    ? ($subtotal * $coupon->value) / 100
                    : $coupon->value;
            }
        }

        $totalAfterCoupon = max(0, $subtotal - $discount);
        $loyaltyPointsUsed = 0;
        $loyaltyDiscount = 0;

        if (!empty($validated['use_loyalty_points'])) {
            $availableDiscount = floor(($user->loyalty_points ?? 0) / 100) * 10;
            $loyaltyDiscount = min($availableDiscount, $totalAfterCoupon);
            $loyaltyPointsUsed = (int) floor($loyaltyDiscount / 10) * 100;
            $loyaltyDiscount = ($loyaltyPointsUsed / 100) * 10;
        }

        $totalAmount = max(0, $totalAfterCoupon - $loyaltyDiscount);
        $deliveryMethod = $validated['delivery_method'] ?? 'standard';
        $deliveryFee = match ($deliveryMethod) {
            'express' => 35,
            'pickup' => 0,
            default => 20,
        };
        $estimatedDeliveryDate = match ($deliveryMethod) {
            'express' => now()->addDays(2)->toDateString(),
            'pickup' => now()->addDay()->toDateString(),
            default => now()->addDays(5)->toDateString(),
        };
        $totalAmount += $deliveryFee;
        $loyaltyPointsEarned = (int) floor($totalAmount / 10);

        DB::beginTransaction();

        try {
            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'status' => 'confirmed',
                'total_amount' => $totalAmount,
                'loyalty_points_used' => $loyaltyPointsUsed,
                'loyalty_points_earned' => $loyaltyPointsEarned,
                'loyalty_discount' => $loyaltyDiscount,
                'delivery_method' => $deliveryMethod,
                'delivery_fee' => $deliveryFee,
                'estimated_delivery_date' => $estimatedDeliveryDate,
                'tracking_number' => 'TRK-' . strtoupper(uniqid()),
            ]);

            foreach ($cart->items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name,
                    'unit_price' => $item->product->price,
                    'quantity' => $item->quantity,
                ]);

                $item->product->decrement('quantity', $item->quantity);
            }

            Payment::create([
                'order_id' => $order->id,
                'transaction_id' => 'SIM-' . strtoupper(uniqid()),
                'payment_method' => $validated['payment_method'],
                'amount' => $totalAmount,
                'status' => 'completed',
            ]);

            if ($coupon) {
                $coupon->increment('used_count');
            }

            if ($loyaltyPointsUsed > 0) {
                $user->decrement('loyalty_points', $loyaltyPointsUsed);
            }

            if ($loyaltyPointsEarned > 0) {
                $user->increment('loyalty_points', $loyaltyPointsEarned);
            }

            $cart->items()->delete();

            NotificationController::createNotification(
                $user->id,
                "Votre commande #{$order->id} a ete confirmee avec succes !",
                'success'
            );

            if ($loyaltyPointsEarned > 0) {
                NotificationController::createNotification(
                    $user->id,
                    "Vous avez gagne {$loyaltyPointsEarned} points fidelite avec la commande #{$order->id}.",
                    'success'
                );
            }

            NotificationController::createNotification(
                null,
                "Nouvelle commande #{$order->id} d'un montant de " . number_format($totalAmount, 2) . " Dhs recue.",
                'info'
            );

            DB::commit();

            return response()->json([
                'message' => 'Commande passee avec succes !',
                'order' => $order->load('items', 'payment', 'address'),
                'loyalty' => [
                    'points_used' => $loyaltyPointsUsed,
                    'discount' => $loyaltyDiscount,
                    'points_earned' => $loyaltyPointsEarned,
                    'current_points' => $user->fresh()->loyalty_points,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Erreur lors de la validation de la commande.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Historique des commandes de l'utilisateur.
     */
    public function index(Request $request)
    {
        $orders = Order::with(['items', 'returnRequest'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    /**
     * Liste de toutes les commandes pour l'admin/superviseur.
     */
    public function adminOrders()
    {
        $orders = Order::with(['user:id,name,email', 'items', 'address', 'returnRequest'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    /**
     * Mettre a jour le statut d'une commande.
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:confirmed,shipped,delivered,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->status = $request->status;
        $order->save();

        $statusLabels = [
            'confirmed' => 'confirmee',
            'shipped' => 'expediee',
            'delivered' => 'livree',
            'cancelled' => 'annulee',
        ];
        $label = $statusLabels[$request->status] ?? $request->status;

        NotificationController::createNotification(
            $order->user_id,
            "Le statut de votre commande #{$order->id} est passe a : {$label}",
            $request->status === 'cancelled' ? 'danger' : ($request->status === 'delivered' ? 'success' : 'info')
        );

        if (class_exists(\App\Models\ActivityLog::class)) {
            \App\Models\ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'ORDER_STATUS_UPDATE',
                'description' => "Commande #{$order->id} mise a jour vers {$request->status}",
            ]);
        }

        return response()->json([
            'message' => 'Statut de la commande mis a jour avec succes.',
            'order' => $order,
        ]);
    }

    public function invoice(Request $request, $id)
    {
        $order = Order::with(['items', 'user', 'address', 'payment'])->findOrFail($id);

        if ($request->user()->role === 'client' && $order->user_id !== $request->user()->id) {
            abort(403);
        }

        $rows = $order->items->map(function ($item) {
            $lineTotal = number_format($item->unit_price * $item->quantity, 2);
            return "<tr><td>{$item->product_name}</td><td>{$item->quantity}</td><td>" . number_format($item->unit_price, 2) . " Dhs</td><td>{$lineTotal} Dhs</td></tr>";
        })->implode('');

        $html = "<!doctype html>
        <html><head><meta charset='utf-8'><title>Facture #{$order->id}</title>
        <style>
        body{font-family:Arial,sans-serif;color:#1F2937;margin:32px}
        .head{display:flex;justify-content:space-between;border-bottom:3px solid #F59E0B;padding-bottom:16px;margin-bottom:24px}
        h1{color:#F59E0B;margin:0} table{width:100%;border-collapse:collapse;margin-top:20px}
        th,td{padding:10px;border-bottom:1px solid #E5E7EB;text-align:left} th{background:#F8FAFC}
        .total{text-align:right;font-size:20px;font-weight:bold;color:#F59E0B;margin-top:18px}
        .muted{color:#64748B;font-size:13px}.print{margin-top:24px}
        @media print{.print{display:none}}
        </style></head><body>
        <div class='head'><div><h1>ELBOUDALI Ecom</h1><p class='muted'>Facture officielle</p></div><div><strong>Facture #FAC-{$order->id}</strong><br>Date: {$order->created_at->format('d/m/Y H:i')}</div></div>
        <p><strong>Client:</strong> {$order->user->name}<br><strong>Email:</strong> {$order->user->email}<br><strong>Livraison:</strong> {$order->delivery_method} - {$order->delivery_fee} Dhs<br><strong>Tracking:</strong> {$order->tracking_number}</p>
        <table><thead><tr><th>Produit</th><th>Qte</th><th>Prix</th><th>Total</th></tr></thead><tbody>{$rows}</tbody></table>
        <div class='total'>Total TTC: " . number_format($order->total_amount, 2) . " Dhs</div>
        <button class='print' onclick='window.print()'>Imprimer / Enregistrer PDF</button>
        </body></html>";

        return response($html)->header('Content-Type', 'text/html; charset=UTF-8');
    }
}
