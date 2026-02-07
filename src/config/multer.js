const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const createStorage = (subDir) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', subDir);
      const fs = require('fs');
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed'), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const createUpload = (subDir, filter = fileFilter) => {
  return multer({
    storage: createStorage(subDir),
    fileFilter: filter,
    limits: { fileSize: maxSize },
  });
};

module.exports = {
  companyUpload: createUpload('companies', imageFilter),
  productUpload: createUpload('products', imageFilter),
  blogUpload: createUpload('blogs', imageFilter),
  proposalUpload: createUpload('proposals', imageFilter),
  userUpload: createUpload('users', imageFilter),
  partnerUpload: createUpload('partners', imageFilter),
  teamUpload: createUpload('teams', imageFilter),
  certificateUpload: createUpload('certificates', imageFilter),
  categoryUpload: createUpload('categories', imageFilter),
  adUpload: createUpload('ads', imageFilter),
  aboutUpload: createUpload('about', imageFilter),
  clientUpload: createUpload('clients', imageFilter),
  createUpload,
};
