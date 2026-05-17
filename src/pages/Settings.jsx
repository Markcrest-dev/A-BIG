import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

export default function Settings() {
  const { currentUser } = useAuth();
  
  // States for Profile Form
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [skinType, setSkinType] = useState('normal');
  const [scentPref, setScentPref] = useState('woody');
  
  // Feedback States
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Load profile from localStorage on component mount
  useEffect(() => {
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setDisplayName(parsed.displayName || '');
          setPhoneNumber(parsed.phoneNumber || '');
          setAddress(parsed.address || '');
          setSkinType(parsed.skinType || 'normal');
          setScentPref(parsed.scentPref || 'woody');
        } catch (e) {
          console.error('Failed to parse user profile', e);
        }
      } else {
        // Default displayName from email
        const parts = currentUser.email.split('@')[0];
        setDisplayName(parts.charAt(0).toUpperCase() + parts.slice(1));
      }
    }
  }, [currentUser]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    try {
      if (currentUser) {
        const profileData = {
          displayName,
          phoneNumber,
          address,
          skinType,
          scentPref
        };
        localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(profileData));
        setProfileSuccess('Profile updated successfully! ✨');
      } else {
        throw new Error('No logged in user found.');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile details');
    }
    setSavingProfile(false);
  };

  return (
    <div className="settings-page container fade-in">
      <div className="settings-header-section">
        <h2>Account Settings</h2>
        <div className="gold-line" />
      </div>

      <div className="settings-layout">
        {/* Navigation Sidebar */}
        <aside className="settings-sidebar card glass">
          <div className="sidebar-header">
            <span className="sidebar-avatar">👤</span>
            <h4>{displayName || 'Customer'}</h4>
            <p>{currentUser?.email}</p>
          </div>
          <div className="sidebar-links">
            <button className="sidebar-link active">Profile & Details</button>
            <button className="sidebar-link disabled" disabled>Orders & History (Coming Soon)</button>
            <button className="sidebar-link disabled" disabled>Payment Methods (Coming Soon)</button>
          </div>
        </aside>

        {/* Settings Form Content */}
        <main className="settings-content card glass">
          <h3>Personal Details</h3>
          <p className="section-subtitle">Manage your profile details and shopping preferences.</p>
          <div className="divider" style={{ margin: '20px 0' }} />

          <form onSubmit={handleSaveProfile} className="settings-form">
            {profileSuccess && <div className="form-success">{profileSuccess}</div>}
            {profileError && <div className="form-error">{profileError}</div>}

            <div className="form-grid">
              <div className="input-group">
                <label>Display Name</label>
                <input
                  className="input-field"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input
                  className="input-field"
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  title="Email cannot be changed"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="input-group">
                <label>Phone Number</label>
                <input
                  className="input-field"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0812 345 6789"
                />
              </div>

              <div className="input-group">
                <label>Scent Preference</label>
                <select
                  className="input-field"
                  value={scentPref}
                  onChange={(e) => setScentPref(e.target.value)}
                >
                  <option value="woody">Woody & Warm</option>
                  <option value="floral">Floral & Sweet</option>
                  <option value="fresh">Fresh & Citrusy</option>
                  <option value="oriental">Oriental & Spicy</option>
                </select>
              </div>

              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Shipping Address</label>
                <textarea
                  className="input-field"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete delivery address"
                />
              </div>
            </div>

            <div className="divider" style={{ margin: '30px 0' }} />

            <button disabled={savingProfile} type="submit" className="btn btn-gold btn-md">
              {savingProfile ? 'Saving Details...' : 'Save Settings'}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
