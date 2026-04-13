import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const features = [
  { icon: "⚡", title: "Zero-Touch Claims", desc: "AI detects disruptions and auto-approves payouts — no forms, no waiting." },
  { icon: "🧠", title: "AI-Driven Pricing", desc: "Dynamic weekly premiums calculated using hyper-local risk & weather models." },
  { icon: "📡", title: "Live Trigger Engine", desc: "Rain, AQI spikes, platform outages — 3+ automated triggers running 24/7." },
  { icon: "💸", title: "Instant UPI Payout", desc: "Approved claims are settled directly to your UPI ID within minutes." },
];

const stats = [
  { value: "₹0", label: "Forms to fill" },
  { value: "3+", label: "Trigger types" },
  { value: "100%", label: "Automated payouts" },
  { value: "24/7", label: "Monitoring" },
];

export default function WelcomePage() {
  const navigate = useNavigate();

  const go = (role, path) => {
    localStorage.setItem("selectedRole", role);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="text-xl font-extrabold tracking-tight">GigShield</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => go("WORKER", "/login")}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white transition"
          >
            Sign In
          </button>
          <button
            onClick={() => go("WORKER", "/register")}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/30"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-5xl px-8 pt-16 pb-24 text-center md:px-16 md:pt-24">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          AI-Powered Parametric Income Insurance · Live
        </div>

        <h1 className="text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
          Income protection for
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            gig workers
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 md:text-xl">
          GigShield monitors weather, air quality, and platform disruptions in real time.
          When income is lost — claims are auto-approved and paid, instantly.
        </p>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => go("WORKER", "/register")}
            className="group inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-500 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
          >
            Register as Worker
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <button
            onClick={() => go("ADMIN", "/register")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 hover:-translate-y-0.5"
          >
            Register as Insurer
          </button>
        </div>

        <p className="mt-5 text-sm text-white/40">
          Already have an account?{" "}
          <span
            className="cursor-pointer text-indigo-400 hover:underline"
            onClick={() => go("WORKER", "/login")}
          >
            Sign in as Worker
          </span>{" "}
          ·{" "}
          <span
            className="cursor-pointer text-slate-400 hover:underline"
            onClick={() => go("ADMIN", "/login")}
          >
            Sign in as Insurer
          </span>
        </p>
      </section>

      {/* STATS */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-8 md:grid-cols-4 md:px-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-white md:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="relative z-10 mx-auto max-w-5xl px-8 py-24 md:px-16">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-indigo-400">How it works</p>
        <h2 className="mt-3 text-center text-4xl font-extrabold tracking-tight">
          Parametric insurance, reimagined
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-[24px] border border-white/5 bg-white/[0.04] p-7 backdrop-blur-sm transition hover:border-indigo-500/30 hover:bg-white/[0.07]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="relative z-10 mx-auto max-w-3xl px-8 pb-24 text-center md:px-16">
        <div className="rounded-[32px] border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 to-violet-600/10 p-12 backdrop-blur-sm">
          <Logo size={48} className="mx-auto mb-5" />
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Ready to get protected?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Join GigShield today and let AI handle your income protection automatically.
          </p>
          <button
            onClick={() => go("WORKER", "/register")}
            className="mt-8 inline-flex rounded-2xl bg-indigo-600 px-10 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition hover:bg-indigo-500 hover:-translate-y-0.5"
          >
            Start for free →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 text-center text-sm text-white/25 md:px-16">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Logo size={16} />
          <span className="font-semibold text-white/40">GigShield</span>
        </div>
        AI-powered parametric income insurance for gig workers
      </footer>
    </div>
  );
}