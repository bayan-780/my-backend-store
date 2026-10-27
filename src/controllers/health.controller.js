
const { getConnection } = require('../config/db');

async function checkHealth(req, res) {
  try {
    const conn = await getConnection();
    await conn.query('SELECT 1'); // تعديل خاص بـ PostgreSQL

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
    });
  }
}

module.exports = { checkHealth };




