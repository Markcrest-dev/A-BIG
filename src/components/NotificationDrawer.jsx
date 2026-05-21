import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Bell, BellOff, X, Check, CreditCard, ShoppingBag, AlertCircle, CheckSquare, Truck, CheckCircle } from 'lucide-react';
import './NotificationDrawer.css';

export default function NotificationDrawer({ isOpen, onClose, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync notifications from Firestore in real-time
  useEffect(() => {
    if (!isOpen || !userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort in-memory: newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      setNotifications(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching notifications:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, userId]);

  const handleMarkAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      // Use Firestore Batch to update all unread in one transaction
      const batch = writeBatch(db);
      unread.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_payment':
        return <CreditCard className="notif-icon-paid" size={18} />;
      case 'order_created':
        return <ShoppingBag className="notif-icon-created" size={18} />;
      case 'order_shipped':
        return <Truck className="notif-icon-shipped" size={18} />;
      case 'order_completed':
        return <CheckCircle className="notif-icon-completed" size={18} />;
      case 'package_received':
        return <CheckCircle className="notif-icon-received" size={18} />;
      case 'restock_request':
        return <AlertCircle className="notif-icon-request" size={18} />;
      default:
        return <Bell className="notif-icon-default" size={18} />;
    }
  };

  const getFormattedTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="notif-drawer-overlay" onClick={onClose}>
      <div className="notif-drawer-panel glass slide-in-right" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="notif-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell className="text-gold animate-bell" size={22} />
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="notif-badge-pill">{unreadCount} new</span>}
          </div>
          <button className="notif-drawer-close" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>

        {/* Action Row */}
        {notifications.length > 0 && unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn-mark-all">
            <CheckSquare size={14} /> Mark all as read
          </button>
        )}

        {/* Notification List */}
        <div className="notif-drawer-body">
          {loading ? (
            <div className="notif-loading-states">
              <div className="skeleton notif-skel" />
              <div className="skeleton notif-skel" />
              <div className="skeleton notif-skel" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty-state text-center">
              <div className="empty-bell-icon">
                <BellOff size={36} />
              </div>
              <h4>No notifications yet</h4>
              <p>Everything is quiet! We will notify you here when order updates or alerts arrive.</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`notif-item card glass ${n.read ? 'read' : 'unread'}`}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                  style={{ cursor: !n.read ? 'pointer' : 'default' }}
                >
                  <div className="notif-item-header">
                    <div className="notif-type-wrap">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="notif-text-content">
                      <h4 className="notif-item-title">{n.title}</h4>
                      <p className="notif-item-desc">{n.message}</p>
                      <span className="notif-item-time">{getFormattedTime(n.createdAt)}</span>
                    </div>
                    {!n.read && (
                      <div className="unread-pulse-dot" title="Unread" />
                    )}
                  </div>
                  {!n.read && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }} 
                      className="notif-item-mark-read-btn"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
