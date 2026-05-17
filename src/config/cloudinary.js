const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a file to Cloudinary using unsigned upload.
 * @param {File} file - The file to upload
 * @returns {Promise<{url: string, resourceType: string}>}
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  // Determine resource type from file MIME
  let resourceType = 'image';
  if (file.type.startsWith('video/')) {
    resourceType = 'video';
  } else if (!file.type.startsWith('image/')) {
    resourceType = 'raw';
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    resourceType, // 'image' | 'video' | 'raw'
  };
}
