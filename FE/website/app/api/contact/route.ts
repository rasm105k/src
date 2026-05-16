import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, message } = body;

    if (!full_name || !email || !message) {
      return NextResponse.json({ message: "Alle felter skal udfyldes" }, { status: 400 });
    }

    console.log("Contact form submission:", { full_name, email, message });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Ugyldig forespørgsel" }, { status: 400 });
  }
}
