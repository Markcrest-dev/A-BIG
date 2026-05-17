import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

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
            Shop
          </Link>
          {!isAdmin && (
            <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
              Admin
            </Link>
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
