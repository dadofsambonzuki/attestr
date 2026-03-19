import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

import { Card, CardContent } from '@/components/ui/card';
import { AssertionSearchPanel } from './AssertionSearchPanel';
import { AssertionPreview } from './AssertionPreview';

export function AttestrWorkspace() {
  const [selectedAssertion, setSelectedAssertion] = useState<NostrEvent | undefined>();

  return (
    <section className="space-y-8" id="workspace">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <AssertionSearchPanel
            selected={selectedAssertion}
            onSelect={setSelectedAssertion}
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-3 py-5">
              <p className="text-sm font-medium">Selected assertion</p>
              <AssertionPreview
                event={selectedAssertion}
                fallbackLabel="Pick one assertion event from search results to start attesting."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
