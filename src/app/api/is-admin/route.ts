import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (adminEmail && email && adminEmail.toLowerCase() === email.toLowerCase()) {
      return NextResponse.json({ isAdmin: true });
    }
    
    return NextResponse.json({ isAdmin: false });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
