import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import AdminProductForm from '../components/AdminProductForm';
import { useAuth } from '../context/AuthContext';
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
  const { logout } = useAuth();

  // Real-time listener
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-count">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="admin-actions">
          <button className="btn btn-gold" onClick={() => { setShowForm(true); setEditProduct(null); }}>
            + Add Product
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showForm || editProduct) && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditProduct(null); }}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <span className="delete-icon">⚠️</span>
            <h3>Delete Product?</h3>
            <p>This action cannot be undone.</p>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Table */}
      {error && (
        <div className="form-error" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60, marginBottom: 8 }} /><div className="skeleton" style={{ height: 60 }} /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h3>No Products</h3>
          <p>Click "Add Product" to get started.</p>
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
              {products.map(p => {
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
                          <div className="thumb-placeholder">📷</div>
                        )}
                      </div>
                    </td>
                    <td><span className="table-name">{p.name}</span></td>
                    <td><span className="table-price">₦{p.price}</span></td>
                    <td><span className="table-category">{p.category}</span></td>
                    <td>
                      <span className={`table-stock ${isOutOfStock ? 'out-of-stock' : ''}`}>
                        {isOutOfStock ? 'Out of Stock' : `${p.stock} in stock`}
                      </span>
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
    </div>
  );
}
