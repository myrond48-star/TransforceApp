import { supabase, updateSupabaseRuntimeConfig } from "./supabase";

/**
 * Supabase-powered API Client for TransForce Portal
 */

export async function fetchUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching users from Supabase:", err);
    // Return mock data for UI demo purposes if Supabase is not fully configured
    return [
      { id: 1, username: 'admin', role: 'admin', email: 'admin@transforce.com' }
    ];
  }
}

export async function checkConnection(testUrl?: string, testKey?: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    let client = supabase;
    if (testUrl && testKey) {
      const { createClient } = await import('@supabase/supabase-js');
      // Clean test URL
      const cleanUrl = testUrl.trim().split('/rest/v1')[0].replace(/\/$/, "");
      client = createClient(cleanUrl, testKey);
    }

    // Try to check a known table or just the path with a light query
    const { error } = await client
      .from('employees')
      .select('count', { count: 'exact', head: true })
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error && (error.message?.includes('invalid path') || error.message?.includes('Failed to fetch'))) {
       return { status: "error", error: "Invalid Project URL configuration" };
    }
    
    return { status: "ok", service: "Supabase" };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { status: "error", error: "Connection timed out" };
    }
    return { status: "error", error: "Connection unreachable" };
  }
}

export async function updateDbConfig(url: string, key?: string) {
  // Save to localStorage for persistence across reloads
  if (typeof window !== 'undefined') {
    updateSupabaseRuntimeConfig(url, key || '');
  }
  
  console.log("Database connection string updated to:", url);
  return { success: true, message: "Infrastructure updated" };
}

export async function saveDbConfig(url: string) {
  return updateDbConfig(url);
}

export async function login(username: string, password: string, remember: boolean) {
  try {
    // Treat username as email for Supabase demo or handle specific login logic
    const email = username.includes('@') ? username : `${username}@transforce.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Emergency fallback for initial dev setup (admin/admin123)
      if (username === "admin" && (password === "admin123" || password === "password123")) {
        const mockUser = { id: 'admin-id', email: 'admin@transforce.com', role: 'admin' };
        if (remember) localStorage.setItem("token", "mock-session");
        else sessionStorage.setItem("token", "mock-session");
        return { user: mockUser, session: { access_token: 'mock-token' } };
      }
      throw error;
    }
    
    if (data.session) {
      if (remember) localStorage.setItem("token", data.session.access_token);
      else sessionStorage.setItem("token", data.session.access_token);
    }
    
    return data;
  } catch (err: any) {
    console.error("Supabase Login error:", err);
    throw err;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  if (error) throw error;
}

/**
 * Employee Management Helpers
 */

export async function fetchEmployees() {
  try {
    console.log("Fetching employees from Supabase...");
    const { data, error, status, statusText } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase Error Details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status,
        statusText
      });
      throw error;
    }
    console.log(`Successfully fetched ${data?.length || 0} employees`);
    return data || [];
  } catch (err: any) {
    console.error("Error in fetchEmployees API wrapper:", err);
    throw err;
  }
}

export async function createEmployee(employee: any) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select();
    
    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error("Error creating employee:", err);
    throw err;
  }
}

export async function updateEmployee(id: string | number, updates: any) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  } catch (err) {
    console.error("Error updating employee:", err);
    throw err;
  }
}

export async function deleteEmployee(id: string | number) {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting employee:", err);
    throw err;
  }
}
