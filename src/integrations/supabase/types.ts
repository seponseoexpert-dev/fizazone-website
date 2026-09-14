export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: {
          country_code: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          email: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      banners: {
        Row: {
          button_link: string
          button_text: string
          country_code: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          button_link?: string
          button_text?: string
          country_code?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          button_link?: string
          button_text?: string
          country_code?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bulk_order_requests: {
        Row: {
          admin_note: string
          color: string
          company: string
          country_code: string
          created_at: string
          customer_name: string
          email: string
          id: string
          notes: string
          phone: string
          product_id: string | null
          product_link: string
          product_name: string
          qty: number
          size: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          color?: string
          company?: string
          country_code?: string
          created_at?: string
          customer_name: string
          email?: string
          id?: string
          notes?: string
          phone: string
          product_id?: string | null
          product_link?: string
          product_name?: string
          qty?: number
          size?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          color?: string
          company?: string
          country_code?: string
          created_at?: string
          customer_name?: string
          email?: string
          id?: string
          notes?: string
          phone?: string
          product_id?: string | null
          product_link?: string
          product_name?: string
          qty?: number
          size?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_order_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          base_slug: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          base_slug: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          base_slug?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      category_country_map: {
        Row: {
          category: string
          country_code: string
          created_at: string
          custom_name: string | null
          id: string
          is_visible: boolean
          updated_at: string
        }
        Insert: {
          category: string
          country_code: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_visible?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          country_code?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_visible?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      category_translations: {
        Row: {
          banner_image: string
          category_id: string
          country_code: string
          created_at: string
          faqs: Json
          id: string
          is_visible: boolean
          long_description: string
          name: string
          seo_meta_description: string
          seo_title: string
          short_description: string
          slug: string
          updated_at: string
        }
        Insert: {
          banner_image?: string
          category_id: string
          country_code: string
          created_at?: string
          faqs?: Json
          id?: string
          is_visible?: boolean
          long_description?: string
          name?: string
          seo_meta_description?: string
          seo_title?: string
          short_description?: string
          slug?: string
          updated_at?: string
        }
        Update: {
          banner_image?: string
          category_id?: string
          country_code?: string
          created_at?: string
          faqs?: Json
          id?: string
          is_visible?: boolean
          long_description?: string
          name?: string
          seo_meta_description?: string
          seo_title?: string
          short_description?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          canonical_base: string
          cod_enabled: boolean
          code: string
          created_at: string
          currency: string
          currency_symbol: string
          date_format: string
          default_language: string
          fx_rate: number
          hreflang: string
          id: string
          is_active: boolean
          is_default_market: boolean
          iso_code: string | null
          locale: string
          name: string
          number_format: string
          og_description: string
          og_image: string
          og_title: string
          online_payment_enabled: boolean
          phone_code: string
          regional_pricing_enabled: boolean
          seo_description: string
          seo_title: string
          shipping_enabled: boolean
          sort_order: number
          storefront_enabled: boolean
          timezone: string
          updated_at: string
          url_prefix: string | null
        }
        Insert: {
          canonical_base?: string
          cod_enabled?: boolean
          code: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          date_format?: string
          default_language?: string
          fx_rate?: number
          hreflang?: string
          id?: string
          is_active?: boolean
          is_default_market?: boolean
          iso_code?: string | null
          locale?: string
          name: string
          number_format?: string
          og_description?: string
          og_image?: string
          og_title?: string
          online_payment_enabled?: boolean
          phone_code?: string
          regional_pricing_enabled?: boolean
          seo_description?: string
          seo_title?: string
          shipping_enabled?: boolean
          sort_order?: number
          storefront_enabled?: boolean
          timezone?: string
          updated_at?: string
          url_prefix?: string | null
        }
        Update: {
          canonical_base?: string
          cod_enabled?: boolean
          code?: string
          created_at?: string
          currency?: string
          currency_symbol?: string
          date_format?: string
          default_language?: string
          fx_rate?: number
          hreflang?: string
          id?: string
          is_active?: boolean
          is_default_market?: boolean
          iso_code?: string | null
          locale?: string
          name?: string
          number_format?: string
          og_description?: string
          og_image?: string
          og_title?: string
          online_payment_enabled?: boolean
          phone_code?: string
          regional_pricing_enabled?: boolean
          seo_description?: string
          seo_title?: string
          shipping_enabled?: boolean
          sort_order?: number
          storefront_enabled?: boolean
          timezone?: string
          updated_at?: string
          url_prefix?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          country_code: string
          created_at: string
          discount: number
          discount_type: string
          end_date: string
          id: string
          is_active: boolean
          min_order: number
          name: string
          start_date: string
          updated_at: string
          usage_limit: number
        }
        Insert: {
          code: string
          country_code?: string
          created_at?: string
          discount?: number
          discount_type?: string
          end_date?: string
          id?: string
          is_active?: boolean
          min_order?: number
          name?: string
          start_date?: string
          updated_at?: string
          usage_limit?: number
        }
        Update: {
          code?: string
          country_code?: string
          created_at?: string
          discount?: number
          discount_type?: string
          end_date?: string
          id?: string
          is_active?: boolean
          min_order?: number
          name?: string
          start_date?: string
          updated_at?: string
          usage_limit?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string
          id: string
          name: string
          order_id: string
          product_id: string | null
          qty: number
          size: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          color?: string
          id?: string
          name: string
          order_id: string
          product_id?: string | null
          qty?: number
          size?: string
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          color?: string
          id?: string
          name?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          size?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          country_code: string
          created_at: string
          customer_name: string
          delivery_fee: number
          id: string
          payment_method: string
          phone: string
          status: string
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          address: string
          country_code?: string
          created_at?: string
          customer_name: string
          delivery_fee?: number
          id?: string
          payment_method?: string
          phone: string
          status?: string
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Update: {
          address?: string
          country_code?: string
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          id?: string
          payment_method?: string
          phone?: string
          status?: string
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: []
      }
      payment_credentials: {
        Row: {
          config: Json
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          eps_transaction_id: string | null
          financial_entity: string | null
          id: string
          merchant_transaction_id: string
          order_id: string | null
          provider: string
          raw: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          eps_transaction_id?: string | null
          financial_entity?: string | null
          id?: string
          merchant_transaction_id: string
          order_id?: string | null
          provider?: string
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          eps_transaction_id?: string | null
          financial_entity?: string | null
          id?: string
          merchant_transaction_id?: string
          order_id?: string | null
          provider?: string
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_country_map: {
        Row: {
          country_code: string
          created_at: string
          currency: string
          id: string
          is_visible: boolean
          price: number
          product_id: string
          sale_price: number | null
          shipping_fee: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          currency?: string
          id?: string
          is_visible?: boolean
          price?: number
          product_id: string
          sale_price?: number | null
          shipping_fee?: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency?: string
          id?: string
          is_visible?: boolean
          price?: number
          product_id?: string
          sale_price?: number | null
          shipping_fee?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_country_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          id: string
          product_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          product_id: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sections: {
        Row: {
          category: string
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          layout: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          layout?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          layout?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_translations: {
        Row: {
          country_code: string
          created_at: string
          currency: string
          full_description: string
          id: string
          images: string[]
          is_visible: boolean
          price: number
          product_id: string
          seo_meta_description: string
          seo_title: string
          slug: string
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          currency?: string
          full_description?: string
          id?: string
          images?: string[]
          is_visible?: boolean
          price?: number
          product_id: string
          seo_meta_description?: string
          seo_title?: string
          slug?: string
          stock?: number
          title?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency?: string
          full_description?: string
          id?: string
          images?: string[]
          is_visible?: boolean
          price?: number
          product_id?: string
          seo_meta_description?: string
          seo_title?: string
          slug?: string
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string
          id: string
          product_id: string
          size: string
          stock_qty: number
        }
        Insert: {
          color?: string
          id?: string
          product_id: string
          size?: string
          stock_qty?: number
        }
        Update: {
          color?: string
          id?: string
          product_id?: string
          size?: string
          stock_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_sku: string
          category: string
          colors: string[]
          created_at: string
          description: string | null
          id: string
          image_alts: string[]
          images: string[]
          name: string
          price: number
          sale_price: number | null
          sizes: string[]
          slug: string
          updated_at: string
        }
        Insert: {
          base_sku?: string
          category: string
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          image_alts?: string[]
          images?: string[]
          name: string
          price?: number
          sale_price?: number | null
          sizes?: string[]
          slug: string
          updated_at?: string
        }
        Update: {
          base_sku?: string
          category?: string
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          image_alts?: string[]
          images?: string[]
          name?: string
          price?: number
          sale_price?: number | null
          sizes?: string[]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_code: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          country_code: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link: string
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          country_code: string
          created_at: string
          customer_name: string
          id: string
          method: string
          note: string
          order_ref: string
          reference: string
          return_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          country_code?: string
          created_at?: string
          customer_name?: string
          id?: string
          method?: string
          note?: string
          order_ref?: string
          reference?: string
          return_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          country_code?: string
          created_at?: string
          customer_name?: string
          id?: string
          method?: string
          note?: string
          order_ref?: string
          reference?: string
          return_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "return_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      return_orders: {
        Row: {
          admin_note: string
          color: string
          country_code: string
          created_at: string
          customer_name: string
          id: string
          order_id: string | null
          order_ref: string
          phone: string
          product_name: string
          qty: number
          reason: string
          refund_amount: number
          resolution: string
          size: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          color?: string
          country_code?: string
          created_at?: string
          customer_name?: string
          id?: string
          order_id?: string | null
          order_ref?: string
          phone?: string
          product_name?: string
          qty?: number
          reason?: string
          refund_amount?: number
          resolution?: string
          size?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          color?: string
          country_code?: string
          created_at?: string
          customer_name?: string
          id?: string
          order_id?: string | null
          order_ref?: string
          phone?: string
          product_name?: string
          qty?: number
          reason?: string
          refund_amount?: number
          resolution?: string
          size?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_config: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      seo_meta: {
        Row: {
          canonical_url: string
          country_code: string
          created_at: string
          hreflang: Json
          id: string
          meta_description: string
          meta_title: string
          page_key: string
          page_label: string
          page_type: string
          slug: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string
          country_code?: string
          created_at?: string
          hreflang?: Json
          id?: string
          meta_description?: string
          meta_title?: string
          page_key?: string
          page_label?: string
          page_type?: string
          slug?: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string
          country_code?: string
          created_at?: string
          hreflang?: Json
          id?: string
          meta_description?: string
          meta_title?: string
          page_key?: string
          page_label?: string
          page_type?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
