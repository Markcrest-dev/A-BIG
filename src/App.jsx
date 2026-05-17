import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';
import CustomerDashboard from './pages/CustomerDashboard';
import Cart from './pages/Cart';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />

              {/* Customer Routes (Protected) */}
              <Route
                path="/customer/dashboard"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/shop"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <Shop />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/cart"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/settings"
                element={
                  <ProtectedRoute adminOnly={false}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes (Protected) */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
