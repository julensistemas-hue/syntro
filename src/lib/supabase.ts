import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Course features will not work.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Server-side client with service role (for admin operations)
export function createServerClient() {
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }
  return createClient(supabaseUrl!, serviceRoleKey);
}

// Types for our database
export interface Module {
  id: number;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  video_type: 'youtube' | 'bunny' | 'vimeo';
  duration_minutes: number | null;
  order_index: number;
  resources: Resource[] | null;
  text_content: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Resource {
  name: string;
  url: string;
  type: 'pdf' | 'zip' | 'link' | 'other';
}

export interface CourseUser {
  id: string;
  email: string;
  name: string | null;
  enrolled_at: string;
  payment_verified: boolean;
  payment_method: 'stripe' | 'transfer' | 'bizum' | null;
  payment_reference: string | null;
}

export interface UserProgress {
  user_id: string;
  lesson_id: number;
  completed: boolean;
  completed_at: string | null;
  last_watched_seconds: number;
}

export interface Comment {
  id: number;
  user_id: string;
  lesson_id: number;
  content: string;
  created_at: string;
  is_resolved: boolean;
  admin_reply: string | null;
  admin_replied_at: string | null;
  user?: {
    name: string;
    email: string;
  };
}
