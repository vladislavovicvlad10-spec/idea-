import { NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";
import { getDashboardStats } from "@/server/admin/dashboard";
import { hasServiceAccountCredentials, serverConfig } from "@/server/config";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim();
}

export async function GET(request: Request) {
  try {
    const idToken = getBearerToken(request);
    if (!idToken || !serverConfig.adminEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email?.toLowerCase();

    if (!email || email !== serverConfig.adminEmail.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasServiceAccountCredentials()) {
      return NextResponse.json({ error: "Server dashboard mode unavailable" }, { status: 503 });
    }

    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("ADMIN_DASHBOARD_ERROR:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
