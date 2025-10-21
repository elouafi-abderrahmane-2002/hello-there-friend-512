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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alert_rules: {
        Row: {
          auto_dismiss_low: boolean | null
          created_at: string
          description: string | null
          device_types: string[] | null
          email_notification: boolean | null
          id: string
          is_active: boolean | null
          name: string
          parc_id: string
          severity_threshold: Database["public"]["Enums"]["severity"]
          updated_at: string
          vendor_filter: string[] | null
          webhook_url: string | null
        }
        Insert: {
          auto_dismiss_low?: boolean | null
          created_at?: string
          description?: string | null
          device_types?: string[] | null
          email_notification?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          parc_id: string
          severity_threshold?: Database["public"]["Enums"]["severity"]
          updated_at?: string
          vendor_filter?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          auto_dismiss_low?: boolean | null
          created_at?: string
          description?: string | null
          device_types?: string[] | null
          email_notification?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          parc_id?: string
          severity_threshold?: Database["public"]["Enums"]["severity"]
          updated_at?: string
          vendor_filter?: string[] | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_parc_id_fkey"
            columns: ["parc_id"]
            isOneToOne: false
            referencedRelation: "parcs"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          cve_id: string
          device_id: string
          id: string
          notified_email: boolean | null
          parc_id: string
          risk_score: number | null
          status: Database["public"]["Enums"]["alert_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          cve_id: string
          device_id: string
          id?: string
          notified_email?: boolean | null
          parc_id: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          cve_id?: string
          device_id?: string
          id?: string
          notified_email?: boolean | null
          parc_id?: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_cve_id_fkey"
            columns: ["cve_id"]
            isOneToOne: false
            referencedRelation: "cves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_parc_id_fkey"
            columns: ["parc_id"]
            isOneToOne: false
            referencedRelation: "parcs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cve_tags: {
        Row: {
          created_at: string
          cve_id: string
          id: string
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cve_id: string
          id?: string
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string
          cve_id?: string
          id?: string
          tag?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cve_tags_cve_id_fkey"
            columns: ["cve_id"]
            isOneToOne: false
            referencedRelation: "cves"
            referencedColumns: ["id"]
          },
        ]
      }
      cves: {
        Row: {
          affected_products: string[] | null
          created_at: string | null
          cve_id: string
          cvss_score: number | null
          cwes: string[] | null
          date_added: string | null
          description: string | null
          due_date: string | null
          id: string
          known_ransomware_campaign_use: string | null
          notes: string | null
          product: string | null
          published_at: string | null
          reference_links: string[] | null
          required_action: string | null
          severity: Database["public"]["Enums"]["severity"]
          source: string | null
          vendor_project: string | null
          vulnerability_name: string | null
        }
        Insert: {
          affected_products?: string[] | null
          created_at?: string | null
          cve_id: string
          cvss_score?: number | null
          cwes?: string[] | null
          date_added?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          known_ransomware_campaign_use?: string | null
          notes?: string | null
          product?: string | null
          published_at?: string | null
          reference_links?: string[] | null
          required_action?: string | null
          severity: Database["public"]["Enums"]["severity"]
          source?: string | null
          vendor_project?: string | null
          vulnerability_name?: string | null
        }
        Update: {
          affected_products?: string[] | null
          created_at?: string | null
          cve_id?: string
          cvss_score?: number | null
          cwes?: string[] | null
          date_added?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          known_ransomware_campaign_use?: string | null
          notes?: string | null
          product?: string | null
          published_at?: string | null
          reference_links?: string[] | null
          required_action?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          source?: string | null
          vendor_project?: string | null
          vulnerability_name?: string | null
        }
        Relationships: []
      }
      device_group_members: {
        Row: {
          added_at: string
          device_id: string
          group_id: string
        }
        Insert: {
          added_at?: string
          device_id: string
          group_id: string
        }
        Update: {
          added_at?: string
          device_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_group_members_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "device_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      device_groups: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          parc_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parc_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parc_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_groups_parc_id_fkey"
            columns: ["parc_id"]
            isOneToOne: false
            referencedRelation: "parcs"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          is_active: boolean | null
          last_sync: string | null
          name: string
          notes: string | null
          os_version: string | null
          parc_id: string
          rmm_source: string | null
          tags: string[] | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          created_at?: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          name: string
          notes?: string | null
          os_version?: string | null
          parc_id: string
          rmm_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          name?: string
          notes?: string | null
          os_version?: string | null
          parc_id?: string
          rmm_source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_parc_id_fkey"
            columns: ["parc_id"]
            isOneToOne: false
            referencedRelation: "parcs"
            referencedColumns: ["id"]
          },
        ]
      }
      export_history: {
        Row: {
          created_at: string
          export_type: string
          file_size: number | null
          filters: Json | null
          format: string
          id: string
          record_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          export_type: string
          file_size?: number | null
          filters?: Json | null
          format: string
          id?: string
          record_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          export_type?: string
          file_size?: number | null
          filters?: Json | null
          format?: string
          id?: string
          record_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          api_key_encrypted: string | null
          connected_at: string | null
          created_at: string | null
          id: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active: boolean | null
          last_sync: string | null
          parc_id: string
          sync_error: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_type: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean | null
          last_sync?: string | null
          parc_id: string
          sync_error?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_type?: Database["public"]["Enums"]["integration_type"]
          is_active?: boolean | null
          last_sync?: string | null
          parc_id?: string
          sync_error?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_parc_id_fkey"
            columns: ["parc_id"]
            isOneToOne: false
            referencedRelation: "parcs"
            referencedColumns: ["id"]
          },
        ]
      }
      parcs: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string
          filter_config: Json
          filter_type: string
          id: string
          is_default: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filter_config: Json
          filter_type: string
          id?: string
          is_default?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filter_config?: Json
          filter_type?: string
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
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
      get_dashboard_analytics: {
        Args: { _user_id: string }
        Returns: {
          active_alerts: number
          avg_cvss_score: number
          critical_alerts: number
          high_alerts: number
          last_alert_time: string
          new_alerts: number
          total_devices: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: Database["public"]["Enums"]["audit_action"]
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
        }
        Returns: string
      }
    }
    Enums: {
      alert_status: "new" | "read" | "dismissed"
      app_role: "admin" | "analyst" | "viewer"
      audit_action:
        | "user_login"
        | "user_logout"
        | "device_create"
        | "device_update"
        | "device_delete"
        | "alert_create"
        | "alert_update"
        | "alert_dismiss"
        | "cve_fetch"
        | "export_data"
        | "settings_update"
        | "role_grant"
        | "role_revoke"
        | "integration_connect"
        | "integration_disconnect"
      device_type: "linux" | "windows" | "vmware" | "network" | "other"
      integration_type: "datto" | "ninjaone" | "nable"
      severity: "critical" | "high" | "medium" | "low"
      user_plan: "enterprise" | "multi_tenant"
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
      alert_status: ["new", "read", "dismissed"],
      app_role: ["admin", "analyst", "viewer"],
      audit_action: [
        "user_login",
        "user_logout",
        "device_create",
        "device_update",
        "device_delete",
        "alert_create",
        "alert_update",
        "alert_dismiss",
        "cve_fetch",
        "export_data",
        "settings_update",
        "role_grant",
        "role_revoke",
        "integration_connect",
        "integration_disconnect",
      ],
      device_type: ["linux", "windows", "vmware", "network", "other"],
      integration_type: ["datto", "ninjaone", "nable"],
      severity: ["critical", "high", "medium", "low"],
      user_plan: ["enterprise", "multi_tenant"],
    },
  },
} as const
