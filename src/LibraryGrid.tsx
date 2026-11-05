// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

import type { DragEvent, MouseEvent } from "react";
import { React, api } from "./rt";
import type { CatalogPhoto, UiTokens } from "./safelight";

const C = "sl-library-grid";

/** The data a photo drag carries, read by the Folders panel's drop targets. */
export const PHOTOS_DRAG_TYPE = "application/x-safelight-photos";

export function gridCss(t: UiTokens): string {
  return `
:where(.${C}) { flex: 1 1 0%; }
:where(.${C}-empty) { display: flex; flex: 1 1 0%; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: ${t.textMuted}; }
:where(.${C}-empty-title) { font-size: 0.875rem; line-height: 1.25rem; }
:where(.${C}-empty-hint) { font-size: 0.75rem; line-height: 1rem; }
:where(.${C}-clear) { border-radius: 0.25rem; background: ${t.surface3}; padding: 4px 10px; font-size: 11px; color: ${t.textSecondary}; }
:where(.${C}-clear):hover { background: ${t.surface4}; color: ${t.textPrimary}; }
`;
}

const getKey = (p: CatalogPhoto) => p.id;

export function LibraryGrid() {
  const { useCatalogStore, useUIStore } = api.stores;
  const { Thumbnail, PhotoListRow, VirtualGrid } = api.components;
  const photos = useCatalogStore((s) => s.photos);
  const selectedIds = useCatalogStore((s) => s.selectedIds);
  const activePhotoId = useCatalogStore((s) => s.activePhotoId);
  const select = useCatalogStore((s) => s.select);
  const toggleSelect = useCatalogStore((s) => s.toggleSelect);
  const selectRange = useCatalogStore((s) => s.selectRange);
  const setRating = useCatalogStore((s) => s.setRating);
  const setActivePhoto = useCatalogStore((s) => s.setActivePhoto);
  const deselectAll = useCatalogStore((s) => s.deselectAll);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const setGridColumns = useUIStore((s) => s.setGridColumns);
  const gridSize = useUIStore((s) => s.gridSize);
  const viewMode = useUIStore((s) => s.viewMode);
  const clearFilters = useUIStore((s) => s.clearFilters);

  const visible = api.catalog.useVisiblePhotos();

  // The right-click menu and its dialogues, shared with every other photo surface.
  const { onContextMenu: handleContextMenu, overlays } = api.catalog.usePhotoActions();

  const activeIndex = React.useMemo(
    () => (activePhotoId ? visible.findIndex((p) => p.id === activePhotoId) : -1),
    [activePhotoId, visible],
  );

  // Stable handlers (passed to every memoized cell) so a selection re-renders
  // only the cells whose selected/active flipped. The on-screen order for
  // shift-range and the live selection for drag are read through refs / the
  // store at call time, so these callbacks never need to change identity.
  const visibleRef = React.useRef(visible);
  visibleRef.current = visible;

  const handleClick = React.useCallback(
    (id: string, e: MouseEvent) => {
      if (e.shiftKey) {
        selectRange(id, visibleRef.current.map((p) => p.id));
      } else if (e.ctrlKey || e.metaKey) {
        toggleSelect(id);
      } else {
        select(id);
      }
    },
    [select, toggleSelect, selectRange],
  );

  const handleDoubleClick = React.useCallback(
    (id: string) => {
      setActivePhoto(id);
      setActiveModule("develop");
    },
    [setActivePhoto, setActiveModule],
  );

  // Clicking the grid's empty space (between or around the cells) — anything that
  // isn't a photo cell — clears the selection. A click that lands on a thumbnail
  // bubbles here too, but its data-photo-id ancestor exempts it.
  const handleBackgroundClick = React.useCallback(
    (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-photo-id]")) deselectAll();
    },
    [deselectAll],
  );

  // Drag photos onto a Folders-panel folder to move them. Dragging a photo
  // that's part of the current selection drags the whole selection; dragging an
  // unselected one drags just it.
  const handleDragStart = React.useCallback(
    (id: string, e: DragEvent) => {
      const sel = useCatalogStore.getState().selectedIds;
      const ids = sel.has(id) ? [...sel] : [id];
      e.dataTransfer.setData(PHOTOS_DRAG_TYPE, JSON.stringify(ids));
      e.dataTransfer.effectAllowed = "move";
    },
    [useCatalogStore],
  );

  const handleRate = React.useCallback(
    (id: string, rating: number) => void setRating(id, rating),
    [setRating],
  );

  if (photos.length === 0) {
    return (
      <div className={`${C}-empty`}>
        <p className={`${C}-empty-title`}>No photos imported</p>
        <p className={`${C}-empty-hint`}>
          Click <strong>+ Files</strong> or <strong>+ Folder</strong> to get started
        </p>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className={`${C}-empty`}>
        <p className={`${C}-empty-title`}>No photos match the current filter</p>
        <button onClick={clearFilters} className={`${C}-clear`}>
          Clear filters
        </button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <>
        <VirtualGrid
          items={visible}
          cellHeight={53}
          columns={1}
          overscan={6}
          getKey={getKey}
          scrollToIndex={activeIndex >= 0 ? activeIndex : undefined}
          onColumnsChange={setGridColumns}
          onClick={handleBackgroundClick}
          className={C}
          renderCell={(photo) => (
            <PhotoListRow
              photo={photo}
              selected={selectedIds.has(photo.id)}
              active={activePhotoId === photo.id}
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleContextMenu}
              onDragStart={handleDragStart}
            />
          )}
        />
        {overlays}
      </>
    );
  }

  return (
    <>
      <VirtualGrid
        items={visible}
        cellWidth={gridSize}
        cellHeight={gridSize}
        gap={8}
        padding={12}
        overscan={3}
        getKey={getKey}
        scrollToIndex={activeIndex >= 0 ? activeIndex : undefined}
        onColumnsChange={setGridColumns}
        onClick={handleBackgroundClick}
        className={C}
        renderCell={(photo) => (
          <Thumbnail
            photo={photo}
            selected={selectedIds.has(photo.id)}
            active={activePhotoId === photo.id}
            size={gridSize}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onRatingChange={handleRate}
            onDragStart={handleDragStart}
          />
        )}
      />
      {overlays}
    </>
  );
}
