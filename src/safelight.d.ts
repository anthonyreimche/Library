// Safelight — founded and principally authored by Anthony Reimche.
// Copyright (C) 2026 Anthony Reimche. Licensed under the GNU GPL v3 with an
// attribution-preservation term (GPL v3 §7b) — see LICENSE. This notice must
// be preserved in derived versions.

// The slice of Safelight's extension API this extension touches, mirrored from
// the app's src/extensions/types.ts, src/extensions/ui-kit.tsx,
// src/state/catalog-store.ts, src/state/ui-store.ts,
// src/project/project-store.ts, src/state/settings-store.ts and
// src/catalog/types.ts. Extensions are standalone bundles, so the host's source
// is not on the type path; React types come from @types/react (dev only).

import type {
  ComponentType,
  CSSProperties,
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";

export interface StoreApi<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  getState(): T;
  setState(partial: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}

/** A catalog photo. The Library hands it to core's cells whole and reads only
 *  its id. */
export interface CatalogPhoto {
  id: string;
  filename: string;
}

export interface CatalogStoreState {
  photos: CatalogPhoto[];
  selectedIds: Set<string>;
  activePhotoId: string | null;
  select(id: string): void;
  toggleSelect(id: string): void;
  /** Select from the anchor to `id` along `order`, the ids as shown. */
  selectRange(id: string, order: string[]): void;
  deselectAll(): void;
  setActivePhoto(id: string | null): void;
  setRating(id: string, rating: number): Promise<void>;
  removePhotos(ids: string[]): Promise<void>;
  rotatePhotos(ids: string[], degrees: number): Promise<void>;
}

export type SortDirection = "asc" | "desc";
export type ViewMode = "grid" | "list";

export interface UIState {
  activeModule: string;
  setActiveModule(module: string): void;
  viewMode: ViewMode;
  setViewMode(mode: ViewMode): void;
  /** A built-in sort field or an extension-contributed sort id. */
  sortField: string;
  sortDirection: SortDirection;
  setSort(field: string, direction: SortDirection): void;
  clearFilters(): void;
  /** The grid's cell size in pixels. */
  gridSize: number;
  setGridSize(size: number): void;
  setGridColumns(n: number): void;
}

export interface ProjectStoreState {
  importDone: number;
  importTotal: number;
  stopImport(): void;
}

export interface SettingsState {
  confirmRemovePhotos: boolean;
}

export interface ThumbnailProps {
  photo: CatalogPhoto;
  selected: boolean;
  active: boolean;
  size: number;
  onClick: (id: string, e: ReactMouseEvent) => void;
  onDoubleClick?: (id: string) => void;
  onContextMenu?: (id: string, e: ReactMouseEvent) => void;
  onRatingChange?: (id: string, rating: number) => void;
  onDragStart?: (id: string, e: ReactDragEvent) => void;
}

export interface PhotoListRowProps {
  photo: CatalogPhoto;
  selected: boolean;
  active: boolean;
  compact?: boolean;
  onClick: (id: string, e: ReactMouseEvent) => void;
  onDoubleClick: (id: string) => void;
  onContextMenu?: (id: string, e: ReactMouseEvent) => void;
  onDragStart?: (id: string, e: ReactDragEvent) => void;
}

export interface VirtualGridProps<T> {
  items: T[];
  cellWidth?: number;
  cellHeight: number;
  gap?: number;
  padding?: number;
  columns?: number;
  overscan?: number;
  renderCell: (item: T, index: number) => ReactNode;
  getKey: (item: T) => string;
  scrollToIndex?: number;
  onColumnsChange?: (columns: number) => void;
  onClick?: (e: ReactMouseEvent) => void;
  className?: string;
}

export interface SliderProps {
  label: string;
  ariaLabel?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  hideValue?: boolean;
  onChange: (value: number) => void;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  title?: string;
  items: SelectOption[];
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export interface PhotoActions {
  onContextMenu: (id: string, e: ReactMouseEvent) => void;
  overlays: ReactNode;
}

export interface LibrarySortContribution {
  id: string;
  label: string;
}

export interface RegistryState {
  librarySorts: Record<string, LibrarySortContribution>;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
}

export interface AlertDialogOptions {
  title: string;
  message: string;
}

export interface ModuleContribution {
  id: string;
  label: string;
  component: ComponentType;
  statusBar?: ComponentType;
}

/** A stylesheet applied to every app window after the core styles. Extension
 *  rules are unlayered, so they win over Tailwind utility classes; disabling
 *  the extension removes the sheet. */
export interface StylesheetContribution {
  id: string;
  css: string;
}

/** The theme's CSS variables as `var(--color-…)` strings. */
export interface UiTokens {
  readonly surface1: string;
  readonly surface2: string;
  readonly surface3: string;
  readonly surface4: string;
  readonly borderSubtle: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly accent: string;
  readonly labelRed: string;
}

export interface SafelightAPI {
  version: 1;
  extensionId: string;
  react: typeof import("react");
  registerModule(c: ModuleContribution): void;
  registerStylesheet(c: StylesheetContribution): void;
  ui: {
    tokens: UiTokens;
    Select: ComponentType<SelectProps>;
    /** Resolves true on confirm. */
    confirmDialog(options: ConfirmDialogOptions): Promise<boolean>;
    alertDialog(options: AlertDialogOptions): Promise<void>;
  };
  components: {
    Slider: ComponentType<SliderProps>;
    Thumbnail: ComponentType<ThumbnailProps>;
    PhotoListRow: ComponentType<PhotoListRowProps>;
    VirtualGrid: <T>(props: VirtualGridProps<T>) => ReactNode;
    /** Every component registered into the named core slot. */
    Slot: ComponentType<{ name: string }>;
  };
  stores: {
    useCatalogStore: StoreApi<CatalogStoreState>;
    useUIStore: StoreApi<UIState>;
    useProjectStore: StoreApi<ProjectStoreState>;
    useSettings: StoreApi<SettingsState>;
  };
  registry: {
    use<T>(selector: (s: RegistryState) => T): T;
  };
  catalog: {
    /** The photos the grid shows, in display order, every filter and sort
     *  applied. React hook. */
    useVisiblePhotos(): CatalogPhoto[];
    /** The photo right-click menu and its dialogs. React hook. */
    usePhotoActions(): PhotoActions;
    /** Mounts the Library's culling shortcuts while the caller is mounted. */
    useCullingShortcuts(): void;
    /** Writes `.safelight.json` sidecars; resolves with how many. */
    exportPhotoData(ids: string[]): Promise<number>;
    gridSize: { readonly min: number; readonly max: number; readonly step: number };
  };
}

export interface ExtensionModule {
  activate(api: SafelightAPI): void;
  deactivate?(): void;
}
