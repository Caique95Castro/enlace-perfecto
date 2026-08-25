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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          couple_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          result: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          couple_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          result?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          couple_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          display_name: string
          id: string
          owner_id: string
          partner_1_name: string
          partner_2_name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          owner_id: string
          partner_1_name: string
          partner_2_name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          owner_id?: string
          partner_1_name?: string
          partner_2_name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          couple_id: string
          created_at: string
          description: string | null
          event_date: string | null
          event_type: string
          id: string
          maps_url: string | null
          name: string
          position: number
          start_time: string | null
          updated_at: string
          venue_name: string | null
          visible: boolean
        }
        Insert: {
          address?: string | null
          couple_id: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          maps_url?: string | null
          name: string
          position?: number
          start_time?: string | null
          updated_at?: string
          venue_name?: string | null
          visible?: boolean
        }
        Update: {
          address?: string | null
          couple_id?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          maps_url?: string | null
          name?: string
          position?: number
          start_time?: string | null
          updated_at?: string
          venue_name?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          key: string
          label: string
          min_plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          key: string
          label: string
          min_plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          key?: string
          label?: string
          min_plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_items: {
        Row: {
          active: boolean
          available_quantity: number
          couple_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_quota: boolean
          name: string
          price: number
          quantity: number
          quota_label: string | null
          total_goal: number | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          available_quantity?: number
          couple_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_quota?: boolean
          name: string
          price?: number
          quantity?: number
          quota_label?: string | null
          total_goal?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          available_quantity?: number
          couple_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_quota?: boolean
          name?: string
          price?: number
          quantity?: number
          quota_label?: string | null
          total_goal?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_orders: {
        Row: {
          amount: number
          couple_id: string
          created_at: string
          gift_item_id: string
          guest_email: string
          guest_name: string
          id: string
          message: string | null
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          couple_id: string
          created_at?: string
          gift_item_id: string
          guest_email: string
          guest_name: string
          id?: string
          message?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          couple_id?: string
          created_at?: string
          gift_item_id?: string
          guest_email?: string
          guest_name?: string
          id?: string
          message?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_orders_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_orders_gift_item_id_fkey"
            columns: ["gift_item_id"]
            isOneToOne: false
            referencedRelation: "gift_items"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_messages: {
        Row: {
          author_name: string
          couple_id: string
          created_at: string
          id: string
          message: string
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          author_name: string
          couple_id: string
          created_at?: string
          id?: string
          message: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          couple_id?: string
          created_at?: string
          id?: string
          message?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_messages_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          couple_id: string
          created_at: string
          email: string | null
          group_name: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          plus_one_allowed: boolean
          plus_one_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          plus_one_allowed?: boolean
          plus_one_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          email?: string | null
          group_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          plus_one_allowed?: boolean
          plus_one_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      info_items: {
        Row: {
          content: string | null
          couple_id: string
          created_at: string
          icon: string | null
          id: string
          position: number
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          content?: string | null
          couple_id: string
          created_at?: string
          icon?: string | null
          id?: string
          position?: number
          title: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          content?: string | null
          couple_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "info_items_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          couple_id: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          couple_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          gateway: string
          gateway_event_id: string
          gateway_payment_id: string | null
          id: string
          order_id: string | null
          payload: Json
          status: string
        }
        Insert: {
          created_at?: string
          gateway?: string
          gateway_event_id: string
          gateway_payment_id?: string | null
          id?: string
          order_id?: string | null
          payload?: Json
          status: string
        }
        Update: {
          created_at?: string
          gateway?: string
          gateway_event_id?: string
          gateway_payment_id?: string | null
          id?: string
          order_id?: string | null
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "gift_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          couple_id: string
          created_at: string
          gateway: string
          gateway_payment_id: string | null
          id: string
          order_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          couple_id: string
          created_at?: string
          gateway?: string
          gateway_payment_id?: string | null
          id?: string
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          couple_id?: string
          created_at?: string
          gateway?: string
          gateway_payment_id?: string | null
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "gift_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          caption: string | null
          category: string
          couple_id: string
          created_at: string
          id: string
          position: number
          public_url: string
          section_id: string | null
          storage_path: string
        }
        Insert: {
          caption?: string | null
          category?: string
          couple_id: string
          created_at?: string
          id?: string
          position?: number
          public_url: string
          section_id?: string | null
          storage_path: string
        }
        Update: {
          caption?: string | null
          category?: string
          couple_id?: string
          created_at?: string
          id?: string
          position?: number
          public_url?: string
          section_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "website_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          couple_id: string
          created_at: string
          dietary_restrictions: string | null
          guest_id: string
          guests_count: number
          id: string
          message: string | null
          responded_at: string
          response: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          dietary_restrictions?: string | null
          guest_id: string
          guests_count?: number
          id?: string
          message?: string | null
          responded_at?: string
          response: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          dietary_restrictions?: string | null
          guest_id?: string
          guests_count?: number
          id?: string
          message?: string | null
          responded_at?: string
          response?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      site_events: {
        Row: {
          couple_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
        }
        Insert: {
          couple_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          couple_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      story_moments: {
        Row: {
          couple_id: string
          created_at: string
          description: string | null
          id: string
          moment_date: string | null
          photo_url: string | null
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          description?: string | null
          id?: string
          moment_date?: string | null
          photo_url?: string | null
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          description?: string | null
          id?: string
          moment_date?: string | null
          photo_url?: string | null
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_moments_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          couple_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          gateway: string | null
          gateway_subscription_id: string | null
          id: string
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gateway?: string | null
          gateway_subscription_id?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gateway?: string | null
          gateway_subscription_id?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_sections: {
        Row: {
          content: string | null
          couple_id: string
          created_at: string
          id: string
          position: number
          section_type: string
          settings: Json
          title: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          content?: string | null
          couple_id: string
          created_at?: string
          id?: string
          position?: number
          section_type: string
          settings?: Json
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          content?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          position?: number
          section_type?: string
          settings?: Json
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "website_sections_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      website_settings: {
        Row: {
          background_color: string
          body_font: string
          border_radius: string
          button_style: string
          card_style: string
          couple_id: string
          created_at: string
          custom_domain: string | null
          heading_font: string
          hero_image_url: string | null
          id: string
          layout_width: string
          messages_enabled: boolean
          music_url: string | null
          primary_color: string
          published: boolean
          rsvp_mode: string
          secondary_color: string
          template_slug: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          body_font?: string
          border_radius?: string
          button_style?: string
          card_style?: string
          couple_id: string
          created_at?: string
          custom_domain?: string | null
          heading_font?: string
          hero_image_url?: string | null
          id?: string
          layout_width?: string
          messages_enabled?: boolean
          music_url?: string | null
          primary_color?: string
          published?: boolean
          rsvp_mode?: string
          secondary_color?: string
          template_slug?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          body_font?: string
          border_radius?: string
          button_style?: string
          card_style?: string
          couple_id?: string
          created_at?: string
          custom_domain?: string | null
          heading_font?: string
          hero_image_url?: string | null
          id?: string
          layout_width?: string
          messages_enabled?: boolean
          music_url?: string | null
          primary_color?: string
          published?: boolean
          rsvp_mode?: string
          secondary_color?: string
          template_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_settings_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_party: {
        Row: {
          couple_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          photo_url: string | null
          position: number
          role: string | null
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          photo_url?: string | null
          position?: number
          role?: string | null
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          position?: number
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_party_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      weddings: {
        Row: {
          ceremony_time: string | null
          city: string | null
          couple_id: string
          created_at: string
          description: string | null
          dress_code: string | null
          id: string
          latitude: number | null
          longitude: number | null
          our_story: string | null
          reception_address: string | null
          reception_time: string | null
          reception_venue_name: string | null
          state: string | null
          title: string | null
          updated_at: string
          venue_address: string | null
          venue_name: string | null
          wedding_date: string | null
        }
        Insert: {
          ceremony_time?: string | null
          city?: string | null
          couple_id: string
          created_at?: string
          description?: string | null
          dress_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          our_story?: string | null
          reception_address?: string | null
          reception_time?: string | null
          reception_venue_name?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          wedding_date?: string | null
        }
        Update: {
          ceremony_time?: string | null
          city?: string | null
          couple_id?: string
          created_at?: string
          description?: string | null
          dress_code?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          our_story?: string | null
          reception_address?: string | null
          reception_time?: string | null
          reception_venue_name?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
          wedding_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weddings_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: true
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_payment_event: {
        Args: {
          _gateway_event_id: string
          _gateway_payment_id: string
          _method?: string
          _order_id: string
          _payload?: Json
          _status: string
        }
        Returns: Json
      }
      can_use_feature: {
        Args: { _couple_id: string; _key: string }
        Returns: boolean
      }
      couple_is_published: { Args: { _couple_id: string }; Returns: boolean }
      create_gift_order: {
        Args: {
          _gift_item_id: string
          _guest_email: string
          _guest_name: string
          _message?: string
          _quantity: number
        }
        Returns: Json
      }
      effective_plan: { Args: { _couple_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_root: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      owns_couple: { Args: { _couple_id: string }; Returns: boolean }
      plan_rank: { Args: { _plan: string }; Returns: number }
      submit_guest_message: {
        Args: {
          _author_name: string
          _message: string
          _photo_url?: string
          _slug: string
        }
        Returns: Json
      }
      submit_rsvp: {
        Args: {
          _dietary?: string
          _email: string
          _guests_count: number
          _message?: string
          _name: string
          _plus_one_name?: string
          _response: string
          _slug: string
        }
        Returns: Json
      }
      track_site_event: {
        Args: { _event_type: string; _metadata?: Json; _slug: string }
        Returns: undefined
      }
      user_is_root: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "admin" | "root"
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
      app_role: ["user", "admin", "root"],
    },
  },
} as const
