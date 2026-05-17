import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'loading', 'success', 'error'

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    // Simulate API registration call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1200);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="footer">
      {/* Decorative Glow Elements */}
      <div className="footer-glow glow-left" />
      <div className="footer-glow glow-right" />

      <div className="container footer-inner">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          
          {/* Column 1: Brand & Philosophy */}
          <div className="footer-column brand-column">
            <div className="footer-brand">
              <span className="footer-brand-icon">✦</span>
              <h3>A-BIG Glow & Scents</h3>
            </div>
            <p className="footer-quote">
              "Leave a Lasting Impression Everywhere You Go."
            </p>
            <p className="footer-description">
              Crafting premium signature fragrances that evoke confidence, luxury, and timeless elegance. Sourced from the finest essences.
            </p>
            <div className="footer-socials">
              <a href="https://wa.me/2347040273131" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.402.002 9.791-4.382 9.795-9.78.002-2.614-1.011-5.074-2.853-6.918C16.331 2.062 13.882.802 11.28.802c-5.405 0-9.804 4.394-9.808 9.793-.001 1.76.46 3.473 1.336 4.98L1.758 20.73l5.35-1.402c1.472.802 2.947 1.206 4.539 1.206z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="footer-column links-column">
            <h4>Discover</h4>
            <ul>
              <li><Link to="/customer/shop">Explore Shop</Link></li>
              <li><Link to="/customer/shop">For Him Collection</Link></li>
              <li><Link to="/customer/shop">For Her Collection</Link></li>
              <li><Link to="/auth">Exclusive Offers</Link></li>
              <li><Link to="/customer/cart">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Column 3: The Brand */}
          <div className="footer-column links-column">
            <h4>Information</h4>
            <ul>
              <li><a href="#collections">Our Heritage</a></li>
              <li><a href="#collections">Premium Quality</a></li>
              <li><a href="#collections">Exquisite Notes</a></li>
              <li><a href="#collections">Contact Us</a></li>
              <li><span className="delivery-badge">🚚 Nationwide Delivery</span></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="footer-column newsletter-column">
            <h4>Join The Glow List</h4>
            <p className="newsletter-text">
              Subscribe to unlock early access to new collection releases, private sales, and luxury fragrance tips.
            </p>

            <form onSubmit={handleSubscribe} className="newsletter-form">
              <div className="newsletter-input-wrapper">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading' || status === 'success'}
                  required
                  className="newsletter-input"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className={`newsletter-btn ${status === 'success' ? 'success' : ''}`}
                  aria-label="Subscribe"
                >
                  {status === 'loading' ? (
                    <span className="spinner" />
                  ) : status === 'success' ? (
                    <span className="check">✓</span>
                  ) : (
                    <span className="arrow">→</span>
                  )}
                </button>
              </div>
            </form>

            {status === 'success' && (
              <p className="newsletter-success fade-in">
                ✦ Welcome to the inner circle! Check your inbox soon.
              </p>
            )}
          </div>

        </div>

        {/* Custom Luxury Divider */}
        <div className="footer-divider-container">
          <div className="footer-divider" />
          <button className="back-to-top-btn" onClick={scrollToTop} aria-label="Scroll back to top">
            <span className="arrow-up">↑</span>
          </button>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} A-BIG Glow & Scents. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#collections">Privacy Policy</a>
            <span className="sep">•</span>
            <a href="#collections">Terms of Service</a>
            <span className="sep">•</span>
            <span className="contact-item">📞 0704 027 3131</span>
            <span className="sep">•</span>
            <span className="contact-item">📍 Lagos, Nigeria</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
