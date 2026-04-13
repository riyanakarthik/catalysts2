import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { getStoredUser, clearSession } from '../api/auth';
import Logo from './Logo';
import AmbientBackground from './AmbientBackground';

const workerLinks = [
  { to: '/plan', label: 'Plan Selection' },
  { to: '/worker', label: 'Dashboard' },
  { to: '/claims', label: 'My Claims' },
];

const adminLinks = [
  { to: '/admin', label: 'Admin Dashboard' },
  { to: '/claims', label: 'All Claims' }
];

const navItemClass = ({ isActive }) =>
  `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
    isActive
      ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20'
      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
  }`;

export default function Layout() {
  const navigate = useNavigate();

  const user = getStoredUser();
  const role = user?.role || "WORKER";

  const links = role === "ADMIN" ? adminLinks : workerLinks;

  const logout = () => {
    clearSession(role);
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <AmbientBackground />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/60 backdrop-blur-xl">
        <div className="mx-auto w-full px-8 py-5 md:px-16">
          
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            
            {/* LEFT SIDE */}
            <div className="flex items-center gap-3">
              <Logo size={34} />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">
                  GigShield
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  AI-Powered Protection
                </p>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex flex-wrap items-center gap-6">

              {/* NAV LINKS */}
              <nav className="flex flex-wrap gap-2">
                {links.map((link) => (
                  <NavLink key={link.to} className={navItemClass} to={link.to}>
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              {/* USER INFO */}
              {user && (
                <div className="flex items-center gap-4 lg:ml-2">
                  <div className="hidden h-8 w-[1px] bg-white/10 sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-tighter">Role</span>
                    <span className="text-xs font-black bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-md uppercase">
                       {role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                  >
                    Logout
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full px-8 py-12 md:px-16">
        <Outlet />
      </main>

    </div>
  );
}