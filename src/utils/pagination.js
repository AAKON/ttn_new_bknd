const paginate = async (model, { where = {}, orderBy = { created_at: 'desc' }, include, select, page = 1, perPage = 10 }) => {
  const skip = (page - 1) * perPage;

  const queryArgs = {
    where,
    orderBy,
    skip,
    take: perPage,
  };

  if (include) queryArgs.include = include;
  if (select) queryArgs.select = select;

  const [data, total] = await Promise.all([
    model.findMany(queryArgs),
    model.count({ where }),
  ]);

  return {
    data,
    meta: {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.ceil(total / perPage),
    },
  };
};

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(query.per_page || query.perPage) || 10));
  return { page, perPage };
};

module.exports = { paginate, getPaginationParams };
