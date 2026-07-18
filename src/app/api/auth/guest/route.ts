import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Guest access is disabled. Please sign in with Google or email and wait for admin approval.",
    },
    { status: 403 }
  );
}
