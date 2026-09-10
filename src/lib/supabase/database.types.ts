export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clinic_cdt_fees: {
        Row: {
          code: string;
          fee_egp: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          fee_egp?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          fee_egp?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          role: "user" | "assistant" | "system";
          content?: string;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinic_chat_messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "clinic_chat_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      clinic_chat_threads: {
        Row: {
          id: string;
          title: string;
          kind: "home" | "session";
          created_by: string | null;
          context: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          kind?: "home" | "session";
          created_by?: string | null;
          context?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          kind?: "home" | "session";
          created_by?: string | null;
          context?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_conversations: {
        Row: {
          id: string;
          kapso_conversation_id: string | null;
          phone_number: string;
          contact_name: string | null;
          patient_key: string | null;
          status: "active" | "ended" | "archived";
          last_message_at: string | null;
          last_inbound_at: string | null;
          last_message_preview: string;
          last_message_type: string;
          last_message_status: string;
          unread_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kapso_conversation_id?: string | null;
          phone_number: string;
          contact_name?: string | null;
          patient_key?: string | null;
          status?: "active" | "ended" | "archived";
          last_message_at?: string | null;
          last_inbound_at?: string | null;
          last_message_preview?: string;
          last_message_type?: string;
          last_message_status?: string;
          unread_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kapso_conversation_id?: string | null;
          phone_number?: string;
          contact_name?: string | null;
          patient_key?: string | null;
          status?: "active" | "ended" | "archived";
          last_message_at?: string | null;
          last_inbound_at?: string | null;
          last_message_preview?: string;
          last_message_type?: string;
          last_message_status?: string;
          unread_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          conversation_id: string;
          kapso_wamid: string | null;
          direction: "inbound" | "outbound";
          body: string;
          message_type: string;
          status:
            | "pending"
            | "received"
            | "sent"
            | "delivered"
            | "read"
            | "failed";
          sent_by: string | null;
          raw: Json;
          media: Json;
          flow: Json | null;
          reply_to: Json | null;
          status_timestamps: Json;
          wa_timestamp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          kapso_wamid?: string | null;
          direction: "inbound" | "outbound";
          body?: string;
          message_type?: string;
          status?:
            | "pending"
            | "received"
            | "sent"
            | "delivered"
            | "read"
            | "failed";
          sent_by?: string | null;
          raw?: Json;
          media?: Json;
          flow?: Json | null;
          reply_to?: Json | null;
          status_timestamps?: Json;
          wa_timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          kapso_wamid?: string | null;
          direction?: "inbound" | "outbound";
          body?: string;
          message_type?: string;
          status?:
            | "pending"
            | "received"
            | "sent"
            | "delivered"
            | "read"
            | "failed";
          sent_by?: string | null;
          raw?: Json;
          media?: Json;
          flow?: Json | null;
          reply_to?: Json | null;
          status_timestamps?: Json;
          wa_timestamp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "whatsapp_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_notes: {
        Row: {
          id: string;
          conversation_id: string;
          body: string;
          pinned: boolean;
          author: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          body?: string;
          pinned?: boolean;
          author?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          body?: string;
          pinned?: boolean;
          author?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_notes_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "whatsapp_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_webhook_events: {
        Row: {
          idempotency_key: string;
          event: string;
          processed_at: string;
        };
        Insert: {
          idempotency_key: string;
          event: string;
          processed_at?: string;
        };
        Update: {
          idempotency_key?: string;
          event?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      whatsapp_canned_replies: {
        Row: {
          id: string;
          slash_key: string;
          title: string;
          title_ar: string | null;
          body: string;
          body_ar: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slash_key: string;
          title: string;
          title_ar?: string | null;
          body: string;
          body_ar?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slash_key?: string;
          title?: string;
          title_ar?: string | null;
          body?: string;
          body_ar?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinic_treatment_presets: {
        Row: {
          slot: number;
          code: string;
          label: string;
          updated_at: string;
        };
        Insert: {
          slot: number;
          code: string;
          label: string;
          updated_at?: string;
        };
        Update: {
          slot?: number;
          code?: string;
          label?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role: "admin" | "viewer";
          display_name: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          role?: "admin" | "viewer";
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          role?: "admin" | "viewer";
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          brand_name: string;
          brand_logo_url: string | null;
          footer_tagline: string;
          footer_tagline_image_url: string | null;
          contact_email: string;
          contact_phone: string;
          contact_phone_secondary: string;
          contact_email_secondary: string;
          contact_address: string;
          contact_city: string;
          contact_country: string;
          contact_hours: string;
          contact_map_url: string;
          contact_whatsapp: string;
          contact_telegram: string;
          contact_headline: string;
          contact_blurb: string;
          contact_mobile: string;
          contact_behance: string;
          contact_linkedin: string;
          contact_instagram: string;
          contact_facebook: string;
          contact_x: string;
          contact_clinic_name: string;
          contact_clinic_name_ar: string;
          contact_doctor_name: string;
          contact_doctor_name_ar: string;
          contact_credentials: string;
          contact_credentials_ar: string;
          contact_card_image_url: string | null;
          case_studies_title: string;
          case_studies_description: string;
          featured_title: string;
          featured_description: string;
          services_title: string;
          services_description: string;
          services_heading: string;
          solutions_title: string;
          solutions_description: string;
          about_title: string;
          gallery_title: string;
          gallery_heading: string;
          gallery_description: string;
          slider_heading: string;
          contact_title: string;
          homepage_section_order: string[];
          homepage_hidden_sections: string[];
          dashboard_primary_color: string;
          dashboard_secondary_color: string;
          dashboard_canvas_color: string;
          dashboard_panel_color: string;
          dashboard_layout: Json;
          footer_tagline_ar: string;
          contact_headline_ar: string;
          contact_blurb_ar: string;
          contact_title_ar: string;
          about_title_ar: string;
          solutions_title_ar: string;
          solutions_description_ar: string;
          services_title_ar: string;
          services_heading_ar: string;
          services_description_ar: string;
          gallery_title_ar: string;
          gallery_heading_ar: string;
          gallery_description_ar: string;
          featured_title_ar: string;
          featured_description_ar: string;
          slider_heading_ar: string;
          case_studies_title_ar: string;
          case_studies_description_ar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_name?: string;
          brand_logo_url?: string | null;
          footer_tagline?: string;
          footer_tagline_image_url?: string | null;
          contact_email?: string;
          contact_phone?: string;
          contact_phone_secondary?: string;
          contact_email_secondary?: string;
          contact_address?: string;
          contact_city?: string;
          contact_country?: string;
          contact_hours?: string;
          contact_map_url?: string;
          contact_whatsapp?: string;
          contact_telegram?: string;
          contact_headline?: string;
          contact_blurb?: string;
          contact_mobile?: string;
          contact_behance?: string;
          contact_linkedin?: string;
          contact_instagram?: string;
          contact_facebook?: string;
          contact_x?: string;
          contact_clinic_name?: string;
          contact_clinic_name_ar?: string;
          contact_doctor_name?: string;
          contact_doctor_name_ar?: string;
          contact_credentials?: string;
          contact_credentials_ar?: string;
          contact_card_image_url?: string | null;
          case_studies_title?: string;
          case_studies_description?: string;
          featured_title?: string;
          featured_description?: string;
          services_title?: string;
          services_description?: string;
          services_heading?: string;
          solutions_title?: string;
          solutions_description?: string;
          about_title?: string;
          gallery_title?: string;
          gallery_heading?: string;
          gallery_description?: string;
          slider_heading?: string;
          contact_title?: string;
          homepage_section_order?: string[];
          homepage_hidden_sections?: string[];
          dashboard_primary_color?: string;
          dashboard_secondary_color?: string;
          dashboard_canvas_color?: string;
          dashboard_panel_color?: string;
          dashboard_layout?: Json;
          footer_tagline_ar?: string;
          contact_headline_ar?: string;
          contact_blurb_ar?: string;
          contact_title_ar?: string;
          about_title_ar?: string;
          solutions_title_ar?: string;
          solutions_description_ar?: string;
          services_title_ar?: string;
          services_heading_ar?: string;
          services_description_ar?: string;
          gallery_title_ar?: string;
          gallery_heading_ar?: string;
          gallery_description_ar?: string;
          featured_title_ar?: string;
          featured_description_ar?: string;
          slider_heading_ar?: string;
          case_studies_title_ar?: string;
          case_studies_description_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_name?: string;
          brand_logo_url?: string | null;
          footer_tagline?: string;
          footer_tagline_image_url?: string | null;
          contact_email?: string;
          contact_phone?: string;
          contact_phone_secondary?: string;
          contact_email_secondary?: string;
          contact_address?: string;
          contact_city?: string;
          contact_country?: string;
          contact_hours?: string;
          contact_map_url?: string;
          contact_whatsapp?: string;
          contact_telegram?: string;
          contact_headline?: string;
          contact_blurb?: string;
          contact_mobile?: string;
          contact_behance?: string;
          contact_linkedin?: string;
          contact_instagram?: string;
          contact_facebook?: string;
          contact_x?: string;
          contact_clinic_name?: string;
          contact_clinic_name_ar?: string;
          contact_doctor_name?: string;
          contact_doctor_name_ar?: string;
          contact_credentials?: string;
          contact_credentials_ar?: string;
          contact_card_image_url?: string | null;
          case_studies_title?: string;
          case_studies_description?: string;
          featured_title?: string;
          featured_description?: string;
          services_title?: string;
          services_description?: string;
          services_heading?: string;
          solutions_title?: string;
          solutions_description?: string;
          about_title?: string;
          gallery_title?: string;
          gallery_heading?: string;
          gallery_description?: string;
          slider_heading?: string;
          contact_title?: string;
          homepage_section_order?: string[];
          homepage_hidden_sections?: string[];
          dashboard_primary_color?: string;
          dashboard_secondary_color?: string;
          dashboard_canvas_color?: string;
          dashboard_panel_color?: string;
          dashboard_layout?: Json;
          footer_tagline_ar?: string;
          contact_headline_ar?: string;
          contact_blurb_ar?: string;
          contact_title_ar?: string;
          about_title_ar?: string;
          solutions_title_ar?: string;
          solutions_description_ar?: string;
          services_title_ar?: string;
          services_heading_ar?: string;
          services_description_ar?: string;
          gallery_title_ar?: string;
          gallery_heading_ar?: string;
          gallery_description_ar?: string;
          featured_title_ar?: string;
          featured_description_ar?: string;
          slider_heading_ar?: string;
          case_studies_title_ar?: string;
          case_studies_description_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hero: {
        Row: {
          id: string;
          kicker: string;
          headline: string;
          accent: string;
          body: string;
          headline_image_url: string | null;
          cta_primary_label: string;
          cta_primary_href: string;
          cta_secondary_label: string;
          cta_secondary_href: string;
          media_type: "image" | "video";
          media_url: string | null;
          media_url_desktop: string | null;
          media_url_mobile: string | null;
          kicker_ar: string;
          headline_ar: string;
          accent_ar: string;
          body_ar: string;
          cta_primary_label_ar: string;
          cta_secondary_label_ar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kicker?: string;
          headline?: string;
          accent?: string;
          body?: string;
          headline_image_url?: string | null;
          cta_primary_label?: string;
          cta_primary_href?: string;
          cta_secondary_label?: string;
          cta_secondary_href?: string;
          media_type?: "image" | "video";
          media_url?: string | null;
          media_url_desktop?: string | null;
          media_url_mobile?: string | null;
          kicker_ar?: string;
          headline_ar?: string;
          accent_ar?: string;
          body_ar?: string;
          cta_primary_label_ar?: string;
          cta_secondary_label_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kicker?: string;
          headline?: string;
          accent?: string;
          body?: string;
          headline_image_url?: string | null;
          cta_primary_label?: string;
          cta_primary_href?: string;
          cta_secondary_href?: string;
          cta_secondary_label?: string;
          media_type?: "image" | "video";
          media_url?: string | null;
          media_url_desktop?: string | null;
          media_url_mobile?: string | null;
          kicker_ar?: string;
          headline_ar?: string;
          accent_ar?: string;
          body_ar?: string;
          cta_primary_label_ar?: string;
          cta_secondary_label_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      about: {
        Row: {
          id: string;
          image_url: string | null;
          media_type: "image" | "video";
          copy_image_url: string | null;
          copy_media_type: "image" | "video";
          drop_cap: string;
          drop_cap_logo_url: string | null;
          body: string;
          body_ar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url?: string | null;
          media_type?: "image" | "video";
          copy_image_url?: string | null;
          copy_media_type?: "image" | "video";
          drop_cap?: string;
          drop_cap_logo_url?: string | null;
          body?: string;
          body_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string | null;
          media_type?: "image" | "video";
          copy_image_url?: string | null;
          copy_media_type?: "image" | "video";
          drop_cap?: string;
          drop_cap_logo_url?: string | null;
          body?: string;
          body_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      callouts: {
        Row: {
          id: string;
          body: string;
          lead_image_url: string | null;
          body_ar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          body?: string;
          lead_image_url?: string | null;
          body_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          body?: string;
          lead_image_url?: string | null;
          body_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      case_studies: {
        Row: {
          id: string;
          title: string;
          title_ar: string;
          description: string;
          description_ar: string;
          media_url: string | null;
          media_type: "image" | "video";
          year: string | null;
          category: string | null;
          slug: string | null;
          sort_order: number;
          is_published: boolean;
          tags: string[];
          client: string | null;
          director: string | null;
          agency: string | null;
          production_company: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          title_ar?: string;
          description?: string;
          description_ar?: string;
          media_url?: string | null;
          media_type?: "image" | "video";
          year?: string | null;
          category?: string | null;
          slug?: string | null;
          sort_order?: number;
          is_published?: boolean;
          tags?: string[];
          client?: string | null;
          director?: string | null;
          agency?: string | null;
          production_company?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          title_ar?: string;
          description?: string;
          description_ar?: string;
          media_url?: string | null;
          media_type?: "image" | "video";
          year?: string | null;
          category?: string | null;
          slug?: string | null;
          sort_order?: number;
          is_published?: boolean;
          tags?: string[];
          client?: string | null;
          director?: string | null;
          agency?: string | null;
          production_company?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      case_study_sections: {
        Row: {
          id: string;
          case_study_id: string;
          type:
            | "text"
            | "media"
            | "split"
            | "grid"
            | "columns"
            | "title"
            | "intro"
            | "text_grid";
          layout_variant: string;
          content: Json;
          sort_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          case_study_id: string;
          type:
            | "text"
            | "media"
            | "split"
            | "grid"
            | "columns"
            | "title"
            | "intro"
            | "text_grid";
          layout_variant?: string;
          content?: Json;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          case_study_id?: string;
          type?:
            | "text"
            | "media"
            | "split"
            | "grid"
            | "columns"
            | "title"
            | "intro"
            | "text_grid";
          layout_variant?: string;
          content?: Json;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_study_sections_case_study_id_fkey";
            columns: ["case_study_id"];
            isOneToOne: false;
            referencedRelation: "case_studies";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_projects: {
        Row: {
          id: string;
          title: string;
          title_ar: string;
          eyebrow: string;
          eyebrow_ar: string;
          slug: string | null;
          image_url: string | null;
          media_type: "image" | "video";
          sort_order: number;
          is_published: boolean;
          meta_left: string | null;
          meta_right: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          title_ar?: string;
          eyebrow?: string;
          eyebrow_ar?: string;
          slug?: string | null;
          image_url?: string | null;
          media_type?: "image" | "video";
          sort_order?: number;
          is_published?: boolean;
          meta_left?: string | null;
          meta_right?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          title_ar?: string;
          eyebrow?: string;
          eyebrow_ar?: string;
          slug?: string | null;
          image_url?: string | null;
          media_type?: "image" | "video";
          sort_order?: number;
          is_published?: boolean;
          meta_left?: string | null;
          meta_right?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      featured_project_sections: {
        Row: {
          id: string;
          featured_project_id: string;
          type:
            | "text"
            | "media"
            | "split"
            | "grid"
            | "columns"
            | "title"
            | "intro"
            | "text_grid";
          layout_variant: string;
          content: Json;
          sort_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          featured_project_id: string;
          type:
            | "text"
            | "media"
            | "split"
            | "grid"
            | "columns"
            | "title"
            | "intro"
            | "text_grid";
          layout_variant?: string;
          content?: Json;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          featured_project_id?: string;
          type?:
            | "text"
            | "media"
            | "split"
            | "grid"
            | "columns"
            | "title"
            | "intro"
            | "text_grid";
          layout_variant?: string;
          content?: Json;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "featured_project_sections_featured_project_id_fkey";
            columns: ["featured_project_id"];
            isOneToOne: false;
            referencedRelation: "featured_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      experience_entries: {
        Row: {
          id: string;
          title: string;
          org: string | null;
          date_label: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          org?: string | null;
          date_label?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          org?: string | null;
          date_label?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          media_type: "image" | "video";
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          media_type?: "image" | "video";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          media_type?: "image" | "video";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          patient_name: string;
          phone: string;
          /** Generated: last 8 digits of `phone`. Read-only, indexed. */
          phone_suffix: string;
          email: string | null;
          service_id: string | null;
          service_label: string;
          starts_at: string;
          notes: string;
          status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          patient_name: string;
          phone: string;
          email?: string | null;
          service_id?: string | null;
          service_label: string;
          starts_at: string;
          notes?: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          patient_name?: string;
          phone?: string;
          email?: string | null;
          service_id?: string | null;
          service_label?: string;
          starts_at?: string;
          notes?: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      patient_tooth_note_attachments: {
        Row: {
          id: string;
          note_id: string;
          file_url: string;
          file_name: string;
          mime_type: string;
          kind: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          file_url: string;
          file_name: string;
          mime_type?: string;
          kind?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          file_url?: string;
          file_name?: string;
          mime_type?: string;
          kind?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_tooth_note_attachments_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "patient_tooth_notes";
            referencedColumns: ["id"];
          },
        ];
      };
      clinic_hours: {
        Row: {
          id: string;
          open_weekdays: number[];
          time_windows: string[];
          slot_minutes: number;
          horizon_days: number;
          timezone: string;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          open_weekdays?: number[];
          time_windows?: string[];
          slot_minutes?: number;
          horizon_days?: number;
          timezone?: string;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          open_weekdays?: number[];
          time_windows?: string[];
          slot_minutes?: number;
          horizon_days?: number;
          timezone?: string;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      appointment_slots: {
        Row: {
          id: string;
          starts_at: string;
          ends_at: string;
          status: "open" | "booked" | "cancelled";
          reservation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          starts_at: string;
          ends_at: string;
          status?: "open" | "booked" | "cancelled";
          reservation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          starts_at?: string;
          ends_at?: string;
          status?: "open" | "booked" | "cancelled";
          reservation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_profiles: {
        Row: {
          id: string;
          patient_key: string;
          display_name: string;
          phone: string;
          email: string | null;
          date_of_birth: string | null;
          age_years: number | null;
          gender: "" | "female" | "male" | "other" | "prefer_not";
          medical_history: string[];
          allergies: string[];
          medications: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          display_name?: string;
          phone?: string;
          email?: string | null;
          date_of_birth?: string | null;
          age_years?: number | null;
          gender?: "" | "female" | "male" | "other" | "prefer_not";
          medical_history?: string[];
          allergies?: string[];
          medications?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          display_name?: string;
          phone?: string;
          email?: string | null;
          date_of_birth?: string | null;
          age_years?: number | null;
          gender?: "" | "female" | "male" | "other" | "prefer_not";
          medical_history?: string[];
          allergies?: string[];
          medications?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_tooth_notes: {
        Row: {
          id: string;
          patient_key: string;
          fdi_number: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          fdi_number: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          fdi_number?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_tooth_surfaces: {
        Row: {
          id: string;
          patient_key: string;
          fdi_number: string;
          dentition: "adult" | "primary";
          mesial: "unmarked" | "decay" | "filling";
          distal: "unmarked" | "decay" | "filling";
          occlusal: "unmarked" | "decay" | "filling";
          facial: "unmarked" | "decay" | "filling";
          lingual: "unmarked" | "decay" | "filling";
          whole: "none" | "crown" | "missing";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          fdi_number: string;
          dentition?: "adult" | "primary";
          mesial?: "unmarked" | "decay" | "filling";
          distal?: "unmarked" | "decay" | "filling";
          occlusal?: "unmarked" | "decay" | "filling";
          facial?: "unmarked" | "decay" | "filling";
          lingual?: "unmarked" | "decay" | "filling";
          whole?: "none" | "crown" | "missing";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          fdi_number?: string;
          dentition?: "adult" | "primary";
          mesial?: "unmarked" | "decay" | "filling";
          distal?: "unmarked" | "decay" | "filling";
          occlusal?: "unmarked" | "decay" | "filling";
          facial?: "unmarked" | "decay" | "filling";
          lingual?: "unmarked" | "decay" | "filling";
          whole?: "none" | "crown" | "missing";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_imaging: {
        Row: {
          id: string;
          patient_key: string;
          title: string;
          kind: "xray" | "cbct" | "photo";
          tooth_number: number | null;
          tooth_fdi: string | null;
          file_url: string;
          file_name: string;
          mime_type: string;
          taken_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          title: string;
          kind?: "xray" | "cbct" | "photo";
          tooth_number?: number | null;
          tooth_fdi?: string | null;
          file_url: string;
          file_name: string;
          mime_type?: string;
          taken_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          title?: string;
          kind?: "xray" | "cbct" | "photo";
          tooth_number?: number | null;
          tooth_fdi?: string | null;
          file_url?: string;
          file_name?: string;
          mime_type?: string;
          taken_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_treatments: {
        Row: {
          id: string;
          patient_key: string;
          tooth_name: string;
          tooth_fdi: string | null;
          severity: "Critical" | "Minor";
          last_treatment: string;
          cdt_code: string | null;
          phase: "urgent" | "restorative" | "prosthodontic";
          fee_amount: number;
          ai_title: string | null;
          ai_description: string | null;
          ai_confidence: number | null;
          ai_recommendation: string | null;
          status: "open" | "scheduled" | "done";
          reservation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          tooth_name: string;
          tooth_fdi?: string | null;
          severity?: "Critical" | "Minor";
          last_treatment?: string;
          cdt_code?: string | null;
          phase?: "urgent" | "restorative" | "prosthodontic";
          fee_amount?: number;
          ai_title?: string | null;
          ai_description?: string | null;
          ai_confidence?: number | null;
          ai_recommendation?: string | null;
          status?: "open" | "scheduled" | "done";
          reservation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          tooth_name?: string;
          tooth_fdi?: string | null;
          severity?: "Critical" | "Minor";
          last_treatment?: string;
          cdt_code?: string | null;
          phase?: "urgent" | "restorative" | "prosthodontic";
          fee_amount?: number;
          ai_title?: string | null;
          ai_description?: string | null;
          ai_confidence?: number | null;
          ai_recommendation?: string | null;
          status?: "open" | "scheduled" | "done";
          reservation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_treatments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ];
      };
      patient_treatment_attachments: {
        Row: {
          id: string;
          treatment_id: string;
          file_url: string;
          file_name: string;
          mime_type: string;
          kind: "file" | "image" | "xray";
          imaging_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          treatment_id: string;
          file_url: string;
          file_name: string;
          mime_type?: string;
          kind?: "file" | "image" | "xray";
          imaging_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          treatment_id?: string;
          file_url?: string;
          file_name?: string;
          mime_type?: string;
          kind?: "file" | "image" | "xray";
          imaging_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "patient_treatment_attachments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatment_attachments_imaging_id_fkey"
            columns: ["imaging_id"]
            isOneToOne: false
            referencedRelation: "patient_imaging"
            referencedColumns: ["id"]
          },
        ];
      };
      services: {
        Row: {
          id: string;
          title: string;
          title_ar: string;
          tags: string[];
          description: string;
          description_ar: string;
          kind: "our_services" | "laser";
          image_url: string | null;
          media_type: "image" | "video";
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          title_ar?: string;
          tags?: string[];
          description?: string;
          description_ar?: string;
          kind?: "our_services" | "laser";
          image_url?: string | null;
          media_type?: "image" | "video";
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          title_ar?: string;
          tags?: string[];
          description?: string;
          description_ar?: string;
          kind?: "our_services" | "laser";
          image_url?: string | null;
          media_type?: "image" | "video";
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      footer_links: {
        Row: {
          id: string;
          column_key: "portfolio" | "resources" | "follow";
          label: string;
          label_ar: string;
          href: string;
          display_mode: "text" | "icon";
          icon_key: string | null;
          icon_url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          column_key: "portfolio" | "resources" | "follow";
          label: string;
          label_ar?: string;
          href?: string;
          display_mode?: "text" | "icon";
          icon_key?: string | null;
          icon_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          column_key?: "portfolio" | "resources" | "follow";
          label?: string;
          label_ar?: string;
          href?: string;
          display_mode?: "text" | "icon";
          icon_key?: string | null;
          icon_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          id: string;
          platform: string;
          href: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          platform: string;
          href?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          platform?: string;
          href?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      about_trust_items: {
        Row: {
          id: string;
          value: string;
          label: string;
          sort_order: number;
          value_ar: string;
          label_ar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          label: string;
          sort_order?: number;
          value_ar?: string;
          label_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          label?: string;
          sort_order?: number;
          value_ar?: string;
          label_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      solution_panels: {
        Row: {
          id: string;
          variant: "dark" | "photo";
          title: string;
          body: string;
          image_url: string;
          link_href: string | null;
          sort_order: number;
          title_ar: string;
          body_ar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant?: "dark" | "photo";
          title: string;
          body?: string;
          image_url: string;
          link_href?: string | null;
          sort_order?: number;
          title_ar?: string;
          body_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          variant?: "dark" | "photo";
          title?: string;
          body?: string;
          image_url?: string;
          link_href?: string | null;
          sort_order?: number;
          title_ar?: string;
          body_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_items: {
        Row: {
          id: string;
          image_url: string;
          caption: string;
          category: string;
          sort_order: number;
          is_published: boolean;
          caption_ar: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: string;
          category?: string;
          sort_order?: number;
          is_published?: boolean;
          caption_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          caption?: string;
          category?: string;
          sort_order?: number;
          is_published?: boolean;
          caption_ar?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_showcase: {
        Row: {
          id: string;
          image_url: string;
          alt_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          alt_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          alt_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_comparisons: {
        Row: {
          id: string;
          before_image_url: string;
          after_image_url: string;
          alt_text: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          before_image_url?: string;
          after_image_url?: string;
          alt_text?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          before_image_url?: string;
          after_image_url?: string;
          alt_text?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_clinical_notes: {
        Row: {
          id: string;
          patient_key: string;
          category: "SOAP" | "Quick Note" | "Alert" | "Lab";
          content: string;
          target_kind: "visit" | "tooth" | "treatment";
          target_id: string;
          tooth_fdi: string | null;
          treatment_id: string | null;
          author: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          category: "SOAP" | "Quick Note" | "Alert" | "Lab";
          content: string;
          target_kind?: "visit" | "tooth" | "treatment";
          target_id?: string;
          tooth_fdi?: string | null;
          treatment_id?: string | null;
          author?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          category?: "SOAP" | "Quick Note" | "Alert" | "Lab";
          content?: string;
          target_kind?: "visit" | "tooth" | "treatment";
          target_id?: string;
          tooth_fdi?: string | null;
          treatment_id?: string | null;
          author?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_chart_findings: {
        Row: {
          id: string;
          patient_key: string;
          tooth_fdi: string;
          condition_type: string;
          severity: "LOW" | "MED" | "HIGH" | "CRITICAL";
          status: "ACTIVE" | "RESOLVED" | "MONITORING";
          vitality_index: number | null;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          tooth_fdi: string;
          condition_type: string;
          severity?: "LOW" | "MED" | "HIGH" | "CRITICAL";
          status?: "ACTIVE" | "RESOLVED" | "MONITORING";
          vitality_index?: number | null;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          tooth_fdi?: string;
          condition_type?: string;
          severity?: "LOW" | "MED" | "HIGH" | "CRITICAL";
          status?: "ACTIVE" | "RESOLVED" | "MONITORING";
          vitality_index?: number | null;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_prescriptions: {
        Row: {
          id: string;
          patient_key: string;
          medication: string;
          dose: string;
          frequency: "ONCE_DAILY" | "TWICE_DAILY" | "NIGHT_ONLY";
          duration_days: number;
          instructions: string;
          status: "ACTIVE" | "EXPIRED";
          tooth_fdi: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          medication: string;
          dose: string;
          frequency: "ONCE_DAILY" | "TWICE_DAILY" | "NIGHT_ONLY";
          duration_days?: number;
          instructions?: string;
          status?: "ACTIVE" | "EXPIRED";
          tooth_fdi?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          medication?: string;
          dose?: string;
          frequency?: "ONCE_DAILY" | "TWICE_DAILY" | "NIGHT_ONLY";
          duration_days?: number;
          instructions?: string;
          status?: "ACTIVE" | "EXPIRED";
          tooth_fdi?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      patient_lab_orders: {
        Row: {
          id: string;
          patient_key: string;
          appliance_type: string;
          status: "IMPRESSION" | "FABRICATION" | "SHIPPED" | "DELIVERED";
          tooth_fdi: string | null;
          notes: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_key: string;
          appliance_type: string;
          status?: "IMPRESSION" | "FABRICATION" | "SHIPPED" | "DELIVERED";
          tooth_fdi?: string | null;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_key?: string;
          appliance_type?: string;
          status?: "IMPRESSION" | "FABRICATION" | "SHIPPED" | "DELIVERED";
          tooth_fdi?: string | null;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_action_proposals: {
        Row: {
          id: string;
          created_by: string;
          status: "pending" | "confirmed" | "cancelled" | "expired" | "failed";
          source: "clinic-chat" | "treatment-chat";
          patient_key: string | null;
          summary: string;
          actions: Json;
          diffs: Json;
          snapshot_hash: string;
          expires_at: string;
          confirmed_at: string | null;
          result: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          status?: "pending" | "confirmed" | "cancelled" | "expired" | "failed";
          source?: "clinic-chat" | "treatment-chat";
          patient_key?: string | null;
          summary?: string;
          actions?: Json;
          diffs?: Json;
          snapshot_hash: string;
          expires_at: string;
          confirmed_at?: string | null;
          result?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_by?: string;
          status?: "pending" | "confirmed" | "cancelled" | "expired" | "failed";
          source?: "clinic-chat" | "treatment-chat";
          patient_key?: string | null;
          summary?: string;
          actions?: Json;
          diffs?: Json;
          snapshot_hash?: string;
          expires_at?: string;
          confirmed_at?: string | null;
          result?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_action_audit_events: {
        Row: {
          id: string;
          proposal_id: string | null;
          actor_id: string | null;
          action_kind: string;
          target: string;
          outcome: "proposed" | "confirmed" | "cancelled" | "failed" | "stale";
          before_summary: Json | null;
          after_summary: Json | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id?: string | null;
          actor_id?: string | null;
          action_kind: string;
          target?: string;
          outcome: "proposed" | "confirmed" | "cancelled" | "failed" | "stale";
          before_summary?: Json | null;
          after_summary?: Json | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: string | null;
          actor_id?: string | null;
          action_kind?: string;
          target?: string;
          outcome?: "proposed" | "confirmed" | "cancelled" | "failed" | "stale";
          before_summary?: Json | null;
          after_summary?: Json | null;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_action_audit_events_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "ai_action_proposals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      cancel_reservation_and_release_slot: {
        Args: {
          p_reservation_id: string;
          p_phone?: string | null;
        };
        Returns: string;
      };
      reschedule_reservation_to_slot: {
        Args: {
          p_reservation_id: string;
          p_slot_id: string;
          p_phone?: string | null;
        };
        Returns: string;
      };
      book_open_appointment_slot: {
        Args: {
          p_slot_id: string;
          p_patient_name: string;
          p_phone: string;
          p_email?: string | null;
          p_service_id?: string | null;
          p_service_label?: string;
          p_notes?: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
