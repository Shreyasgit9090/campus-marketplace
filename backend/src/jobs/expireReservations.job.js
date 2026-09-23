const cron = require('node-cron');
const pool = require('../config/db');

// Fallback to the MySQL EVENT (ev_expire_reservations) for local setups where
// the event scheduler isn't enabled. Calls the same procedure, so behavior
// is identical either way.
function startExpireReservationsJob() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await pool.query('CALL sp_expire_reservations()');
    } catch (err) {
      console.error('[expireReservationsJob] failed:', err.message);
    }
  });
  console.log('Reservation-expiry fallback job scheduled (every 15 min).');
}

module.exports = startExpireReservationsJob;
