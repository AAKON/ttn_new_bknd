const path = require('path');

const getMediaUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

const getSpatieMediaUrl = (media) => {
  if (!media) return null;
  // Spatie stores media in storage/app/public/{id}/{file_name}
  // We need to map this to our uploads directory or the original Laravel path
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
  if (media.disk === 'public') {
    return `${baseUrl}/storage/${media.id}/${media.file_name}`;
  }
  return `${baseUrl}/storage/${media.id}/${media.file_name}`;
};

const resolveMediaPath = (media) => {
  if (!media) return null;
  return {
    id: media.id,
    url: getSpatieMediaUrl(media),
    name: media.file_name,
    mime_type: media.mime_type,
    size: media.size,
    original_url: getSpatieMediaUrl(media),
    preview_url: getSpatieMediaUrl(media),
  };
};

module.exports = { getMediaUrl, getSpatieMediaUrl, resolveMediaPath };
