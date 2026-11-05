// A stand-in Safelight API over real React and zustand. The catalogue store
// selects the way core's does (a range runs from the last clicked photo along
// the order given), and records every action called. Core's components are
// small stand-ins with core's accessible names: each cell is a `data-photo-id`
// element wired to the handlers it was given, the grid renders every item, a
// slot renders a marker naming itself. Dialogues, the sidecar export and the
// culling shortcuts record their calls.

import * as React from "react";
import { create } from "zustand";
import type {
  AlertDialogOptions,
  CatalogPhoto,
  CatalogStoreState,
  ConfirmDialogOptions,
  ModuleContribution,
  PhotoListRowProps,
  ProjectStoreState,
  RegistryState,
  SafelightAPI,
  SelectProps,
  SettingsState,
  SliderProps,
  StoreApi,
  StylesheetContribution,
  ThumbnailProps,
  UIState,
  UiTokens,
  VirtualGridProps,
} from "../../src/safelight";

export const TOKENS: UiTokens = {
  surface1: "var(--color-surface-1)",
  surface2: "var(--color-surface-2)",
  surface3: "var(--color-surface-3)",
  surface4: "var(--color-surface-4)",
  borderSubtle: "var(--color-border-subtle)",
  textPrimary: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  textMuted: "var(--color-text-muted)",
  accent: "var(--color-accent)",
  labelRed: "var(--color-label-red)",
};

export const GRID_SIZE = { min: 100, max: 400, step: 20 } as const;

export type Call =
  | ["select", string]
  | ["toggleSelect", string]
  | ["selectRange", string, string[]]
  | ["deselectAll"]
  | ["setActivePhoto", string | null]
  | ["setRating", string, number]
  | ["removePhotos", string[]]
  | ["rotatePhotos", string[], number]
  | ["setActiveModule", string]
  | ["clearFilters"]
  | ["stopImport"]
  | ["exportPhotoData", string[]]
  | ["contextMenu", string];

export interface Rig {
  api: SafelightAPI;
  catalog: StoreApi<CatalogStoreState>;
  ui: StoreApi<UIState>;
  project: StoreApi<ProjectStoreState>;
  settings: StoreApi<SettingsState>;
  registry: StoreApi<RegistryState>;
  calls: Call[];
  confirms: ConfirmDialogOptions[];
  alerts: AlertDialogOptions[];
  /** The groups each sort menu render was given, latest last. */
  sortMenus: NonNullable<SelectProps["groups"]>[];
  /** How many components have the culling shortcuts mounted now. */
  cullingMounted(): number;
  modules: ModuleContribution[];
  stylesheets: StylesheetContribution[];
}

export function photo(id: string): CatalogPhoto {
  return { id, filename: `${id}.jpg` };
}

function Slider({ ariaLabel, value, min, max, step, onChange }: SliderProps) {
  return (
    <input
      type="range"
      aria-label={ariaLabel}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function Slot({ name }: { name: string }) {
  return <div data-slot={name} />;
}

function VirtualGrid<T>({ items, renderCell, getKey, onClick, className }: VirtualGridProps<T>) {
  return (
    <div role="grid" className={className} onClick={onClick}>
      {items.map((item, i) => (
        <div key={getKey(item)}>{renderCell(item, i)}</div>
      ))}
    </div>
  );
}

function Cell({
  kind,
  photo,
  selected,
  active,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  size,
}: {
  kind: "thumbnail" | "row";
  photo: CatalogPhoto;
  selected: boolean;
  active: boolean;
  onClick: (id: string, e: React.MouseEvent) => void;
  onDoubleClick?: (id: string) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onDragStart?: (id: string, e: React.DragEvent) => void;
  size?: number;
}) {
  return (
    <div
      data-photo-id={photo.id}
      data-kind={kind}
      data-size={size}
      aria-selected={selected}
      aria-current={active}
      draggable
      onClick={(e) => onClick(photo.id, e)}
      onDoubleClick={() => onDoubleClick?.(photo.id)}
      onContextMenu={(e) => onContextMenu?.(photo.id, e)}
      onDragStart={(e) => onDragStart?.(photo.id, e)}
    >
      {photo.filename}
    </div>
  );
}

export function fakeApi({
  photos = [],
  visible,
  selectedIds = [],
  activePhotoId = null,
  confirmRemovePhotos = true,
  confirmAnswer = true,
  exported = 1,
}: {
  photos?: CatalogPhoto[];
  /** The grid's photos, when they differ from the catalogue's (a filter). */
  visible?: CatalogPhoto[];
  selectedIds?: string[];
  activePhotoId?: string | null;
  confirmRemovePhotos?: boolean;
  confirmAnswer?: boolean;
  exported?: number;
} = {}): Rig {
  const calls: Call[] = [];
  const confirms: ConfirmDialogOptions[] = [];
  const alerts: AlertDialogOptions[] = [];
  const sortMenus: NonNullable<SelectProps["groups"]>[] = [];
  const modules: ModuleContribution[] = [];
  const stylesheets: StylesheetContribution[] = [];
  let culling = 0;
  let anchor: string | null = null;

  const catalog = create<CatalogStoreState>()((set) => ({
    photos,
    selectedIds: new Set(selectedIds),
    activePhotoId,
    select: (id) => {
      calls.push(["select", id]);
      anchor = id;
      set({ selectedIds: new Set([id]) });
    },
    toggleSelect: (id) => {
      calls.push(["toggleSelect", id]);
      anchor = id;
      set((s) => {
        const next = new Set(s.selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedIds: next };
      });
    },
    selectRange: (id, order) => {
      calls.push(["selectRange", id, order]);
      const from = order.indexOf(anchor ?? id);
      const to = order.indexOf(id);
      set({ selectedIds: new Set(order.slice(Math.min(from, to), Math.max(from, to) + 1)) });
    },
    deselectAll: () => {
      calls.push(["deselectAll"]);
      set({ selectedIds: new Set() });
    },
    setActivePhoto: (id) => {
      calls.push(["setActivePhoto", id]);
      set({ activePhotoId: id });
    },
    setRating: async (id, rating) => void calls.push(["setRating", id, rating]),
    removePhotos: async (ids) => void calls.push(["removePhotos", ids]),
    rotatePhotos: async (ids, degrees) => void calls.push(["rotatePhotos", ids, degrees]),
  }));

  const ui = create<UIState>()((set) => ({
    activeModule: "library",
    setActiveModule: (module) => {
      calls.push(["setActiveModule", module]);
      set({ activeModule: module });
    },
    viewMode: "grid",
    setViewMode: (viewMode) => set({ viewMode }),
    sortField: "dateImported",
    sortDirection: "desc",
    setSort: (sortField, sortDirection) => set({ sortField, sortDirection }),
    clearFilters: () => void calls.push(["clearFilters"]),
    gridSize: 200,
    setGridSize: (gridSize) => set({ gridSize }),
    setGridColumns: () => {},
  }));

  const project = create<ProjectStoreState>()(() => ({
    importDone: 0,
    importTotal: 0,
    stopImport: () => void calls.push(["stopImport"]),
  }));

  const settings = create<SettingsState>()(() => ({ confirmRemovePhotos }));
  const registry = create<RegistryState>()(() => ({ librarySorts: {} }));

  function Select({ value, onChange, groups, ariaLabel }: SelectProps) {
    sortMenus.push(groups ?? []);
    return (
      <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)}>
        {(groups ?? []).flatMap((g) =>
          g.items.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )),
        )}
      </select>
    );
  }

  const api: SafelightAPI = {
    version: 1,
    extensionId: "safelight.library",
    react: React,
    registerModule: (c) => void modules.push(c),
    registerStylesheet: (c) => void stylesheets.push(c),
    ui: {
      tokens: TOKENS,
      Select,
      confirmDialog: async (options) => {
        confirms.push(options);
        return confirmAnswer;
      },
      alertDialog: async (options) => void alerts.push(options),
    },
    components: {
      Slider,
      Slot,
      VirtualGrid,
      Thumbnail: (props: ThumbnailProps) => <Cell kind="thumbnail" {...props} />,
      PhotoListRow: (props: PhotoListRowProps) => <Cell kind="row" {...props} />,
    },
    stores: { useCatalogStore: catalog, useUIStore: ui, useProjectStore: project, useSettings: settings },
    registry: { use: (selector) => registry(selector) },
    catalog: {
      useVisiblePhotos: () => {
        const all = catalog((s) => s.photos);
        return visible ?? all;
      },
      usePhotoActions: () => ({
        onContextMenu: (id) => void calls.push(["contextMenu", id]),
        overlays: <div data-testid="photo-actions" />,
      }),
      useCullingShortcuts: () => {
        React.useEffect(() => {
          culling++;
          return () => void culling--;
        }, []);
      },
      exportPhotoData: async (ids) => {
        calls.push(["exportPhotoData", ids]);
        return exported;
      },
      gridSize: GRID_SIZE,
    },
  };

  return {
    api,
    catalog,
    ui,
    project,
    settings,
    registry,
    calls,
    confirms,
    alerts,
    sortMenus,
    cullingMounted: () => culling,
    modules,
    stylesheets,
  };
}
