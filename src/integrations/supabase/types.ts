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
      game_state: {
        Row: {
          animation_state: string | null
          created_at: string
          current_action_id: string | null
          current_player_id: string | null
          dialog_open: boolean | null
          difficulty: string | null
          health_warning: string | null
          id: string
          joker_info: string | null
          joker_penalty: string | null
          ready_count: number | null
          room_id: string
        }
        Insert: {
          animation_state?: string | null
          created_at?: string
          current_action_id?: string | null
          current_player_id?: string | null
          dialog_open?: boolean | null
          difficulty?: string | null
          health_warning?: string | null
          id?: string
          joker_info?: string | null
          joker_penalty?: string | null
          ready_count?: number | null
          room_id: string
        }
        Update: {
          animation_state?: string | null
          created_at?: string
          current_action_id?: string | null
          current_player_id?: string | null
          dialog_open?: boolean | null
          difficulty?: string | null
          health_warning?: string | null
          id?: string
          joker_info?: string | null
          joker_penalty?: string | null
          ready_count?: number | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_state_current_action_id_fkey"
            columns: ["current_action_id"]
            isOneToOne: false
            referencedRelation: "player_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_state_current_player_id_fkey"
            columns: ["current_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_state_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      player_actions: {
        Row: {
          action_text: string
          created_at: string
          id: string
          player_id: string | null
          room_id: string
          used: boolean | null
        }
        Insert: {
          action_text: string
          created_at?: string
          id?: string
          player_id?: string | null
          room_id: string
          used?: boolean | null
        }
        Update: {
          action_text?: string
          created_at?: string
          id?: string
          player_id?: string | null
          room_id?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "player_actions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_actions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          has_submitted: boolean | null
          id: string
          is_host: boolean | null
          is_selected: boolean | null
          jokers_count: number | null
          ready_for_next_round: boolean | null
          room_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          has_submitted?: boolean | null
          id?: string
          is_host?: boolean | null
          is_selected?: boolean | null
          jokers_count?: number | null
          ready_for_next_round?: boolean | null
          room_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          has_submitted?: boolean | null
          id?: string
          is_host?: boolean | null
          is_selected?: boolean | null
          jokers_count?: number | null
          ready_for_next_round?: boolean | null
          room_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          id: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          status?: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
