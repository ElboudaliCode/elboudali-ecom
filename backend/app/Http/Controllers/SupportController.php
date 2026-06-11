<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    /**
     * Liste des conversations (Pour l'admin, toutes. Pour le client, les siennes).
     */
    public function getConversations(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin' || $user->role === 'superviseur') {
            $conversations = Conversation::with('user:id,name')->orderBy('updated_at', 'desc')->get();
        } else {
            $conversations = Conversation::where('user_id', $user->id)->orderBy('updated_at', 'desc')->get();
        }

        return response()->json($conversations);
    }

    /**
     * Obtenir les messages d'une conversation spécifique.
     */
    public function getMessages(Request $request, $conversationId)
    {
        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        // Sécurité : Un client ne peut voir que sa propre conversation
        if ($user->role === 'client' && $conversation->user_id !== $user->id) {
            return response()->json(['error' => 'Accès non autorisé.'], 403);
        }

        $messages = Message::with('sender:id,name')->where('conversation_id', $conversation->id)->orderBy('created_at', 'asc')->get();

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages
        ]);
    }

    /**
     * Créer une nouvelle conversation (Pour le client).
     */
    public function createConversation(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string'
        ]);

        $user = $request->user();

        $conversation = Conversation::create([
            'user_id' => $user->id,
            'subject' => $validated['subject'],
            'status' => 'open'
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'sender_type' => 'user',
            'message' => $validated['message']
        ]);

        return response()->json([
            'message' => 'Conversation démarrée.',
            'conversation_id' => $conversation->id
        ], 201);
    }

    /**
     * Envoyer un message dans une conversation existante.
     */
    public function sendMessage(Request $request, $conversationId)
    {
        $validated = $request->validate([
            'message' => 'required|string'
        ]);

        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        if ($user->role === 'client' && $conversation->user_id !== $user->id) {
            return response()->json(['error' => 'Accès non autorisé.'], 403);
        }

        $senderType = ($user->role === 'admin' || $user->role === 'superviseur') ? 'admin' : 'user';

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'sender_type' => $senderType,
            'message' => $validated['message']
        ]);

        // Mettre à jour la date de la conversation
        $conversation->touch();

        return response()->json([
            'message' => 'Message envoyé.',
            'msg' => $message->load('sender:id,name')
        ]);
    }
}
