import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { saveSession } from "../api/auth";
import AmbientBackground from "../components/AmbientBackground";
import Logo from "../components/Logo";

export default function LoginPage() {
  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/users/login", form);
      const data = res.data;

      // Store session under role-prefixed keys (admin_token/worker_token etc)
      saveSession(data.user.role, data.token, data.user);

      // redirect
      if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/worker");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />
      
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Logo size={48} className="mx-auto mb-4" />
            <h1 className="text-3xl font-black tracking-tight text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-white/50">Enter your credentials to access your dashboard</p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl md:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-white/20 transition focus:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-white/20 transition focus:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  required
                />
              </div>

              {error && (
                <p className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-400">
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/20 transition hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0"
              >
                Sign In
              </button>
            </form>

            <div className="mt-8 border-t border-white/5 pt-6 text-center">
              <p className="text-sm text-white/40">
                New to GigShield?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="font-bold text-indigo-400 hover:text-indigo-300 transition"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}