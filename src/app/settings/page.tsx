import type { Metadata } from "next";
import { PageShell } from "@/components/pages/PageShell";
import { SettingsPanel } from "@/components/pages/SettingsPanel";

export const metadata: Metadata = { title: "設定 | KYRE Schedule" };

export default function SettingsPage() {
  return (
    <PageShell title="設定">
      <SettingsPanel />
    </PageShell>
  );
}
