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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          count: number
          user_key: string
          window_start: number
        }
        Insert: {
          count: number
          user_key: string
          window_start: number
        }
        Update: {
          count?: number
          user_key?: string
          window_start?: number
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          credit_delta: number
          id: string
          prompt: string | null
          result_excerpt: string | null
          usage_type: string
          used_at: string
          user_id: string
        }
        Insert: {
          credit_delta: number
          id?: string
          prompt?: string | null
          result_excerpt?: string | null
          usage_type: string
          used_at?: string
          user_id: string
        }
        Update: {
          credit_delta?: number
          id?: string
          prompt?: string | null
          result_excerpt?: string | null
          usage_type?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          background: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          script_id: string
          traits: string[] | null
          updated_at: string | null
        }
        Insert: {
          background?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          script_id: string
          traits?: string[] | null
          updated_at?: string | null
        }
        Update: {
          background?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          script_id?: string
          traits?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          element_id: string
          id: string
          read_by: string[] | null
          script_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          element_id: string
          id?: string
          read_by?: string[] | null
          script_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          element_id?: string
          id?: string
          read_by?: string[] | null
          script_id?: string
          user_id?: string
        }
        Relationships: []
      }
      credits_purchases: {
        Row: {
          created_at: string
          credits_added: number
          id: string
          package_id: string
          price_paid: number
          stripe_payment_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_added: number
          id?: string
          package_id: string
          price_paid: number
          stripe_payment_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_added?: number
          id?: string
          package_id?: string
          price_paid?: number
          stripe_payment_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      edit_notifications: {
        Row: {
          action: string
          created_at: string | null
          element_id: string
          id: string
          read_by: string[] | null
          script_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          element_id: string
          id?: string
          read_by?: string[] | null
          script_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          element_id?: string
          id?: string
          read_by?: string[] | null
          script_id?: string
          user_id?: string
        }
        Relationships: []
      }
      funding_applications: {
        Row: {
          applied_at: string
          funding_id: string | null
          id: string
          notes: string | null
          script_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          applied_at?: string
          funding_id?: string | null
          id?: string
          notes?: string | null
          script_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          applied_at?: string
          funding_id?: string | null
          id?: string
          notes?: string | null
          script_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funding_applications_funding_id_fkey"
            columns: ["funding_id"]
            isOneToOne: false
            referencedRelation: "funding_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funding_applications_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_opportunities: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          eligibility: string | null
          id: string
          is_active: boolean
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          is_active?: boolean
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          is_active?: boolean
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      mentions: {
        Row: {
          created_at: string | null
          element_id: string
          from_user: string
          id: string
          mentioned_user: string
          read: boolean | null
          script_id: string
        }
        Insert: {
          created_at?: string | null
          element_id: string
          from_user: string
          id?: string
          mentioned_user: string
          read?: boolean | null
          script_id: string
        }
        Update: {
          created_at?: string | null
          element_id?: string
          from_user?: string
          id?: string
          mentioned_user?: string
          read?: boolean | null
          script_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          from_user: string
          id: string
          read: boolean | null
          script_id: string
          text: string
          to_user: string
        }
        Insert: {
          created_at?: string | null
          from_user: string
          id?: string
          read?: boolean | null
          script_id: string
          text: string
          to_user: string
        }
        Update: {
          created_at?: string | null
          from_user?: string
          id?: string
          read?: boolean | null
          script_id?: string
          text?: string
          to_user?: string
        }
        Relationships: []
      }
      plots: {
        Row: {
          content: string
          created_at: string | null
          genre: string | null
          id: string
          language: string | null
          sub_genres: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          genre?: string | null
          id?: string
          language?: string | null
          sub_genres?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          genre?: string | null
          id?: string
          language?: string | null
          sub_genres?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      producer_submissions: {
        Row: {
          feedback: string | null
          id: string
          producer_id: string
          script_title: string
          status: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          feedback?: string | null
          id?: string
          producer_id: string
          script_title: string
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          feedback?: string | null
          id?: string
          producer_id?: string
          script_title?: string
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_credits: number
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          ai_credits?: number
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          ai_credits?: number
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      saved_characters: {
        Row: {
          background: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          traits: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          traits?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          traits?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenes: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          script_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          script_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          script_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_collaborators: {
        Row: {
          created_at: string
          id: string
          script_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          script_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          script_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_collaborators_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_copyrights: {
        Row: {
          copyright_claim: string
          id: string
          registered_at: string
          registration_certificate_url: string | null
          script_id: string | null
          user_id: string | null
        }
        Insert: {
          copyright_claim: string
          id?: string
          registered_at?: string
          registration_certificate_url?: string | null
          script_id?: string | null
          user_id?: string | null
        }
        Update: {
          copyright_claim?: string
          id?: string
          registered_at?: string
          registration_certificate_url?: string | null
          script_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_copyrights_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_elements: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          position: number
          script_id: string | null
          type: Database["public"]["Enums"]["script_element_type"]
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          position: number
          script_id?: string | null
          type: Database["public"]["Enums"]["script_element_type"]
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          position?: number
          script_id?: string | null
          type?: Database["public"]["Enums"]["script_element_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_elements_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_invitations: {
        Row: {
          created_at: string
          id: string
          invitee_email: string
          invitee_id: string | null
          inviter_email: string
          inviter_id: string
          script_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_email: string
          invitee_id?: string | null
          inviter_email: string
          inviter_id: string
          script_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitee_email?: string
          invitee_id?: string | null
          inviter_email?: string
          inviter_id?: string
          script_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_invitations_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      script_registrations: {
        Row: {
          certificate_url: string | null
          id: string
          registered_at: string
          script_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          certificate_url?: string | null
          id?: string
          registered_at?: string
          script_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          certificate_url?: string | null
          id?: string
          registered_at?: string
          script_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "script_registrations_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          created_at: string | null
          description: string | null
          genre: string | null
          id: string
          language: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          language?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          language?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shared_scripts: {
        Row: {
          access_count: number
          access_level: string
          allow_download: boolean
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          password_hash: string | null
          script_id: string
          share_token: string
          share_type: string
          updated_at: string
        }
        Insert: {
          access_count?: number
          access_level?: string
          allow_download?: boolean
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          password_hash?: string | null
          script_id: string
          share_token?: string
          share_type?: string
          updated_at?: string
        }
        Update: {
          access_count?: number
          access_level?: string
          allow_download?: boolean
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          password_hash?: string | null
          script_id?: string
          share_token?: string
          share_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          ends_at: string | null
          id: string
          started_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ends_at?: string | null
          id?: string
          started_at?: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ends_at?: string | null
          id?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      synopses: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      templates_purchases: {
        Row: {
          id: string
          price_paid: number
          purchased_at: string
          template_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          price_paid: number
          purchased_at?: string
          template_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          price_paid?: number
          purchased_at?: string
          template_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      verified_producers: {
        Row: {
          added_at: string
          company: string | null
          contact_email: string | null
          focus_genres: string[] | null
          id: string
          is_active: boolean
          name: string
          profile_url: string | null
        }
        Insert: {
          added_at?: string
          company?: string | null
          contact_email?: string | null
          focus_genres?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          profile_url?: string | null
        }
        Update: {
          added_at?: string
          company?: string | null
          contact_email?: string | null
          focus_genres?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          profile_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_script_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      add_user_credits: {
        Args: { credits_to_add: number; target_user_id: string }
        Returns: {
          message: string
          new_credits: number
          success: boolean
        }[]
      }
      admin_exists: { Args: never; Returns: boolean }
      get_user_email: { Args: { user_id: string }; Returns: string }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
    }
    Enums: {
      script_element_type:
      | "heading"
      | "action"
      | "character"
      | "dialogue"
      | "parenthetical"
      | "transition"
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
      script_element_type: [
        "heading",
        "action",
        "character",
        "dialogue",
        "parenthetical",
        "transition",
      ],
    },
  },
} as const
