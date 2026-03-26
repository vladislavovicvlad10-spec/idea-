import { NextResponse } from "next/server";
import { adminAuth } from "@/firebase/admin";
import { serverConfig } from "@/server/config";

export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    const adminEmail = serverConfig.adminEmail;

    if (!adminEmail || !idToken) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    const isAdmin = !!email && email.toLowerCase() === adminEmail.toLowerCase();

    return NextResponse.json({ isAdmin }, { status: isAdmin ? 200 : 403 });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
