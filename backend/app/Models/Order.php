<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'address_id',
        'status',
        'total_amount',
        'loyalty_points_used',
        'loyalty_points_earned',
        'loyalty_discount',
        'delivery_method',
        'delivery_fee',
        'estimated_delivery_date',
        'tracking_number',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'loyalty_discount' => 'decimal:2',
        'loyalty_points_used' => 'integer',
        'loyalty_points_earned' => 'integer',
        'delivery_fee' => 'decimal:2',
        'estimated_delivery_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function returnRequest(): HasOne
    {
        return $this->hasOne(OrderReturn::class);
    }
}
