import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  Sparkles, 
  ShoppingCart, 
  ShoppingBag, 
  Compass, 
  Clock, 
  CheckCircle,
  Truck,
  Activity,
  Heart,
  ChevronRight
} from 'lucide-react';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
  const { currentUser } = useAuth();
  const { cartCount, cartTotal } = useCart();
  const [displayName, setDisplayName] = useState('');
  const [scentPref, setScentPref] = useState('woody');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Load profile details from LocalStorage on mount
  useEffect(() => {
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.displayName) setDisplayName(parsed.displayName);
          if (parsed.scentPref) setScentPref(parsed.scentPref);
        } catch (e) {
          console.error('Failed to parse local profile on dashboard', e);
        }
      }
      
      // Fallback display name
      if (!displayName) {
        const parts = currentUser.email.split('@')[0];
        setDisplayName(parts.charAt(0).toUpperCase() + parts.slice(1));
      }
    }
  }, [currentUser, displayName]);

  // Real-time listener for user's orders
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      setOrders(items);
      setLoadingOrders(false);
    }, (err) => {
      console.error('Failed to listen to customer orders:', err);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const scentPrefDisplay = {
    woody: 'Woody & Warm 🪵',
    floral: 'Floral & Sweet 🌹',
    fresh: 'Fresh & Citrusy 🍋',
    oriental: 'Oriental & Spicy 🌶️'
  }[scentPref] || 'Woody & Warm 🪵';

  return (
    <div className="dashboard-page container fade-in">
      {/* Luxury Welcome Card */}
      <div className="dashboard-hero glass">
        <div className="dashboard-hero-content">
          <div className="sparkle-icon-wrap">
            <Sparkles size={28} className="text-gold" />
          </div>
          <h1>Welcome Back, {displayName}</h1>
          <p className="hero-subtitle">
            Indulge in our exquisite collection of signature scents, custom fragrances, and glowing cosmetics.
          </p>
          <div className="hero-meta">
            <span className="user-badge">Premium Member</span>
            <span className="user-email-meta">{currentUser?.email}</span>
          </div>
        </div>
        <div className="dashboard-hero-glow" />
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        {/* Cart Stat */}
        <div className="stat-card card glass">
          <div className="stat-card-icon-wrap" style={{ background: 'rgba(212,168,67,0.1)', color: 'var(--gold)' }}>
            <ShoppingCart size={22} />
          </div>
          <div className="stat-card-details">
            <span className="stat-card-label">Shopping Cart</span>
            <h3>{cartCount} Items</h3>
            <p className="stat-card-desc">Total subtotal: <strong className="text-gold">₦{cartTotal.toLocaleString()}</strong></p>
          </div>
          <Link to="/customer/cart" className="stat-card-link" title="View Cart">
            <ChevronRight size={18} />
          </Link>
        </div>

        {/* Orders Stat */}
        <div className="stat-card card glass">
          <div className="stat-card-icon-wrap" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ECC71' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="stat-card-details">
            <span className="stat-card-label">Orders History</span>
            <h3>{orders.length} Completed</h3>
            <p className="stat-card-desc">Real-time status updates</p>
          </div>
          <a href="#orders-history" className="stat-card-link" title="View Orders">
            <ChevronRight size={18} />
          </a>
        </div>

        {/* Preferences Stat */}
        <div className="stat-card card glass">
          <div className="stat-card-icon-wrap" style={{ background: 'rgba(9, 165, 219, 0.1)', color: '#09a5db' }}>
            <Compass size={22} />
          </div>
          <div className="stat-card-details">
            <span className="stat-card-label">Scent Profile</span>
            <h3>{scentPrefDisplay.split(' ')[0]} Preferred</h3>
            <p className="stat-card-desc">{scentPrefDisplay.split(' ').slice(1).join(' ')} notes curated</p>
          </div>
          <Link to="/customer/settings" className="stat-card-link" title="Update Profile">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="dashboard-content-layout">
        {/* Orders History Section */}
        <section id="orders-history" className="orders-history-section">
          <div className="section-title-wrap">
            <Clock size={20} className="text-gold" />
            <h3>Recent Orders</h3>
          </div>
          <div className="gold-line" style={{ width: '80px', margin: '8px 0 24px' }} />

          {loadingOrders ? (
            <div className="orders-loading">
              <div className="skeleton" style={{ height: 50, marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: 50, marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: 50 }} />
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-orders card glass text-center">
              <div className="empty-orders-icon-wrap">
                <Heart size={36} />
              </div>
              <h4>No orders recorded yet</h4>
              <p>Explore our catalog of premium custom scents and place your first luxurious order today.</p>
              <Link to="/customer/shop" className="btn btn-gold btn-sm" style={{ marginTop: '16px' }}>
                Visit Shop Collection
              </Link>
            </div>
          ) : (
            <div className="dashboard-table-wrap card glass">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Date / Ref</th>
                    <th>Ordered Scents</th>
                    <th>Total Price</th>
                    <th>Delivery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const dateStr = order.createdAt?.toDate 
                      ? order.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                      : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Processing');
                    
                    const status = order.status || 'Paid';

                    return (
                      <tr key={order.id}>
                        <td>
                          <span className="order-date">{dateStr}</span>
                          <span className="order-ref">{order.orderReference}</span>
                        </td>
                        <td>
                          <ul className="order-items-list">
                            {order.items?.map((item, index) => (
                              <li key={index} className="order-item-detail">
                                <span className="item-qty">{item.quantity}x</span>
                                <span className="item-name">{item.name}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          <span className="order-price">₦{(order.totalAmount || 0).toLocaleString()}</span>
                          <span className="order-payment-badge">Paid Online</span>
                        </td>
                        <td>
                          <span className={`status-badge ${status.toLowerCase()}`}>
                            {status === 'Paid' && <CheckCircle size={12} />}
                            {status === 'Processing' && <Activity size={12} />}
                            {status === 'Shipped' && <Truck size={12} />}
                            {status === 'Delivered' && <CheckCircle size={12} />}
                            {status === 'Completed' && <CheckCircle size={12} />}
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Decorative Quote */}
      <div className="dashboard-brand-quote text-center">
        <span className="quote-spark">✦</span>
        <p className="quote-text">"Scent is the unspoken key to memory. Make yours absolute luxury."</p>
        <span className="quote-author">— A-BIG Glow & Scents</span>
      </div>
    </div>
  );
}
