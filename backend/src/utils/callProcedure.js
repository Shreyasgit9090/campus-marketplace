// Calls a stored procedure that reports results via OUT parameters bound to
// session variables (e.g. `CALL sp_reserve_item(?, ?, @order_id, @out_status)`).
// Session variables are connection-scoped, so the CALL and the follow-up
// SELECT must run on the SAME connection — a plain pool.query() for each
// could hand them to two different pooled connections and silently return
// nothing.
async function callProcedure(pool, sql, params, outVars) {
  const conn = await pool.getConnection();
  try {
    await conn.query(sql, params);
    const [[row]] = await conn.query(
      `SELECT ${outVars.map((v) => `@${v} AS ${v}`).join(', ')}`
    );
    return row;
  } finally {
    conn.release();
  }
}

module.exports = callProcedure;
