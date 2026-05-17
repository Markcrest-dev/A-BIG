import './ProductCard.css';

export default function ProductCard({ product, onOrder, onAddToCart }) {
  const isVideo = product.mediaType === 'video';

  return (
    <div className="product-card card fade-in">
      <div className="product-media">
        {isVideo ? (
          <video src={product.mediaUrl} muted loop playsInline onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
        ) : (
          <img src={product.mediaUrl} alt={product.name} loading="lazy" />
        )}
        {product.category && <span className="product-badge">{product.category}</span>}
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">₦{product.price}</p>
        <p className="product-desc">{product.description}</p>
        <div className="product-actions-row" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button className="btn btn-outline btn-sm product-btn-action" style={{ flex: 1 }} onClick={() => onAddToCart(product)}>
            Add to Cart
          </button>
          <button className="btn btn-gold btn-sm product-btn-action" style={{ flex: 1 }} onClick={() => onOrder(product)}>
            Order Now
          </button>
        </div>
      </div>
    </div>
  );
}
