export interface Database {
  public: {
    Tables: {
      threads: {
        Row: { id: string; title: string; user_id: string; created_at: string };
        Insert: { id?: string; title: string; user_id?: string; created_at?: string };
        Update: { id?: string; title?: string; user_id?: string; created_at?: string };
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

// Convenience row aliases
export type ThreadRow = Database["public"]["Tables"]["threads"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
