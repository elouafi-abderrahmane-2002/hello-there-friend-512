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
      alerts: {
        Row: {
          created_at: string | null
          cve_id: string
          device_id: string
          id: string
          notified_email: boolean | null
          parc_id: string
          status: Database["public"]["Enums"]["alert_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cve_id: string
          device_id: string
          id?: string
          notified_email?: boolean | null
          parc_id: string
          status?: Database["public"]["Enums"]["alert_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cve_id?: string
          device_id?: string
          id?: string
          notified_email?: boolean | null
          parc_id?: string
          status?: Database["public"]["Enums"]["alert_status"] | null
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
      devices: {
        Row: {
          created_at: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          id: string
          is_active: boolean | null
          last_sync: string | null
          name: string
          os_version: string | null
          parc_id: string
          rmm_source: string | null
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
          os_version?: string | null
          parc_id: string
          rmm_source?: string | null
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
          os_version?: string | null
          parc_id?: string
          rmm_source?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_status: "new" | "read" | "dismissed"
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
      device_type: ["linux", "windows", "vmware", "network", "other"],
      integration_type: ["datto", "ninjaone", "nable"],
      severity: ["critical", "high", "medium", "low"],
      user_plan: ["enterprise", "multi_tenant"],
    },
  },
} as const
