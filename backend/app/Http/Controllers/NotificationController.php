<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Liste des notifications de l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Notification::orderBy('created_at', 'desc');

        if ($user->role === 'client') {
            $query->where('user_id', $user->id);
        } else {
            // Pour l'admin/superviseur, on récupère leurs notifs personnelles + les notifs globales (système)
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereNull('user_id');
            });
        }

        $notifications = $query->take(20)->get();

        return response()->json($notifications);
    }

    /**
     * Marquer toutes les notifications comme lues.
     */
    public function markAllRead(Request $request)
    {
        $user = $request->user();
        
        $query = Notification::where('is_read', false);

        if ($user->role === 'client') {
            $query->where('user_id', $user->id);
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereNull('user_id');
            });
        }

        $query->update(['is_read' => true]);

        return response()->json(['message' => 'Notifications marquées comme lues.']);
    }

    /**
     * Helper statique pour ajouter facilement des notifications n'importe où dans le code.
     */
    public static function createNotification($userId, $message, $type = 'info')
    {
        return Notification::create([
            'user_id' => $userId,
            'message' => $message,
            'type' => $type,
            'is_read' => false
        ]);
    }
}
