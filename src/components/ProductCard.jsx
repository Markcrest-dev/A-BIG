import './ProductCard.css';

export default function ProductCard({ product, onOrder, onAddToCart, onRequest }) {
  const isVideo = product.mediaType === 'video';
  const isOutOfStock = product.stock === undefined || product.stock <= 0;

  const stockDisplay = product.stock !== undefined ? (
    product.stock > 5 ? (
      <span className="product-stock-lbl text-success">{product.stock} available</span>
    ) : product.stock > 0 ? (
      <span className="product-stock-lbl text-warning">Only {product.stock} left!</span>
    ) : (
      <span className="product-stock-lbl text-danger">Out of stock</span>
    )
  ) : null;

  return (
    <div className={`product-card card fade-in ${isOutOfStock ? 'out-of-stock-card' : ''}`}>
      <div className="product-media">
        {isVideo ? (
          <video src={product.mediaUrl} muted loop playsInline onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
        ) : (
          <img src={product.mediaUrl} alt={product.name} loading="lazy" />
        )}
        {product.category && <span className="product-badge">{product.category}</span>}
        {isOutOfStock && <span className="product-badge badge-out-of-stock">Out of Stock</span>}
      </div>
      <div className="product-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h3 className="product-name">{product.name}</h3>
          {stockDisplay}
        </div>
        <p className="product-price">₦{product.price.toLocaleString()}</p>
        <p className="product-desc">{product.description}</p>
        <div className="product-actions-row" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {isOutOfStock ? (
            <button 
              className="btn btn-gold btn-sm product-btn-action" 
              style={{ flex: 1, background: 'linear-gradient(135deg, #B8912E, #D4A843)' }} 
              onClick={() => onRequest(product)}
            >
              Request Scent
            </button>
          ) : (
            <>
              <button className="btn btn-outline btn-sm product-btn-action" style={{ flex: 1 }} onClick={() => onAddToCart(product)}>
                Add to Cart
              </button>
              <button className="btn btn-gold btn-sm product-btn-action" style={{ flex: 1 }} onClick={() => onOrder(product)}>
                Order Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
