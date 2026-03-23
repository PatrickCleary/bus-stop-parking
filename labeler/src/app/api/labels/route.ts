import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LABELS_FILE = path.join(process.cwd(), "..", "ingestion", "labels.json");

function readLabels(): Record<string, unknown>[] {
  if (!fs.existsSync(LABELS_FILE)) return [];
  return JSON.parse(fs.readFileSync(LABELS_FILE, "utf-8"));
}

function writeLabels(labels: Record<string, unknown>[]) {
  fs.writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2));
}

export async function GET() {
  return NextResponse.json(readLabels());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const labels = readLabels();
  // Replace existing label for same stop_id if present
  const idx = labels.findIndex(
    (l) => l.stop_id === body.stop_id
  );
  if (idx >= 0) {
    labels[idx] = body;
  } else {
    labels.push(body);
  }
  writeLabels(labels);
  return NextResponse.json({ ok: true, count: labels.length });
}
