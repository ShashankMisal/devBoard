const asyncWrapper = (handler) => {
  return (req, res, next) => {
    // Promise.resolve lets the wrapper handle both async functions and sync handlers uniformly.
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

module.exports = asyncWrapper;
