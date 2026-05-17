import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const numbers = [
    { display: '0704 027 3131', code: '2347040273131' },
    { display: '0816 449 1568', code: '2348164491568' },
  ];

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    setShowCheckoutModal(true);
  };

  const getWhatsAppLink = (phoneCode) => {
    const header = `✦ *NEW ORDER - A-BIG GLOW & SCENTS* ✦\n`;
    const userMeta = `*Customer:* ${currentUser?.email || 'Guest'}\n\n`;
    const itemsHeader = `*Items Ordered:*\n`;
    
    const itemsList = cartItems.map((item, idx) => (
      `${idx + 1}. *${item.name}* x ${item.quantity}\n   _Price: ₦${item.price} each_\n   _Subtotal: ₦${(item.price * item.quantity).toLocaleString()}_\n`
    )).join('\n');

    const footer = `\n-----------------------------------------\n*Grand Total: ₦${cartTotal.toLocaleString()}*\n-----------------------------------------\n\nPlease confirm my order. Thank you! ✨`;

    const fullMessage = encodeURIComponent(header + userMeta + itemsHeader + itemsList + footer);
    return `https://wa.me/${phoneCode}?text=${fullMessage}`;
  };

  return (
    <div className="cart-page container fade-in">
      <div className="cart-header-section">
        <h2>Your Shopping Cart</h2>
        <div className="gold-line" />
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart-state card glass">
          <span className="cart-empty-icon">🛒</span>
          <h3>Your cart is empty</h3>
          <p>Treat yourself to our exquisite selections of luxury scents and glow essentials.</p>
          <Link to="/customer/shop" className="btn btn-gold">
            Browse Shop
          </Link>
        </div>
      ) : (
        <div className="cart-content-layout">
          {/* Cart Items List */}
          <div className="cart-items-column">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item-card card glass">
                <div className="cart-item-media">
                  {item.mediaType === 'video' ? (
                    <video src={item.mediaUrl} muted playsInline />
                  ) : item.mediaUrl ? (
                    <img src={item.mediaUrl} alt={item.name} />
                  ) : (
                    <div className="cart-item-thumb-placeholder">📷</div>
                  )}
                </div>
                
                <div className="cart-item-details">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <span className="cart-item-category">{item.category}</span>
                    <p className="cart-item-unit-price">₦{parseFloat(item.price).toLocaleString()} each</p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        className="qty-btn"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        className="qty-btn"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-subtotal">
                      <p>₦{(item.price * item.quantity).toLocaleString()}</p>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="cart-delete-btn"
                      title="Remove Item"
                    >
                      🗑️
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

              <button onClick={handleCheckoutClick} className="btn btn-gold btn-lg checkout-btn">
                Checkout via WhatsApp
              </button>
              
              <p className="checkout-note text-center">
                Your order details will be automatically compiled and sent to our WhatsApp sales representatives for instant processing.
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
            <div className="wa-header">
              <span className="wa-icon">💬</span>
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
                    clearCart(); // Optional: clear cart on click or keep it
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
    </div>
  );
}
