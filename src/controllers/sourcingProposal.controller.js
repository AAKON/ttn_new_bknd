const prisma = require('../config/database');
const { success, error, notFound, forbidden } = require('../utils/response');
const { getMediaForModel, addMedia, deleteMedia } = require('../services/media.service');
const { getPaginationParams } = require('../utils/pagination');

const formatProposal = async (proposal, userId = null, req = null) => {
  const media = await getMediaForModel('App\\Models\\SourcingProposal', proposal.id, 'proposal_images');

  let isFavorited = false;
  if (userId) {
    const fav = await prisma.favorite_proposals.findFirst({
      where: { user_id: userId, sourcing_proposal_id: proposal.id },
    });
    isFavorited = !!fav;
  }

  // Get product categories via pivot
  const pivotCategories = await prisma.product_category_sourcing_proposal.findMany({
    where: { sourcing_proposal_id: proposal.id },
  });
  const categoryIds = pivotCategories.map((pc) => pc.product_category_id);
  let productCategories = [];
  if (categoryIds.length > 0) {
    productCategories = await prisma.product_categories.findMany({
      where: { id: { in: categoryIds } },
    });
  }

  // Base URL for assets (flag_path already includes "flag/..." from DB)
  const baseUrl = req ? `${req.protocol}://${req.get('host')}` : '';

  return {
    id: Number(proposal.id),
    title: proposal.title,
    description: proposal.description,
    quantity: proposal.quantity ? Number(proposal.quantity) : null,
    unit: proposal.unit,
    price: proposal.price ? Number(proposal.price) : null,
    currency: proposal.currency,
    payment_method: proposal.payment_method,
    delivery_info: proposal.delivery_info,
    company_name: proposal.company_name,
    company_slug: proposal.company_slug,
    email: proposal.email,
    phone: proposal.phone,
    whatsapp: proposal.whatsapp,
    address: proposal.address,
    status: proposal.status,
    view_count: proposal.view_count,
    admin_notes: proposal.admin_notes,
    created_at: proposal.created_at,
    is_favorited: isFavorited,
    images_urls: media.map((m) => ({ id: m.id, url: m.url, original_url: m.original_url })),
    user: proposal.users_sourcing_proposals_user_idTousers
      ? {
          id: Number(proposal.users_sourcing_proposals_user_idTousers.id),
          first_name: proposal.users_sourcing_proposals_user_idTousers.first_name,
          last_name: proposal.users_sourcing_proposals_user_idTousers.last_name,
        }
      : null,
    location: proposal.locations
      ? {
          id: Number(proposal.locations.id),
          name: proposal.locations.name,
          country_code: proposal.locations.country_code,
          phone_code: proposal.locations.phone_code,
          flag_path: proposal.locations.flag_path ? `${baseUrl}/${proposal.locations.flag_path}` : null,
        }
      : null,
    product_categories: productCategories.map((pc) => ({ id: Number(pc.id), name: pc.name })),
  };
};

const publicList = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { location_id, product_category_id, company_name, title, currency, min_price, max_price, price_range } = req.query;

    const where = { status: 'approved', deleted_at: null };

    if (location_id) where.location_id = BigInt(location_id);
    if (company_name) where.company_name = { contains: company_name };
    if (title) where.title = { contains: title };
    if (currency) where.currency = currency;

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price.gte = parseFloat(min_price);
      if (max_price) where.price.lte = parseFloat(max_price);
    }

    if (price_range) {
      const ranges = { '0-100': [0, 100], '100-500': [100, 500], '500-1000': [500, 1000], '1000-5000': [1000, 5000], '5000-10000': [5000, 10000] };
      if (ranges[price_range]) {
        where.price = { gte: ranges[price_range][0], lte: ranges[price_range][1] };
      } else if (price_range === '10000+') {
        where.price = { gte: 10000 };
      }
    }

    // Filter by product category via pivot
    let proposalIds;
    if (product_category_id) {
      const catIds = Array.isArray(product_category_id) ? product_category_id : [product_category_id];
      const pivots = await prisma.product_category_sourcing_proposal.findMany({
        where: { product_category_id: { in: catIds.map(BigInt) } },
        select: { sourcing_proposal_id: true },
      });
      proposalIds = [...new Set(pivots.map((p) => p.sourcing_proposal_id))];
      if (proposalIds.length === 0) {
        return success(res, { data: [], pagination: { current_page: page, last_page: 1, total: 0, per_page: perPage } });
      }
      where.id = { in: proposalIds };
    }

    const [proposals, total] = await Promise.all([
      prisma.sourcing_proposals.findMany({
        where,
        include: {
          users_sourcing_proposals_user_idTousers: true,
          locations: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.sourcing_proposals.count({ where }),
    ]);

    const userId = req.user?.id || null;
    const result = await Promise.all(proposals.map((p) => formatProposal(p, userId, req)));

    return success(res, {
      data: result,
      pagination: {
        current_page: page,
        last_page: Math.ceil(total / perPage),
        total,
        per_page: perPage,
      },
    }, 'Proposals fetched successfully');
  } catch (err) {
    next(err);
  }
};

const show = async (req, res, next) => {
  try {
    const proposal = await prisma.sourcing_proposals.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
      include: {
        users_sourcing_proposals_user_idTousers: true,
        locations: true,
        proposal_comments: {
          where: { deleted_at: null },
          include: {
            users: true,
            proposal_comment_replies: {
              where: { deleted_at: null },
              include: { users: true },
              orderBy: { created_at: 'asc' },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!proposal) return notFound(res, 'Proposal not found');

    const userId = req.user?.id || null;
    const formatted = await formatProposal(proposal, userId, req);

    // Format comments
    formatted.comments = proposal.proposal_comments.map((c) => ({
      id: Number(c.id),
      comment: c.comment,
      created_at: c.created_at,
      user: {
        id: Number(c.users.id),
        first_name: c.users.first_name,
        last_name: c.users.last_name,
      },
      replies: c.proposal_comment_replies.map((r) => ({
        id: Number(r.id),
        reply: r.reply,
        created_at: r.created_at,
        user: {
          id: Number(r.users.id),
          first_name: r.users.first_name,
          last_name: r.users.last_name,
        },
      })),
    }));

    return success(res, formatted, 'Proposal details fetched successfully');
  } catch (err) {
    next(err);
  }
};

const myProposals = async (req, res, next) => {
  try {
    const proposals = await prisma.sourcing_proposals.findMany({
      where: { user_id: req.user.id, deleted_at: null },
      include: {
        users_sourcing_proposals_user_idTousers: true,
        locations: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const result = await Promise.all(proposals.map((p) => formatProposal(p, null, req)));

    return success(res, { data: result }, 'My proposals fetched');
  } catch (err) {
    next(err);
  }
};

const store = async (req, res, next) => {
  try {
    const data = {
      user_id: req.user.id,
      title: req.body.title,
      description: req.body.description,
      quantity: req.body.quantity ? parseFloat(req.body.quantity) : null,
      unit: req.body.unit || null,
      price: req.body.price ? parseFloat(req.body.price) : null,
      currency: req.body.currency || null,
      payment_method: req.body.payment_method,
      delivery_info: req.body.delivery_info || null,
      company_name: req.body.company_name || null,
      company_slug: req.body.company_slug || null,
      email: req.body.email || null,
      phone: req.body.phone || null,
      whatsapp: req.body.whatsapp || null,
      address: req.body.address || null,
      location_id: req.body.location_id ? BigInt(req.body.location_id) : null,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const proposal = await prisma.sourcing_proposals.create({ data });

    // Handle product categories pivot
    if (req.body.product_category_ids && Array.isArray(req.body.product_category_ids)) {
      const pivotData = req.body.product_category_ids.map((catId) => ({
        sourcing_proposal_id: proposal.id,
        product_category_id: BigInt(catId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (pivotData.length > 0) {
        await prisma.product_category_sourcing_proposal.createMany({ data: pivotData });
      }
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await addMedia(file, 'App\\Models\\SourcingProposal', proposal.id, 'proposal_images');
      }
    }

    return success(res, { id: Number(proposal.id) }, 'Proposal created successfully');
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const proposal = await prisma.sourcing_proposals.findFirst({
      where: { id: BigInt(req.params.id), user_id: req.user.id, deleted_at: null },
    });
    if (!proposal) return notFound(res, 'Proposal not found');

    const updateData = { updated_at: new Date() };
    const fields = ['title', 'description', 'delivery_info', 'company_name', 'company_slug', 'email', 'phone', 'whatsapp', 'address', 'payment_method', 'unit', 'currency'];
    fields.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f] || null; });
    if (req.body.quantity !== undefined) updateData.quantity = req.body.quantity ? parseFloat(req.body.quantity) : null;
    if (req.body.price !== undefined) updateData.price = req.body.price ? parseFloat(req.body.price) : null;
    if (req.body.location_id) updateData.location_id = BigInt(req.body.location_id);

    await prisma.sourcing_proposals.update({ where: { id: proposal.id }, data: updateData });

    // Sync product categories
    if (req.body.product_category_ids && Array.isArray(req.body.product_category_ids)) {
      await prisma.product_category_sourcing_proposal.deleteMany({ where: { sourcing_proposal_id: proposal.id } });
      const pivotData = req.body.product_category_ids.map((catId) => ({
        sourcing_proposal_id: proposal.id,
        product_category_id: BigInt(catId),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (pivotData.length > 0) {
        await prisma.product_category_sourcing_proposal.createMany({ data: pivotData });
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await addMedia(file, 'App\\Models\\SourcingProposal', proposal.id, 'proposal_images');
      }
    }

    return success(res, null, 'Proposal updated successfully');
  } catch (err) {
    next(err);
  }
};

const destroy = async (req, res, next) => {
  try {
    const proposal = await prisma.sourcing_proposals.findFirst({
      where: { id: BigInt(req.params.id), user_id: req.user.id, deleted_at: null },
    });
    if (!proposal) return notFound(res, 'Proposal not found');

    // Soft delete
    await prisma.sourcing_proposals.update({
      where: { id: proposal.id },
      data: { deleted_at: new Date(), updated_at: new Date() },
    });

    return success(res, null, 'Proposal deleted successfully');
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const proposal = await prisma.sourcing_proposals.findFirst({
      where: { id: BigInt(req.params.proposalId), user_id: req.user.id, deleted_at: null },
    });
    if (!proposal) return notFound(res, 'Proposal not found');

    await deleteMedia(BigInt(req.params.mediaId));
    return success(res, null, 'Image deleted successfully');
  } catch (err) {
    next(err);
  }
};

const getFilterOptions = async (req, res, next) => {
  try {
    const [locations, productCategories] = await Promise.all([
      prisma.locations.findMany({ orderBy: { name: 'asc' } }),
      prisma.product_categories.findMany({ orderBy: { name: 'asc' } }),
    ]);

    // Base URL for assets (flag_path already includes "flag/..." from DB)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'BDT', 'AUD', 'CAD', 'CHF'];
    const priceRanges = ['0-100', '100-500', '500-1000', '1000-5000', '5000-10000', '10000+'];

    return success(res, {
      locations: locations.map((l) => ({
        id: Number(l.id),
        name: l.name,
        country_code: l.country_code,
        phone_code: l.phone_code,
        flag_path: l.flag_path ? `${baseUrl}/${l.flag_path}` : null,
      })),
      product_categories: productCategories.map((pc) => ({ id: Number(pc.id), name: pc.name })),
      currencies,
      price_ranges: priceRanges,
    }, 'Filter options fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  publicList,
  show,
  myProposals,
  store,
  update,
  destroy,
  deleteImage,
  getFilterOptions,
  formatProposal,
};
