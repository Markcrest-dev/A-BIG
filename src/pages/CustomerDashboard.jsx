import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const { currentUser } = useAuth();
  const { cartCount, cartTotal } = useCart();

  // Get name from email
  const displayName = currentUser?.email ? currentUser.email.split('@')[0] : 'Valued Customer';
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <div className="dashboard-page container fade-in">
      <div className="dashboard-hero glass">
        <div className="dashboard-hero-content">
          <span className="hero-emoji">✨</span>
          <h1>Welcome Back, {formattedName}</h1>
          <p className="hero-subtitle">Indulge in our exquisite collection of premium scents and glowing beauty products.</p>
          <div className="hero-meta">
            <span className="user-badge">Premium Member</span>
            <span className="user-email-meta">{currentUser?.email}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Cart Quick View Card */}
        <div className="dashboard-card card">
          <div className="card-icon">🛒</div>
          <h3>Your Shopping Cart</h3>
          <p className="card-desc">You currently have <strong className="text-gold">{cartCount}</strong> items in your cart.</p>
          <div className="card-stat">
            <span className="stat-label">Total Value:</span>
            <span className="stat-value">₦{cartTotal.toLocaleString()}</span>
          </div>
          <div className="card-actions">
            <Link to="/customer/cart" className="btn btn-gold btn-sm">View Cart</Link>
            <Link to="/customer/shop" className="btn btn-outline btn-sm">Go to Shop</Link>
          </div>
        </div>

        {/* Explore Shop Card */}
        <div className="dashboard-card card">
          <div className="card-icon">🛍️</div>
          <h3>Curated Fragrances</h3>
          <p className="card-desc">Discover our range of custom perfumes, luxury colognes, and refreshing room scents.</p>
          <div className="card-stat">
            <span className="stat-label">Status:</span>
            <span className="stat-value text-success">New Arrivals In!</span>
          </div>
          <div className="card-actions">
            <Link to="/customer/shop" className="btn btn-gold btn-sm">Explore Collection</Link>
          </div>
        </div>

        {/* Profile/Settings Card */}
        <div className="dashboard-card card">
          <div className="card-icon">⚙️</div>
          <h3>Account Settings</h3>
          <p className="card-desc">Update your profile information, secure your account details, or review preferences.</p>
          <div className="card-stat">
            <span className="stat-label">Verified:</span>
            <span className="stat-value text-gold">✓ Secure Session</span>
          </div>
          <div className="card-actions">
            <Link to="/customer/settings" className="btn btn-gold btn-sm">Edit Profile</Link>
          </div>
        </div>
      </div>

      {/* Decorative Brand Message */}
      <div className="dashboard-brand-quote text-center">
        <span className="quote-icon">✦</span>
        <p className="quote-text">"Scent is the most intense form of memory. Make yours unforgettable."</p>
        <span className="quote-author">— A-BIG Glow & Scents</span>
      </div>
    </div>
  );
}
