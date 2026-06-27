<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\ContactMessage;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EcommerceFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_add_favorite_with_note_and_update_it(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $product = $this->product();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/favorites', [
                'product_id' => $product->id,
                'note' => 'A acheter pendant la promo',
            ])
            ->assertCreated();

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/favorites/{$product->id}/note", ['note' => 'Priorite haute'])
            ->assertOk()
            ->assertJsonPath('favorite.note', 'Priorite haute');
    }

    public function test_client_can_request_return_only_for_delivered_order(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $order = Order::create([
            'user_id' => $user->id,
            'address_id' => $this->address($user)->id,
            'status' => 'confirmed',
            'total_amount' => 200,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/return", ['reason' => 'Produit abime'])
            ->assertStatus(422);

        $order->update(['status' => 'delivered']);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/orders/{$order->id}/return", ['reason' => 'Produit abime'])
            ->assertCreated()
            ->assertJsonPath('return.status', 'requested');
    }

    public function test_checkout_applies_delivery_and_loyalty_fields(): void
    {
        $user = User::factory()->create(['role' => 'client', 'loyalty_points' => 200]);
        $product = $this->product(['price' => 100, 'quantity' => 10]);
        $address = $this->address($user);
        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 2]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/checkout', [
                'address_id' => $address->id,
                'payment_method' => 'cod',
                'delivery_method' => 'express',
                'use_loyalty_points' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('order.delivery_method', 'express')
            ->assertJsonPath('order.delivery_fee', '35.00')
            ->assertJsonPath('order.loyalty_points_used', 200)
            ->assertJsonPath('order.payment.status', 'pending');
    }

    public function test_unconfigured_online_payment_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'client']);
        $product = $this->product(['price' => 100, 'quantity' => 10]);
        $address = $this->address($user);
        $cart = Cart::create(['user_id' => $user->id]);
        CartItem::create(['cart_id' => $cart->id, 'product_id' => $product->id, 'quantity' => 1]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/checkout', [
                'address_id' => $address->id,
                'payment_method' => 'card',
            ])
            ->assertStatus(503);
    }

    public function test_api_responses_include_security_headers(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_public_contact_message_is_stored(): void
    {
        $this->postJson('/api/contact', [
            'name' => 'Client Test',
            'email' => 'client@example.com',
            'subject' => 'Question produit',
            'message' => 'Je souhaite recevoir plus d informations sur ce produit.',
            'consent' => true,
            'website' => '',
        ])->assertCreated()
            ->assertJsonStructure(['message', 'reference']);

        $this->assertDatabaseHas(ContactMessage::class, [
            'email' => 'client@example.com',
            'status' => 'new',
        ]);
    }

    public function test_delivery_completes_cod_payment_and_awards_points_once(): void
    {
        $client = User::factory()->create(['role' => 'client', 'loyalty_points' => 0]);
        $admin = User::factory()->create(['role' => 'admin']);
        $order = Order::create([
            'user_id' => $client->id,
            'address_id' => $this->address($client)->id,
            'status' => 'confirmed',
            'total_amount' => 200,
            'loyalty_points_earned' => 20,
        ]);
        Payment::create([
            'order_id' => $order->id,
            'transaction_id' => 'COD-TEST',
            'payment_method' => 'cod',
            'amount' => 200,
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertOk();

        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status' => 'completed']);
        $this->assertSame(20, $client->fresh()->loyalty_points);
    }

    private function product(array $overrides = []): Product
    {
        $category = Category::create(['name' => 'Test category']);

        return Product::create(array_merge([
            'name' => 'Produit test',
            'description' => 'Description',
            'price' => 150,
            'quantity' => 5,
            'category_id' => $category->id,
        ], $overrides));
    }

    private function address(User $user): Address
    {
        return Address::create([
            'user_id' => $user->id,
            'title' => 'Maison',
            'address_line1' => 'Rue 1',
            'city' => 'Casablanca',
            'postal_code' => '20000',
            'country' => 'Maroc',
            'phone' => '0600000000',
            'is_default' => true,
        ]);
    }
}
