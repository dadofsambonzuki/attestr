// NOTE: This file should normally not be modified unless you are adding a new provider.
// To add new routes, edit the AppRouter.tsx file.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createHead, UnheadProvider } from '@unhead/react/client';
import { InferSeoMetaPlugin } from '@unhead/addons';
import { Suspense } from 'react';
import NostrProvider from '@/components/NostrProvider';
import { NostrSync } from '@/components/NostrSync';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { NWCProvider } from '@/contexts/NWCContext';
import { DMProvider, type DMConfig } from '@/components/DMProvider';
import { PROTOCOL_MODE } from '@/lib/dmConstants';
import { AppConfig } from '@/contexts/AppContext';
import AppRouter from './AppRouter';
import { Footer } from '@/components/Footer';

const dmConfig: DMConfig = {
  enabled: true,
  protocolMode: PROTOCOL_MODE.NIP17_ONLY,
};

const head = createHead({
  plugins: [
    InferSeoMetaPlugin(),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
      gcTime: Infinity,
    },
  },
});

const defaultConfig: AppConfig = {
  theme: "light",
  relayMetadata: {
    relays: [
      { url: 'wss://relay.ditto.pub', read: true, write: true },
      { url: 'wss://relay.primal.net', read: true, write: true },
      { url: 'wss://relay.damus.io', read: true, write: true },
    ],
    updatedAt: 0,
  },
  featuredAttestations: [
    'naddr1qvzqqqru0upzq04ty37x8we4m73cup72zqhkmg5t4xuag6r3ja6rhh369vwcpthdqqsxxdrxx4jnwcfh8fnrgdpj8yer2en9xs6xvw33xumn2d34xqcrqvcym5a4c',
    'naddr1qvzqqqru0upzq04ty37x8we4m73cup72zqhkmg5t4xuag6r3ja6rhh369vwcpthdqqsxxdrxx4jnwcfh8fsnqvec8psnyd3589snzw33xumngwfe8qmrsdsp4ge5a',
    'naddr1qvzqqqru0upzp384u7n44r8rdq74988lqcmggww998jjg0rtzfd6dpufrxy9djk8qqsxze34v9snswfc8fnx2vfs8pnx2cnz8yunww33xumnxwf5xy6nydqggcc8a',
  ],
};

export function App() {
  return (
    <UnheadProvider head={head}>
      <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig}>
        <QueryClientProvider client={queryClient}>
          <NostrLoginProvider storageKey='nostr:login'>
            <NostrProvider>
              <NostrSync />
              <DMProvider config={dmConfig}>
              <NWCProvider>
                <TooltipProvider>
                  <Toaster />
                  <Suspense>
                    <AppRouter />
                  </Suspense>
                  <Footer />
                </TooltipProvider>
              </NWCProvider>
              </DMProvider>
            </NostrProvider>
          </NostrLoginProvider>
        </QueryClientProvider>
      </AppProvider>
    </UnheadProvider>
  );
}

export default App;
