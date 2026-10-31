// The Library module as it was built in: the module it registers, the toolbar's
// actions and controls, the grid's selection, opening and dragging, and the
// empty states.

import { afterEach, describe, expect, it } from "vitest";
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { activate, MODULE_ID, STYLESHEET_ID } from "../src/index";
import { LibraryStatusBar, LibraryView } from "../src/LibraryView";
import { LibraryToolbar } from "../src/LibraryToolbar";
import { LibraryGrid, PHOTOS_DRAG_TYPE } from "../src/LibraryGrid";
import { fakeApi, GRID_SIZE, photo, type Rig } from "./support/fake-api";

afterEach(cleanup);

const PHOTOS = [photo("a"), photo("b"), photo("c"), photo("d")];

function rig(options: Parameters<typeof fakeApi>[0] = {}): Rig {
  const r = fakeApi({ photos: PHOTOS, ...options });
  activate(r.api);
  return r;
}

const cell = (id: string) => document.querySelector<HTMLElement>(`[data-photo-id="${id}"]`)!;
const selected = (r: Rig) => [...r.catalog.getState().selectedIds].sort();
const flush = () => act(async () => {});

describe("activate", () => {
  it("registers the Library module under its built-in id, with its status bar", () => {
    const r = rig();
    expect(r.modules).toHaveLength(1);
    expect(r.modules[0]).toMatchObject({ id: MODULE_ID, label: "Library", component: LibraryView });
    expect(MODULE_ID).toBe("library");
    expect(r.modules[0].statusBar).toBe(LibraryStatusBar);
  });

  it("registers one stylesheet whose every rule has no specificity of its own", () => {
    const r = rig();
    expect(r.stylesheets.map((s) => s.id)).toEqual([STYLESHEET_ID]);
    const selectors = r.stylesheets[0].css
      .split("\n")
      .filter((line) => line.includes("{"))
      .map((line) => line.slice(0, line.indexOf("{")).trim());
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(s.startsWith(":where(")).toBe(true);
  });
});

describe("LibraryView", () => {
  it("holds the culling shortcuts while it is mounted", () => {
    const r = rig();
    const { unmount } = render(<LibraryView />);
    expect(r.cullingMounted()).toBe(1);
    unmount();
    expect(r.cullingMounted()).toBe(0);
  });

  it("lays out the toolbar, the sub-bar slot and the grid in that order", () => {
    rig();
    render(<LibraryView />);
    const toolbar = screen.getByRole("group", { name: "View mode" });
    const subbar = document.querySelector('[data-slot="library-subbar"]')!;
    const grid = screen.getByRole("grid");
    expect(toolbar.compareDocumentPosition(subbar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(subbar.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("counts the catalog in the status bar", () => {
    const r = rig({ photos: [photo("a")] });
    render(<LibraryStatusBar />);
    expect(screen.getByText("1 photo in catalog")).toBeTruthy();
    act(() => r.catalog.setState({ photos: PHOTOS }));
    expect(screen.getByText("4 photos in catalog")).toBeTruthy();
  });
});

describe("LibraryToolbar", () => {
  it("counts the photos and the selection", () => {
    rig({ selectedIds: ["a", "b"] });
    render(<LibraryToolbar />);
    expect(screen.getByRole("status").textContent).toBe("4 photos · 2 selected");
  });

  it("shows the selection actions only while photos are selected", () => {
    const r = rig();
    render(<LibraryToolbar />);
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    act(() => r.catalog.setState({ selectedIds: new Set(["a"]) }));
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });

  it("rotates the selection either way", () => {
    const r = rig({ selectedIds: ["a", "c"] });
    render(<LibraryToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90° counter-clockwise" }));
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90° clockwise" }));
    expect(r.calls).toEqual([
      ["rotatePhotos", ["a", "c"], -90],
      ["rotatePhotos", ["a", "c"], 90],
    ]);
  });

  it("asks before removing when Preferences say so, and removes on yes", async () => {
    const r = rig({ selectedIds: ["a", "b"] });
    render(<LibraryToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await flush();
    expect(r.confirms).toEqual([
      {
        title: "Remove from catalog",
        message:
          "Remove 2 photos from the catalog? The original files on disk won't be deleted, and won't be re-imported on the next folder scan.",
        confirmLabel: "Remove",
      },
    ]);
    expect(r.calls).toEqual([["removePhotos", ["a", "b"]]]);
  });

  it("keeps the photos when the person cancels", async () => {
    const r = rig({ selectedIds: ["a"], confirmAnswer: false });
    render(<LibraryToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await flush();
    expect(r.confirms[0].message).toContain("Remove 1 photo from the catalog? The original file on disk");
    expect(r.calls).toEqual([]);
  });

  it("removes without asking when Preferences say not to", async () => {
    const r = rig({ selectedIds: ["a"], confirmRemovePhotos: false });
    render(<LibraryToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await flush();
    expect(r.confirms).toEqual([]);
    expect(r.calls).toEqual([["removePhotos", ["a"]]]);
  });

  it("writes the sidecars and says how many", async () => {
    const r = rig({ selectedIds: ["a", "b"], exported: 2 });
    render(<LibraryToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Export Data" }));
    await flush();
    expect(r.calls).toEqual([["exportPhotoData", ["a", "b"]]]);
    expect(r.alerts).toEqual([
      {
        title: "Export data",
        message:
          "Wrote 2 sidecar files (“<name>.safelight.json”) next to the selected photos. Move the photos with their sidecars and the next project to scan them will pick up the ratings, labels and edits.",
      },
    ]);
  });

  it("sorts by the built-in fields, and lists an extension's sorts under Metadata", () => {
    const r = rig();
    render(<LibraryToolbar />);
    expect(r.sortMenus.at(-1)).toEqual([
      {
        items: [
          { value: "dateImported", label: "Imported" },
          { value: "dateCreated", label: "Captured" },
          { value: "filename", label: "Name" },
          { value: "rating", label: "Rating" },
        ],
      },
    ]);

    act(() => r.registry.setState({ librarySorts: { lens: { id: "lens", label: "Lens" } } }));
    expect(r.sortMenus.at(-1)?.[1]).toEqual({ title: "Metadata", items: [{ value: "lens", label: "Lens" }] });

    fireEvent.change(screen.getByRole("combobox", { name: "Sort photos by" }), { target: { value: "lens" } });
    expect(r.ui.getState()).toMatchObject({ sortField: "lens", sortDirection: "desc" });
  });

  it("flips the sort direction", () => {
    const r = rig();
    render(<LibraryToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Sort direction: descending" }));
    expect(r.ui.getState().sortDirection).toBe("asc");
    expect(screen.getByRole("button", { name: "Sort direction: ascending" }).title).toBe("Ascending");
  });

  it("switches between grid and list", () => {
    const r = rig();
    render(<LibraryToolbar />);
    const grid = screen.getByRole("button", { name: "Grid" });
    const list = screen.getByRole("button", { name: "List" });
    expect([grid.getAttribute("aria-pressed"), list.getAttribute("aria-pressed")]).toEqual(["true", "false"]);
    fireEvent.click(list);
    expect(r.ui.getState().viewMode).toBe("list");
    expect(list.getAttribute("aria-pressed")).toBe("true");
  });

  it("sizes the thumbnails over core's range", () => {
    const r = rig();
    render(<LibraryToolbar />);
    const size = screen.getByRole("slider", { name: "Thumbnail size" }) as HTMLInputElement;
    expect([size.min, size.max, size.step, size.value]).toEqual(
      [GRID_SIZE.min, GRID_SIZE.max, GRID_SIZE.step, 200].map(String),
    );
    fireEvent.change(size, { target: { value: "260" } });
    expect(r.ui.getState().gridSize).toBe(260);
  });

  it("shows the import's progress with Stop in place of the count", () => {
    const r = rig();
    act(() => r.project.setState({ importDone: 1, importTotal: 4 }));
    render(<LibraryToolbar />);
    expect(screen.getByRole("status").textContent).toBe("Importing 1/4…");
    expect(document.querySelector<HTMLElement>(".sl-library-toolbar-progress-fill")?.style.width).toBe("25%");
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(r.calls).toEqual([["stopImport"]]);

    act(() => r.project.setState({ importDone: 4 }));
    expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
  });

  it("mounts the library-toolbar slot", () => {
    rig();
    render(<LibraryToolbar />);
    expect(document.querySelector('[data-slot="library-toolbar"]')).not.toBeNull();
  });
});

describe("LibraryGrid", () => {
  it("draws a thumbnail per visible photo at the grid size, with the photo actions' dialogs", () => {
    rig({ visible: [PHOTOS[1], PHOTOS[3]] });
    render(<LibraryGrid />);
    const cells = [...document.querySelectorAll<HTMLElement>("[data-photo-id]")];
    expect(cells.map((c) => [c.dataset.photoId, c.dataset.kind, c.dataset.size])).toEqual([
      ["b", "thumbnail", "200"],
      ["d", "thumbnail", "200"],
    ]);
    expect(screen.getByTestId("photo-actions")).toBeTruthy();
  });

  it("draws rows in list mode", () => {
    const r = rig();
    act(() => r.ui.setState({ viewMode: "list" }));
    render(<LibraryGrid />);
    expect(cell("a").dataset.kind).toBe("row");
    expect(screen.getByTestId("photo-actions")).toBeTruthy();
  });

  it("marks the selected and the active photo", () => {
    rig({ selectedIds: ["b"], activePhotoId: "c" });
    render(<LibraryGrid />);
    expect(cell("b").getAttribute("aria-selected")).toBe("true");
    expect(cell("a").getAttribute("aria-selected")).toBe("false");
    expect(cell("c").getAttribute("aria-current")).toBe("true");
  });

  it("selects on click, toggles on Ctrl/⌘-click and extends on Shift-click along the shown order", () => {
    const r = rig({ visible: [PHOTOS[3], PHOTOS[2], PHOTOS[1], PHOTOS[0]] });
    render(<LibraryGrid />);
    fireEvent.click(cell("c"));
    expect(selected(r)).toEqual(["c"]);
    fireEvent.click(cell("a"), { ctrlKey: true });
    expect(selected(r)).toEqual(["a", "c"]);
    fireEvent.click(cell("a"), { metaKey: true });
    expect(selected(r)).toEqual(["c"]);
    fireEvent.click(cell("c"));
    fireEvent.click(cell("a"), { shiftKey: true });
    expect(r.calls.at(-1)).toEqual(["selectRange", "a", ["d", "c", "b", "a"]]);
    expect(selected(r)).toEqual(["a", "b", "c"]);
  });

  it("clears the selection on a click in the grid's empty space only", () => {
    const r = rig({ selectedIds: ["a"] });
    render(<LibraryGrid />);
    fireEvent.click(cell("b"));
    expect(r.calls).not.toContainEqual(["deselectAll"]);
    fireEvent.click(screen.getByRole("grid"));
    expect(r.calls.at(-1)).toEqual(["deselectAll"]);
  });

  it("opens a double-clicked photo in Develop", () => {
    const r = rig();
    render(<LibraryGrid />);
    fireEvent.doubleClick(cell("b"));
    expect(r.calls.slice(-2)).toEqual([
      ["setActivePhoto", "b"],
      ["setActiveModule", "develop"],
    ]);
  });

  it("drags the whole selection from a selected photo, and only the photo from another", () => {
    rig({ selectedIds: ["a", "c"] });
    render(<LibraryGrid />);
    const drag = (id: string) => {
      const data = new Map<string, string>();
      const dataTransfer = {
        setData: (type: string, value: string) => void data.set(type, value),
        effectAllowed: "",
      };
      fireEvent.dragStart(cell(id), { dataTransfer });
      return { ids: JSON.parse(data.get(PHOTOS_DRAG_TYPE) ?? "null"), effect: dataTransfer.effectAllowed };
    };
    expect(PHOTOS_DRAG_TYPE).toBe("application/x-safelight-photos");
    expect(drag("c")).toEqual({ ids: ["a", "c"], effect: "move" });
    expect(drag("b")).toEqual({ ids: ["b"], effect: "move" });
  });

  it("hands the right-click to the photo actions", () => {
    const r = rig();
    render(<LibraryGrid />);
    fireEvent.contextMenu(cell("d"));
    expect(r.calls).toEqual([["contextMenu", "d"]]);
  });

  it("says how to start when the catalog is empty", () => {
    rig({ photos: [] });
    render(<LibraryGrid />);
    expect(screen.getByText("No photos imported")).toBeTruthy();
    expect(screen.getByText(/to get started/).textContent).toBe("Click + Files or + Folder to get started");
  });

  it("offers to clear the filters when none of the photos match", () => {
    const r = rig({ visible: [] });
    render(<LibraryGrid />);
    expect(screen.getByText("No photos match the current filter")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(r.calls).toEqual([["clearFilters"]]);
  });
});

