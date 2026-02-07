const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const createThumbnail = async (filePath, options = {}) => {
  const { width = 300, height = 300, suffix = 'thumb' } = options;
  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  const name = path.basename(filePath, ext);
  const thumbPath = path.join(dir, `${name}_${suffix}${ext}`);

  try {
    await sharp(filePath)
      .resize(width, height, { fit: 'cover', withoutEnlargement: true })
      .toFile(thumbPath);
    return thumbPath;
  } catch (err) {
    console.error('Thumbnail creation failed:', err.message);
    return null;
  }
};

const createMedium = async (filePath) => {
  return createThumbnail(filePath, { width: 800, height: 800, suffix: 'medium' });
};

const processUploadedImage = async (filePath) => {
  const thumbnail = await createThumbnail(filePath);
  const medium = await createMedium(filePath);
  return { original: filePath, thumbnail, medium };
};

const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('File deletion failed:', err.message);
  }
};

module.exports = { createThumbnail, createMedium, processUploadedImage, deleteFile };
