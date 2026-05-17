import './ProductCard.css';

export default function ProductCard({ product, onOrder }) {
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
        <button className="btn btn-gold product-btn" onClick={() => onOrder(product)}>
          Order Now
        </button>
      </div>
    </div>
  );
}
