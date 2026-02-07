const prisma = require('../../config/database');
const { success, error, notFound } = require('../../utils/response');
const { getPaginationParams } = require('../../utils/pagination');
const { getMediaForModel, addMedia, deleteAllMediaForModel } = require('../../services/media.service');
const { generateUniqueSlug } = require('../../utils/slug');

// ===== Business Categories =====
const getBusinessCategories = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const where = { deleted_at: null };

    const [items, total] = await Promise.all([
      prisma.business_categories.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
      prisma.business_categories.count({ where }),
    ]);

    const result = await Promise.all(items.map(async (item) => {
      const media = await getMediaForModel('App\\Models\\BusinessCategory', item.id);
      return { id: Number(item.id), name: item.name, image: media.length > 0 ? media[0].url : null, created_at: item.created_at };
    }));

    return success(res, { data: result, pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage } });
  } catch (err) { next(err); }
};

const storeBusinessCategory = async (req, res, next) => {
  try {
    const item = await prisma.business_categories.create({
      data: { name: req.body.name, created_at: new Date(), updated_at: new Date() },
    });
    if (req.file) await addMedia(req.file, 'App\\Models\\BusinessCategory', item.id, 'default');
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updateBusinessCategory = async (req, res, next) => {
  try {
    await prisma.business_categories.update({ where: { id: BigInt(req.params.id) }, data: { name: req.body.name, updated_at: new Date() } });
    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\BusinessCategory', BigInt(req.params.id));
      await addMedia(req.file, 'App\\Models\\BusinessCategory', BigInt(req.params.id), 'default');
    }
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteBusinessCategory = async (req, res, next) => {
  try {
    await prisma.business_categories.update({ where: { id: BigInt(req.params.id) }, data: { deleted_at: new Date() } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Business Types =====
const getBusinessTypes = async (req, res, next) => {
  try {
    const items = await prisma.business_types.findMany({ orderBy: { created_at: 'desc' } });
    return success(res, items.map((i) => ({ id: Number(i.id), name: i.name, created_at: i.created_at })));
  } catch (err) { next(err); }
};

const storeBusinessType = async (req, res, next) => {
  try {
    const item = await prisma.business_types.create({ data: { name: req.body.name, created_at: new Date(), updated_at: new Date() } });
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updateBusinessType = async (req, res, next) => {
  try {
    await prisma.business_types.update({ where: { id: BigInt(req.params.id) }, data: { name: req.body.name, updated_at: new Date() } });
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteBusinessType = async (req, res, next) => {
  try {
    await prisma.business_types.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Certificates =====
const getCertificates = async (req, res, next) => {
  try {
    const items = await prisma.certificates.findMany({ orderBy: { created_at: 'desc' } });
    const result = await Promise.all(items.map(async (i) => {
      const media = await getMediaForModel('App\\Models\\Certificate', i.id);
      return { id: Number(i.id), name: i.name, image_url: media.length > 0 ? media[0].url : null, created_at: i.created_at };
    }));
    return success(res, result);
  } catch (err) { next(err); }
};

const storeCertificate = async (req, res, next) => {
  try {
    const item = await prisma.certificates.create({ data: { name: req.body.name, created_at: new Date(), updated_at: new Date() } });
    if (req.file) await addMedia(req.file, 'App\\Models\\Certificate', item.id, 'image');
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updateCertificate = async (req, res, next) => {
  try {
    await prisma.certificates.update({ where: { id: BigInt(req.params.id) }, data: { name: req.body.name, updated_at: new Date() } });
    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\Certificate', BigInt(req.params.id));
      await addMedia(req.file, 'App\\Models\\Certificate', BigInt(req.params.id), 'image');
    }
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteCertificate = async (req, res, next) => {
  try {
    await deleteAllMediaForModel('App\\Models\\Certificate', BigInt(req.params.id));
    await prisma.certificates.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Product Categories =====
const getProductCategories = async (req, res, next) => {
  try {
    const items = await prisma.product_categories.findMany({ orderBy: { name: 'asc' } });
    return success(res, items.map((i) => ({ id: Number(i.id), name: i.name, product_count: i.product_count })));
  } catch (err) { next(err); }
};

const storeProductCategory = async (req, res, next) => {
  try {
    const item = await prisma.product_categories.create({ data: { name: req.body.name, created_at: new Date(), updated_at: new Date() } });
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updateProductCategory = async (req, res, next) => {
  try {
    await prisma.product_categories.update({ where: { id: BigInt(req.params.id) }, data: { name: req.body.name, updated_at: new Date() } });
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteProductCategory = async (req, res, next) => {
  try {
    await prisma.product_categories.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Blogs =====
const getBlogs = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const [items, total] = await Promise.all([
      prisma.blogs.findMany({
        include: { blog_blog_types: { include: { blog_types: true } } },
        orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage,
      }),
      prisma.blogs.count(),
    ]);

    const result = await Promise.all(items.map(async (b) => {
      const media = await getMediaForModel('App\\Models\\Blog', b.id, 'featured_image');
      return {
        id: Number(b.id), title: b.title, slug: b.slug, author: b.author, status: b.status,
        is_featured: b.is_featured, short_description: b.short_description,
        featured_image_url: media.length > 0 ? media[0].url : null,
        blog_types: b.blog_blog_types.map((bbt) => ({ id: Number(bbt.blog_types.id), name: bbt.blog_types.name })),
        created_at: b.created_at,
      };
    }));

    return success(res, { data: result, pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage } });
  } catch (err) { next(err); }
};

const showBlog = async (req, res, next) => {
  try {
    const blog = await prisma.blogs.findUnique({
      where: { id: BigInt(req.params.id) },
      include: { blog_blog_types: { include: { blog_types: true } } },
    });
    if (!blog) return notFound(res, 'Blog not found');

    const media = await getMediaForModel('App\\Models\\Blog', blog.id, 'featured_image');
    return success(res, {
      id: Number(blog.id), title: blog.title, slug: blog.slug, author: blog.author,
      content: blog.content, short_description: blog.short_description, status: blog.status,
      is_featured: blog.is_featured, meta_title: blog.meta_title,
      meta_description: blog.meta_description, meta_keywords: blog.meta_keywords,
      featured_image_url: media.length > 0 ? media[0].url : null,
      blog_types: blog.blog_blog_types.map((bbt) => ({ id: Number(bbt.blog_types.id), name: bbt.blog_types.name })),
    });
  } catch (err) { next(err); }
};

const storeBlog = async (req, res, next) => {
  try {
    const slug = await generateUniqueSlug(req.body.title, 'blogs');
    const blog = await prisma.blogs.create({
      data: {
        title: req.body.title, slug, author: req.body.author || null,
        short_description: req.body.short_description, content: req.body.content,
        status: req.body.status || 'draft', is_featured: req.body.is_featured || false,
        meta_title: req.body.meta_title || req.body.title,
        meta_description: req.body.meta_description || req.body.short_description,
        meta_keywords: req.body.meta_keywords || '', created_at: new Date(), updated_at: new Date(),
      },
    });

    if (req.body.blog_type_ids && Array.isArray(req.body.blog_type_ids)) {
      const pivotData = req.body.blog_type_ids.map((typeId) => ({
        blog_id: blog.id, blog_type_id: BigInt(typeId), created_at: new Date(), updated_at: new Date(),
      }));
      if (pivotData.length > 0) await prisma.blog_blog_types.createMany({ data: pivotData });
    }

    if (req.file) await addMedia(req.file, 'App\\Models\\Blog', blog.id, 'featured_image');
    return success(res, { id: Number(blog.id), slug }, 'Blog created successfully');
  } catch (err) { next(err); }
};

const updateBlog = async (req, res, next) => {
  try {
    const updateData = { updated_at: new Date() };
    if (req.body.title) { updateData.title = req.body.title; updateData.slug = await generateUniqueSlug(req.body.title, 'blogs', BigInt(req.params.id)); }
    if (req.body.author !== undefined) updateData.author = req.body.author;
    if (req.body.short_description) updateData.short_description = req.body.short_description;
    if (req.body.content) updateData.content = req.body.content;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.is_featured !== undefined) updateData.is_featured = req.body.is_featured;
    if (req.body.meta_title) updateData.meta_title = req.body.meta_title;
    if (req.body.meta_description) updateData.meta_description = req.body.meta_description;
    if (req.body.meta_keywords) updateData.meta_keywords = req.body.meta_keywords;

    await prisma.blogs.update({ where: { id: BigInt(req.params.id) }, data: updateData });

    if (req.body.blog_type_ids && Array.isArray(req.body.blog_type_ids)) {
      await prisma.blog_blog_types.deleteMany({ where: { blog_id: BigInt(req.params.id) } });
      const pivotData = req.body.blog_type_ids.map((typeId) => ({
        blog_id: BigInt(req.params.id), blog_type_id: BigInt(typeId), created_at: new Date(), updated_at: new Date(),
      }));
      if (pivotData.length > 0) await prisma.blog_blog_types.createMany({ data: pivotData });
    }

    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\Blog', BigInt(req.params.id));
      await addMedia(req.file, 'App\\Models\\Blog', BigInt(req.params.id), 'featured_image');
    }
    return success(res, null, 'Blog updated successfully');
  } catch (err) { next(err); }
};

const deleteBlog = async (req, res, next) => {
  try {
    await prisma.blog_blog_types.deleteMany({ where: { blog_id: BigInt(req.params.id) } });
    await deleteAllMediaForModel('App\\Models\\Blog', BigInt(req.params.id));
    await prisma.blogs.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Blog deleted successfully');
  } catch (err) { next(err); }
};

const toggleBlogStatus = async (req, res, next) => {
  try {
    const blog = await prisma.blogs.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!blog) return notFound(res, 'Blog not found');
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    await prisma.blogs.update({ where: { id: blog.id }, data: { status: newStatus, updated_at: new Date() } });
    return success(res, { status: newStatus }, `Blog ${newStatus}`);
  } catch (err) { next(err); }
};

// ===== Blog Types =====
const getBlogTypes = async (req, res, next) => {
  try {
    const items = await prisma.blog_types.findMany({ where: { deleted_at: null }, orderBy: { name: 'asc' } });
    return success(res, items.map((i) => ({ id: Number(i.id), name: i.name })));
  } catch (err) { next(err); }
};

const storeBlogType = async (req, res, next) => {
  try {
    const item = await prisma.blog_types.create({ data: { name: req.body.name, created_at: new Date(), updated_at: new Date() } });
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updateBlogType = async (req, res, next) => {
  try {
    await prisma.blog_types.update({ where: { id: BigInt(req.params.id) }, data: { name: req.body.name, updated_at: new Date() } });
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteBlogType = async (req, res, next) => {
  try {
    await prisma.blog_types.update({ where: { id: BigInt(req.params.id) }, data: { deleted_at: new Date() } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Pricing =====
const getPricings = async (req, res, next) => {
  try {
    const items = await prisma.pricings.findMany({ orderBy: { created_at: 'desc' } });
    return success(res, items.map((i) => ({
      id: Number(i.id), title: i.title, price: i.price, bt_short_text: i.bt_short_text,
      benefits: i.benefits ? JSON.parse(i.benefits) : [], services: i.services ? JSON.parse(i.services) : [],
      type: i.type, created_at: i.created_at,
    })));
  } catch (err) { next(err); }
};

const storePricing = async (req, res, next) => {
  try {
    const item = await prisma.pricings.create({
      data: {
        title: req.body.title, price: req.body.price, bt_short_text: req.body.bt_short_text || null,
        benefits: req.body.benefits ? JSON.stringify(req.body.benefits) : null,
        services: req.body.services ? JSON.stringify(req.body.services) : null,
        type: req.body.type, created_at: new Date(), updated_at: new Date(),
      },
    });
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updatePricing = async (req, res, next) => {
  try {
    const data = { updated_at: new Date() };
    if (req.body.title) data.title = req.body.title;
    if (req.body.price) data.price = req.body.price;
    if (req.body.bt_short_text !== undefined) data.bt_short_text = req.body.bt_short_text;
    if (req.body.benefits) data.benefits = JSON.stringify(req.body.benefits);
    if (req.body.services) data.services = JSON.stringify(req.body.services);
    if (req.body.type) data.type = req.body.type;

    await prisma.pricings.update({ where: { id: BigInt(req.params.id) }, data });
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deletePricing = async (req, res, next) => {
  try {
    await prisma.pricings.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Partners =====
const getPartners = async (req, res, next) => {
  try {
    const items = await prisma.partners.findMany({ orderBy: { created_at: 'desc' } });
    const result = await Promise.all(items.map(async (i) => {
      const media = await getMediaForModel('App\\Models\\Partner', i.id);
      return { id: Number(i.id), link: i.link, type: i.type, image: media.length > 0 ? media[0].url : null, created_at: i.created_at };
    }));
    return success(res, result);
  } catch (err) { next(err); }
};

const storePartner = async (req, res, next) => {
  try {
    const item = await prisma.partners.create({
      data: { link: req.body.link || null, type: req.body.type || 'b2b', created_at: new Date(), updated_at: new Date() },
    });
    if (req.file) await addMedia(req.file, 'App\\Models\\Partner', item.id, 'default');
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updatePartner = async (req, res, next) => {
  try {
    const data = { updated_at: new Date() };
    if (req.body.link !== undefined) data.link = req.body.link;
    if (req.body.type) data.type = req.body.type;
    await prisma.partners.update({ where: { id: BigInt(req.params.id) }, data });
    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\Partner', BigInt(req.params.id));
      await addMedia(req.file, 'App\\Models\\Partner', BigInt(req.params.id), 'default');
    }
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deletePartner = async (req, res, next) => {
  try {
    await deleteAllMediaForModel('App\\Models\\Partner', BigInt(req.params.id));
    await prisma.partners.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Team =====
const getTeam = async (req, res, next) => {
  try {
    const items = await prisma.our_teams.findMany({ orderBy: { created_at: 'asc' } });
    const result = await Promise.all(items.map(async (i) => {
      const media = await getMediaForModel('App\\Models\\OurTeam', i.id);
      return { id: Number(i.id), name: i.name, email: i.email, designation: i.designation, image: media.length > 0 ? media[0].url : null };
    }));
    return success(res, result);
  } catch (err) { next(err); }
};

const storeTeamMember = async (req, res, next) => {
  try {
    const item = await prisma.our_teams.create({
      data: { name: req.body.name, email: req.body.email, designation: req.body.designation, created_at: new Date(), updated_at: new Date() },
    });
    if (req.file) await addMedia(req.file, 'App\\Models\\OurTeam', item.id, 'default');
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updateTeamMember = async (req, res, next) => {
  try {
    const data = { updated_at: new Date() };
    if (req.body.name) data.name = req.body.name;
    if (req.body.email) data.email = req.body.email;
    if (req.body.designation) data.designation = req.body.designation;
    await prisma.our_teams.update({ where: { id: BigInt(req.params.id) }, data });
    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\OurTeam', BigInt(req.params.id));
      await addMedia(req.file, 'App\\Models\\OurTeam', BigInt(req.params.id), 'default');
    }
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteTeamMember = async (req, res, next) => {
  try {
    await deleteAllMediaForModel('App\\Models\\OurTeam', BigInt(req.params.id));
    await prisma.our_teams.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== About =====
const getAbout = async (req, res, next) => {
  try {
    const about = await prisma.abouts.findFirst();
    if (!about) return success(res, null);
    const media = await getMediaForModel('App\\Models\\About', about.id);
    return success(res, { ...about, id: Number(about.id), image: media.length > 0 ? media[0].url : null });
  } catch (err) { next(err); }
};

const updateAbout = async (req, res, next) => {
  try {
    const data = {
      description: req.body.description || null, partners: req.body.partners || null,
      countries: req.body.countries || null, listed_business: req.body.listed_business || null,
      factory_people: req.body.factory_people || null, global_audience: req.body.global_audience || null,
      mission: req.body.mission || null, vision: req.body.vision || null,
      market_share: req.body.market_share ? JSON.stringify(req.body.market_share) : null,
      updated_at: new Date(),
    };

    let about = await prisma.abouts.findFirst();
    if (about) {
      await prisma.abouts.update({ where: { id: about.id }, data });
    } else {
      data.created_at = new Date();
      about = await prisma.abouts.create({ data });
    }

    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\About', about.id);
      await addMedia(req.file, 'App\\Models\\About', about.id, 'default');
    }
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

// ===== Business Ads =====
const getBusinessAds = async (req, res, next) => {
  try {
    const items = await prisma.business_ads.findMany({ orderBy: { created_at: 'desc' } });
    const result = await Promise.all(items.map(async (i) => {
      const media = await getMediaForModel('App\\Models\\BusinessAd', i.id);
      return { id: Number(i.id), link: i.link, image: media.length > 0 ? media[0].url : null };
    }));
    return success(res, result);
  } catch (err) { next(err); }
};

const storeBusinessAd = async (req, res, next) => {
  try {
    const item = await prisma.business_ads.create({
      data: { link: req.body.link || null, created_at: new Date(), updated_at: new Date() },
    });
    if (req.file) await addMedia(req.file, 'App\\Models\\BusinessAd', item.id, 'default');
    return success(res, { id: Number(item.id) }, 'Created successfully');
  } catch (err) { next(err); }
};

const updateBusinessAd = async (req, res, next) => {
  try {
    await prisma.business_ads.update({ where: { id: BigInt(req.params.id) }, data: { link: req.body.link || null, updated_at: new Date() } });
    if (req.file) {
      await deleteAllMediaForModel('App\\Models\\BusinessAd', BigInt(req.params.id));
      await addMedia(req.file, 'App\\Models\\BusinessAd', BigInt(req.params.id), 'default');
    }
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteBusinessAd = async (req, res, next) => {
  try {
    await deleteAllMediaForModel('App\\Models\\BusinessAd', BigInt(req.params.id));
    await prisma.business_ads.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Contact Messages =====
const getContactMessages = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const where = { deleted_at: null };
    const [items, total] = await Promise.all([
      prisma.contact_messages.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage, include: { business_categories: true, companies: true } }),
      prisma.contact_messages.count({ where }),
    ]);
    return success(res, { data: items.map((i) => ({ ...i, id: Number(i.id), business_category_id: i.business_category_id ? Number(i.business_category_id) : null, company_id: i.company_id ? Number(i.company_id) : null, business_category: i.business_categories ? { id: Number(i.business_categories.id), name: i.business_categories.name } : null, company: i.companies ? { id: Number(i.companies.id), name: i.companies.name } : null })), pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage } });
  } catch (err) { next(err); }
};

const updateContactMessage = async (req, res, next) => {
  try {
    const data = { updated_at: new Date() };
    if (req.body.lead_status) data.lead_status = req.body.lead_status;
    if (req.body.comment !== undefined) data.comment = req.body.comment;
    await prisma.contact_messages.update({ where: { id: BigInt(req.params.id) }, data });
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteContactMessage = async (req, res, next) => {
  try {
    await prisma.contact_messages.update({ where: { id: BigInt(req.params.id) }, data: { deleted_at: new Date() } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Company Reports =====
const getCompanyReports = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const [items, total] = await Promise.all([
      prisma.company_reports.findMany({ orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage, include: { companies: { select: { id: true, name: true, slug: true } } } }),
      prisma.company_reports.count(),
    ]);
    return success(res, { data: items.map((i) => ({ ...i, id: Number(i.id), company_id: Number(i.company_id), company: i.companies ? { id: Number(i.companies.id), name: i.companies.name, slug: i.companies.slug } : null })), pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage } });
  } catch (err) { next(err); }
};

const deleteCompanyReport = async (req, res, next) => {
  try {
    await prisma.company_reports.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Company Emails =====
const getCompanyEmails = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const [items, total] = await Promise.all([
      prisma.email_for_companies.findMany({ orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage, include: { companies: { select: { id: true, name: true, slug: true } } } }),
      prisma.email_for_companies.count(),
    ]);
    return success(res, { data: items.map((i) => ({ ...i, id: Number(i.id), company_id: Number(i.company_id), company: i.companies ? { id: Number(i.companies.id), name: i.companies.name } : null })), pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage } });
  } catch (err) { next(err); }
};

const updateCompanyEmail = async (req, res, next) => {
  try {
    await prisma.email_for_companies.update({ where: { id: BigInt(req.params.id) }, data: { comment: req.body.comment || null, updated_at: new Date() } });
    return success(res, null, 'Updated successfully');
  } catch (err) { next(err); }
};

const deleteCompanyEmail = async (req, res, next) => {
  try {
    await prisma.email_for_companies.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Company Claims =====
const getCompanyClaims = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const [items, total] = await Promise.all([
      prisma.company_claims.findMany({ orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage, include: { companies: { select: { id: true, name: true, slug: true } }, users: { select: { id: true, first_name: true, last_name: true, email: true } } } }),
      prisma.company_claims.count(),
    ]);
    return success(res, { data: items.map((i) => ({ id: Number(i.id), message: i.message, status: i.status, created_at: i.created_at, company: i.companies ? { id: Number(i.companies.id), name: i.companies.name, slug: i.companies.slug } : null, user: i.users ? { id: Number(i.users.id), first_name: i.users.first_name, last_name: i.users.last_name, email: i.users.email } : null })), pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage } });
  } catch (err) { next(err); }
};

const updateClaimStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    await prisma.company_claims.update({ where: { id: BigInt(req.params.id) }, data: { status, updated_at: new Date() } });

    if (status === 'approved') {
      const claim = await prisma.company_claims.findUnique({ where: { id: BigInt(req.params.id) } });
      if (claim) {
        await prisma.companies.update({
          where: { id: claim.company_id },
          data: { user_id: claim.user_id, status: 'claimed', updated_at: new Date() },
        });
      }
    }

    const { emitClaimStatusChanged } = require('../../services/socket.service');
    const claim = await prisma.company_claims.findUnique({ where: { id: BigInt(req.params.id) } });
    if (claim) emitClaimStatusChanged(Number(claim.user_id), { id: Number(claim.id), status: claim.status });

    return success(res, null, 'Status updated successfully');
  } catch (err) { next(err); }
};

// ===== Newsletter =====
const getNewsletters = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const where = { deleted_at: null };
    const [items, total] = await Promise.all([
      prisma.news_letters.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage }),
      prisma.news_letters.count({ where }),
    ]);
    return success(res, { data: items.map((i) => ({ id: Number(i.id), email: i.email, created_at: i.created_at })), pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage } });
  } catch (err) { next(err); }
};

const deleteNewsletter = async (req, res, next) => {
  try {
    await prisma.news_letters.update({ where: { id: BigInt(req.params.id) }, data: { deleted_at: new Date() } });
    return success(res, null, 'Deleted successfully');
  } catch (err) { next(err); }
};

// ===== Site Settings =====
const getSiteSettings = async (req, res, next) => {
  try {
    const settings = await prisma.site_settings.findMany();
    const result = {};
    settings.forEach((s) => { result[s.key] = s.value; });
    return success(res, result);
  } catch (err) { next(err); }
};

const updateSiteSettings = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    await prisma.site_settings.upsert({
      where: { key },
      update: { value, updated_at: new Date() },
      create: { key, value, created_at: new Date(), updated_at: new Date() },
    });
    return success(res, null, 'Settings updated');
  } catch (err) { next(err); }
};

// ===== Admin Sourcing Proposals =====
const getAdminProposals = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { status } = req.query;
    const where = { deleted_at: null };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.sourcing_proposals.findMany({
        where, orderBy: { created_at: 'desc' }, skip: (page - 1) * perPage, take: perPage,
        include: { users_sourcing_proposals_user_idTousers: { select: { id: true, first_name: true, last_name: true, email: true } }, locations: true },
      }),
      prisma.sourcing_proposals.count({ where }),
    ]);

    return success(res, {
      data: items.map((i) => ({
        id: Number(i.id), title: i.title, company_name: i.company_name, status: i.status,
        view_count: i.view_count, created_at: i.created_at,
        user: i.users_sourcing_proposals_user_idTousers ? { id: Number(i.users_sourcing_proposals_user_idTousers.id), first_name: i.users_sourcing_proposals_user_idTousers.first_name, last_name: i.users_sourcing_proposals_user_idTousers.last_name } : null,
        location: i.locations ? { id: Number(i.locations.id), name: i.locations.name } : null,
      })),
      pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage },
    });
  } catch (err) { next(err); }
};

const approveProposal = async (req, res, next) => {
  try {
    await prisma.sourcing_proposals.update({
      where: { id: BigInt(req.params.id) },
      data: { status: 'approved', approved_by: req.user.id, approved_at: new Date(), admin_notes: req.body.admin_notes || null, updated_at: new Date() },
    });

    const proposal = await prisma.sourcing_proposals.findUnique({ where: { id: BigInt(req.params.id) } });
    const { emitProposalStatusChanged } = require('../../services/socket.service');
    emitProposalStatusChanged(Number(proposal.user_id), proposal);

    return success(res, null, 'Proposal approved');
  } catch (err) { next(err); }
};

const rejectProposal = async (req, res, next) => {
  try {
    await prisma.sourcing_proposals.update({
      where: { id: BigInt(req.params.id) },
      data: { status: 'rejected', admin_notes: req.body.admin_notes || null, updated_at: new Date() },
    });

    const proposal = await prisma.sourcing_proposals.findUnique({ where: { id: BigInt(req.params.id) } });
    const { emitProposalStatusChanged } = require('../../services/socket.service');
    emitProposalStatusChanged(Number(proposal.user_id), proposal);

    return success(res, null, 'Proposal rejected');
  } catch (err) { next(err); }
};

const deleteAdminProposal = async (req, res, next) => {
  try {
    await prisma.sourcing_proposals.update({
      where: { id: BigInt(req.params.id) },
      data: { deleted_at: new Date() },
    });
    return success(res, null, 'Proposal deleted');
  } catch (err) { next(err); }
};

module.exports = {
  getBusinessCategories, storeBusinessCategory, updateBusinessCategory, deleteBusinessCategory,
  getBusinessTypes, storeBusinessType, updateBusinessType, deleteBusinessType,
  getCertificates, storeCertificate, updateCertificate, deleteCertificate,
  getProductCategories, storeProductCategory, updateProductCategory, deleteProductCategory,
  getBlogs, showBlog, storeBlog, updateBlog, deleteBlog, toggleBlogStatus,
  getBlogTypes, storeBlogType, updateBlogType, deleteBlogType,
  getPricings, storePricing, updatePricing, deletePricing,
  getPartners, storePartner, updatePartner, deletePartner,
  getTeam, storeTeamMember, updateTeamMember, deleteTeamMember,
  getAbout, updateAbout,
  getBusinessAds, storeBusinessAd, updateBusinessAd, deleteBusinessAd,
  getContactMessages, updateContactMessage, deleteContactMessage,
  getCompanyReports, deleteCompanyReport,
  getCompanyEmails, updateCompanyEmail, deleteCompanyEmail,
  getCompanyClaims, updateClaimStatus,
  getNewsletters, deleteNewsletter,
  getSiteSettings, updateSiteSettings,
  getAdminProposals, approveProposal, rejectProposal, deleteAdminProposal,
};
