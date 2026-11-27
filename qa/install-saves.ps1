# INGLES SAVES -- run the save watcher at every Windows login, with no window.
#
#   powershell -ExecutionPolicy Bypass -File qa\install-saves.ps1          install + start now
#   powershell -ExecutionPolicy Bypass -File qa\install-saves.ps1 -Remove   stop + unregister
#
# WHAT IT DOES. Writes %LOCALAPPDATA%\ingles-saves\run.vbs, a launcher that starts node with the
# window hidden, and registers a task "Ingles saves" that runs the launcher at logon. The watcher
# writes its own log (--log), so nothing depends on a shell redirect. The launcher points at THIS
# checkout -- re-run the installer after moving or cloning the repo.
#
# THIS FILE IS PLAIN ASCII ON PURPOSE. Windows PowerShell 5.1 reads a .ps1 with no BOM as ANSI,
# so a UTF-8 em dash arrives as three garbage bytes; inside a quoted string that has broken the
# parser before. Keep it ASCII, or save it UTF-8 WITH a BOM.
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$task = 'Ingles saves'
$dir  = Join-Path $env:LOCALAPPDATA 'ingles-saves'
$vbs  = Join-Path $dir 'run.vbs'
$log  = Join-Path $dir 'saves.log'

if ($Remove) {
  Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -like '*watch-saves.mjs*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Write-Output "removed the '$task' task and stopped any watcher"
  exit 0
}

$repo  = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$node  = (Get-Command node -ErrorAction Stop).Source
$watch = Join-Path $repo 'qa\watch-saves.mjs'
if (-not (Test-Path -LiteralPath $watch)) { throw "no watcher at $watch" }
New-Item -ItemType Directory -Force -Path $dir | Out-Null

# the launcher: VBScript doubles a quote to embed one; building it from [char]34 keeps this file
# free of the escaping games that make a launcher unreadable six months later.
# THE LOOP IS THE RECOVERY. A repetition on a logon trigger only starts counting after a logon, so a
# watcher that dies mid-session would stay dead until the next one; the blocking Run returns when
# node exits and the loop brings it back a minute later, for as long as the task instance lives.
$q       = [char]34
$q2      = $q + $q
$runner  = 'node ' + $q2 + $watch + $q2 + ' --log ' + $q2 + $log + $q2
$vbsText = @(
  ('Set sh = CreateObject(' + $q + 'WScript.Shell' + $q + ')'),
  ('Do'),
  ('  sh.Run ' + $q + $runner + $q + ', 0, True'),
  ('  WScript.Sleep 60000'),
  ('Loop')
)
[System.IO.File]::WriteAllLines($vbs, [string[]]$vbsText, [System.Text.Encoding]::ASCII)

$action  = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ($q + $vbs + $q)
$trigger = New-ScheduledTaskTrigger -AtLogOn -User ($env:USERNAME)
# A second net: after a logon, the task repeats and IgnoreNew skips it while the loop is alive.
$every   = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
$trigger.Repetition = $every.Repetition
$trigger.Repetition.StopAtDurationEnd = $false
$set     = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $task -Action $action -Trigger $trigger -Settings $set -Description 'Lands Save to repo downloads in the ingles checkout, commits and pushes.' -Force | Out-Null

Start-Process -FilePath 'wscript.exe' -ArgumentList ($q + $vbs + $q)
Write-Output "installed '$task' - runs at logon, and started now"
Write-Output "repo: $repo"
Write-Output "log:  $log"
