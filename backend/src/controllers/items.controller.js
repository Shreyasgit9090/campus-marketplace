const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const CATEGORIES = ['Calculator', 'Lab Uniform', 'Textbook', 'Notebook', 'Lab Record', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair', 'Worn'];

async function attachImages(items) {
  if (items.length === 0) return items;
  const ids = items.map((i) => i.id);
  const [images] = await pool.query(
    `SELECT item_id, file_path, sort_order FROM item_images
     WHERE item_id IN (?) ORDER BY item_id, sort_order`,
    [ids]
  );
  const byItem = new Map();
  for (const img of images) {
    if (!byItem.has(img.item_id)) byItem.set(img.item_id, []);
    byItem.get(img.item_id).push(img.file_path);
  }
  return items.map((item) => ({ ...item, images: byItem.get(item.id) || [] }));
}

// GET /api/items/preview-price?originalPrice=500&condition=Good
const previewPrice = asyncHandler(async (req, res) => {
  const { originalPrice, condition } = req.query;
  const price = Number(originalPrice);
  if (!price || price <= 0) throw new AppError(400, 'originalPrice must be a positive number');
  if (!CONDITIONS.includes(condition)) throw new AppError(400, 'Invalid condition');

  const [[row]] = await pool.query('SELECT fn_compute_price(?, ?) AS finalPrice', [price, condition]);
  res.json({ finalPrice: Number(row.finalPrice) });
});

// GET /api/items — browse/search with filters
const listItems = asyncHandler(async (req, res) => {
  const { category, search, status = 'Available', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const where = ['i.status = ?'];
  const whereParams = [status];
  const trimmedSearch = search && search.trim() ? search.trim() : null;

  if (category && CATEGORIES.includes(category)) {
    where.push('i.category = ?');
    whereParams.push(category);
  }

  if (trimmedSearch) {
    where.push('MATCH(i.name, i.description) AGAINST (? IN NATURAL LANGUAGE MODE)');
    whereParams.push(trimmedSearch);
  }

  const whereClause = where.join(' AND ');
  const searchSelect = trimmedSearch
    ? ', MATCH(i.name, i.description) AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance'
    : '';
  const orderBy = trimmedSearch ? 'relevance DESC' : 'i.created_at DESC';

  // SELECT-clause params (relevance, if present) come before WHERE-clause params.
  const selectParams = trimmedSearch ? [trimmedSearch, ...whereParams] : whereParams;

  const [rows] = await pool.query(
    `SELECT i.id, i.seller_id, i.category, i.custom_category, i.name, i.description,
            i.original_price, i.condition_tier, i.final_price, i.status, i.created_at,
            u.name AS seller_name${searchSelect}
     FROM items i
     JOIN users u ON u.id = i.seller_id
     WHERE ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...selectParams, limitNum, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM items i WHERE ${whereClause}`,
    whereParams
  );

  const withImages = await attachImages(rows);

  res.json({ items: withImages, page: pageNum, limit: limitNum, total });
});

// GET /api/items/mine
const listMyItems = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, category, custom_category, name, description, original_price,
            condition_tier, final_price, status, created_at, sold_at
     FROM items WHERE seller_id = ? ORDER BY created_at DESC`,
    [req.user.id]
  );
  const withImages = await attachImages(rows);
  res.json({ items: withImages });
});

// GET /api/items/:id
const getItem = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT i.id, i.seller_id, i.category, i.custom_category, i.name, i.description,
            i.original_price, i.condition_tier, i.final_price, i.status, i.created_at, i.sold_at,
            u.name AS seller_name, u.avg_rating AS seller_rating, u.rating_count AS seller_rating_count
     FROM items i
     JOIN users u ON u.id = i.seller_id
     WHERE i.id = ?`,
    [req.params.id]
  );
  const item = rows[0];
  if (!item) throw new AppError(404, 'Item not found');

  const [images] = await pool.query(
    'SELECT file_path FROM item_images WHERE item_id = ? ORDER BY sort_order',
    [item.id]
  );
  item.images = images.map((r) => r.file_path);

  res.json(item);
});

// POST /api/items
const createItem = asyncHandler(async (req, res) => {
  const { category, customCategory, name, description, originalPrice, conditionTier } = req.body;

  if (!CATEGORIES.includes(category)) throw new AppError(400, 'Invalid category');
  if (category === 'Other' && !customCategory?.trim()) {
    throw new AppError(400, 'customCategory is required when category is "Other"');
  }
  if (!CONDITIONS.includes(conditionTier)) throw new AppError(400, 'Invalid condition tier');
  const price = Number(originalPrice);
  if (!price || price <= 0) throw new AppError(400, 'originalPrice must be a positive number');
  if (!name?.trim()) throw new AppError(400, 'Item name is required');

  const [result] = await pool.query(
    `INSERT INTO items (seller_id, category, custom_category, name, description, original_price, condition_tier)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      category,
      category === 'Other' ? customCategory.trim() : null,
      name.trim(),
      description || null,
      price,
      conditionTier,
    ]
  );
  const itemId = result.insertId;

  const files = req.files || [];
  if (files.length > 0) {
    const values = files.map((f, idx) => [itemId, `/uploads/items/${f.filename}`, idx]);
    await pool.query('INSERT INTO item_images (item_id, file_path, sort_order) VALUES ?', [values]);
  }

  const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [itemId]);
  const [images] = await pool.query(
    'SELECT file_path FROM item_images WHERE item_id = ? ORDER BY sort_order',
    [itemId]
  );

  res.status(201).json({ ...rows[0], images: images.map((r) => r.file_path) });
});

// PATCH /api/items/:id — owner only, only while Available
const updateItem = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
  const item = rows[0];
  if (!item) throw new AppError(404, 'Item not found');
  if (item.seller_id !== req.user.id) throw new AppError(403, 'Not your listing');
  if (item.status !== 'Available') throw new AppError(409, 'Only Available listings can be edited');

  const { category, customCategory, name, description, originalPrice, conditionTier } = req.body;

  if (category && !CATEGORIES.includes(category)) throw new AppError(400, 'Invalid category');
  if (conditionTier && !CONDITIONS.includes(conditionTier)) throw new AppError(400, 'Invalid condition tier');
  if ((category || item.category) === 'Other' && !(customCategory ?? item.custom_category)?.trim()) {
    throw new AppError(400, 'customCategory is required when category is "Other"');
  }

  await pool.query(
    `UPDATE items SET
       category = COALESCE(?, category),
       custom_category = ?,
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       original_price = COALESCE(?, original_price),
       condition_tier = COALESCE(?, condition_tier)
     WHERE id = ?`,
    [
      category || null,
      category === 'Other' ? customCategory?.trim() : category ? null : item.custom_category,
      name?.trim() || null,
      description ?? null,
      originalPrice ? Number(originalPrice) : null,
      conditionTier || null,
      item.id,
    ]
  );

  const [updated] = await pool.query('SELECT * FROM items WHERE id = ?', [item.id]);
  res.json(updated[0]);
});

// DELETE /api/items/:id — owner only, only while Available
const deleteItem = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
  const item = rows[0];
  if (!item) throw new AppError(404, 'Item not found');
  if (item.seller_id !== req.user.id) throw new AppError(403, 'Not your listing');
  if (item.status !== 'Available') throw new AppError(409, 'Only Available listings can be deleted');

  const [images] = await pool.query('SELECT file_path FROM item_images WHERE item_id = ?', [item.id]);

  await pool.query('DELETE FROM items WHERE id = ?', [item.id]); // cascades to item_images

  for (const img of images) {
    const abs = path.join(__dirname, '..', '..', img.file_path.replace(/^\/uploads/, 'uploads'));
    fs.unlink(abs, () => {}); // best-effort cleanup, don't fail the request over it
  }

  res.status(204).send();
});

module.exports = {
  previewPrice,
  listItems,
  listMyItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  CATEGORIES,
  CONDITIONS,
};
