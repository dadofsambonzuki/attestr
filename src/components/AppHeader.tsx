import { NavLink } from 'react-router-dom';

import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getProfilePath } from '@/lib/nostrEncodings';

export function AppHeader() {
  const { user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-3 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <NavLink to="/" className="flex items-center gap-3 rounded-md p-1 transition hover:bg-slate-100/80">
          <img
            src="/images/attestr-icon.png"
            alt="Attestr"
            className="h-10 w-10 rounded-xl border border-slate-200 object-cover"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Attestr</p>
            <p className="text-sm font-medium text-slate-700">Notaries on Nostr</p>
          </div>
        </NavLink>

        <nav className="flex flex-wrap items-center gap-2 text-sm md:justify-center">
          <NavLink
            to="/attest"
            className={({ isActive }) =>
              `inline-flex h-10 items-center justify-center rounded-md px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            Attest
          </NavLink>
          <NavLink
            to="/attestations"
            className={({ isActive }) =>
              `inline-flex h-10 items-center justify-center rounded-md px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            Attestations
          </NavLink>
          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              `inline-flex h-10 items-center justify-center rounded-md px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            Marketplace
          </NavLink>
          <NavLink
            to="/developers"
            className={({ isActive }) =>
              `inline-flex h-10 items-center justify-center rounded-md px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
            }
          >
            Developers
          </NavLink>
          {user ? (
            <NavLink
              to={getProfilePath(user.pubkey)}
              className={({ isActive }) =>
                `inline-flex h-10 items-center justify-center rounded-md px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              Profile
            </NavLink>
          ) : null}
        </nav>

        <div className="flex min-h-11 md:justify-end">
          <LoginArea className="w-full md:w-[260px]" />
        </div>
      </div>
    </header>
  );
}
