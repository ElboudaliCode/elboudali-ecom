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

        $this->seedLargeCatalog($electronics, $phones, $computers, $accessories, $photo, $fashion);

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

        $secondAddress = Address::updateOrCreate(
            ['user_id' => $secondClient->id, 'title' => 'Bureau'],
            [
                'address_line1' => '28 Avenue Mohammed V',
                'address_line2' => 'Etage 2',
                'city' => 'Rabat',
                'postal_code' => '10000',
                'country' => 'Maroc',
                'phone' => '+212611111111',
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

        $this->seedDemoOrders($client, $secondClient, $address, $secondAddress);

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

    private function seedLargeCatalog(Category $electronics, Category $phones, Category $computers, Category $accessories, Category $photo, Category $fashion): void
    {
        $audio = $this->category('Audio', 'Casques, ecouteurs et enceintes.', 8, $electronics->id);
        $wearables = $this->category('Montres Connectees', 'Smartwatches et bracelets connectes.', 7, $electronics->id);
        $gaming = $this->category('Gaming', 'Consoles, accessoires et setup gaming.', 5, $electronics->id);
        $home = $this->category('Maison & Cuisine', 'Electromenager, decoration et accessoires maison.', 12);
        $beauty = $this->category('Beaute', 'Soins, parfum et accessoires beaute.', 12);
        $sport = $this->category('Sport', 'Fitness, training et outdoor.', 10);
        $office = $this->category('Bureau', 'Fournitures, chaises et accessoires de travail.', 8);
        $men = $this->category('Mode Homme', 'Vetements, sacs et chaussures homme.', 14, $fashion->id);
        $women = $this->category('Mode Femme', 'Vetements, sacs et chaussures femme.', 14, $fashion->id);

        $images = [
            'apple_phone' => [
                'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
            ],
            'android_phone' => [
                'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
            ],
            'macbook' => [
                'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=900&q=80',
            ],
            'laptop' => [
                'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=900&q=80',
            ],
            'audio' => [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
            ],
            'watch' => [
                'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
            ],
            'camera' => [
                'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=900&q=80',
            ],
            'bag' => [
                'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
            ],
            'clothes' => [
                'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',
            ],
            'shoes' => [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=900&q=80',
            ],
            'home' => [
                'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80',
            ],
            'beauty' => [
                'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
            ],
            'sport' => [
                'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
            ],
            'office' => [
                'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
            ],
            'gaming' => [
                'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80',
                'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
            ],
        ];

        $catalog = [];

        $phoneBrands = [
            ['brand' => 'Apple', 'models' => [
                ['name' => 'iPhone SE', 'range' => [4200, 5900]],
                ['name' => 'iPhone 13', 'range' => [5600, 7600]],
                ['name' => 'iPhone 14', 'range' => [6800, 9200]],
                ['name' => 'iPhone 15', 'range' => [8200, 11200]],
                ['name' => 'iPhone 15 Pro', 'range' => [10900, 14900]],
                ['name' => 'iPhone 16', 'range' => [11200, 16900]],
            ], 'family' => 'apple_phone'],
            ['brand' => 'Samsung', 'models' => [
                ['name' => 'Galaxy A15', 'range' => [1600, 2300]],
                ['name' => 'Galaxy A35', 'range' => [2800, 3900]],
                ['name' => 'Galaxy A55', 'range' => [3900, 5400]],
                ['name' => 'Galaxy S23', 'range' => [6800, 9200]],
                ['name' => 'Galaxy S24', 'range' => [8200, 11800]],
                ['name' => 'Galaxy Z Flip', 'range' => [9400, 14900]],
            ], 'family' => 'android_phone'],
            ['brand' => 'Xiaomi', 'models' => [
                ['name' => 'Redmi Note 13', 'range' => [1300, 2300]],
                ['name' => 'Redmi Note 14', 'range' => [1600, 2800]],
                ['name' => 'Poco X6', 'range' => [2400, 3900]],
                ['name' => 'Poco F6', 'range' => [3600, 5600]],
                ['name' => 'Xiaomi 14', 'range' => [5900, 8600]],
            ], 'family' => 'android_phone'],
            ['brand' => 'Oppo', 'models' => [
                ['name' => 'A58', 'range' => [1500, 2300]],
                ['name' => 'A78', 'range' => [2100, 3300]],
                ['name' => 'Reno 10', 'range' => [3400, 5200]],
                ['name' => 'Reno 11', 'range' => [3900, 6200]],
                ['name' => 'Find X5', 'range' => [5600, 7900]],
            ], 'family' => 'android_phone'],
            ['brand' => 'Infinix', 'models' => [
                ['name' => 'Hot 40', 'range' => [1000, 1700]],
                ['name' => 'Note 30', 'range' => [1400, 2400]],
                ['name' => 'Zero 30', 'range' => [2200, 3400]],
                ['name' => 'GT 20 Pro', 'range' => [3100, 4600]],
            ], 'family' => 'android_phone'],
            ['brand' => 'Honor', 'models' => [
                ['name' => 'X8a', 'range' => [1700, 2600]],
                ['name' => 'X9b', 'range' => [2900, 4200]],
                ['name' => 'Magic 5 Lite', 'range' => [3300, 5200]],
                ['name' => 'Magic 6 Pro', 'range' => [7600, 10200]],
            ], 'family' => 'android_phone'],
        ];
        $storages = ['64GB', '128GB', '256GB', '512GB'];
        $colors = ['Noir', 'Blanc', 'Bleu', 'Graphite', 'Gold', 'Green'];
        foreach (range(1, 130) as $i) {
            $brand = $phoneBrands[($i - 1) % count($phoneBrands)];
            $model = $brand['models'][($i + 2) % count($brand['models'])];
            $storage = $storages[($i + 1) % count($storages)];
            $color = $colors[($i + 3) % count($colors)];
            $storageBoost = ['64GB' => 0, '128GB' => 250, '256GB' => 650, '512GB' => 1200][$storage] ?? 0;
            $price = $this->catalogPrice($model['range'][0] + $storageBoost, $model['range'][1] + $storageBoost, $i, 50);
            $catalog[] = [$phones->id, "{$brand['brand']} {$model['name']} {$storage} {$color}", $price, 8 + ($i % 42), $brand['family'], "Smartphone {$brand['brand']} {$model['name']} avec garantie boutique, double SIM selon modele et livraison rapide."];
        }

        $laptopBrands = [
            ['brand' => 'Apple', 'models' => ['MacBook Air M1', 'MacBook Air M2', 'MacBook Pro M3'], 'range' => [8500, 25500], 'family' => 'macbook'],
            ['brand' => 'HP', 'models' => ['Pavilion 15', 'Envy 13', 'Victus 16', 'ProBook 450'], 'range' => [4200, 15500], 'family' => 'laptop'],
            ['brand' => 'Dell', 'models' => ['Inspiron 15', 'XPS 13', 'Latitude 5420', 'G15 Gaming'], 'range' => [4300, 19000], 'family' => 'laptop'],
            ['brand' => 'Lenovo', 'models' => ['IdeaPad 3', 'Yoga Slim 7', 'ThinkPad E14', 'Legion 5'], 'range' => [3900, 17500], 'family' => 'laptop'],
            ['brand' => 'Asus', 'models' => ['Vivobook 15', 'Zenbook 14', 'TUF Gaming A15', 'ROG Strix'], 'range' => [4100, 21000], 'family' => 'laptop'],
        ];
        $rams = ['8GB RAM', '16GB RAM', '24GB RAM', '32GB RAM'];
        $ssds = ['256GB SSD', '512GB SSD', '1TB SSD'];
        foreach (range(1, 90) as $i) {
            $brand = $laptopBrands[($i - 1) % count($laptopBrands)];
            $model = $brand['models'][($i + 1) % count($brand['models'])];
            $price = $this->catalogPrice($brand['range'][0], $brand['range'][1], $i + 200, 100);
            $catalog[] = [$computers->id, "{$brand['brand']} {$model} {$rams[$i % count($rams)]} {$ssds[$i % count($ssds)]}", $price, 3 + ($i % 22), $brand['family'], "Ordinateur portable {$brand['brand']} pour etudes, bureau, creation ou gaming selon configuration."];
        }

        $accessoryLines = [
            [$audio->id, 'Casque Bluetooth', [180, 3200], 'audio'],
            [$audio->id, 'Ecouteurs True Wireless', [120, 2400], 'audio'],
            [$accessories->id, 'Chargeur Rapide USB-C', [79, 490], 'android_phone'],
            [$accessories->id, 'Power Bank 20000mAh', [160, 650], 'android_phone'],
            [$accessories->id, 'Clavier Sans Fil', [140, 890], 'office'],
            [$accessories->id, 'Souris Ergonomique', [80, 650], 'office'],
            [$wearables->id, 'Smartwatch Sport', [290, 3900], 'watch'],
            [$wearables->id, 'Bracelet Connecte', [190, 890], 'watch'],
            [$accessories->id, 'Coque Protection Smartphone', [49, 180], 'android_phone'],
            [$accessories->id, 'Support Bureau Laptop', [120, 540], 'office'],
        ];
        foreach (range(1, 130) as $i) {
            $line = $accessoryLines[($i - 1) % count($accessoryLines)];
            $price = $this->catalogPrice($line[2][0], $line[2][1], $i + 400, 10);
            $catalog[] = [$line[0], "{$line[1]} Serie " . str_pad((string) $i, 3, '0', STR_PAD_LEFT), $price, 10 + ($i % 80), $line[3], "{$line[1]} avec finition propre, stock controle et bon rapport qualite-prix."];
        }

        $cameraLines = [
            ['Canon', 'EOS R50', [7200, 11800]],
            ['Canon', 'EOS R6 Mark II', [18500, 28500]],
            ['Sony', 'Alpha A6400', [8500, 14500]],
            ['Sony', 'ZV-E10', [6200, 10500]],
            ['Nikon', 'Z50', [7300, 12900]],
            ['Fujifilm', 'X-S10', [9800, 17500]],
        ];
        foreach (range(1, 55) as $i) {
            $line = $cameraLines[($i - 1) % count($cameraLines)];
            $price = $this->catalogPrice($line[2][0], $line[2][1], $i + 600, 100);
            $catalog[] = [$photo->id, "{$line[0]} {$line[1]} Kit Photo " . str_pad((string) $i, 2, '0', STR_PAD_LEFT), $price, 1 + ($i % 12), 'camera', "Pack photo {$line[0]} adapte aux createurs, videos, portraits et voyages."];
        }

        $fashionLines = [
            [$men->id, 'T-Shirt Coton Homme', [89, 240], 'clothes'],
            [$men->id, 'Chemise Casual Homme', [150, 420], 'clothes'],
            [$men->id, 'Sneakers Homme', [240, 1150], 'shoes'],
            [$men->id, 'Sac Urbain Homme', [190, 690], 'bag'],
            [$women->id, 'Robe Ete Femme', [160, 590], 'clothes'],
            [$women->id, 'Blazer Femme', [280, 890], 'clothes'],
            [$women->id, 'Sneakers Femme', [230, 1050], 'shoes'],
            [$women->id, 'Sac Main Femme', [220, 1200], 'bag'],
        ];
        $sizes = ['S', 'M', 'L', 'XL', 'Standard'];
        foreach (range(1, 150) as $i) {
            $line = $fashionLines[($i - 1) % count($fashionLines)];
            $price = $this->catalogPrice($line[2][0], $line[2][1], $i + 800, 10);
            $catalog[] = [$line[0], "{$line[1]} {$sizes[$i % count($sizes)]} Ref " . str_pad((string) $i, 3, '0', STR_PAD_LEFT), $price, 6 + ($i % 60), $line[3], "{$line[1]} avec coupe moderne, matiere confortable et selection boutique."];
        }

        $homeLines = [
            ['Machine Cafe Compacte', [390, 2200]],
            ['Mixeur Cuisine 800W', [240, 890]],
            ['Set Poeles Antiadhesives', [180, 760]],
            ['Lampe Bureau LED', [90, 420]],
            ['Organiseur Cuisine', [70, 260]],
            ['Aspirateur Sans Fil', [790, 3600]],
        ];
        foreach (range(1, 80) as $i) {
            $line = $homeLines[($i - 1) % count($homeLines)];
            $price = $this->catalogPrice($line[1][0], $line[1][1], $i + 1000, 10);
            $catalog[] = [$home->id, "{$line[0]} Edition " . str_pad((string) $i, 3, '0', STR_PAD_LEFT), $price, 5 + ($i % 45), 'home', "{$line[0]} pratique pour maison moderne, usage quotidien et rangement facile."];
        }

        $beautyLines = [
            ['Serum Visage Hydratant', [90, 390]],
            ['Parfum Signature 100ml', [180, 1200]],
            ['Tondeuse Precision', [140, 690]],
            ['Brosse Nettoyage Visage', [120, 480]],
            ['Kit Soin Cheveux', [110, 520]],
        ];
        foreach (range(1, 50) as $i) {
            $line = $beautyLines[($i - 1) % count($beautyLines)];
            $price = $this->catalogPrice($line[1][0], $line[1][1], $i + 1200, 10);
            $catalog[] = [$beauty->id, "{$line[0]} Ref " . str_pad((string) $i, 3, '0', STR_PAD_LEFT), $price, 8 + ($i % 35), 'beauty', "{$line[0]} selectionne pour une routine simple, propre et efficace."];
        }

        $sportLines = [
            ['Tapis Yoga Antiderapant', [110, 390]],
            ['Halteres Ajustables', [190, 1200]],
            ['Sac Sport Training', [160, 640]],
            ['Chaussures Running', [330, 1350]],
            ['Gourde Isotherme', [70, 260]],
        ];
        foreach (range(1, 50) as $i) {
            $line = $sportLines[($i - 1) % count($sportLines)];
            $price = $this->catalogPrice($line[1][0], $line[1][1], $i + 1400, 10);
            $family = str_contains($line[0], 'Chaussures') ? 'shoes' : 'sport';
            $catalog[] = [$sport->id, "{$line[0]} Serie " . str_pad((string) $i, 3, '0', STR_PAD_LEFT), $price, 4 + ($i % 40), $family, "{$line[0]} adapte au sport quotidien, fitness et usage outdoor."];
        }

        $officeLines = [
            ['Chaise Bureau Ergonomique', [590, 2400], 'office'],
            ['Bureau Compact Bois', [490, 1900], 'office'],
            ['Webcam Full HD', [190, 890], 'office'],
            ['Ecran 24 Pouces', [950, 2600], 'laptop'],
        ];
        foreach (range(1, 40) as $i) {
            $line = $officeLines[($i - 1) % count($officeLines)];
            $price = $this->catalogPrice($line[1][0], $line[1][1], $i + 1600, 10);
            $catalog[] = [$office->id, "{$line[0]} Ref " . str_pad((string) $i, 3, '0', STR_PAD_LEFT), $price, 3 + ($i % 25), $line[2], "{$line[0]} pour bureau, teletravail et espace professionnel."];
        }

        $gamingLines = [
            ['Manette Gaming Bluetooth', [220, 980]],
            ['Casque Gaming RGB', [260, 1450]],
            ['Clavier Gaming Mecanique', [290, 1500]],
            ['Souris Gaming Pro', [160, 890]],
            ['Console Portable Gaming', [1200, 5200]],
        ];
        foreach (range(1, 40) as $i) {
            $line = $gamingLines[($i - 1) % count($gamingLines)];
            $price = $this->catalogPrice($line[1][0], $line[1][1], $i + 1800, 10);
            $family = str_contains($line[0], 'Casque') ? 'audio' : 'gaming';
            $catalog[] = [$gaming->id, "{$line[0]} G-" . str_pad((string) $i, 3, '0', STR_PAD_LEFT), $price, 4 + ($i % 35), $family, "{$line[0]} concu pour setup gaming, confort et performance."];
        }

        foreach ($catalog as $index => $item) {
            [$categoryId, $name, $price, $quantity, $family, $description] = $item;
            $isPromo = $index % 5 === 0;
            $oldPrice = $isPromo ? $this->roundedPrice($price * (1.10 + (($index % 4) * 0.03)), 10) : null;
            $familyImages = $images[$family] ?? $images['home'];
            $image = $this->imageFor($familyImages, $index);

            $product = $this->product($name, $categoryId, $price, $oldPrice, $quantity, $isPromo, $description, $image);
            $this->syncProductGallery($product, $familyImages, $index);
        }

        $this->normalizePremiumPhones($images);
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

    private function catalogPrice(int $min, int $max, int $seed, int $round = 10): float
    {
        $span = max($max - $min, $round);
        $raw = $min + (($seed * 137 + 53) % $span);
        return $this->roundedPrice($raw, $round);
    }

    private function roundedPrice(float $value, int $round = 10): float
    {
        return (float) max($round, round($value / $round) * $round);
    }

    private function imageFor(array $images, int $seed): string
    {
        return $images[$seed % count($images)];
    }

    private function syncProductGallery(Product $product, array $images, int $seed): void
    {
        foreach (range(0, min(2, count($images) - 1)) as $offset) {
            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'sort_order' => $offset],
                ['image_path' => $this->imageFor($images, $seed + $offset)]
            );
        }
    }

    private function normalizePremiumPhones(array $images): void
    {
        $rules = [
            ['prefix' => 'Apple iPhone 15 Pro', 'min' => 10900, 'max' => 16500, 'family' => 'apple_phone'],
            ['prefix' => 'Apple iPhone 16', 'min' => 11200, 'max' => 18000, 'family' => 'apple_phone'],
            ['prefix' => 'Apple iPhone 15', 'min' => 8200, 'max' => 12500, 'family' => 'apple_phone', 'exclude' => 'Apple iPhone 15 Pro'],
            ['prefix' => 'Samsung Galaxy S24', 'min' => 8200, 'max' => 13000, 'family' => 'android_phone'],
            ['prefix' => 'Samsung Galaxy Z Flip', 'min' => 9400, 'max' => 15500, 'family' => 'android_phone'],
            ['prefix' => 'Samsung Galaxy S23', 'min' => 6800, 'max' => 10400, 'family' => 'android_phone'],
        ];

        foreach ($rules as $ruleIndex => $rule) {
            $query = Product::where('name', 'like', $rule['prefix'] . '%');
            if (isset($rule['exclude'])) {
                $query->where('name', 'not like', $rule['exclude'] . '%');
            }

            $query->get()->each(function (Product $product, int $index) use ($rule, $ruleIndex, $images) {
                $familyImages = $images[$rule['family']];
                $price = (float) $product->price;
                if ($price < $rule['min'] || $price > $rule['max']) {
                    $price = $this->catalogPrice($rule['min'], $rule['max'], $ruleIndex * 100 + $index, 50);
                }

                $product->update([
                    'price' => $price,
                    'old_price' => $product->is_promo ? $this->roundedPrice($price * 1.12, 50) : null,
                    'image' => $this->imageFor($familyImages, $index),
                ]);

                $this->syncProductGallery($product, $familyImages, $index);
            });
        }
    }

    private function seedDemoOrders(User $client, User $secondClient, Address $address, Address $secondAddress): void
    {
        $products = Product::orderBy('id')->take(90)->get();
        if ($products->count() < 10) {
            return;
        }

        $statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        $methods = ['standard', 'express', 'pickup'];
        $paymentMethods = ['cod', 'card', 'paypal'];
        $paidStatuses = ['confirmed', 'shipped', 'delivered'];

        foreach (range(1, 45) as $i) {
            $user = $i % 3 === 0 ? $secondClient : $client;
            $orderAddress = $user->id === $secondClient->id ? $secondAddress : $address;
            $status = $statuses[$i % count($statuses)];
            $deliveryMethod = $methods[$i % count($methods)];
            $deliveryFee = $deliveryMethod === 'express' ? 45 : ($deliveryMethod === 'pickup' ? 0 : 30);
            $createdAt = now()->subDays(120 - ($i * 2))->subHours($i % 8);
            $lineCount = 1 + ($i % 3);
            $lines = [];
            $itemsTotal = 0;

            foreach (range(1, $lineCount) as $line) {
                $product = $products[(($i * 3) + $line) % $products->count()];
                $quantity = 1 + (($i + $line) % 2);
                $unitPrice = (float) $product->price;
                $itemsTotal += $unitPrice * $quantity;
                $lines[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                ];
            }

            $tracking = 'TRK-DEMO-' . str_pad((string) (2000 + $i), 4, '0', STR_PAD_LEFT);
            $totalAmount = $itemsTotal + $deliveryFee;

            $order = Order::updateOrCreate(
                ['tracking_number' => $tracking],
                [
                    'user_id' => $user->id,
                    'address_id' => $orderAddress->id,
                    'status' => $status,
                    'total_amount' => $totalAmount,
                    'loyalty_points_used' => $i % 6 === 0 ? 20 : 0,
                    'loyalty_points_earned' => in_array($status, $paidStatuses, true) ? (int) floor($totalAmount / 100) : 0,
                    'loyalty_discount' => $i % 6 === 0 ? 20 : 0,
                    'delivery_method' => $deliveryMethod,
                    'delivery_fee' => $deliveryFee,
                    'estimated_delivery_date' => $createdAt->copy()->addDays(3 + ($i % 4)),
                ]
            );

            $order->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addHours(2),
            ])->saveQuietly();

            OrderItem::where('order_id', $order->id)->delete();
            foreach ($lines as $line) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'unit_price' => $line['unit_price'],
                    'quantity' => $line['quantity'],
                ]);
            }

            Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'transaction_id' => 'PAY-' . $tracking,
                    'payment_method' => $paymentMethods[$i % count($paymentMethods)],
                    'amount' => $totalAmount,
                    'status' => in_array($status, $paidStatuses, true) ? 'completed' : ($status === 'cancelled' ? 'failed' : 'pending'),
                ]
            );

            if ($status === 'delivered' && $i % 11 === 0) {
                OrderReturn::updateOrCreate(
                    ['order_id' => $order->id],
                    [
                        'user_id' => $user->id,
                        'reason' => 'Produit a echanger',
                        'details' => 'Retour demo pour tester la gestion apres-vente.',
                        'status' => 'requested',
                        'admin_note' => 'Verifier avec le client avant validation.',
                    ]
                );
            }
        }
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
