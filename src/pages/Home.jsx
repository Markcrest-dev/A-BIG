import { Link } from 'react-router-dom';
import './Home.css';
import heroBg from '../assets/images/perfume_hero_bg_1779016402886.png';
import himImg from '../assets/images/collection_him_1779016420226.png';
import herImg from '../assets/images/collection_her_1779016450767.png';

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay" />
        <div className="hero-content container">
          <span className="hero-badge fade-in">A-BIG Luxury Collection</span>
          <h1 className="hero-title slide-up">
            A-BIG Glow<br /><span className="text-gold">& Scents</span>
          </h1>
          <p className="hero-subtitle slide-up delay-1">Where Elegance Meets Confidence</p>
          <p className="hero-quote slide-up delay-2">"Leave a Lasting Impression Everywhere You Go."</p>
          <div className="hero-actions slide-up delay-3">
            <Link to="/shop" className="btn btn-gold btn-lg">
              Explore Collection
            </Link>
            <a href="#collections" className="btn btn-outline btn-lg">
              Discover More
            </a>
          </div>
        </div>
      </section>

      {/* Brand Philosophy Section */}
      <section className="philosophy container">
        <div className="philosophy-content text-center">
          <h2 className="section-title fade-in">The Essence of Luxury</h2>
          <div className="divider"></div>
          <p className="section-text fade-in delay-1">
            At A-BIG Glow & Scents, we believe that a fragrance is more than just a scent—it is an invisible signature that leaves a lasting memory. Crafted with the finest ingredients and boundless passion, our collections are designed to empower you with confidence and timeless elegance.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card fade-in delay-1">
            <div className="feature-icon">✨</div>
            <h3>Premium Quality</h3>
            <p>Sourced from the finest notes globally to ensure a long-lasting and rich aroma.</p>
          </div>
          <div className="feature-card fade-in delay-2">
            <div className="feature-icon">💎</div>
            <h3>Luxurious Design</h3>
            <p>Our bottles are masterpieces of craftsmanship, reflecting the elegance within.</p>
          </div>
          <div className="feature-card fade-in delay-3">
            <div className="feature-icon">🌿</div>
            <h3>Exquisite Notes</h3>
            <p>Harmonious blends that evolve beautifully, creating an unforgettable aura.</p>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section id="collections" className="collections">
        <h2 className="section-title text-center slide-up">Curated Collections</h2>
        <div className="divider" style={{ margin: '20px auto 60px' }}></div>
        <div className="collection-grid container">
          
          <div className="collection-card slide-up delay-1">
            <img src={herImg} alt="For Her Collection" className="collection-img" />
            <div className="collection-overlay">
              <span className="collection-subtitle">Aura of Elegance</span>
              <h3 className="collection-title">For Her</h3>
              <p className="collection-desc">Embrace the delicate, glowing essence of floral and radiant notes designed to captivate.</p>
              <Link to="/shop" className="btn btn-gold btn-sm" style={{ width: 'fit-content' }}>Shop Women's</Link>
            </div>
          </div>

          <div className="collection-card slide-up delay-2">
            <img src={himImg} alt="For Him Collection" className="collection-img" />
            <div className="collection-overlay">
              <span className="collection-subtitle">Bold & Refined</span>
              <h3 className="collection-title">For Him</h3>
              <p className="collection-desc">A symphony of dark, sophisticated, and commanding notes for the modern gentleman.</p>
              <Link to="/shop" className="btn btn-outline btn-sm" style={{ width: 'fit-content' }}>Shop Men's</Link>
            </div>
          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content container text-center">
          <h2 className="slide-up">Ready to Find Your Signature Scent?</h2>
          <p className="slide-up delay-1">Browse our full catalog and elevate your everyday presence.</p>
          <Link to="/shop" className="btn btn-gold btn-lg slide-up delay-2" style={{ marginTop: '30px' }}>
            Visit the Shop
          </Link>
        </div>
      </section>
    </div>
  );
}
