const { S3Client, PutObjectCommand, GetObjectCommand, GetObjectCommandInput } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_S3_BUCKET || 'interview-app-resume';

/**
 * Build the S3 key for a resume: studentName/filename
 * @param {string} studentName - sanitized student name
 * @param {string} filename - sanitized file name
 */
const buildS3Key = (studentName, filename) => `${studentName}/${filename}`;

const buildResourceKey = (filename) => `resources/${filename}`;

/**
 * Upload a file buffer to S3
 * @param {Buffer} buffer - file content
 * @param {string} key - S3 object key (e.g. "john_doe/resume.pdf")
 * @param {string} contentType - MIME type
 */
const uploadToS3 = async (buffer, key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });
  await s3Client.send(command);
  return key;
};

/**
 * Generate a presigned download URL (valid for 15 minutes by default)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - seconds until expiry (default 900)
 */
const getPresignedUrl = async (key, expiresIn = 900) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Get a readable stream for an S3 object (used for bulk ZIP download)
 * @param {string} key - S3 object key
 */
const getS3Stream = async (key) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3Client.send(command);
  return response.Body;
};

module.exports = { buildS3Key, buildResourceKey, uploadToS3, getPresignedUrl, getS3Stream };
