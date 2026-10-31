# Library for Safelight

The **Library** module: where you browse, sort and cull a project's photos.

- **Grid and list:** thumbnails or rows, with the size slider and the sort
  menu (imported, captured, name, rating, plus any sort an extension adds).
- **Selecting:** click, Ctrl/⌘-click and Shift-click; click the empty space
  to clear. Double-click a photo to open it in Develop. Drag photos onto a
  folder in the Folders panel to move them.
- **Culling:** ratings, flags, color labels, rotate, remove and the other
  Library shortcuts (Preferences ▸ Shortcuts), and the photo right-click
  menu.
- **Toolbar:** import progress with Stop, rotate, Export Data (sidecars that
  carry ratings, labels and edits to another project) and Remove.

Folders, Library Filters, Keywords, Info and Export are their own
extensions, docked around the grid.

Until Safelight 3.2.0 this module was built in. It keeps the module id
(`library`), so layouts, pop-out windows and shortcuts saved before then
still find it.

## Development

```bash
npm install
npm run typecheck
npm run build    # dist/index.js, the file Safelight loads
npm test         # vitest; the bundle checks read dist/, so build first
npm run check    # all three, in that order
```

Safelight hands the extension its own React through `api.react`, so the
bundle never includes React. `src/safelight.d.ts` mirrors the part of the
app's extension API the extension uses.

## License

GPL-3.0-only with an attribution term (GPL v3 §7b), the same licence as Safelight; see LICENSE. Copyright (C) 2026 Anthony Reimche.
