"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/admin-products";

export default function AdminLoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const ok = await isAdmin(session.user.id);
        if (ok) {
          router.replace("/admin/dashboard");
        }
      }
    })();
  }, [router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    setBusy(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (authData.user) {
        const ok = await isAdmin(authData.user.id);
        if (!ok) {
          toast.error("You do not have administrator permissions.");
          await supabase.auth.signOut();
          return;
        }
      }
      toast.success("Welcome back!");
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Faiza<span className="text-sale">Zone</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin Panel Login</p>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="email"
              type="email"
              required
              placeholder="Email address"
              autoComplete="email"
              className="h-12 w-full rounded-xl border-0 bg-auth-field pl-10 pr-4 text-sm text-foreground outline-none ring-1 ring-transparent transition placeholder:text-muted-foreground focus:bg-auth-blue-soft focus:ring-auth-blue"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Password"
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border-0 bg-auth-field pl-10 pr-4 text-sm text-foreground outline-none ring-1 ring-transparent transition placeholder:text-muted-foreground focus:bg-auth-blue-soft focus:ring-auth-blue"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-auth-blue text-sm font-semibold text-white shadow-sm transition hover:bg-auth-blue/90 disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
