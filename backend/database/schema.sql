-- ============================================================================
-- Campus Marketplace — MySQL schema
-- MSRIT student marketplace: buy/sell listings, reservations, ratings, reports
--
-- Run with:  mysql -u root -p < schema.sql
-- Requires event_scheduler for automatic reservation expiry — see bottom note.
-- ============================================================================

DROP DATABASE IF EXISTS campus_marketplace;
CREATE DATABASE campus_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_marketplace;

-- ----------------------------------------------------------------------------
-- app_settings — small key/value config table.
-- Lets tunable numbers (discount %, reservation window, report threshold)
-- change without a code deploy, and keeps them out of hardcoded trigger logic.
-- ----------------------------------------------------------------------------
CREATE TABLE app_settings (
  setting_key   VARCHAR(50)  PRIMARY KEY,
  setting_value VARCHAR(100) NOT NULL
);

INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('discount_new_pct', '5'),         -- "New" tier: spec says 0-10% off; 5% is the deterministic midpoint. Adjust if you want a different rule.
  ('discount_good_pct', '25'),
  ('discount_fair_pct', '50'),
  ('discount_worn_pct', '70'),
  ('reservation_hours', '48'),
  ('report_suspend_threshold', '3'); -- auto-suspend after MORE than this many pending reports

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL UNIQUE,   -- must end in @msrit.edu, enforced at app layer on signup
  password_hash  VARCHAR(255)  NOT NULL,
  phone          VARCHAR(20)   NULL,
  is_verified    TINYINT(1)    NOT NULL DEFAULT 0, -- flips to 1 after OTP verification
  is_admin       TINYINT(1)    NOT NULL DEFAULT 0,
  is_suspended   TINYINT(1)    NOT NULL DEFAULT 0,
  rating_sum     INT UNSIGNED  NOT NULL DEFAULT 0,
  rating_count   INT UNSIGNED  NOT NULL DEFAULT 0,
  avg_rating     DECIMAL(3,2)  GENERATED ALWAYS AS (
                    IF(rating_count = 0, 0, ROUND(rating_sum / rating_count, 2))
                  ) STORED,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- otp_codes — used for both signup verification and password reset.
-- Stores a hash of the OTP, never the plaintext code.
-- ----------------------------------------------------------------------------
CREATE TABLE otp_codes (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(150) NOT NULL,
  code_hash    VARCHAR(255) NOT NULL,
  purpose      ENUM('signup', 'password_reset') NOT NULL,
  expires_at   DATETIME     NOT NULL,
  consumed_at  DATETIME     NULL,
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email_purpose (email, purpose)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- items
-- ----------------------------------------------------------------------------
CREATE TABLE items (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  seller_id        INT UNSIGNED NOT NULL,
  category         ENUM('Calculator', 'Lab Uniform', 'Textbook', 'Notebook', 'Lab Record', 'Other') NOT NULL,
  custom_category  VARCHAR(100) NULL,     -- required when category = 'Other'
  name             VARCHAR(150) NOT NULL,
  description      TEXT NULL,
  original_price   DECIMAL(10,2) NOT NULL,
  condition_tier   ENUM('New', 'Good', 'Fair', 'Worn') NOT NULL,
  final_price      DECIMAL(10,2) NOT NULL, -- computed by trg_items_before_insert/update, never written directly by the app
  status           ENUM('Available', 'Reserved', 'Sold') NOT NULL DEFAULT 'Available',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  sold_at          DATETIME NULL,

  CONSTRAINT fk_items_seller FOREIGN KEY (seller_id) REFERENCES users(id),
  CONSTRAINT chk_items_price CHECK (original_price > 0),

  INDEX idx_items_status (status),
  INDEX idx_items_category (category),
  INDEX idx_items_seller (seller_id),
  FULLTEXT INDEX ftx_items_search (name, description)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- item_images
-- ----------------------------------------------------------------------------
CREATE TABLE item_images (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id     INT UNSIGNED NOT NULL,
  file_path   VARCHAR(255) NOT NULL, -- relative path under /uploads, e.g. /uploads/items/xyz.jpg
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_images_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_images_item (item_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- orders — doubles as the "reservation" record. One row per reservation
-- attempt/lifecycle (Reserved -> Completed | Cancelled | Expired).
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id       INT UNSIGNED NOT NULL,
  buyer_id      INT UNSIGNED NOT NULL,
  seller_id     INT UNSIGNED NOT NULL, -- denormalized snapshot, simplifies history queries
  item_price    DECIMAL(10,2) NOT NULL, -- snapshot of items.final_price at reservation time
  status        ENUM('Reserved', 'Completed', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Reserved',
  reserved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME NOT NULL,
  completed_at  DATETIME NULL,
  cancelled_at  DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  CONSTRAINT fk_orders_seller FOREIGN KEY (seller_id) REFERENCES users(id),

  INDEX idx_orders_buyer (buyer_id),
  INDEX idx_orders_seller (seller_id),
  INDEX idx_orders_item (item_id),
  INDEX idx_orders_status_expiry (status, expires_at) -- scanned by the expiry job/event
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- ratings — buyer and seller rate each other after a Completed order.
-- ----------------------------------------------------------------------------
CREATE TABLE ratings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED NOT NULL,
  rater_id    INT UNSIGNED NOT NULL,
  ratee_id    INT UNSIGNED NOT NULL,
  stars       TINYINT UNSIGNED NOT NULL,
  comment     VARCHAR(500) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ratings_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_ratings_rater FOREIGN KEY (rater_id) REFERENCES users(id),
  CONSTRAINT fk_ratings_ratee FOREIGN KEY (ratee_id) REFERENCES users(id),
  CONSTRAINT chk_ratings_stars CHECK (stars BETWEEN 1 AND 5),
  CONSTRAINT uq_ratings_order_rater UNIQUE (order_id, rater_id), -- one rating per person per order

  INDEX idx_ratings_ratee (ratee_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- reports
-- ----------------------------------------------------------------------------
CREATE TABLE reports (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id   INT UNSIGNED NOT NULL,
  reported_id   INT UNSIGNED NOT NULL,
  reason        VARCHAR(500) NOT NULL,
  status        ENUM('Pending', 'Reviewed', 'Dismissed') NOT NULL DEFAULT 'Pending',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at   DATETIME NULL,
  reviewed_by   INT UNSIGNED NULL,

  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_reports_reported FOREIGN KEY (reported_id) REFERENCES users(id),
  CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),

  INDEX idx_reports_reported_status (reported_id, status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  type        ENUM('order_placed', 'reservation_expiring', 'item_sold', 'new_rating', 'account_suspended') NOT NULL,
  message     VARCHAR(255) NOT NULL,
  related_id  INT UNSIGNED NULL, -- item id, order id, or rating id depending on type
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notifications_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- ============================================================================
-- FUNCTION: fn_compute_price
-- Applies the condition-tier discount to an item's original price.
-- ============================================================================
DELIMITER $$

CREATE FUNCTION fn_compute_price(p_original_price DECIMAL(10,2), p_condition VARCHAR(10))
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_pct DECIMAL(5,2);

  SELECT CAST(setting_value AS DECIMAL(5,2)) INTO v_pct
  FROM app_settings
  WHERE setting_key = CASE p_condition
    WHEN 'New'  THEN 'discount_new_pct'
    WHEN 'Good' THEN 'discount_good_pct'
    WHEN 'Fair' THEN 'discount_fair_pct'
    WHEN 'Worn' THEN 'discount_worn_pct'
  END;

  RETURN ROUND(p_original_price * (1 - v_pct / 100), 2);
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGERS: keep items.final_price in sync (app never writes it directly)
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_items_before_insert
BEFORE INSERT ON items
FOR EACH ROW
BEGIN
  SET NEW.final_price = fn_compute_price(NEW.original_price, NEW.condition_tier);
END$$

CREATE TRIGGER trg_items_before_update
BEFORE UPDATE ON items
FOR EACH ROW
BEGIN
  IF NEW.original_price <> OLD.original_price OR NEW.condition_tier <> OLD.condition_tier THEN
    SET NEW.final_price = fn_compute_price(NEW.original_price, NEW.condition_tier);
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGER: rating aggregation + notification
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_ratings_after_insert
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
  UPDATE users
  SET rating_sum = rating_sum + NEW.stars,
      rating_count = rating_count + 1
  WHERE id = NEW.ratee_id;

  INSERT INTO notifications (user_id, type, message, related_id)
  VALUES (NEW.ratee_id, 'new_rating', CONCAT('You received a new ', NEW.stars, '-star rating.'), NEW.id);
END$$

DELIMITER ;

-- ============================================================================
-- TRIGGER: auto-suspend on report threshold breach
-- ============================================================================
DELIMITER $$

CREATE TRIGGER trg_reports_after_insert
AFTER INSERT ON reports
FOR EACH ROW
BEGIN
  DECLARE v_threshold INT;
  DECLARE v_pending_count INT;

  SELECT CAST(setting_value AS UNSIGNED) INTO v_threshold
  FROM app_settings WHERE setting_key = 'report_suspend_threshold';

  SELECT COUNT(*) INTO v_pending_count
  FROM reports WHERE reported_id = NEW.reported_id AND status = 'Pending';

  IF v_pending_count > v_threshold THEN
    UPDATE users SET is_suspended = 1 WHERE id = NEW.reported_id;

    INSERT INTO notifications (user_id, type, message, related_id)
    VALUES (NEW.reported_id, 'account_suspended', 'Your account has been suspended pending review due to multiple reports.', NEW.id);
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- PROCEDURE: sp_reserve_item
-- The core of the reservation state machine. Locks the item row so two
-- concurrent buyers cannot both reserve it (SELECT ... FOR UPDATE inside a
-- transaction — safe under InnoDB's REPEATABLE READ).
--
-- p_out_status values: 'OK', 'NOT_FOUND', 'UNAVAILABLE', 'OWN_ITEM'
-- ============================================================================
DELIMITER $$

CREATE PROCEDURE sp_reserve_item(
  IN  p_item_id   INT UNSIGNED,
  IN  p_buyer_id  INT UNSIGNED,
  OUT p_order_id  INT UNSIGNED,
  OUT p_out_status VARCHAR(20)
)
proc: BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_seller_id INT UNSIGNED;
  DECLARE v_price DECIMAL(10,2);
  DECLARE v_hours INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_order_id = NULL;

  START TRANSACTION;

  SELECT status, seller_id, final_price
  INTO v_status, v_seller_id, v_price
  FROM items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    SET p_out_status = 'NOT_FOUND';
    ROLLBACK;
    LEAVE proc;
  END IF;

  IF v_seller_id = p_buyer_id THEN
    SET p_out_status = 'OWN_ITEM';
    ROLLBACK;
    LEAVE proc;
  END IF;

  IF v_status <> 'Available' THEN
    SET p_out_status = 'UNAVAILABLE';
    ROLLBACK;
    LEAVE proc;
  END IF;

  SELECT CAST(setting_value AS UNSIGNED) INTO v_hours
  FROM app_settings WHERE setting_key = 'reservation_hours';

  UPDATE items SET status = 'Reserved' WHERE id = p_item_id;

  INSERT INTO orders (item_id, buyer_id, seller_id, item_price, status, expires_at)
  VALUES (p_item_id, p_buyer_id, v_seller_id, v_price, 'Reserved', NOW() + INTERVAL v_hours HOUR);

  SET p_order_id = LAST_INSERT_ID();

  INSERT INTO notifications (user_id, type, message, related_id)
  VALUES (v_seller_id, 'order_placed', 'Someone placed an order on your item.', p_order_id);

  SET p_out_status = 'OK';
  COMMIT;
END$$

DELIMITER ;

-- ============================================================================
-- PROCEDURE: sp_cancel_reservation
-- Seller-initiated early cancel. Only the seller on the order may cancel.
--
-- p_out_status values: 'OK', 'NOT_FOUND', 'FORBIDDEN', 'INVALID_STATE'
-- ============================================================================
DELIMITER $$

CREATE PROCEDURE sp_cancel_reservation(
  IN  p_order_id  INT UNSIGNED,
  IN  p_actor_id  INT UNSIGNED,
  OUT p_out_status VARCHAR(20)
)
proc: BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_seller_id INT UNSIGNED;
  DECLARE v_buyer_id INT UNSIGNED;
  DECLARE v_item_id INT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT status, seller_id, buyer_id, item_id
  INTO v_status, v_seller_id, v_buyer_id, v_item_id
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    SET p_out_status = 'NOT_FOUND';
    ROLLBACK;
    LEAVE proc;
  END IF;

  IF v_seller_id <> p_actor_id THEN
    SET p_out_status = 'FORBIDDEN';
    ROLLBACK;
    LEAVE proc;
  END IF;

  IF v_status <> 'Reserved' THEN
    SET p_out_status = 'INVALID_STATE';
    ROLLBACK;
    LEAVE proc;
  END IF;

  UPDATE orders SET status = 'Cancelled', cancelled_at = NOW() WHERE id = p_order_id;
  UPDATE items SET status = 'Available' WHERE id = v_item_id;

  INSERT INTO notifications (user_id, type, message, related_id)
  VALUES (v_buyer_id, 'reservation_expiring', 'The seller cancelled your reservation. The item is available again.', v_item_id);

  SET p_out_status = 'OK';
  COMMIT;
END$$

DELIMITER ;

-- ============================================================================
-- PROCEDURE: sp_mark_sold
-- Seller confirms in-person handover + payment. Terminal state for the item.
--
-- p_out_status values: 'OK', 'NOT_FOUND', 'FORBIDDEN', 'INVALID_STATE'
-- ============================================================================
DELIMITER $$

CREATE PROCEDURE sp_mark_sold(
  IN  p_order_id  INT UNSIGNED,
  IN  p_actor_id  INT UNSIGNED,
  OUT p_out_status VARCHAR(20)
)
proc: BEGIN
  DECLARE v_status VARCHAR(20);
  DECLARE v_seller_id INT UNSIGNED;
  DECLARE v_buyer_id INT UNSIGNED;
  DECLARE v_item_id INT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT status, seller_id, buyer_id, item_id
  INTO v_status, v_seller_id, v_buyer_id, v_item_id
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    SET p_out_status = 'NOT_FOUND';
    ROLLBACK;
    LEAVE proc;
  END IF;

  IF v_seller_id <> p_actor_id THEN
    SET p_out_status = 'FORBIDDEN';
    ROLLBACK;
    LEAVE proc;
  END IF;

  IF v_status <> 'Reserved' THEN
    SET p_out_status = 'INVALID_STATE';
    ROLLBACK;
    LEAVE proc;
  END IF;

  UPDATE orders SET status = 'Completed', completed_at = NOW() WHERE id = p_order_id;
  UPDATE items SET status = 'Sold', sold_at = NOW() WHERE id = v_item_id;

  INSERT INTO notifications (user_id, type, message, related_id)
  VALUES (v_buyer_id, 'item_sold', 'The seller marked your order as sold. You can now rate each other.', p_order_id);

  SET p_out_status = 'OK';
  COMMIT;
END$$

DELIMITER ;

-- ============================================================================
-- PROCEDURE: sp_expire_reservations
-- Batch-expires any Reserved order past its expires_at, returning the item
-- to Available. Called by the MySQL event below, and safe to also call from
-- a Node-side cron job as a fallback if event_scheduler is disabled.
-- ============================================================================
DELIMITER $$

CREATE PROCEDURE sp_expire_reservations()
BEGIN
  DROP TEMPORARY TABLE IF EXISTS tmp_expired_orders;

  CREATE TEMPORARY TABLE tmp_expired_orders AS
    SELECT id AS order_id, item_id, buyer_id, seller_id
    FROM orders
    WHERE status = 'Reserved' AND expires_at <= NOW();

  UPDATE orders o
  JOIN tmp_expired_orders t ON o.id = t.order_id
  SET o.status = 'Expired';

  UPDATE items i
  JOIN tmp_expired_orders t ON i.id = t.item_id
  SET i.status = 'Available'
  WHERE i.status = 'Reserved';

  INSERT INTO notifications (user_id, type, message, related_id)
    SELECT buyer_id, 'reservation_expiring', 'Your reservation window expired. The item is available to others again.', item_id
    FROM tmp_expired_orders;

  INSERT INTO notifications (user_id, type, message, related_id)
    SELECT seller_id, 'reservation_expiring', 'A reservation on your item expired without a sale. It is listed again.', item_id
    FROM tmp_expired_orders;

  DROP TEMPORARY TABLE IF EXISTS tmp_expired_orders;
END$$

DELIMITER ;

-- ============================================================================
-- EVENT: ev_expire_reservations
-- Sweeps every 15 minutes. Requires the MySQL event scheduler to be ON:
--   SET GLOBAL event_scheduler = ON;
-- (or add `event_scheduler=ON` under [mysqld] in my.ini and restart).
-- If you'd rather not touch global server config, skip this and instead
-- run sp_expire_reservations() from the Node backend's node-cron job.
-- ============================================================================
DELIMITER $$

CREATE EVENT IF NOT EXISTS ev_expire_reservations
ON SCHEDULE EVERY 15 MINUTE
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  CALL sp_expire_reservations();
END$$

DELIMITER ;

-- ============================================================================
-- Seed: promote yourself to admin after you register through the app —
--   UPDATE users SET is_admin = 1 WHERE email = 'your.usn@msrit.edu';
-- ============================================================================
