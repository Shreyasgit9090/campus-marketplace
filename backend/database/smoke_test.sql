-- Dev-only regression check for schema.sql's price calc, reservation state
-- machine, rating aggregation, expiry sweep, and report auto-suspend.
-- DESTRUCTIVE: truncates every table at the end. Never run against real data.
--   mysql -u root -p < smoke_test.sql
USE campuscart;

SELECT '--- price function ---' AS step;
SELECT fn_compute_price(1000, 'New') AS new_price,
       fn_compute_price(1000, 'Good') AS good_price,
       fn_compute_price(1000, 'Fair') AS fair_price,
       fn_compute_price(1000, 'Worn') AS worn_price;

SELECT '--- seed test users ---' AS step;
INSERT INTO users (name, email, password_hash, phone, is_verified) VALUES
  ('Seller One', 'seller1@msrit.edu', 'hash', '9000000001', 1),
  ('Buyer One', 'buyer1@msrit.edu', 'hash', '9000000002', 1),
  ('Buyer Two', 'buyer2@msrit.edu', 'hash', '9000000003', 1);

SET @seller_id = (SELECT id FROM users WHERE email = 'seller1@msrit.edu');
SET @buyer1_id = (SELECT id FROM users WHERE email = 'buyer1@msrit.edu');
SET @buyer2_id = (SELECT id FROM users WHERE email = 'buyer2@msrit.edu');

SELECT '--- insert item, check trigger computed final_price (Good = 25% off 500 = 375.00) ---' AS step;
INSERT INTO items (seller_id, category, name, description, original_price, condition_tier)
VALUES (@seller_id, 'Textbook', 'Data Structures Textbook', 'Barely used', 500.00, 'Good');

SET @item_id = LAST_INSERT_ID();
SELECT id, name, original_price, condition_tier, final_price, status FROM items WHERE id = @item_id;

SELECT '--- buyer1 reserves item (expect OK) ---' AS step;
CALL sp_reserve_item(@item_id, @buyer1_id, @order_id, @out_status);
SELECT @order_id AS order_id, @out_status AS out_status;
SELECT status FROM items WHERE id = @item_id;

SELECT '--- buyer2 tries to reserve same item (expect UNAVAILABLE) ---' AS step;
CALL sp_reserve_item(@item_id, @buyer2_id, @order_id2, @out_status2);
SELECT @order_id2 AS order_id2, @out_status2 AS out_status2;

SELECT '--- seller tries to reserve own item (expect OWN_ITEM) ---' AS step;
CALL sp_reserve_item(@item_id, @seller_id, @order_id3, @out_status3);
SELECT @order_id3 AS order_id3, @out_status3 AS out_status3;

SELECT '--- notification created for seller on order_placed ---' AS step;
SELECT user_id, type, message FROM notifications WHERE user_id = @seller_id;

SELECT '--- seller marks sold (expect OK) ---' AS step;
CALL sp_mark_sold(@order_id, @seller_id, @out_status4);
SELECT @out_status4 AS out_status4;
SELECT status, sold_at FROM items WHERE id = @item_id;
SELECT status, completed_at FROM orders WHERE id = @order_id;

SELECT '--- buyer1 rates seller 5 stars, check avg_rating generated column ---' AS step;
INSERT INTO ratings (order_id, rater_id, ratee_id, stars, comment)
VALUES (@order_id, @buyer1_id, @seller_id, 5, 'Great seller!');
SELECT id, rating_sum, rating_count, avg_rating FROM users WHERE id = @seller_id;

SELECT '--- second item + reservation for cancel test ---' AS step;
INSERT INTO items (seller_id, category, name, description, original_price, condition_tier)
VALUES (@seller_id, 'Calculator', 'FX-991ES', 'Works fine', 1000.00, 'Fair');
SET @item2_id = LAST_INSERT_ID();
CALL sp_reserve_item(@item2_id, @buyer2_id, @order2_id, @out_status5);
SELECT @out_status5 AS reserve_status, status FROM items WHERE id = @item2_id;

SELECT '--- seller cancels reservation early (expect OK, item back to Available) ---' AS step;
CALL sp_cancel_reservation(@order2_id, @seller_id, @out_status6);
SELECT @out_status6 AS cancel_status;
SELECT status FROM items WHERE id = @item2_id;
SELECT status, cancelled_at FROM orders WHERE id = @order2_id;

SELECT '--- expiry sweep test: force-expire a reservation, then run sp_expire_reservations ---' AS step;
CALL sp_reserve_item(@item2_id, @buyer1_id, @order3_id, @out_status7);
UPDATE orders SET expires_at = NOW() - INTERVAL 1 HOUR WHERE id = @order3_id;
CALL sp_expire_reservations();
SELECT status FROM orders WHERE id = @order3_id;
SELECT status FROM items WHERE id = @item2_id;
SELECT type, message FROM notifications WHERE related_id = @item2_id AND type = 'reservation_expiring';

SELECT '--- report auto-suspend test (threshold = 3, need > 3 pending reports) ---' AS step;
INSERT INTO users (name, email, password_hash, is_verified) VALUES
  ('Reporter A', 'rep_a@msrit.edu', 'hash', 1),
  ('Reporter B', 'rep_b@msrit.edu', 'hash', 1),
  ('Reporter C', 'rep_c@msrit.edu', 'hash', 1),
  ('Reporter D', 'rep_d@msrit.edu', 'hash', 1);
SET @bad_user = @buyer2_id;
SET @rep_a = (SELECT id FROM users WHERE email = 'rep_a@msrit.edu');
SET @rep_b = (SELECT id FROM users WHERE email = 'rep_b@msrit.edu');
SET @rep_c = (SELECT id FROM users WHERE email = 'rep_c@msrit.edu');
SET @rep_d = (SELECT id FROM users WHERE email = 'rep_d@msrit.edu');

-- app layer always inserts reports one row at a time (parameterized query),
-- never as INSERT...SELECT sourcing from users — that shape is what tripped
-- MySQL error 1442 (trigger can't update a table the invoking statement reads).
INSERT INTO reports (reporter_id, reported_id, reason) VALUES (@rep_a, @bad_user, 'spam');
INSERT INTO reports (reporter_id, reported_id, reason) VALUES (@rep_b, @bad_user, 'spam');
INSERT INTO reports (reporter_id, reported_id, reason) VALUES (@rep_c, @bad_user, 'spam');
SELECT is_suspended AS before_4th FROM users WHERE id = @bad_user;
INSERT INTO reports (reporter_id, reported_id, reason) VALUES (@rep_d, @bad_user, 'spam again');
SELECT '--- after 4th report (expect is_suspended = 1) ---' AS step;
SELECT is_suspended FROM users WHERE id = @bad_user;

SELECT '--- cleanup ---' AS step;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE notifications;
TRUNCATE ratings;
TRUNCATE reports;
TRUNCATE orders;
TRUNCATE item_images;
TRUNCATE items;
TRUNCATE otp_codes;
TRUNCATE users;
SET FOREIGN_KEY_CHECKS = 1;
SELECT 'done' AS result;
