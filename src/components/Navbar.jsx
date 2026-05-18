import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import './Navbar.css';
import logoImg from '../assets/images/a_big_logo.png';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  // Hide Navbar completely on customer and admin dashboard/panel pages
  const isDashboard = location.pathname.startsWith('/customer') || location.pathname.startsWith('/admin');

  // Handle scroll effect for elegant blur transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isDashboard) {
    return null; // Sidebars will handle dashboard navigation
  }

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
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <img src={logoImg} alt="A-BIG Glow & Scents" className="navbar-logo" />
        </Link>

        <div className="navbar-links">
          
          {/* Guest Action */}
          {!currentUser ? (
            <Link to="/auth" className="btn btn-gold btn-sm nav-auth-btn">
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          ) : (
            <div className="nav-authenticated-actions">
              {isAdmin ? (
                <Link to="/admin/dashboard" className="btn btn-gold btn-sm nav-dashboard-btn">
                  <ShieldCheck size={16} />
                  <span>Admin Panel</span>
                </Link>
              ) : (
                <Link to="/customer/dashboard" className="btn btn-gold btn-sm nav-dashboard-btn">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
              )}
              
              <button 
                onClick={handleLogout} 
                className="nav-link btn-logout" 
                title="Logout"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={16} />
                <span className="logout-text">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
