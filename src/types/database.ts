export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string; user_id: string; title: string; author: string | null;
          publisher: string | null; language: string | null; description: string | null;
          epub_identifier: string | null; original_file_name: string; file_size: number;
          file_hash: string; epub_storage_path: string; cover_storage_path: string | null;
          upload_status: "pending" | "ready"; last_opened_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; user_id: string; title: string; author?: string | null;
          publisher?: string | null; language?: string | null; description?: string | null;
          epub_identifier?: string | null; original_file_name: string; file_size: number;
          file_hash: string; epub_storage_path: string; cover_storage_path?: string | null;
          upload_status?: "pending" | "ready"; last_opened_at?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
        Relationships: [];
      };
      reading_progress: {
        Row: { book_id: string; user_id: string; cfi: string | null; percentage: number; changed_at: string; server_updated_at: string };
        Insert: { book_id: string; user_id: string; cfi?: string | null; percentage: number; changed_at: string; server_updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["reading_progress"]["Insert"]>;
        Relationships: [];
      };
      reader_preferences: {
        Row: { user_id: string; theme: string; flow: string; font_family: string; font_size: number; line_height: number; content_width: string; changed_at: string; server_updated_at: string };
        Insert: { user_id: string; theme: string; flow: string; font_family: string; font_size: number; line_height: number; content_width: string; changed_at: string; server_updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["reader_preferences"]["Insert"]>;
        Relationships: [];
      };
      book_deletions: {
        Row: { user_id: string; book_id: string; deleted_at: string };
        Insert: { user_id: string; book_id: string; deleted_at?: string };
        Update: { deleted_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      sync_reading_progress: { Args: { p_book_id: string; p_cfi: string | null; p_percentage: number; p_changed_at: string }; Returns: boolean };
      sync_reader_preferences: { Args: { p_theme: string; p_flow: string; p_font_family: string; p_font_size: number; p_line_height: number; p_content_width: string; p_changed_at: string }; Returns: boolean };
      delete_owned_book: { Args: { p_book_id: string }; Returns: Array<{ epub_storage_path: string; cover_storage_path: string | null }> };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

