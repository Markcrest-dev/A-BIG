import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import './Home.css';
import Footer from '../components/Footer';
import heroBg from '../assets/images/perfume_hero_bg_1779016402886.png';
import himImg from '../assets/images/collection_him_1779016420226.png';
import herImg from '../assets/images/collection_her_1779016450767.png';
import ScentFinderModal from '../components/ScentFinderModal';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Gem, Leaf } from 'lucide-react';

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scentFinderOpen, setScentFinderOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuiz = () => setScentFinderOpen(true);
    window.addEventListener('open-scent-finder', handleOpenQuiz);
    return () => window.removeEventListener('open-scent-finder', handleOpenQuiz);
  }, []);

  if (currentUser) {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
    if (currentUser.email.toLowerCase() === adminEmail.toLowerCase()) {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

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
            <Link to="/customer/shop" className="btn btn-gold btn-lg">
              Explore Collection
            </Link>
            <button onClick={() => setScentFinderOpen(true)} className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} /> Take Scent Quiz
            </button>
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
            <div className="feature-icon"><Sparkles size={32} className="text-gold" /></div>
            <h3>Premium Quality</h3>
            <p>Sourced from the finest notes globally to ensure a long-lasting and rich aroma.</p>
          </div>
          <div className="feature-card fade-in delay-2">
            <div className="feature-icon"><Gem size={32} className="text-gold" /></div>
            <h3>Luxurious Design</h3>
            <p>Our bottles are masterpieces of craftsmanship, reflecting the elegance within.</p>
          </div>
          <div className="feature-card fade-in delay-3">
            <div className="feature-icon"><Leaf size={32} className="text-gold" /></div>
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
              <Link to="/customer/shop" className="btn btn-gold btn-sm" style={{ width: 'fit-content' }}>Shop Women's</Link>
            </div>
          </div>

          <div className="collection-card slide-up delay-2">
            <img src={himImg} alt="For Him Collection" className="collection-img" />
            <div className="collection-overlay">
              <span className="collection-subtitle">Bold & Refined</span>
              <h3 className="collection-title">For Him</h3>
              <p className="collection-desc">A symphony of dark, sophisticated, and commanding notes for the modern gentleman.</p>
              <Link to="/customer/shop" className="btn btn-outline btn-sm" style={{ width: 'fit-content' }}>Shop Men's</Link>
            </div>
          </div>

        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content container text-center">
          <span className="hero-badge fade-in" style={{ letterSpacing: '0.15em', marginBottom: '14px' }}>✦ Personalized Consultation ✦</span>
          <h2 className="slide-up">Ready to Find Your Signature Scent?</h2>
          <p className="slide-up delay-1" style={{ maxWidth: '560px', margin: '0 auto 20px' }}>
            Allow our virtual scent expert to consult your personality, preferences, and aesthetic to pinpoint the ultimate luxury match from our vault.
          </p>
          <div className="cta-actions slide-up delay-2" style={{ marginTop: '28px', display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setScentFinderOpen(true)} 
              className="btn btn-gold btn-lg" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              <Sparkles size={18} /> Launch Scent Finder Quiz
            </button>
            <Link to="/customer/shop" className="btn btn-outline btn-lg">
              Explore Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Scent Finder Modal */}
      {scentFinderOpen && (
        <ScentFinderModal 
          onClose={() => setScentFinderOpen(false)} 
          onViewProductDetails={() => {
            navigate('/customer/shop');
          }}
        />
      )}

      <Footer />
    </div>
  );
}

