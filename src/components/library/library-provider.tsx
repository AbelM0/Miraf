"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { LibraryService } from "@/lib/services/library-service";
import { useReaderStore } from "@/stores/reader-store";
import type { SyncStatus } from "@/types/sync";

type LibraryContext = { service: LibraryService; syncStatus: SyncStatus; retrySync: () => void };
const Context = createContext<LibraryContext | null>(null);
export function LibraryProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const { getToken } = useAuth();
  const accessToken = useCallback(
    () => typeof window === "undefined" ? Promise.resolve(null) : getToken(),
    [getToken],
  );
  const service = useMemo(() => new LibraryService(userId, accessToken), [accessToken, userId]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("syncing");
  const runSync = useCallback(async () => {
    if (!navigator.onLine) { setSyncStatus("offline"); return; }
    setSyncStatus("syncing");
    try { await service.sync(); setSyncStatus("idle"); }
    catch { setSyncStatus("error"); }
  }, [service]);
  useEffect(() => {
    let stopPreferences: (() => void) | undefined;
    void service.initializePreferences().then((preferences) => {
      useReaderStore.getState().replacePreferences(preferences);
      stopPreferences = useReaderStore.subscribe((state, previous) => { if (state.preferences !== previous.preferences) void service.savePreferences(state.preferences); });
    });
    const initialSync = window.setTimeout(() => void runSync(), 0);
    const onOnline = () => void runSync(); const onOffline = () => setSyncStatus("offline"); const onVisible = () => { if (document.visibilityState === "visible") void runSync(); };
    window.addEventListener("online", onOnline); window.addEventListener("offline", onOffline); document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearTimeout(initialSync); stopPreferences?.(); window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); document.removeEventListener("visibilitychange", onVisible); };
  }, [runSync, service]);
  const value = useMemo(() => ({ service, syncStatus, retrySync: () => void runSync() }), [runSync, service, syncStatus]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLibraryService() { const context = useContext(Context); if (!context) throw new Error("LibraryProvider is missing."); return context.service; }
export function useLibrarySyncStatus() { const context = useContext(Context); if (!context) throw new Error("LibraryProvider is missing."); return { status: context.syncStatus, retry: context.retrySync }; }
