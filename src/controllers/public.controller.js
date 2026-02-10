const prisma = require('../config/database');
const { success, error, notFound } = require('../utils/response');
const { getMediaForModel } = require('../services/media.service');
const { getPaginationParams } = require('../utils/pagination');

const getBusinessCategories = async (req, res, next) => {
  try {
    const categories = await prisma.business_categories.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
    });

    // Get images for each category
    const result = await Promise.all(
      categories.map(async (cat) => {
        const media = await getMediaForModel('App\\Models\\BusinessCategory', cat.id);
        return {
          id: Number(cat.id),
          name: cat.name,
          image: media.length > 0 ? media[0].url : null,
        };
      })
    );

    return success(res, result, 'Business categories fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getHomepage = async (req, res, next) => {
  try {
    const [companyCount, proposalCount, locationCount, categoryCount] = await Promise.all([
      prisma.companies.count({ where: { is_active: true, deleted_at: null } }),
      prisma.sourcing_proposals.count({ where: { status: 'approved', deleted_at: null } }),
      prisma.locations.count(),
      prisma.business_categories.count({ where: { deleted_at: null } }),
    ]);

    // Featured companies
    const featuredCompanies = await prisma.companies.findMany({
      where: { is_active: true, deleted_at: null },
      include: {
        locations: true,
        business_categories: true,
      },
      orderBy: { view_count: 'desc' },
      take: 8,
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const companiesWithMedia = await Promise.all(
      featuredCompanies.map(async (c) => {
        const media = await getMediaForModel('App\\Models\\Company', c.id, 'profile_pic');
        return {
          id: Number(c.id),
          name: c.name,
          slug: c.slug,
          moto: c.moto,
          location: c.locations ? {
            id: Number(c.locations.id),
            name: c.locations.name,
            country_code: c.locations.country_code,
            phone_code: c.locations.phone_code,
            flag_path: c.locations.flag_path ? `${baseUrl}/${c.locations.flag_path}` : null
          } : null,
          business_category: c.business_categories ? { id: Number(c.business_categories.id), name: c.business_categories.name } : null,
          profile_pic_url: media.length > 0 ? media[0].url : null,
          thumbnail_url: media.length > 0 ? media[0].url : null,
        };
      })
    );

    // Featured blogs
    const featuredBlogs = await prisma.blogs.findMany({
      where: { status: 'published', is_featured: true },
      orderBy: { created_at: 'desc' },
      take: 6,
    });

    const blogsWithMedia = await Promise.all(
      featuredBlogs.map(async (b) => {
        const media = await getMediaForModel('App\\Models\\Blog', b.id, 'featured_image');
        return {
          id: Number(b.id),
          title: b.title,
          slug: b.slug,
          short_description: b.short_description,
          author: b.author,
          thumbnail_url: media.length > 0 ? media[0].url : null,
          created_at: b.created_at,
        };
      })
    );

    return success(res, {
      counts: {
        companies: companyCount,
        sourcing_proposals: proposalCount,
        locations: locationCount,
        business_categories: categoryCount,
      },
      featured_companies: companiesWithMedia,
      featured_blogs: blogsWithMedia,
    }, 'Homepage data fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getAbout = async (req, res, next) => {
  try {
    const about = await prisma.abouts.findFirst();
    if (!about) return success(res, null, 'About data fetched');

    const media = await getMediaForModel('App\\Models\\About', about.id);

    return success(res, {
      ...about,
      id: Number(about.id),
      image: media.length > 0 ? media[0].url : null,
    }, 'About data fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getTeam = async (req, res, next) => {
  try {
    const members = await prisma.our_teams.findMany({
      orderBy: { created_at: 'asc' },
    });

    const result = await Promise.all(
      members.map(async (m) => {
        const media = await getMediaForModel('App\\Models\\OurTeam', m.id);
        return {
          id: Number(m.id),
          name: m.name,
          email: m.email,
          designation: m.designation,
          image: media.length > 0 ? media[0].url : null,
        };
      })
    );

    return success(res, result, 'Team data fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getTermsAndConditions = async (req, res, next) => {
  try {
    const setting = await prisma.site_settings.findUnique({
      where: { key: 'terms_and_conditions' },
    });
    return success(res, { content: setting?.value || '' }, 'Terms and conditions fetched');
  } catch (err) {
    next(err);
  }
};

const getPricingList = async (req, res, next) => {
  try {
    const pricings = await prisma.pricings.findMany({
      orderBy: { created_at: 'asc' },
    });

    const result = pricings.map((p) => ({
      ...p,
      id: Number(p.id),
      benefits: p.benefits ? JSON.parse(p.benefits) : [],
      services: p.services ? JSON.parse(p.services) : [],
    }));

    return success(res, result, 'Pricing list fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getPartners = async (req, res, next) => {
  try {
    const partners = await prisma.partners.findMany({
      orderBy: { created_at: 'asc' },
    });

    const result = await Promise.all(
      partners.map(async (p) => {
        const media = await getMediaForModel('App\\Models\\Partner', p.id);
        return {
          id: Number(p.id),
          link: p.link,
          type: p.type,
          image: media.length > 0 ? media[0].url : null,
        };
      })
    );

    return success(res, result, 'Partners fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getLocations = async (req, res, next) => {
  try {
    const locations = await prisma.locations.findMany({
      orderBy: { name: 'asc' },
    });

    const baseUrl = `${req.protocol}://${req.get('host')}/flag`;

    const result = locations.map((loc) => ({
      id: Number(loc.id),
      name: loc.name,
      country_code: loc.country_code,
      phone_code: loc.phone_code,
      flag_path: loc.flag_path ? `${baseUrl}/${loc.flag_path}` : null,
    }));

    return success(res, result, 'Locations fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBusinessCategories,
  getHomepage,
  getAbout,
  getTeam,
  getTermsAndConditions,
  getPricingList,
  getPartners,
  getLocations,
};
