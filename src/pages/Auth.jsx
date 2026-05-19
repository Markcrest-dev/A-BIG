import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  AtSign
} from 'lucide-react';
import logoImg from '../assets/images/a_big_logo.png';
import './Auth.css';

export default function Auth() {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Extra signup fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { login, signup, resetPassword } = useAuth();

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccessMsg('A password reset link has been sent to your email address! Please check your inbox and spam folders.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account matches this email address. Try checking the email spelling or Sign Up.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    try {
      if (authMode === 'login') {
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
              const res = await signup(email, password);
              // Setup default admin profile
              await setDoc(doc(db, 'profiles', res.user.uid), {
                displayName: 'Administrator',
                username: 'admin',
                phoneNumber: '0000000000',
                email: email,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                skinType: 'normal',
                scentPref: 'woody',
                scentNewsletter: true,
                smsUpdates: false,
                enableAnimations: true
              });
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
            if (loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/wrong-password') {
              throw new Error("Invalid email or password. If this is your first time logging in as admin, double check your credentials or try Signing Up.");
            }
            throw loginErr;
          }
        }
      } else {
        // Sign Up Mode validation
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match. Please verify.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        if (phoneNumber.trim().length < 8) {
          throw new Error("Please enter a valid phone number (at least 8 digits).");
        }
        if (username.trim().length < 3) {
          throw new Error("Username must be at least 3 characters.");
        }
        if (name.trim().length < 2) {
          throw new Error("Name must be at least 2 characters.");
        }

        try {
          const userCredential = await signup(email, password);
          const user = userCredential.user;
          
          // Store all user profile data immediately in Firestore
          await setDoc(doc(db, 'profiles', user.uid), {
            displayName: name,
            username: username.replace('@', '').trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            skinType: 'normal',
            scentPref: 'woody',
            scentNewsletter: true,
            smsUpdates: false,
            enableAnimations: true
          });
        } catch (signupErr) {
          if (signupErr.code === 'auth/operation-not-allowed') {
            throw new Error("Firebase Email/Password authentication is disabled. Please enable it in the Firebase Console.");
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
  
  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-showcase-panel">
        <div className="auth-glow-overlay" />
        <div className="auth-particles">
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
        </div>
        <div className="showcase-content">
          <div className="showcase-brand">
            <img src={logoImg} alt="A-BIG Logo" className="showcase-logo" />
            <h1 className="showcase-title">A-BIG GLOW & SCENTS</h1>
            <div className="showcase-divider" />
          </div>
          <div className="showcase-info-card glass">
            <Sparkles className="showcase-card-icon" size={32} />
            <h3>Experience Bespoke Luxury</h3>
            <p>Unlock custom fragrance matchmaking, tailored organic skincare routines, and secure shopping with lightning fast physical delivery tracking.</p>
            
            <div className="showcase-features">
              <div className="feature-item">
                <span className="feature-dot"></span>
                <span>Premium Quality Oud & Scents</span>
              </div>
              <div className="feature-item">
                <span className="feature-dot"></span>
                <span>Bespoke Skincare Selections</span>
              </div>
              <div className="feature-item">
                <span className="feature-dot"></span>
                <span>Personalized User Profiles</span>
              </div>
            </div>
          </div>
          <div className="showcase-footer">
            <p>© 2026 A-BIG Glow & Scents. All rights reserved.</p>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-glow" />
        <div className="auth-form-card glass">
          
          {authMode === 'login' && (
            <div className="auth-form-section">
              <div className="auth-form-header">
                <h2>Welcome Back</h2>
                <p>Login to your premium account to access your curated orders</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form-element">
                {error && (
                  <div className="form-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="input-group">
                  <label><Mail size={14} style={{ marginRight: '6px' }} /> Email Address</label>
                  <input
                    className="input-field"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="e.g. name@example.com"
                    required
                  />
                </div>

                <div className="input-group">
                  <div className="label-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label><Lock size={14} style={{ marginRight: '6px' }} /> Password</label>
                    <button 
                      type="button" 
                      className="forgot-password-link"
                      onClick={() => switchMode('forgot')}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="password-wrapper" style={{ position: 'relative', width: '100%' }}>
                    <input
                      className="input-field"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter password"
                      required
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="btn btn-gold btn-lg auth-submit-btn">
                  {loading ? 'Logging In...' : 'Log In'}
                </button>
              </form>

              <div className="auth-mode-footer">
                <span>Don't have an account yet? </span>
                <button type="button" className="toggle-btn" onClick={() => switchMode('signup')}>
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {authMode === 'signup' && (
            <div className="auth-form-section">
              <div className="auth-form-header">
                <h2>Create Premium Account</h2>
                <p>Register to customize perfume collections and track skincare purchases</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form-element">
                {error && (
                  <div className="form-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="form-grid-row">
                  <div className="input-group">
                    <label><User size={14} style={{ marginRight: '6px' }} /> Full Name</label>
                    <input
                      className="input-field"
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(''); }}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label><AtSign size={14} style={{ marginRight: '6px' }} /> Username</label>
                    <input
                      className="input-field"
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(''); }}
                      placeholder="e.g. johndoe"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-row">
                  <div className="input-group">
                    <label><Smartphone size={14} style={{ marginRight: '6px' }} /> Phone Number</label>
                    <input
                      className="input-field"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
                      placeholder="e.g. +234 812 345 6789"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label><Mail size={14} style={{ marginRight: '6px' }} /> Email Address</label>
                    <input
                      className="input-field"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="e.g. john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-row">
                  <div className="input-group">
                    <label><Lock size={14} style={{ marginRight: '6px' }} /> Password</label>
                    <div className="password-wrapper" style={{ position: 'relative', width: '100%' }}>
                      <input
                        className="input-field"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Min 6 chars"
                        required
                        style={{ paddingRight: '45px' }}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label><Lock size={14} style={{ marginRight: '6px' }} /> Confirm Password</label>
                    <div className="password-wrapper" style={{ position: 'relative', width: '100%' }}>
                      <input
                        className="input-field"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Re-enter password"
                        required
                        style={{ paddingRight: '45px' }}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="btn btn-gold btn-lg auth-submit-btn" style={{ marginTop: '0.5rem' }}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <div className="auth-mode-footer">
                <span>Already have an account? </span>
                <button type="button" className="toggle-btn" onClick={() => switchMode('login')}>
                  Log In
                </button>
              </div>
            </div>
          )}

          {authMode === 'forgot' && (
            <div className="auth-form-section">
              <div className="auth-form-header">
                <h2>Reset Password</h2>
                <p>Enter your email address and we'll send you a secure link to reset your password</p>
              </div>

              {successMsg ? (
                <div className="auth-success-state">
                  <div className="success-icon-wrapper">
                    <CheckCircle className="success-check-icon" size={48} />
                  </div>
                  <h3>Link Dispatched!</h3>
                  <p>{successMsg}</p>
                  <button 
                    type="button" 
                    className="btn btn-gold btn-md" 
                    onClick={() => switchMode('login')}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    Back to Log In
                  </button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleResetPasswordSubmit} className="auth-form-element">
                    {error && (
                      <div className="form-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                      </div>
                    )}
                    
                    <div className="input-group">
                      <label><Mail size={14} style={{ marginRight: '6px' }} /> Email Address</label>
                      <input
                        className="input-field"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="e.g. name@example.com"
                        required
                      />
                    </div>

                    <button disabled={loading} type="submit" className="btn btn-gold btn-lg auth-submit-btn">
                      {loading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                  </form>

                  <div className="auth-mode-footer">
                    <button type="button" className="toggle-btn back-btn" onClick={() => switchMode('login')}>
                      <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Log In
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

