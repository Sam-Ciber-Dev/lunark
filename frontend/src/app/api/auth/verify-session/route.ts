import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import honoApp from "@lunark/api/app";

export async function POST(req: Request) {
  try {
    const { email, code, type } = await req.json();

    if (!email || !code || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify code with backend
    const res = await honoApp.fetch(
      new Request("http://localhost/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, type }),
      })
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, string>;
      return NextResponse.json(
        { error: data.error ?? "Invalid or expired code" },
        { status: 400 }
      );
    }

    const user = (await res.json()) as {
      id: string;
      name: string;
      email: string;
      role: string;
      image: string | null;
      verified: boolean;
    };

    if (!user.verified) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    // Create JWT matching NextAuth's format (same fields as jwt callback in auth.config.ts)
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error("AUTH_SECRET is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isSecure =
      process.env.NODE_ENV === "production" ||
      (process.env.VERCEL_URL ?? "").length > 0;
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const token = await encode({
      token: {
        sub: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.image,
        role: user.role ?? "customer",
      },
      secret,
      salt: cookieName,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set session cookie on the response object (reliable across all environments)
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("verify-session error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
