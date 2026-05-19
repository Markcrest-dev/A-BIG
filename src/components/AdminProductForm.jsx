import { useState } from 'react';
import { uploadToCloudinary } from '../config/cloudinary';
import { Trash2, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import './AdminProductForm.css';

const CATEGORIES = ['Perfume', 'Body Spray', 'Cosmetics', 'Skincare', 'Hair Care', 'Other'];

export default function AdminProductForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    price: initial?.price || '',
    description: initial?.description || '',
    category: initial?.category || CATEGORIES[0],
    stock: initial?.stock !== undefined ? String(initial.stock) : '0',
  });
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.mediaUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Gallery and Variations states
  const [additionalMedia, setAdditionalMedia] = useState(initial?.additionalMedia || []);
  const [variations, setVariations] = useState(
    initial?.variations?.map(v => ({ ...v, stock: String(v.stock) })) || []
  );
  const [hasVariations, setHasVariations] = useState(
    initial?.variations && initial.variations.length > 0 ? true : false
  );
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [variationUploadingId, setVariationUploadingId] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  // Gallery operations
  const handleGalleryUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setGalleryUploading(true);
    setError('');
    try {
      const result = await uploadToCloudinary(f);
      setAdditionalMedia(prev => [...prev, {
        url: result.url,
        type: result.resourceType === 'raw' ? 'file' : result.resourceType
      }]);
    } catch (err) {
      console.error("Gallery upload error:", err);
      setError("Failed to upload gallery file: " + err.message);
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleRemoveGalleryItem = (indexToRemove) => {
    setAdditionalMedia(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Variations operations
  const handleAddVariation = () => {
    setVariations(prev => [
      ...prev,
      {
        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: '',
        stock: '0',
        mediaUrl: '',
        mediaType: 'image'
      }
    ]);
  };

  const handleVariationChange = (id, field, value) => {
    setVariations(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleRemoveVariation = (id) => {
    setVariations(prev => prev.filter(v => v.id !== id));
  };

  const handleVariationUpload = async (e, id) => {
    const f = e.target.files[0];
    if (!f) return;
    setVariationUploadingId(id);
    setError('');
    try {
      const result = await uploadToCloudinary(f);
      setVariations(prev => prev.map(v => v.id === id ? {
        ...v,
        mediaUrl: result.url,
        mediaType: result.resourceType === 'raw' ? 'file' : result.resourceType
      } : v));
    } catch (err) {
      console.error("Variation upload error:", err);
      setError("Failed to upload variation image: " + err.message);
    } finally {
      setVariationUploadingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.price) {
      setError('Name and Price are required.');
      return;
    }

    const priceVal = parseFloat(form.price);
    if (isNaN(priceVal) || priceVal <= 0) {
      setError('Price must be a valid positive number.');
      return;
    }

    let stockVal = 0;
    let finalVariations = [];

    if (hasVariations) {
      if (variations.length === 0) {
        setError('Please add at least one variation if variations are enabled.');
        return;
      }
      if (variations.some(v => !v.name.trim())) {
        setError('All variation names are required.');
        return;
      }
      if (variations.some(v => v.stock === '' || isNaN(parseInt(v.stock, 10)) || parseInt(v.stock, 10) < 0)) {
        setError('All variation stocks must be non-negative integers.');
        return;
      }
      
      // Stock is sum of all variation stocks
      stockVal = variations.reduce((sum, v) => sum + parseInt(v.stock, 10), 0);
      finalVariations = variations.map(v => ({
        ...v,
        name: v.name.trim(),
        stock: parseInt(v.stock, 10)
      }));
    } else {
      if (form.stock === '') {
        setError('Stock quantity is required.');
        return;
      }
      stockVal = parseInt(form.stock, 10);
      if (isNaN(stockVal) || stockVal < 0) {
        setError('Stock must be a non-negative integer.');
        return;
      }
    }

    if (!initial && !file) {
      setError('Please upload a main media file.');
      return;
    }

    try {
      let mediaUrl = initial?.mediaUrl || '';
      let mediaType = initial?.mediaType || 'image';

      if (file) {
        setUploading(true);
        const result = await uploadToCloudinary(file);
        mediaUrl = result.url;
        mediaType = result.resourceType === 'raw' ? 'file' : result.resourceType;
        setUploading(false);
      }

      await onSubmit({
        ...form,
        price: priceVal,
        stock: stockVal,
        mediaUrl,
        mediaType,
        additionalMedia,
        variations: finalVariations
      });
    } catch (err) {
      setUploading(false);
      
      let userFriendlyError = err.message || 'Something went wrong.';
      if (err.message?.includes('NOT_FOUND') || err.code === 'not-found') {
        userFriendlyError = 'Firestore database not found. ⚠️ Please go to the Firebase Console, select your project ("abig-glow-scents"), navigate to "Firestore Database" in the sidebar, and click "Create Database".';
      } else if (err.message?.includes('permission') || err.code === 'permission-denied') {
        userFriendlyError = 'Permission denied. ⚠️ Please check your Firestore Security Rules in the Firebase Console (Firestore Database > Rules) and ensure writes are permitted for authenticated admins.';
      }
      
      setError(userFriendlyError);
    }
  };

  const isLoading = loading || uploading || galleryUploading || variationUploadingId !== null;

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="input-group">
        <label>Product Name</label>
        <input className="input-field" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Royal Oud Perfume" />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Price (₦)</label>
          <input className="input-field" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 15000" />
        </div>
        <div className="input-group">
          <label>Category</label>
          <select className="input-field" name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Quantity in Stock</label>
          <input 
            type="number" 
            className="input-field" 
            name="stock" 
            value={hasVariations ? String(variations.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)) : form.stock} 
            onChange={handleChange} 
            placeholder="e.g. 10" 
            min="0" 
            step="1"
            disabled={hasVariations}
            style={hasVariations ? { opacity: 0.8, background: 'rgba(255,255,255,0.02)' } : {}}
          />
          {hasVariations && <span style={{ fontSize: '0.8rem', color: 'var(--gold)', marginTop: '4px' }}>Automatically calculated from variations stock.</span>}
        </div>
      </div>

      {/* Variations Section */}
      <div className="variations-section">
        <div className="toggle-wrapper">
          <input 
            type="checkbox" 
            id="hasVariations" 
            checked={hasVariations} 
            onChange={(e) => {
              setHasVariations(e.target.checked);
              if (e.target.checked && variations.length === 0) {
                handleAddVariation();
              }
            }} 
          />
          <label htmlFor="hasVariations">This product has different colors or variations (e.g. Black, Blue)</label>
        </div>

        {hasVariations && (
          <>
            <div className="variations-list">
              {variations.map((v) => (
                <div key={v.id} className="variation-row">
                  <div className="variation-media-preview">
                    {v.mediaUrl ? (
                      v.mediaType === 'video' ? (
                        <video src={v.mediaUrl} muted />
                      ) : (
                        <img src={v.mediaUrl} alt={v.name || 'Variation'} />
                      )
                    ) : (
                      <span className="variation-media-placeholder">No Image</span>
                    )}
                  </div>
                  
                  <input 
                    type="text" 
                    className="variation-input" 
                    value={v.name} 
                    onChange={(e) => handleVariationChange(v.id, 'name', e.target.value)} 
                    placeholder="Color / Variation name (e.g. Black)"
                  />
                  
                  <input 
                    type="number" 
                    className="variation-input" 
                    value={v.stock} 
                    onChange={(e) => handleVariationChange(v.id, 'stock', e.target.value)} 
                    placeholder="Stock Qty"
                    min="0"
                  />

                  <div className="variation-upload-btn-wrap">
                    <input 
                      type="file" 
                      id={`upload-${v.id}`} 
                      accept="image/*,video/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => handleVariationUpload(e, v.id)}
                    />
                    <label htmlFor={`upload-${v.id}`} className="variation-upload-btn">
                      {variationUploadingId === v.id ? '...' : (v.mediaUrl ? 'Change' : 'Upload')}
                    </label>
                  </div>

                  <button 
                    type="button" 
                    className="btn-delete-var" 
                    onClick={() => handleRemoveVariation(v.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              className="btn btn-outline btn-sm" 
              onClick={handleAddVariation}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add Variation
            </button>
          </>
        )}
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea className="input-field" name="description" value={form.description} onChange={handleChange} placeholder="Brief product description..." />
      </div>

      <div className="input-group">
        <label>Upload Main Image / Video / File</label>
        <div className="file-upload-area">
          <input type="file" id="media-upload" accept="image/*,video/*,.pdf" onChange={handleFile} className="file-input" />
          <label htmlFor="media-upload" className="file-label">
            {file ? file.name : 'Click to choose main file'}
          </label>
        </div>
        {preview && (
          <div className="media-preview">
            {file?.type?.startsWith('video/') || initial?.mediaType === 'video' ? (
              <video src={preview} controls muted />
            ) : (
              <img src={preview} alt="Preview" />
            )}
          </div>
        )}
      </div>

      {/* Gallery Section */}
      <div className="gallery-section">
        <div className="gallery-header">
          <label>Product Gallery (Additional Photos/Videos)</label>
          {galleryUploading && <span style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>Uploading...</span>}
        </div>
        
        <div className="gallery-grid">
          {additionalMedia.map((media, idx) => (
            <div key={idx} className="gallery-item">
              {media.type === 'video' ? (
                <video src={media.url} muted />
              ) : (
                <img src={media.url} alt="Gallery item" />
              )}
              <button 
                type="button" 
                className="gallery-remove-btn" 
                onClick={() => handleRemoveGalleryItem(idx)}
              >
                ✕
              </button>
            </div>
          ))}
          
          <div className="gallery-item gallery-upload-btn-wrap">
            <input 
              type="file" 
              id="gallery-upload" 
              accept="image/*,video/*" 
              style={{ display: 'none' }} 
              onChange={handleGalleryUpload} 
              disabled={galleryUploading}
            />
            <label htmlFor="gallery-upload" className="gallery-upload-btn-label">
              <Plus size={16} />
              <span>Add Media</span>
            </label>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-gold" disabled={isLoading}>
          {isLoading ? 'Saving...' : (initial ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </form>
  );
}
