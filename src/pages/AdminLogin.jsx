import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const adminPwd = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    if (password === adminPwd) {
      sessionStorage.setItem('abig_admin', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Incorrect password');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-glow" />
      <div className={`login-card glass ${shaking ? 'shake' : ''}`}>
        <div className="login-header">
          <span className="login-icon">🔐</span>
          <h2>Admin Access</h2>
          <p>Enter password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="form-error">{error}</div>}
          <div className="input-group">
            <label>Password</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-gold btn-lg" style={{ width: '100%' }}>
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
