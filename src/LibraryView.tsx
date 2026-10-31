// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

import { React, api } from "./rt";
import { LibraryToolbar } from "./LibraryToolbar";
import { LibraryGrid } from "./LibraryGrid";

// The module's main view: toolbar, the "library-subbar" slot (an extension's
// bar below the toolbar, which brings its own chrome) and the grid. Folders,
// Filters, Info and the other panels are placed by the dock around it.
export function LibraryView() {
  api.catalog.useCullingShortcuts();
  return (
    <>
      <LibraryToolbar />
      <api.components.Slot name="library-subbar" />
      <LibraryGrid />
    </>
  );
}

export function LibraryStatusBar() {
  const count = api.stores.useCatalogStore((s) => s.photos.length);
  return (
    <span>
      {count} photo{count !== 1 && "s"} in catalog
    </span>
  );
}
