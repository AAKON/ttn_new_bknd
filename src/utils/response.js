const sendResponse = (res, { status = true, code = 200, message = '', data = null }) => {
  const response = { status, message, data, code };
  return res.status(code).json(response);
};

const success = (res, data = null, message = 'Success', code = 200) => {
  return sendResponse(res, { status: true, code, message, data });
};

const error = (res, message = 'Error', code = 500, data = null) => {
  return sendResponse(res, { status: false, code, message, data });
};

const validationError = (res, errors, message = 'Validation failed') => {
  return sendResponse(res, { status: false, code: 422, message, data: errors });
};

const notFound = (res, message = 'Not found') => {
  return sendResponse(res, { status: false, code: 404, message });
};

const unauthorized = (res, message = 'Unauthorized') => {
  return sendResponse(res, { status: false, code: 401, message });
};

const forbidden = (res, message = 'Forbidden') => {
  return sendResponse(res, { status: false, code: 403, message });
};

module.exports = { sendResponse, success, error, validationError, notFound, unauthorized, forbidden };
