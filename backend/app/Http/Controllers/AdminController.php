<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Recupere les donnees principales du tableau de bord.
     */
    public function dashboardStats(Request $request)
    {
        $paidStatuses = ['confirmed', 'shipped', 'delivered'];

        $totalRevenue = $this->safeStat(fn () => Order::whereIn('status', $paidStatuses)->sum('total_amount'), 0);
        $todayRevenue = $this->safeStat(fn () => Order::whereIn('status', $paidStatuses)
            ->whereDate('created_at', today())
            ->sum('total_amount'), 0);
        $monthRevenue = $this->safeStat(fn () => Order::whereIn('status', $paidStatuses)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_amount'), 0);

        $totalOrdersCount = $this->safeStat(fn () => Order::count(), 0);
        $todayOrdersCount = $this->safeStat(fn () => Order::whereDate('created_at', today())->count(), 0);
        $averageOrderValue = $this->safeStat(fn () => Order::whereIn('status', $paidStatuses)->avg('total_amount') ?? 0, 0);

        $totalClientsCount = $this->safeStat(fn () => User::where('role', 'client')->count(), 0);

        $lowStockProducts = $this->safeStat(fn () => Product::with('category')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->where('products.is_active', true)
            ->whereColumn('products.quantity', '<=', 'categories.seuil_alerte')
            ->select('products.*')
            ->orderBy('products.quantity')
            ->take(25)
            ->get(), collect());

        $recentOrders = $this->safeStat(fn () => Order::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(), collect());

        $categorySales = $this->safeStat(fn () => DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select('categories.name as category', DB::raw('SUM(order_items.quantity * order_items.unit_price) as sales'))
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('sales')
            ->get(), collect());

        $topProducts = $this->safeStat(fn () => DB::table('order_items')
            ->select(
                'product_id',
                'product_name',
                DB::raw('SUM(quantity) as quantity_sold'),
                DB::raw('SUM(quantity * unit_price) as revenue')
            )
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('quantity_sold')
            ->take(5)
            ->get(), collect());

        $statusCounts = $this->safeStat(fn () => Order::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status'), collect());

        $monthlyRevenue = $this->safeStat(fn () => $this->monthlyRevenueSummary($paidStatuses), collect());

        $openSupportCount = $this->safeStat(fn () => Conversation::where('status', 'open')->count(), 0);
        $categoriesCount = $this->safeStat(fn () => Category::count(), 0);
        $recentLogs = $this->safeStat(fn () => ActivityLog::with('user:id,name,role')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(), collect());

        return response()->json([
            'revenue' => $totalRevenue,
            'todayRevenue' => $todayRevenue,
            'monthRevenue' => $monthRevenue,
            'ordersCount' => $totalOrdersCount,
            'todayOrdersCount' => $todayOrdersCount,
            'averageOrderValue' => round($averageOrderValue, 2),
            'clientsCount' => $totalClientsCount,
            'lowStockProducts' => $lowStockProducts,
            'recentOrders' => $recentOrders,
            'categorySales' => $categorySales,
            'topProducts' => $topProducts,
            'statusCounts' => $statusCounts,
            'monthlyRevenue' => $monthlyRevenue,
            'openSupportCount' => $openSupportCount,
            'categoriesCount' => $categoriesCount,
            'recentLogs' => $recentLogs,
        ]);
    }

    private function safeStat(callable $callback, mixed $default): mixed
    {
        try {
            return $callback();
        } catch (\Throwable $exception) {
            report($exception);

            return $default;
        }
    }

    private function monthlyRevenueSummary(array $paidStatuses)
    {
        $start = now()->subMonths(5)->startOfMonth();

        $orders = Order::whereIn('status', $paidStatuses)
            ->where('created_at', '>=', $start)
            ->get(['total_amount', 'created_at']);

        return collect(range(0, 5))->map(function ($offset) use ($start, $orders) {
            $month = $start->copy()->addMonths($offset);
            $monthKey = $month->format('Y-m');
            $monthOrders = $orders->filter(fn ($order) => $order->created_at->format('Y-m') === $monthKey);

            return [
                'month' => $monthKey,
                'revenue' => (float) $monthOrders->sum('total_amount'),
                'orders' => $monthOrders->count(),
            ];
        })->values();
    }

    /**
     * Liste de tous les utilisateurs (admin uniquement).
     */
    public function usersList()
    {
        $users = User::orderByDesc('created_at')->get();

        return response()->json($users);
    }

    /**
     * Modifier le role d'un utilisateur (admin uniquement).
     */
    public function updateUserRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:admin,superviseur,client',
        ]);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas modifier votre propre role.'], 400);
        }

        $oldRole = $user->role;
        $user->role = $request->role;
        $user->save();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'ROLE_CHANGE',
            'description' => "Role de l'utilisateur {$user->name} modifie de '{$oldRole}' a '{$request->role}'",
        ]);

        return response()->json([
            'message' => 'Role mis a jour avec succes.',
            'user' => $user,
        ]);
    }

    /**
     * Liste des journaux d'activite (admin/superviseur).
     */
    public function activityLogs()
    {
        $logs = ActivityLog::with('user:id,name,role')
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        return response()->json($logs);
    }

    /**
     * Exporter les commandes en CSV.
     */
    public function exportOrdersCsv()
    {
        $orders = Order::with(['user:id,name,email', 'items'])->orderBy('created_at', 'desc')->get();

        $csv = "ID,Client,Email,Date,Montant Total,Statut,Nb Articles\n";
        foreach ($orders as $order) {
            $csv .= sprintf(
                "%d,%s,%s,%s,%.2f,%s,%d\n",
                $order->id,
                str_replace(',', ' ', $order->user->name ?? 'N/A'),
                $order->user->email ?? 'N/A',
                $order->created_at->format('d/m/Y H:i'),
                $order->total_amount,
                $order->status,
                $order->items->count()
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="commandes_export.csv"',
        ]);
    }

    /**
     * Exporter les produits en CSV.
     */
    public function exportProductsCsv()
    {
        $products = Product::with('category')->where('is_active', true)->orderBy('name')->get();

        $csv = "ID,Nom,Categorie,Prix,Quantite,Description\n";
        foreach ($products as $product) {
            $csv .= sprintf(
                "%d,%s,%s,%.2f,%d,%s\n",
                $product->id,
                str_replace(',', ' ', $product->name),
                str_replace(',', ' ', $product->category->name ?? 'N/A'),
                $product->price,
                $product->quantity,
                str_replace([',', "\n", "\r"], ' ', $product->description ?? '')
            );
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="produits_export.csv"',
        ]);
    }
}
