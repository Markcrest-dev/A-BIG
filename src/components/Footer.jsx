import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-icon">✦</span>
          <h3>A-BIG Glow & Scents</h3>
          <p className="footer-quote">"Leave a Lasting Impression Everywhere You Go."</p>
        </div>

        <div className="footer-info">
          <div className="footer-col">
            <h4>Contact</h4>
            <p>📞 0704 027 3131</p>
            <p>📞 0816 449 1568</p>
          </div>
          <div className="footer-col">
            <h4>Location</h4>
            <p>📍 Lagos, Nigeria</p>
            <p>🚚 Nationwide Delivery</p>
          </div>
          <div className="footer-col">
            <h4>For</h4>
            <p>👨 Men</p>
            <p>👩 Women</p>
          </div>
        </div>

        <div className="divider" />

        <p className="footer-tagline">
          Authentic Products. Exceptional Quality. Unmatched Experience.
        </p>
        <p className="footer-copy">© {new Date().getFullYear()} A-BIG Glow & Scents. All rights reserved.</p>
      </div>
    </footer>
  );
}
