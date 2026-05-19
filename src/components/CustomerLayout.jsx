import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import NotificationDrawer from './NotificationDrawer';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ShoppingCart, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import ProductDetailModal from './ProductDetailModal';
import RequestModal from './RequestModal';
import './CustomerLayout.css';
import logoImg from '../assets/images/a_big_logo.png';

export default function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('customer_sidebar_collapsed');
    return saved === 'true';
  });
  const { currentUser, logout } = useAuth();
  const { cartCount, addToCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Layout-level modals
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [requestProduct, setRequestProduct] = useState(null);

  useEffect(() => {
    localStorage.setItem('customer_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Load custom profile display name if saved
  const [displayName, setDisplayName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Real-time listener for unread notifications count
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    }, (err) => {
      console.error('Error listening to unread customer notifications:', err);
    });
    return () => unsub();
  }, [currentUser]);

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
    { name: 'My Orders', path: '/customer/orders', icon: ClipboardList },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="mobile-notif-btn" 
            onClick={() => setNotifDrawerOpen(true)}
            aria-label="View Notifications"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--white)', 
              cursor: 'pointer', 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
          >
            <Bell size={22} className={unreadCount > 0 ? "animate-bell text-gold" : ""} />
            {unreadCount > 0 && (
              <span className="mobile-cart-badge" style={{ background: 'var(--gold)', color: 'var(--black)', right: '-2px', top: '-2px' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <Link to="/customer/cart" className="mobile-cart-btn" aria-label="View Cart">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay fade-in" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`dashboard-sidebar glass ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <Link to="/" className="sidebar-logo-wrap">
            {sidebarCollapsed ? (
              <img src={logoImg} alt="A-BIG Logo" className="sidebar-logo-collapsed-img" />
            ) : (
              <>
                <img src={logoImg} alt="A-BIG Logo" className="sidebar-logo" />
              </>
            )}
          </Link>
          
          <div className="sidebar-actions-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu size={18} />
            </button>

            <button 
              className="sidebar-close-btn" 
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="user-avatar-wrap">
              {initials}
            </div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role-badge">Premium Member</span>
            </div>
          </div>
          <button 
            onClick={() => setNotifDrawerOpen(true)} 
            className="sidebar-notif-bell-btn"
            title="View Notifications"
            style={{
              background: 'none',
              border: 'none',
              color: unreadCount > 0 ? 'var(--gold)' : 'var(--gray-light)',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'var(--transition)'
            }}
          >
            <Bell size={20} className={unreadCount > 0 ? "animate-bell" : ""} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: 'var(--white-pure)',
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                fontSize: '0.62rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 5px rgba(0,0,0,0.5)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.action) {
              return (
                <button 
                  key={idx}
                  onClick={item.action}
                  className={`sidebar-nav-item sidebar-action-nav-item ${item.highlight ? 'nav-item-highlight' : ''}`}
                  style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <Icon size={20} className="nav-icon" />
                  <span className="nav-label">{item.name}</span>
                </button>
              );
            }
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
      <main className={`dashboard-main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="content-inner container">
          <Outlet />
        </div>
      </main>

      {/* Notifications sliding panel */}
      <NotificationDrawer 
        isOpen={notifDrawerOpen} 
        onClose={() => setNotifDrawerOpen(false)} 
        userId={currentUser?.uid} 
      />


      {/* Product Detail Modal */}
      {selectedDetailProduct && (
        <ProductDetailModal 
          product={selectedDetailProduct} 
          onClose={() => setSelectedDetailProduct(null)}
          onAddToCart={(p, v) => addToCart(p, v)}
          onOrder={(p) => {
            addToCart(p);
            setSelectedDetailProduct(null);
            navigate('/customer/cart');
          }}
          onRequest={(p) => {
            setRequestProduct(p);
          }}
        />
      )}

      {/* Request Out-of-stock Scent Modal */}
      {requestProduct && (
        <RequestModal 
          product={requestProduct} 
          onClose={() => setRequestProduct(null)} 
        />
      )}
    </div>
  );
}
