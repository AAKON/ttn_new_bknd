const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: false,
        message: 'A record with this value already exists',
        data: null,
        code: 409,
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'Record not found',
        data: null,
        code: 404,
      });
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      status: false,
      message: 'Invalid data provided',
      data: null,
      code: 400,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: false,
    message: err.message || 'Internal server error',
    data: null,
    code: statusCode,
  });
};

module.exports = errorHandler;
