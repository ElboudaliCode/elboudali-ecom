<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Coupon;
use App\Models\Favorite;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Review;
use App\Models\ReviewImage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@demo.com'],
            ['name' => 'Administrateur Demo', 'password' => Hash::make('Password123'), 'role' => 'admin', 'loyalty_points' => 0]
        );

        $supervisor = User::updateOrCreate(
            ['email' => 'superviseur@demo.com'],
            ['name' => 'Superviseur Stock', 'password' => Hash::make('Password123'), 'role' => 'superviseur', 'loyalty_points' => 0]
        );

        $client = User::updateOrCreate(
            ['email' => 'client@demo.com'],
            ['name' => 'Client Demo', 'password' => Hash::make('Password123'), 'role' => 'client', 'loyalty_points' => 180]
        );

        $secondClient = User::updateOrCreate(
            ['email' => 'noura@demo.com'],
            ['name' => 'Noura Benali', 'password' => Hash::make('Password123'), 'role' => 'client', 'loyalty_points' => 45]
        );

        $electronics = $this->category('Electronique', 'Smartphones, ordinateurs et accessoires premium.', 5);
        $phones = $this->category('Telephones', 'Smartphones et accessoires mobiles.', 8, $electronics->id);
        $computers = $this->category('Ordinateurs', 'PC portables et materiel professionnel.', 4, $electronics->id);
        $accessories = $this->category('Accessoires', 'Casques, montres et gadgets connectes.', 6, $electronics->id);
        $photo = $this->category('Photo & Video', 'Appareils photo et equipements createurs.', 3);
        $fashion = $this->category('Mode', 'Selection textile et lifestyle.', 10);

        $products = collect([
            $this->product('iPhone 15 Pro Max', $phones->id, 12500, 13400, 9, true, 'Smartphone Apple avec ecran Super Retina, puce A17 Pro et appareil photo 48MP.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80'),
            $this->product('Samsung Galaxy S24 Ultra', $phones->id, 10999, 11999, 6, true, 'Smartphone premium avec S-Pen, ecran AMOLED et appareil photo 200MP.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80'),
            $this->product('MacBook Pro M3 14', $computers->id, 18500, null, 3, false, 'Ordinateur portable professionnel pour developpeurs, designers et createurs.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'),
            $this->product('HP Pavilion 15', $computers->id, 6500, 7200, 5, true, 'PC portable polyvalent pour etudes, bureautique et travail quotidien.', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80'),
            $this->product('Casque Sony WH-1000XM5', $accessories->id, 2990, null, 18, false, 'Casque sans fil avec reduction de bruit active et autonomie longue duree.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'),
            $this->product('Apple Watch Series 9', $accessories->id, 4200, 4700, 4, true, 'Montre connectee avec suivi sante, GPS et ecran Always-On.', 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=900&q=80'),
            $this->product('Canon EOS R6 Mark II', $photo->id, 22000, null, 2, false, 'Appareil photo hybride plein format pour photo, video et production pro.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'),
            $this->product('Sac Urbain Premium', $fashion->id, 420, 520, 25, true, 'Sac quotidien resistant avec design minimaliste et compartiment laptop.', 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80'),
        ]);

        $products->each(function (Product $product, int $index) use ($products) {
            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'sort_order' => 0],
                ['image_path' => $product->image]
            );

            $alternate = $products->get(($index + 1) % $products->count());
            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'sort_order' => 1],
                ['image_path' => $alternate->image]
            );
        });

        Coupon::updateOrCreate(['code' => 'WELCOME10'], [
            'type' => 'percentage',
            'value' => 10,
            'max_uses' => 100,
            'used_count' => 0,
            'expires_at' => now()->addMonths(3),
            'active' => true,
        ]);

        Coupon::updateOrCreate(['code' => 'SELLER50'], [
            'type' => 'fixed',
            'value' => 50,
            'max_uses' => 50,
            'used_count' => 2,
            'expires_at' => now()->addMonths(2),
            'active' => true,
        ]);

        $address = Address::updateOrCreate(
            ['user_id' => $client->id, 'title' => 'Maison'],
            [
                'address_line1' => '12 Rue Hassan II',
                'address_line2' => 'Appartement 5',
                'city' => 'Casablanca',
                'postal_code' => '20000',
                'country' => 'Maroc',
                'phone' => '+212600000000',
                'is_default' => true,
            ]
        );

        $cart = Cart::firstOrCreate(['user_id' => $client->id]);
        CartItem::updateOrCreate(
            ['cart_id' => $cart->id, 'product_id' => $products[4]->id],
            ['quantity' => 1]
        );

        Favorite::updateOrCreate(
            ['user_id' => $client->id, 'product_id' => $products[0]->id],
            ['note' => 'A proposer au client comme produit hero.']
        );

        $this->review($client->id, $products[0]->id, 5, 'Produit premium, livraison rapide et interface tres claire.');
        $this->review($secondClient->id, $products[4]->id, 4, 'Bon rapport qualite-prix et emballage propre.');

        $order = Order::firstOrCreate(
            ['tracking_number' => 'TRK-DEMO-1001'],
            [
                'user_id' => $client->id,
                'address_id' => $address->id,
                'status' => 'shipped',
                'total_amount' => 15490,
                'loyalty_points_used' => 50,
                'loyalty_points_earned' => 154,
                'loyalty_discount' => 50,
                'delivery_method' => 'standard',
                'delivery_fee' => 30,
                'estimated_delivery_date' => now()->addDays(3),
            ]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order->id, 'product_id' => $products[0]->id],
            ['product_name' => $products[0]->name, 'unit_price' => $products[0]->price, 'quantity' => 1]
        );

        OrderItem::updateOrCreate(
            ['order_id' => $order->id, 'product_id' => $products[4]->id],
            ['product_name' => $products[4]->name, 'unit_price' => $products[4]->price, 'quantity' => 1]
        );

        Payment::updateOrCreate(
            ['order_id' => $order->id],
            ['transaction_id' => 'PAY-DEMO-1001', 'payment_method' => 'cod', 'amount' => 15490, 'status' => 'completed']
        );

        OrderReturn::updateOrCreate(
            ['order_id' => $order->id],
            [
                'user_id' => $client->id,
                'reason' => 'Changement de preference',
                'details' => 'Demande demo pour montrer le module des retours.',
                'status' => 'requested',
                'admin_note' => 'A verifier avec le service livraison.',
            ]
        );

        Notification::updateOrCreate(
            ['user_id' => $client->id, 'message' => 'Votre commande TRK-DEMO-1001 est en cours de livraison.'],
            ['type' => 'order', 'is_read' => false]
        );

        Notification::updateOrCreate(
            ['user_id' => $admin->id, 'message' => 'Stock faible: Canon EOS R6 Mark II.'],
            ['type' => 'stock', 'is_read' => false]
        );

        $conversation = Conversation::updateOrCreate(
            ['session_id' => 'demo-support-thread'],
            ['user_id' => $client->id, 'subject' => 'Question sur la livraison', 'status' => 'open']
        );

        Message::updateOrCreate(
            ['conversation_id' => $conversation->id, 'sender_type' => 'user', 'message' => 'Bonjour, je veux confirmer la date de livraison.'],
            ['sender_id' => $client->id]
        );

        Message::updateOrCreate(
            ['conversation_id' => $conversation->id, 'sender_type' => 'admin', 'message' => 'Bonjour, votre colis est estime dans 3 jours.'],
            ['sender_id' => $admin->id]
        );

        ActivityLog::updateOrCreate(
            ['user_id' => $supervisor->id, 'action' => 'demo_seed'],
            ['description' => 'Base demo prete pour presentation commerciale.']
        );
    }

    private function category(string $name, string $description, int $threshold, ?int $parentId = null): Category
    {
        return Category::updateOrCreate(
            ['name' => $name],
            ['description' => $description, 'seuil_alerte' => $threshold, 'parent_id' => $parentId]
        );
    }

    private function product(string $name, int $categoryId, float $price, ?float $oldPrice, int $quantity, bool $isPromo, string $description, string $image): Product
    {
        return Product::updateOrCreate(
            ['name' => $name],
            [
                'description' => $description,
                'price' => $price,
                'old_price' => $oldPrice,
                'is_promo' => $isPromo,
                'quantity' => $quantity,
                'category_id' => $categoryId,
                'image' => $image,
            ]
        );
    }

    private function review(int $userId, int $productId, int $rating, string $comment): void
    {
        $review = Review::updateOrCreate(
            ['user_id' => $userId, 'product_id' => $productId],
            ['rating' => $rating, 'comment' => $comment]
        );

        ReviewImage::updateOrCreate(
            ['review_id' => $review->id, 'image_path' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80']
        );
    }
}
