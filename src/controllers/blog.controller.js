const prisma = require('../config/database');
const { success, error, notFound } = require('../utils/response');
const { getMediaForModel } = require('../services/media.service');
const { getPaginationParams } = require('../utils/pagination');

const formatBlog = async (blog, includeFull = false) => {
  const media = await getMediaForModel('App\\Models\\Blog', blog.id, 'featured_image');
  const types = blog.blog_blog_types
    ? blog.blog_blog_types.map((bbt) => ({
        id: Number(bbt.blog_types.id),
        name: bbt.blog_types.name,
      }))
    : [];

  const result = {
    id: Number(blog.id),
    title: blog.title,
    slug: blog.slug,
    short_description: blog.short_description,
    author: blog.author,
    is_featured: blog.is_featured,
    status: blog.status,
    featured_image_url: media.length > 0 ? media[0].url : null,
    thumbnail_url: media.length > 0 ? media[0].url : null,
    blog_types: types,
    created_at: blog.created_at,
  };

  if (includeFull) {
    result.content = blog.content;
    result.meta_title = blog.meta_title;
    result.meta_description = blog.meta_description;
    result.meta_keywords = blog.meta_keywords;
  }

  return result;
};

const getBlogs = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { title, blog_type_id } = req.query;

    const where = { status: 'published' };
    if (title) where.title = { contains: title };

    // Handle blog_type filter via pivot
    let blogIds;
    if (blog_type_id) {
      const pivots = await prisma.blog_blog_types.findMany({
        where: { blog_type_id: BigInt(blog_type_id) },
        select: { blog_id: true },
      });
      blogIds = pivots.map((p) => p.blog_id);
      if (blogIds.length === 0) {
        return success(res, { data: [], pagination: { current_page: page, last_page: 1, total: 0, per_page: perPage } });
      }
      where.id = { in: blogIds };
    }

    const [blogs, total] = await Promise.all([
      prisma.blogs.findMany({
        where,
        include: {
          blog_blog_types: { include: { blog_types: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.blogs.count({ where }),
    ]);

    const result = await Promise.all(blogs.map((b) => formatBlog(b)));

    return success(res, {
      data: result,
      pagination: {
        current_page: page,
        last_page: Math.ceil(total / perPage),
        total,
        per_page: perPage,
      },
    }, 'Blogs fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getFeaturedBlogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.number_of_blogs) || 6;

    const blogs = await prisma.blogs.findMany({
      where: { status: 'published', is_featured: true },
      include: {
        blog_blog_types: { include: { blog_types: true } },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    const result = await Promise.all(blogs.map((b) => formatBlog(b)));

    return success(res, { TNN_picks: result }, 'Featured blogs fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getBlogDetails = async (req, res, next) => {
  try {
    const blog = await prisma.blogs.findUnique({
      where: { slug: req.params.slug },
      include: {
        blog_blog_types: { include: { blog_types: true } },
      },
    });

    if (!blog) return notFound(res, 'Blog not found');

    const result = await formatBlog(blog, true);
    return success(res, result, 'Blog details fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getBlogTypes = async (req, res, next) => {
  try {
    const types = await prisma.blog_types.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
    });

    const result = types.map((t) => ({ id: Number(t.id), name: t.name }));
    return success(res, result, 'Blog types fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBlogs,
  getFeaturedBlogs,
  getBlogDetails,
  getBlogTypes,
  formatBlog,
};
