import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { cartCount } = useCart();

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
  const isAdmin = currentUser && currentUser.email.toLowerCase() === adminEmail.toLowerCase();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="navbar glass">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">✦</span>
          <div className="brand-text">
            <span className="brand-name">A-BIG Glow & Scents</span>
            <span className="brand-tagline">Where Elegance Meets Confidence</span>
          </div>
        </Link>

        <button
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          
          {/* Guest Links */}
          {!currentUser && (
            <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Login / Sign Up
            </Link>
          )}

          {/* Customer Links */}
          {currentUser && !isAdmin && (
            <>
              <Link to="/customer/dashboard" className={`nav-link ${location.pathname === '/customer/dashboard' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/customer/shop" className={`nav-link ${location.pathname === '/customer/shop' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Shop
              </Link>
              <Link to="/customer/cart" className={`nav-link ${location.pathname === '/customer/cart' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Cart {cartCount > 0 && <span className="cart-badge-nav">{cartCount}</span>}
              </Link>
              <Link to="/customer/settings" className={`nav-link ${location.pathname === '/customer/settings' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Settings
              </Link>
            </>
          )}

          {/* Admin Links */}
          {currentUser && isAdmin && (
            <Link to="/admin/dashboard" className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Admin Dashboard
            </Link>
          )}

          {/* Logout Button */}
          {currentUser && (
            <button 
              onClick={() => { handleLogout(); setMenuOpen(false); }} 
              className="nav-link btn-logout" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
