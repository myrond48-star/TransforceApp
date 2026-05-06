/**
 * API service for communicating with the Express backend.
 * This is used to connect to the PostgreSQL database via API routes.
 */

export async function fetchUsers() {
  try {
    const response = await fetch("/api/users");
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch users");
    }
    return await response.json();
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
}

export async function checkConnection() {
  try {
    const response = await fetch("/api/health");
    return await response.json();
  } catch (err) {
    console.error("Connection check failed:", err);
    return { status: "error", error: "Backend not reachable" };
  }
}

export async function updateDbConfig(url: string) {
  try {
    const response = await fetch("/api/db/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update database config");
    }
    return await response.json();
  } catch (err) {
    console.error("Update DB config error:", err);
    throw err;
  }
}
