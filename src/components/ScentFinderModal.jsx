import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Sparkles, Check, Heart, ShieldCheck, ShoppingCart, Info, RotateCcw, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ScentFinderModal.css';

export default function ScentFinderModal({ onClose, onViewProductDetails }) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Quiz State
  const [answers, setAnswers] = useState({
    preference: '',  // 'him' | 'her' | 'unisex'
    family: '',      // 'woody' | 'floral' | 'gourmand' | 'fresh'
    intensity: ''    // 'subtle' | 'moderate' | 'strong'
  });

  const [recommendation, setRecommendation] = useState(null);
  const [matchReason, setMatchReason] = useState('');

  // Fetch actual products from Firestore to ensure real-time recommendation matching
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(items);
      setLoading(false);
    }, (err) => {
      console.error('Scent Finder failed to load products:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSelectOption = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    // Auto-advance to next step with a smooth micro-delay
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 300);
  };

  // Run the premium scent-matching engine
  useEffect(() => {
    if (currentStep === 4 && products.length > 0) {
      findBestMatch();
    }
  }, [currentStep, products]);

  const findBestMatch = () => {
    const { preference, family, intensity } = answers;
    
    // Filtering logic
    let candidate = null;
    let maxScore = -1;
    let reason = '';

    products.forEach(p => {
      let score = 0;
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const category = (p.category || '').toLowerCase();

      // Skip non-scent items
      if (category !== 'perfume' && category !== 'body spray' && !name.includes('scent') && !name.includes('perfume') && !name.includes('spray')) {
        return;
      }

      // Vibe alignment
      if (preference === 'her') {
        if (name.includes('her') || desc.includes('women') || desc.includes('floral') || desc.includes('rose') || desc.includes('sweet') || name.includes('rose')) {
          score += 3;
        }
      } else if (preference === 'him') {
        if (name.includes('him') || desc.includes('men') || desc.includes('woody') || desc.includes('oud') || desc.includes('commanding') || name.includes('oud')) {
          score += 3;
        }
      } else {
        score += 2; // unisex match
      }

      // Olfactory Family alignment
      if (family === 'woody') {
        if (name.includes('oud') || desc.includes('oud') || name.includes('wood') || desc.includes('wood') || desc.includes('saffron') || desc.includes('spic')) {
          score += 5;
        }
      } else if (family === 'floral') {
        if (name.includes('rose') || desc.includes('rose') || name.includes('pink') || desc.includes('pink') || desc.includes('floral') || desc.includes('flower') || desc.includes('jasmine')) {
          score += 5;
        }
      } else if (family === 'gourmand') {
        if (name.includes('vanilla') || desc.includes('vanilla') || name.includes('gold') || desc.includes('gold') || desc.includes('sweet') || desc.includes('caramel') || desc.includes('amber')) {
          score += 5;
        }
      } else if (family === 'fresh') {
        if (name.includes('fresh') || desc.includes('fresh') || name.includes('blue') || desc.includes('blue') || desc.includes('mint') || desc.includes('citrus') || name.includes('spray')) {
          score += 5;
        }
      }

      // Select candidate with the highest compatibility score
      if (score > maxScore) {
        maxScore = score;
        candidate = p;
      }
    });

    // Fallback if no specific perfume fits
    if (!candidate) {
      // Grab any perfume or spray
      candidate = products.find(p => {
        const cat = (p.category || '').toLowerCase();
        return cat === 'perfume' || cat === 'body spray';
      }) || products[0];
    }

    // Formulate a beautiful, authentic narrative explanation
    if (candidate) {
      const pName = candidate.name;
      if (family === 'woody') {
        reason = `Based on your love for bold, warm, and sophisticated notes, "${pName}" is your perfect match. Its rich elements of precious woods and spice will leave a powerful, commanding, and extremely premium impression.`;
      } else if (family === 'floral') {
        reason = `Because you appreciate delicate romance and elegant florals, "${pName}" aligns beautifully. The exquisite bouquet of high-grade roses and fresh blossoms captures a radiant signature glow.`;
      } else if (family === 'gourmand') {
        reason = `For your sweet, inviting, and comforting aesthetic, "${pName}" is a match made in heaven. Its warm Madagascar vanilla extracts and rich caramel elements deliver an addictive, luxurious sillage.`;
      } else {
        reason = `Your active, refreshing, and clean preferences lead perfectly to "${pName}". Loaded with zesty mint and fresh marine components, it provides a clean, elegant energy that lasts all day.`;
      }
    }

    setRecommendation(candidate);
    setMatchReason(reason);
  };

  const handleReset = () => {
    setAnswers({ preference: '', family: '', intensity: '' });
    setRecommendation(null);
    setMatchReason('');
    setCurrentStep(1);
  };

  const handleAddToCartClick = () => {
    if (!recommendation) return;
    addToCart(recommendation);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 2000);
  };

  const handleViewDetails = () => {
    if (!recommendation) return;
    onViewProductDetails(recommendation);
    onClose();
  };

  return (
    <div className="scent-quiz-overlay" onClick={onClose}>
      <div className="scent-quiz-content glass fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Close */}
        <button className="scent-quiz-close" onClick={onClose}>✕</button>

        {/* Quiz Steps */}
        {currentStep === 1 && (
          <div className="quiz-step-pane text-center">
            <span className="quiz-badge"><Sparkles size={14} /> Scent Consultation</span>
            <h3>Whom are we shopping for today?</h3>
            <p className="quiz-lead-text">Choose the style profile that matches your presence.</p>
            <div className="quiz-options-grid">
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('preference', 'her')}
              >
                <div className="quiz-option-icon">🌸</div>
                <h4>For Her</h4>
                <p>Delicate, radiant, and elegant floral blends</p>
              </button>
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('preference', 'him')}
              >
                <div className="quiz-option-icon">🪵</div>
                <h4>For Him</h4>
                <p>Bold, dark, sophisticated, and commanding blends</p>
              </button>
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('preference', 'unisex')}
              >
                <div className="quiz-option-icon">✨</div>
                <h4>Unisex / Everyone</h4>
                <p>Modern, fresh, and harmonized signatures</p>
              </button>
            </div>
            <div className="quiz-progress-bar"><div className="progress-fill" style={{ width: '25%' }} /></div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="quiz-step-pane text-center">
            <span className="quiz-badge">Fragrance Vibe</span>
            <h3>Select your favorite sensory family</h3>
            <p className="quiz-lead-text">Which atmosphere speaks to your current mood?</p>
            <div className="quiz-options-grid quiz-grid-2x2">
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('family', 'woody')}
              >
                <div className="quiz-option-icon">🔥</div>
                <h4>Woody & Spicy</h4>
                <p>Oud, saffron, patchouli, amber warmth</p>
              </button>
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('family', 'floral')}
              >
                <div className="quiz-option-icon">💐</div>
                <h4>Floral & Sweet</h4>
                <p>Rose, peony, absolute jasmine, romance</p>
              </button>
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('family', 'gourmand')}
              >
                <div className="quiz-option-icon">🍦</div>
                <h4>Warm & Gourmand</h4>
                <p>Vanilla extract, caramel, delicious sillage</p>
              </button>
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('family', 'fresh')}
              >
                <div className="quiz-option-icon">🍃</div>
                <h4>Fresh & Aquatic</h4>
                <p>Mint leaves, citrus peel, crisp breeze</p>
              </button>
            </div>
            <div className="quiz-progress-bar"><div className="progress-fill" style={{ width: '50%' }} /></div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="quiz-step-pane text-center">
            <span className="quiz-badge">Sillage & Longevity</span>
            <h3>How do you want to be noticed?</h3>
            <p className="quiz-lead-text">Choose the level of projection that feels authentic to you.</p>
            <div className="quiz-options-grid">
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('intensity', 'subtle')}
              >
                <div className="quiz-option-icon">💨</div>
                <h4>Subtle & Intimate</h4>
                <p>Gently lingers close to the skin, discovered only when near</p>
              </button>
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('intensity', 'moderate')}
              >
                <div className="quiz-option-icon">🌟</div>
                <h4>Moderate & Elegant</h4>
                <p>Creates a beautifully balanced, premium presence all day</p>
              </button>
              <button 
                className="quiz-option-card glass" 
                onClick={() => handleSelectOption('intensity', 'strong')}
              >
                <div className="quiz-option-icon">👑</div>
                <h4>Strong & Commanding</h4>
                <p>Leaves a powerful, unforgettable, and magnetic tail</p>
              </button>
            </div>
            <div className="quiz-progress-bar"><div className="progress-fill" style={{ width: '75%' }} /></div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="quiz-step-pane recommendation-pane text-center">
            {loading ? (
              <div className="quiz-loader" style={{ padding: '60px 0' }}>
                <Sparkles size={40} className="text-gold" style={{ animation: 'spin 2s linear infinite' }} />
                <p style={{ marginTop: '16px', color: 'var(--gold)' }}>Consulting our Scent Vault...</p>
              </div>
            ) : recommendation ? (
              <>
                <span className="quiz-badge"><Heart size={12} className="text-gold" /> Your Signature Match</span>
                <h3>Your Signature Scent is Found!</h3>
                <p className="quiz-lead-text">Meet the fragrance designed to mirror your character.</p>

                {/* Match Card */}
                <div className="recommendation-card glass fade-in">
                  <div className="recommendation-visual">
                    {recommendation.mediaUrl && (
                      <img src={recommendation.mediaUrl} alt={recommendation.name} />
                    )}
                  </div>
                  <div className="recommendation-details text-left">
                    <span className="recommendation-category">{recommendation.category}</span>
                    <h4>{recommendation.name}</h4>
                    <p className="recommendation-price">₦{recommendation.price.toLocaleString()}</p>
                    <p className="recommendation-reason">
                      <span className="quote-mark">“</span>{matchReason}<span className="quote-mark">”</span>
                    </p>
                    
                    <div className="recommendation-badges">
                      <span>✦ Premium Concentrates</span>
                      <span>✦ 10+ Hours Longevity</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="quiz-actions-row">
                  <button onClick={handleReset} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <RotateCcw size={16} /> Retake Quiz
                  </button>
                  <button onClick={handleViewDetails} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={16} /> View Details
                  </button>
                  <button 
                    onClick={handleAddToCartClick} 
                    className={`btn btn-gold ${justAdded ? 'success-pop' : ''}`}
                    disabled={justAdded}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: '150px' }}
                  >
                    {justAdded ? (
                      <>
                        <Check size={16} /> Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} /> Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="quiz-error">
                <h3>Vault Connection Issue</h3>
                <p>We couldn't connect to our perfume archives. Please refresh and try again!</p>
                <button onClick={handleReset} className="btn btn-gold">Try Again</button>
              </div>
            )}
            <div className="quiz-progress-bar"><div className="progress-fill" style={{ width: '100%' }} /></div>
          </div>
        )}

      </div>
    </div>
  );
}
