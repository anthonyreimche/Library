// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// Registers the Library module: the photo grid and list with its toolbar and
// culling shortcuts. It was built into Safelight until 3.2.0 and keeps the
// module id "library", so saved layouts, pop-out windows and shortcuts that
// name it still find it.

import { LibraryStatusBar, LibraryView } from "./LibraryView";
import { toolbarCss } from "./LibraryToolbar";
import { gridCss } from "./LibraryGrid";
import { initRuntime } from "./rt";
import type { SafelightAPI } from "./safelight";

export const MODULE_ID = "library";
export const STYLESHEET_ID = "safelight.library.styles";

export function activate(host: SafelightAPI): void {
  initRuntime(host);
  host.registerStylesheet({
    id: STYLESHEET_ID,
    css: `${toolbarCss(host.ui.tokens).trim()}\n${gridCss(host.ui.tokens).trim()}\n`,
  });
  host.registerModule({
    id: MODULE_ID,
    label: "Library",
    component: LibraryView,
    statusBar: LibraryStatusBar,
  });
}
