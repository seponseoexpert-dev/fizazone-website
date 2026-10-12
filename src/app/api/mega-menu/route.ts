import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_MEGA_MENU_ITEMS, type MegaMenuItem } from "@/lib/mega-menu-config";
import { supabase } from "@/integrations/supabase/client";

const FILE_PATH = path.join(process.cwd(), "src", "data", "mega-menu-settings.json");

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Try Supabase site_settings
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "mega_menu_config")
        .maybeSingle();

      if (!error && data?.value && Array.isArray(data.value) && data.value.length > 0) {
        return NextResponse.json(data.value);
      }
    } catch {
      // ignore
    }

    // 2. Read local file
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return NextResponse.json(parsed);
      }
    }

    return NextResponse.json(DEFAULT_MEGA_MENU_ITEMS);
  } catch (err: unknown) {
    console.error("Failed to load mega menu settings:", err);
    return NextResponse.json(DEFAULT_MEGA_MENU_ITEMS);
  }
}

export async function POST(req: Request) {
  try {
    const body: MegaMenuItem[] = await req.json();

    // 1. Write to local file if writable (local dev environment)
    try {
      const dir = path.dirname(FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(FILE_PATH, JSON.stringify(body, null, 2), "utf-8");
    } catch {
      // In read-only serverless environments, writing to filesystem is safely ignored
    }

    // 2. Also try writing to Supabase site_settings via server admin client
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("site_settings")
        .upsert(
          { key: "mega_menu_config", value: body as never },
          { onConflict: "key" }
        );
      if (error) {
        console.warn("Supabase server upsert notice for mega menu:", error.message);
      }
    } catch (sbErr) {
      console.warn("Supabase server upsert exception for mega menu:", sbErr);
    }

    return NextResponse.json({ success: true, data: body });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save mega menu settings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
