const normalizePositiveInteger = (value, fallbackValue) => {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return fallbackValue;
  }

  return parsedValue;
};

const paginate = async (query, page = 1, limit = 10) => {
  const currentPage = normalizePositiveInteger(page, 1);
  const sanitizedLimit = Math.min(normalizePositiveInteger(limit, 10), 50);
  const skip = (currentPage - 1) * sanitizedLimit;

  // Counting against the same filter keeps page metadata consistent with the actual query data.
  const totalDocs = await query.model.countDocuments(query.getFilter());
  const data = await query.clone().skip(skip).limit(sanitizedLimit);
  const totalPages = totalDocs === 0 ? 0 : Math.ceil(totalDocs / sanitizedLimit);

  return {
    data,
    totalDocs,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1 && totalPages > 0
  };
};

module.exports = paginate;
