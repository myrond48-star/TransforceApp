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

/**
 * Separate Workforce Database Helpers
 */
export async function fetchWorkforce() {
  try {
    console.log("Fetching workforce from Supabase 'workforce' table...");
    const { data, error } = await supabase
      .from('workforce')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.warn("Could not query 'workforce' table on Supabase (maybe table not created yet). Using local fallback:", err.message);
    throw err;
  }
}

export async function fetchUniqueProjects() {
  try {
    const { data, error } = await supabase
      .from('workforce')
      .select('project');
    if (error) throw error;
    if (data && data.length > 0) {
      const projects = Array.from(new Set(data.map((r: any) => r.project).filter(Boolean))) as string[];
      return projects.filter(p => typeof p === 'string' && p.trim() !== "").sort();
    }
    return [];
  } catch (err: any) {
    console.warn("Could not fetch unique projects from database:", err.message);
    return [];
  }
}

export async function createWorkforceRecord(record: any) {
  try {
    const { data, error } = await supabase
      .from('workforce')
      .insert([record])
      .select();
    
    if (error) throw error;
    return data?.[0];
  } catch (err: any) {
    console.warn("Could not insert into 'workforce' table on Supabase. Using local fallback:", err.message);
    throw err;
  }
}

export async function deleteWorkforceRecord(id: string | number) {
  try {
    const { error } = await supabase
      .from('workforce')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.warn("Could not delete from 'workforce' table on Supabase. Using local fallback:", err.message);
    throw err;
  }
}

/**
 * Interval Requirements Database Helpers
 */
export async function fetchIntervalRequirements(startDate: string, endDate: string, intervalType: string, project: string) {
  try {
    console.log(`Fetching interval requirements (${intervalType}) from Supabase: ${startDate} to ${endDate} for project ${project}...`);
    let query = supabase
      .from('interval_requirements')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('interval_type', intervalType);

    if (project && project !== 'all') {
      query = query.eq('project', project);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.warn("Could not query 'interval_requirements' table. Using local fallback:", err.message);
    throw err;
  }
}

export async function upsertIntervalRequirements(records: any[]) {
  try {
    if (!records || records.length === 0) return [];
    console.log(`Upserting ${records.length} interval requirements into Supabase...`);
    const { data, error } = await supabase
      .from('interval_requirements')
      .upsert(records, { onConflict: 'date,time_slot,interval_type,project' })
      .select();
    
    if (error) {
      console.warn("Upsert failed, falling back to delete-then-insert to avoid constraint issues:", error.message);
      const dates = records.map(r => r.date).filter(Boolean);
      if (dates.length > 0) {
        const sortedDates = [...dates].sort();
        const minDate = sortedDates[0];
        const maxDate = sortedDates[sortedDates.length - 1];
        const proj = records[0].project || 'default';
        const type = records[0].interval_type || '1h';
        
        console.log(`Deleting old records for project ${proj}, type ${type} from ${minDate} to ${maxDate}...`);
        const { error: delError } = await supabase
          .from('interval_requirements')
          .delete()
          .eq('project', proj)
          .eq('interval_type', type)
          .gte('date', minDate)
          .lte('date', maxDate);
        
        if (delError) {
          console.error("Delete step failed:", delError.message);
        } else {
          console.log("Delete succeeded, executing bulk insert...");
          const { data: insData, error: insError } = await supabase
            .from('interval_requirements')
            .insert(records)
            .select();
            
          if (insError) throw insError;
          return insData || [];
        }
      }
      throw error;
    }
    return data || [];
  } catch (err: any) {
    console.warn("Could not upsert into 'interval_requirements' table. Using local fallback:", err.message);
    throw err;
  }
}

/**
 * Roster Schedule Database Helpers
 */
export async function fetchRosterSchedule(startDate: string, endDate: string, project: string) {
  try {
    console.log(`Fetching roster schedule from Supabase: ${startDate} to ${endDate} for project ${project}...`);
    let query = supabase
      .from('roster_schedule')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (project && project !== 'all') {
      query = query.eq('project', project);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.warn("Could not query 'roster_schedule' table:", err.message);
    throw err;
  }
}

export async function upsertRosterSchedule(records: any[]) {
  try {
    if (!records || records.length === 0) return [];
    console.log(`Upserting ${records.length} roster schedule records into Supabase...`);
    const { data, error } = await supabase
      .from('roster_schedule')
      .upsert(records, { onConflict: 'date,emp_id,project' })
      .select();
    
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.warn("Could not upsert into 'roster_schedule' table:", err.message);
    throw err;
  }
}

/**
 * Master Shifts Database Helpers
 */
export async function fetchMasterShifts(project: string) {
  try {
    console.log(`Fetching master shifts for project: ${project} from Supabase...`);
    let query = supabase
      .from('master_shifts')
      .select('*');

    if (project && project !== 'all') {
      query = query.eq('project', project);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.warn(`Could not query 'master_shifts' table. Using local fallback for project ${project}:`, err.message);
    throw err;
  }
}

export async function upsertMasterShifts(project: string, records: any[]) {
  try {
    console.log(`Upserting ${records.length} master shifts for project: ${project} to Supabase...`);
    
    // First, clear existing shifts for this project to keep the list synchronized (deletions propagate)
    const { error: deleteError } = await supabase
      .from('master_shifts')
      .delete()
      .eq('project', project);
    
    if (deleteError) {
      console.warn("Error clearing old shifts:", deleteError.message);
    }

    if (records.length === 0) return [];

    const formattedRecords = records.map(r => ({
      project,
      code: r.code,
      start_time: r.s,
      end_time: r.e,
      weight: r.w || 1
    }));

    const { data, error } = await supabase
      .from('master_shifts')
      .insert(formattedRecords)
      .select();
    
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.warn("Could not save to 'master_shifts' table:", err.message);
    throw err;
  }
}



