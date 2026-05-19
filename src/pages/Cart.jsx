import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import RequestModal from '../components/RequestModal';
import { 
  ShoppingCart, 
  Lock, 
  Trophy, 
  Trash2, 
  Image as ImageIcon, 
  MessageSquare, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import './Cart.css';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [requestProduct, setRequestProduct] = useState(null);
  
  // Paystack & Checkout State
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderRef, setSuccessOrderRef] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    notes: ''
  });

  const numbers = [
    { display: '0704 027 3131', code: '2347040273131' },
    { display: '0816 449 1568', code: '2348164491568' },
  ];

  // Dynamically load Paystack Inline JS script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch delivery profile details if saved in localStorage
  useEffect(() => {
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setDeliveryInfo(prev => ({
            ...prev,
            fullName: parsed.displayName || '',
            phone: parsed.phoneNumber || '',
            address: parsed.address || '',
          }));
        } catch (e) {
          console.error('Failed to parse user profile', e);
        }
      }
    }
  }, [currentUser]);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    setShowCheckoutModal(true);
  };

  const handlePaystackClick = () => {
    if (cartItems.length === 0) return;
    setShowPaystackModal(true);
  };

  const handlePaystackPayment = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    
    if (!window.PaystackPop) {
      setCheckoutError('Paystack payment gateway is loading. Please wait a few seconds and try again. ⚠️');
      return;
    }

    if (!deliveryInfo.fullName || !deliveryInfo.phone || !deliveryInfo.address) {
      setCheckoutError('Please fill out all required fields.');
      return;
    }
    
    setPaymentProcessing(true);
    
    const paystackKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d397ea3c75c8d20df1115c5c00e1cfbb8242cd28').trim();
    const orderRef = `ABIG-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    try {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: currentUser?.email || 'guest@abig.com',
        amount: cartTotal * 100, // Amount in kobo
        currency: 'NGN',
        ref: orderRef,
        onClose: function() {
          setPaymentProcessing(false);
        },
        callback: function(response) {
          // Execute async database and stock logic within a separate, standard function
          const recordSuccess = async () => {
            try {
              // 1. Create order record in Firestore
              const orderData = {
                orderReference: orderRef,
                paymentReference: response.reference,
                userId: currentUser?.uid || 'guest',
                customerEmail: currentUser?.email || 'guest@abig.com',
                customerName: deliveryInfo.fullName,
                customerPhone: deliveryInfo.phone,
                shippingAddress: deliveryInfo.address,
                customNote: deliveryInfo.notes,
                items: cartItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  category: item.category || '',
                  mediaUrl: item.mediaUrl || '',
                  mediaType: item.mediaType || '',
                  selectedVariation: item.selectedVariation ? {
                    id: item.selectedVariation.id,
                    name: item.selectedVariation.name
                  } : null
                })),
                totalAmount: cartTotal,
                paymentMethod: 'Paystack',
                status: 'Paid',
                createdAt: serverTimestamp()
              };
              
              await addDoc(collection(db, 'orders'), orderData);
              
              // 2. Decrement stock in Firestore for all purchased items
              for (const item of cartItems) {
                try {
                  const productRef = doc(db, 'products', item.id);
                  if (item.selectedVariation) {
                    const productSnap = await getDoc(productRef);
                    if (productSnap.exists()) {
                      const productData = productSnap.data();
                      const currentVariations = productData.variations || [];
                      
                      const updatedVariations = currentVariations.map(v => {
                        if (v.name === item.selectedVariation.name) {
                          return { ...v, stock: Math.max(0, (v.stock || 0) - item.quantity) };
                        }
                        return v;
                      });

                      await updateDoc(productRef, {
                        variations: updatedVariations,
                        stock: increment(-item.quantity)
                      });
                    }
                  } else {
                    await updateDoc(productRef, {
                      stock: increment(-item.quantity)
                    });
                  }
                } catch (stockErr) {
                  console.error(`Failed to update stock for item ${item.id}:`, stockErr);
                }
              }
              
              // 3. Log Notifications in Firestore
              // 3a. Admin Notification
              try {
                const adminNotif = {
                  userId: 'admin',
                  title: 'New Payment Received',
                  message: `Customer ${deliveryInfo.fullName} paid ₦${cartTotal.toLocaleString()} for order ${orderRef}.`,
                  type: 'order_payment',
                  read: false,
                  createdAt: serverTimestamp(),
                  metadata: {
                    orderRef: orderRef,
                    customerName: deliveryInfo.fullName,
                    totalAmount: cartTotal
                  }
                };
                await addDoc(collection(db, 'notifications'), adminNotif);
              } catch (notifErr) {
                console.error('Failed to log admin notification:', notifErr);
              }

              // 3b. Customer Notification
              if (currentUser) {
                try {
                  const customerNotif = {
                    userId: currentUser.uid,
                    title: 'Order Placed Successfully',
                    message: `Thank you for your order! Reference: ${orderRef}. We are preparing your scents.`,
                    type: 'order_created',
                    read: false,
                    createdAt: serverTimestamp(),
                    metadata: {
                      orderRef: orderRef,
                      totalAmount: cartTotal
                    }
                  };
                  await addDoc(collection(db, 'notifications'), customerNotif);
                } catch (notifErr) {
                  console.error('Failed to log customer notification:', notifErr);
                }
              }

              // 4. Clear Cart & Close Modal
              clearCart();
              setShowPaystackModal(false);
              setSuccessOrderRef(orderRef);
              setShowSuccessModal(true);
            } catch (dbErr) {
              console.error('Error logging order to Firestore:', dbErr);
              setCheckoutError('Payment was successful, but we failed to record your order in our database. Reference: ' + response.reference);
            } finally {
              setPaymentProcessing(false);
            }
          };
          
          recordSuccess();
        }
      });
      
      handler.openIframe();
    } catch (err) {
      console.error('Paystack initialization failed:', err);
      setCheckoutError('Could not initialize payment window: ' + (err.message || 'Please check your internet connection or key and try again.'));
      setPaymentProcessing(false);
    }
  };

  const getWhatsAppLink = (phoneCode) => {
    const header = `✦ *NEW ORDER - A-BIG GLOW & SCENTS* ✦\n`;
    const userMeta = `*Customer:* ${currentUser?.email || 'Guest'}\n\n`;
    const itemsHeader = `*Items Ordered:*\n`;
    
    const itemsList = cartItems.map((item, idx) => {
      const varSuffix = item.selectedVariation ? ` (${item.selectedVariation.name})` : '';
      return `${idx + 1}. *${item.name}${varSuffix}* x ${item.quantity}\n   _Price: ₦${item.price} each_\n   _Subtotal: ₦${(item.price * item.quantity).toLocaleString()}_\n`;
    }).join('\n');

    const footer = `\n-----------------------------------------\n*Grand Total: ₦${cartTotal.toLocaleString()}*\n-----------------------------------------\n\nPlease confirm my order. Thank you! ✨`;

    const fullMessage = encodeURIComponent(header + userMeta + itemsHeader + itemsList + footer);
    return `https://wa.me/${phoneCode}?text=${fullMessage}`;
  };

  const getWhatsAppReceiptLink = () => {
    const header = `✦ *ONLINE ORDER PAID - A-BIG GLOW & SCENTS* ✦\n`;
    const refMeta = `*Order Reference:* ${successOrderRef}\n`;
    const customerMeta = `*Customer:* ${deliveryInfo.fullName} (${currentUser?.email || 'Guest'})\n`;
    const phoneMeta = `*Phone:* ${deliveryInfo.phone}\n`;
    const addrMeta = `*Address:* ${deliveryInfo.address}\n\n`;
    const itemsHeader = `*Items Ordered:*\n`;
    
    const itemsList = cartItems.map((item, idx) => {
      const varSuffix = item.selectedVariation ? ` (${item.selectedVariation.name})` : '';
      return `${idx + 1}. *${item.name}${varSuffix}* x ${item.quantity}\n`;
    }).join('\n');

    const totalMeta = `\n*Paid Amount:* ₦${cartTotal.toLocaleString()} via Paystack`;
    const footer = `\n\nI have successfully paid online. Please process my delivery! Thank you! ✨`;
    
    const fullMessage = encodeURIComponent(header + refMeta + customerMeta + phoneMeta + addrMeta + itemsHeader + itemsList + totalMeta + footer);
    return `https://wa.me/2347040273131?text=${fullMessage}`;
  };

  return (
    <div className="cart-page container fade-in">
      <div className="cart-header-section">
        <h2>Your Shopping Cart</h2>
        <div className="gold-line" />
      </div>

      {cartItems.length === 0 && !showSuccessModal ? (
        <div className="empty-cart-state card glass text-center">
          <ShoppingCart size={48} className="text-gold" style={{ animation: 'float 4s ease-in-out infinite', marginBottom: '20px' }} />
          <h3>Your cart is empty</h3>
          <p>Treat yourself to our exquisite selections of luxury scents and glow essentials.</p>
          <Link to="/customer/shop" className="btn btn-gold">
            Browse Shop
          </Link>
        </div>
      ) : showSuccessModal ? (
        <div className="empty-cart-state card glass checkout-success-card text-center">
          <Trophy size={48} className="text-gold" style={{ marginBottom: '20px' }} />
          <h3 className="text-gold">Order Placed Successfully!</h3>
          <p className="success-ref">Order Reference: <strong>{successOrderRef}</strong></p>
          <p className="success-desc">
            Thank you for shopping with us! Your payment has been received and logged securely. We are already preparing your luxury items for dispatch.
          </p>
          <div className="divider" style={{ margin: '20px auto', width: '80%' }} />
          <div className="success-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px', margin: '0 auto' }}>
            <a 
              href={getWhatsAppReceiptLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <MessageSquare size={16} /> Ping Dispatch on WhatsApp
            </a>
            <Link to="/customer/shop" onClick={() => setShowSuccessModal(false)} className="btn btn-gold">
              Continue Shopping
            </Link>
            <Link to="/customer/dashboard" onClick={() => setShowSuccessModal(false)} className="btn btn-outline">
              Go to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-content-layout">
          {/* Cart Items List */}
          <div className="cart-items-column">
            {cartItems.map((item) => (
              <div key={item.cartItemId || item.id} className="cart-item-card card glass">
                <div className="cart-item-media">
                  {item.mediaType === 'video' ? (
                    <video src={item.mediaUrl} muted playsInline />
                  ) : item.mediaUrl ? (
                    <img src={item.mediaUrl} alt={item.name} />
                  ) : (
                    <div className="cart-item-thumb-placeholder">
                      <ImageIcon size={24} className="text-gray" />
                    </div>
                  )}
                </div>
                
                <div className="cart-item-details">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    {item.selectedVariation && (
                      <span style={{ display: 'inline-block', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, background: 'rgba(212,168,67,0.08)', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', marginBottom: '8px' }}>
                        Color: {item.selectedVariation.name}
                      </span>
                    )}
                    <span className="cart-item-category" style={{ display: 'block' }}>{item.category}</span>
                    <p className="cart-item-unit-price">₦{parseFloat(item.price).toLocaleString()} each</p>
                    {item.stock !== undefined && item.quantity >= item.stock && (
                      <button 
                        className="btn-request-more-cart" 
                        onClick={() => setRequestProduct(item)}
                        title="Request additional units for this item"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--gold)',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '4px 0',
                          display: 'block',
                          textAlign: 'left',
                          marginTop: '4px'
                        }}
                      >
                        Need more units? Request Restock
                      </button>
                    )}
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button 
                        onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)} 
                        className="qty-btn"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      {(() => {
                        const isMaxStock = item.stock !== undefined && item.quantity >= item.stock;
                        return (
                          <button 
                            onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)} 
                            className="qty-btn"
                            aria-label="Increase quantity"
                            disabled={isMaxStock}
                            style={isMaxStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            title={isMaxStock ? "Maximum available stock reached" : ""}
                          >
                            +
                          </button>
                        );
                      })()}
                    </div>

                    <div className="cart-item-subtotal">
                      <p>₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.cartItemId || item.id)} 
                      className="cart-delete-btn"
                      title="Remove Item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button onClick={clearCart} className="btn btn-outline btn-sm clear-cart-btn">
              Clear All Items
            </button>
          </div>

          {/* Cart Summary Card */}
          <div className="cart-summary-column">
            <div className="cart-summary-card card glass">
              <h3>Order Summary</h3>
              <div className="gold-line" />
              
              <div className="summary-row">
                <span>Total Items</span>
                <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₦{cartTotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="text-gold">Calculated on checkout</span>
              </div>
              
              <div className="divider" style={{ margin: '20px 0' }} />
              
              <div className="summary-total-row">
                <span>Total</span>
                <span className="text-gold">₦{cartTotal.toLocaleString()}</span>
              </div>

              <div className="checkout-options" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                <button onClick={handlePaystackClick} className="btn btn-paystack btn-lg checkout-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Lock size={16} /> Pay Online via Paystack
                </button>
                <button onClick={handleCheckoutClick} className="btn btn-outline-whatsapp btn-lg checkout-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <MessageSquare size={16} /> Checkout via WhatsApp
                </button>
              </div>
              
              <p className="checkout-note text-center" style={{ marginTop: '16px' }}>
                Choose Paystack for secure instant card, transfer, and USSD payments, or WhatsApp to coordinate manually with sales agents.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-content wa-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setShowCheckoutModal(false)}>✕</button>
            <div className="wa-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <MessageSquare size={36} className="text-gold" style={{ marginBottom: '12px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
              <h3>Confirm Cart Order</h3>
              <p className="wa-subtitle">Choose a representative to place your cart order ({cartItems.length} items):</p>
            </div>
            
            <div className="wa-buttons">
              {numbers.map(n => (
                <a
                  key={n.code}
                  href={getWhatsAppLink(n.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold wa-btn"
                  onClick={() => {
                    setShowCheckoutModal(false);
                  }}
                >
                  <span className="wa-whatsapp-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.82-6.29-2.19l-.44-.37-3.24 1.086 1.086-3.24-.37-.44A9.95 9.95 0 0 1 2 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
                    </svg>
                  </span>
                  {n.display}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Paystack Checkout Modal */}
      {showPaystackModal && (
        <div className="modal-overlay" onClick={() => setShowPaystackModal(false)}>
          <div className="modal-content checkout-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setShowPaystackModal(false)}>✕</button>
            <div className="checkout-modal-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Lock size={36} className="text-gold" style={{ marginBottom: '12px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
              <h3>Secure Online Checkout</h3>
              <p className="checkout-modal-subtitle" style={{ fontSize: '0.9rem', color: 'var(--gray-light)' }}>
                Provide your shipping details to complete your payment.
              </p>
            </div>

            {checkoutError && (
              <div className="form-error" style={{ marginBottom: '16px', padding: '10px', background: 'rgba(231,76,60,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', border: '1px solid rgba(231,76,60,0.2)' }}>
                {checkoutError}
              </div>
            )}

            <form onSubmit={handlePaystackPayment} className="checkout-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={deliveryInfo.fullName}
                  onChange={e => setDeliveryInfo({ ...deliveryInfo, fullName: e.target.value })}
                  placeholder="Enter your first and last name"
                  required
                />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={deliveryInfo.phone}
                  onChange={e => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                  placeholder="e.g., 0803 123 4567"
                  required
                />
              </div>

              <div className="input-group">
                <label>Shipping Address</label>
                <textarea
                  className="input-field"
                  value={deliveryInfo.address}
                  onChange={e => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                  placeholder="Enter your physical street, city, and state address"
                  required
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="input-group">
                <label>Delivery/Scent Note (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  value={deliveryInfo.notes}
                  onChange={e => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                  placeholder="Any preferences or delivery instructions?"
                />
              </div>

              <div className="checkout-modal-summary card glass" style={{ padding: '16px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--gray-light)' }}>
                  <span>Total Items</span>
                  <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem' }}>
                  <span>Grand Total</span>
                  <span className="text-gold">₦{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={paymentProcessing} 
                className="btn btn-paystack btn-lg" 
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
              >
                {paymentProcessing ? 'Processing Payment...' : `Pay ₦${cartTotal.toLocaleString()} Now`}
              </button>
              <p className="paystack-disclaimer" style={{ fontSize: '0.75rem', color: 'var(--gray)', textAlign: 'center' }}>
                <ShieldCheck size={16} /> Card, USSD, and Bank Transfer payments are processed securely by Paystack.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Scent Request Modal */}
      {requestProduct && (
        <RequestModal 
          product={requestProduct} 
          onClose={() => setRequestProduct(null)} 
          initialQuantity={requestProduct.quantity + 1}
        />
      )}
    </div>
  );
}

