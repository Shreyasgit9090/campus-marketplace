require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');
const startExpireReservationsJob = require('./jobs/expireReservations.job');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('MySQL connection OK');
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`CampusCart API listening on http://localhost:${PORT}`);
  });

  startExpireReservationsJob();
}

start();
