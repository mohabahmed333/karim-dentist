# Admin chat float / dock layout — design

Approved: shared preference for WhatsApp + Clinic Assist.

## Preference
- `localStorage` key `admin-chat-layout`: `"float" | "dock"` (default `float`)
- Separate collapse: `admin-chat-dock-collapsed`: `"1" | "0"`
- Toggle in both panel headers (float ⇄ dock); remember across sessions

## Float (existing)
FAB bottom-end; open panel as floating card. Unchanged aside from header layout toggle.

## Dock
- Right column in `AdminShell` beside main content (~26–28rem when expanded)
- Hosts whichever chat is open (WhatsApp or Assist); mutually exclusive as today
- **Collapse:** thin vertical rail (brand mark + vertical label) + FAB still available
- Expand via rail click, FAB open, or header expand control
- Main content reflows when dock expands/collapses

## Out of scope
`/admin/support` full page; resizing dock width; per-chat layout prefs.
