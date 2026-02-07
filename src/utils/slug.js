const slugify = require('slugify');
const prisma = require('../config/database');

const generateSlug = (text) => {
  return slugify(text, { lower: true, strict: true, trim: true });
};

const generateUniqueSlug = async (text, model, existingId = null) => {
  let slug = generateSlug(text);
  let counter = 1;

  while (true) {
    const where = { slug };
    if (existingId) {
      where.id = { not: existingId };
    }
    const existing = await prisma[model].findFirst({ where });
    if (!existing) break;
    slug = `${generateSlug(text)}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = { generateSlug, generateUniqueSlug };
