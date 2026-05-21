import { useState, useEffect } from 'react';
import { ShoppingCart, Check, AlertCircle, ShoppingBag, X, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import './ProductDetailModal.css';

export default function ProductDetailModal({ product, onClose, onAddToCart, onOrder, onRequest }) {
  if (!product) return null;

  // Set up general media list (main media + additional gallery media)
  const mediaList = [];
  if (product.mediaUrl) {
    mediaList.push({ url: product.mediaUrl, type: product.mediaType || 'image' });
  }
  if (product.additionalMedia && Array.isArray(product.additionalMedia)) {
    mediaList.push(...product.additionalMedia);
  }

  // Set up variations
  const hasVariations = product.variations && product.variations.length > 0;
  
  // Default to first variation in-stock, or just the first variation
  const [selectedVar, setSelectedVar] = useState(() => {
    if (!hasVariations) return null;
    return product.variations.find(v => v.stock > 0) || product.variations[0];
  });

  // activeMediaIndex:
  // -1: shows selected variation's custom image (if uploaded)
  //  0+: index of the general mediaList
  const [activeMediaIndex, setActiveMediaIndex] = useState(() => {
    if (selectedVar && selectedVar.mediaUrl) return -1;
    return 0;
  });

  // Track if item was just added to show check success
  const [justAdded, setJustAdded] = useState(false);

  // Sync media index when variation changes
  useEffect(() => {
    if (selectedVar && selectedVar.mediaUrl) {
      setActiveMediaIndex(-1);
    } else {
      setActiveMediaIndex(0);
    }
  }, [selectedVar]);

  // Calculate current stock & out of stock states dynamically
  const currentStock = selectedVar ? selectedVar.stock : (product.stock !== undefined ? product.stock : 0);
  const isOutOfStock = currentStock <= 0;

  // Determine which media to render in main view
  let displayedMedia = { url: product.mediaUrl, type: product.mediaType || 'image' };

  if (activeMediaIndex === -1 && selectedVar && selectedVar.mediaUrl) {
    displayedMedia = { url: selectedVar.mediaUrl, type: selectedVar.mediaType || 'image' };
  } else if (mediaList[activeMediaIndex]) {
    displayedMedia = mediaList[activeMediaIndex];
  } else if (mediaList[0]) {
    displayedMedia = mediaList[0];
  }

  const handleAddToCartClick = () => {
    onAddToCart(product, selectedVar);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleOrderNowClick = () => {
    onOrder({ ...product, selectedVariation: selectedVar });
    onClose();
  };

  const handleRequestClick = () => {
    onRequest({ ...product, selectedVariation: selectedVar });
    onClose();
  };

  return (
    <div className="modal-overlay pd-modal-overlay" onClick={onClose}>
      <div className="modal-content pd-modal-content glass fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="pd-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="pd-modal-grid">
          
          {/* Left Column: Premium Gallery Media View */}
          <div className="pd-gallery-section">
            <div className="pd-main-media-wrap">
              {/* Product Badge */}
              {product.category && <span className="pd-badge-category">{product.category}</span>}
              {isOutOfStock && <span className="pd-badge-stock pd-out-of-stock">Out of Stock</span>}
              
              {/* Media rendering */}
              {displayedMedia.type === 'video' ? (
                <video 
                  src={displayedMedia.url} 
                  autoPlay
                  muted 
                  loop 
                  playsInline 
                  key={displayedMedia.url}
                  className="pd-main-media-content"
                />
              ) : (
                <img 
                  src={displayedMedia.url} 
                  alt={product.name} 
                  key={displayedMedia.url}
                  className="pd-main-media-content"
                />
              )}

              {/* Gallery Navigation Arrows inside Main Wrapper */}
              {mediaList.length > 1 && (
                <div className="pd-gallery-nav">
                  <button 
                    type="button" 
                    className="pd-nav-arrow pd-arrow-left" 
                    onClick={() => {
                      let nextIdx = activeMediaIndex === -1 ? 0 : activeMediaIndex - 1;
                      if (nextIdx < 0) nextIdx = mediaList.length - 1;
                      setActiveMediaIndex(nextIdx);
                    }}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="pd-nav-arrow pd-arrow-right" 
                    onClick={() => {
                      let nextIdx = activeMediaIndex === -1 ? 0 : activeMediaIndex + 1;
                      if (nextIdx >= mediaList.length) nextIdx = 0;
                      setActiveMediaIndex(nextIdx);
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery Row */}
            {(mediaList.length > 1 || (selectedVar && selectedVar.mediaUrl)) && (
              <div className="pd-thumbnails-row">
                {mediaList.map((media, i) => (
                  <div 
                    key={i} 
                    className={`pd-thumbnail-item ${activeMediaIndex === i ? 'active' : ''}`}
                    onClick={() => setActiveMediaIndex(i)}
                  >
                    {media.type === 'video' ? (
                      <div className="pd-video-thumbnail-overlay">▶</div>
                    ) : (
                      <img src={media.url} alt="Thumbnail preview" />
                    )}
                  </div>
                ))}
                {selectedVar && selectedVar.mediaUrl && (
                  <div 
                    className={`pd-thumbnail-item pd-var-thumbnail ${activeMediaIndex === -1 ? 'active' : ''}`}
                    onClick={() => setActiveMediaIndex(-1)}
                    title="Variation custom image"
                  >
                    <img src={selectedVar.mediaUrl} alt="Variation color styles preview" />
                    <span className="pd-var-thumbnail-indicator">✦</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Luxury Details Spec */}
          <div className="pd-details-section">
            
            {/* Headers */}
            <div className="pd-details-header">
              <div className="pd-stock-badge-row">
                {currentStock !== undefined && (
                  currentStock > 5 ? (
                    <span className="pd-stock-tag pd-tag-success">{currentStock} items in stock</span>
                  ) : currentStock > 0 ? (
                    <span className="pd-stock-tag pd-tag-warning">Only {currentStock} remaining!</span>
                  ) : (
                    <span className="pd-stock-tag pd-tag-danger">Out of Stock</span>
                  )
                )}
              </div>
              <h2 className="pd-product-title">{product.name}</h2>
              <div className="pd-product-price">₦{product.price.toLocaleString()}</div>
            </div>

            {/* Divider */}
            <div className="pd-gold-divider" />

            {/* Description */}
            <div className="pd-description-box">
              <h4>Description</h4>
              <p>{product.description || 'Indulge in the true luxury of this premium scent. Expertly curated with exquisite ingredients to deliver an unmatched signature glow & fragrance.'}</p>
            </div>


            {/* Variations Selector Chips */}
            {hasVariations && (
              <div className="pd-variations-section">
                <span className="pd-section-label">Available Colors / Styles:</span>
                <div className="pd-variations-chips">
                  {product.variations.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`pd-var-chip ${selectedVar?.id === v.id ? 'active' : ''} ${v.stock <= 0 ? 'out-of-stock' : ''}`}
                      onClick={() => setSelectedVar(v)}
                    >
                      {v.name} <span className="pd-chip-stock">({v.stock} left)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Grid */}
            <div className="pd-actions-area">
              {isOutOfStock ? (
                <button 
                  className="btn btn-gold btn-lg pd-action-btn pd-request-btn"
                  onClick={handleRequestClick}
                >
                  <MessageSquare size={18} style={{ marginRight: '8px' }} /> Request Scent / Restock
                </button>
              ) : (
                <div className="pd-actions-row">
                  <button 
                    className={`btn btn-outline btn-lg pd-action-btn pd-add-to-cart-btn ${justAdded ? 'success-pop' : ''}`}
                    onClick={handleAddToCartClick}
                    disabled={justAdded}
                  >
                    {justAdded ? (
                      <>
                        <Check size={18} style={{ marginRight: '8px', color: 'var(--gold)' }} /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} style={{ marginRight: '8px' }} /> Add to Cart
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-gold btn-lg pd-action-btn pd-order-btn"
                    onClick={handleOrderNowClick}
                  >
                    <ShoppingBag size={18} style={{ marginRight: '8px' }} /> Order Now
                  </button>
                </div>
              )}
            </div>

            {/* Micro details */}
            <div className="pd-footer-badges">
              <div className="pd-footer-badge-item">
                <span>✦ Authentic Scent</span>
              </div>
              <div className="pd-footer-badge-item">
                <span>✦ Secure Checkout</span>
              </div>
              <div className="pd-footer-badge-item">
                <span>✦ Nationwide Delivery</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
