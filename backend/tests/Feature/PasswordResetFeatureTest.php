<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_user_can_request_reset_link_and_change_password(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'client@demo.com',
            'password' => Hash::make('Password123'),
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'client@demo.com',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'reset_url']);

        parse_str(parse_url($response->json('reset_url'), PHP_URL_QUERY), $query);

        $this->postJson('/api/reset-password', [
            'token' => $query['token'],
            'email' => 'client@demo.com',
            'password' => 'Newpass123',
            'password_confirmation' => 'Newpass123',
        ])->assertOk()
            ->assertJson(['message' => 'Mot de passe reinitialise avec succes. Vous pouvez vous connecter.']);

        $this->assertTrue(Hash::check('Newpass123', $user->fresh()->password));
    }
}
