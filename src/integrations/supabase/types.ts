export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          avatar: string | null;
          monthly_goal_hours: number;
          exp: number;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          email?: string | null;
          avatar?: string | null;
          monthly_goal_hours?: number;
          exp?: number;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          avatar?: string | null;
          monthly_goal_hours?: number;
          exp?: number;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      focus_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          minutes: number;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          minutes: number;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          minutes?: number;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          deadline: string | null;
          priority: Database["public"]["Enums"]["task_priority"];
          done: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          deadline?: string | null;
          priority?: Database["public"]["Enums"]["task_priority"];
          done?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          deadline?: string | null;
          priority?: Database["public"]["Enums"]["task_priority"];
          done?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      reflections: {
        Row: {
          id: string;
          user_id: string;
          rating: number;
          reasons: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rating: number;
          reasons?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rating?: number;
          reasons?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      garden_trees: {
        Row: {
          id: string;
          user_id: string;
          species: string;
          planted_at: string;
          minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          species: string;
          planted_at?: string;
          minutes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          species?: string;
          planted_at?: string;
          minutes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      study_rooms: {
        Row: {
          id: string;
          name: string;
          code: string;
          host_id: string;
          status: Database["public"]["Enums"]["room_status"];
          duration_min: number;
          remaining_sec: number;
          ends_at: string | null;
          has_password: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          host_id: string;
          status?: Database["public"]["Enums"]["room_status"];
          duration_min?: number;
          remaining_sec?: number;
          ends_at?: string | null;
          has_password?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          host_id?: string;
          status?: Database["public"]["Enums"]["room_status"];
          duration_min?: number;
          remaining_sec?: number;
          ends_at?: string | null;
          has_password?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      room_passwords: {
        Row: {
          room_id: string;
          password_hash: string;
          updated_at: string;
        };
        Insert: {
          room_id: string;
          password_hash: string;
          updated_at?: string;
        };
        Update: {
          room_id?: string;
          password_hash?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_passwords_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: true;
            referencedRelation: "study_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "study_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      room_messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          user_name: string;
          user_avatar: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          user_name: string;
          user_avatar?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          user_name?: string;
          user_avatar?: string | null;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "study_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      set_room_password: {
        Args: { p_room_id: string; p_password: string | null };
        Returns: undefined;
      };
      join_room_with_password: {
        Args: { p_room_id: string; p_password: string };
        Returns: undefined;
      };
      complete_focus_session: {
        Args: { p_minutes: number; p_completed: boolean };
        Returns: Json;
      };
      complete_task: {
        Args: { p_task_id: string };
        Returns: number;
      };
    };
    Enums: {
      task_priority: "low" | "medium" | "high";
      room_status: "idle" | "running" | "paused";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      task_priority: ["low", "medium", "high"],
      room_status: ["idle", "running", "paused"],
    },
  },
} as const;
