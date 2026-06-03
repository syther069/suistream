import { Database, ServerCog } from "lucide-react";

export function StorageStatus() {
  return (
    <div className="rounded-lg border border-outline-soft bg-surface-container p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold">Walrus Storage</h4>
          <p className="text-xs text-on-muted">Global availability: 99.9%</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-on-muted">Storage period</span>
          <span className="font-mono">3 epochs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-muted">Deletable</span>
          <span className="font-mono">true</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-muted">Bundle mode</span>
          <span className="font-mono">media + metadata</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-outline-soft pt-4 text-xs text-on-muted">
        <ServerCog className="h-4 w-4 text-primary" />
        Mainnet publisher and aggregator endpoints configured
      </div>
    </div>
  );
}
