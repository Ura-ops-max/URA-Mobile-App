import API from './axios-client';

interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Upload a local image (file:// uri from expo-image-picker/camera) to S3 via the
 * backend presign flow — mirrors the web app's `uploadMediaToS3`:
 *   1. POST /upload/presign -> { uploadUrl, fileUrl }
 *   2. PUT the file bytes straight to S3
 *   3. return the public fileUrl
 */
export async function uploadImageToS3(uri: string, folder = 'profiles'): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`);
  }
  const contentType = blob.type || 'image/jpeg';
  const fileName = uri.split('/').pop() || `upload-${Date.now()}.jpg`;

  const { data } = await API.post('/upload/presign', { fileName, contentType, folder });
  const { uploadUrl, fileUrl } = (data?.data ?? data) as PresignResponse;

  const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } });
  if (!put.ok) {
    throw new Error(
      put.status === 403
        ? 'Upload link expired before the file finished uploading. Please try again.'
        : `Upload failed (${put.status}). Please try again.`,
    );
  }
  return fileUrl;
}
