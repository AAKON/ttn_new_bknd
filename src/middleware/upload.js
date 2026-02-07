const { error } = require('../utils/response');

const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, 'File too large', 413);
        }
        return error(res, err.message || 'Upload failed', 400);
      }
      next();
    });
  };
};

module.exports = handleUpload;
