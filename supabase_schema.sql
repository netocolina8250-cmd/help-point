-- ==========================================================
-- HELP POINT - SCHEMA COMPLETO DO BANCO DE DADOS (SUPABASE)
-- Coxinhas & Cia. - Gestão de Insumos, Produtos e Integrações
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. CATEGORIAS DE PRODUTOS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'utensils',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 2. PRODUTOS & COMBOS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    unit_type VARCHAR(50) DEFAULT 'combo', -- combo, unidade, porcao, copo
    units_count INT DEFAULT 1,            -- ex: 5, 10, 15, 20 coxinhas
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 3. FORNECEDORES DE INSUMOS
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 4. INSUMOS (MATÉRIAS-PRIMAS / INGREDIENTES / EMBALAGENS)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    unit_measure VARCHAR(20) NOT NULL, -- kg, g, l, ml, un, pacote, caixa
    min_stock_alert DECIMAL(10,3) DEFAULT 0.000,
    current_stock DECIMAL(10,3) DEFAULT 0.000,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 5. COMPRAS DE INSUMOS (HISTÓRICO POR PERÍODO / LOTE)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.supply_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity DECIMAL(10,3) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN quantity > 0 THEN total_cost / quantity ELSE 0 END
    ) STORED,
    expiration_date DATE,
    invoice_number VARCHAR(80),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para atualizar automaticamente o estoque ao cadastrar compra
CREATE OR REPLACE FUNCTION update_supply_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.supplies
    SET current_stock = current_stock + NEW.quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.supply_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_supply_purchase_added ON public.supply_purchases;
CREATE TRIGGER trg_supply_purchase_added
AFTER INSERT ON public.supply_purchases
FOR EACH ROW EXECUTE FUNCTION update_supply_stock_on_purchase();

-- ==========================================================
-- 6. FICHA TÉCNICA (RECEITAS E CMV DE CADA PRODUTO)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    supply_id UUID NOT NULL REFERENCES public.supplies(id) ON DELETE CASCADE,
    quantity_needed DECIMAL(10,4) NOT NULL,
    notes VARCHAR(200),
    UNIQUE(product_id, supply_id)
);

-- ==========================================================
-- 7. GESTÃO DE INTEGRAÇÕES & CHAVES DE API
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(80) NOT NULL, -- 'whatsapp_meta', 'mercado_pago', 'supabase', 'vercel', 'webhook'
    display_title VARCHAR(120) NOT NULL,
    description TEXT,
    environment VARCHAR(20) DEFAULT 'production', -- 'production', 'sandbox'
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    webhook_url TEXT,
    webhook_secret TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 8. CONFIGURAÇÕES DA LOJA
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name VARCHAR(100) DEFAULT 'Help Point Coxinhas & Cia.',
    whatsapp_number VARCHAR(30) DEFAULT '5591984034863',
    opening_hours JSONB DEFAULT '{"status": "open", "schedule": "Seg-Sab 16h às 22h"}'::jsonb,
    delivery_fee_default DECIMAL(10,2) DEFAULT 5.00,
    address_display TEXT DEFAULT 'Rua principal, Help Point',
    banner_message TEXT,
    is_store_open BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir dados padrão da Help Point
INSERT INTO public.store_settings (store_name, whatsapp_number)
SELECT 'Help Point Coxinhas & Cia.', '5591984034863'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- Inserir categorias iniciais
INSERT INTO public.categories (name, slug, icon, order_index) VALUES
('Combos de Coxinhas', 'combos', 'package', 1),
('Salgados Individuais', 'salgados', 'utensils', 2),
('Bebidas & Refrigerantes', 'bebidas', 'cup-soda', 3),
('Sobremesas & Doces', 'sobremesas', 'cake', 4)
ON CONFLICT (slug) DO NOTHING;

-- Inserir combos existentes da Help Point
INSERT INTO public.products (category_id, name, description, price, unit_type, units_count, order_index)
SELECT c.id, 'Combo 5 coxinhas', 'Uma porção crocante para matar a vontade.', 2.00, 'combo', 5, 1
FROM public.categories c WHERE c.slug = 'combos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, unit_type, units_count, order_index)
SELECT c.id, 'Combo 10 coxinhas', 'Ideal para dividir com alguém especial.', 4.00, 'combo', 10, 2
FROM public.categories c WHERE c.slug = 'combos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, unit_type, units_count, order_index)
SELECT c.id, 'Combo 15 coxinhas', 'Mais sabor para curtir com a galera.', 6.00, 'combo', 15, 3
FROM public.categories c WHERE c.slug = 'combos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, unit_type, units_count, order_index)
SELECT c.id, 'Combo 20 coxinhas', 'Perfeito para reuniões e lanches em família.', 8.00, 'combo', 20, 4
FROM public.categories c WHERE c.slug = 'combos'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (category_id, name, description, price, unit_type, units_count, order_index)
SELECT c.id, 'Combo 25 coxinhas', 'O combo campeão para quem ama coxinha.', 10.00, 'combo', 25, 5
FROM public.categories c WHERE c.slug = 'combos'
ON CONFLICT DO NOTHING;

-- Inserir insumos básicos comuns para Help Point
INSERT INTO public.supplies (name, unit_measure, min_stock_alert, current_stock) VALUES
('Frango desfiado', 'kg', 5.0, 0.0),
('Farinha de trigo', 'kg', 10.0, 0.0),
('Óleo de fritura', 'l', 15.0, 0.0),
('Massa de salgado (pronta)', 'kg', 10.0, 0.0),
('Caixa para salgados', 'un', 50.0, 0.0),
('Guardanapos', 'pacote', 10.0, 0.0)
ON CONFLICT DO NOTHING;
