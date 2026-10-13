"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BUFFER_OPTIONS, DURATION_OPTIONS, type Settings } from "@/lib/types";

export function SettingsControls({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (settings: Settings) => void;
}) {
  return (
    <>
      <SegmentedControl
        label="所要時間"
        options={DURATION_OPTIONS}
        value={settings.durationMinutes}
        onChange={(durationMinutes) => onChange({ ...settings, durationMinutes })}
        format={(v) => `${v}分`}
      />
      <SegmentedControl
        label="前後の余裕時間（移動・準備）"
        options={BUFFER_OPTIONS}
        value={settings.bufferMinutes}
        onChange={(bufferMinutes) => onChange({ ...settings, bufferMinutes })}
        format={(v) => (v === 0 ? "なし" : `${v}分`)}
      />
    </>
  );
}
