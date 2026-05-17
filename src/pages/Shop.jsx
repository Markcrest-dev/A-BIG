import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProductCard from '../components/ProductCard';
import WhatsAppModal from '../components/WhatsAppModal';
import Loader from '../components/Loader';
import './Shop.css';

const ALL = 'All';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState(ALL);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const categories = [ALL, ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = activeCategory === ALL ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="shop-page">
      <section className="products-section container">
        <div className="section-header">
          <h2>Our Collection</h2>
          <div className="gold-line" />
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="category-bar">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* States */}
        {loading && <Loader />}

        {error && (
          <div className="error-state">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">✦</span>
            <h3>No Products Yet</h3>
            <p>Our luxurious collection is coming soon. Stay tuned!</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="products-grid">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} onOrder={setSelectedProduct} />
            ))}
          </div>
        )}
      </section>

      {/* WhatsApp Modal */}
      <WhatsAppModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
