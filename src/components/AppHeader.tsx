import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';

import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getProfilePath } from '@/lib/nostrEncodings';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { to: '/attest', label: 'Attest' },
  { to: '/attestations', label: 'Attestations' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/developers', label: 'Developers' },
];

export function AppHeader() {
  const { user } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
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

        <nav className="hidden flex-wrap items-center gap-2 text-sm md:flex md:justify-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex h-10 items-center justify-center rounded-md px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
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

        <div className="flex items-center gap-2 md:justify-end">
          <div className="hidden min-h-11 md:flex">
            <LoginArea className="w-[260px]" />
          </div>
          <div className="flex md:hidden">
            <LoginArea className="w-auto" />
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-white p-0">
              <SheetHeader className="border-b border-slate-200/70 p-4 text-left">
                <SheetTitle className="text-sm font-semibold text-slate-900">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex h-11 items-center rounded-md px-3 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                {user ? (
                  <NavLink
                    to={getProfilePath(user.pubkey)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex h-11 items-center rounded-md px-3 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                    }
                  >
                    Profile
                  </NavLink>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
