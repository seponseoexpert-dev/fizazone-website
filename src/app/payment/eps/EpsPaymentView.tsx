"use client";

import { useEffect, useState, Suspense } from "react";
import { Link } from "@/components/ui/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Header } from "@/components/shop/Header";
import { verifyEpsPayment } from "@/lib/eps.functions";

type Result = {
  paid: boolean;
  status: string;
  amount: number;
  epsTransactionId: string;
  financialEntity: string;
  message: string;
};

function EpsPaymentContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const mtid =
      searchParams.get("mtid") ??
      searchParams.get("merchantTransactionId") ??
      searchParams.get("MerchantTransactionId");
    if (!mtid) {
      setError("Missing transaction reference.");
      return;
    }
    (async () => {
      try {
        setResult(await verifyEpsPayment({ merchant_transaction_id: mtid }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not verify the payment.");
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="shop-container py-10">
        <div className="mx-auto grid max-w-md place-items-center rounded-2xl border border-border bg-card px-5 py-12 text-center card-elevated">
          {!result && !error ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Verifying your payment…</p>
            </>
          ) : error ? (
            <>
              <XCircle className="h-12 w-12 text-sale" />
              <h1 className="mt-4 text-xl font-extrabold">Payment not verified</h1>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </>
          ) : result?.paid ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-brand-green" />
              <h1 className="mt-4 text-xl font-extrabold">Payment successful</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                ৳{result.amount.toFixed(0)} paid via {result.financialEntity || "EPS"}.
              </p>
              <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                Transaction ID: <span className="font-semibold text-foreground">{result.epsTransactionId}</span>
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-sale" />
              <h1 className="mt-4 text-xl font-extrabold">Payment {result?.status ?? "failed"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {result?.message || "The payment was not completed. You can try again from checkout."}
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/track-order"
              className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold"
            >
              Track order
            </Link>
            <Link
              to="/categories"
              className="inline-flex h-11 items-center rounded-full bg-sale px-6 text-sm font-semibold text-primary-foreground"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export function EpsPaymentView() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="shop-container py-10">
            <div className="mx-auto grid max-w-md place-items-center rounded-2xl border border-border bg-card px-5 py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
            </div>
          </main>
        </div>
      }
    >
      <EpsPaymentContent />
    </Suspense>
  );
}
