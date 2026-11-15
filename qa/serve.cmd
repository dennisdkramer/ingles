@echo off
REM qa/serve.cmd — double-click this. It serves the repo on 127.0.0.1 and opens the menu preview
REM (only the migrated entries) with the note boxes wired straight to qa/NOTES.md (no picker, no
REM permission prompt). `qa/preview-blocks.html` is still served for the full prototype set.
REM Close this window to stop the server. `node qa/serve.mjs --no-open` does the same headless.
cd /d "%~dp0.."
node qa\serve.mjs
if errorlevel 1 pause
