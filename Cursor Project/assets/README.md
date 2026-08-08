# Assets

| File | Use |
|------|-----|
| `app-icon-transparent.png` | Master icon (transparent) — source for `npx tauri icon` / desktop + favicon |
| `app-icon.png` | Copy of the transparent master (convenient default path) |
| `app-icon-rounded.png` | Rounded-square marketing / store art |

Regenerate desktop icons + favicons:

```powershell
npx tauri icon assets/app-icon-transparent.png
Copy-Item -Force src-tauri/icons/32x32.png public/favicon.png
Copy-Item -Force src-tauri/icons/icon.ico public/favicon.ico
Copy-Item -Force src-tauri/icons/128x128.png public/app-icon.png
```

Do not commit generated PyInstaller or Vosk model trees; those are produced by `npm run sidecar:prepare`.
