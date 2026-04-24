import { NextResponse } from "next/server";
import { getReport } from "@/mocks/data/reports";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const report = getReport(ticker);
  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(report);
}
