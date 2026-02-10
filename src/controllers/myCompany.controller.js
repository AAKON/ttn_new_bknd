const prisma = require('../config/database');
const { success, error, notFound, forbidden } = require('../utils/response');
const { getMediaForModel, addMedia, deleteMedia, deleteAllMediaForModel } = require('../services/media.service');
const { generateUniqueSlug } = require('../utils/slug');
const { formatCompanyListItem } = require('./company.controller');

const verifyCompanyOwnership = async (slug, userId) => {
  const company = await prisma.companies.findFirst({
    where: { slug, deleted_at: null },
  });
  if (!company) return null;
  if (company.user_id !== userId && company.created_by !== userId) return null;
  return company;
};

const myCompanyList = async (req, res, next) => {
  try {
    const companies = await prisma.companies.findMany({
      where: { user_id: req.user.id, deleted_at: null },
      include: {
        locations: true,
        business_categories: true,
        company_business_categories: { include: { business_categories: true } },
        company_business_types: { include: { business_types: true } },
        company_certificates: { include: { certificates: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = await Promise.all(companies.map((c) => formatCompanyListItem(c, null, req)));
    return success(res, result, 'Companies fetched successfully');
  } catch (err) {
    next(err);
  }
};

const storeCompany = async (req, res, next) => {
  try {
    const { name, location_id, manpower, moto, tags, about, keywords,
            business_categories, business_types, certificates } = req.body;

    const slug = await generateUniqueSlug(name, 'companies');

    // Check admin role for status
    const isAdmin = req.user.roles.some((r) => r.name === 'administrator');

    const company = await prisma.companies.create({
      data: {
        user_id: req.user.id,
        created_by: req.user.id,
        name,
        slug,
        status: isAdmin ? 'created_by_admin' : 'created_by_user',
        location_id: BigInt(location_id),
        manpower: manpower || null,
        moto: moto || null,
        tags: tags || null,
        about: about || null,
        keywords: keywords || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Handle business categories
    if (business_categories && Array.isArray(business_categories)) {
      const catData = business_categories.map((catId) => ({
        company_id: company.id,
        business_category_id: BigInt(catId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (catData.length > 0) {
        await prisma.company_business_categories.createMany({ data: catData });
      }
      // Set first category as primary
      if (business_categories.length > 0) {
        await prisma.companies.update({
          where: { id: company.id },
          data: { business_category_id: BigInt(business_categories[0]) },
        });
      }
    }

    // Handle business types
    if (business_types && Array.isArray(business_types)) {
      const typeData = business_types.map((typeId) => ({
        company_id: company.id,
        business_type_id: BigInt(typeId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (typeData.length > 0) {
        await prisma.company_business_types.createMany({ data: typeData });
      }
    }

    // Handle certificates
    if (certificates && Array.isArray(certificates)) {
      const certData = certificates.map((certId) => ({
        company_id: company.id,
        certificate_id: BigInt(certId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (certData.length > 0) {
        await prisma.company_certificates.createMany({ data: certData });
      }
    }

    // Handle image upload
    if (req.file) {
      await addMedia(req.file, 'App\\Models\\Company', company.id, 'profile_pic');
    }

    return success(res, { slug: company.slug }, 'Company created successfully');
  } catch (err) {
    next(err);
  }
};

const editCompany = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const full = await prisma.companies.findUnique({
      where: { id: company.id },
      include: {
        locations: true,
        business_categories: true,
        company_business_categories: { include: { business_categories: true } },
        company_business_types: { include: { business_types: true } },
        company_certificates: { include: { certificates: true } },
      },
    });

    const formatted = await formatCompanyListItem(full, null, req);

    // Get products separately
    const products = await prisma.products.findMany({
      where: { company_id: company.id },
    });

    // Add products with media and category
    const productsWithMedia = await Promise.all(
      products.map(async (p) => {
        const pMedia = await getMediaForModel('App\\Models\\Product', p.id, 'image');
        // Get category name
        let categoryName = null;
        if (p.product_category_id) {
          const category = await prisma.business_categories.findUnique({
            where: { id: p.product_category_id },
          });
          categoryName = category?.name || null;
        }

        return {
          id: Number(p.id),
          name: p.name,
          title: p.name,
          price_range: p.price_range,
          price_max: p.price_max,
          price_usd: p.price_range,
          price_inr: p.price_max,
          moq: p.moq,
          product_category_id: Number(p.product_category_id),
          category: categoryName
            ? { id: Number(p.product_category_id), name: categoryName }
            : null,
          product_category: categoryName
            ? { id: Number(p.product_category_id), name: categoryName }
            : null,
          image: pMedia.length > 0 ? pMedia[0].url : null,
          image_url: pMedia.length > 0 ? pMedia[0].url : null,
        };
      })
    );

    // Get overview
    const overview = await prisma.company_overviews.findFirst({
      where: { company_id: company.id, deleted_at: null },
    });

    const overviewData = overview ? {
      id: Number(overview.id),
      moq: overview.moq,
      lead_time: overview.lead_time,
      lead_time_unit: overview.lead_time_unit,
      shipment_term: overview.shipment_term,
      payment_policy: overview.payment_policy,
      total_units: overview.total_units,
      production_capacity: overview.production_capacity,
      production_capacity_unit: overview.production_capacity_unit,
      market_share: overview.market_share ? JSON.parse(overview.market_share) : [],
      yearly_turnover: overview.yearly_turnover ? JSON.parse(overview.yearly_turnover) : [],
      is_manufacturer: overview.is_manufacturer,
    } : null;

    return success(res, { ...formatted, products: productsWithMedia, overview: overviewData }, 'Company data fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const { name, location_id, manpower, moto, tags, about, keywords,
            business_categories, business_types, certificates } = req.body;

    const updateData = { updated_at: new Date() };
    if (name) {
      updateData.name = name;
      updateData.slug = await generateUniqueSlug(name, 'companies', company.id);
    }
    if (location_id) updateData.location_id = BigInt(location_id);
    if (manpower !== undefined) updateData.manpower = manpower;
    if (moto !== undefined) updateData.moto = moto;
    if (tags !== undefined) updateData.tags = tags;
    if (about !== undefined) updateData.about = about;
    if (keywords !== undefined) updateData.keywords = keywords;

    await prisma.companies.update({
      where: { id: company.id },
      data: updateData,
    });

    // Sync business categories
    if (business_categories && Array.isArray(business_categories)) {
      await prisma.company_business_categories.deleteMany({ where: { company_id: company.id } });
      const catData = business_categories.map((catId) => ({
        company_id: company.id,
        business_category_id: BigInt(catId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (catData.length > 0) await prisma.company_business_categories.createMany({ data: catData });
      if (business_categories.length > 0) {
        await prisma.companies.update({
          where: { id: company.id },
          data: { business_category_id: BigInt(business_categories[0]) },
        });
      }
    }

    // Sync business types
    if (business_types && Array.isArray(business_types)) {
      await prisma.company_business_types.deleteMany({ where: { company_id: company.id } });
      const typeData = business_types.map((typeId) => ({
        company_id: company.id,
        business_type_id: BigInt(typeId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (typeData.length > 0) await prisma.company_business_types.createMany({ data: typeData });
    }

    // Handle image upload
    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\Company', company.id);
      await addMedia(req.file, 'App\\Models\\Company', company.id, 'profile_pic');
    }

    const slug = updateData.slug || company.slug;
    return success(res, { slug }, 'Company updated successfully');
  } catch (err) {
    next(err);
  }
};

const updateCertificates = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const { certificates } = req.body;
    await prisma.company_certificates.deleteMany({ where: { company_id: company.id } });

    if (certificates && Array.isArray(certificates)) {
      const certData = certificates.map((certId) => ({
        company_id: company.id,
        certificate_id: BigInt(certId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (certData.length > 0) await prisma.company_certificates.createMany({ data: certData });
    }

    return success(res, null, 'Certificates updated successfully');
  } catch (err) {
    next(err);
  }
};

// Overview
const getOverview = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const overview = await prisma.company_overviews.findFirst({
      where: { company_id: company.id, deleted_at: null },
    });

    if (!overview) return success(res, null, 'No overview found');

    return success(res, {
      id: Number(overview.id),
      moq: overview.moq,
      lead_time: overview.lead_time,
      lead_time_unit: overview.lead_time_unit,
      shipment_term: overview.shipment_term,
      payment_policy: overview.payment_policy,
      total_units: overview.total_units,
      production_capacity: overview.production_capacity,
      production_capacity_unit: overview.production_capacity_unit,
      market_share: overview.market_share ? JSON.parse(overview.market_share) : [],
      yearly_turnover: overview.yearly_turnover ? JSON.parse(overview.yearly_turnover) : [],
      is_manufacturer: overview.is_manufacturer,
    }, 'Overview fetched successfully');
  } catch (err) {
    next(err);
  }
};

const storeOrUpdateOverview = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const data = {
      moq: req.body.moq || null,
      lead_time: req.body.lead_time || null,
      lead_time_unit: req.body.lead_time_unit || null,
      shipment_term: req.body.shipment_term || null,
      payment_policy: req.body.payment_policy || null,
      total_units: req.body.total_units || null,
      production_capacity: req.body.production_capacity || null,
      production_capacity_unit: req.body.production_capacity_unit || null,
      market_share: req.body.market_share ? JSON.stringify(req.body.market_share) : null,
      yearly_turnover: req.body.yearly_turnover ? JSON.stringify(req.body.yearly_turnover) : null,
      is_manufacturer: req.body.is_manufacturer !== undefined ? req.body.is_manufacturer : null,
      updated_at: new Date(),
    };

    const existing = await prisma.company_overviews.findFirst({
      where: { company_id: company.id, deleted_at: null },
    });

    if (existing) {
      await prisma.company_overviews.update({ where: { id: existing.id }, data });
    } else {
      data.company_id = company.id;
      data.created_at = new Date();
      await prisma.company_overviews.create({ data });
    }

    return success(res, null, 'Overview saved successfully');
  } catch (err) {
    next(err);
  }
};

// Products
const getProducts = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const products = await prisma.products.findMany({
      where: { company_id: company.id },
      orderBy: { created_at: 'desc' },
    });

    const result = await Promise.all(
      products.map(async (p) => {
        const media = await getMediaForModel('App\\Models\\Product', p.id, 'image');
        return {
          id: Number(p.id),
          name: p.name,
          price_range: p.price_range,
          price_max: p.price_max,
          moq: p.moq,
          product_category_id: Number(p.product_category_id),
          image_url: media.length > 0 ? media[0].url : null,
        };
      })
    );

    return success(res, result, 'Products fetched successfully');
  } catch (err) {
    next(err);
  }
};

const storeProduct = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    // Validate required fields
    if (!req.body.name) {
      return error(res, 'Product name is required', 400);
    }
    if (!req.body.product_category_id) {
      return error(res, 'Product category is required', 400);
    }
    if (!req.body.moq) {
      return error(res, 'Minimum order quantity is required', 400);
    }

    const product = await prisma.products.create({
      data: {
        company_id: company.id,
        name: String(req.body.name).trim(),
        product_category_id: BigInt(req.body.product_category_id),
        price_range: String(req.body.price_range || '0').trim(),
        price_max: req.body.price_max ? String(req.body.price_max).trim() : null,
        moq: String(req.body.moq || '0').trim(),
        created_by: req.user.id,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (req.file) {
      await addMedia(req.file, 'App\\Models\\Product', product.id, 'image');
    }

    return success(res, { id: Number(product.id) }, 'Product created successfully');
  } catch (err) {
    console.error('Store product error:', err);
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const updateData = { updated_at: new Date() };
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.product_category_id) updateData.product_category_id = BigInt(req.body.product_category_id);
    if (req.body.price_range) updateData.price_range = req.body.price_range;
    if (req.body.price_max !== undefined) updateData.price_max = req.body.price_max;
    if (req.body.moq !== undefined) updateData.moq = req.body.moq;

    await prisma.products.update({
      where: { id: BigInt(req.params.product_id) },
      data: updateData,
    });

    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\Product', BigInt(req.params.product_id));
      await addMedia(req.file, 'App\\Models\\Product', BigInt(req.params.product_id), 'image');
    }

    return success(res, null, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    await deleteAllMediaForModel('App\\Models\\Product', BigInt(req.params.product_id));
    await prisma.products.delete({ where: { id: BigInt(req.params.product_id) } });
    return success(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

// FAQs
const getFaqs = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const faqs = await prisma.company_faqs.findMany({
      where: { company_id: company.id },
      orderBy: { created_at: 'desc' },
    });

    return success(res, faqs.map((f) => ({ id: Number(f.id), question: f.question, answer: f.answer })), 'FAQs fetched');
  } catch (err) {
    next(err);
  }
};

const storeFaq = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const faq = await prisma.company_faqs.create({
      data: {
        company_id: company.id,
        question: req.body.question,
        answer: req.body.answer,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return success(res, { id: Number(faq.id) }, 'FAQ created successfully');
  } catch (err) {
    next(err);
  }
};

const deleteFaq = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    await prisma.company_faqs.delete({ where: { id: BigInt(req.params.faq_id) } });
    return success(res, null, 'FAQ deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Clients
const getClients = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const clients = await prisma.company_clients.findMany({
      where: { company_id: company.id },
    });

    const result = await Promise.all(
      clients.map(async (cl) => {
        const media = await getMediaForModel('App\\Models\\CompanyClient', cl.id, 'image');
        return { id: Number(cl.id), image_url: media.length > 0 ? media[0].url : null };
      })
    );

    return success(res, result, 'Clients fetched');
  } catch (err) {
    next(err);
  }
};

const storeClient = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const client = await prisma.company_clients.create({
      data: { company_id: company.id, created_at: new Date(), updated_at: new Date() },
    });

    if (req.file) {
      await addMedia(req.file, 'App\\Models\\CompanyClient', client.id, 'image');
    }

    return success(res, { id: Number(client.id) }, 'Client created successfully');
  } catch (err) {
    next(err);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    await deleteAllMediaForModel('App\\Models\\CompanyClient', BigInt(req.params.client_id));
    await prisma.company_clients.delete({ where: { id: BigInt(req.params.client_id) } });
    return success(res, null, 'Client deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Business Contact
const getContact = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const contact = await prisma.business_contacts.findFirst({
      where: { company_id: company.id, deleted_at: null },
    });

    if (!contact) return success(res, null, 'No contact found');

    return success(res, {
      id: Number(contact.id),
      address: contact.address,
      factory_address: contact.factory_address,
      email: contact.email,
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      website: contact.website,
      lat_long: contact.lat_long ? JSON.parse(contact.lat_long) : null,
    }, 'Contact fetched');
  } catch (err) {
    next(err);
  }
};

const storeOrUpdateContact = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const data = {
      address: req.body.address || null,
      factory_address: req.body.factory_address || null,
      email: req.body.email,
      phone: req.body.phone || null,
      whatsapp: req.body.whatsapp || null,
      website: req.body.website || null,
      lat_long: req.body.lat_long ? JSON.stringify(req.body.lat_long) : null,
      updated_at: new Date(),
    };

    const existing = await prisma.business_contacts.findFirst({
      where: { company_id: company.id, deleted_at: null },
    });

    if (existing) {
      await prisma.business_contacts.update({ where: { id: existing.id }, data });
    } else {
      data.company_id = company.id;
      data.created_at = new Date();
      await prisma.business_contacts.create({ data });
    }

    return success(res, null, 'Contact saved successfully');
  } catch (err) {
    next(err);
  }
};

// Decision Makers
const getDecisionMakers = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const makers = await prisma.decision_makers.findMany({
      where: { company_id: company.id },
      orderBy: { created_at: 'desc' },
    });

    return success(res, makers.map((m) => ({
      id: Number(m.id),
      name: m.name,
      email: m.email,
      phone: m.phone,
      whatsapp: m.whatsapp,
      designation: m.designation,
    })), 'Decision makers fetched');
  } catch (err) {
    next(err);
  }
};

const storeDecisionMaker = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const dm = await prisma.decision_makers.create({
      data: {
        company_id: company.id,
        name: req.body.name,
        email: req.body.email,
        whatsapp: req.body.whatsapp || null,
        phone: req.body.phone || null,
        designation: req.body.designation,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return success(res, { id: Number(dm.id) }, 'Decision maker created successfully');
  } catch (err) {
    next(err);
  }
};

const updateDecisionMaker = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    const updateData = { updated_at: new Date() };
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.whatsapp !== undefined) updateData.whatsapp = req.body.whatsapp;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.designation) updateData.designation = req.body.designation;

    await prisma.decision_makers.update({
      where: { id: BigInt(req.params.decision_maker_id) },
      data: updateData,
    });

    return success(res, null, 'Decision maker updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteDecisionMaker = async (req, res, next) => {
  try {
    const company = await verifyCompanyOwnership(req.params.slug, req.user.id);
    if (!company) return notFound(res, 'Company not found');

    await prisma.decision_makers.delete({ where: { id: BigInt(req.params.decision_maker_id) } });
    return success(res, null, 'Decision maker deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Preparation data
const getPreparationDataForBasic = async (req, res, next) => {
  try {
    const [locations, businessCategories, businessTypes, certificates] = await Promise.all([
      prisma.locations.findMany({ orderBy: { name: 'asc' } }),
      prisma.business_categories.findMany({ where: { deleted_at: null }, orderBy: { name: 'asc' } }),
      prisma.business_types.findMany({ orderBy: { name: 'asc' } }),
      prisma.certificates.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return success(res, {
      locations: locations.map((l) => ({
        id: Number(l.id),
        name: l.name,
        country_code: l.country_code,
        phone_code: l.phone_code,
        flag_path: l.flag_path ? `${baseUrl}/${l.flag_path}` : null,
      })),
      business_categories: businessCategories.map((bc) => ({ id: Number(bc.id), name: bc.name })),
      business_types: businessTypes.map((bt) => ({ id: Number(bt.id), name: bt.name })),
      certificates: certificates.map((c) => ({ id: Number(c.id), name: c.name })),
    }, 'Preparation data fetched');
  } catch (err) {
    next(err);
  }
};

const getPreparationDataForOverview = async (req, res, next) => {
  try {
    const productCategories = await prisma.product_categories.findMany({
      orderBy: { name: 'asc' },
    });

    return success(res, {
      product_categories: productCategories.map((pc) => ({ id: Number(pc.id), name: pc.name })),
    }, 'Preparation data fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  myCompanyList,
  storeCompany,
  editCompany,
  updateCompany,
  updateCertificates,
  getOverview,
  storeOrUpdateOverview,
  getProducts,
  storeProduct,
  updateProduct,
  deleteProduct,
  getFaqs,
  storeFaq,
  deleteFaq,
  getClients,
  storeClient,
  deleteClient,
  getContact,
  storeOrUpdateContact,
  getDecisionMakers,
  storeDecisionMaker,
  updateDecisionMaker,
  deleteDecisionMaker,
  getPreparationDataForBasic,
  getPreparationDataForOverview,
};
