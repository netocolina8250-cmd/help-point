export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  unit_type: string;
  units_count: number;
  image_url?: string | null;
  is_active: boolean;
  is_featured: boolean;
  order_index: number;
  created_at: string;
  categories?: Category | null;
}

export interface Supply {
  id: string;
  name: string;
  unit_measure: string;
  min_stock_alert: number;
  current_stock: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplyPurchase {
  id: string;
  supply_id: string;
  supplier_id?: string | null;
  purchase_date: string;
  quantity: number;
  total_cost: number;
  unit_cost: number;
  expiration_date?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
  created_at: string;
  supplies?: Supply | null;
  suppliers?: Supplier | null;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Integration {
  id: string;
  service_name: string;
  display_title: string;
  description?: string | null;
  environment: 'production' | 'sandbox';
  api_key?: string | null;
  api_secret?: string | null;
  access_token?: string | null;
  webhook_url?: string | null;
  webhook_secret?: string | null;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  whatsapp_number: string;
  opening_hours: Record<string, any>;
  delivery_fee_default: number;
  address_display: string;
  banner_message?: string | null;
  is_store_open: boolean;
  updated_at: string;
}
