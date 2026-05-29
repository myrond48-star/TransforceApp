/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Function to get config with localStorage overrides
const getConfig = () => {
  if (typeof window === 'undefined') return { url: '', key: '' };
  
  const savedUrl = localStorage.getItem('supabase_url');
  const savedKey = localStorage.getItem('supabase_key');
  
  const rawUrl = savedUrl || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  // Robust cleaning of the URL
  let supabaseUrl = rawUrl.split('/rest/v1')[0].replace(/\/$/, "");
  if (!supabaseUrl.startsWith('http')) supabaseUrl = `https://${supabaseUrl}`;
  
  const supabaseAnonKey = savedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
  
  return { url: supabaseUrl, key: supabaseAnonKey };
};

const { url, key } = getConfig();

if (typeof window !== 'undefined' && !localStorage.getItem('supabase_url') && (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder'))) {
  console.warn('Supabase URL is not configured.');
}

// Export as let so it can be dynamically reassigned without a page reload
export let supabase = createClient(url, key);

// Function to update config and ensure it's written before any other action
export const updateSupabaseRuntimeConfig = (newUrl: string, newKey: string) => {
  if (typeof window === 'undefined') return;
  
  // Clean URL before saving
  let cleanUrl = newUrl.trim().split('/rest/v1')[0].replace(/\/$/, "");
  
  try {
    localStorage.setItem('supabase_url', cleanUrl);
    localStorage.setItem('supabase_key', newKey.trim());
    console.log("Supabase runtime config updated in localStorage:", cleanUrl);
  } catch (e) {
    console.warn("Failed to save to localStorage. Using in-memory configuration:", e);
  }
  
  // Dynamically swap the active client
  supabase = createClient(cleanUrl, newKey.trim());
};
