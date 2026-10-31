// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

import { React, api } from "./rt";
import type { UiTokens } from "./safelight";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "dateImported", label: "Imported" },
  { value: "dateCreated", label: "Captured" },
  { value: "filename", label: "Name" },
  { value: "rating", label: "Rating" },
];

const C = "sl-library-toolbar";

export function toolbarCss(t: UiTokens): string {
  const button = `border-radius: 0.25rem; font-size: 11px; color: ${t.textSecondary};`;
  return `
:where(.${C}) { position: relative; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${t.borderSubtle}; background: ${t.surface1}; padding: 6px 12px; }
:where(.${C}-progress) { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: ${t.surface3}; }
:where(.${C}-progress-fill) { height: 100%; background: ${t.accent}; transition: width 150ms ease-out; }
:where(.${C}-group) { display: flex; align-items: center; gap: 8px; }
:where(.${C}-sort) { display: flex; align-items: center; gap: 4px; }
:where(.${C}-status) { font-size: 10px; color: ${t.textMuted}; }
:where(.${C}-action) { ${button} background: ${t.surface3}; padding: 4px 10px; }
:where(.${C}-action):hover { background: ${t.surface4}; color: ${t.textPrimary}; }
:where(.${C}-rotate) { padding: 4px 8px; }
:where(.${C}-danger):hover { color: ${t.labelRed}; }
:where(.${C}-stop) { padding: 2px 8px; font-size: 10px; }
:where(.${C}-direction) { ${button} background: ${t.surface2}; padding: 4px 6px; }
:where(.${C}-direction):hover { color: ${t.textPrimary}; }
:where(.${C}-modes) { display: flex; border-radius: 0.25rem; background: ${t.surface2}; }
:where(.${C}-mode) { padding: 4px 8px; font-size: 11px; color: ${t.textMuted}; }
:where(.${C}-mode)[aria-pressed="true"] { background: ${t.surface3}; color: ${t.textPrimary}; }
:where(.${C}-mode):first-child { border-radius: 0.25rem 0 0 0.25rem; }
:where(.${C}-mode):last-child { border-radius: 0 0.25rem 0.25rem 0; }
:where(.${C}-size) { width: 96px; }
`;
}

export function LibraryToolbar() {
  const { useUIStore, useCatalogStore, useProjectStore, useSettings } = api.stores;
  const { Slider } = api.components;
  const { Select } = api.ui;
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);
  const gridSize = useUIStore((s) => s.gridSize);
  const setGridSize = useUIStore((s) => s.setGridSize);
  const sortField = useUIStore((s) => s.sortField);
  const sortDirection = useUIStore((s) => s.sortDirection);
  const setSort = useUIStore((s) => s.setSort);
  const removePhotos = useCatalogStore((s) => s.removePhotos);
  const rotatePhotos = useCatalogStore((s) => s.rotatePhotos);
  const photos = useCatalogStore((s) => s.photos);
  const selectedIds = useCatalogStore((s) => s.selectedIds);
  const stopImport = useProjectStore((s) => s.stopImport);
  const importDone = useProjectStore((s) => s.importDone);
  const importTotal = useProjectStore((s) => s.importTotal);
  const importing = importTotal > 0 && importDone < importTotal;
  const importPct = importing ? Math.round((importDone / importTotal) * 100) : 0;
  const sortRecord = api.registry.use((s) => s.librarySorts);
  const librarySorts = React.useMemo(() => Object.values(sortRecord), [sortRecord]);

  const handleRemove = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (useSettings.getState().confirmRemovePhotos) {
      const ok = await api.ui.confirmDialog({
        title: "Remove from catalog",
        message: `Remove ${ids.length} photo${ids.length === 1 ? "" : "s"} from the catalog? The original file${ids.length === 1 ? "" : "s"} on disk won't be deleted, and won't be re-imported on the next folder scan.`,
        confirmLabel: "Remove",
      });
      if (!ok) return;
    }
    void removePhotos(ids);
  };

  const handleExportData = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const n = await api.catalog.exportPhotoData(ids);
    await api.ui.alertDialog({
      title: "Export data",
      message: `Wrote ${n} sidecar file${n === 1 ? "" : "s"} (“<name>.safelight.json”) next to the selected photo${ids.length === 1 ? "" : "s"}. Move the photos with their sidecars and the next project to scan them will pick up the ratings, labels and edits.`,
    });
  };

  return (
    <div className={C}>
      {importing && (
        <div className={`${C}-progress`} title={`Importing ${importDone} / ${importTotal}`}>
          <div className={`${C}-progress-fill`} style={{ width: `${importPct}%` }} />
        </div>
      )}
      <div className={`${C}-group`}>
        <api.components.Slot name="library-toolbar" />
        <span className={`${C}-status`} role="status" aria-live="polite">
          {importing
            ? `Importing ${importDone}/${importTotal}…`
            : `${photos.length} photos${selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}`}
        </span>
        {importing && (
          <button
            onClick={stopImport}
            className={`${C}-action ${C}-stop ${C}-danger`}
            title="Stop importing new photos (already-imported photos are kept)"
          >
            Stop
          </button>
        )}
        {selectedIds.size > 0 && (
          <>
            <button
              onClick={() => void rotatePhotos([...selectedIds], -90)}
              title="Rotate 90° counter-clockwise ( [ )"
              aria-label="Rotate 90° counter-clockwise"
              className={`${C}-action ${C}-rotate`}
            >
              <span aria-hidden="true">{"⟲"}</span>
            </button>
            <button
              onClick={() => void rotatePhotos([...selectedIds], 90)}
              title="Rotate 90° clockwise ( ] )"
              aria-label="Rotate 90° clockwise"
              className={`${C}-action ${C}-rotate`}
            >
              <span aria-hidden="true">{"⟳"}</span>
            </button>
            <button
              onClick={() => void handleExportData()}
              title="Write .safelight.json sidecars (ratings, labels, edits) next to the selected files so the data follows them to another project"
              className={`${C}-action`}
            >
              Export Data
            </button>
            <button onClick={() => void handleRemove()} className={`${C}-action ${C}-danger`}>
              Remove
            </button>
          </>
        )}
      </div>

      <div className={`${C}-group`}>
        <div className={`${C}-sort`}>
          <Select
            value={sortField}
            onChange={(v) => setSort(v, sortDirection)}
            ariaLabel="Sort photos by"
            style={{ width: "auto" }}
            groups={[
              { items: SORT_OPTIONS },
              ...(librarySorts.length > 0
                ? [{ title: "Metadata", items: librarySorts.map((o) => ({ value: o.id, label: o.label })) }]
                : []),
            ]}
          />
          <button
            onClick={() => setSort(sortField, sortDirection === "asc" ? "desc" : "asc")}
            className={`${C}-direction`}
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
            aria-label={`Sort direction: ${sortDirection === "asc" ? "ascending" : "descending"}`}
          >
            <span aria-hidden="true">{sortDirection === "asc" ? "↑" : "↓"}</span>
          </button>
        </div>

        <div className={`${C}-modes`} role="group" aria-label="View mode">
          <button
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            className={`${C}-mode`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`${C}-mode`}
          >
            List
          </button>
        </div>

        <div className={`${C}-size`}>
          <Slider
            label=""
            ariaLabel="Thumbnail size"
            hideValue
            value={gridSize}
            min={api.catalog.gridSize.min}
            max={api.catalog.gridSize.max}
            step={api.catalog.gridSize.step}
            defaultValue={200}
            onChange={setGridSize}
          />
        </div>
      </div>
    </div>
  );
}
