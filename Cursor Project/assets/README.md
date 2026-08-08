# Assets

| File | Use |
|------|-----|
| `app-icon.png` | Master square logo — run `npx tauri icon assets/app-icon.png` to refresh `src-tauri/icons/` and copy favicons into `public/` |
| `app-icon-rounded.png` | Rounded-edge variant for marketing / store art |

Do not commit generated PyInstaller or Vosk model trees; those are produced by `npm run sidecar:prepare`.
