export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          password: string | null;
          phone: string | null;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password?: string | null;
          phone?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string | null;
          phone?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      thread_members: {
        Row: { thread_id: string; user_id: string; joined_at: string };
        Insert: { thread_id: string; user_id: string; joined_at?: string };
        Update: { thread_id?: string; user_id?: string; joined_at?: string };
        Relationships: [];
      };
      threads: {
        Row: {
          id: string;
          title: string;
          user_id: string;
          type: string;
          receiver_id: string | null;
          description: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          user_id: string;
          type?: string;
          receiver_id?: string | null;
          description?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          user_id?: string;
          type?: string;
          receiver_id?: string | null;
          description?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          text: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          text: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          text?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

export type ThreadRow = Database["public"]["Tables"]["threads"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
