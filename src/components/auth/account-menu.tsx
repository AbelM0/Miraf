"use client";

import { UserButton } from "@clerk/nextjs";
import { BooksIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export function AccountMenu({ hasLegacyBooks, onShowMigration }: { hasLegacyBooks?: boolean; onShowMigration?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {hasLegacyBooks && (
        <Button type="button" variant="ghost" size="sm" className="hidden gap-2 sm:flex" onClick={onShowMigration}>
          <BooksIcon aria-hidden />
          Sync browser books
        </Button>
      )}
      <UserButton />
    </div>
  );
}
