import { useState } from 'react';
import './ProductCard.css';

export default function ProductCard({ product, onOrder, onAddToCart, onRequest, onViewDetails }) {
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
    // If the selected variation has its own custom image, default to -1 (variation image)
    if (selectedVar && selectedVar.mediaUrl) return -1;
    return 0;
  });

  // Calculate current stock & out of stock states dynamically
  const currentStock = selectedVar ? selectedVar.stock : (product.stock !== undefined ? product.stock : 0);
  const isOutOfStock = currentStock <= 0;

  // Determine which media to render
  let displayedMedia = { url: product.mediaUrl, type: product.mediaType || 'image' };

  if (activeMediaIndex === -1 && selectedVar && selectedVar.mediaUrl) {
    displayedMedia = { url: selectedVar.mediaUrl, type: selectedVar.mediaType || 'image' };
  } else if (mediaList[activeMediaIndex]) {
    displayedMedia = mediaList[activeMediaIndex];
  } else if (mediaList[0]) {
    displayedMedia = mediaList[0];
  }

  const stockDisplay = currentStock !== undefined ? (
    currentStock > 5 ? (
      <span className="product-stock-lbl text-success">{currentStock} available</span>
    ) : currentStock > 0 ? (
      <span className="product-stock-lbl text-warning">Only {currentStock} left!</span>
    ) : (
      <span className="product-stock-lbl text-danger">Out of stock</span>
    )
  ) : null;

  return (
    <div className={`product-card card fade-in ${isOutOfStock ? 'out-of-stock-card' : ''}`}>
      <div 
        className="product-media" 
        onClick={() => onViewDetails && onViewDetails(product)}
        style={{ cursor: 'pointer' }}
      >
        {/* Gallery Navigation Arrows */}
        {mediaList.length > 1 && (
          <div className="gallery-nav-arrows">
            <button 
              type="button" 
              className="gallery-arrow arrow-left" 
              onClick={(e) => {
                e.stopPropagation();
                let nextIdx = activeMediaIndex === -1 ? 0 : activeMediaIndex - 1;
                if (nextIdx < 0) nextIdx = mediaList.length - 1;
                setActiveMediaIndex(nextIdx);
              }}
            >
              ‹
            </button>
            <button 
              type="button" 
              className="gallery-arrow arrow-right" 
              onClick={(e) => {
                e.stopPropagation();
                let nextIdx = activeMediaIndex === -1 ? 0 : activeMediaIndex + 1;
                if (nextIdx >= mediaList.length) nextIdx = 0;
                setActiveMediaIndex(nextIdx);
              }}
            >
              ›
            </button>
          </div>
        )}

        {/* Media Rendering (Image/Video) */}
        {displayedMedia.type === 'video' ? (
          <video 
            src={displayedMedia.url} 
            muted 
            loop 
            playsInline 
            onMouseOver={e => e.target.play()} 
            onMouseOut={e => e.target.pause()} 
            key={displayedMedia.url}
          />
        ) : (
          <img src={displayedMedia.url} alt={product.name} loading="lazy" key={displayedMedia.url} />
        )}
        
        {/* Luxury hover Quick View Overlay */}
        <div className="product-media-overlay">
          <span className="quick-view-badge">Quick View</span>
        </div>
        
        {product.category && <span className="product-badge">{product.category}</span>}
        {isOutOfStock && <span className="product-badge badge-out-of-stock">Out of Stock</span>}

        {/* Gallery Indicator Dots */}
        {(mediaList.length > 1 || (selectedVar && selectedVar.mediaUrl)) && (
          <div className="gallery-indicator-dots">
            {mediaList.map((_, i) => (
              <span 
                key={i} 
                className={`gallery-dot ${activeMediaIndex === i ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex(i);
                }}
              />
            ))}
            {selectedVar && selectedVar.mediaUrl && (
              <span 
                className={`gallery-dot variation-dot ${activeMediaIndex === -1 ? 'active' : ''}`}
                title="Selected Color Image"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMediaIndex(-1);
                }}
              />
            )}
          </div>
        )}
      </div>

      <div className="product-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h3 
            className="product-name" 
            onClick={() => onViewDetails && onViewDetails(product)}
            style={{ cursor: 'pointer' }}
          >
            {product.name}
          </h3>
          {stockDisplay}
        </div>
        
        <p className="product-price">₦{product.price.toLocaleString()}</p>
        <p 
          className="product-desc" 
          onClick={() => onViewDetails && onViewDetails(product)}
          style={{ cursor: 'pointer' }}
        >
          {product.description}
        </p>

        {/* Variations selector chips */}
        {hasVariations && (
          <div className="product-variations-selector">
            <span className="selector-label">Available Colors/Styles:</span>
            <div className="variations-chips">
              {product.variations.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`variation-chip ${selectedVar?.id === v.id ? 'active' : ''} ${v.stock <= 0 ? 'out-of-stock-chip' : ''}`}
                  onClick={() => {
                    setSelectedVar(v);
                    // Snap to variation image if it exists, otherwise snap to index 0
                    if (v.mediaUrl) {
                      setActiveMediaIndex(-1);
                    } else {
                      setActiveMediaIndex(0);
                    }
                  }}
                >
                  {v.name} ({v.stock} left)
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="product-actions-row" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {isOutOfStock ? (
            <button 
              className="btn btn-gold btn-sm product-btn-action" 
              style={{ flex: 1, background: 'linear-gradient(135deg, #B8912E, #D4A843)' }} 
              onClick={() => onRequest({ ...product, selectedVariation: selectedVar })}
            >
              Request Scent
            </button>
          ) : (
            <>
              <button className="btn btn-outline btn-sm product-btn-action" style={{ flex: 1 }} onClick={() => onAddToCart(product, selectedVar)}>
                Add to Cart
              </button>
              <button className="btn btn-gold btn-sm product-btn-action" style={{ flex: 1 }} onClick={() => onOrder({ ...product, selectedVariation: selectedVar })}>
                Order Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
