import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { enableMemory } from "@/lib/bland";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { enabled } = body as { enabled: boolean };

  const data = await enableMemory(id, enabled);
  return NextResponse.json(data);
}
