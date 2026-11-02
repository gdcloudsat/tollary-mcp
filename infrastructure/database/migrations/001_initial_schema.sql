-- ==============================================================================
-- TOLLARY MASTER POSTGRESQL SCHEMA MIGRATION: 001_initial_schema.sql
-- High-Scale Multi-Tenant MCP Gateway, Discovery Registry & x402 Financial Ledger
-- Target: PostgreSQL 16+
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS (Master Multi-Tenant Workspace Boundary)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    billing_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) DEFAULT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERSHIPS (RBAC)
CREATE TABLE organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'engineer', 'auditor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, user_id)
);

-- 4. PROJECTS (Isolated Sandbox Environments)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    monthly_spend_limit_usd NUMERIC(12, 2) DEFAULT NULL,
    rate_limit_rps INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AGENT API KEYS
CREATE TABLE agent_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    allowed_ips INET[] DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PROVIDERS (Publishing Entities)
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    display_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    reputation_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MCP SERVERS (Registered Upstream Streamable HTTP / SSE Endpoints)
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    base_url TEXT NOT NULL,
    transport_type VARCHAR(50) NOT NULL DEFAULT 'streamable_http' CHECK (transport_type IN ('streamable_http', 'http_sse', 'stdio_bridge')),
    capabilities JSONB NOT NULL DEFAULT '{}',
    health_status VARCHAR(50) NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'offline')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MCP TOOLS (Introspected Tool Definitions)
CREATE TABLE mcp_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mcp_server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    input_schema JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (mcp_server_id, name)
);

-- 9. REST SERVICES
CREATE TABLE rest_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    upstream_base_url TEXT NOT NULL,
    auth_type VARCHAR(50) NOT NULL DEFAULT 'bearer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. REST ENDPOINTS
CREATE TABLE rest_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rest_service_id UUID NOT NULL REFERENCES rest_services(id) ON DELETE CASCADE,
    path VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL DEFAULT 'GET',
    description TEXT NOT NULL,
    input_schema JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PRICING RULES (Arbitrary Precision Numeric 18, 6)
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mcp_tool_id UUID REFERENCES mcp_tools(id) ON DELETE CASCADE,
    rest_endpoint_id UUID REFERENCES rest_endpoints(id) ON DELETE CASCADE,
    pricing_model VARCHAR(50) NOT NULL DEFAULT 'fixed_per_call' CHECK (pricing_model IN ('free', 'fixed_per_call', 'tiered')),
    unit_price_usd NUMERIC(18, 6) NOT NULL DEFAULT 0.000000,
    currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 12. PAYMENT ACCOUNTS (Non-Custodial Payout Destinations)
CREATE TABLE payment_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    facilitator_type VARCHAR(50) NOT NULL DEFAULT 'coinbase_base_usdc',
    destination_address VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. PAYMENT INTENTS (Issued HTTP 402 Challenges)
CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key_id UUID REFERENCES agent_keys(id),
    pricing_rule_id UUID REFERENCES pricing_rules(id),
    expected_amount NUMERIC(18, 6) NOT NULL,
    nonce VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'voided')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PAYMENT VERIFICATIONS (Facilitator Proof Attestations)
CREATE TABLE payment_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID REFERENCES payment_intents(id),
    proof_signature TEXT UNIQUE NOT NULL,
    facilitator_type VARCHAR(50) NOT NULL,
    facilitator_tx_hash VARCHAR(255) DEFAULT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. TRANSACTIONS (Immutable Double-Entry Financial Ledger)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_verification_id UUID REFERENCES payment_verifications(id),
    payment_nonce VARCHAR(64) NOT NULL,
    gross_amount NUMERIC(18, 6) NOT NULL,
    platform_fee NUMERIC(18, 6) NOT NULL,
    provider_net NUMERIC(18, 6) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'settled' CHECK (status IN ('settled', 'refunded', 'compensating_reversal')),
    settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. SETTLEMENTS (Provider Payout Batches)
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    payment_account_id UUID NOT NULL REFERENCES payment_accounts(id),
    payout_amount NUMERIC(18, 6) NOT NULL,
    payout_tx_hash VARCHAR(255) NOT NULL,
    transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- 18. AUDIT LOGS (Tamper-Evident Administrative Trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    ip_address INET NOT NULL,
    payload_before JSONB DEFAULT NULL,
    payload_after JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. REVIEWS & QUALITY RATINGS
CREATE TABLE provider_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PERFORMANCE & INTEGRITY INDEXES
CREATE INDEX idx_agent_keys_hash ON agent_keys (key_hash);
CREATE INDEX idx_mcp_servers_provider ON mcp_servers (provider_id);
CREATE INDEX idx_mcp_tools_server ON mcp_tools (mcp_server_id);
CREATE INDEX idx_pricing_rules_tool ON pricing_rules (mcp_tool_id);
CREATE INDEX idx_payment_intents_nonce ON payment_intents (nonce);
CREATE INDEX idx_transactions_settled_at ON transactions (settled_at DESC);
CREATE INDEX idx_audit_logs_org_created ON audit_logs (organization_id, created_at DESC);
