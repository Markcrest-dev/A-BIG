import './WhatsAppModal.css';

export default function WhatsAppModal({ product, onClose }) {
  if (!product) return null;

  const message = encodeURIComponent(`Hi, I would like to order ${product.name}`);
  const numbers = [
    { display: '0704 027 3131', code: '2347040273131' },
    { display: '0816 449 1568', code: '2348164491568' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wa-modal" onClick={e => e.stopPropagation()}>
        <button className="wa-close" onClick={onClose}>✕</button>
        <div className="wa-header">
          <span className="wa-icon">💬</span>
          <h3>Order via WhatsApp</h3>
          <p className="wa-product-name">{product.name}</p>
        </div>
        <p className="wa-subtitle">Choose a number to place your order:</p>
        <div className="wa-buttons">
          {numbers.map(n => (
            <a
              key={n.code}
              href={`https://wa.me/${n.code}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold wa-btn"
            >
              <span className="wa-whatsapp-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.82-6.29-2.19l-.44-.37-3.24 1.086 1.086-3.24-.37-.44A9.95 9.95 0 0 1 2 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
                </svg>
              </span>
              {n.display}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
