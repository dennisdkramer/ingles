@echo off
REM qa/serve.cmd — double-click this. It serves the repo on 127.0.0.1 and opens the blocks preview
REM with the note boxes wired straight to qa/NOTES.md (no picker, no permission prompt).
REM Close this window to stop the server. `node qa/serve.mjs --no-open` does the same headless.
cd /d "%~dp0.."
node qa\serve.mjs
if errorlevel 1 pause
