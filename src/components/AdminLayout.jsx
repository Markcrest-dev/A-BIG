import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  ClipboardList, 
  Home, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import './AdminLayout.css';
import logoImg from '../assets/images/a_big_logo.png';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
        <div style={{ width: 40 }} /> {/* Spacer for balance */}
      </header>

      {/* Backdrop overlay */}
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
            <span className="sidebar-tag">ADMIN PORTAL</span>
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
          <div className="admin-avatar-wrap">
            <ShieldCheck size={22} />
          </div>
          <div className="user-info">
            <span className="user-name">Store Admin</span>
            <span className="user-role-badge">{currentUser?.email}</span>
          </div>
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
      <main className="dashboard-main-content">
        <div className="content-inner container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
