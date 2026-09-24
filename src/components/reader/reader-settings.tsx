"use client";

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useReaderStore } from "@/stores/reader-store";
import type { ReaderFlow, ReaderFont, ReaderTheme, ReaderWidth } from "@/types/reader";

const themes: Array<{ value: ReaderTheme; label: string; className: string }> = [
  { value: "light", label: "Light", className: "bg-[#fffdf8] text-[#292c29]" },
  { value: "sepia", label: "Sepia", className: "bg-[#f2e7cf] text-[#3d3429]" },
  { value: "dark", label: "Dark", className: "bg-[#1d2421] text-[#e9e5dc]" },
];

export function ReaderSettings() {
  const { preferences, settingsOpen, setSettingsOpen, setPreferences, resetPreferences } = useReaderStore();
  return (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent side="right" className="w-[min(92vw,390px)] overflow-y-auto p-0">
        <SheetHeader className="border-b px-6 py-5"><SheetTitle className="font-heading text-2xl">Reading appearance</SheetTitle><SheetDescription>These settings apply to every book.</SheetDescription></SheetHeader>
        <div className="space-y-8 p-6">
          <fieldset><legend className="mb-3 text-sm font-medium">Theme</legend><div className="grid grid-cols-3 gap-2">{themes.map((theme) => <button key={theme.value} type="button" onClick={() => setPreferences({ theme: theme.value })} aria-pressed={preferences.theme === theme.value} className={cn("flex h-20 items-end rounded-[10px] border p-3 text-sm transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", theme.className, preferences.theme === theme.value && "ring-2 ring-primary ring-offset-2")}><span>{theme.label}</span></button>)}</div></fieldset>
          <SettingRow label="Typeface"><Select value={preferences.fontFamily} onValueChange={(value) => setPreferences({ fontFamily: value as ReaderFont })}><SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="serif">Literary serif</SelectItem><SelectItem value="sans">Clean sans</SelectItem></SelectContent></Select></SettingRow>
          <div><div className="mb-4 flex items-center justify-between"><label htmlFor="font-size" className="text-sm font-medium">Font size</label><span className="text-sm tabular-nums text-muted-foreground">{preferences.fontSize}px</span></div><Slider id="font-size" min={14} max={28} step={1} value={[preferences.fontSize]} onValueChange={([value]) => setPreferences({ fontSize: value })} aria-label="Font size" /></div>
          <div><div className="mb-4 flex items-center justify-between"><label htmlFor="line-height" className="text-sm font-medium">Line height</label><span className="text-sm tabular-nums text-muted-foreground">{preferences.lineHeight.toFixed(1)}</span></div><Slider id="line-height" min={1.3} max={2} step={0.1} value={[preferences.lineHeight]} onValueChange={([value]) => setPreferences({ lineHeight: value })} aria-label="Line height" /></div>
          <SettingRow label="Reading width"><Select value={preferences.contentWidth} onValueChange={(value) => setPreferences({ contentWidth: value as ReaderWidth })}><SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="narrow">Narrow</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="wide">Wide</SelectItem></SelectContent></Select></SettingRow>
          <SettingRow label="Layout"><Select value={preferences.flow} onValueChange={(value) => setPreferences({ flow: value as ReaderFlow })}><SelectTrigger className="h-10 w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="paginated">Pages</SelectItem><SelectItem value="scrolled">Scroll</SelectItem></SelectContent></Select></SettingRow>
          <p className="rounded-[10px] bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">In Pages layout, use <kbd className="font-sans text-foreground">Left Arrow</kbd> and <kbd className="font-sans text-foreground">Right Arrow</kbd> to turn pages.</p>
          <Button variant="outline" className="h-10 w-full" onClick={resetPreferences}><ArrowCounterClockwiseIcon aria-hidden /> Reset appearance</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-sm font-medium">{label}</span>{children}</div>;
}
