import { NextResponse } from "next/server";
import { reportsMap } from "@/mocks/data/reports";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const report = reportsMap[ticker.toUpperCase()];
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(report);
}
