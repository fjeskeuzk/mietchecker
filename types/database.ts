// Database entity types for Mietchecker

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      project_metrics: {
        Row: ProjectMetric;
        Insert: Omit<ProjectMetric, 'id' | 'fetched_at'> & {
          id?: string;
          fetched_at?: string;
        };
        Update: Partial<Omit<ProjectMetric, 'id'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Conversation, 'id'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Payment, 'id'>>;
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      ingestion_jobs: {
        Row: IngestionJob;
        Insert: Omit<IngestionJob, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<IngestionJob, 'id'>>;
      };
    };
  };
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  visibility: 'private' | 'shared';
  overall_score: number | null;
}

export type MetricKey =
  | 'noise'
  | 'light'
  | 'crime'
  | 'internet_speed'
  | 'demographics'
  | 'grocery_stores'
  | 'laundromats'
  | 'parking';

export interface ProjectMetric {
  id: string;
  project_id: string;
  metric_key: MetricKey;
  metric_value: number | null;
  normalized_score: number | null;
  raw: Json;
  source: string | null;
  fetched_at: string;
}

export type ConversationRole = 'user' | 'assistant' | 'system';

export interface Conversation {
  id: string;
  project_id: string;
  user_id: string;
  role: ConversationRole;
  message: string;
  metadata: Json;
  created_at: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  user_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: string | null;
  status: PaymentStatus;
  amount: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  is_premium: boolean;
  premium_since: string | null;
  stripe_customer_id: string | null;
  theme: 'light' | 'dark';
  locale: 'de' | 'en';
  created_at: string;
  updated_at: string;
}

export type IngestionJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface IngestionJob {
  id: string;
  project_id: string;
  status: IngestionJobStatus;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  metadata: Json;
  created_at: string;
}

// Utility types for client-side usage
export interface ProjectWithMetrics extends Project {
  metrics: ProjectMetric[];
}

export interface MetricSummary {
  key: MetricKey;
  value: number | null;
  score: number | null;
  label: string;
  icon: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: ConversationRole;
  message: string;
  timestamp: string;
}
