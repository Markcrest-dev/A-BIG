import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const { currentUser, logout } = useAuth();

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
          <Link to="/shop" className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            Shop
          </Link>
          {!isAdmin && !currentUser && (
            <>
              <Link to="/auth" className={`nav-link ${location.pathname === '/auth' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Login / Sign Up
              </Link>
              <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            </>
          )}
          {!isAdmin && currentUser && (
            <>
              <span className="nav-link user-email" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {currentUser.email}
              </span>
              <button 
                onClick={() => { handleLogout(); setMenuOpen(false); }} 
                className="nav-link btn-logout" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
              >
                Logout
              </button>
              <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            </>
          )}
          {isAdmin && (
            <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              ← Back to Shop
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
