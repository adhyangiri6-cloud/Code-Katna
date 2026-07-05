import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xkopbwuzbpfpvrqdavfd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrb3Bid3V6YnBmcHZycWRhdmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3OTk2ODgsImV4cCI6MjA5ODM3NTY4OH0.EThZYVS2Irrdagl8DzhJOJ1DRpvKyri_Rm_oXSxB0fo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
