import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, CircleNotch } from "@phosphor-icons/react";

export function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [state, setState] = useState("checking");
  const [result, setResult] = useState(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return setState("error");
    let timer;
    const poll = async () => {
      attempts.current += 1;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setResult(data);
          setState("paid");
          return;
        }
        if (["failed", "expired"].includes(data.payment_status)) return setState("failed");
      } catch {}
      if (attempts.current >= 12) return setState("timeout");
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="max-w-lg mx-auto px-5 py-24 text-center">
      {state === "checking" && (
        <div data-testid="payment-checking">
          <CircleNotch size={48} className="mx-auto animate-spin text-[#0A2540]" />
          <h1 className="font-display text-3xl font-bold mt-6">Confirming your payment…</h1>
          <p className="text-muted-foreground mt-2 text-sm">Hold on, this takes a few seconds.</p>
        </div>
      )}
      {state === "paid" && (
        <div data-testid="payment-success">
          <CheckCircle size={56} weight="duotone" className="mx-auto text-emerald-600" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-6">Payment successful!</h1>
          <p className="text-muted-foreground mt-2">
            {result?.purpose === "settlement" ? "Your settlement is recorded — the trip balances are updated." : "Your booking is confirmed. Safe travels!"}
          </p>
          <div className="flex justify-center gap-3 mt-8">
            {result?.purpose === "booking" && result?.metadata?.booking_id && (
              <Button asChild data-testid="payment-view-ticket-btn" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322]">
                <Link to={`/ticket/${result.metadata.booking_id}`}>View e-ticket</Link>
              </Button>
            )}
            {result?.purpose === "settlement" && result?.metadata?.trip_id && (
              <Button asChild data-testid="payment-view-trip-btn" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322]">
                <Link to={`/trips/${result.metadata.trip_id}`}>Back to trip</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      )}
      {(state === "failed" || state === "error" || state === "timeout") && (
        <div data-testid="payment-failed">
          <XCircle size={56} weight="duotone" className="mx-auto text-red-500" />
          <h1 className="font-display text-3xl font-bold mt-6">{state === "timeout" ? "Still processing" : "Payment not completed"}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {state === "timeout" ? "We couldn't confirm in time — check My Bookings in a minute." : "No money was taken. You can retry from your bookings."}
          </p>
          <Button asChild variant="outline" className="rounded-full mt-8">
            <Link to="/bookings">Go to my bookings</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export function PaymentCancel() {
  return (
    <div className="max-w-lg mx-auto px-5 py-24 text-center" data-testid="payment-cancelled">
      <XCircle size={56} weight="duotone" className="mx-auto text-amber-500" />
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-6">Payment cancelled</h1>
      <p className="text-muted-foreground mt-2">No charge was made. Your booking is saved as pending — complete it anytime.</p>
      <div className="flex justify-center gap-3 mt-8">
        <Button asChild data-testid="cancel-back-bookings-btn" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322]">
          <Link to="/bookings">My bookings</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
