"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/admin-products";
import type { User } from "@supabase/supabase-js";

export function useAdminAuth(options: { redirectToLogin?: boolean } = { redirectToLogin: true }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("Admin");
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          if (active) {
            setUser(null);
            setAllowed(false);
            setLoading(false);
            if (options.redirectToLogin) {
              router.replace("/admin/login");
            }
          }
          return;
        }

        const currentUser = session.user;
        const ok = await isAdmin(currentUser.id);

        if (active) {
          setUser(currentUser);
          setUserName(currentUser.email?.split("@")[0] ?? "Admin");
          setAllowed(ok);
          setLoading(false);

          if (!ok && options.redirectToLogin) {
            router.replace("/admin/login");
          }
        }
      } catch {
        if (active) {
          setAllowed(false);
          setLoading(false);
          if (options.redirectToLogin) {
            router.replace("/admin/login");
          }
        }
      }
    }

    void checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        if (active) {
          setUser(null);
          setAllowed(false);
          setLoading(false);
          if (options.redirectToLogin) {
            router.replace("/admin/login");
          }
        }
      } else {
        void checkAuth();
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router, options.redirectToLogin]);

  return { user, userName, allowed, loading };
}
