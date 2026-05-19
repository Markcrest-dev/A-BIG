import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import AdminProductForm from '../components/AdminProductForm';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  ClipboardList, 
  Mail, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  Image as ImageIcon,
  X,
  Search,
  Inbox,
  Truck,
  ShieldCheck,
  User
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Search States
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Restock Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [deleteRequestId, setDeleteRequestId] = useState(null);

  // Shipping Fees State
  const [shippingFees, setShippingFees] = useState([]);
  const [loadingShipping, setLoadingShipping] = useState(true);
  
  // Shipping Fees addition/modification states
  const [newLocation, setNewLocation] = useState('');
  const [newFee, setNewFee] = useState('');
  const [addingShipping, setAddingShipping] = useState(false);
  const [editShipping, setEditShipping] = useState(null);
  const [editShippingFee, setEditShippingFee] = useState('');
  const [deleteShippingId, setDeleteShippingId] = useState(null);
  
  // Extract and listen to URL tab query parameters
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab') || 'products';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam === 'products' || tabParam === 'orders' || tabParam === 'requests' || tabParam === 'shipping') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Real-time listener for products
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // In-memory sorting by createdAt desc
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      setProducts(items);
      setLoading(false);
      setError('');
    }, (err) => {
      console.error('Firestore real-time listener error:', err);
      let userFriendlyError = 'Failed to load products. Please try again later.';
      if (err.message?.includes('NOT_FOUND') || err.code === 'not-found') {
        userFriendlyError = 'Firestore database not found. ⚠️ Please go to the Firebase Console, select your project ("abig-glow-scents"), navigate to "Firestore Database" in the sidebar, and click "Create Database".';
      } else if (err.message?.includes('permission') || err.code === 'permission-denied') {
        userFriendlyError = 'Permission denied. ⚠️ Please check your Firestore Security Rules in the Firebase Console (Firestore Database > Rules) and ensure read access is allowed.';
      }
      setError(userFriendlyError);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Real-time listener for orders
  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // In-memory sorting by createdAt desc
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      setOrders(items);
      setLoadingOrders(false);
    }, (err) => {
      console.error('Firestore orders real-time listener error:', err);
      setLoadingOrders(false);
    });
    return () => unsub();
  }, []);

  // Real-time listener for product restock requests
  useEffect(() => {
    const q = query(collection(db, 'product_requests'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // In-memory sorting by createdAt desc
      items.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      setRequests(items);
      setLoadingRequests(false);
    }, (err) => {
      console.error('Firestore restock requests listener error:', err);
      setLoadingRequests(false);
    });
    return () => unsub();
  }, []);

  // Real-time listener for shipping fees
  useEffect(() => {
    const q = query(collection(db, 'shipping_fees'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.location.localeCompare(b.location));
      setShippingFees(items);
      setLoadingShipping(false);
    }, (err) => {
      console.error('Firestore shipping fees listener error:', err);
      setLoadingShipping(false);
    });
    return () => unsub();
  }, []);

  const handleAddShipping = async (e) => {
    e.preventDefault();
    if (!newLocation.trim() || !newFee) return;
    setAddingShipping(true);
    try {
      await addDoc(collection(db, 'shipping_fees'), {
        location: newLocation.trim(),
        fee: parseFloat(newFee),
        createdAt: serverTimestamp()
      });
      setNewLocation('');
      setNewFee('');
    } catch (err) {
      console.error('Error adding shipping fee:', err);
      alert('Failed to add shipping fee: ' + err.message);
    } finally {
      setAddingShipping(false);
    }
  };

  const handleUpdateShipping = async (e) => {
    e.preventDefault();
    if (!editShipping || !editShippingFee) return;
    try {
      await updateDoc(doc(db, 'shipping_fees', editShipping.id), {
        fee: parseFloat(editShippingFee)
      });
      setEditShipping(null);
      setEditShippingFee('');
    } catch (err) {
      console.error('Error updating shipping fee:', err);
      alert('Failed to update shipping fee: ' + err.message);
    }
  };

  const handleDeleteShipping = async (id) => {
    try {
      await deleteDoc(doc(db, 'shipping_fees', id));
      setDeleteShippingId(null);
    } catch (err) {
      console.error('Error deleting shipping fee:', err);
      alert('Failed to delete shipping fee: ' + err.message);
    }
  };

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    if (!editProduct) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'products', editProduct.id), data);
      setEditProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteOrder = async (id) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      setDeleteOrderId(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await updateDoc(doc(db, 'product_requests', requestId), {
        status: newStatus
      });
    } catch (err) {
      console.error('Error updating request status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await deleteDoc(doc(db, 'product_requests', id));
      setDeleteRequestId(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request: ' + (error.message || 'Unknown error'));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Dynamic Keyword Search Filters
  const filteredProducts = products.filter(p => {
    return productSearchQuery === '' ||
      p.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(productSearchQuery.toLowerCase());
  });

  const filteredOrders = orders.filter(o => {
    return orderSearchQuery === '' ||
      o.orderReference?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerPhone?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.items?.some(item => item.name?.toLowerCase().includes(orderSearchQuery.toLowerCase()));
  });

  const filteredRequests = requests.filter(r => {
    return requestSearchQuery === '' ||
      r.productName?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
      r.userName?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
      r.userEmail?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
      r.userPhone?.toLowerCase().includes(requestSearchQuery.toLowerCase()) ||
      r.notes?.toLowerCase().includes(requestSearchQuery.toLowerCase());
  });

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          {activeTab === 'products' && (
            <p className="admin-count">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
          )}
          {activeTab === 'orders' && (
            <p className="admin-count">{filteredOrders.length} online order{filteredOrders.length !== 1 ? 's' : ''}</p>
          )}
          {activeTab === 'requests' && (
            <p className="admin-count">{filteredRequests.length} restock request{filteredRequests.length !== 1 ? 's' : ''}</p>
          )}
          {activeTab === 'shipping' && (
            <p className="admin-count">{shippingFees.length} shipping location{shippingFees.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="admin-actions">
          {activeTab === 'products' && (
            <button className="btn btn-gold" onClick={() => { setShowForm(true); setEditProduct(null); }}>
              + Add Product
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '32px', borderBottom: '1px solid rgba(212,168,67,0.1)', paddingBottom: '12px' }}>
        <button 
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard?tab=products')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'products' ? 'var(--gold)' : 'var(--gray)',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: activeTab === 'products' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            paddingBottom: '8px',
            transition: 'var(--transition)'
          }}
        >
          Product Catalog ({products.length})
          {activeTab === 'products' && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }} />}
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard?tab=orders')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'orders' ? 'var(--gold)' : 'var(--gray)',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: activeTab === 'orders' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            paddingBottom: '8px',
            transition: 'var(--transition)'
          }}
        >
          Customer Orders ({orders.length})
          {activeTab === 'orders' && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }} />}
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard?tab=requests')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'requests' ? 'var(--gold)' : 'var(--gray)',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: activeTab === 'requests' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            paddingBottom: '8px',
            transition: 'var(--transition)'
          }}
        >
          Restock Requests ({requests.length})
          {activeTab === 'requests' && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }} />}
        </button>
        <button 
          className={`admin-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard?tab=shipping')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'shipping' ? 'var(--gold)' : 'var(--gray)',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: activeTab === 'shipping' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative',
            paddingBottom: '8px',
            transition: 'var(--transition)'
          }}
        >
          Shipping Fees ({shippingFees.length})
          {activeTab === 'shipping' && <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'var(--gold)' }} />}
        </button>
      </div>

      {/* Add / Edit Product Modal */}
      {(showForm || editProduct) && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditProduct(null); }}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => { setShowForm(false); setEditProduct(null); }}>✕</button>
            <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <AdminProductForm
              initial={editProduct}
              onSubmit={editProduct ? handleEdit : handleAdd}
              onCancel={() => { setShowForm(false); setEditProduct(null); }}
              loading={saving}
            />
          </div>
        </div>
      )}

      {/* Delete Product Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setDeleteId(null)}>✕</button>
            <AlertTriangle size={36} className="text-gold" style={{ display: 'block', margin: '0 auto 12px' }} />
            <h3>Delete Product?</h3>
            <p>This action cannot be undone.</p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Order Details Modal */}
      {selectedOrderDetails && (
        <div className="modal-overlay" onClick={() => setSelectedOrderDetails(null)}>
          <div className="modal-content admin-modal order-details-modal glass fade-in" style={{ maxWidth: '850px', width: '95%', padding: '24px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setSelectedOrderDetails(null)}>✕</button>
            
            <div className="modal-header-accent" style={{ borderBottom: '1px solid rgba(212,168,67,0.15)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(212,168,67,0.1)', padding: '10px', borderRadius: '10px', color: 'var(--gold)' }}>
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--white)' }}>Order Details</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--gray-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Reference: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--gold)' }}>{selectedOrderDetails.orderReference}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Left Column: Customer & Shipping Details */}
              <div className="details-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '1rem', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} className="text-gold" /> Customer Information
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '1.05rem' }}>{selectedOrderDetails.customerName}</div>
                    
                    <a href={`mailto:${selectedOrderDetails.customerEmail}`} style={{ textDecoration: 'none', color: 'var(--gray-light)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'var(--transition)' }} className="hover-gold">
                      <Mail size={14} className="text-gold" /> {selectedOrderDetails.customerEmail}
                    </a>
                    
                    <a href={`tel:${selectedOrderDetails.customerPhone}`} style={{ textDecoration: 'none', color: 'var(--gray-light)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'var(--transition)' }} className="hover-gold">
                      <Phone size={14} className="text-gold" /> {selectedOrderDetails.customerPhone}
                    </a>
                  </div>
                </div>

                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '1rem', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} className="text-gold" /> Shipping & Location Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Location:</span>
                      <strong style={{ color: 'var(--white)', fontSize: '0.9rem' }}>{selectedOrderDetails.shippingLocation || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Detailed Address:</span>
                      <span style={{ color: 'var(--white)', fontSize: '0.9rem', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)', width: '100%', boxSizing: 'border-box', whiteSpace: 'pre-wrap' }}>
                        {selectedOrderDetails.shippingAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrderDetails.customNote && (
                  <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212,168,67,0.15)', background: 'rgba(212,168,67,0.02)' }}>
                    <h4 style={{ color: 'var(--gold)', fontSize: '1rem', marginTop: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💬 Customer Instructions
                    </h4>
                    <p style={{ color: 'var(--white)', fontSize: '0.88rem', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
                      "{selectedOrderDetails.customNote}"
                    </p>
                  </div>
                )}

                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '1rem', marginTop: 0, marginBottom: '12px' }}>Order Logistics</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--gray-light)' }}>Order Status:</span>
                    <select 
                      value={selectedOrderDetails.status || 'Paid'}
                      onChange={(e) => {
                        handleUpdateOrderStatus(selectedOrderDetails.id, e.target.value);
                        setSelectedOrderDetails(prev => ({ ...prev, status: e.target.value }));
                      }}
                      className="status-selector"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: '1px solid rgba(212,168,67,0.15)',
                        background: selectedOrderDetails.status === 'Completed' || selectedOrderDetails.status === 'Delivered' 
                          ? 'rgba(46, 204, 113, 0.12)' 
                          : selectedOrderDetails.status === 'Shipped' 
                            ? 'rgba(9, 165, 219, 0.12)' 
                            : 'rgba(212, 168, 67, 0.12)',
                        color: selectedOrderDetails.status === 'Completed' || selectedOrderDetails.status === 'Delivered' 
                          ? '#2ECC71' 
                          : selectedOrderDetails.status === 'Shipped' 
                            ? '#09a5db' 
                            : 'var(--gold)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Items & Pricing Breakdown */}
              <div className="details-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '1rem', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} className="text-gold" /> Ordered Items ({selectedOrderDetails.items?.length || 0})
                  </h4>
                  <div className="details-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedOrderDetails.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="table-thumb" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                          {item.mediaType === 'video' ? (
                            <video src={item.mediaUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : item.mediaUrl ? (
                            <img src={item.mediaUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div className="thumb-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                              <ImageIcon size={14} className="text-gray" />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          {item.selectedVariation && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600, marginTop: '2px' }}>
                              Style: {item.selectedVariation.name}
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-light)', marginTop: '2px' }}>
                            ₦{parseFloat(item.price).toLocaleString()} each
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600, background: 'rgba(212,168,67,0.08)', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>
                            {item.quantity}x
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--white)' }}>
                            ₦{(parseFloat(item.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="details-section-card glass" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: 'var(--gold)', fontSize: '1rem', marginTop: 0, marginBottom: '12px' }}>Payment & Billing</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-light)' }}>
                      <span>Subtotal:</span>
                      <span style={{ color: 'var(--white)', fontWeight: 500 }}>₦{parseFloat(selectedOrderDetails.subtotalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-light)' }}>
                      <span>Shipping Fee ({selectedOrderDetails.shippingLocation || 'N/A'}):</span>
                      <span style={{ color: 'var(--white)', fontWeight: 500 }}>₦{parseFloat(selectedOrderDetails.shippingFee || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--gray-light)' }}>
                      <span>Tax (3%):</span>
                      <span style={{ color: 'var(--white)', fontWeight: 500 }}>₦{parseFloat(selectedOrderDetails.taxAmount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--white)' }}>Grand Total:</span>
                      <span className="text-gold">₦{parseFloat(selectedOrderDetails.totalAmount || 0).toLocaleString()}</span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '10px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-light)' }}>
                        Payment Method: <strong style={{ color: '#2ECC71' }}>Paid Online (Paystack)</strong>
                      </div>
                      {selectedOrderDetails.paymentReference && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontFamily: 'monospace' }}>
                          Ref: {selectedOrderDetails.paymentReference}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '24px', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setSelectedOrderDetails(null)}>Close</button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  setDeleteOrderId(selectedOrderDetails.id);
                  setSelectedOrderDetails(null);
                }}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation */}
      {deleteOrderId && (
        <div className="modal-overlay" onClick={() => setDeleteOrderId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setDeleteOrderId(null)}>✕</button>
            <AlertTriangle size={36} className="text-gold" style={{ display: 'block', margin: '0 auto 12px' }} />
            <h3>Delete Order Record?</h3>
            <p>This action will permanently delete this order history from the database.</p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setDeleteOrderId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteOrder(deleteOrderId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Confirmation */}
      {deleteRequestId && (
        <div className="modal-overlay" onClick={() => setDeleteRequestId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setDeleteRequestId(null)}>✕</button>
            <AlertTriangle size={36} className="text-gold" style={{ display: 'block', margin: '0 auto 12px' }} />
            <h3>Delete Request?</h3>
            <p>This will permanently remove this restock request.</p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setDeleteRequestId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteRequest(deleteRequestId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Shipping Location Confirmation */}
      {deleteShippingId && (
        <div className="modal-overlay" onClick={() => setDeleteShippingId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setDeleteShippingId(null)}>✕</button>
            <AlertTriangle size={36} className="text-gold" style={{ display: 'block', margin: '0 auto 12px' }} />
            <h3>Delete Shipping Location?</h3>
            <p>This will remove this location from customer checkout options.</p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setDeleteShippingId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteShipping(deleteShippingId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shipping Fee Modal */}
      {editShipping && (
        <div className="modal-overlay" onClick={() => setEditShipping(null)}>
          <div className="modal-content admin-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setEditShipping(null)}>✕</button>
            <h3>Edit Shipping Fee</h3>
            <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Update the shipping fee for <strong>{editShipping.location}</strong>.
            </p>
            <form onSubmit={handleUpdateShipping} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label>Shipping Fee (₦)</label>
                <input
                  type="number"
                  className="input-field"
                  value={editShippingFee}
                  onChange={e => setEditShippingFee(e.target.value)}
                  placeholder="e.g. 2500"
                  required
                  min="0"
                />
              </div>
              <div className="form-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditShipping(null)}>Cancel</button>
                <button type="submit" className="btn btn-gold">Update Fee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="form-error" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Product Catalog Tab Rendering */}
      {activeTab === 'products' && (
        <>
          {/* Catalog Search Bar */}
          <div className="admin-search-wrap" style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <div className="shop-search-inner glass" style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
              <Search className="search-icon text-gold" size={16} />
              <input 
                type="text" 
                placeholder="Search catalog by name, category..." 
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="shop-search-input"
                style={{ padding: '6px 0', fontSize: '0.9rem' }}
              />
              {productSearchQuery && (
                <button onClick={() => setProductSearchQuery('')} className="search-clear-btn" style={{ fontSize: '0.85rem' }}>✕</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading"><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60 }} /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Package size={48} className="text-gold" style={{ display: 'block', margin: '0 auto 16px' }} />
              <h3>{products.length === 0 ? 'No Products' : 'No Results Match'}</h3>
              <p>{products.length === 0 ? 'Click "Add Product" to get started.' : 'Try adjusting your search criteria.'}</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Media</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const isOutOfStock = p.stock === undefined || p.stock <= 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="table-thumb">
                            {p.mediaType === 'video' ? (
                              <video src={p.mediaUrl} muted />
                            ) : p.mediaUrl ? (
                              <img src={p.mediaUrl} alt={p.name} />
                            ) : (
                              <div className="thumb-placeholder">
                                <ImageIcon size={18} className="text-gray" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td><span className="table-name">{p.name}</span></td>
                        <td><span className="table-price">₦{p.price.toLocaleString()}</span></td>
                        <td><span className="table-category">{p.category}</span></td>
                        <td>
                          <span className={`table-stock ${isOutOfStock ? 'out-of-stock' : ''}`}>
                            {isOutOfStock ? 'Out of Stock' : `${p.stock} in stock`}
                          </span>
                          {p.variations && p.variations.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-light)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {p.variations.map((v, i) => (
                                <span key={i} style={{ background: 'rgba(212,168,67,0.05)', padding: '2px 6px', borderRadius: '3px', width: 'fit-content' }}>
                                  {v.name}: <strong style={{ color: 'var(--gold)' }}>{v.stock}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-outline btn-sm" onClick={() => setEditProduct(p)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Orders Tab Rendering */}
      {activeTab === 'orders' && (
        <>
          {/* Orders Search Bar */}
          <div className="admin-search-wrap" style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <div className="shop-search-inner glass" style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
              <Search className="search-icon text-gold" size={16} />
              <input 
                type="text" 
                placeholder="Search orders by ref, name, item..." 
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="shop-search-input"
                style={{ padding: '6px 0', fontSize: '0.9rem' }}
              />
              {orderSearchQuery && (
                <button onClick={() => setOrderSearchQuery('')} className="search-clear-btn" style={{ fontSize: '0.85rem' }}>✕</button>
              )}
            </div>
          </div>

          {loadingOrders ? (
            <div className="admin-loading"><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60 }} /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <ClipboardList size={48} className="text-gold" style={{ display: 'block', margin: '0 auto 16px' }} />
              <h3>{orders.length === 0 ? 'No Orders Recorded' : 'No Orders Match'}</h3>
              <p style={{ color: 'var(--gray-light)' }}>
                {orders.length === 0 ? 'Orders paid via Paystack will automatically appear here in real-time.' : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Customer Information</th>
                    <th>Ordered Scents/Items</th>
                    <th>Grand Total</th>
                    <th>Order Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => {
                    const dateStr = o.createdAt?.toDate 
                      ? o.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                      : (o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Processing');
                    return (
                      <tr 
                        key={o.id} 
                        style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                        className="admin-order-row"
                        onClick={(e) => {
                          if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
                          setSelectedOrderDetails(o);
                        }}
                      >
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>{dateStr}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '4px', fontFamily: 'monospace', fontWeight: 600 }}>{o.orderReference}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: '4px' }}>Paystack Ref: <br/><span style={{ fontFamily: 'monospace' }}>{o.paymentReference?.substring(0, 14)}...</span></div>
                        </td>
                        <td style={{ verticalAlign: 'top', maxWidth: '250px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '6px' }}>{o.customerName}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray-light)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} className="text-gold" /> {o.customerEmail}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray-light)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={12} className="text-gold" /> {o.customerPhone}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            <MapPin size={12} className="text-gold" style={{ flexShrink: 0, marginTop: '2px' }} /> {o.shippingAddress}
                          </div>
                          {o.customNote && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontStyle: 'italic', marginTop: '6px', background: 'rgba(212,168,67,0.05)', padding: '6px 10px', borderRadius: '4px', borderLeft: '2.5px solid var(--gold)' }}>
                              "{o.customNote}"
                            </div>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                            {o.items?.map((item, idx) => (
                              <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--gray-light)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--gold)', fontWeight: 600, background: 'rgba(212,168,67,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{item.quantity}x</span> 
                                <span>{item.name}</span>
                                <span style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>(₦{parseFloat(item.price).toLocaleString()})</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className="table-price" style={{ fontSize: '1.1rem' }}>₦{parseFloat(o.totalAmount || 0).toLocaleString()}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-light)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {o.subtotalAmount !== undefined && (
                              <span>Subtotal: ₦{parseFloat(o.subtotalAmount).toLocaleString()}</span>
                            )}
                            {o.shippingFee !== undefined && (
                              <span>Shipping: ₦{parseFloat(o.shippingFee).toLocaleString()} ({o.shippingLocation || 'N/A'})</span>
                            )}
                            {o.taxAmount !== undefined && (
                              <span>Tax (3%): ₦{parseFloat(o.taxAmount).toLocaleString()}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Paid Online
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <select 
                            value={o.status || 'Paid'}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="status-selector"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              border: '1px solid rgba(212,168,67,0.15)',
                              background: o.status === 'Completed' || o.status === 'Delivered' 
                                ? 'rgba(46, 204, 113, 0.12)' 
                                : o.status === 'Shipped' 
                                  ? 'rgba(9, 165, 219, 0.12)' 
                                  : 'rgba(212, 168, 67, 0.12)',
                              color: o.status === 'Completed' || o.status === 'Delivered' 
                                ? '#2ECC71' 
                                : o.status === 'Shipped' 
                                  ? '#09a5db' 
                                  : 'var(--gold)',
                              outline: 'none',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                              transition: 'var(--transition)'
                            }}
                          >
                            <option value="Paid">Paid</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button className="btn btn-gold btn-sm" onClick={() => setSelectedOrderDetails(o)}>View</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteOrderId(o.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Restock Requests Tab Rendering */}
      {activeTab === 'requests' && (
        <>
          {/* Requests Search Bar */}
          <div className="admin-search-wrap" style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <div className="shop-search-inner glass" style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
              <Search className="search-icon text-gold" size={16} />
              <input 
                type="text" 
                placeholder="Search requests by name, scent..." 
                value={requestSearchQuery}
                onChange={(e) => setRequestSearchQuery(e.target.value)}
                className="shop-search-input"
                style={{ padding: '6px 0', fontSize: '0.9rem' }}
              />
              {requestSearchQuery && (
                <button onClick={() => setRequestSearchQuery('')} className="search-clear-btn" style={{ fontSize: '0.85rem' }}>✕</button>
              )}
            </div>
          </div>

          {loadingRequests ? (
            <div className="admin-loading"><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60 }} /></div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Inbox size={48} className="text-gold" style={{ display: 'block', margin: '0 auto 16px' }} />
              <h3>{requests.length === 0 ? 'No Requests' : 'No Requests Match'}</h3>
              <p style={{ color: 'var(--gray-light)' }}>
                {requests.length === 0 ? 'Restock requests submitted by customers will appear here in real-time.' : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date Received</th>
                    <th>Product Requested</th>
                    <th>Customer Contact</th>
                    <th>Requested Qty</th>
                    <th>Notes / Info</th>
                    <th>Request Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(r => {
                    const dateStr = r.createdAt?.toDate 
                      ? r.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                      : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Processing');
                    return (
                      <tr key={r.id}>
                        <td style={{ verticalAlign: 'top' }}>
                          <span style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>{dateStr}</span>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <span className="table-name" style={{ fontWeight: 600 }}>{r.productName}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '4px' }}>Category: {r.productCategory}</div>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>{r.userName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} className="text-gold" /> {r.userEmail}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-light)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <Phone size={12} className="text-gold" /> {r.userPhone}
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', background: 'rgba(212,168,67,0.08)', padding: '4px 12px', borderRadius: '6px' }}>
                            {r.requestedQuantity}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'top', maxWidth: '200px' }}>
                          {r.notes ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--white)', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px', borderLeft: '3px solid var(--gold)' }}>
                              "{r.notes}"
                            </div>
                          ) : (
                            <span style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>None</span>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <select 
                            value={r.status || 'Pending'}
                            onChange={(e) => handleUpdateRequestStatus(r.id, e.target.value)}
                            className="status-selector"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              border: '1px solid rgba(212,168,67,0.15)',
                              background: r.status === 'Fulfilled' 
                                ? 'rgba(46, 204, 113, 0.12)' 
                                : r.status === 'Approved' 
                                  ? 'rgba(9, 165, 219, 0.12)' 
                                  : 'rgba(243, 156, 18, 0.12)',
                              color: r.status === 'Fulfilled' 
                                ? '#2ECC71' 
                                : r.status === 'Approved' 
                                  ? '#09a5db' 
                                  : '#f39c12',
                              outline: 'none',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                              transition: 'var(--transition)'
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Fulfilled">Fulfilled</option>
                          </select>
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteRequestId(r.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Shipping Fees Tab Rendering */}
      {activeTab === 'shipping' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {/* Add New Location Card */}
            <div className="card glass" style={{ padding: '24px', borderRadius: 'var(--radius)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} /> Add Delivery Location
              </h3>
              <form onSubmit={handleAddShipping} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>State / Region Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="e.g. Lagos, Abuja, Rivers"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Shipping Fee (₦)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newFee}
                    onChange={e => setNewFee(e.target.value)}
                    placeholder="e.g. 2000"
                    required
                    min="0"
                  />
                </div>
                <button type="submit" disabled={addingShipping} className="btn btn-gold" style={{ marginTop: '8px', width: '100%' }}>
                  {addingShipping ? 'Adding Location...' : 'Add Shipping Fee'}
                </button>
              </form>
            </div>

            {/* Quick Stats / Info Card */}
            <div className="card glass" style={{ padding: '24px', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '12px' }}>Nationwide Delivery</h3>
              <p style={{ color: 'var(--gray-light)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Define flat shipping rates based on delivery locations. During checkout, customers will select their delivery location from a dropdown, and the matching shipping fee will be added to their order.
              </p>
              <div className="divider" style={{ margin: '16px 0', borderColor: 'rgba(212,168,67,0.1)' }} />
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>
                💡 <strong>Tip:</strong> Create an "Other States" or default option if you want to charge a fallback rate for locations not listed.
              </p>
            </div>
          </div>

          {loadingShipping ? (
            <div className="admin-loading">
              <div className="skeleton" style={{ height: 60, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 60, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ) : shippingFees.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <MapPin size={48} className="text-gold" style={{ display: 'block', margin: '0 auto 16px' }} />
              <h3>No Shipping Fees Set</h3>
              <p>Add a shipping location and fee above to get started with nationwide delivery calculations.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Delivery Location</th>
                    <th>Shipping Fee</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shippingFees.map(f => (
                    <tr key={f.id}>
                      <td>
                        <span className="table-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} className="text-gold" /> {f.location}
                        </span>
                      </td>
                      <td>
                        <span className="table-price">₦{f.fee.toLocaleString()}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setEditShipping(f);
                              setEditShippingFee(String(f.fee));
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteShippingId(f.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
