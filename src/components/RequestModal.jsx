import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ShoppingBag, CheckCircle, Mail, Phone, User, Hash, MessageSquare } from 'lucide-react';
import './RequestModal.css';

export default function RequestModal({ product, onClose, initialQuantity = 1 }) {
  const { currentUser } = useAuth();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    quantity: String(initialQuantity),
    notes: ''
  });

  // Prefill details from profile in localStorage or Auth context
  useEffect(() => {
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
      let savedName = '';
      let savedPhone = '';
      
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          savedName = parsed.displayName || '';
          savedPhone = parsed.phoneNumber || '';
        } catch (e) {
          console.error('Failed to parse profile in RequestModal', e);
        }
      }
      
      if (!savedName) {
        const parts = currentUser.email.split('@')[0];
        savedName = parts.charAt(0).toUpperCase() + parts.slice(1);
      }

      setForm(prev => ({
        ...prev,
        fullName: savedName,
        email: currentUser.email || '',
        phone: savedPhone
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.fullName || !form.email || !form.phone || !form.quantity) {
      setError('All contact details and quantity are required.');
      return;
    }

    const qtyVal = parseInt(form.quantity, 10);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError('Please request a valid positive quantity.');
      return;
    }

    setLoading(true);

    try {
      // 1. Log request to Firestore
      const requestData = {
        productId: product?.id || 'unknown',
        productName: product?.name || 'Unknown Product',
        productCategory: product?.category || 'General',
        userId: currentUser?.uid || 'guest',
        userEmail: form.email,
        userName: form.fullName,
        userPhone: form.phone,
        requestedQuantity: qtyVal,
        notes: form.notes,
        status: 'Pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'product_requests'), requestData);

      // 2. Log admin notification in Firestore (wrapped in try-catch to bypass security rule failures for guest/customer writes to notifications)
      try {
        const notificationData = {
          userId: 'admin',
          title: 'New Scent Request',
          message: `Customer ${form.fullName} requested ${qtyVal} units of "${product?.name}".`,
          type: 'restock_request',
          read: false,
          createdAt: serverTimestamp(),
          metadata: {
            productId: product?.id || '',
            productName: product?.name || '',
            customerName: form.fullName,
            requestedQuantity: qtyVal
          }
        };

        await addDoc(collection(db, 'notifications'), notificationData);
      } catch (notifErr) {
        console.warn('Failed to log admin notification for restock request:', notifErr);
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error submitting restock request:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content request-modal-content glass fade-in" onClick={e => e.stopPropagation()}>
        <button className="wa-close" onClick={onClose}>✕</button>
        
        {!success ? (
          <>
            <div className="request-modal-header">
              <ShoppingBag className="text-gold" size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3>Request Scent / Item</h3>
              <p className="request-subtitle">
                Is <strong>{product?.name}</strong> out of stock or you need more than we have? Tell us, and we'll secure it for you!
              </p>
            </div>

            {error && <div className="form-error request-error">{error}</div>}

            <form onSubmit={handleSubmit} className="request-form">
              <div className="input-group">
                <label><User size={12} style={{ marginRight: '4px' }} /> Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group">
                <label><Mail size={12} style={{ marginRight: '4px' }} /> Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="input-field"
                  required
                />
              </div>

              <div className="input-row">
                <div className="input-group" style={{ flex: 2 }}>
                  <label><Phone size={12} style={{ marginRight: '4px' }} /> Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g. 0803 123 4567"
                    className="input-field"
                    required
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label><Hash size={12} style={{ marginRight: '4px' }} /> Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    min="1"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label><MessageSquare size={12} style={{ marginRight: '4px' }} /> Special Instructions (Optional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Any preferences or comments? (e.g. 'Needed by Friday')"
                  className="input-field"
                  style={{ minHeight: '70px', resize: 'none' }}
                />
              </div>

              <button type="submit" className="btn btn-gold btn-lg request-submit-btn" disabled={loading}>
                {loading ? 'Submitting Request...' : 'Submit Request'}
              </button>
            </form>
          </>
        ) : (
          <div className="request-success-state text-center fade-in">
            <CheckCircle className="text-gold success-pulse" size={64} style={{ margin: '20px auto' }} />
            <h3 className="text-gold">Request Received!</h3>
            <p>
              Your request for <strong>{form.quantity}x {product?.name}</strong> has been logged. Our luxury scent coordinators will verify our inventory and reach out to you shortly via phone or email.
            </p>
            <button className="btn btn-outline" style={{ marginTop: '24px', width: '100%' }} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
