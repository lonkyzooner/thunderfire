import axios from 'axios';

/**
 * Upload a file to R2 using a signed URL
 * @param file File object
 * @param key Desired storage key (path/filename)
 * @returns URL of the uploaded file
 */
export async function uploadFile(file: File, key: string): Promise<string> {
  // Request signed upload URL from backend
  const { data } = await axios.post('/api/r2/sign-upload', {
    key,
    contentType: file.type || 'application/octet-stream',
  });

  const uploadUrl = data.url;
  if (!uploadUrl) throw new Error('Failed to get signed upload URL');

  // Upload file directly to R2
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  // Return the public URL (assuming R2 bucket is public or via CDN)
  const publicUrl = uploadUrl.split('?')[0];
  return publicUrl;
}

/**
 * Get a public URL for a file (assumes public bucket or CDN)
 */
export async function downloadFileUrl(key: string): Promise<string> {
  // This assumes your R2 bucket is public or proxied via CDN
  const R2_PUBLIC_BASE = 'https://<your-account-id>.r2.cloudflarestorage.com/<your-bucket-name>';
  return `${R2_PUBLIC_BASE}/${key}`;
}

/**
 * Delete a file from R2 using a signed URL
 * @param key Storage key (path/filename)
 */
export async function deleteFile(key: string): Promise<void> {
  // Request signed delete URL from backend
  const { data } = await axios.post('/api/r2/sign-delete', { key });

  const deleteUrl = data.url;
  if (!deleteUrl) throw new Error('Failed to get signed delete URL');

  // Perform DELETE request to R2
  await axios.delete(deleteUrl);
}