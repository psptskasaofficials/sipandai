import { createClient } from '@supabase/supabase-js'

// Ganti teks di bawah dengan URL & anon key asli dari Project Settings > API di Supabase Anda
const supabaseUrl = 'https://keqwqwuxgygezsphemod.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcXdxd3V4Z3lnZXpzcGhlbW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MTQ2ODAsImV4cCI6MjEwOTA5MDY4MH0.P7-GV6wtbwG6BIJHJB9kuQg5MYW9vBbNDKA7LMH9QLE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)