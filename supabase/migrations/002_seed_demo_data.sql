-- ============================================================================
-- RETURNPACK MANAGEMENT SYSTEM (RMS) - DEMO SEED DATA (TAGGED WITH is_demo = TRUE)
-- ============================================================================

INSERT INTO service_plans (code, name, monthly_quota_turns, price_vnd, badge_label, description)
VALUES
  ('PLAN_BASIC', 'Gói Cơ bản', 500, 235000, NULL, 'Phù hợp cho shop thương mại điện tử quy mô nhỏ bắt đầu chuyển đổi bao bì tuần hoàn.'),
  ('PLAN_STANDARD', 'Gói Tiêu chuẩn', 1000, 460000, 'Phổ biến', 'Tối ưu chi phí mỗi lượt cho các shop có lượng đơn ổn định hàng ngày.'),
  ('PLAN_ENTERPRISE', 'Gói Mở rộng', 2000, 900000, NULL, 'Dành cho thương hiệu và gian hàng lớn có tần suất đóng gói cao.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO organizations (id, code, name, org_type, contact_email, contact_phone, address, is_demo)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'ORG-RP', 'RETURNPACK Vietnam HQ [DEMO]', 'RETURNPACK', 'ops@returnpack.id.vn', '0901234567', 'Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM', TRUE),
  ('11111111-1111-1111-1111-111111111102', 'ORG-SHOP-A', 'Shop A - GreenStyle Fashion [DEMO]', 'MERCHANT', 'shopa@greenstyle.vn', '0912345678', '128 Nguyễn Gia Trí, Q. Bình Thạnh, TP.HCM', TRUE),
  ('11111111-1111-1111-1111-111111111103', 'ORG-SHOP-B', 'Shop B - EcoCosmetics VN [DEMO]', 'MERCHANT', 'shopb@ecocosmetics.vn', '0987654321', '45 Lê Văn Sỹ, Quận 3, TP.HCM', TRUE),
  ('11111111-1111-1111-1111-111111111104', 'ORG-RECYCLE-1', 'Đối tác Tái chế Nhựa Xanh Việt [DEMO]', 'RECYCLING_PARTNER', 'recycle@nhuaxanh.vn', '0933445566', 'KCN Tân Bình, TP.HCM', TRUE)
ON CONFLICT (code) DO NOTHING;
