import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ecwaqfsjajeidhslybdi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd2FxZnNqYWplaWRoc2x5YmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzg1MjYsImV4cCI6MjA5MTc1NDUyNn0.0gUXo6hBYYwO94u6tsRYU33pfWOJiTHs8oQ5nG519eA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      return fetch(url, { ...options, cache: 'no-store' });
    },
  },
});
