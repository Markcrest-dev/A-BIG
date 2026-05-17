import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content container">
          <span className="hero-badge">✦ Premium Collection</span>
          <h1 className="hero-title">
            A-BIG Glow<br /><span className="text-gold">& Scents</span>
          </h1>
          <p className="hero-subtitle">Where Elegance Meets Confidence</p>
          <p className="hero-quote">"Leave a Lasting Impression Everywhere You Go."</p>
          <Link to="/shop" className="btn btn-gold btn-lg">
            Explore Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
