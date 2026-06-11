<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsSuperviseur
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->user() ? $request->user()->role : null;
        
        if ($role === 'superviseur' || $role === 'admin') {
            return $next($request);
        }

        return response()->json([
            'error' => 'Accès interdit. Rôle Superviseur ou Administrateur requis.'
        ], 403);
    }
}
