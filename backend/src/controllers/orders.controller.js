const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const callProcedure = require('../utils/callProcedure');

async function getFullOrder(orderId) {
  const [rows] = await pool.query(
    `SELECT o.id, o.item_id, o.buyer_id, o.seller_id, o.item_price, o.status,
            o.reserved_at, o.expires_at, o.completed_at, o.cancelled_at,
            i.name AS item_name, i.category, i.condition_tier,
            buyer.name AS buyer_name, buyer.phone AS buyer_phone,
            seller.name AS seller_name, seller.phone AS seller_phone
     FROM orders o
     JOIN items i ON i.id = o.item_id
     JOIN users buyer ON buyer.id = o.buyer_id
     JOIN users seller ON seller.id = o.seller_id
     WHERE o.id = ?`,
    [orderId]
  );
  return rows[0];
}

// Reveals the counterparty's phone only to buyer/seller of this specific order.
function scopeOrderForViewer(order, viewerId) {
  const { buyer_phone, seller_phone, ...rest } = order;
  if (viewerId === order.buyer_id) return { ...rest, counterpartyPhone: seller_phone };
  if (viewerId === order.seller_id) return { ...rest, counterpartyPhone: buyer_phone };
  return rest;
}

// POST /api/orders — buyer places a reservation on an item
const placeOrder = asyncHandler(async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) throw new AppError(400, 'itemId is required');

  const result = await callProcedure(
    pool,
    'CALL sp_reserve_item(?, ?, @order_id, @out_status)',
    [itemId, req.user.id],
    ['order_id', 'out_status']
  );

  switch (result.out_status) {
    case 'NOT_FOUND':
      throw new AppError(404, 'Item not found');
    case 'OWN_ITEM':
      throw new AppError(400, "You can't order your own listing");
    case 'UNAVAILABLE':
      throw new AppError(409, 'This item is no longer available');
    case 'OK':
      break;
    default:
      throw new AppError(500, 'Unexpected error placing order');
  }

  const order = await getFullOrder(result.order_id);
  res.status(201).json(scopeOrderForViewer(order, req.user.id));
});

// POST /api/orders/:id/cancel — seller cancels early
const cancelOrder = asyncHandler(async (req, res) => {
  const result = await callProcedure(
    pool,
    'CALL sp_cancel_reservation(?, ?, @out_status)',
    [req.params.id, req.user.id],
    ['out_status']
  );

  switch (result.out_status) {
    case 'NOT_FOUND':
      throw new AppError(404, 'Order not found');
    case 'FORBIDDEN':
      throw new AppError(403, 'Only the seller can cancel this reservation');
    case 'INVALID_STATE':
      throw new AppError(409, 'Only Reserved orders can be cancelled');
    case 'OK':
      break;
    default:
      throw new AppError(500, 'Unexpected error cancelling order');
  }

  const order = await getFullOrder(req.params.id);
  res.json(scopeOrderForViewer(order, req.user.id));
});

// POST /api/orders/:id/complete — seller marks sold after handover
const completeOrder = asyncHandler(async (req, res) => {
  const result = await callProcedure(
    pool,
    'CALL sp_mark_sold(?, ?, @out_status)',
    [req.params.id, req.user.id],
    ['out_status']
  );

  switch (result.out_status) {
    case 'NOT_FOUND':
      throw new AppError(404, 'Order not found');
    case 'FORBIDDEN':
      throw new AppError(403, 'Only the seller can mark this order sold');
    case 'INVALID_STATE':
      throw new AppError(409, 'Only Reserved orders can be marked sold');
    case 'OK':
      break;
    default:
      throw new AppError(500, 'Unexpected error completing order');
  }

  const order = await getFullOrder(req.params.id);
  res.json(scopeOrderForViewer(order, req.user.id));
});

// GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await getFullOrder(req.params.id);
  if (!order) throw new AppError(404, 'Order not found');
  if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
    throw new AppError(403, 'Not your order');
  }
  res.json(scopeOrderForViewer(order, req.user.id));
});

// GET /api/orders/mine — buyer's orders (active + past)
const listMyOrders = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.item_id, o.item_price, o.status, o.reserved_at, o.expires_at, o.completed_at,
            i.name AS item_name, i.condition_tier, i.category,
            seller.name AS seller_name
     FROM orders o
     JOIN items i ON i.id = o.item_id
     JOIN users seller ON seller.id = o.seller_id
     WHERE o.buyer_id = ?
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ orders: rows });
});

// GET /api/orders/selling — orders placed on the current user's items
const listSellingOrders = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT o.id, o.item_id, o.item_price, o.status, o.reserved_at, o.expires_at, o.completed_at,
            i.name AS item_name, i.condition_tier, i.category,
            buyer.name AS buyer_name
     FROM orders o
     JOIN items i ON i.id = o.item_id
     JOIN users buyer ON buyer.id = o.buyer_id
     WHERE o.seller_id = ?
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json({ orders: rows });
});

module.exports = { placeOrder, cancelOrder, completeOrder, getOrder, listMyOrders, listSellingOrders };
