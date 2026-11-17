-- ============================================================================
-- RETURNPACK MANAGEMENT SYSTEM (RMS)
-- Complete Normalized PostgreSQL Schema (30 Tables), RLS, & Transactional RPCs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) NOT NULL CHECK (org_type IN ('RETURNPACK', 'MERCHANT', 'LOGISTICS_PARTNER', 'RECYCLING_PARTNER')),
    tax_code VARCHAR(50),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'PENDING')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. user_roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL CHECK (role_code IN (
        'SUPER_ADMIN',
        'RETURNPACK_ADMIN',
        'SHOP_OWNER',
        'SHOP_STAFF',
        'SHIPPER',
        'WAREHOUSE_STAFF',
        'CUSTOMER'
    )),
    shop_id UUID,
    warehouse_id UUID,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role_code)
);

-- 4. service_plans
CREATE TABLE service_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    monthly_quota_turns INT NOT NULL CHECK (monthly_quota_turns > 0),
    price_vnd NUMERIC(14,2) NOT NULL CHECK (price_vnd >= 0),
    badge_label VARCHAR(50),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. shops
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    shop_code VARCHAR(50) UNIQUE NOT NULL,
    shop_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Thương mại điện tử',
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100) DEFAULT 'TP. Hồ Chí Minh',
    concurrent_bag_limit INT NOT NULL DEFAULT 300 CHECK (concurrent_bag_limit >= 0),
    current_bags_held INT NOT NULL DEFAULT 0 CHECK (current_bags_held >= 0),
    outstanding_debt_vnd NUMERIC(14,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'TRIAL')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_shop_holding_limit CHECK (current_bags_held <= concurrent_bag_limit)
);

-- 6. subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES service_plans(id),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'UPGRADE_REQUESTED', 'CANCELLED')),
    total_turns_quota INT NOT NULL CHECK (total_turns_quota >= 0),
    used_turns INT NOT NULL DEFAULT 0 CHECK (used_turns >= 0),
    remaining_turns INT GENERATED ALWAYS AS (total_turns_quota - used_turns) STORED,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_trial BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_turns_not_exceeded CHECK (used_turns <= total_turns_quota)
);

-- 7. subscription_usage
CREATE TABLE subscription_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    usage_cycle_id UUID UNIQUE NOT NULL,
    order_code VARCHAR(100) NOT NULL,
    bag_id UUID NOT NULL,
    turns_deducted INT NOT NULL DEFAULT 1 CHECK (turns_deducted = 1),
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. warehouses
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100) DEFAULT 'TP. Hồ Chí Minh',
    capacity INT NOT NULL DEFAULT 10000,
    low_stock_threshold INT NOT NULL DEFAULT 100,
    manager_user_id UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. bag_batches
CREATE TABLE bag_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    size_code VARCHAR(20) NOT NULL CHECK (size_code IN ('S (25x35cm)', 'M (32x43cm)', 'L (40x55cm)')),
    material_spec VARCHAR(255) NOT NULL DEFAULT 'PP dệt tráng màng màu xanh sage, khóa kéo đen, ngăn vận đơn trong suốt',
    manufactured_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    max_configured_cycles INT NOT NULL DEFAULT 15,
    unit_production_cost_vnd NUMERIC(12,2) NOT NULL DEFAULT 18500,
    warehouse_id UUID REFERENCES warehouses(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. bags
CREATE TABLE bags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_code VARCHAR(50) UNIQUE NOT NULL,
    qr_token VARCHAR(100) UNIQUE NOT NULL,
    batch_id UUID REFERENCES bag_batches(id),
    size_code VARCHAR(20) NOT NULL DEFAULT 'M (32x43cm)',
    status VARCHAR(40) NOT NULL CHECK (status IN (
        'AVAILABLE_AT_WAREHOUSE',
        'AT_SHOP',
        'IN_TRANSIT',
        'WAITING_RETURN',
        'PICKED_UP_BY_SHIPPER',
        'PENDING_INSPECTION',
        'CLEANING_MAINTENANCE',
        'LOCKED_DEFECTIVE',
        'RETIRED_WAITING_RECYCLE',
        'HANDED_OVER_RECYCLE',
        'LOST'
    )),
    holder_type VARCHAR(30) NOT NULL CHECK (holder_type IN ('WAREHOUSE', 'SHOP', 'CUSTOMER_IN_TRANSIT', 'SHIPPER', 'RECYCLING_PARTNER', 'UNKNOWN_LOST')),
    current_warehouse_id UUID REFERENCES warehouses(id),
    current_shop_id UUID REFERENCES shops(id),
    current_shipper_id UUID REFERENCES users(id),
    current_location_label VARCHAR(255) NOT NULL,
    cycles_used INT NOT NULL DEFAULT 0 CHECK (cycles_used >= 0),
    max_cycles INT NOT NULL DEFAULT 15 CHECK (max_cycles > 0),
    quality_grade VARCHAR(10) NOT NULL DEFAULT 'A' CHECK (quality_grade IN ('A', 'B', 'C')),
    last_inspection_result TEXT,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    default_address TEXT,
    area_district VARCHAR(100),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(100) NOT NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    bag_id UUID NOT NULL REFERENCES bags(id),
    packed_by_user_id UUID REFERENCES users(id),
    shipping_partner VARCHAR(100) DEFAULT 'Điều phối thủ công / Vận chuyển đối tác',
    status VARCHAR(40) NOT NULL DEFAULT 'HANDED_OVER_CARRIER' CHECK (status IN ('PACKED', 'HANDED_OVER_CARRIER', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED')),
    packed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (shop_id, order_code)
);

-- 13. usage_cycles
CREATE TABLE usage_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    cycle_number INT NOT NULL CHECK (cycle_number > 0),
    shop_id UUID NOT NULL REFERENCES shops(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    order_code VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    return_requested_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    warehouse_received_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    reward_granted BOOLEAN NOT NULL DEFAULT FALSE,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    UNIQUE (bag_id, cycle_number),
    UNIQUE (bag_id, order_code)
);

-- 14. bag_events
CREATE TABLE bag_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    usage_cycle_id UUID REFERENCES usage_cycles(id) ON DELETE SET NULL,
    event_type VARCHAR(60) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    from_status VARCHAR(40),
    to_status VARCHAR(40) NOT NULL,
    location_label VARCHAR(255),
    actor_user_id UUID REFERENCES users(id),
    actor_role VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. allocations
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_code VARCHAR(50) UNIQUE NOT NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    requested_quantity INT NOT NULL CHECK (requested_quantity > 0),
    approved_quantity INT CHECK (approved_quantity >= 0),
    size_code VARCHAR(20) NOT NULL DEFAULT 'M (32x43cm)',
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DISPATCHED', 'RECEIVED_BY_SHOP', 'REJECTED')),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. allocation_items
CREATE TABLE allocation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
    bag_id UUID NOT NULL REFERENCES bags(id),
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ,
    UNIQUE (allocation_id, bag_id)
);

-- 17. return_requests
CREATE TABLE return_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code VARCHAR(50) UNIQUE NOT NULL,
    bag_id UUID NOT NULL REFERENCES bags(id),
    usage_cycle_id UUID NOT NULL REFERENCES usage_cycles(id),
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    pickup_address TEXT NOT NULL,
    area_district VARCHAR(100) NOT NULL,
    preferred_time_slot VARCHAR(100) NOT NULL,
    customer_note TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN (
        'RECEIVED',
        'MATCHING_ROUTE',
        'ASSIGNED_SHIPPER',
        'PICKED_UP',
        'COMPLETED_AT_WAREHOUSE',
        'FAILED_PICKUP'
    )),
    partner_name VARCHAR(100) DEFAULT 'Điều phối kết hợp chuyến sẵn có',
    assigned_shipper_id UUID REFERENCES users(id),
    scheduled_window VARCHAR(100),
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usage_cycle_id)
);

-- 18. pickup_assignments
CREATE TABLE pickup_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
    shipper_user_id UUID NOT NULL REFERENCES users(id),
    assigned_by_user_id UUID REFERENCES users(id),
    route_note TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'CONFIRMED_PICKUP', 'FAILED')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. pickup_confirmations
CREATE TABLE pickup_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_request_id UUID UNIQUE NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
    pickup_assignment_id UUID NOT NULL REFERENCES pickup_assignments(id),
    bag_id UUID NOT NULL REFERENCES bags(id),
    usage_cycle_id UUID UNIQUE NOT NULL REFERENCES usage_cycles(id),
    shipper_user_id UUID NOT NULL REFERENCES users(id),
    scanned_bag_code VARCHAR(50) NOT NULL,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    eligible_for_reward BOOLEAN NOT NULL DEFAULT TRUE,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL
);

-- 20. inventory_transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    bag_id UUID NOT NULL REFERENCES bags(id),
    tx_type VARCHAR(40) NOT NULL CHECK (tx_type IN ('INBOUND_NEW', 'INBOUND_RETURN', 'OUTBOUND_ALLOCATION', 'INTERNAL_CLEANING', 'RETIRE_TO_RECYCLE')),
    reference_code VARCHAR(100),
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. inspections
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    usage_cycle_id UUID REFERENCES usage_cycles(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    inspector_user_id UUID REFERENCES users(id),
    grade VARCHAR(10) NOT NULL CHECK (grade IN ('A', 'B', 'C')),
    surface_clean BOOLEAN NOT NULL DEFAULT TRUE,
    zipper_intact BOOLEAN NOT NULL DEFAULT TRUE,
    qr_readable BOOLEAN NOT NULL DEFAULT TRUE,
    pouch_intact BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. maintenance_jobs
CREATE TABLE maintenance_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES inspections(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('CLEANING_SANITIZING', 'ZIPPER_REPAIR', 'QR_RELABLE')),
    status VARCHAR(40) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED_PENDING_REINSPECTION', 'REINSPECTED_PASSED', 'REINSPECTED_FAILED_C')),
    assigned_to UUID REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 23. recycling_handoffs
CREATE TABLE recycling_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handoff_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    partner_org_id UUID REFERENCES organizations(id),
    partner_name VARCHAR(255) NOT NULL,
    bag_id UUID UNIQUE NOT NULL REFERENCES bags(id),
    status VARCHAR(40) NOT NULL DEFAULT 'HANDED_OVER_PENDING_PROCESSING' CHECK (status IN (
        'WAITING_HANDOVER',
        'HANDED_OVER_PENDING_PROCESSING',
        'VERIFIED_RECYCLED'
    )),
    weight_grams INT NOT NULL DEFAULT 85,
    handed_over_at TIMESTAMPTZ DEFAULT NOW(),
    verified_recycled_at TIMESTAMPTZ,
    certificate_ref VARCHAR(100)
);

-- 24. reward_accounts
CREATE TABLE reward_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    total_points_earned INT NOT NULL DEFAULT 0 CHECK (total_points_earned >= 0),
    available_points INT NOT NULL DEFAULT 0 CHECK (available_points >= 0),
    total_successful_returns INT NOT NULL DEFAULT 0 CHECK (total_successful_returns >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. reward_transactions
CREATE TABLE reward_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_account_id UUID NOT NULL REFERENCES reward_accounts(id) ON DELETE CASCADE,
    usage_cycle_id UUID REFERENCES usage_cycles(id),
    tx_type VARCHAR(40) NOT NULL CHECK (tx_type IN ('EARN_RETURN', 'REDEEM_OFFER', 'REVERSAL_ADJUSTMENT')),
    points_delta INT NOT NULL,
    description TEXT NOT NULL,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usage_cycle_id, tx_type)
);

-- 26. reward_offers
CREATE TABLE reward_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    sponsor_shop_name VARCHAR(255) NOT NULL,
    points_required INT NOT NULL CHECK (points_required > 0),
    stock_remaining INT NOT NULL DEFAULT 100 CHECK (stock_remaining >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. redemptions
CREATE TABLE redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_account_id UUID NOT NULL REFERENCES reward_accounts(id) ON DELETE CASCADE,
    reward_offer_id UUID NOT NULL REFERENCES reward_offers(id),
    points_spent INT NOT NULL CHECK (points_spent > 0),
    voucher_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'USED', 'REVERSED')),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 28. payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_code VARCHAR(50) UNIQUE NOT NULL,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    amount_vnd NUMERIC(14,2) NOT NULL CHECK (amount_vnd >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
    status VARCHAR(30) NOT NULL DEFAULT 'PAID' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE
);

-- 29. expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('BAG_MANUFACTURING', 'CLEANING_SANITIZING', 'PICKUP_LOGISTICS_FEE', 'QR_LABEL_PRINTING', 'OPERATIONS')),
    amount_vnd NUMERIC(14,2) NOT NULL CHECK (amount_vnd >= 0),
    description TEXT NOT NULL,
    incurred_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES users(id),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 30. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_role VARCHAR(50) NOT NULL,
    target_shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notif_type VARCHAR(60) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link_path VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 31. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id),
    actor_role VARCHAR(50) NOT NULL,
    action_code VARCHAR(100) NOT NULL,
    entity_table VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_bags_status ON bags(status);
CREATE INDEX idx_bags_current_shop ON bags(current_shop_id);
CREATE INDEX idx_bags_qr_token ON bags(qr_token);
CREATE INDEX idx_return_requests_status_area ON return_requests(status, area_district);
CREATE INDEX idx_usage_cycles_bag_id ON usage_cycles(bag_id);
CREATE INDEX idx_notifications_role_read ON notifications(target_role, is_read);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_accounts ENABLE ROW LEVEL SECURITY;

-- Shop Isolation Policy: Shop A cannot read or mutate Shop B's data
CREATE POLICY shop_isolation_select ON shops
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN users u ON u.id = ur.user_id
            WHERE u.auth_user_id = auth.uid()
              AND (
                ur.role_code IN ('SUPER_ADMIN', 'RETURNPACK_ADMIN', 'WAREHOUSE_STAFF')
                OR ur.shop_id = shops.id
              )
        )
    );

-- Shipper Minimal Access Policy: Shippers only see tasks assigned to them
CREATE POLICY shipper_assigned_returns_only ON return_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN users u ON u.id = ur.user_id
            WHERE u.auth_user_id = auth.uid()
              AND (
                ur.role_code IN ('SUPER_ADMIN', 'RETURNPACK_ADMIN')
                OR (ur.role_code = 'SHIPPER' AND return_requests.assigned_shipper_id = u.id)
              )
        )
    );
