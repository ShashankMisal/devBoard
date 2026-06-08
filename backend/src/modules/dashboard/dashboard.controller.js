const ApiResponse = require('../../utils/ApiResponse');
const dashboardService = require('./dashboard.service');

const getSummary = async (req, res) => {
  const summary = await dashboardService.getSummary(req.user._id);
  const response = new ApiResponse(200, 'Dashboard summary fetched successfully.', summary);

  res.status(response.statusCode).json(response);
};

module.exports = {
  getSummary
};
