const prisma = require('../../config/database');
const { success } = require('../../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCompanies,
      activeCompanies,
      totalBlogs,
      publishedBlogs,
      totalProposals,
      pendingProposals,
      totalContacts,
      totalNewsletters,
      totalClaims,
      pendingClaims,
    ] = await Promise.all([
      prisma.users.count({ where: { deleted_at: null } }),
      prisma.companies.count({ where: { deleted_at: null } }),
      prisma.companies.count({ where: { is_active: true, deleted_at: null } }),
      prisma.blogs.count(),
      prisma.blogs.count({ where: { status: 'published' } }),
      prisma.sourcing_proposals.count({ where: { deleted_at: null } }),
      prisma.sourcing_proposals.count({ where: { status: 'pending', deleted_at: null } }),
      prisma.contact_messages.count({ where: { deleted_at: null } }),
      prisma.news_letters.count({ where: { deleted_at: null } }),
      prisma.company_claims.count(),
      prisma.company_claims.count({ where: { status: 'pending' } }),
    ]);

    // Recent users
    const recentUsers = await prisma.users.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { id: true, first_name: true, last_name: true, email: true, created_at: true },
    });

    // Recent companies
    const recentCompanies = await prisma.companies.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, status: true, created_at: true },
    });

    return success(res, {
      stats: {
        total_users: totalUsers,
        total_companies: totalCompanies,
        active_companies: activeCompanies,
        total_blogs: totalBlogs,
        published_blogs: publishedBlogs,
        total_proposals: totalProposals,
        pending_proposals: pendingProposals,
        total_contacts: totalContacts,
        total_newsletters: totalNewsletters,
        total_claims: totalClaims,
        pending_claims: pendingClaims,
      },
      recent_users: recentUsers.map((u) => ({ ...u, id: Number(u.id) })),
      recent_companies: recentCompanies.map((c) => ({ ...c, id: Number(c.id) })),
    }, 'Dashboard data fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
