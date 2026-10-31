//#region src/rt.ts
var e, t;
function n(n) {
	t = n, e = n.react;
}
//#endregion
//#region src/LibraryToolbar.tsx
var r = [
	{
		value: "dateImported",
		label: "Imported"
	},
	{
		value: "dateCreated",
		label: "Captured"
	},
	{
		value: "filename",
		label: "Name"
	},
	{
		value: "rating",
		label: "Rating"
	}
], i = "sl-library-toolbar";
function a(e) {
	let t = `border-radius: 0.25rem; font-size: 11px; color: ${e.textSecondary};`;
	return `
:where(.${i}) { position: relative; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${e.borderSubtle}; background: ${e.surface1}; padding: 6px 12px; }
:where(.${i}-progress) { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: ${e.surface3}; }
:where(.${i}-progress-fill) { height: 100%; background: ${e.accent}; transition: width 150ms ease-out; }
:where(.${i}-group) { display: flex; align-items: center; gap: 8px; }
:where(.${i}-sort) { display: flex; align-items: center; gap: 4px; }
:where(.${i}-status) { font-size: 10px; color: ${e.textMuted}; }
:where(.${i}-action) { ${t} background: ${e.surface3}; padding: 4px 10px; }
:where(.${i}-action):hover { background: ${e.surface4}; color: ${e.textPrimary}; }
:where(.${i}-rotate) { padding: 4px 8px; }
:where(.${i}-danger):hover { color: ${e.labelRed}; }
:where(.${i}-stop) { padding: 2px 8px; font-size: 10px; }
:where(.${i}-direction) { ${t} background: ${e.surface2}; padding: 4px 6px; }
:where(.${i}-direction):hover { color: ${e.textPrimary}; }
:where(.${i}-modes) { display: flex; border-radius: 0.25rem; background: ${e.surface2}; }
:where(.${i}-mode) { padding: 4px 8px; font-size: 11px; color: ${e.textMuted}; }
:where(.${i}-mode)[aria-pressed="true"] { background: ${e.surface3}; color: ${e.textPrimary}; }
:where(.${i}-mode):first-child { border-radius: 0.25rem 0 0 0.25rem; }
:where(.${i}-mode):last-child { border-radius: 0 0.25rem 0.25rem 0; }
:where(.${i}-size) { width: 96px; }
`;
}
function o() {
	let { useUIStore: n, useCatalogStore: a, useProjectStore: o, useSettings: s } = t.stores, { Slider: c } = t.components, { Select: l } = t.ui, u = n((e) => e.viewMode), d = n((e) => e.setViewMode), f = n((e) => e.gridSize), p = n((e) => e.setGridSize), m = n((e) => e.sortField), h = n((e) => e.sortDirection), g = n((e) => e.setSort), _ = a((e) => e.removePhotos), v = a((e) => e.rotatePhotos), y = a((e) => e.photos), b = a((e) => e.selectedIds), x = o((e) => e.stopImport), S = o((e) => e.importDone), C = o((e) => e.importTotal), w = C > 0 && S < C, T = w ? Math.round(S / C * 100) : 0, E = t.registry.use((e) => e.librarySorts), D = e.useMemo(() => Object.values(E), [E]), O = async () => {
		let e = [...b];
		e.length !== 0 && (!s.getState().confirmRemovePhotos || await t.ui.confirmDialog({
			title: "Remove from catalog",
			message: `Remove ${e.length} photo${e.length === 1 ? "" : "s"} from the catalog? The original file${e.length === 1 ? "" : "s"} on disk won't be deleted, and won't be re-imported on the next folder scan.`,
			confirmLabel: "Remove"
		})) && _(e);
	}, k = async () => {
		let e = [...b];
		if (e.length === 0) return;
		let n = await t.catalog.exportPhotoData(e);
		await t.ui.alertDialog({
			title: "Export data",
			message: `Wrote ${n} sidecar file${n === 1 ? "" : "s"} (“<name>.safelight.json”) next to the selected photo${e.length === 1 ? "" : "s"}. Move the photos with their sidecars and the next project to scan them will pick up the ratings, labels and edits.`
		});
	};
	return /* @__PURE__ */ e.createElement("div", { className: i }, w && /* @__PURE__ */ e.createElement("div", {
		className: `${i}-progress`,
		title: `Importing ${S} / ${C}`
	}, /* @__PURE__ */ e.createElement("div", {
		className: `${i}-progress-fill`,
		style: { width: `${T}%` }
	})), /* @__PURE__ */ e.createElement("div", { className: `${i}-group` }, /* @__PURE__ */ e.createElement(t.components.Slot, { name: "library-toolbar" }), /* @__PURE__ */ e.createElement("span", {
		className: `${i}-status`,
		role: "status",
		"aria-live": "polite"
	}, w ? `Importing ${S}/${C}…` : `${y.length} photos${b.size > 0 ? ` · ${b.size} selected` : ""}`), w && /* @__PURE__ */ e.createElement("button", {
		onClick: x,
		className: `${i}-action ${i}-stop ${i}-danger`,
		title: "Stop importing new photos (already-imported photos are kept)"
	}, "Stop"), b.size > 0 && /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement("button", {
		onClick: () => void v([...b], -90),
		title: "Rotate 90° counter-clockwise ( [ )",
		"aria-label": "Rotate 90° counter-clockwise",
		className: `${i}-action ${i}-rotate`
	}, /* @__PURE__ */ e.createElement("span", { "aria-hidden": "true" }, "⟲")), /* @__PURE__ */ e.createElement("button", {
		onClick: () => void v([...b], 90),
		title: "Rotate 90° clockwise ( ] )",
		"aria-label": "Rotate 90° clockwise",
		className: `${i}-action ${i}-rotate`
	}, /* @__PURE__ */ e.createElement("span", { "aria-hidden": "true" }, "⟳")), /* @__PURE__ */ e.createElement("button", {
		onClick: () => void k(),
		title: "Write .safelight.json sidecars (ratings, labels, edits) next to the selected files so the data follows them to another project",
		className: `${i}-action`
	}, "Export Data"), /* @__PURE__ */ e.createElement("button", {
		onClick: () => void O(),
		className: `${i}-action ${i}-danger`
	}, "Remove"))), /* @__PURE__ */ e.createElement("div", { className: `${i}-group` }, /* @__PURE__ */ e.createElement("div", { className: `${i}-sort` }, /* @__PURE__ */ e.createElement(l, {
		value: m,
		onChange: (e) => g(e, h),
		ariaLabel: "Sort photos by",
		style: { width: "auto" },
		groups: [{ items: r }, ...D.length > 0 ? [{
			title: "Metadata",
			items: D.map((e) => ({
				value: e.id,
				label: e.label
			}))
		}] : []]
	}), /* @__PURE__ */ e.createElement("button", {
		onClick: () => g(m, h === "asc" ? "desc" : "asc"),
		className: `${i}-direction`,
		title: h === "asc" ? "Ascending" : "Descending",
		"aria-label": `Sort direction: ${h === "asc" ? "ascending" : "descending"}`
	}, /* @__PURE__ */ e.createElement("span", { "aria-hidden": "true" }, h === "asc" ? "↑" : "↓"))), /* @__PURE__ */ e.createElement("div", {
		className: `${i}-modes`,
		role: "group",
		"aria-label": "View mode"
	}, /* @__PURE__ */ e.createElement("button", {
		onClick: () => d("grid"),
		"aria-pressed": u === "grid",
		className: `${i}-mode`
	}, "Grid"), /* @__PURE__ */ e.createElement("button", {
		onClick: () => d("list"),
		"aria-pressed": u === "list",
		className: `${i}-mode`
	}, "List")), /* @__PURE__ */ e.createElement("div", { className: `${i}-size` }, /* @__PURE__ */ e.createElement(c, {
		label: "",
		ariaLabel: "Thumbnail size",
		hideValue: !0,
		value: f,
		min: t.catalog.gridSize.min,
		max: t.catalog.gridSize.max,
		step: t.catalog.gridSize.step,
		defaultValue: 200,
		onChange: p
	}))));
}
//#endregion
//#region src/LibraryGrid.tsx
var s = "sl-library-grid", c = "application/x-safelight-photos";
function l(e) {
	return `
:where(.${s}) { flex: 1 1 0%; }
:where(.${s}-empty) { display: flex; flex: 1 1 0%; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: ${e.textMuted}; }
:where(.${s}-empty-title) { font-size: 0.875rem; line-height: 1.25rem; }
:where(.${s}-empty-hint) { font-size: 0.75rem; line-height: 1rem; }
:where(.${s}-clear) { border-radius: 0.25rem; background: ${e.surface3}; padding: 4px 10px; font-size: 11px; color: ${e.textSecondary}; }
:where(.${s}-clear):hover { background: ${e.surface4}; color: ${e.textPrimary}; }
`;
}
var u = (e) => e.id;
function d() {
	let { useCatalogStore: n, useUIStore: r } = t.stores, { Thumbnail: i, PhotoListRow: a, VirtualGrid: o } = t.components, l = n((e) => e.photos), d = n((e) => e.selectedIds), f = n((e) => e.activePhotoId), p = n((e) => e.select), m = n((e) => e.toggleSelect), h = n((e) => e.selectRange), g = n((e) => e.setRating), _ = n((e) => e.setActivePhoto), v = n((e) => e.deselectAll), y = r((e) => e.setActiveModule), b = r((e) => e.setGridColumns), x = r((e) => e.gridSize), S = r((e) => e.viewMode), C = r((e) => e.clearFilters), w = t.catalog.useVisiblePhotos(), { onContextMenu: T, overlays: E } = t.catalog.usePhotoActions(), D = e.useMemo(() => f ? w.findIndex((e) => e.id === f) : -1, [f, w]), O = e.useRef(w);
	O.current = w;
	let k = e.useCallback((e, t) => {
		t.shiftKey ? h(e, O.current.map((e) => e.id)) : t.ctrlKey || t.metaKey ? m(e) : p(e);
	}, [
		p,
		m,
		h
	]), A = e.useCallback((e) => {
		_(e), y("develop");
	}, [_, y]), j = e.useCallback((e) => {
		e.target.closest("[data-photo-id]") || v();
	}, [v]), M = e.useCallback((e, t) => {
		let r = n.getState().selectedIds, i = r.has(e) ? [...r] : [e];
		t.dataTransfer.setData(c, JSON.stringify(i)), t.dataTransfer.effectAllowed = "move";
	}, [n]), N = e.useCallback((e, t) => void g(e, t), [g]);
	return l.length === 0 ? /* @__PURE__ */ e.createElement("div", { className: `${s}-empty` }, /* @__PURE__ */ e.createElement("p", { className: `${s}-empty-title` }, "No photos imported"), /* @__PURE__ */ e.createElement("p", { className: `${s}-empty-hint` }, "Click ", /* @__PURE__ */ e.createElement("strong", null, "+ Files"), " or ", /* @__PURE__ */ e.createElement("strong", null, "+ Folder"), " to get started")) : w.length === 0 ? /* @__PURE__ */ e.createElement("div", { className: `${s}-empty` }, /* @__PURE__ */ e.createElement("p", { className: `${s}-empty-title` }, "No photos match the current filter"), /* @__PURE__ */ e.createElement("button", {
		onClick: C,
		className: `${s}-clear`
	}, "Clear filters")) : S === "list" ? /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(o, {
		items: w,
		cellHeight: 53,
		columns: 1,
		overscan: 6,
		getKey: u,
		scrollToIndex: D >= 0 ? D : void 0,
		onColumnsChange: b,
		onClick: j,
		className: s,
		renderCell: (t) => /* @__PURE__ */ e.createElement(a, {
			photo: t,
			selected: d.has(t.id),
			active: f === t.id,
			onClick: k,
			onDoubleClick: A,
			onContextMenu: T,
			onDragStart: M
		})
	}), E) : /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(o, {
		items: w,
		cellWidth: x,
		cellHeight: x,
		gap: 8,
		padding: 12,
		overscan: 3,
		getKey: u,
		scrollToIndex: D >= 0 ? D : void 0,
		onColumnsChange: b,
		onClick: j,
		className: s,
		renderCell: (t) => /* @__PURE__ */ e.createElement(i, {
			photo: t,
			selected: d.has(t.id),
			active: f === t.id,
			size: x,
			onClick: k,
			onDoubleClick: A,
			onContextMenu: T,
			onRatingChange: N,
			onDragStart: M
		})
	}), E);
}
//#endregion
//#region src/LibraryView.tsx
function f() {
	return t.catalog.useCullingShortcuts(), /* @__PURE__ */ e.createElement(e.Fragment, null, /* @__PURE__ */ e.createElement(o, null), /* @__PURE__ */ e.createElement(t.components.Slot, { name: "library-subbar" }), /* @__PURE__ */ e.createElement(d, null));
}
function p() {
	let n = t.stores.useCatalogStore((e) => e.photos.length);
	return /* @__PURE__ */ e.createElement("span", null, n, " photo", n !== 1 && "s", " in catalog");
}
//#endregion
//#region src/index.tsx
var m = "library", h = "safelight.library.styles";
function g(e) {
	n(e), e.registerStylesheet({
		id: h,
		css: `${a(e.ui.tokens).trim()}\n${l(e.ui.tokens).trim()}\n`
	}), e.registerModule({
		id: m,
		label: "Library",
		component: f,
		statusBar: p
	});
}
//#endregion
export { m as MODULE_ID, h as STYLESHEET_ID, g as activate };

//# sourceMappingURL=index.js.map