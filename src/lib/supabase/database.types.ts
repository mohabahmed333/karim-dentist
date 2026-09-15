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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      about: {
        Row: {
          body: string
          body_ar: string
          copy_image_url: string | null
          copy_media_type: "image" | "video"
          created_at: string
          drop_cap: string
          drop_cap_logo_url: string | null
          id: string
          image_url: string | null
          media_type: "image" | "video"
          updated_at: string
        }
        Insert: {
          body?: string
          body_ar?: string
          copy_image_url?: string | null
          copy_media_type?: "image" | "video"
          created_at?: string
          drop_cap?: string
          drop_cap_logo_url?: string | null
          id?: string
          image_url?: string | null
          media_type?: "image" | "video"
          updated_at?: string
        }
        Update: {
          body?: string
          body_ar?: string
          copy_image_url?: string | null
          copy_media_type?: "image" | "video"
          created_at?: string
          drop_cap?: string
          drop_cap_logo_url?: string | null
          id?: string
          image_url?: string | null
          media_type?: "image" | "video"
          updated_at?: string
        }
        Relationships: []
      }
      about_trust_items: {
        Row: {
          created_at: string
          id: string
          label: string
          label_ar: string
          sort_order: number
          updated_at: string
          value: string
          value_ar: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          label_ar?: string
          sort_order?: number
          updated_at?: string
          value: string
          value_ar?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          label_ar?: string
          sort_order?: number
          updated_at?: string
          value?: string
          value_ar?: string
        }
        Relationships: []
      }
      ai_action_audit_events: {
        Row: {
          action_kind: string
          actor_id: string | null
          after_summary: Json | null
          before_summary: Json | null
          created_at: string
          error_message: string | null
          id: string
          outcome: "proposed" | "confirmed" | "cancelled" | "failed" | "stale"
          proposal_id: string | null
          target: string
        }
        Insert: {
          action_kind: string
          actor_id?: string | null
          after_summary?: Json | null
          before_summary?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          outcome: "proposed" | "confirmed" | "cancelled" | "failed" | "stale"
          proposal_id?: string | null
          target?: string
        }
        Update: {
          action_kind?: string
          actor_id?: string | null
          after_summary?: Json | null
          before_summary?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          outcome?: "proposed" | "confirmed" | "cancelled" | "failed" | "stale"
          proposal_id?: string | null
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_audit_events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "ai_action_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_action_proposals: {
        Row: {
          actions: Json
          confirmed_at: string | null
          created_at: string
          created_by: string
          diffs: Json
          expires_at: string
          id: string
          patient_key: string | null
          result: Json | null
          snapshot_hash: string
          source: "clinic-chat" | "treatment-chat"
          status: "pending" | "confirmed" | "cancelled" | "expired" | "failed"
          summary: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          diffs?: Json
          expires_at: string
          id?: string
          patient_key?: string | null
          result?: Json | null
          snapshot_hash: string
          source?: "clinic-chat" | "treatment-chat"
          status?: "pending" | "confirmed" | "cancelled" | "expired" | "failed"
          summary?: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          diffs?: Json
          expires_at?: string
          id?: string
          patient_key?: string | null
          result?: Json | null
          snapshot_hash?: string
          source?: "clinic-chat" | "treatment-chat"
          status?: "pending" | "confirmed" | "cancelled" | "expired" | "failed"
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_daily: {
        Row: {
          completion_tokens: number
          day: string
          last_rate_limited_at: string | null
          model: string
          prompt_tokens: number
          provider: string
          rate_limited_count: number
          requests: number
          updated_at: string
        }
        Insert: {
          completion_tokens?: number
          day?: string
          last_rate_limited_at?: string | null
          model: string
          prompt_tokens?: number
          provider: string
          rate_limited_count?: number
          requests?: number
          updated_at?: string
        }
        Update: {
          completion_tokens?: number
          day?: string
          last_rate_limited_at?: string | null
          model?: string
          prompt_tokens?: number
          provider?: string
          rate_limited_count?: number
          requests?: number
          updated_at?: string
        }
        Relationships: []
      }
      appointment_slots: {
        Row: {
          created_at: string
          doctor_id: string | null
          ends_at: string
          id: string
          reservation_id: string | null
          starts_at: string
          status: "open" | "booked" | "cancelled"
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          ends_at: string
          id?: string
          reservation_id?: string | null
          starts_at: string
          status?: "open" | "booked" | "cancelled"
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          ends_at?: string
          id?: string
          reservation_id?: string | null
          starts_at?: string
          status?: "open" | "booked" | "cancelled"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_slots_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_waitlist: {
        Row: {
          created_at: string
          id: string
          notes: string
          offered_at: string | null
          offered_slot_id: string | null
          patient_name: string
          phone: string
          phone_suffix: string | null
          preferred_from: string | null
          preferred_to: string | null
          service_id: string | null
          service_label: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          offered_at?: string | null
          offered_slot_id?: string | null
          patient_name: string
          phone: string
          phone_suffix?: string | null
          preferred_from?: string | null
          preferred_to?: string | null
          service_id?: string | null
          service_label?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          offered_at?: string | null
          offered_slot_id?: string | null
          patient_name?: string
          phone?: string
          phone_suffix?: string | null
          preferred_from?: string | null
          preferred_to?: string | null
          service_id?: string | null
          service_label?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_waitlist_offered_slot_id_fkey"
            columns: ["offered_slot_id"]
            isOneToOne: false
            referencedRelation: "appointment_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      callouts: {
        Row: {
          body: string
          body_ar: string
          created_at: string
          id: string
          lead_image_url: string | null
          updated_at: string
        }
        Insert: {
          body?: string
          body_ar?: string
          created_at?: string
          id?: string
          lead_image_url?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          body_ar?: string
          created_at?: string
          id?: string
          lead_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          agency: string | null
          category: string | null
          client: string | null
          created_at: string
          deleted_at: string | null
          description: string
          description_ar: string
          director: string | null
          id: string
          is_published: boolean
          media_type: "image" | "video"
          media_url: string | null
          production_company: string | null
          slug: string | null
          sort_order: number
          tags: string[]
          title: string
          title_ar: string
          updated_at: string
          year: string | null
        }
        Insert: {
          agency?: string | null
          category?: string | null
          client?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          description_ar?: string
          director?: string | null
          id?: string
          is_published?: boolean
          media_type?: "image" | "video"
          media_url?: string | null
          production_company?: string | null
          slug?: string | null
          sort_order?: number
          tags?: string[]
          title: string
          title_ar?: string
          updated_at?: string
          year?: string | null
        }
        Update: {
          agency?: string | null
          category?: string | null
          client?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          description_ar?: string
          director?: string | null
          id?: string
          is_published?: boolean
          media_type?: "image" | "video"
          media_url?: string | null
          production_company?: string | null
          slug?: string | null
          sort_order?: number
          tags?: string[]
          title?: string
          title_ar?: string
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      case_study_sections: {
        Row: {
          case_study_id: string
          content: Json
          created_at: string
          deleted_at: string | null
          id: string
          is_visible: boolean
          layout_variant: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          case_study_id: string
          content?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_visible?: boolean
          layout_variant?: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          case_study_id?: string
          content?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_visible?: boolean
          layout_variant?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_study_sections_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          media_type: "image" | "video"
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          media_type?: "image" | "video"
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          media_type?: "image" | "video"
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      clinic_cdt_fees: {
        Row: {
          code: string
          fee_egp: number
          updated_at: string
        }
        Insert: {
          code: string
          fee_egp?: number
          updated_at?: string
        }
        Update: {
          code?: string
          fee_egp?: number
          updated_at?: string
        }
        Relationships: []
      }
      clinic_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          meta: Json
          role: "user" | "assistant" | "system"
          thread_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          meta?: Json
          role: "user" | "assistant" | "system"
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meta?: Json
          role?: "user" | "assistant" | "system"
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "clinic_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_chat_threads: {
        Row: {
          context: Json
          created_at: string
          created_by: string | null
          id: string
          kind: "home" | "session"
          title: string
          updated_at: string
        }
        Insert: {
          context?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: "home" | "session"
          title?: string
          updated_at?: string
        }
        Update: {
          context?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: "home" | "session"
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_hours: {
        Row: {
          created_at: string
          horizon_days: number
          id: string
          open_weekdays: number[]
          slot_minutes: number
          time_windows: string[]
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          horizon_days?: number
          id?: string
          open_weekdays?: number[]
          slot_minutes?: number
          time_windows?: string[]
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          horizon_days?: number
          id?: string
          open_weekdays?: number[]
          slot_minutes?: number
          time_windows?: string[]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_knowledge: {
        Row: {
          body: string
          body_ar: string
          created_at: string
          deleted_at: string | null
          id: string
          is_published: boolean
          search_vector: unknown
          sort_order: number
          tags: string[]
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          body?: string
          body_ar?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          search_vector?: unknown
          sort_order?: number
          tags?: string[]
          title: string
          title_ar?: string
          updated_at?: string
        }
        Update: {
          body?: string
          body_ar?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          search_vector?: unknown
          sort_order?: number
          tags?: string[]
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_treatment_presets: {
        Row: {
          code: string
          label: string
          slot: number
          updated_at: string
        }
        Insert: {
          code: string
          label: string
          slot: number
          updated_at?: string
        }
        Update: {
          code?: string
          label?: string
          slot?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_treatment_presets_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "clinic_cdt_fees"
            referencedColumns: ["code"]
          },
        ]
      }
      billing_payment_receipts: {
        Row: {
          amount_egp: number | null
          billing_payment_request_id: string
          confidence: number | null
          created_at: string
          extracted: Json
          id: string
          image_sha256: string
          image_url: string
          latency_ms: number | null
          message_id: string
          model: string
          prompt_version: string
          recipient_handle: string | null
          recipient_name: string | null
          reference: string | null
          sender_name: string | null
          transferred_at: string | null
          verdict: string
          verdict_reason: string
        }
        Insert: {
          amount_egp?: number | null
          billing_payment_request_id: string
          confidence?: number | null
          created_at?: string
          extracted?: Json
          id?: string
          image_sha256?: string
          image_url?: string
          latency_ms?: number | null
          message_id: string
          model?: string
          prompt_version?: string
          recipient_handle?: string | null
          recipient_name?: string | null
          reference?: string | null
          sender_name?: string | null
          transferred_at?: string | null
          verdict: string
          verdict_reason?: string
        }
        Update: {
          amount_egp?: number | null
          billing_payment_request_id?: string
          confidence?: number | null
          created_at?: string
          extracted?: Json
          id?: string
          image_sha256?: string
          image_url?: string
          latency_ms?: number | null
          message_id?: string
          model?: string
          prompt_version?: string
          recipient_handle?: string | null
          recipient_name?: string | null
          reference?: string | null
          sender_name?: string | null
          transferred_at?: string | null
          verdict?: string
          verdict_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payment_receipts_billing_payment_request_id_fkey"
            columns: ["billing_payment_request_id"]
            isOneToOne: false
            referencedRelation: "billing_payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payment_requests: {
        Row: {
          amount_egp: number
          conversation_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string
          description: string
          id: string
          patient_key: string
          patient_name: string
          phone: string
          proposal_id: string
          reservation_id: string | null
          settings_snapshot: Json
          status: string
          updated_at: string
        }
        Insert: {
          amount_egp: number
          conversation_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string
          description?: string
          id?: string
          patient_key: string
          patient_name?: string
          phone: string
          proposal_id: string
          reservation_id?: string | null
          settings_snapshot?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          amount_egp?: number
          conversation_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string
          description?: string
          id?: string
          patient_key?: string
          patient_name?: string
          phone?: string
          proposal_id?: string
          reservation_id?: string | null
          settings_snapshot?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payment_requests_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "treatment_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_receipts: {
        Row: {
          amount_egp: number | null
          confidence: number | null
          created_at: string
          deposit_request_id: string
          extracted: Json
          id: string
          image_sha256: string
          image_url: string
          latency_ms: number | null
          message_id: string
          model: string
          prompt_version: string
          recipient_handle: string | null
          recipient_name: string | null
          reference: string | null
          sender_name: string | null
          transferred_at: string | null
          /** Immutable after insert: a partial unique index depends on it. */
          verdict: string
          verdict_reason: string
        }
        Insert: {
          amount_egp?: number | null
          confidence?: number | null
          created_at?: string
          deposit_request_id: string
          extracted?: Json
          id?: string
          image_sha256?: string
          image_url?: string
          latency_ms?: number | null
          message_id: string
          model?: string
          prompt_version?: string
          recipient_handle?: string | null
          recipient_name?: string | null
          reference?: string | null
          sender_name?: string | null
          transferred_at?: string | null
          verdict: string
          verdict_reason?: string
        }
        Update: {
          amount_egp?: number | null
          confidence?: number | null
          created_at?: string
          deposit_request_id?: string
          extracted?: Json
          id?: string
          image_sha256?: string
          image_url?: string
          latency_ms?: number | null
          message_id?: string
          model?: string
          prompt_version?: string
          recipient_handle?: string | null
          recipient_name?: string | null
          reference?: string | null
          sender_name?: string | null
          transferred_at?: string | null
          verdict?: string
          verdict_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_receipts_deposit_request_id_fkey"
            columns: ["deposit_request_id"]
            isOneToOne: false
            referencedRelation: "deposit_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_requests: {
        Row: {
          amount_egp: number
          conversation_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_reason: string
          /** Absolute, set once when the hold is taken. */
          expires_at: string
          id: string
          phone: string
          reservation_id: string
          /** What the patient was actually told to pay, and where. */
          settings_snapshot: Json
          slot_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_egp: number
          conversation_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string
          expires_at: string
          id?: string
          phone: string
          reservation_id: string
          settings_snapshot?: Json
          slot_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_egp?: number
          conversation_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string
          expires_at?: string
          id?: string
          phone?: string
          reservation_id?: string
          settings_snapshot?: Json
          slot_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_requests_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_requests_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "appointment_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_settings: {
        Row: {
          amount_egp: number
          amount_tolerance_egp: number
          auto_confirm: boolean
          currency: string
          enabled: boolean
          hold_minutes: number
          id: string
          instapay_handle: string
          min_confidence: number
          ocr_cross_check: boolean
          receipt_max_age_hours: number
          /** How the clinic's own name prints on a receipt. */
          recipient_names: string[]
          updated_at: string
          wallet_number: string
        }
        Insert: {
          amount_egp?: number
          amount_tolerance_egp?: number
          auto_confirm?: boolean
          currency?: string
          enabled?: boolean
          hold_minutes?: number
          id?: string
          instapay_handle?: string
          min_confidence?: number
          ocr_cross_check?: boolean
          receipt_max_age_hours?: number
          recipient_names?: string[]
          updated_at?: string
          wallet_number?: string
        }
        Update: {
          amount_egp?: number
          amount_tolerance_egp?: number
          auto_confirm?: boolean
          currency?: string
          enabled?: boolean
          hold_minutes?: number
          id?: string
          instapay_handle?: string
          min_confidence?: number
          ocr_cross_check?: boolean
          receipt_max_age_hours?: number
          recipient_names?: string[]
          updated_at?: string
          wallet_number?: string
        }
        Relationships: []
      }
      doctor_hours: {
        Row: {
          created_at: string
          doctor_id: string
          is_bookable: boolean
          open_weekdays: number[]
          slot_minutes: number
          time_windows: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          is_bookable?: boolean
          open_weekdays?: number[]
          slot_minutes?: number
          time_windows?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          is_bookable?: boolean
          open_weekdays?: number[]
          slot_minutes?: number
          time_windows?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_hours_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_entries: {
        Row: {
          created_at: string
          date_label: string | null
          deleted_at: string | null
          description: string | null
          id: string
          org: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_label?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          org?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_label?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          org?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          answer_ar: string
          created_at: string
          deleted_at: string | null
          id: string
          is_published: boolean
          question: string
          question_ar: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer?: string
          answer_ar?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          question: string
          question_ar?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          answer_ar?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          question?: string
          question_ar?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      featured_project_sections: {
        Row: {
          content: Json
          created_at: string
          deleted_at: string | null
          featured_project_id: string
          id: string
          is_visible: boolean
          layout_variant: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          deleted_at?: string | null
          featured_project_id: string
          id?: string
          is_visible?: boolean
          layout_variant?: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          deleted_at?: string | null
          featured_project_id?: string
          id?: string
          is_visible?: boolean
          layout_variant?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_project_sections_featured_project_id_fkey"
            columns: ["featured_project_id"]
            isOneToOne: false
            referencedRelation: "featured_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_projects: {
        Row: {
          created_at: string
          deleted_at: string | null
          eyebrow: string
          eyebrow_ar: string
          id: string
          image_url: string | null
          is_published: boolean
          media_type: "image" | "video"
          meta_left: string | null
          meta_right: string | null
          slug: string | null
          sort_order: number
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          eyebrow?: string
          eyebrow_ar?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          media_type?: "image" | "video"
          meta_left?: string | null
          meta_right?: string | null
          slug?: string | null
          sort_order?: number
          title: string
          title_ar?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          eyebrow?: string
          eyebrow_ar?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          media_type?: "image" | "video"
          meta_left?: string | null
          meta_right?: string | null
          slug?: string | null
          sort_order?: number
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_links: {
        Row: {
          column_key: "portfolio" | "resources" | "follow"
          created_at: string
          deleted_at: string | null
          display_mode: "text" | "icon"
          href: string
          icon_key: string | null
          icon_url: string | null
          id: string
          label: string
          label_ar: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          column_key: "portfolio" | "resources" | "follow"
          created_at?: string
          deleted_at?: string | null
          display_mode?: "text" | "icon"
          href?: string
          icon_key?: string | null
          icon_url?: string | null
          id?: string
          label: string
          label_ar?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          column_key?: "portfolio" | "resources" | "follow"
          created_at?: string
          deleted_at?: string | null
          display_mode?: "text" | "icon"
          href?: string
          icon_key?: string | null
          icon_url?: string | null
          id?: string
          label?: string
          label_ar?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery_comparisons: {
        Row: {
          after_image_url: string
          alt_text: string
          before_image_url: string
          created_at: string
          id: string
          is_published: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          after_image_url?: string
          alt_text?: string
          before_image_url?: string
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          after_image_url?: string
          alt_text?: string
          before_image_url?: string
          created_at?: string
          id?: string
          is_published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          caption: string
          caption_ar: string
          category: string
          created_at: string
          id: string
          image_url: string
          is_published: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          caption?: string
          caption_ar?: string
          category?: string
          created_at?: string
          id?: string
          image_url: string
          is_published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          caption?: string
          caption_ar?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          is_published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery_showcase: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero: {
        Row: {
          accent: string
          accent_ar: string
          body: string
          body_ar: string
          created_at: string
          cta_primary_href: string
          cta_primary_label: string
          cta_primary_label_ar: string
          cta_secondary_href: string
          cta_secondary_label: string
          cta_secondary_label_ar: string
          headline: string
          headline_ar: string
          headline_image_url: string | null
          id: string
          kicker: string
          kicker_ar: string
          layout: string
          media_type: "image" | "video"
          media_url: string | null
          media_url_desktop: string | null
          media_url_mobile: string | null
          updated_at: string
        }
        Insert: {
          accent?: string
          accent_ar?: string
          body?: string
          body_ar?: string
          created_at?: string
          cta_primary_href?: string
          cta_primary_label?: string
          cta_primary_label_ar?: string
          cta_secondary_href?: string
          cta_secondary_label?: string
          cta_secondary_label_ar?: string
          headline?: string
          headline_ar?: string
          headline_image_url?: string | null
          id?: string
          kicker?: string
          kicker_ar?: string
          layout?: string
          media_type?: "image" | "video"
          media_url?: string | null
          media_url_desktop?: string | null
          media_url_mobile?: string | null
          updated_at?: string
        }
        Update: {
          accent?: string
          accent_ar?: string
          body?: string
          body_ar?: string
          created_at?: string
          cta_primary_href?: string
          cta_primary_label?: string
          cta_primary_label_ar?: string
          cta_secondary_href?: string
          cta_secondary_label?: string
          cta_secondary_label_ar?: string
          headline?: string
          headline_ar?: string
          headline_image_url?: string | null
          id?: string
          kicker?: string
          kicker_ar?: string
          layout?: string
          media_type?: "image" | "video"
          media_url?: string | null
          media_url_desktop?: string | null
          media_url_mobile?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_alerts: {
        Row: {
          attempts: number
          created_at: string
          dedupe_key: string
          id: string
          item_id: string
          last_error: string | null
          lease_until: string | null
          min_stock_level: number
          payload: Json
          qty_on_hand: number
          scheduled_for: string
          send_started_at: string | null
          sent_at: string | null
          skip_reason: string | null
          status: string
          suggested_reorder_qty: number
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dedupe_key: string
          id?: string
          item_id: string
          last_error?: string | null
          lease_until?: string | null
          min_stock_level: number
          payload?: Json
          qty_on_hand: number
          scheduled_for?: string
          send_started_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string
          suggested_reorder_qty: number
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dedupe_key?: string
          id?: string
          item_id?: string
          last_error?: string | null
          lease_until?: string | null
          min_stock_level?: number
          payload?: Json
          qty_on_hand?: number
          scheduled_for?: string
          send_started_at?: string | null
          sent_at?: string | null
          skip_reason?: string | null
          status?: string
          suggested_reorder_qty?: number
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          created_at: string
          expires_on: string | null
          id: string
          item_id: string
          lot_number: string | null
          qty_received: number
          qty_remaining: number
          received_at: string
          supplier_id: string | null
          unit_cost_egp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_on?: string | null
          id?: string
          item_id: string
          lot_number?: string | null
          qty_received: number
          qty_remaining: number
          received_at?: string
          supplier_id?: string | null
          unit_cost_egp?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_on?: string | null
          id?: string
          item_id?: string
          lot_number?: string | null
          qty_received?: number
          qty_remaining?: number
          received_at?: string
          supplier_id?: string | null
          unit_cost_egp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          default_supplier_id: string | null
          deleted_at: string | null
          id: string
          last_unit_cost_egp: number | null
          min_stock_level: number
          name: string
          name_ar: string
          reorder_qty: number
          sku: string | null
          tracks_batches: boolean
          unit: string
          updated_at: string
          wastage_approval_threshold_egp: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          default_supplier_id?: string | null
          deleted_at?: string | null
          id?: string
          last_unit_cost_egp?: number | null
          min_stock_level?: number
          name: string
          name_ar?: string
          reorder_qty?: number
          sku?: string | null
          tracks_batches?: boolean
          unit?: string
          updated_at?: string
          wastage_approval_threshold_egp?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          default_supplier_id?: string | null
          deleted_at?: string | null
          id?: string
          last_unit_cost_egp?: number | null
          min_stock_level?: number
          name?: string
          name_ar?: string
          reorder_qty?: number
          sku?: string | null
          tracks_batches?: boolean
          unit?: string
          updated_at?: string
          wastage_approval_threshold_egp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_default_supplier_id_fkey"
            columns: ["default_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_settings: {
        Row: {
          id: string
          manager_whatsapp_phone: string | null
          mode: string
          realert_after_days: number
          updated_at: string
          wastage_approval_threshold_egp: number
          wastage_photo_threshold_egp: number
        }
        Insert: {
          id?: string
          manager_whatsapp_phone?: string | null
          mode?: string
          realert_after_days?: number
          updated_at?: string
          wastage_approval_threshold_egp?: number
          wastage_photo_threshold_egp?: number
        }
        Update: {
          id?: string
          manager_whatsapp_phone?: string | null
          mode?: string
          realert_after_days?: number
          updated_at?: string
          wastage_approval_threshold_egp?: number
          wastage_photo_threshold_egp?: number
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          batch_id: string | null
          created_at: string
          created_by: string
          deduction_group_id: string
          id: string
          item_id: string
          patient_treatment_id: string | null
          photo_url: string | null
          qty: number
          reason_code: string | null
          reason_note: string
          reservation_id: string | null
          total_cost_egp: number
          type: string
          unit_cost_egp: number
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          created_at?: string
          created_by: string
          deduction_group_id?: string
          id?: string
          item_id: string
          patient_treatment_id?: string | null
          photo_url?: string | null
          qty: number
          reason_code?: string | null
          reason_note?: string
          reservation_id?: string | null
          total_cost_egp?: number
          type: string
          unit_cost_egp?: number
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          batch_id?: string | null
          created_at?: string
          created_by?: string
          deduction_group_id?: string
          id?: string
          item_id?: string
          patient_treatment_id?: string | null
          photo_url?: string | null
          qty?: number
          reason_code?: string | null
          reason_note?: string
          reservation_id?: string | null
          total_cost_egp?: number
          type?: string
          unit_cost_egp?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_recipes: {
        Row: {
          created_at: string
          default_qty: number
          is_required: boolean
          item_id: string
          kind: string
          notes: string
          service_id: string
        }
        Insert: {
          created_at?: string
          default_qty: number
          is_required?: boolean
          item_id: string
          kind?: string
          notes?: string
          service_id: string
        }
        Update: {
          created_at?: string
          default_qty?: number
          is_required?: boolean
          item_id?: string
          kind?: string
          notes?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_recipes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_recipes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_name: string
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string
          phone: string
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          contact_name?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string
          phone?: string
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string
          phone?: string
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      notification_feature_switches: {
        Row: {
          enabled: boolean
          feature_key: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          feature_key: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          feature_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_chart_findings: {
        Row: {
          condition_type: string
          created_at: string
          id: string
          note: string
          patient_key: string
          severity: "LOW" | "MED" | "HIGH" | "CRITICAL"
          status: "ACTIVE" | "RESOLVED" | "MONITORING"
          tooth_fdi: string
          updated_at: string
          vitality_index: number | null
        }
        Insert: {
          condition_type: string
          created_at?: string
          id?: string
          note?: string
          patient_key: string
          severity?: "LOW" | "MED" | "HIGH" | "CRITICAL"
          status?: "ACTIVE" | "RESOLVED" | "MONITORING"
          tooth_fdi: string
          updated_at?: string
          vitality_index?: number | null
        }
        Update: {
          condition_type?: string
          created_at?: string
          id?: string
          note?: string
          patient_key?: string
          severity?: "LOW" | "MED" | "HIGH" | "CRITICAL"
          status?: "ACTIVE" | "RESOLVED" | "MONITORING"
          tooth_fdi?: string
          updated_at?: string
          vitality_index?: number | null
        }
        Relationships: []
      }
      patient_billing_entries: {
        Row: {
          amount_egp: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          kind: "charge" | "payment"
          method: string | null
          patient_key: string
          reservation_id: string | null
        }
        Insert: {
          amount_egp: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          kind: "charge" | "payment"
          method?: string | null
          patient_key: string
          reservation_id?: string | null
        }
        Update: {
          amount_egp?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          kind?: "charge" | "payment"
          method?: string | null
          patient_key?: string
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_billing_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_billing_entries_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_clinical_notes: {
        Row: {
          author: string
          category: "SOAP" | "Quick Note" | "Alert" | "Lab"
          content: string
          created_at: string
          created_by: string | null
          id: string
          patient_key: string
          target_id: string
          target_kind: "visit" | "tooth" | "treatment"
          tooth_fdi: string | null
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          author?: string
          category: "SOAP" | "Quick Note" | "Alert" | "Lab"
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_key: string
          target_id?: string
          target_kind?: "visit" | "tooth" | "treatment"
          tooth_fdi?: string | null
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          author?: string
          category?: "SOAP" | "Quick Note" | "Alert" | "Lab"
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_key?: string
          target_id?: string
          target_kind?: "visit" | "tooth" | "treatment"
          tooth_fdi?: string | null
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_clinical_notes_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_imaging: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          kind: "xray" | "cbct" | "photo"
          mime_type: string
          patient_key: string
          taken_at: string | null
          title: string
          tooth_fdi: string | null
          tooth_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          kind?: "xray" | "cbct" | "photo"
          mime_type?: string
          patient_key: string
          taken_at?: string | null
          title: string
          tooth_fdi?: string | null
          tooth_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          kind?: "xray" | "cbct" | "photo"
          mime_type?: string
          patient_key?: string
          taken_at?: string | null
          title?: string
          tooth_fdi?: string | null
          tooth_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_lab_orders: {
        Row: {
          appliance_type: string
          created_at: string
          created_by: string | null
          id: string
          notes: string
          patient_key: string
          status: "IMPRESSION" | "FABRICATION" | "SHIPPED" | "DELIVERED"
          tooth_fdi: string | null
          updated_at: string
        }
        Insert: {
          appliance_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          patient_key: string
          status?: "IMPRESSION" | "FABRICATION" | "SHIPPED" | "DELIVERED"
          tooth_fdi?: string | null
          updated_at?: string
        }
        Update: {
          appliance_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          patient_key?: string
          status?: "IMPRESSION" | "FABRICATION" | "SHIPPED" | "DELIVERED"
          tooth_fdi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_marketing_consent: {
        Row: {
          consented_at: string
          created_at: string
          evidence: string
          phone: string
          phone_suffix: string
          source: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          consented_at?: string
          created_at?: string
          evidence?: string
          phone: string
          phone_suffix: string
          source?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          consented_at?: string
          created_at?: string
          evidence?: string
          phone?: string
          phone_suffix?: string
          source?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      patient_notification_optouts: {
        Row: {
          created_at: string
          phone: string
          phone_suffix: string
          reason: string
        }
        Insert: {
          created_at?: string
          phone?: string
          phone_suffix: string
          reason?: string
        }
        Update: {
          created_at?: string
          phone?: string
          phone_suffix?: string
          reason?: string
        }
        Relationships: []
      }
      patient_notification_settings: {
        Row: {
          id: string
          max_per_patient_per_day: number
          mode: string
          quiet_hours_end: number
          quiet_hours_start: number
          recall_enabled: boolean
          reminder_lead_minutes: number
          review_url: string
          timezone: string
          updated_at: string
        }
        Insert: {
          id?: string
          max_per_patient_per_day?: number
          mode?: string
          quiet_hours_end?: number
          quiet_hours_start?: number
          recall_enabled?: boolean
          reminder_lead_minutes?: number
          review_url?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          id?: string
          max_per_patient_per_day?: number
          mode?: string
          quiet_hours_end?: number
          quiet_hours_start?: number
          recall_enabled?: boolean
          reminder_lead_minutes?: number
          review_url?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_notifications: {
        Row: {
          attempts: number
          conversation_id: string | null
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          language: string | null
          last_error: string | null
          lease_until: string | null
          outbound_message_id: string | null
          patient_name: string
          payload: Json
          phone: string
          phone_suffix: string | null
          reservation_id: string | null
          scheduled_for: string
          send_started_at: string | null
          sent_at: string | null
          service_label: string
          skip_reason: string | null
          slot_id: string | null
          source: string
          starts_at: string | null
          status: string
          template_name: string | null
          updated_at: string
          waitlist_id: string | null
        }
        Insert: {
          attempts?: number
          conversation_id?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          language?: string | null
          last_error?: string | null
          lease_until?: string | null
          outbound_message_id?: string | null
          patient_name?: string
          payload?: Json
          phone: string
          phone_suffix?: string | null
          reservation_id?: string | null
          scheduled_for?: string
          send_started_at?: string | null
          sent_at?: string | null
          service_label?: string
          skip_reason?: string | null
          slot_id?: string | null
          source?: string
          starts_at?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
          waitlist_id?: string | null
        }
        Update: {
          attempts?: number
          conversation_id?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          language?: string | null
          last_error?: string | null
          lease_until?: string | null
          outbound_message_id?: string | null
          patient_name?: string
          payload?: Json
          phone?: string
          phone_suffix?: string | null
          reservation_id?: string | null
          scheduled_for?: string
          send_started_at?: string | null
          sent_at?: string | null
          service_label?: string
          skip_reason?: string | null
          slot_id?: string | null
          source?: string
          starts_at?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
          waitlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notifications_outbound_message_id_fkey"
            columns: ["outbound_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notifications_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "appointment_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notifications_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "appointment_waitlist"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_prescriptions: {
        Row: {
          created_at: string
          created_by: string | null
          dose: string
          duration_days: number
          frequency: "ONCE_DAILY" | "TWICE_DAILY" | "NIGHT_ONLY"
          id: string
          instructions: string
          medication: string
          patient_key: string
          status: "ACTIVE" | "EXPIRED"
          tooth_fdi: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dose: string
          duration_days?: number
          frequency: "ONCE_DAILY" | "TWICE_DAILY" | "NIGHT_ONLY"
          id?: string
          instructions?: string
          medication: string
          patient_key: string
          status?: "ACTIVE" | "EXPIRED"
          tooth_fdi?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dose?: string
          duration_days?: number
          frequency?: "ONCE_DAILY" | "TWICE_DAILY" | "NIGHT_ONLY"
          id?: string
          instructions?: string
          medication?: string
          patient_key?: string
          status?: "ACTIVE" | "EXPIRED"
          tooth_fdi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age_years: number | null
          allergies: string[]
          created_at: string
          date_of_birth: string | null
          display_name: string
          email: string | null
          gender: "" | "female" | "male" | "other" | "prefer_not"
          id: string
          medical_history: string[]
          medications: string
          notes: string
          patient_key: string
          phone: string
          updated_at: string
        }
        Insert: {
          age_years?: number | null
          allergies?: string[]
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string | null
          gender?: "" | "female" | "male" | "other" | "prefer_not"
          id?: string
          medical_history?: string[]
          medications?: string
          notes?: string
          patient_key: string
          phone?: string
          updated_at?: string
        }
        Update: {
          age_years?: number | null
          allergies?: string[]
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string | null
          gender?: "" | "female" | "male" | "other" | "prefer_not"
          id?: string
          medical_history?: string[]
          medications?: string
          notes?: string
          patient_key?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_tooth_note_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          kind: string
          mime_type: string
          note_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          kind?: string
          mime_type?: string
          note_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          kind?: string
          mime_type?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tooth_note_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "patient_tooth_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_tooth_notes: {
        Row: {
          body: string
          created_at: string
          fdi_number: string
          id: string
          patient_key: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          fdi_number: string
          id?: string
          patient_key: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          fdi_number?: string
          id?: string
          patient_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_tooth_surfaces: {
        Row: {
          created_at: string
          dentition: "adult" | "primary"
          distal: "unmarked" | "decay" | "filling"
          facial: "unmarked" | "decay" | "filling"
          fdi_number: string
          id: string
          lingual: "unmarked" | "decay" | "filling"
          mesial: "unmarked" | "decay" | "filling"
          occlusal: "unmarked" | "decay" | "filling"
          patient_key: string
          updated_at: string
          whole: "none" | "crown" | "missing"
        }
        Insert: {
          created_at?: string
          dentition?: "adult" | "primary"
          distal?: "unmarked" | "decay" | "filling"
          facial?: "unmarked" | "decay" | "filling"
          fdi_number: string
          id?: string
          lingual?: "unmarked" | "decay" | "filling"
          mesial?: "unmarked" | "decay" | "filling"
          occlusal?: "unmarked" | "decay" | "filling"
          patient_key: string
          updated_at?: string
          whole?: "none" | "crown" | "missing"
        }
        Update: {
          created_at?: string
          dentition?: "adult" | "primary"
          distal?: "unmarked" | "decay" | "filling"
          facial?: "unmarked" | "decay" | "filling"
          fdi_number?: string
          id?: string
          lingual?: "unmarked" | "decay" | "filling"
          mesial?: "unmarked" | "decay" | "filling"
          occlusal?: "unmarked" | "decay" | "filling"
          patient_key?: string
          updated_at?: string
          whole?: "none" | "crown" | "missing"
        }
        Relationships: []
      }
      patient_treatment_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          imaging_id: string | null
          kind: "file" | "image" | "xray"
          mime_type: string
          treatment_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          imaging_id?: string | null
          kind?: "file" | "image" | "xray"
          mime_type?: string
          treatment_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          imaging_id?: string | null
          kind?: "file" | "image" | "xray"
          mime_type?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatment_attachments_imaging_id_fkey"
            columns: ["imaging_id"]
            isOneToOne: false
            referencedRelation: "patient_imaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatment_attachments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments: {
        Row: {
          ai_confidence: number | null
          ai_description: string | null
          ai_recommendation: string | null
          ai_title: string | null
          cdt_code: string | null
          created_at: string
          doctor_id: string | null
          fee_amount: number
          id: string
          last_treatment: string
          patient_key: string
          phase: "urgent" | "restorative" | "prosthodontic"
          reservation_id: string | null
          service_id: string | null
          severity: "Critical" | "Minor"
          status: "open" | "scheduled" | "done"
          tooth_fdi: string | null
          tooth_name: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_description?: string | null
          ai_recommendation?: string | null
          ai_title?: string | null
          cdt_code?: string | null
          created_at?: string
          doctor_id?: string | null
          fee_amount?: number
          id?: string
          last_treatment?: string
          patient_key: string
          phase?: "urgent" | "restorative" | "prosthodontic"
          reservation_id?: string | null
          service_id?: string | null
          severity?: "Critical" | "Minor"
          status?: "open" | "scheduled" | "done"
          tooth_fdi?: string | null
          tooth_name: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_description?: string | null
          ai_recommendation?: string | null
          ai_title?: string | null
          cdt_code?: string | null
          created_at?: string
          doctor_id?: string | null
          fee_amount?: number
          id?: string
          last_treatment?: string
          patient_key?: string
          phase?: "urgent" | "restorative" | "prosthodontic"
          reservation_id?: string | null
          service_id?: string | null
          severity?: "Critical" | "Minor"
          status?: "open" | "scheduled" | "done"
          tooth_fdi?: string | null
          tooth_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          calendar_color: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          role: "admin" | "viewer"
          role_id: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          calendar_color?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          role?: "admin" | "viewer"
          role_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          calendar_color?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          role?: "admin" | "viewer"
          role_id?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_request_log: {
        Row: {
          bucket: string
          created_at: string
          id: number
          identifier: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: never
          identifier: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: never
          identifier?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          deleted_at: string | null
          deposit_hold: boolean
          doctor_id: string | null
          email: string | null
          id: string
          notes: string
          patient_id: string | null
          patient_name: string
          phone: string
          phone_suffix: string | null
          service_id: string | null
          service_label: string
          starts_at: string
          status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deposit_hold?: boolean
          doctor_id?: string | null
          email?: string | null
          id?: string
          notes?: string
          patient_id?: string | null
          patient_name: string
          phone: string
          phone_suffix?: string | null
          service_id?: string | null
          service_label: string
          starts_at: string
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deposit_hold?: boolean
          doctor_id?: string | null
          email?: string | null
          id?: string
          notes?: string
          patient_id?: string | null
          patient_name?: string
          phone?: string
          phone_suffix?: string | null
          service_id?: string | null
          service_label?: string
          starts_at?: string
          status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          dashboard_scope: "clinic" | "own"
          deleted_at: string | null
          description: string | null
          id: string
          is_admin_role: boolean
          is_doctor: boolean
          is_system: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dashboard_scope?: "clinic" | "own"
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_admin_role?: boolean
          is_doctor?: boolean
          is_system?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dashboard_scope?: "clinic" | "own"
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_admin_role?: boolean
          is_doctor?: boolean
          is_system?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_doctors: {
        Row: {
          created_at: string
          doctor_id: string
          price_egp: number | null
          price_label: string | null
          service_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          price_egp?: number | null
          price_label?: string | null
          service_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          price_egp?: number | null
          price_label?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_doctors_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          description_ar: string
          id: string
          image_url: string | null
          is_published: boolean
          kind: "our_services" | "laser"
          media_type: "image" | "video"
          price_label: string | null
          price_max_egp: number | null
          price_min_egp: number | null
          slug: string | null
          sort_order: number
          tags: string[]
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          description_ar?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          kind?: "our_services" | "laser"
          media_type?: "image" | "video"
          price_label?: string | null
          price_max_egp?: number | null
          price_min_egp?: number | null
          slug?: string | null
          sort_order?: number
          tags?: string[]
          title: string
          title_ar?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          description_ar?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          kind?: "our_services" | "laser"
          media_type?: "image" | "video"
          price_label?: string | null
          price_max_egp?: number | null
          price_min_egp?: number | null
          slug?: string | null
          sort_order?: number
          tags?: string[]
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          about_title: string
          about_title_ar: string
          brand_logo_url: string | null
          brand_name: string
          case_studies_description: string
          case_studies_description_ar: string
          case_studies_title: string
          case_studies_title_ar: string
          contact_address: string
          contact_behance: string
          contact_blurb: string
          contact_blurb_ar: string
          contact_card_image_url: string | null
          contact_city: string
          contact_clinic_name: string
          contact_clinic_name_ar: string
          contact_country: string
          contact_credentials: string
          contact_credentials_ar: string
          contact_doctor_name: string
          contact_doctor_name_ar: string
          contact_email: string
          contact_email_secondary: string
          contact_facebook: string
          contact_headline: string
          contact_headline_ar: string
          contact_hours: string
          contact_instagram: string
          contact_latitude: number | null
          contact_linkedin: string
          contact_longitude: number | null
          contact_map_url: string
          contact_mobile: string
          contact_phone: string
          contact_phone_secondary: string
          contact_price_range: string
          contact_telegram: string
          contact_title: string
          contact_title_ar: string
          contact_whatsapp: string
          contact_x: string
          created_at: string
          dashboard_canvas_color: string
          dashboard_layout: Json
          dashboard_panel_color: string
          dashboard_primary_color: string
          dashboard_secondary_color: string
          faq_description: string
          faq_description_ar: string
          faq_heading: string
          faq_heading_ar: string
          faq_title: string
          faq_title_ar: string
          featured_description: string
          featured_description_ar: string
          featured_title: string
          featured_title_ar: string
          footer_tagline: string
          footer_tagline_ar: string
          footer_tagline_image_url: string | null
          gallery_description: string
          gallery_description_ar: string
          gallery_heading: string
          gallery_heading_ar: string
          gallery_title: string
          gallery_title_ar: string
          homepage_hidden_sections: string[]
          homepage_section_order: string[]
          id: string
          services_description: string
          services_description_ar: string
          services_heading: string
          services_heading_ar: string
          services_title: string
          services_title_ar: string
          slider_heading: string
          slider_heading_ar: string
          solutions_description: string
          solutions_description_ar: string
          solutions_title: string
          solutions_title_ar: string
          updated_at: string
        }
        Insert: {
          about_title?: string
          about_title_ar?: string
          brand_logo_url?: string | null
          brand_name?: string
          case_studies_description?: string
          case_studies_description_ar?: string
          case_studies_title?: string
          case_studies_title_ar?: string
          contact_address?: string
          contact_behance?: string
          contact_blurb?: string
          contact_blurb_ar?: string
          contact_card_image_url?: string | null
          contact_city?: string
          contact_clinic_name?: string
          contact_clinic_name_ar?: string
          contact_country?: string
          contact_credentials?: string
          contact_credentials_ar?: string
          contact_doctor_name?: string
          contact_doctor_name_ar?: string
          contact_email?: string
          contact_email_secondary?: string
          contact_facebook?: string
          contact_headline?: string
          contact_headline_ar?: string
          contact_hours?: string
          contact_instagram?: string
          contact_latitude?: number | null
          contact_linkedin?: string
          contact_longitude?: number | null
          contact_map_url?: string
          contact_mobile?: string
          contact_phone?: string
          contact_phone_secondary?: string
          contact_price_range?: string
          contact_telegram?: string
          contact_title?: string
          contact_title_ar?: string
          contact_whatsapp?: string
          contact_x?: string
          created_at?: string
          dashboard_canvas_color?: string
          dashboard_layout?: Json
          dashboard_panel_color?: string
          dashboard_primary_color?: string
          dashboard_secondary_color?: string
          faq_description?: string
          faq_description_ar?: string
          faq_heading?: string
          faq_heading_ar?: string
          faq_title?: string
          faq_title_ar?: string
          featured_description?: string
          featured_description_ar?: string
          featured_title?: string
          featured_title_ar?: string
          footer_tagline?: string
          footer_tagline_ar?: string
          footer_tagline_image_url?: string | null
          gallery_description?: string
          gallery_description_ar?: string
          gallery_heading?: string
          gallery_heading_ar?: string
          gallery_title?: string
          gallery_title_ar?: string
          homepage_hidden_sections?: string[]
          homepage_section_order?: string[]
          id?: string
          services_description?: string
          services_description_ar?: string
          services_heading?: string
          services_heading_ar?: string
          services_title?: string
          services_title_ar?: string
          slider_heading?: string
          slider_heading_ar?: string
          solutions_description?: string
          solutions_description_ar?: string
          solutions_title?: string
          solutions_title_ar?: string
          updated_at?: string
        }
        Update: {
          about_title?: string
          about_title_ar?: string
          brand_logo_url?: string | null
          brand_name?: string
          case_studies_description?: string
          case_studies_description_ar?: string
          case_studies_title?: string
          case_studies_title_ar?: string
          contact_address?: string
          contact_behance?: string
          contact_blurb?: string
          contact_blurb_ar?: string
          contact_card_image_url?: string | null
          contact_city?: string
          contact_clinic_name?: string
          contact_clinic_name_ar?: string
          contact_country?: string
          contact_credentials?: string
          contact_credentials_ar?: string
          contact_doctor_name?: string
          contact_doctor_name_ar?: string
          contact_email?: string
          contact_email_secondary?: string
          contact_facebook?: string
          contact_headline?: string
          contact_headline_ar?: string
          contact_hours?: string
          contact_instagram?: string
          contact_latitude?: number | null
          contact_linkedin?: string
          contact_longitude?: number | null
          contact_map_url?: string
          contact_mobile?: string
          contact_phone?: string
          contact_phone_secondary?: string
          contact_price_range?: string
          contact_telegram?: string
          contact_title?: string
          contact_title_ar?: string
          contact_whatsapp?: string
          contact_x?: string
          created_at?: string
          dashboard_canvas_color?: string
          dashboard_layout?: Json
          dashboard_panel_color?: string
          dashboard_primary_color?: string
          dashboard_secondary_color?: string
          faq_description?: string
          faq_description_ar?: string
          faq_heading?: string
          faq_heading_ar?: string
          faq_title?: string
          faq_title_ar?: string
          featured_description?: string
          featured_description_ar?: string
          featured_title?: string
          featured_title_ar?: string
          footer_tagline?: string
          footer_tagline_ar?: string
          footer_tagline_image_url?: string | null
          gallery_description?: string
          gallery_description_ar?: string
          gallery_heading?: string
          gallery_heading_ar?: string
          gallery_title?: string
          gallery_title_ar?: string
          homepage_hidden_sections?: string[]
          homepage_section_order?: string[]
          id?: string
          services_description?: string
          services_description_ar?: string
          services_heading?: string
          services_heading_ar?: string
          services_title?: string
          services_title_ar?: string
          slider_heading?: string
          slider_heading_ar?: string
          solutions_description?: string
          solutions_description_ar?: string
          solutions_title?: string
          solutions_title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          deleted_at: string | null
          href: string
          id: string
          platform: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          href?: string
          id?: string
          platform: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          href?: string
          id?: string
          platform?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      solution_panels: {
        Row: {
          body: string
          body_ar: string
          created_at: string
          id: string
          image_url: string
          link_href: string | null
          sort_order: number
          title: string
          title_ar: string
          updated_at: string
          variant: "dark" | "photo"
        }
        Insert: {
          body?: string
          body_ar?: string
          created_at?: string
          id?: string
          image_url: string
          link_href?: string | null
          sort_order?: number
          title: string
          title_ar?: string
          updated_at?: string
          variant?: "dark" | "photo"
        }
        Update: {
          body?: string
          body_ar?: string
          created_at?: string
          id?: string
          image_url?: string
          link_href?: string | null
          sort_order?: number
          title?: string
          title_ar?: string
          updated_at?: string
          variant?: "dark" | "photo"
        }
        Relationships: []
      }
      system_action_log: {
        Row: {
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          operation: "insert" | "update" | "delete"
          reverted_at: string | null
          reverted_by: string | null
          row_id: string
          table_name: string
        }
        Insert: {
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          operation: "insert" | "update" | "delete"
          reverted_at?: string | null
          reverted_by?: string | null
          row_id: string
          table_name: string
        }
        Update: {
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          operation?: "insert" | "update" | "delete"
          reverted_at?: string | null
          reverted_by?: string | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      treatment_proposals: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          doctor_id: string
          id: string
          patient_key: string
          reservation_id: string | null
          status: "sent" | "accepted" | "declined"
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          doctor_id: string
          id?: string
          patient_key: string
          reservation_id?: string | null
          status?: "sent" | "accepted" | "declined"
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          doctor_id?: string
          id?: string
          patient_key?: string
          reservation_id?: string | null
          status?: "sent" | "accepted" | "declined"
        }
        Relationships: [
          {
            foreignKeyName: "treatment_proposals_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_proposals_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_proposal_items: {
        Row: {
          amount_egp: number
          description: string
          id: string
          proposal_id: string
          service_id: string
        }
        Insert: {
          amount_egp: number
          description: string
          id?: string
          proposal_id: string
          service_id: string
        }
        Update: {
          amount_egp?: number
          description?: string
          id?: string
          proposal_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "treatment_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ai_corrections: {
        Row: {
          ai_text: string
          conversation_id: string | null
          created_at: string
          edited: boolean
          id: string
          intent: string | null
          model: string | null
          promoted: boolean
          reason: string | null
          reviewed: boolean
          sent_by: string | null
          sent_text: string
        }
        Insert: {
          ai_text: string
          conversation_id?: string | null
          created_at?: string
          edited: boolean
          id?: string
          intent?: string | null
          model?: string | null
          promoted?: boolean
          reason?: string | null
          reviewed?: boolean
          sent_by?: string | null
          sent_text: string
        }
        Update: {
          ai_text?: string
          conversation_id?: string | null
          created_at?: string
          edited?: boolean
          id?: string
          intent?: string | null
          model?: string | null
          promoted?: boolean
          reason?: string | null
          reviewed?: boolean
          sent_by?: string | null
          sent_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ai_corrections_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_ratings: {
        Row: {
          called_at: string | null
          called_by: string | null
          comment: string
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          needs_call: boolean
          phone: string
          phone_suffix: string | null
          rating: number
          reservation_id: string | null
        }
        Insert: {
          called_at?: string | null
          called_by?: string | null
          comment?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          needs_call?: boolean
          phone?: string
          phone_suffix?: string | null
          rating: number
          reservation_id?: string | null
        }
        Update: {
          called_at?: string | null
          called_by?: string | null
          comment?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          needs_call?: boolean
          phone?: string
          phone_suffix?: string | null
          rating?: number
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_ratings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_ratings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ad_referrals: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          ctwa_clid: string | null
          headline: string | null
          id: string
          media_url: string | null
          message_id: string | null
          source_id: string | null
          source_type: string | null
          source_url: string | null
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          ctwa_clid?: string | null
          headline?: string | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          source_id?: string | null
          source_type?: string | null
          source_url?: string | null
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          ctwa_clid?: string | null
          headline?: string | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          source_id?: string | null
          source_type?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ad_referrals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ad_referrals_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ai_events: {
        Row: {
          confidence: number | null
          conversation_id: string
          created_at: string
          decision: "auto_send" | "draft" | "skip" | "error"
          envelope: Json
          handoff: boolean
          id: string
          injection_flags: string[]
          intent: string | null
          job_id: string | null
          language: string | null
          latency_ms: number | null
          message_id: string | null
          model: string | null
          reason: string
        }
        Insert: {
          confidence?: number | null
          conversation_id: string
          created_at?: string
          decision: "auto_send" | "draft" | "skip" | "error"
          envelope?: Json
          handoff?: boolean
          id?: string
          injection_flags?: string[]
          intent?: string | null
          job_id?: string | null
          language?: string | null
          latency_ms?: number | null
          message_id?: string | null
          model?: string | null
          reason?: string
        }
        Update: {
          confidence?: number | null
          conversation_id?: string
          created_at?: string
          decision?: string
          envelope?: Json
          handoff?: boolean
          id?: string
          injection_flags?: string[]
          intent?: string | null
          job_id?: string | null
          language?: string | null
          latency_ms?: number | null
          message_id?: string | null
          model?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ai_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ai_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ai_events_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ai_jobs: {
        Row: {
          attempts: number
          conversation_id: string
          created_at: string
          id: string
          inbound_message_id: string
          last_error: string | null
          lease_until: string | null
          outbound_message_id: string | null
          send_started_at: string | null
          skip_reason: string | null
          status: "queued" | "running" | "sent" | "drafted" | "skipped" | "failed" | "abandoned"
          updated_at: string
        }
        Insert: {
          attempts?: number
          conversation_id: string
          created_at?: string
          id?: string
          inbound_message_id: string
          last_error?: string | null
          lease_until?: string | null
          outbound_message_id?: string | null
          send_started_at?: string | null
          skip_reason?: string | null
          status?: "queued" | "running" | "sent" | "drafted" | "skipped" | "failed" | "abandoned"
          updated_at?: string
        }
        Update: {
          attempts?: number
          conversation_id?: string
          created_at?: string
          id?: string
          inbound_message_id?: string
          last_error?: string | null
          lease_until?: string | null
          outbound_message_id?: string | null
          send_started_at?: string | null
          skip_reason?: string | null
          status?: "queued" | "running" | "sent" | "drafted" | "skipped" | "failed" | "abandoned"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ai_jobs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ai_jobs_inbound_message_id_fkey"
            columns: ["inbound_message_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ai_jobs_outbound_message_id_fkey"
            columns: ["outbound_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_ai_settings: {
        Row: {
          ack_media_enabled: boolean
          allow_booking_writes: boolean
          full_conversation: boolean
          human_handoff_minutes: number
          id: string
          max_replies_global_per_hour: number
          max_replies_per_conversation_per_hour: number
          mode: "off" | "draft_only" | "auto"
          updated_at: string
        }
        Insert: {
          ack_media_enabled?: boolean
          allow_booking_writes?: boolean
          full_conversation?: boolean
          human_handoff_minutes?: number
          id?: string
          max_replies_global_per_hour?: number
          max_replies_per_conversation_per_hour?: number
          mode?: "off" | "draft_only" | "auto"
          updated_at?: string
        }
        Update: {
          ack_media_enabled?: boolean
          allow_booking_writes?: boolean
          full_conversation?: boolean
          human_handoff_minutes?: number
          id?: string
          max_replies_global_per_hour?: number
          max_replies_per_conversation_per_hour?: number
          mode?: "off" | "draft_only" | "auto"
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_ai_state: {
        Row: {
          autoreply_enabled: boolean
          conversation_id: string
          handoff_until: string | null
          offered_at: string | null
          offered_slot_ids: string[]
          paused_until: string | null
          pending: Json
          state_expires_at: string | null
          step: "idle" | "collecting" | "awaiting_doctor" | "awaiting_slot" | "awaiting_confirm"
          updated_at: string
        }
        Insert: {
          autoreply_enabled?: boolean
          conversation_id: string
          handoff_until?: string | null
          offered_at?: string | null
          offered_slot_ids?: string[]
          paused_until?: string | null
          pending?: Json
          state_expires_at?: string | null
          step?: "idle" | "collecting" | "awaiting_doctor" | "awaiting_slot" | "awaiting_confirm"
          updated_at?: string
        }
        Update: {
          autoreply_enabled?: boolean
          conversation_id?: string
          handoff_until?: string | null
          offered_at?: string | null
          offered_slot_ids?: string[]
          paused_until?: string | null
          pending?: Json
          state_expires_at?: string | null
          step?: "idle" | "collecting" | "awaiting_doctor" | "awaiting_slot" | "awaiting_confirm"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ai_state_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_canned_replies: {
        Row: {
          active: boolean
          attachment: Json | null
          body: string
          body_ar: string | null
          buttons: Json | null
          category: string | null
          created_at: string
          id: string
          last_used_at: string | null
          slash_key: string
          sort_order: number
          title: string
          title_ar: string | null
          updated_at: string
          use_count: number
        }
        Insert: {
          active?: boolean
          attachment?: Json | null
          body: string
          body_ar?: string | null
          buttons?: Json | null
          category?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          slash_key: string
          sort_order?: number
          title: string
          title_ar?: string | null
          updated_at?: string
          use_count?: number
        }
        Update: {
          active?: boolean
          attachment?: Json | null
          body?: string
          body_ar?: string | null
          buttons?: Json | null
          category?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          slash_key?: string
          sort_order?: number
          title?: string
          title_ar?: string | null
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          assignee_id: string | null
          contact_name: string | null
          created_at: string
          id: string
          kapso_conversation_id: string | null
          last_inbound_at: string | null
          last_message_at: string | null
          last_message_preview: string
          last_message_status: string
          last_message_type: string
          metadata: Json
          muted_until: string | null
          patient_key: string | null
          phone_number: string
          phone_suffix: string | null
          starred: boolean
          status: "active" | "ended" | "archived"
          tags: string[]
          unread_count: number
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          kapso_conversation_id?: string | null
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_message_preview?: string
          last_message_status?: string
          last_message_type?: string
          metadata?: Json
          muted_until?: string | null
          patient_key?: string | null
          phone_number: string
          phone_suffix?: string | null
          starred?: boolean
          status?: "active" | "ended" | "archived"
          tags?: string[]
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          kapso_conversation_id?: string | null
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_message_preview?: string
          last_message_status?: string
          last_message_type?: string
          metadata?: Json
          muted_until?: string | null
          patient_key?: string | null
          phone_number?: string
          phone_suffix?: string | null
          starred?: boolean
          status?: "active" | "ended" | "archived"
          tags?: string[]
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: "inbound" | "outbound"
          flow: Json | null
          id: string
          kapso_wamid: string | null
          media: Json
          message_type: string
          raw: Json
          reply_to: Json | null
          sender_kind: string
          sent_by: string | null
          status: string
          status_timestamps: Json
          updated_at: string
          wa_timestamp: string
        }
        Insert: {
          body?: string
          conversation_id: string
          created_at?: string
          direction: "inbound" | "outbound"
          flow?: Json | null
          id?: string
          kapso_wamid?: string | null
          media?: Json
          message_type?: string
          raw?: Json
          reply_to?: Json | null
          sender_kind?: string
          sent_by?: string | null
          status?: string
          status_timestamps?: Json
          updated_at?: string
          wa_timestamp?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: "inbound" | "outbound"
          flow?: Json | null
          id?: string
          kapso_wamid?: string | null
          media?: Json
          message_type?: string
          raw?: Json
          reply_to?: Json | null
          sender_kind?: string
          sent_by?: string | null
          status?: string
          status_timestamps?: Json
          updated_at?: string
          wa_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_notes: {
        Row: {
          author: string
          body: string
          conversation_id: string
          created_at: string
          id: string
          pinned: boolean
          updated_at: string
        }
        Insert: {
          author?: string
          body?: string
          conversation_id: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Update: {
          author?: string
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          pinned?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_webhook_events: {
        Row: {
          event: string
          idempotency_key: string
          processed_at: string
        }
        Insert: {
          event: string
          idempotency_key: string
          processed_at?: string
        }
        Update: {
          event?: string
          idempotency_key?: string
          processed_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_inventory_transaction: {
        Args: {
          p_decision: string
          p_note: string
          p_transaction_id: string
        }
        Returns: Database["public"]["Tables"]["inventory_transactions"]["Row"]
      }
      assert_reservation_access: {
        Args: {
          p_phone: string
          p_reservation: Database["public"]["Tables"]["reservations"]["Row"]
        }
        Returns: undefined
      }
      book_open_appointment_slot: {
        Args: {
          p_email?: string | null
          p_notes?: string
          p_patient_name: string
          p_phone: string
          p_service_id?: string | null
          p_service_label?: string
          p_slot_id: string
        }
        Returns: string
      }
      book_slot_with_deposit_hold: {
        Args: {
          p_amount_egp?: number
          p_conversation_id?: string
          p_email?: string
          p_hold_minutes?: number
          p_notes?: string
          p_patient_name: string
          p_phone: string
          p_service_id?: string
          p_service_label?: string
          p_settings?: Json
          p_slot_id: string
        }
        /** { reservation_id, deposit_request_id, expires_at } */
        Returns: Json
      }
      cancel_reservation_and_release_slot: {
        Args: { p_phone?: string | null; p_reservation_id: string }
        Returns: string
      }
      check_and_log_rate_limit: {
        Args: {
          p_bucket: string
          p_identifier: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      confirm_billing_payment: {
        Args: { p_billing_payment_request_id: string; p_decided_by?: string; p_reason?: string }
        Returns: boolean
      }
      confirm_deposit_paid: {
        Args: { p_decided_by?: string; p_deposit_request_id: string; p_reason?: string }
        Returns: boolean
      }
      consume_inventory_stock: {
        Args: {
          p_created_by: string
          p_deduction_group_id: string
          p_item_id: string
          p_patient_treatment_id: string | null
          p_photo_url: string | null
          p_qty: number
          p_reason_code: string | null
          p_reason_note: string | null
          p_reservation_id: string | null
          p_type: string
        }
        Returns: Database["public"]["Tables"]["inventory_transactions"]["Row"][]
      }
      expire_deposit_hold: {
        Args: { p_deposit_request_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      list_bookable_doctors_for_service: {
        Args: { p_from?: string; p_service_id?: string | null }
        Returns: {
          avatar_url: string
          bio: string
          calendar_color: string
          display_name: string
          id: string
          next_slot_id: string
          next_slot_starts_at: string
          price_label: string | null
          specialty: string
        }[]
      }
      offer_slot_to_waitlist: {
        Args: { p_slot_id: string }
        Returns: number
      }
      patient_notifications_cron_scheduled: { Args: never; Returns: boolean }
      record_ai_usage: {
        Args: {
          p_completion_tokens?: number
          p_model: string
          p_prompt_tokens?: number
          p_provider: string
          p_rate_limited?: number
          p_requests?: number
        }
        Returns: undefined
      }
      record_canned_reply_use: { Args: { p_id: string }; Returns: undefined }
      reject_billing_payment: {
        Args: { p_billing_payment_request_id: string; p_decided_by?: string; p_reason?: string }
        Returns: boolean
      }
      reject_deposit: {
        Args: { p_decided_by?: string; p_deposit_request_id: string; p_reason?: string }
        Returns: boolean
      }
      release_stale_waitlist_offers: {
        Args: { p_max_age?: string }
        Returns: number
      }
      reschedule_reservation_to_slot: {
        Args: { p_phone?: string | null; p_reservation_id: string; p_slot_id: string }
        Returns: string
      }
      revert_system_action: {
        Args: { p_log_id: string }
        Returns: undefined
      }
      search_clinic_knowledge: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          body: string
          body_ar: string
          id: string
          rank: number
          title: string
          title_ar: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
