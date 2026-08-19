/**
 * Async handler utility to wrap asynchronous Express route handlers
 * and catch any errors, passing them to Express's next middleware.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = asyncHandler;
