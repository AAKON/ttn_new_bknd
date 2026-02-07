const prisma = require('../config/database');
const { success, error, notFound } = require('../utils/response');
const { formatCompanyListItem } = require('./company.controller');
const { formatProposal } = require('./sourcingProposal.controller');

// Company favorites
const getFavoriteCompanies = async (req, res, next) => {
  try {
    const favs = await prisma.company_user.findMany({
      where: { user_id: req.user.id },
    });

    const companyIds = favs.map((f) => f.company_id);
    if (companyIds.length === 0) return success(res, [], 'Favorites fetched');

    const companies = await prisma.companies.findMany({
      where: { id: { in: companyIds }, deleted_at: null },
      include: {
        locations: true,
        business_categories: true,
        company_business_categories: { include: { business_categories: true } },
        company_business_types: { include: { business_types: true } },
        company_certificates: { include: { certificates: true } },
      },
    });

    const result = await Promise.all(
      companies.map((c) => formatCompanyListItem(c, req.user.id))
    );

    return success(res, result, 'Favorites fetched successfully');
  } catch (err) {
    next(err);
  }
};

const toggleFavoriteCompany = async (req, res, next) => {
  try {
    const company = await prisma.companies.findFirst({
      where: { slug: req.params.slug, deleted_at: null },
    });
    if (!company) return notFound(res, 'Company not found');

    const existing = await prisma.company_user.findFirst({
      where: { company_id: company.id, user_id: req.user.id },
    });

    if (existing) {
      await prisma.company_user.delete({ where: { id: existing.id } });
      return success(res, { is_favorite: false }, 'Removed from favorites');
    } else {
      await prisma.company_user.create({
        data: {
          company_id: company.id,
          user_id: req.user.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return success(res, { is_favorite: true }, 'Added to favorites');
    }
  } catch (err) {
    next(err);
  }
};

// Proposal favorites
const getFavoriteProposals = async (req, res, next) => {
  try {
    const favs = await prisma.favorite_proposals.findMany({
      where: { user_id: req.user.id },
      include: {
        sourcing_proposals: {
          include: {
            users_sourcing_proposals_user_idTousers: true,
            locations: true,
          },
        },
      },
    });

    const result = await Promise.all(
      favs
        .filter((f) => f.sourcing_proposals && !f.sourcing_proposals.deleted_at)
        .map((f) => formatProposal(f.sourcing_proposals, req.user.id))
    );

    return success(res, { data: result }, 'Favorite proposals fetched');
  } catch (err) {
    next(err);
  }
};

const addFavoriteProposal = async (req, res, next) => {
  try {
    const proposal = await prisma.sourcing_proposals.findFirst({
      where: { id: BigInt(req.params.id), deleted_at: null },
    });
    if (!proposal) return notFound(res, 'Proposal not found');

    const existing = await prisma.favorite_proposals.findFirst({
      where: { user_id: req.user.id, sourcing_proposal_id: proposal.id },
    });

    if (!existing) {
      await prisma.favorite_proposals.create({
        data: {
          user_id: req.user.id,
          sourcing_proposal_id: proposal.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return success(res, null, 'Added to favorites');
  } catch (err) {
    next(err);
  }
};

const removeFavoriteProposal = async (req, res, next) => {
  try {
    await prisma.favorite_proposals.deleteMany({
      where: { user_id: req.user.id, sourcing_proposal_id: BigInt(req.params.id) },
    });
    return success(res, null, 'Removed from favorites');
  } catch (err) {
    next(err);
  }
};

const toggleFavoriteProposal = async (req, res, next) => {
  try {
    const existing = await prisma.favorite_proposals.findFirst({
      where: { user_id: req.user.id, sourcing_proposal_id: BigInt(req.params.id) },
    });

    if (existing) {
      await prisma.favorite_proposals.delete({ where: { id: existing.id } });
      return success(res, { is_favorited: false }, 'Removed from favorites');
    } else {
      await prisma.favorite_proposals.create({
        data: {
          user_id: req.user.id,
          sourcing_proposal_id: BigInt(req.params.id),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      return success(res, { is_favorited: true }, 'Added to favorites');
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFavoriteCompanies,
  toggleFavoriteCompany,
  getFavoriteProposals,
  addFavoriteProposal,
  removeFavoriteProposal,
  toggleFavoriteProposal,
};
