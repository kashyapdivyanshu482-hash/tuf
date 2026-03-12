export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_to: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  fabric?: string | null;
  print_type?: string | null;
  price: number;
  original_price?: number | string | null;
  discount_percent?: number | null;
  category: "New Arrivals" | "Unisex" | "Winter" | "Summer" | "Gymwear" | string;
  image_url: string | null;
  image_url_1?: string | null;
  image_url_2?: string | null;
  image_url_3?: string | null;
  image_url_4?: string | null;
  image_url_5?: string | null;
  size_xs_price?: number | string | null;
  size_s_price?: number | string | null;
  size_m_price?: number | string | null;
  size_l_price?: number | string | null;
  size_xl_price?: number | string | null;
  size_xxl_price?: number | string | null;
  size_xs_stock?: number | null;
  size_s_stock?: number | null;
  size_m_stock?: number | null;
  size_l_stock?: number | null;
  size_xl_stock?: number | null;
  size_xxl_stock?: number | null;
  stock_quantity: number | null;
  is_featured: boolean | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  shipping_address: string | null;
};

export type Order = {
  id: string;
  payment_method?: "PREPAID" | "COD" | string;
  payment_status?: "PENDING" | "PAID" | "PARTIALLY_PAID" | "FAILED" | string;
  total_amount?: number;
  status: "Processing" | "Shipped" | "Delivered" | string;
  total_price?: number;
  created_at: string;
};
