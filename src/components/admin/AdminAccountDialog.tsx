"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Lock, LogOut, Pencil, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/admin-products";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const field =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-sale";

interface AdminAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminAccountDialog({ open, onOpenChange }: AdminAccountDialogProps) {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!open) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      if (!currentUser) {
        if (mounted) {
          setLoading(false);
          onOpenChange(false);
          router.push("/admin/login");
        }
        return;
      }

      const ok = await isAdmin(currentUser.id);
      if (!mounted) return;
      setAllowed(ok);
      if (!ok) {
        setLoading(false);
        return;
      }

      setUser(currentUser);
      const { data: profileRow, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (error) {
        console.error("Failed to load profile:", error);
      }
      if (mounted) {
        setProfile(profileRow);
        const metaName =
          typeof currentUser.user_metadata?.["full_name"] === "string"
            ? (currentUser.user_metadata["full_name"] as string)
            : "";
        setName(profileRow?.full_name ?? metaName ?? "");
        setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [open, router, onOpenChange]);

  const displayName = useMemo(() => {
    const metaName =
      typeof user?.user_metadata?.["full_name"] === "string"
        ? (user.user_metadata["full_name"] as string)
        : undefined;
    return String(
      profile?.full_name || metaName || user?.email?.split("@")[0] || "Admin",
    );
  }, [profile, user]);

  const initials = useMemo(() => {
    const source = displayName || user?.email || "A";
    return source
      .split(" ")
      .map((p: string) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [displayName, user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: name.trim() || null,
          email: user.email ?? null,
        });
      if (error) throw error;
      setProfile((p) =>
        p
          ? { ...p, full_name: name.trim() || null }
          : {
              id: user.id,
              full_name: name.trim() || null,
              email: user.email ?? null,
              country_code: "bd",
              created_at: new Date().toISOString(),
            },
      );
      setEditOpen(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordReset() {
    if (!user?.email) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setPasswordOpen(false);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    onOpenChange(false);
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (allowed === false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <div className="py-6 text-center">
            <h2 className="font-display text-xl font-extrabold">Admins only</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to view this account.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 sm:max-w-md">
          {loading ? (
            <div className="flex min-h-[20rem] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-sale" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-card text-card-foreground">
              <div className="flex flex-col items-center px-6 pb-8 pt-10">
                <div className="relative">
                  <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-sale bg-secondary text-3xl font-bold text-sale">
                    {initials}
                  </div>
                  <div className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-foreground shadow">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-semibold text-foreground">{displayName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                <p className="mt-3 inline-flex items-center rounded-full bg-sale/10 px-3 py-1 text-xs font-semibold text-sale">
                  Admin
                </p>
              </div>

              <div className="border-t border-border bg-background">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex w-full items-center gap-3 border-b border-border px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                  className="flex w-full items-center gap-3 border-b border-border px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveProfile} className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={field}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-sale text-primary-foreground hover:bg-sale/90"
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              We will send a secure password reset link to{" "}
              <span className="font-medium text-foreground">{user?.email}</span>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={sendPasswordReset}
                disabled={saving}
                className="bg-sale text-primary-foreground hover:bg-sale/90"
              >
                {saving ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
