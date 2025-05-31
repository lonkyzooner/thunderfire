const express = require('express');
const { S3Client, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const router = express.Router();

const R2_ENDPOINT = 'https://<your-account-id>.r2.cloudflarestorage.com';
const R2_BUCKET = '<your-bucket-name>';
const R2_ACCESS_KEY = '<your-access-key>';
const R2_SECRET_KEY = '<your-secret-key>';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

/**
 * Generate a signed URL for uploading a file
 * POST /api/r2/sign-upload
 * Body: { key: string, contentType: string }
 */
router.post('/sign-upload', async (req, res) => {
  const { key, contentType } = req.body;
  if (!key || !contentType) {
    return res.status(400).json({ error: 'Missing key or contentType' });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ url });
  } catch (err) {
    console.error('Error generating signed upload URL:', err);
    res.status(500).json({ error: 'Failed to generate signed upload URL' });
  }
});

/**
 * Generate a signed URL for deleting a file
 * POST /api/r2/sign-delete
 * Body: { key: string }
 */
router.post('/sign-delete', async (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Missing key' });
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ url });
  } catch (err) {
    console.error('Error generating signed delete URL:', err);
    res.status(500).json({ error: 'Failed to generate signed delete URL' });
  }
});

module.exports = router;