export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ada_requirements: {
        Row: {
          created_at: string | null
          id: string
          minimum_required_ada_stalls: number
          total_parking_spaces_provided: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          minimum_required_ada_stalls: number
          total_parking_spaces_provided: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          minimum_required_ada_stalls?: number
          total_parking_spaces_provided?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      csv_datasets: {
        Row: {
          content: Json | null
          id: string
          last_updated: string | null
          name: string
          notes: string | null
          type: string
        }
        Insert: {
          content?: Json | null
          id?: string
          last_updated?: string | null
          name: string
          notes?: string | null
          type: string
        }
        Update: {
          content?: Json | null
          id?: string
          last_updated?: string | null
          name?: string
          notes?: string | null
          type?: string
        }
        Relationships: []
      }
      parking_requirements: {
        Row: {
          county: string
          created_at: string | null
          id: string
          parking_requirement: string
          updated_at: string | null
          use_type: string
        }
        Insert: {
          county: string
          created_at?: string | null
          id?: string
          parking_requirement: string
          updated_at?: string | null
          use_type: string
        }
        Update: {
          county?: string
          created_at?: string | null
          id?: string
          parking_requirement?: string
          updated_at?: string | null
          use_type?: string
        }
        Relationships: []
      }
      zoning_standards: {
        Row: {
          ada_stalls_required: string | null
          county: string
          created_at: string | null
          front_setback: string | null
          id: string
          max_far: string | null
          max_height: string | null
          max_lot_coverage: string | null
          parking_required: string | null
          rear_setback: string | null
          side_setback: string | null
          updated_at: string | null
          zoning_district: string
        }
        Insert: {
          ada_stalls_required?: string | null
          county: string
          created_at?: string | null
          front_setback?: string | null
          id?: string
          max_far?: string | null
          max_height?: string | null
          max_lot_coverage?: string | null
          parking_required?: string | null
          rear_setback?: string | null
          side_setback?: string | null
          updated_at?: string | null
          zoning_district: string
        }
        Update: {
          ada_stalls_required?: string | null
          county?: string
          created_at?: string | null
          front_setback?: string | null
          id?: string
          max_far?: string | null
          max_height?: string | null
          max_lot_coverage?: string | null
          parking_required?: string | null
          rear_setback?: string | null
          side_setback?: string | null
          updated_at?: string | null
          zoning_district?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
