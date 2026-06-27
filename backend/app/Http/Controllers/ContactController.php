<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'subject' => 'required|string|max:180',
            'message' => 'required|string|min:10|max:5000',
            'consent' => 'accepted',
            'website' => 'nullable|string|max:0',
        ]);

        unset($validated['consent'], $validated['website']);

        $contact = ContactMessage::create($validated);

        NotificationController::createNotification(
            null,
            "Nouveau message contact: {$contact->subject} ({$contact->email}).",
            'info'
        );

        return response()->json([
            'message' => 'Votre message a ete envoye. Notre equipe vous repondra rapidement.',
            'reference' => 'MSG-' . str_pad((string) $contact->id, 6, '0', STR_PAD_LEFT),
        ], 201);
    }

    public function index()
    {
        return response()->json(
            ContactMessage::orderByDesc('created_at')->paginate(30)
        );
    }

    public function updateStatus(Request $request, ContactMessage $contactMessage)
    {
        $validated = $request->validate([
            'status' => 'required|in:new,read,closed',
        ]);

        $contactMessage->update($validated);

        return response()->json([
            'message' => 'Statut du message mis a jour.',
            'contact_message' => $contactMessage,
        ]);
    }
}
