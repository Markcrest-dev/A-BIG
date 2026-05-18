import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { 
  User as UserIcon, 
  Lock, 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { currentUser } = useAuth();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'preferences'
  
  // Profile Form States
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [skinType, setSkinType] = useState('normal');
  const [scentPref, setScentPref] = useState('woody');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  
  // Re-Authentication Modal States
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [showReauthPass, setShowReauthPass] = useState(false);
  const [reauthProcessing, setReauthProcessing] = useState(false);
  const [reauthError, setReauthError] = useState('');

  // Preferences Form States
  const [scentNewsletter, setScentNewsletter] = useState(true);
  const [smsUpdates, setSmsUpdates] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [preferencesSuccess, setPreferencesSuccess] = useState('');

  // 1. Fetch Profile and Preferences from Firestore & fallback to LocalStorage
  useEffect(() => {
    if (!currentUser) return;

    const loadUserData = async () => {
      setLoadingProfile(true);
      try {
        // A. Load from Firestore
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        let profileData = null;
        if (docSnap.exists()) {
          profileData = docSnap.data();
        } else {
          // Fallback to localStorage
          const savedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
          if (savedProfile) {
            profileData = JSON.parse(savedProfile);
          }
        }

        if (profileData) {
          setDisplayName(profileData.displayName || '');
          setPhoneNumber(profileData.phoneNumber || '');
          setAddress(profileData.address || '');
          setSkinType(profileData.skinType || 'normal');
          setScentPref(profileData.scentPref || 'woody');
          
          // Load preferences
          setScentNewsletter(profileData.scentNewsletter !== undefined ? profileData.scentNewsletter : true);
          setSmsUpdates(profileData.smsUpdates !== undefined ? profileData.smsUpdates : false);
          setEnableAnimations(profileData.enableAnimations !== undefined ? profileData.enableAnimations : true);
        } else {
          // Default displayName from email
          const parts = currentUser.email.split('@')[0];
          setDisplayName(parts.charAt(0).toUpperCase() + parts.slice(1));
        }
      } catch (err) {
        console.error('Failed to load user profile from Firestore', err);
        // Fallback to local storage
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
            console.error('Failed to parse local storage profile', e);
          }
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserData();
  }, [currentUser]);

  // 2. Save Profile Details (Firestore + LocalStorage)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    try {
      if (!currentUser) throw new Error('No active user session.');

      const profileData = {
        displayName,
        phoneNumber,
        address,
        skinType,
        scentPref,
        scentNewsletter,
        smsUpdates,
        enableAnimations,
        updatedAt: new Date().toISOString()
      };

      // Save to LocalStorage
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(profileData));

      // Save to Firestore
      await setDoc(doc(db, 'profiles', currentUser.uid), profileData, { merge: true });

      setProfileSuccess('Personal details synced and updated successfully! ✨');
    } catch (err) {
      console.error('Error saving profile:', err);
      let userFriendlyError = err.message || 'Failed to save profile details.';
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        userFriendlyError = 'Permission denied. ⚠️ Please verify your Firestore rules allow writes to /profiles/{uid} for authenticated owners.';
      }
      setProfileError(userFriendlyError);
    } finally {
      setSavingProfile(false);
    }
  };

  // 3. Security Re-Authentication Flow
  const performReauth = async () => {
    if (!currentUser || !reauthPassword) return false;
    setReauthProcessing(true);
    setReauthError('');

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, reauthPassword);
      await reauthenticateWithCredential(currentUser, credential);
      setReauthPassword('');
      setShowReauthModal(false);
      return true;
    } catch (err) {
      console.error('Re-auth failed:', err);
      setReauthError(err.message?.includes('auth/wrong-password') || err.message?.includes('invalid-credential')
        ? 'Incorrect current password. Please try again. ⚠️'
        : 'Re-authentication failed: ' + (err.message || 'Unknown error'));
      return false;
    } finally {
      setReauthProcessing(false);
    }
  };

  // 4. Update Password Flow
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSecuritySuccess('');
    setSecurityError('');

    if (newPassword !== confirmPassword) {
      setSecurityError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('Password must be at least 6 characters long.');
      return;
    }

    setUpdatingPass(true);

    try {
      if (!currentUser) throw new Error('No active user session.');
      
      // Attempt to update password directly
      await updatePassword(currentUser, newPassword);
      
      setSecuritySuccess('Password updated successfully! 🔒');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      console.error('Password update failed:', err);
      
      // Firebase throws requires-recent-login when session is old
      if (err.code === 'auth/requires-recent-login' || err.message?.includes('recent-login')) {
        // Trigger Re-Authentication modal
        setSecurityError('For security reasons, changing your password requires recent authentication. Please verify your current password below:');
        setShowReauthModal(true);
      } else {
        setSecurityError(err.message || 'Failed to update password.');
      }
    } finally {
      setUpdatingPass(false);
    }
  };

  // 5. Complete password update after successful inline re-auth
  const handleReauthSubmit = async (e) => {
    e.preventDefault();
    const reauthenticated = await performReauth();
    if (reauthenticated) {
      setUpdatingPass(true);
      try {
        await updatePassword(currentUser, newPassword);
        setSecuritySuccess('Re-authentication verified. Password updated successfully! 🔒');
        setSecurityError('');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      } catch (err) {
        setSecurityError('Re-authentication succeeded, but password update failed: ' + (err.message || 'Please try again.'));
      } finally {
        setUpdatingPass(false);
      }
    }
  };

  // 6. Save System Preferences
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPreferencesSuccess('');
    
    try {
      if (!currentUser) throw new Error('No active session.');
      const profileData = {
        displayName,
        phoneNumber,
        address,
        skinType,
        scentPref,
        scentNewsletter,
        smsUpdates,
        enableAnimations,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(profileData));
      await setDoc(doc(db, 'profiles', currentUser.uid), profileData, { merge: true });
      
      setPreferencesSuccess('App preferences saved successfully! ✨');
      setTimeout(() => setPreferencesSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-page container fade-in">
      <div className="settings-header-section">
        <h2>Account Settings</h2>
        <div className="gold-line" />
      </div>

      <div className="settings-layout">
        {/* Settings Sidebar Tabs */}
        <aside className="settings-sidebar card glass">
          <div className="sidebar-header">
            <div className="settings-avatar-wrap">
              {displayName ? displayName.substring(0, 2).toUpperCase() : 'CU'}
            </div>
            <h4>{displayName || 'Customer'}</h4>
            <p>{currentUser?.email}</p>
          </div>
          <div className="sidebar-links">
            <button 
              className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserIcon size={18} />
              <span>Personal Details</span>
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} />
              <span>Security & Password</span>
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <Sliders size={18} />
              <span>Preferences</span>
            </button>
          </div>
        </aside>

        {/* Settings Main Content Area */}
        <main className="settings-content card glass">
          {loadingProfile ? (
            <div className="settings-loading">
              <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: '20px' }} />
              <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: '30px' }} />
              <div className="skeleton" style={{ height: 60, marginBottom: '20px' }} />
              <div className="skeleton" style={{ height: 60, marginBottom: '20px' }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ) : (
            <>
              {/* Profile Details Tab Content */}
              {activeTab === 'profile' && (
                <div className="tab-pane">
                  <h3>Personal Details</h3>
                  <p className="section-subtitle">Manage your profile details and signature scent profile.</p>
                  <div className="divider" style={{ margin: '20px 0' }} />

                  <form onSubmit={handleSaveProfile} className="settings-form">
                    {profileSuccess && (
                      <div className="form-success feedback-msg">
                        <CheckCircle size={18} />
                        <span>{profileSuccess}</span>
                      </div>
                    )}
                    {profileError && (
                      <div className="form-error feedback-msg">
                        <AlertCircle size={18} />
                        <span>{profileError}</span>
                      </div>
                    )}

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
                          title="Primary login email cannot be changed"
                          style={{ opacity: 0.5, cursor: 'not-allowed' }}
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

                      <div className="form-row-2">
                        <div className="input-group">
                          <label>Scent Preference</label>
                          <select
                            className="input-field"
                            value={scentPref}
                            onChange={(e) => setScentPref(e.target.value)}
                          >
                            <option value="woody">Woody & Warm (Oud, Sandalwood)</option>
                            <option value="floral">Floral & Sweet (Rose, Jasmine)</option>
                            <option value="fresh">Fresh & Citrusy (Bergamot, Mint)</option>
                            <option value="oriental">Oriental & Spicy (Amber, Vanilla)</option>
                          </select>
                        </div>

                        <div className="input-group">
                          <label>Skin Type</label>
                          <select
                            className="input-field"
                            value={skinType}
                            onChange={(e) => setSkinType(e.target.value)}
                          >
                            <option value="normal">Normal</option>
                            <option value="dry">Dry (Scent evaporates faster)</option>
                            <option value="oily">Oily (Scent lasts longer)</option>
                            <option value="sensitive">Sensitive</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Shipping Address</label>
                        <textarea
                          className="input-field"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter your complete home/office physical delivery address"
                          style={{ minHeight: '80px' }}
                        />
                      </div>
                    </div>

                    <div className="divider" style={{ margin: '30px 0' }} />

                    <button disabled={savingProfile} type="submit" className="btn btn-gold btn-md">
                      {savingProfile ? 'Saving Details...' : 'Save Settings'}
                    </button>
                  </form>
                </div>
              )}

              {/* Security & Password Tab Content */}
              {activeTab === 'security' && (
                <div className="tab-pane animate-fade-in">
                  <h3>Security & Authentication</h3>
                  <p className="section-subtitle">Secure your profile by periodically changing your password details.</p>
                  <div className="divider" style={{ margin: '20px 0' }} />

                  <form onSubmit={handleUpdatePassword} className="settings-form">
                    {securitySuccess && (
                      <div className="form-success feedback-msg">
                        <CheckCircle size={18} />
                        <span>{securitySuccess}</span>
                      </div>
                    )}
                    {securityError && (
                      <div className="form-error feedback-msg">
                        <AlertCircle size={18} />
                        <span>{securityError}</span>
                      </div>
                    )}

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                      <div className="input-group pass-group">
                        <label>New Password</label>
                        <div className="password-input-wrap">
                          <input
                            className="input-field"
                            type={showNewPass ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter at least 6 characters"
                            required
                          />
                          <button 
                            type="button" 
                            className="pass-toggle-btn"
                            onClick={() => setShowNewPass(!showNewPass)}
                          >
                            {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="input-group pass-group">
                        <label>Confirm New Password</label>
                        <div className="password-input-wrap">
                          <input
                            className="input-field"
                            type={showConfirmPass ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type your new password"
                            required
                          />
                          <button 
                            type="button" 
                            className="pass-toggle-btn"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                          >
                            {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="divider" style={{ margin: '30px 0' }} />

                    <button disabled={updatingPass} type="submit" className="btn btn-gold btn-md">
                      {updatingPass ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Preferences Tab Content */}
              {activeTab === 'preferences' && (
                <div className="tab-pane">
                  <h3>System Preferences</h3>
                  <p className="section-subtitle">Customize application settings and notifications.</p>
                  <div className="divider" style={{ margin: '20px 0' }} />

                  <form onSubmit={handleSavePreferences} className="settings-form">
                    {preferencesSuccess && (
                      <div className="form-success feedback-msg">
                        <CheckCircle size={18} />
                        <span>{preferencesSuccess}</span>
                      </div>
                    )}

                    <div className="preferences-list">
                      <div className="preference-item card">
                        <div className="pref-info">
                          <h4>Scent & Glow Newsletters</h4>
                          <p>Receive exclusive discount offers, customized perfume catalogs, and skincare guides.</p>
                        </div>
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={scentNewsletter} 
                            onChange={(e) => setScentNewsletter(e.target.checked)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="preference-item card">
                        <div className="pref-info">
                          <h4>Order SMS Notifications</h4>
                          <p>Get live dispatch tracking messages on your mobile number after secure purchases.</p>
                        </div>
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={smsUpdates} 
                            onChange={(e) => setSmsUpdates(e.target.checked)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="preference-item card">
                        <div className="pref-info">
                          <h4>Premium Visual Animations</h4>
                          <p>Enjoy floating luxury particle effects, layout shimmers, and rich image hovers.</p>
                        </div>
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={enableAnimations} 
                            onChange={(e) => setEnableAnimations(e.target.checked)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>

                    <div className="divider" style={{ margin: '30px 0' }} />

                    <button type="submit" className="btn btn-gold btn-md">
                      Save Preferences
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Inline Security Re-Authentication Modal */}
      {showReauthModal && (
        <div className="modal-overlay" onClick={() => setShowReauthModal(false)}>
          <div className="modal-content reauth-modal" onClick={e => e.stopPropagation()}>
            <button className="wa-close" onClick={() => setShowReauthModal(false)}>✕</button>
            <div className="reauth-header">
              <span className="reauth-icon">🔒</span>
              <h3>Confirm Current Password</h3>
              <p className="reauth-subtitle">
                For security reasons, please confirm your current password to authorize this sensitive credential modification.
              </p>
            </div>

            {reauthError && (
              <div className="form-error feedback-msg" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>{reauthError}</span>
              </div>
            )}

            <form onSubmit={handleReauthSubmit} className="reauth-form">
              <div className="input-group pass-group">
                <label>Current Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showReauthPass ? 'text' : 'password'}
                    className="input-field"
                    value={reauthPassword}
                    onChange={e => setReauthPassword(e.target.value)}
                    placeholder="Enter your current account password"
                    required
                  />
                  <button 
                    type="button" 
                    className="pass-toggle-btn"
                    onClick={() => setShowReauthPass(!showReauthPass)}
                  >
                    {showReauthPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  onClick={() => setShowReauthModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={reauthProcessing} 
                  className="btn btn-gold" 
                  style={{ flex: 1 }}
                >
                  {reauthProcessing ? 'Verifying...' : 'Verify password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
