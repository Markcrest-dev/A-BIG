import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  ClipboardList, 
  ShoppingBag, 
  CheckCircle, 
  Activity, 
  Truck, 
  Mail, 
  Phone, 
  MapPin, 
  Image as ImageIcon,
  ChevronRight,
  Sparkles,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import './CustomerOrders.css';

export default function CustomerOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      setLoading(false);
    }, (err) => {
      console.error('Failed to listen to customer orders:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Compute stats
  const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Delivered');
  const pastOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered');

  // Compute status step index for progress tracker
  const getStatusStepIndex = (status) => {
    const s = status || 'Paid';
    if (s === 'Paid') return 0;
    if (s === 'Processing') return 1;
    if (s === 'Shipped') return 2;
    if (s === 'Delivered' || s === 'Completed') return 3;
    return 0;
  };

  const currentStep = selectedOrder ? getStatusStepIndex(selectedOrder.status) : 0;
  const lineProgressPercent = (currentStep / 3) * 100;

  // Format WhatsApp query message
  const getWhatsAppInquiryLink = (order) => {
    const phone = '+2348123456789'; // Default administrative hotline
    const msg = `Hello A-BIG Glow & Scents, I am inquiring about my order reference *${order.orderReference}* (Status: ${order.status || 'Paid'}). Could you please check on the delivery schedule for me? Thank you!`;
    return `https://wa.me/2348123456789?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="orders-page fade-in">
      {/* Luxury Orders Hero Header */}
      <div className="orders-header-hero glass">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="sparkle-icon-wrap" style={{ display: 'inline-flex', marginBottom: '12px' }}>
            <ClipboardList size={22} className="text-gold" />
          </div>
          <h1>My Orders History</h1>
          <p className="orders-hero-subtitle">
            Track and monitor the status of your luxurious scents, glowing cosmetics, and signature scents.
          </p>
        </div>
        <div className="dashboard-hero-glow" />
      </div>

      {/* Stats Cards */}
      <div className="orders-stats-row">
        <div className="orders-stat-card card glass">
          <div className="orders-stat-icon-wrap" style={{ background: 'rgba(212,168,67,0.1)', color: 'var(--gold)' }}>
            <ShoppingBag size={20} />
          </div>
          <div className="orders-stat-info">
            <p>Total Orders</p>
            <h3>{orders.length}</h3>
          </div>
        </div>

        <div className="orders-stat-card card glass">
          <div className="orders-stat-icon-wrap" style={{ background: 'rgba(230, 126, 34, 0.1)', color: '#e67e22' }}>
            <Activity size={20} />
          </div>
          <div className="orders-stat-info">
            <p>Active Shipments</p>
            <h3>{activeOrders.length}</h3>
          </div>
        </div>

        <div className="orders-stat-card card glass">
          <div className="orders-stat-icon-wrap" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
            <CheckCircle size={20} />
          </div>
          <div className="orders-stat-info">
            <p>Completed Orders</p>
            <h3>{pastOrders.length}</h3>
          </div>
        </div>
      </div>

      {/* Orders List Section */}
      <div className="section-title-wrap" style={{ marginBottom: '12px' }}>
        <Clock size={20} className="text-gold" />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--white)', margin: 0, fontWeight: 600 }}>Your Purchases</h3>
      </div>
      <div className="gold-line" style={{ width: '80px', margin: '4px 0 24px', height: '2px', background: 'var(--gold)' }} />

      {loading ? (
        <div className="orders-loading">
          <div className="skeleton" style={{ height: 60, marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: 60, marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: 60 }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-orders card glass text-center" style={{ padding: '60px 24px' }}>
          <div className="empty-orders-icon-wrap">
            <ShoppingBag size={36} />
          </div>
          <h4>No orders recorded yet</h4>
          <p>Discover our beautiful collections of signature fragrances and place your first luxurious order today.</p>
        </div>
      ) : (
        <div className="orders-table-card card glass">
          <div className="orders-table-wrapper">
            <table className="orders-list-table">
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Purchased Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const dateStr = order.createdAt?.toDate 
                    ? order.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                    : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Processing');
                  
                  const status = order.status || 'Paid';

                  return (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)}>
                      <td>
                        <span className="order-date">{dateStr}</span>
                        <span className="order-ref" style={{ fontSize: '0.8rem' }}>{order.orderReference}</span>
                        <div className="clickable-row-hint">
                          <span>Click to view details</span> <ChevronRight size={10} />
                        </div>
                      </td>
                      <td>
                        <ul className="order-items-list">
                          {order.items?.map((item, index) => (
                            <li key={index} className="order-item-detail">
                              <span className="item-qty">{item.quantity}x</span>
                              <span className="item-name" style={{ color: 'var(--white)' }}>{item.name}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <span className="order-price" style={{ fontSize: '1.05rem', color: 'var(--white)', fontWeight: 700 }}>₦{(order.totalAmount || 0).toLocaleString()}</span>
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
        </div>
      )}

      {/* Full Customer Order Details Modal Popup */}
      {selectedOrder && (
        <div className="modal-overlay fade-in" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content admin-modal order-details-modal glass" style={{ maxWidth: '850px', width: '95%', padding: '24px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setSelectedOrder(null)}>✕</button>
            
            <div className="modal-header-accent" style={{ borderBottom: '1px solid rgba(212,168,67,0.15)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(212,168,67,0.1)', padding: '10px', borderRadius: '10px', color: 'var(--gold)' }}>
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--white)' }}>Order Details</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--gray-light)' }}>
                    Order Ref: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--gold)' }}>{selectedOrder.orderReference}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="status-stepper-container">
              <div className="status-stepper">
                <div className="stepper-progress-line">
                  <div 
                    className="stepper-progress-line-fill" 
                    style={{ width: `${lineProgressPercent}%` }} 
                  />
                </div>
                
                <div className={`step-node ${currentStep >= 0 ? 'completed' : ''}`}>
                  <div className="step-circle">1</div>
                  <span className="step-label">Paid</span>
                </div>
                
                <div className={`step-node ${currentStep > 1 ? 'completed' : currentStep === 1 ? 'active' : ''}`}>
                  <div className="step-circle">2</div>
                  <span className="step-label">Processing</span>
                </div>
                
                <div className={`step-node ${currentStep > 2 ? 'completed' : currentStep === 2 ? 'active' : ''}`}>
                  <div className="step-circle">3</div>
                  <span className="step-label">Shipped</span>
                </div>
                
                <div className={`step-node ${currentStep === 3 ? 'completed' : ''}`}>
                  <div className="step-circle">4</div>
                  <span className="step-label">Completed</span>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Left Column: Customer & Shipping Address */}
              <div className="details-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={15} className="text-gold" /> Delivery & Destination
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>Location:</span>
                      <strong style={{ color: 'var(--white)', fontSize: '0.88rem' }}>{selectedOrder.shippingLocation || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--gray)' }}>Detailed Address:</span>
                      <span style={{ color: 'var(--white)', fontSize: '0.88rem', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)', width: '100%', boxSizing: 'border-box', whiteSpace: 'pre-wrap' }}>
                        {selectedOrder.shippingAddress}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginTop: 0, marginBottom: '12px' }}>Customer Contact</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.95rem' }}>{selectedOrder.customerName}</div>
                    <div style={{ color: 'var(--gray-light)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} className="text-gold" /> {selectedOrder.customerEmail}
                    </div>
                    <div style={{ color: 'var(--gray-light)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={12} className="text-gold" /> {selectedOrder.customerPhone}
                    </div>
                  </div>
                </div>

                {selectedOrder.customNote && (
                  <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212,168,67,0.15)', background: 'rgba(212,168,67,0.02)' }}>
                    <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginTop: 0, marginBottom: '8px' }}>💬 Special Instructions</h4>
                    <p style={{ color: 'var(--white)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
                      "{selectedOrder.customNote}"
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Ordered items list and pricing summary */}
              <div className="details-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={15} className="text-gold" /> Scents List ({selectedOrder.items?.length || 0})
                  </h4>
                  <div className="details-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.01)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="table-thumb" style={{ width: '36px', height: '36px', flexShrink: 0 }}>
                          {item.mediaType === 'video' ? (
                            <video src={item.mediaUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : item.mediaUrl ? (
                            <img src={item.mediaUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div className="thumb-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                              <ImageIcon size={12} className="text-gray" />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          {item.selectedVariation && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, marginTop: '1px' }}>
                              Variation: {item.selectedVariation.name}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600, background: 'rgba(212,168,67,0.08)', padding: '2px 5px', borderRadius: '4px', marginRight: '6px' }}>
                            {item.quantity}x
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--white)' }}>
                            ₦{(parseFloat(item.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', marginTop: 0, marginBottom: '12px' }}>Payment & Billing</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gray-light)' }}>
                      <span>Subtotal:</span>
                      <span style={{ color: 'var(--white)' }}>₦{parseFloat(selectedOrder.subtotalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gray-light)' }}>
                      <span>Delivery Fee ({selectedOrder.shippingLocation || 'N/A'}):</span>
                      <span style={{ color: 'var(--white)' }}>₦{parseFloat(selectedOrder.shippingFee || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--gray-light)' }}>
                      <span>Tax (3%):</span>
                      <span style={{ color: 'var(--white)' }}>₦{parseFloat(selectedOrder.taxAmount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--white)' }}>Grand Total:</span>
                      <span className="text-gold">₦{parseFloat(selectedOrder.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '24px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <a 
                href={getWhatsAppInquiryLink(selectedOrder)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-gold btn-sm" 
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <MessageSquare size={14} /> Contact Support
              </a>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
