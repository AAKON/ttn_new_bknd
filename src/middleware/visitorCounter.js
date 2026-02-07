const prisma = require('../config/database');

const incrementViewCount = (modelName, idField = 'id') => {
  return async (req, res, next) => {
    try {
      const identifier = req.params.slug || req.params.id;
      if (identifier) {
        const whereField = req.params.slug ? 'slug' : idField;
        await prisma[modelName].updateMany({
          where: { [whereField]: req.params.slug ? identifier : parseInt(identifier) },
          data: { view_count: { increment: 1 } },
        });
      }
    } catch (err) {
      // Don't block the request if view count fails
      console.error('View count increment failed:', err.message);
    }
    next();
  };
};

module.exports = incrementViewCount;
