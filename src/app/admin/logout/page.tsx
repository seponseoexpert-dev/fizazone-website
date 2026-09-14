"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"signing-out" | "done">("signing-out");

  useEffect(() => {
    let cancelled = false;

    async function doLogout() {
      try {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Logout error:", e);
      }
      if (!cancelled) {
        setStatus("done");
        router.replace("/admin/login");
      }
    }

    doLogout();
    return () => {
      cancelled = true;
    };
  }, [router, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-sale/10">
          <LogOut className="h-6 w-6 text-sale" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">Signing out</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Please wait while we securely log you out of the admin panel.
          </p>
        </div>
        {status === "signing-out" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting…</span>
          </div>
        )}
      </div>
    </div>
  );
}
