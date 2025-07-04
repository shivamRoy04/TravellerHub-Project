
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

console.log("Cloudinary Config Check:", process.env.CLOUD_NAME, process.env.CLOUD_API_KEY, process.env.CLOUD_API_SECRET);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Traveller_DEV',
    allowedFormats: ["png", "jpeg", "jpg"]
  },
});

module.exports = {
  cloudinary,
  storage
};

