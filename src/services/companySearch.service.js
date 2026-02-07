const prisma = require('../config/database');

/**
 * Full-text search for companies using MySQL MATCH...AGAINST
 * Requires FULLTEXT index on companies(name, moto, tags, about, keywords)
 *
 * Run this SQL to create the index:
 * ALTER TABLE companies ADD FULLTEXT INDEX ft_companies_search (name, moto, tags, about, keywords);
 */
const searchCompaniesFullText = async (keyword, options = {}) => {
  const { page = 1, perPage = 10, locationId, businessCategoryIds, businessTypeIds, certificateIds, manpower } = options;

  const offset = (page - 1) * perPage;

  let whereClause = 'c.is_active = 1 AND c.deleted_at IS NULL';
  const params = [];

  // Full-text search
  if (keyword && keyword.trim()) {
    whereClause += ` AND MATCH(c.name, c.moto, c.tags, c.about, c.keywords) AGAINST(? IN BOOLEAN MODE)`;
    params.push(`*${keyword}*`);
  }

  if (locationId) {
    whereClause += ` AND c.location_id = ?`;
    params.push(BigInt(locationId));
  }

  if (manpower && manpower.length > 0) {
    whereClause += ` AND c.manpower IN (${manpower.map(() => '?').join(',')})`;
    params.push(...manpower);
  }

  // Build subquery joins for pivot table filters
  let joins = '';

  if (businessCategoryIds && businessCategoryIds.length > 0) {
    joins += ` INNER JOIN company_business_categories cbc ON cbc.company_id = c.id AND cbc.business_category_id IN (${businessCategoryIds.map(() => '?').join(',')})`;
    params.push(...businessCategoryIds.map(BigInt));
  }

  if (businessTypeIds && businessTypeIds.length > 0) {
    joins += ` INNER JOIN company_business_types cbt ON cbt.company_id = c.id AND cbt.business_type_id IN (${businessTypeIds.map(() => '?').join(',')})`;
    params.push(...businessTypeIds.map(BigInt));
  }

  if (certificateIds && certificateIds.length > 0) {
    joins += ` INNER JOIN company_certificates cc ON cc.company_id = c.id AND cc.certificate_id IN (${certificateIds.map(() => '?').join(',')})`;
    params.push(...certificateIds.map(BigInt));
  }

  // Count query
  const countQuery = `SELECT COUNT(DISTINCT c.id) as total FROM companies c ${joins} WHERE ${whereClause}`;
  const countResult = await prisma.$queryRawUnsafe(countQuery, ...params);
  const total = Number(countResult[0]?.total || 0);

  // Data query with relevance score
  let orderBy = 'c.created_at DESC';
  if (keyword && keyword.trim()) {
    orderBy = `MATCH(c.name, c.moto, c.tags, c.about, c.keywords) AGAINST(? IN BOOLEAN MODE) DESC, c.created_at DESC`;
  }

  const dataParams = [...params];
  if (keyword && keyword.trim()) {
    dataParams.push(`*${keyword}*`);
  }
  dataParams.push(perPage, offset);

  const dataQuery = `
    SELECT DISTINCT c.id, c.name, c.slug, c.moto, c.tags, c.about, c.manpower,
           c.view_count, c.is_active, c.status, c.location_id, c.business_category_id
    FROM companies c
    ${joins}
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const companies = await prisma.$queryRawUnsafe(dataQuery, ...dataParams);

  return {
    data: companies.map((c) => ({ ...c, id: Number(c.id), location_id: Number(c.location_id), business_category_id: c.business_category_id ? Number(c.business_category_id) : null })),
    total,
    page,
    perPage,
    lastPage: Math.ceil(total / perPage),
  };
};

/**
 * Full-text search for sourcing proposals
 * Requires FULLTEXT index on sourcing_proposals(title, description, company_name)
 *
 * Run this SQL to create the index:
 * ALTER TABLE sourcing_proposals ADD FULLTEXT INDEX ft_proposals_search (title, description, company_name);
 */
const searchProposalsFullText = async (keyword, options = {}) => {
  const { page = 1, perPage = 10 } = options;
  const offset = (page - 1) * perPage;

  let whereClause = `sp.status = 'approved' AND sp.deleted_at IS NULL`;
  const params = [];

  if (keyword && keyword.trim()) {
    whereClause += ` AND MATCH(sp.title, sp.description, sp.company_name) AGAINST(? IN BOOLEAN MODE)`;
    params.push(`*${keyword}*`);
  }

  const countResult = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as total FROM sourcing_proposals sp WHERE ${whereClause}`,
    ...params
  );
  const total = Number(countResult[0]?.total || 0);

  const dataParams = [...params];
  if (keyword && keyword.trim()) {
    dataParams.push(`*${keyword}*`);
  }
  dataParams.push(perPage, offset);

  let orderBy = 'sp.created_at DESC';
  if (keyword && keyword.trim()) {
    orderBy = `MATCH(sp.title, sp.description, sp.company_name) AGAINST(? IN BOOLEAN MODE) DESC, sp.created_at DESC`;
  }

  const proposals = await prisma.$queryRawUnsafe(
    `SELECT sp.* FROM sourcing_proposals sp WHERE ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    ...dataParams
  );

  return {
    data: proposals.map((p) => ({ ...p, id: Number(p.id) })),
    total,
    page,
    perPage,
    lastPage: Math.ceil(total / perPage),
  };
};

module.exports = { searchCompaniesFullText, searchProposalsFullText };
