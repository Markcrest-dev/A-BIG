import './Loader.css';

export default function Loader({ count = 6 }) {
  return (
    <div className="loader-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="loader-card card">
          <div className="skeleton loader-img" />
          <div className="loader-body">
            <div className="skeleton loader-line loader-line-title" />
            <div className="skeleton loader-line loader-line-price" />
            <div className="skeleton loader-line loader-line-desc" />
            <div className="skeleton loader-line loader-line-btn" />
          </div>
        </div>
      ))}
    </div>
  );
}
