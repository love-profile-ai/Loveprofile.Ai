import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Local analysis is disabled. Sign in with Google or email and wait for admin approval.",
    },
    { status: 403 }
  );
}
