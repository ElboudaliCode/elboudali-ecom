<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ConversationController extends Controller
{
    /**
     * Liste des conversations du client connecté.
     */
    public function index()
    {
        $conversations = Conversation::where('user_id', Auth::id())
            ->orderBy('updated_at', 'desc')
            ->get();
        return response()->json($conversations);
    }

    /**
     * Démarrer une nouvelle conversation (Client).
     */
    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string'
        ]);

        $conversation = Conversation::create([
            'user_id' => Auth::id(),
            'subject' => $request->subject,
            'status' => 'open'
        ]);

        // Créer le premier message
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => Auth::id(),
            'sender_type' => 'user',
            'message' => $request->message
        ]);

        // Envoyer la notification globale pour l'admin
        \App\Http\Controllers\NotificationController::createNotification(
            null,
            "Nouveau ticket de support créé par " . Auth::user()->name . " : " . $conversation->subject,
            'info'
        );

        return response()->json($conversation->load('messages'), 201);
    }

    /**
     * Voir les détails d'une conversation (messages inclus).
     */
    public function show($id)
    {
        $conversation = Conversation::with(['messages.sender:id,name,role', 'user:id,name,email'])
            ->findOrFail($id);

        // Sécurité : Vérifier que l'utilisateur participe à la conversation (sauf s'il est admin/superviseur)
        if (Auth::user()->role === 'client' && $conversation->user_id !== Auth::id()) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        return response()->json($conversation);
    }

    /**
     * Envoyer un message (Client).
     */
    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        $conversation = Conversation::findOrFail($id);

        if ($conversation->user_id !== Auth::id()) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => Auth::id(),
            'sender_type' => 'user',
            'message' => $request->message
        ]);

        // Envoyer une notification au staff
        \App\Http\Controllers\NotificationController::createNotification(
            null,
            "Nouveau message de " . Auth::user()->name . " dans le ticket : " . $conversation->subject,
            'info'
        );

        $conversation->touch(); // Met à jour updated_at de la conversation

        return response()->json($message->load('sender:id,name,role'), 201);
    }

    /**
     * Liste de toutes les conversations de support (Admin/Superviseur).
     */
    public function adminIndex()
    {
        $conversations = Conversation::with('user:id,name,email')
            ->orderBy('status', 'asc') // Les ouvertes en premier
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Répondre à une conversation (Admin/Superviseur).
     */
    public function adminSendMessage(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        $conversation = Conversation::findOrFail($id);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => Auth::id(),
            'sender_type' => 'admin',
            'message' => $request->message
        ]);

        // Mettre à jour le statut
        $conversation->touch();

        // Envoyer la notification au client
        \App\Http\Controllers\NotificationController::createNotification(
            $conversation->user_id,
            "L'équipe de support a répondu à votre ticket : " . $conversation->subject,
            'success'
        );

        return response()->json($message->load('sender:id,name,role'), 201);
    }

    /**
     * Clôturer un ticket de support.
     */
    public function closeConversation($id)
    {
        $conversation = Conversation::findOrFail($id);
        $conversation->update(['status' => 'closed']);

        // Envoyer la notification au client
        \App\Http\Controllers\NotificationController::createNotification(
            $conversation->user_id,
            "Votre ticket de support a été clôturé : " . $conversation->subject,
            'secondary'
        );

        return response()->json([
            'message' => 'Conversation clôturée avec succès',
            'conversation' => $conversation
        ]);
    }
}
