import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    try {
      if (isLogin) {
        try {
          await login(email, password);
        } catch (loginErr) {
          // If the user tried to login with the correct admin credentials but the account doesn't exist yet,
          // automatically attempt to sign them up to create the account.
          if (
            email.toLowerCase() === adminEmail.toLowerCase() &&
            adminPassword &&
            password === adminPassword &&
            (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/user-disabled')
          ) {
            try {
              await signup(email, password);
            } catch (signupErr) {
              if (signupErr.code === 'auth/operation-not-allowed') {
                throw new Error("Firebase Email/Password authentication is disabled. Please enable it in the Firebase Console (Authentication > Sign-in method).");
              }
              throw signupErr;
            }
          } else {
            if (loginErr.code === 'auth/operation-not-allowed') {
              throw new Error("Firebase Email/Password authentication is disabled. Please enable it in the Firebase Console (Authentication > Sign-in method).");
            }
            // Standardize some cryptic Firebase error messages for better UX
            if (loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/wrong-password') {
              throw new Error("Invalid email or password. If this is your first time logging in as admin, double check your credentials or try Signing Up.");
            }
            throw loginErr;
          }
        }
      } else {
        try {
          await signup(email, password);
        } catch (signupErr) {
          if (signupErr.code === 'auth/operation-not-allowed') {
            throw new Error("Firebase Email/Password authentication is disabled. Please enable it in the Firebase Console (Authentication > Sign-in method).");
          }
          if (signupErr.code === 'auth/email-already-in-use') {
            throw new Error("An account with this email already exists. Try logging in instead.");
          }
          throw signupErr;
        }
      }
      
      if (email.toLowerCase() === adminEmail.toLowerCase()) {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card glass">
        <div className="auth-header">
          <span className="auth-icon">{isLogin ? '🔑' : '✨'}</span>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Enter your details to access your account' : 'Join A-BIG Glow & Scents today'}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-error">{error}</div>}
          <div className="input-group">
            <label>Email</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper" style={{ position: 'relative', width: '100%' }}>
              <input
                className="input-field"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter your password"
                required
                minLength="6"
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'color 0.2s, opacity 0.2s',
                  opacity: 0.8
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button disabled={loading} type="submit" className="btn btn-gold btn-lg" style={{ width: '100%' }}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
        
        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            className="toggle-btn" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}
