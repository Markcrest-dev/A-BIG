import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProductCard from '../components/ProductCard';
import WhatsAppModal from '../components/WhatsAppModal';
import RequestModal from '../components/RequestModal';
import Loader from '../components/Loader';
import { useCart } from '../context/CartContext';
import { AlertCircle, Sparkles, CheckCircle, Search } from 'lucide-react';
import './Shop.css';

const ALL = 'All';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState(ALL);
  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();

  // Search & Request Scent States
  const [searchQuery, setSearchQuery] = useState('');
  const [requestProduct, setRequestProduct] = useState(null);

  const handleAddToCart = (product) => {
    addToCart(product);
    setToastMessage(`Added "${product.name}" to cart!`);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleOrderNow = (product) => {
    addToCart(product);
    navigate('/customer/cart');
  };

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // In-memory sorting (newest first based on createdAt)
        items.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });
        setProducts(items);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        let userFriendlyError = 'Failed to load products. Please try again later.';
        if (err.message?.includes('NOT_FOUND') || err.code === 'not-found') {
          userFriendlyError = 'Firestore database not found. ⚠️ Please go to the Firebase Console, select your project ("abig-glow-scents"), navigate to "Firestore Database" in the sidebar, and click "Create Database".';
        } else if (err.message?.includes('permission') || err.code === 'permission-denied') {
          userFriendlyError = 'Permission denied. ⚠️ Please check your Firestore Security Rules in the Firebase Console and ensure read access is allowed.';
        }
        setError(userFriendlyError);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const categories = [ALL, ...new Set(products.map(p => p.category).filter(Boolean))];

  // Combined category and search query filters
  const filtered = products.filter(p => {
    const matchesCategory = activeCategory === ALL || p.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="shop-page">
      <section className="products-section container">
        <div className="section-header">
          <h2>Our Collection</h2>
          <div className="gold-line" />
        </div>

        {/* Search Bar Input */}
        <div className="shop-search-bar-wrap">
          <div className="shop-search-inner glass">
            <Search className="search-icon text-gold" size={20} />
            <input 
              type="text" 
              placeholder="Search for signature perfumes, scents, body sprays..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shop-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear-btn" aria-label="Clear Search">✕</button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="category-bar" style={{ marginTop: '20px' }}>
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
            <AlertCircle size={32} className="text-gold" style={{ marginBottom: '12px' }} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <Sparkles size={36} className="text-gold" style={{ marginBottom: '12px' }} />
            {products.length === 0 ? (
              <>
                <h3>No Products Yet</h3>
                <p>Our luxurious collection is coming soon. Stay tuned!</p>
              </>
            ) : (
              <>
                <h3>No Scents Found</h3>
                <p>We couldn't find any premium items matching your search. Try resetting filters!</p>
              </>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="products-grid">
            {filtered.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onOrder={handleOrderNow} 
                onAddToCart={handleAddToCart}
                onRequest={setRequestProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="cart-toast glass fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} className="text-gold" />
          <p>{toastMessage}</p>
        </div>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* Request Restock Modal */}
      {requestProduct && (
        <RequestModal 
          product={requestProduct} 
          onClose={() => setRequestProduct(null)} 
        />
      )}
    </div>
  );
}
