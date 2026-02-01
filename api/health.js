/**
 * GET /api/health
 * Health check
 */

module.exports = async (req, res) => {
  res.json({
    status: 'ok',
    service: 'Molt Connect 4',
    version: '1.0.0'
  });
};
