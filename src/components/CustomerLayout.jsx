import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  User 
} from 'lucide-react';
import './CustomerLayout.css';
import logoImg from '../assets/images/a_big_logo.png';

export default function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Load custom profile display name if saved
  const [displayName, setDisplayName] = useState('');
  useEffect(() => {
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setDisplayName(parsed.displayName || '');
        } catch (e) {
          console.error('Failed to parse profile details', e);
        }
      }
      
      if (!displayName) {
        const parts = currentUser.email.split('@')[0];
        setDisplayName(parts.charAt(0).toUpperCase() + parts.slice(1));
      }
    }
  }, [currentUser, displayName]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Shop Collection', path: '/customer/shop', icon: ShoppingBag },
    { 
      name: 'Cart', 
      path: '/customer/cart', 
      icon: ShoppingCart, 
      badge: cartCount > 0 ? cartCount : null 
    },
    { name: 'Settings', path: '/customer/settings', icon: SettingsIcon },
  ];

  // Close sidebar automatically on route change (for mobile drawer)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : 'CU';

  return (
    <div className="customer-layout">
      {/* Mobile Top Header */}
      <header className="mobile-header glass">
        <button 
          className="mobile-toggle" 
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="mobile-logo">
          <img src={logoImg} alt="A-BIG Logo" />
        </Link>
        <Link to="/customer/cart" className="mobile-cart-btn" aria-label="View Cart">
          <ShoppingCart size={22} />
          {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
        </Link>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay fade-in" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`dashboard-sidebar glass ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/" className="sidebar-logo-wrap">
            <img src={logoImg} alt="A-BIG Logo" className="sidebar-logo" />
            <span className="sidebar-tag">CUSTOMER PANEL</span>
          </Link>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card card">
          <div className="user-avatar-wrap">
            {initials}
          </div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role-badge">Premium Member</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.name}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Action */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
          <p className="sidebar-copyright">© 2026 A-BIG Glow & Scents</p>
        </div>
      </aside>

      {/* Page Content Viewport */}
      <main className="dashboard-main-content">
        <div className="content-inner container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
