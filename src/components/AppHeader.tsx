import { NavLink, useLocation } from 'react-router-dom';

import { LoginArea } from '@/components/auth/LoginArea';

export function AppHeader() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3 rounded-md p-1 transition hover:bg-slate-100/80">
          <img
            src="/images/attestr-icon.png"
            alt="Attestr"
            className={`${isHome ? 'h-12 w-12' : 'h-10 w-10'} rounded-xl border border-slate-200 object-cover transition-all`}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Attestr</p>
            <p className="text-sm font-medium text-slate-700">Notaries on Nostr</p>
          </div>
        </NavLink>

        <nav className="flex items-center gap-2 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/attest"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            Attest
          </NavLink>
          <NavLink
            to="/attestations"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            Attestations
          </NavLink>
        </nav>

        <LoginArea className="w-full sm:w-auto" />
      </div>
    </header>
  );
}
