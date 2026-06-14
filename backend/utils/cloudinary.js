const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Since the checklist specifies "memory storage" and "a Cloudinary service utility will handle the upload", 
// we will just use multer with memory storage and manually upload to Cloudinary in the controller.
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};
const upload = multer({ storage, fileFilter });

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'straycare/posts' },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const getOptimizedUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  const { width = 800, quality = 'auto', format = 'auto', crop = 'limit' } = options;
  const transformString = `f_${format},q_${quality},w_${width},c_${crop}`;
  return url.replace('/image/upload/', `/image/upload/${transformString}/`);
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  getOptimizedUrl
};
