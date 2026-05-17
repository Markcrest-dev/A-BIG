import { useState } from 'react';
import { uploadToCloudinary } from '../config/cloudinary';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.price || form.stock === '') {
      setError('Name, Price, and Stock are required.');
      return;
    }

    const stockVal = parseInt(form.stock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      setError('Stock must be a non-negative integer.');
      return;
    }

    if (!initial && !file) {
      setError('Please upload a media file.');
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

      await onSubmit({ ...form, stock: stockVal, mediaUrl, mediaType });
    } catch (err) {
      setUploading(false);
      setError(err.message || 'Something went wrong.');
    }
  };

  const isLoading = loading || uploading;

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
            value={form.stock} 
            onChange={handleChange} 
            placeholder="e.g. 10" 
            min="0" 
            step="1"
          />
        </div>
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea className="input-field" name="description" value={form.description} onChange={handleChange} placeholder="Brief product description..." />
      </div>

      <div className="input-group">
        <label>Upload Image / Video / File</label>
        <div className="file-upload-area">
          <input type="file" id="media-upload" accept="image/*,video/*,.pdf" onChange={handleFile} className="file-input" />
          <label htmlFor="media-upload" className="file-label">
            {file ? file.name : 'Click to choose file'}
          </label>
        </div>
        {preview && (
          <div className="media-preview">
            {file?.type?.startsWith('video/') ? (
              <video src={preview} controls muted />
            ) : (
              <img src={preview} alt="Preview" />
            )}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-gold" disabled={isLoading}>
          {isLoading ? (uploading ? 'Uploading...' : 'Saving...') : (initial ? 'Update Product' : 'Add Product')}
        </button>
      </div>
    </form>
  );
}
