import { NextResponse } from "next/server";
import { briefingData } from "@/mocks/data/briefing";

export async function GET() {
  return NextResponse.json(briefingData);
}
