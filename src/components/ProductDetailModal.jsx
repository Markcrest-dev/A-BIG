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

  // Track active tier in scent/skincare notes pyramid
  const [activeTier, setActiveTier] = useState('top');

  const luxuryDetails = getLuxuryDetails(product);

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

            {/* Scent/Skincare Interactive Pyramid */}
            <div className="pd-pyramid-section">
              <span className="pd-section-label">
                {luxuryDetails.type === 'scent' ? '✦ Olfactory Scent Pyramid' : '✦ Luxury Ingredients & Benefits'}
              </span>
              <div className="scent-pyramid-card glass">
                
                {/* Pyramid visual */}
                <div className="pyramid-graphic">
                  <button 
                    type="button" 
                    className={`pyramid-tier tier-top ${activeTier === 'top' ? 'active' : ''}`}
                    onClick={() => setActiveTier('top')}
                    title="Click to view Top Notes"
                  >
                    <span className="tier-text">TOP</span>
                  </button>
                  <button 
                    type="button" 
                    className={`pyramid-tier tier-heart ${activeTier === 'heart' ? 'active' : ''}`}
                    onClick={() => setActiveTier('heart')}
                    title="Click to view Heart Notes"
                  >
                    <span className="tier-text">HEART</span>
                  </button>
                  <button 
                    type="button" 
                    className={`pyramid-tier tier-base ${activeTier === 'base' ? 'active' : ''}`}
                    onClick={() => setActiveTier('base')}
                    title="Click to view Base Notes"
                  >
                    <span className="tier-text">BASE</span>
                  </button>
                </div>
                
                {/* Pyramid Details */}
                <div className="pyramid-details-panel">
                  <div className="pyramid-detail-header-row">
                    <h5>{luxuryDetails[activeTier].title}</h5>
                    <span className="pyramid-duration-badge">{luxuryDetails[activeTier].duration}</span>
                  </div>
                  <p className="pyramid-vibe-desc">{luxuryDetails[activeTier].vibe}</p>
                  <div className="pyramid-chips-row">
                    {luxuryDetails[activeTier].items.map((item, idx) => (
                      <span key={idx} className="pyramid-note-chip">
                        <span className="gold-bullet">✦</span> {item}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
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

// ==========================================
// LUXURY DETAILS GENERATOR (Olfactory Pyramid / Skincare Ingredients)
// ==========================================
function getLuxuryDetails(product) {
  const cat = (product?.category || '').toLowerCase();
  const name = (product?.name || '').toLowerCase();
  const desc = (product?.description || '').toLowerCase();
  
  if (cat === 'perfume' || cat === 'body spray' || name.includes('scent') || name.includes('perfume') || name.includes('spray')) {
    // Scent notes
    let notes = {
      type: 'scent',
      top: {
        title: 'Top Notes (Head)',
        duration: 'First 10 - 15 mins',
        vibe: 'The initial sparkling burst of notes that introduces the fragrance, engaging the senses immediately.',
        items: ['Bergamot Citrus', 'Pear Blossom', 'Pink Pepper']
      },
      heart: {
        title: 'Heart Notes (Core)',
        duration: '2 - 4 hours duration',
        vibe: 'The rich, full body of the scent that blooms as top notes fade, defining the signature character.',
        items: ['Damask Rose', 'Jasmine Sambac', 'French Lavender']
      },
      base: {
        title: 'Base Notes (Dry-Down)',
        duration: 'Up to 8 - 12+ hours',
        vibe: 'The deep, luxurious foundation that anchors the fragrance, slowly melting into the skin for a lasting memory.',
        items: ['Madagascar Vanilla', 'Warm Sandalwood', 'White Amber']
      }
    };

    if (name.includes('oud') || desc.includes('oud') || name.includes('wood') || desc.includes('wood')) {
      notes.top.items = ['Saffron Spice', 'Nutmeg Essence', 'Fresh Lavender'];
      notes.top.vibe = 'A rich, exotic blend of warm saffron and earthy nutmeg creates an immediate aura of luxury and heat.';
      notes.heart.items = ['Precious Agarwood (Oud)', 'Indonesian Patchouli', 'Geranium'];
      notes.heart.vibe = 'The signature core of dark, resinous oud and absolute patchouli takes flight, radiating confidence and power.';
      notes.base.items = ['Sandalwood Mysore', 'Earthy Ambergris', 'Rich Cedarwood'];
      notes.base.vibe = 'A heavy, sensual foundation of warm sandalwood and dry cedarwood leaves a commanding, long-lasting tail.';
    } else if (name.includes('rose') || desc.includes('rose') || name.includes('pink') || desc.includes('pink') || name.includes('floral') || desc.includes('floral')) {
      notes.top.items = ['Red Currant', 'Pink Pepper', 'Italian Bergamot'];
      notes.top.vibe = 'A delightful, fruity-spicy open with bright currants and sparkling bergamot that captures instant romance.';
      notes.heart.items = ['Turkish Damask Rose', 'Royal Peony', 'Egyptian Jasmine'];
      notes.heart.vibe = 'A brilliant, elegant bouquet of authentic Turkish roses and clean white peonies forms a premium, sophisticated heart.';
      notes.base.items = ['Velvet Musk', 'Madagascar Vanilla Bean', 'Patchouli Mist'];
      notes.base.vibe = 'Settles beautifully into a soft, velvety layer of creamy vanilla and deep musk, leaving a sweet, romantic sillage.';
    } else if (name.includes('vanilla') || desc.includes('vanilla') || name.includes('gold') || desc.includes('gold') || name.includes('sweet') || desc.includes('sweet') || name.includes('scents') || desc.includes('glow')) {
      notes.top.items = ['Ripe Pear Accord', 'Tangerine Zest', 'Orchid Petals'];
      notes.top.vibe = 'A luscious, sweet opening of juicy pear and vibrant tangerine that radiates warmth and modern charm.';
      notes.heart.items = ['Tahitian Vanilla Orchid', 'Crushed Blackberry', 'Golden Heliotrope'];
      notes.heart.vibe = 'The core turns delightfully warm with vanilla orchid notes and a sweet touch of mountain blackberries.';
      notes.base.items = ['Double Vanilla Extract', 'Warm Caramel', 'Golden Sandalwood'];
      notes.base.vibe = 'A deeply gourmand base of concentrated vanilla beans, rich caramel, and soft sandalwood that lasts exceptionally long.';
    } else if (name.includes('fresh') || desc.includes('fresh') || name.includes('blue') || desc.includes('blue') || name.includes('mint') || desc.includes('mint') || name.includes('spray') || desc.includes('sport')) {
      notes.top.items = ['Spearmint Leaf', 'Italian Lemon Zest', 'Crisp Green Apple'];
      notes.top.vibe = 'An incredibly refreshing and zesty opening designed to revitalize the senses with cold citrus notes.';
      notes.heart.items = ['African Geranium', 'Sea Breeze Accord', 'Clary Sage'];
      notes.heart.vibe = 'Dries down into a clean, aquatic sea breeze combined with spicy geranium for a crisp, fresh, and confident vibe.';
      notes.base.items = ['Haitian Vetiver', 'Virginia Cedarwood', 'Oakmoss Extract'];
      notes.base.vibe = 'A clean, woody-masculine finish of earthy vetiver and dry oakmoss that lingers beautifully on the skin.';
    }
    
    return notes;
  } else {
    // Skin Care, Cosmetics, Hair Care benefits details
    return {
      type: 'skincare',
      top: {
        title: 'Active Ingredients (Surface)',
        duration: 'Instant absorption & glow',
        vibe: 'Powerful active molecules that target the outer layers of the skin, supplying immediate radiance and protective moisture.',
        items: ['Hyaluronic Acid', 'Niacinamide (Vitamin B3)', 'Brightening Citrus Extract']
      },
      heart: {
        title: 'Nourishing Core (Cellular)',
        duration: 'Deep cellular absorption',
        vibe: 'Essential nutrients and botanical extracts that penetrate deep within skin layers to stimulate natural collagen, repair texture, and soothe.',
        items: ['Organic Aloe Vera', 'Chamomile Extract', 'Rosehip Seed Oil']
      },
      base: {
        title: 'Skin Barrier Protection (Foundation)',
        duration: '24-hour hydration lock',
        vibe: 'Heavy lipids and ceramide complexes that form a lightweight, breathable seal to prevent moisture loss and shield skin from environmental stressors.',
        items: ['Ceramide NP', 'Natural Shea Butter', 'Vitamin E Antioxidants']
      }
    };
  }
}
