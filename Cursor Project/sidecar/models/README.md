# Vosk models (not committed)

## Automatic (recommended for release)

```powershell
npm run sidecar:prepare
```

This downloads `vosk-model-small-en-us-0.15` into this folder and stages a copy under `src-tauri/resources/models/` for the installer.

## Manual (development)

1. Get `vosk-model-small-en-us-0.15` from https://alphacephei.com/vosk/models
2. Extract so this path exists:

```text
sidecar/models/vosk-model-small-en-us-0.15/
  am/
  conf/
  graph/
  ...
```

3. Install Python deps:

```powershell
pip install -r sidecar/requirements.txt
```

4. Restart the voice sidecar from Diagnostics.

If the model is missing, the app stays usable; voice features enter an error state with setup instructions (dev) or a reinstall hint (packaged builds).
