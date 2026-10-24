-- ============================================================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL): ROEBUX STORE
-- Jalankan seluruh script ini di menu "SQL Editor" pada Dashboard Supabase
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  robux_amount INT NOT NULL,
  price_idr INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO products (code, robux_amount, price_idr) VALUES
  ('RBX-50',   50,   8000),   ('RBX-100',  100,  16000),
  ('RBX-150',  150,  24000),  ('RBX-200',  200,  32000),
  ('RBX-250',  250,  40000),  ('RBX-300',  300,  48000),
  ('RBX-350',  350,  56000),  ('RBX-400',  400,  64000),
  ('RBX-450',  450,  72000),  ('RBX-500',  500,  80000),
  ('RBX-550',  550,  88000),  ('RBX-600',  600,  96000),
  ('RBX-650',  650,  104000), ('RBX-700',  700,  112000),
  ('RBX-750',  750,  120000), ('RBX-800',  800,  128000),
  ('RBX-850',  850,  136000), ('RBX-900',  900,  144000),
  ('RBX-950',  950,  152000), ('RBX-1000', 1000, 160000)
ON CONFLICT (code) DO UPDATE SET price_idr = EXCLUDED.price_idr;

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(40) UNIQUE NOT NULL,
  roblox_username VARCHAR(60) NOT NULL,
  roblox_user_id BIGINT NOT NULL,
  product_code VARCHAR(30) REFERENCES products(code),
  robux_amount INT NOT NULL,
  amount_paid_idr INT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100),
  payment_qr_url TEXT,
  buyer_whatsapp VARCHAR(30),
  payment_status VARCHAR(20) DEFAULT 'UNPAID',
  order_status VARCHAR(20) DEFAULT 'PENDING',
  auto_order_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transactions_username ON transactions(roblox_username);
