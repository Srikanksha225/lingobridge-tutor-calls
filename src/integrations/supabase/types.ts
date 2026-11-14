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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      mistakes: {
        Row: {
          category: string
          corrected: string
          created_at: string
          explanation: string
          id: string
          original: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          corrected: string
          created_at?: string
          explanation?: string
          id?: string
          original: string
          session_id?: string | null
          user_id?: string
        }
        Update: {
          category?: string
          corrected?: string
          created_at?: string
          explanation?: string
          id?: string
          original?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          analytics: Json | null
          corrections: number
          created_at: string
          duration_sec: number
          feedback: Json
          id: string
          learner_turns: number
          mode: string
          recap: Json | null
          scenario_id: string
          started_at: string
          transcript: Json
          tutor_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics?: Json | null
          corrections?: number
          created_at?: string
          duration_sec?: number
          feedback?: Json
          id: string
          learner_turns?: number
          mode?: string
          recap?: Json | null
          scenario_id: string
          started_at: string
          transcript?: Json
          tutor_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          analytics?: Json | null
          corrections?: number
          created_at?: string
          duration_sec?: number
          feedback?: Json
          id?: string
          learner_turns?: number
          mode?: string
          recap?: Json | null
          scenario_id?: string
          started_at?: string
          transcript?: Json
          tutor_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          confidence: number | null
          created_at: string
          display_name: string
          goal: string | null
          id: string
          level: string | null
          native_language: string | null
          onboarded_at: string | null
          placement_score: number | null
          tutor_id: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          display_name?: string
          goal?: string | null
          id: string
          level?: string | null
          native_language?: string | null
          onboarded_at?: string | null
          placement_score?: number | null
          tutor_id?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          display_name?: string
          goal?: string | null
          id?: string
          level?: string | null
          native_language?: string | null
          onboarded_at?: string | null
          placement_score?: number | null
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      studies: {
        Row: {
          consent_text: string
          created_at: string
          design: string
          id: string
          info_text: string
          measures: Json
          objective: string
          owner_id: string
          practice_minutes: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          consent_text?: string
          created_at?: string
          design?: string
          id?: string
          info_text?: string
          measures?: Json
          objective?: string
          owner_id?: string
          practice_minutes?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          consent_text?: string
          created_at?: string
          design?: string
          id?: string
          info_text?: string
          measures?: Json
          objective?: string
          owner_id?: string
          practice_minutes?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_measurements: {
        Row: {
          condition: string
          created_at: string
          id: string
          metrics: Json
          participant_id: string
          phase: string
          study_id: string
          task_id: string
          transcript: string | null
        }
        Insert: {
          condition: string
          created_at?: string
          id?: string
          metrics?: Json
          participant_id: string
          phase: string
          study_id: string
          task_id: string
          transcript?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          metrics?: Json
          participant_id?: string
          phase?: string
          study_id?: string
          task_id?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_measurements_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "study_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_measurements_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      study_participants: {
        Row: {
          assigned_condition: string | null
          code: string
          condition_order: string | null
          consent_text_snapshot: string | null
          consented_at: string | null
          created_at: string
          id: string
          level: string | null
          native_language: string | null
          study_id: string
          withdrawn_at: string | null
        }
        Insert: {
          assigned_condition?: string | null
          code: string
          condition_order?: string | null
          consent_text_snapshot?: string | null
          consented_at?: string | null
          created_at?: string
          id?: string
          level?: string | null
          native_language?: string | null
          study_id: string
          withdrawn_at?: string | null
        }
        Update: {
          assigned_condition?: string | null
          code?: string
          condition_order?: string | null
          consent_text_snapshot?: string | null
          consented_at?: string | null
          created_at?: string
          id?: string
          level?: string | null
          native_language?: string | null
          study_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_participants_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      study_practice_logs: {
        Row: {
          condition: string
          created_at: string
          details: Json
          duration_sec: number
          id: string
          participant_id: string
          study_id: string
        }
        Insert: {
          condition: string
          created_at?: string
          details?: Json
          duration_sec?: number
          id?: string
          participant_id: string
          study_id: string
        }
        Update: {
          condition?: string
          created_at?: string
          details?: Json
          duration_sec?: number
          id?: string
          participant_id?: string
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_practice_logs_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "study_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_practice_logs_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      study_surveys: {
        Row: {
          comments: string | null
          condition: string
          created_at: string
          id: string
          participant_id: string
          phase: string
          responses: Json
          study_id: string
        }
        Insert: {
          comments?: string | null
          condition: string
          created_at?: string
          id?: string
          participant_id: string
          phase: string
          responses?: Json
          study_id: string
        }
        Update: {
          comments?: string | null
          condition?: string
          created_at?: string
          id?: string
          participant_id?: string
          phase?: string
          responses?: Json
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_surveys_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "study_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_surveys_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_researcher: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_study: { Args: { _study_id: string }; Returns: boolean }
      researcher_exists: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "researcher" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["researcher", "admin"],
    },
  },
} as const
