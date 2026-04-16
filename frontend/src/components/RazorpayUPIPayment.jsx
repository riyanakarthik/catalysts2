import { useState, useEffect, useCallback } from "react";
import api from "../api/client";

// ─── Utility: load Razorpay checkout script ───────────────────────────────────
function useRazorpayScript() {
  const [ready, setReady] = useState(!!window.Razorpay);
  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setReady(true);
    script.onerror = () => console.error("Failed to load Razorpay SDK");
    document.body.appendChild(script);
  }, []);
  return ready;
}

/**
 * RazorpayUPIPayment
 *
 * Props:
 *   amountPaise  — amount in paise (e.g. 3500 for ₹35)
 *   planType     — 'BASIC' | 'STANDARD' | 'PREMIUM'
 *   user         — { fullName, phone, upiId }
 *   onSuccess    — callback({ paymentId, policy })
 *   onCancel     — callback()
 */
export default function RazorpayUPIPayment({
  amountPaise,
  planType,
  user,
  onSuccess = () => { },
  onCancel = () => { },
}) {
  const razorpayReady = useRazorpayScript();
  const [status, setStatus] = useState(null); // null | 'processing' | 'success' | 'failed' | 'cancelled'
  const [paymentRef, setPaymentRef] = useState(null);

  const amountINR = (amountPaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

  const handlePay = useCallback(async () => {
    if (!razorpayReady) return;
    setStatus("processing");

    // 1. Create Razorpay order via our backend
    let rzpOrder;
    try {
      const { data } = await api.post("/payment/create-order", {
        amount: amountPaise,
        currency: "INR",
        planType,
      });
      rzpOrder = data;
    } catch (err) {
      setStatus("failed");
      return;
    }

    // 2. Fetch Razorpay key from backend
    let razorpayKey;
    try {
      const { data } = await api.get("/payment/key");
      razorpayKey = data.key;
    } catch {
      razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    }

    // 3. Open Razorpay Checkout
    const options = {
      key: razorpayKey,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: "InsuriFyx",
      description: `${planType} Plan — Weekly Premium`,
      order_id: rzpOrder.id,
      prefill: {
        name: user?.fullName || "",
        contact: user?.phone || "",
      },
      theme: { color: "#6366f1" },

      handler: async function (response) {
        // 4. Verify payment on our backend
        try {
          const { data } = await api.post("/payment/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planType,
          });

          if (data.verified) {
            setPaymentRef(response.razorpay_payment_id);
            setStatus("success");
            onSuccess({ paymentId: response.razorpay_payment_id, policy: data.policy });
          } else {
            setStatus("failed");
          }
        } catch {
          setStatus("failed");
        }
      },

      modal: {
        ondismiss: () => {
          setStatus("cancelled");
          onCancel();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", () => setStatus("failed"));
    rzp.open();
  }, [razorpayReady, amountPaise, planType, user, onSuccess, onCancel]);

  return (
    <div className="space-y-4">
      {/* Status messages */}
      {status === "success" && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-sm font-bold text-emerald-400">✓ Payment successful</p>
          <p className="mt-1 text-xs text-emerald-300/60">Ref: {paymentRef}</p>
        </div>
      )}
      {status === "failed" && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
          <p className="text-sm font-bold text-rose-400">✕ Payment failed</p>
          <p className="mt-1 text-xs text-rose-300/60">Please try again.</p>
        </div>
      )}
      {status === "cancelled" && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-sm font-bold text-amber-400">Payment cancelled</p>
          <p className="mt-1 text-xs text-amber-300/60">You closed the payment window.</p>
        </div>
      )}

      {/* Pay button */}
      {status !== "success" && (
        <button
          onClick={handlePay}
          disabled={!razorpayReady || status === "processing"}
          className="w-full rounded-2xl bg-indigo-600 py-5 text-base font-black uppercase tracking-[0.1em] text-white shadow-xl shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "processing"
            ? "Opening Razorpay..."
            : `Pay ${amountINR} & Activate`}
        </button>
      )}

      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-white/20">
        🔒 Secured by Razorpay · 256-bit SSL
      </p>
    </div>
  );
}
