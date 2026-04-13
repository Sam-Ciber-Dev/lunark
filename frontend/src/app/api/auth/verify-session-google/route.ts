import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import honoApp from "@lunark/api/app";

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    // Verify Google credential with backend (signin mode)
    const res = await honoApp.fetch(
      new Request("http://localhost/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, mode: "signin" }),
      })
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, string>;
      return NextResponse.json(
        { error: data.error ?? "No account found. Please create an account first." },
        { status: 400 }
      );
    }

    const user = (await res.json()) as {
      id: string;
      name: string;
      email: string;
      role: string;
      image: string | null;
    };

    if (!user.id) {
      return NextResponse.json({ error: "No account found" }, { status: 400 });
    }

    // Create JWT matching NextAuth's format
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
      maxAge: 30 * 24 * 60 * 60,
    });

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
    console.error("verify-session-google error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
