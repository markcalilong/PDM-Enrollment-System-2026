// Loads .env (via env.js side effect) before the SDK reads CLOUDINARY_URL.
require("./env");
const cloudinary = require("cloudinary").v2;

// The SDK auto-configures from the CLOUDINARY_URL env var; force https URLs.
cloudinary.config({ secure: true });

const isConfigured = () => Boolean(cloudinary.config().cloud_name);

/**
 * Upload an in-memory file buffer to Cloudinary and return the result.
 * @param {Buffer} buffer - file bytes (from multer memoryStorage)
 * @param {string} folder - Cloudinary folder, e.g. "pdm/slides"
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

/**
 * Derive a Cloudinary public_id (including folder) from a stored secure_url.
 * Returns null for non-Cloudinary values (e.g. legacy "/uploads/..." paths).
 */
function publicIdFromUrl(url) {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

/**
 * Best-effort delete of a previously uploaded image by its stored URL.
 * Silently ignores legacy local paths and delete failures.
 */
async function destroyByUrl(url) {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (_err) {
    // non-fatal: the DB row is the source of truth, orphaned assets are harmless
  }
}

module.exports = { cloudinary, uploadBuffer, destroyByUrl, isConfigured };
