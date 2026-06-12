import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import DashboardPage from './pages/DashboardPage';
import SupportPage from './pages/SupportPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCouponsPage from './pages/AdminCouponsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import ComparePage from './pages/ComparePage';
import AdminReturnsPage from './pages/AdminReturnsPage';
import AdminDeliveryPage from './pages/AdminDeliveryPage';
import ReturnsPage from './pages/ReturnsPage';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

function App() {
  const { loading, user } = useContext(AuthContext);

  const isAdmin = user && user.role === 'admin';
  const isAdminOrSuperviseur = user && (user.role === 'admin' || user.role === 'superviseur');

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Chargement...</div>;

  return (
    <Routes>
      {/* ---- PAGES PUBLIQUES ---- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/compare" element={<ComparePage />} />

      {/* ---- PAGES CLIENT (Connecté) ---- */}
      <Route path="/cart"      element={user ? <CartPage />      : <Navigate to="/login" />} />
      <Route path="/checkout"  element={user ? <CheckoutPage />  : <Navigate to="/login" />} />
      <Route path="/orders"    element={user ? <OrdersPage />    : <Navigate to="/login" />} />
      <Route path="/returns"   element={user ? <ReturnsPage />   : <Navigate to="/login" />} />
      <Route path="/support"   element={user ? <SupportPage />   : <Navigate to="/login" />} />
      <Route path="/favorites" element={user ? <FavoritesPage /> : <Navigate to="/login" />} />
      <Route path="/profile"   element={user ? <ProfilePage />   : <Navigate to="/login" />} />

      {/* ---- PAGES SUPERVISEUR + ADMIN ---- */}
      <Route path="/dashboard"        element={isAdminOrSuperviseur ? <DashboardPage />     : <Unauthorized />} />
      <Route path="/admin/products"   element={isAdminOrSuperviseur ? <AdminProductsPage /> : <Unauthorized />} />
      <Route path="/admin/orders"     element={isAdminOrSuperviseur ? <AdminOrdersPage />   : <Unauthorized />} />
      <Route path="/admin/returns"    element={isAdminOrSuperviseur ? <AdminReturnsPage />  : <Unauthorized />} />
      <Route path="/admin/delivery"   element={isAdminOrSuperviseur ? <AdminDeliveryPage /> : <Unauthorized />} />
      <Route path="/admin/logs"       element={isAdminOrSuperviseur ? <ActivityLogsPage />  : <Unauthorized />} />

      {/* ---- PAGES ADMIN UNIQUEMENT ---- */}
      <Route path="/admin/categories" element={isAdmin ? <AdminCategoriesPage /> : <Unauthorized />} />
      <Route path="/admin/users"      element={isAdmin ? <AdminUsersPage />      : <Unauthorized />} />
      <Route path="/admin/coupons"    element={isAdmin ? <AdminCouponsPage />    : <Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
