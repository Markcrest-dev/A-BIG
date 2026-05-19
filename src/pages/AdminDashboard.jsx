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
  Inbox
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

  // Restock Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [deleteRequestId, setDeleteRequestId] = useState(null);
  
  // Extract and listen to URL tab query parameters
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab') || 'products';
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam === 'products' || tabParam === 'orders' || tabParam === 'requests') {
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
                      <tr key={o.id}>
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
                          <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteOrderId(o.id)}>Delete</button>
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
    </div>
  );
}
