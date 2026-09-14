"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { PaymentGatewayManager } from "@/components/admin/PaymentGatewayManager";
import { Link } from "@/components/ui/link";

export default function AdminPaymentGatewayPage() {
  return (
    <AdminShell>
      <div className="space-y-5">
        <nav className="flex flex-wrap items-center gap-1.5 text-lg font-semibold text-foreground sm:text-xl">
          <Link to="/admin/dashboard" className="transition hover:text-sale">
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link to="/admin/settings" className="transition hover:text-sale">
            Settings
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">Payment Gateway</span>
        </nav>

        <div className="max-w-6xl">
          <PaymentGatewayManager />
        </div>
      </div>
    </AdminShell>
  );
}
