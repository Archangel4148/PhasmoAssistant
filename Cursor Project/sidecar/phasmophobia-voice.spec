# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for the Phasmophobia Companion voice sidecar (Windows onedir)."""

from PyInstaller.utils.hooks import collect_all, collect_dynamic_libs

block_cipher = None

vosk_datas, vosk_binaries, vosk_hidden = collect_all("vosk")
sd_datas, sd_binaries, sd_hidden = collect_all("sounddevice")
sd_binaries += collect_dynamic_libs("sounddevice")

a = Analysis(
    ["vosk_listener.py"],
    pathex=[],
    binaries=vosk_binaries + sd_binaries,
    datas=vosk_datas + sd_datas,
    hiddenimports=vosk_hidden + sd_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="phasmophobia-voice",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name="phasmophobia-voice",
)
