import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import NotificationDrawer from './NotificationDrawer';
import { 
  Package, 
  ClipboardList, 
  Home, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './AdminLayout.css';
import logoImg from '../assets/images/a_big_logo.png';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    return saved === 'true';
  });
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Real-time listener for unread admin notifications count
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', 'admin'),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    }, (err) => {
      console.error('Error listening to unread admin notifications:', err);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Close sidebar automatically on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  // Determine which tab is active based on url search param
  const queryParams = new URLSearchParams(location.search);
  const currentTab = queryParams.get('tab') || 'products';

  const menuItems = [
    { 
      name: 'Product Catalog', 
      path: '/admin/dashboard?tab=products', 
      icon: Package, 
      active: location.pathname === '/admin/dashboard' && currentTab === 'products'
    },
    { 
      name: 'Customer Orders', 
      path: '/admin/dashboard?tab=orders', 
      icon: ClipboardList, 
      active: location.pathname === '/admin/dashboard' && currentTab === 'orders'
    },
    { 
      name: 'Visit Storefront', 
      path: '/', 
      icon: Home, 
      active: false
    },
  ];

  return (
    <div className="admin-layout">
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
            <span className="mobile-cart-badge" style={{ background: 'var(--gold)', color: 'var(--black)', right: '2px', top: '2px' }}>
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay fade-in" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`dashboard-sidebar glass ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Toggle Button for Desktop */}
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="sidebar-top">
          <Link to="/" className="sidebar-logo-wrap">
            {sidebarCollapsed ? (
              <span className="sidebar-logo-collapsed-text">A</span>
            ) : (
              <>
                <img src={logoImg} alt="A-BIG Logo" className="sidebar-logo" />
                <span className="sidebar-tag">ADMIN PORTAL</span>
              </>
            )}
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
        <div className="sidebar-user-card card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="admin-avatar-wrap">
              <ShieldCheck size={22} />
            </div>
            <div className="user-info">
              <span className="user-name">Store Admin</span>
              <span className="user-role-badge">{currentUser?.email}</span>
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
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-label">{item.name}</span>
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
          <p className="sidebar-copyright">© 2026 A-BIG Admin</p>
        </div>
      </aside>

      {/* Page Content Viewport */}
      <main className={`dashboard-main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="content-inner container">
          <Outlet />
        </div>
      </main>

      {/* Notifications Drawer */}
      <NotificationDrawer 
        isOpen={notifDrawerOpen} 
        onClose={() => setNotifDrawerOpen(false)} 
        userId="admin" 
      />
    </div>
  );
}
