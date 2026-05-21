import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
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
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination if category, search, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, sortBy]);

  const handleAddToCart = (product, selectedVar = null) => {
    addToCart(product, selectedVar);
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

  // Dynamic systematic sorting
  const sortedProducts = [...filtered].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'price-low-high') {
      return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    }
    if (sortBy === 'price-high-low') {
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    }
    // Default: newest first
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });

  // Pagination calculations
  const itemsPerPage = 12;
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const currentShopPage = Math.min(currentPage, totalPages || 1);
  const indexOfLastProduct = currentShopPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const paginatedProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  return (
    <div className="shop-page">
      <section className="products-section container">
        <div className="section-header">
          <h2>Our Collection</h2>
          <div className="gold-line" />
        </div>

        {/* Search Bar & Sorting Input Wrapper */}
        <div className="shop-controls-row">
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

          <div className="shop-sort-inner glass">
            <span className="sort-label text-gold">Sort By:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="shop-sort-select"
            >
              <option value="newest">New Arrivals</option>
              <option value="alphabetical">Alphabetical (A - Z)</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
            </select>
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

        {!loading && !error && sortedProducts.length > 0 && (
          <>
            <div className="products-grid">
              {paginatedProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onOrder={handleOrderNow} 
                  onAddToCart={handleAddToCart}
                  onRequest={setRequestProduct}
                  onViewDetails={setSelectedDetailProduct}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '24px 0', marginTop: '32px' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentShopPage === 1}
                  className="btn btn-outline btn-sm"
                  style={{ minWidth: '80px' }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`btn btn-sm ${currentShopPage === pageNum ? 'btn-gold' : 'btn-outline'}`}
                    style={{ minWidth: '36px', padding: '6px' }}
                  >
                    {pageNum}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentShopPage === totalPages}
                  className="btn btn-outline btn-sm"
                  style={{ minWidth: '80px' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
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

      {/* Product Details Popup Modal */}
      {selectedDetailProduct && (
        <ProductDetailModal
          product={selectedDetailProduct}
          onClose={() => setSelectedDetailProduct(null)}
          onAddToCart={handleAddToCart}
          onOrder={handleOrderNow}
          onRequest={setRequestProduct}
        />
      )}
    </div>
  );
}
