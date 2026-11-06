<#
.SYNOPSIS
  Checks one generated <TRACK>-ROADMAP.md against ROADMAP-GENERATOR.md's
  "Check before finishing" list.

.DESCRIPTION
  Portable across pwsh and PowerShell 5.1. Reads the file as UTF-8 (the em dash
  separator in "## Labels" is mojibake under the default ANSI read).

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-Roadmap.ps1 -Path ..\KIDS-ROADMAP.md

.EXAMPLE
  pwsh -File .\Test-Roadmap.ps1 -All      # every *-ROADMAP.md in the repo root

.EXAMPLE
  pwsh -File .\Test-Roadmap.ps1 -Path ..\KIDS-ROADMAP.md -ExamLessons 12,30 -ExamUses 10

.EXAMPLE
  pwsh -File .\Test-Roadmap.ps1 -Path ..\KIDS-ROADMAP.md -Counts
  # spine lines, labels, areas, items - the numbers ## Decisions quotes

.NOTES
  Track-agnostic: every track-specific number is a parameter. Spine and labels are
  read from ..\ROADMAP GENERATION\work\<track>-spine.md and <track>-labels.md when
  those exist (`-SpineFile`/`-LabelsFile` override); an inline `## Labels` list still
  works and must agree with the ledger. With neither list nor ledger the label set is
  derived from the `teaches:` lines, which is the shape a shipped roadmap has.

.OUTPUTS
  Exit code 0 = every check passed, 1 = at least one failure. Warnings never fail.
#>
[CmdletBinding()]
param(
    [string]$Path,
    [switch]$All,
    [string]$Report,
    [string[]]$ExamLessons = @('25', '45'),
    [int]$LessonCount = 50,
    [int]$MinLabels = 3,
    [int]$MaxLabels = 6,
    [int]$MinItems = 10,
    [int]$MaxItems = 12,
    [int]$ExamUses = 0,
    [string]$LabelsFile,
    [string]$SpineFile,
    [switch]$Counts
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
if (-not $repo) { $repo = (Get-Location).Path }

# -File hands "3,5" over as one string; normalise so -ExamLessons works either way
$examList = New-Object System.Collections.Generic.List[int]
foreach ($e in $ExamLessons) {
    foreach ($piece in ([string]$e -split ',')) {
        $n = 0
        if ([int]::TryParse($piece.Trim(), [ref]$n)) { $examList.Add($n) }
    }
}
$ExamLessons = $examList.ToArray()

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$out = New-Object System.Collections.Generic.List[string]

function Say([string]$s) { $out.Add($s); Write-Host $s }
function Fail([string]$s) { $failures.Add($s); Say "  FAIL  $s" }
function Warn([string]$s) { $warnings.Add($s); Say "  WARN  $s" }
function Pass([string]$s) { Say "  PASS  $s" }

# ---------------------------------------------------------------- parsing helpers
function Read-Roadmap([string]$file) {
    Get-Content -LiteralPath $file -Encoding UTF8 | ForEach-Object { $_.TrimStart([char]0xFEFF) }
}

# "   - `area/thing` - desc"  OR  "   - area/thing - desc"  (em dash, en dash or hyphen)
function Get-LabelFromLine([string]$line) {
    if ($line -match '^\s*-\s*`([^`]+)`\s*[-\u2013\u2014]') { return $Matches[1] }
    if ($line -match '^\s*-\s*([A-Za-z0-9][A-Za-z0-9\-]*/[A-Za-z0-9][A-Za-z0-9\-/]*)\s*[-\u2013\u2014]') { return $Matches[1] }
    return $null
}

function Get-BacktickRefs([string]$s) {
    $refs = New-Object System.Collections.Generic.List[string]
    foreach ($m in [regex]::Matches($s, '`([^`]+)`')) { $refs.Add($m.Groups[1].Value) }
    return $refs
}

# comma split that respects double quotes so "yeah, whatever" stays one item
function Get-VocabItems([string]$raw) {
    $items = New-Object System.Collections.Generic.List[string]
    if ($null -eq $raw) { return $items }
    $raw = $raw.Trim()
    if ($raw -eq '' -or $raw -eq '-') { return $items }
    $sb = New-Object System.Text.StringBuilder
    $inQuote = $false
    foreach ($ch in $raw.ToCharArray()) {
        if ($ch -eq [char]'"') { $inQuote = -not $inQuote; [void]$sb.Append($ch); continue }
        if ($ch -eq [char]',' -and -not $inQuote) { $items.Add($sb.ToString()); [void]$sb.Clear(); continue }
        [void]$sb.Append($ch)
    }
    $items.Add($sb.ToString())
    $clean = New-Object System.Collections.Generic.List[string]
    foreach ($i in $items) { if ($i.Trim() -ne '') { $clean.Add($i.Trim()) } }
    return $clean
}


# ---------------------------------------------------------------- work-file helpers
# ROADMAP GENERATION/work/<track>-labels.md and <track>-spine.md
function Resolve-WorkFile([string]$explicit, [string]$kind, [string]$roadmapPath) {
    if ($explicit) {
        $p = $explicit
        if (-not [System.IO.Path]::IsPathRooted($p)) { $p = Join-Path $repo $p }
        if (Test-Path -LiteralPath $p) { return (Resolve-Path -LiteralPath $p).Path }
        return $null
    }
    $track = [System.IO.Path]::GetFileName($roadmapPath) -replace '(?i)-ROADMAP\.md$', ''
    if (-not $track) { return $null }
    $guess = Join-Path $repo ("ROADMAP GENERATION\work\" + $track.ToLower() + "-" + $kind + ".md")
    if (Test-Path -LiteralPath $guess) { return (Resolve-Path -LiteralPath $guess).Path }
    return $null
}

# one line per label: "- area/thing - gloss - -> L12"
function Read-LabelLedger([string]$file) {
    $rows = New-Object System.Collections.Generic.List[object]
    $ln = 0
    foreach ($line in (Get-Content -LiteralPath $file -Encoding UTF8)) {
        $ln++
        $lb = Get-LabelFromLine $line
        if (-not $lb) { continue }
        $lesson = 0
        if ($line -match '\u2192\s*L\s*(\d+)') { $lesson = [int]$Matches[1] }
        elseif ($line -match '\u2192\s*(\d+)') { $lesson = [int]$Matches[1] }
        $rows.Add([pscustomobject]@{ label = $lb; lesson = $lesson; line = $ln })
    }
    return $rows
}

# one line per family: "- <family> - lessons N-M - why here"
function Read-SpineLedger([string]$file) {
    $families = New-Object System.Collections.Generic.List[string]
    foreach ($line in (Get-Content -LiteralPath $file -Encoding UTF8)) {
        if ($line -match '^\s*[-*]\s+\S') { $families.Add($line.Trim()) }
    }
    return $families
}

# one line per item: "- item - L12"
function Read-ItemLedger([string]$file) {
    $rows = New-Object System.Collections.Generic.List[object]
    foreach ($line in (Get-Content -LiteralPath $file -Encoding UTF8)) {
        if ($line -notmatch '^\s*[-*]\s+(.+?)\s*[\u2014\-]{1,2}\s*L\s*(\d+)\s*$') { continue }
        $item = ($Matches[1] -replace '^\s*"|"\s*$', '').Trim().ToLower()
        if ($item) { $rows.Add([pscustomobject]@{ item = $item; lesson = [int]$Matches[2] }) }
    }
    return $rows
}

function Get-TrackName([string]$roadmapPath) {
    return ([System.IO.Path]::GetFileName($roadmapPath) -replace '(?i)-ROADMAP\.md$', '').ToLower()
}

function Test-OneRoadmap([string]$file) {
    $failures.Clear(); $warnings.Clear(); $out.Clear()
    Say ''
    Say ('=' * 78)
    Say "FILE: $file"
    Say ('=' * 78)

    $lines = Read-Roadmap $file

    Say ''
    Say '--- STRUCTURE ---'
    $h2 = @()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^##\s+(.*)$') { $h2 += [pscustomobject]@{ Line = $i; Title = $Matches[1].Trim() } }
    }
    $prev = -1; $structOk = $true
    foreach ($sec in @('Decisions', 'Shape')) {
        $hit = $h2 | Where-Object { $_.Title -like "$sec*" } | Select-Object -First 1
        if (-not $hit) { Fail "missing '## $sec' section"; $structOk = $false; continue }
        if ($hit.Line -lt $prev) { Fail "'## $sec' is out of order"; $structOk = $false }
        $prev = $hit.Line
    }
    # ## Labels is optional (the deliverable normally ships without a label list), but if present it comes before the lessons
    $labelsHead = $h2 | Where-Object { $_.Title -like 'Labels*' } | Select-Object -First 1
    if ($labelsHead) {
        if ($labelsHead.Line -lt $prev) { Fail "'## Labels' is out of order"; $structOk = $false }
        $prev = $labelsHead.Line
    }
    $lessonHeads = $h2 | Where-Object { $_.Title -match '^Lesson\s+(\d+)' }
    if ($structOk -and $lessonHeads) { Pass 'sections present and in order: Decisions -> Shape -> [Labels] -> Lesson 1..N' }

    $nums = @()
    foreach ($h in $lessonHeads) { [void]($h.Title -match '^Lesson\s+(\d+)'); $nums += [int]$Matches[1] }
    $missing = (1..$LessonCount) | Where-Object { $nums -notcontains $_ }
    $extra = $nums | Where-Object { $_ -gt $LessonCount }
    if ($missing) { Fail "missing lesson entries: $($missing -join ', ')" }
    if ($extra) { Fail "lesson numbers above $LessonCount`: $($extra -join ', ')" }
    $sorted = ($nums -join ',') -eq (($nums | Sort-Object) -join ',')
    if (-not $sorted) { Fail 'lesson entries are not in ascending order' }
    if (-not $missing -and -not $extra -and $sorted) { Pass "$LessonCount lesson entries, ascending, none missing" }
    if ($lines.Count -gt 0 -and $lines[0] -notmatch '^#\s+\S*-ROADMAP') { Warn "first line is not a '# <TRACK>-ROADMAP ...' title: $($lines[0])" }

    Say ''
    Say '--- SHAPE ---'
    $body = $lines -join "`n"
    $shapeMissing = @('Start:', 'End:', 'Blocks:') | Where-Object { $body -notmatch [regex]::Escape($_) }
    if ($shapeMissing) { foreach ($s in $shapeMissing) { Fail "## Shape is missing '$s'" } }
    elseif ($body -match [regex]::Escape('Spine:')) { Pass 'Shape carries Start, End, Blocks and a Spine pointer' }
    else { Pass 'Shape carries Start, End and Blocks (no Spine pointer - the spine is a work artifact)' }
    $spineLines = @()
    $inSpine = $false
    foreach ($l in $lines) {
        if ($l -match '\*\*Spine:\*\*') { $inSpine = $true; continue }
        if ($inSpine -and $l -match '^##\s') { $inSpine = $false }
        if ($inSpine -and $l -match '^\s+- ') { $spineLines += $l }
    }
    # spine and labels may live in the work files instead of the roadmap (ROADMAP-GENERATOR "WORKING FILES")
    $labelsLedger = Resolve-WorkFile $LabelsFile 'labels' $file
    $spineLedger = Resolve-WorkFile $SpineFile 'spine' $file
    $ledgerSpine = @()
    if ($spineLedger) {
        $ledgerSpine = @(Read-SpineLedger $spineLedger)
        Say "  INFO  spine ledger: $spineLedger ($($ledgerSpine.Count) families)"
    }
    if ($spineLines.Count -ge 5) { Say "  INFO  spine lines in ## Shape: $($spineLines.Count)" }
    elseif ($ledgerSpine.Count -ge 5) { Say "  INFO  spine work file: $($ledgerSpine.Count) families; the lines stay out of the deliverable" }
    else { Say '  INFO  no spine lines in the deliverable and no spine work file (fine - the blocks still describe the shape)' }

    Say ''
    Say '--- PARSE LABELS AND ENTRIES ---'
    $defined = New-Object System.Collections.Generic.List[string]
    $lessons = @{}
    $lesson = 0
    $inLabels = $false
    foreach ($line in $lines) {
        if ($line -match '^##\s+Labels') { $inLabels = $true; continue }
        if ($line -match '^##\s+Lesson\s+(\d+)') {
            $inLabels = $false
            $lesson = [int]$Matches[1]
            if (-not $lessons.ContainsKey($lesson)) {
                $lessons[$lesson] = [pscustomobject]@{
                    fields = @(); teaches = @(); uses = @(); deepens = @(); deepensText = ''; items = @(); vocabDash = $false; genText = ''
                }
            }
            continue
        }
        if ($inLabels) {
            if ($line.Trim() -eq '') { continue }
            $lb = Get-LabelFromLine $line
            if ($lb) { $defined.Add($lb) }
            elseif ($line -match '^\s*(?:[-*\u00b7]\s*)?(?:Source|Areas|Spine|Blocks|Start|End)\s*:') { continue }
            else { Warn "unparsed line in ## Labels: $line" }
            continue
        }
        if ($lesson -le 0) { continue }
        if ($line -match '^\s*-\s*(Focus|teaches|Deepens|Uses|Vocabulary|Examples|Real-world relevance|Generation):\s*(.*)$') {
            $field = $Matches[1]; $value = $Matches[2]
            if ($lessons[$lesson].fields -notcontains $field) { $lessons[$lesson].fields += $field }
            switch ($field) {
                'teaches' { $lessons[$lesson].teaches = @(Get-BacktickRefs $value) }
                'Uses' { $lessons[$lesson].uses = @(Get-BacktickRefs $value) }
                'Deepens' {
                    $lessons[$lesson].deepens = @(Get-BacktickRefs $value)
                    $lessons[$lesson].deepensText = $value
                }
                'Generation' { $lessons[$lesson].genText = $value }
                'Vocabulary' {
                    $lessons[$lesson].items = @(Get-VocabItems $value)
                    if ($value.Trim() -eq '-') { $lessons[$lesson].vocabDash = $true }
                }
            }
        }
    }
    Say "  INFO  labels defined: $($defined.Count)"
    # the label list may live in the work file; ## Labels then holds only a pointer
    $assigned = @{}
    if ($labelsLedger) {
        $rows = Read-LabelLedger $labelsLedger
        Say "  INFO  labels ledger: $labelsLedger ($($rows.Count) label lines)"
        foreach ($r in $rows) { if ($r.lesson -gt 0) { $assigned[$r.label] = $r.lesson } }
        $ledgerLabels = @($rows | ForEach-Object { $_.label })
        if ($defined.Count -eq 0) {
            foreach ($l in $ledgerLabels) { $defined.Add($l) }
            Say '  INFO  ## Labels is a pointer; validating the ledger instead'
        }
        else {
            $onlyLedger = $ledgerLabels | Where-Object { $defined -notcontains $_ }
            $onlyFile = $defined | Where-Object { $ledgerLabels -notcontains $_ }
            foreach ($l in $onlyLedger) { Fail "listed in the labels ledger but not in ## Labels: $l" }
            foreach ($l in $onlyFile) { Fail "listed in ## Labels but not in the labels ledger: $l" }
            if (-not $onlyLedger -and -not $onlyFile) { Pass '## Labels and the labels ledger agree' }
        }
        if ($assigned.Count -gt 0) { Say "  INFO  ledger assignments: $($assigned.Count) of $($rows.Count) labels" }
        else { Warn 'labels ledger has no -> L<n> assignment column yet' }
        $unassigned = @($rows | Where-Object { $_.lesson -le 0 })
        if ($unassigned -and $assigned.Count -gt 0) {
            foreach ($u in $unassigned) { Warn "label has no -> L<n> assignment yet: $($u.label)" }
        }
    }
    # the label list may live in the work file; the shipped roadmap may carry neither
    $assigned = @{}
    $ledgerPresent = [bool]$labelsLedger
    if ($labelsLedger) {
        $rows = Read-LabelLedger $labelsLedger
        Say "  INFO  labels ledger: $labelsLedger ($($rows.Count) label lines)"
        foreach ($r in $rows) { if ($r.lesson -gt 0) { $assigned[$r.label] = $r.lesson } }
        $ledgerLabels = @($rows | ForEach-Object { $_.label })
        if ($defined.Count -eq 0) {
            foreach ($l in $ledgerLabels) { $defined.Add($l) }
            Say '  INFO  no ## Labels in the file; validating against the ledger'
        }
        else {
            $onlyLedger = $ledgerLabels | Where-Object { $defined -notcontains $_ }
            $onlyFile = $defined | Where-Object { $ledgerLabels -notcontains $_ }
            foreach ($l in $onlyLedger) { Fail "listed in the labels ledger but not in ## Labels: $l" }
            foreach ($l in $onlyFile) { Fail "listed in ## Labels but not in the labels ledger: $l" }
            if (-not $onlyLedger -and -not $onlyFile) { Pass '## Labels and the labels ledger agree' }
        }
        if ($assigned.Count -gt 0) { Say "  INFO  ledger assignments: $($assigned.Count) of $($rows.Count) labels" }
        else { Warn 'labels ledger has no -> L<n> assignment column yet' }
        $unassigned = @($rows | Where-Object { $_.lesson -le 0 })
        if ($unassigned -and $assigned.Count -gt 0) {
            foreach ($u in $unassigned) { Warn "label has no -> L<n> assignment yet: $($u.label)" }
        }
    }

    $taught = @{}
    foreach ($k in ($lessons.Keys | Sort-Object)) {
        foreach ($lb in $lessons[$k].teaches) {
            if (-not $taught.ContainsKey($lb)) { $taught[$lb] = @() }
            $taught[$lb] += $k
        }
    }

    # no list and no ledger: the deliverable is self-contained, so take the label set from teaches:
    $labelsExternal = ($defined.Count -gt 0) -or $ledgerPresent
    if (-not $labelsExternal) {
        foreach ($lb in ($taught.Keys | Sort-Object)) { $defined.Add($lb) }
        if ($defined.Count -gt 0) {
            Say "  INFO  no label list and no ledger: label set derived from teaches: ($($defined.Count) labels)"
        }
        else { Warn 'no labels anywhere: no ## Labels, no ledger, no teaches: lines' }
    }

    $dupDef = $defined | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($dupDef) { foreach ($d in $dupDef) { Fail "label defined twice in ## Labels: $($d.Name)" } }
    $badShape = $defined | Where-Object { (@($_ -split '/')).Count -gt 3 -or $_ -cnotmatch '^[a-z0-9\-]+(/[a-z0-9\-]+)+$' }
    if ($badShape) { foreach ($b in $badShape) { Fail "label is not lowercase area/thing (max 3 parts): $b" } }
    elseif ($defined.Count -gt 0) { Pass 'every label is lowercase area/thing with at most 3 parts' }

    $twice = $taught.Keys | Where-Object { $taught[$_].Count -gt 1 } | Sort-Object
    if ($twice) { foreach ($t in $twice) { Fail "label taught more than once: $t at lessons $($taught[$t] -join ', ')" } }
    $undef = $taught.Keys | Where-Object { $defined -notcontains $_ } | Sort-Object
    if ($undef) { foreach ($u in $undef) { Fail "taught but not listed in ## Labels: $u" } }
    $untaught = $defined | Where-Object { -not $taught.ContainsKey($_) }
    if ($untaught) { foreach ($u in $untaught) { Fail "listed in ## Labels but never taught: $u" } }
    if (-not $twice -and -not $undef -and -not $untaught -and $defined.Count -gt 0) {
        if ($labelsExternal) { Pass "all $($defined.Count) labels are listed and each is taught exactly once" }
        else { Pass "each of the $($defined.Count) labels appears in exactly one teaches: line" }
    }
    if ($assigned.Count -gt 0) {
        $drift = 0
        foreach ($lb in $assigned.Keys) {
            if (-not $taught.ContainsKey($lb)) { continue }
            if ($taught[$lb][0] -ne $assigned[$lb]) {
                Fail "ledger assigns $lb to L$($assigned[$lb]) but teaches: puts it at L$($taught[$lb][0])"
                $drift++
            }
        }
        if ($drift -eq 0) { Pass 'every teaches: line matches the ledger assignment' }
    }

    if ($Counts) {
        Say ''
        Say '--- COUNTS (paste into ## Decisions; never retype from memory) ---'
        $teach = @($lessons.Keys | Where-Object { $lessons[$_].teaches.Count -gt 0 } | Sort-Object)
        $exams = @($lessons.Keys | Where-Object { $lessons[$_].teaches.Count -eq 0 -and $lessons[$_].items.Count -eq 0 } | Sort-Object)
        $areas = @($defined | ForEach-Object { ($_ -split '/')[0] } | Sort-Object -Unique)
        $itemTotal = 0
        foreach ($k in $lessons.Keys) { $itemTotal += $lessons[$k].items.Count }
        Say ("  lessons:                 {0}" -f $lessons.Count)
        Say ("  teaching lessons:        {0}" -f $teach.Count)
        Say ("  exams:                   {0}  ({1})" -f $exams.Count, ($exams -join ', '))
        Say ("  spine lines in ## Shape: {0}" -f $spineLines.Count)
        Say ("  spine families (ledger): {0}" -f $ledgerSpine.Count)
        Say ("  labels defined:          {0}" -f $defined.Count)
        Say ("  labels taught:           {0}" -f @($taught.Keys).Count)
        Say ("  distinct label areas:    {0}" -f $areas.Count)
        Say ("  vocabulary items:        {0}" -f $itemTotal)
        foreach ($k in ($lessons.Keys | Sort-Object)) {
            if ($lessons[$k].teaches.Count -eq 0) { Say ("  L{0}: EXAM, {1} uses" -f $k, $lessons[$k].uses.Count) }
            else { Say ("  L{0}: {1} labels, {2} items" -f $k, $lessons[$k].teaches.Count, $lessons[$k].items.Count) }
        }
        Say '  RESULT: COUNTS ONLY (no verdict)'
        return $true
    }

    Say ''
    Say '--- NO FORWARD REFERENCES ---'
    $itemFirst = @{}
    foreach ($k in ($lessons.Keys | Sort-Object)) {
        foreach ($it in $lessons[$k].items) {
            $bare = $it.Trim('"').Trim().ToLower()
            if (-not $itemFirst.ContainsKey($bare)) { $itemFirst[$bare] = $k }
        }
    }
    $badRefs = New-Object System.Collections.Generic.List[string]
    $itemRefs = 0
    foreach ($k in ($lessons.Keys | Sort-Object)) {
        foreach ($ref in ($lessons[$k].uses + $lessons[$k].deepens)) {
            if (-not $taught.ContainsKey($ref)) {
                # uses:/deepens: also accept vocabulary items named as they appear in vocabulary:
                $key = $ref.Trim('"').Trim().ToLower()
                if ($itemFirst.ContainsKey($key)) {
                    if ($itemFirst[$key] -ge $k) { $badRefs.Add("L$k references item '$key' introduced at L$($itemFirst[$key])") }
                    else { $itemRefs++ }
                }
                else { $badRefs.Add("L$k references a label nobody teaches and no item: $ref") }
            }
            elseif ($taught[$ref][0] -ge $k) { $badRefs.Add("L$k references $ref, taught at L$($taught[$ref][0])") }
        }
    }
    if ($badRefs.Count) { foreach ($b in $badRefs) { Fail $b } }
    else { Pass 'every uses/deepens points at a strictly earlier lesson' }
    if ($itemRefs -gt 0) { Say "  INFO  uses/deepens reference $itemRefs earlier vocabulary item(s)" }

    Say ''
    Say '--- VOCABULARY ---'
    $itemsByLesson = @{}
    $vocabProblems = 0
    foreach ($k in ($lessons.Keys | Sort-Object)) {
        $isExam = ($ExamLessons -contains $k)
        $n = @($lessons[$k].items).Count
        if ($isExam) {
            if ($n -gt 0) { Fail "exam L$k adds $n vocabulary items; exams add none"; $vocabProblems++ }
            if ($lessons[$k].teaches.Count -gt 0) { Fail "exam L$k owns a teaches: line; exams own none"; $vocabProblems++ }
            if (-not $lessons[$k].fields.Contains('Focus')) { Fail "exam L$k has no Focus: line"; $vocabProblems++ }
            if ($lessons[$k].uses.Count -eq 0) { Warn "exam L$k leans on no earlier label" }
            if ($ExamUses -gt 0 -and $lessons[$k].uses.Count -ne $ExamUses) {
                Fail "exam L$k names $($lessons[$k].uses.Count) uses labels; the rule is $ExamUses primary labels"; $vocabProblems++
            }
        }
        else {
            if ($n -lt $MinItems -or $n -gt $MaxItems) { Fail "L$k has $n vocabulary items, expected $MinItems-$MaxItems"; $vocabProblems++ }
            $lc = @($lessons[$k].teaches).Count
            if ($lc -lt $MinLabels -or $lc -gt $MaxLabels) { Fail "L$k teaches $lc label(s), expected $MinLabels-$MaxLabels"; $vocabProblems++ }
            foreach ($it in $lessons[$k].items) {
                $bare = $it.Trim('"').Trim().ToLower()
                if ($it -notmatch '"' -and $it.Trim() -match '\s') { Warn "L$k has an unquoted multiword item: $it" }
                if (-not $itemsByLesson.ContainsKey($bare)) { $itemsByLesson[$bare] = @() }
                $itemsByLesson[$bare] += $k
            }
        }
    }
    if ($vocabProblems -eq 0) { Pass "every teaching lesson has $MinItems-$MaxItems items and $MinLabels-$MaxLabels labels; exams carry neither" }

    $particles = @('up', 'on', 'with', 'in', 'at', 'for', 'to', 'of', 'off', 'out', 'by', 'about', 'from', 'into', 'over', 'down')
    $bareFound = $itemsByLesson.Keys | Where-Object { $particles -contains $_ } | Sort-Object
    if ($bareFound) { foreach ($b in $bareFound) { Fail "bare particle used as a vocabulary item: $b (lesson $($itemsByLesson[$b] -join ', '))" } }
    else { Pass 'no bare particles in vocabulary' }

    $dups = $itemsByLesson.Keys | Where-Object { $itemsByLesson[$_].Count -gt 1 } | Sort-Object
    if ($dups) {
        $legalRepeats = 0
        foreach ($d in $dups) {
            $seen = @($itemsByLesson[$d] | Sort-Object)
            foreach ($later in ($seen | Select-Object -Skip 1)) {
                # a repeat is legal when the later lesson declares it in deepens:, label or item alike
                $text = [string]$lessons[$later].deepensText
                $declared = $false
                if ($text) {
                    $pat = '(?i)(^|[^a-z0-9])' + [regex]::Escape($d) + '([^a-z0-9]|$)'
                    if ($text -match $pat) { $declared = $true }
                }
                if ($declared) { $legalRepeats++ }
                else { Fail "vocabulary item repeated without a deepens line: '$d' at L$($seen[0]) and L$later" }
            }
        }
        if ($legalRepeats -gt 0) { Say "  INFO  repeat(s) declared under deepens:: $legalRepeats" }
    }
    else { Pass 'no vocabulary item repeats across lessons' }

    # the item ledger is a working aid: drift is a warning, not a verdict
    $itemLedger = Resolve-WorkFile $null 'items' $file
    if ($itemLedger) {
        $rows = @(Read-ItemLedger $itemLedger)
        Say "  INFO  item ledger: $itemLedger ($($rows.Count) items)"
        $notInRoadmap = @($rows | Where-Object { -not $itemsByLesson.ContainsKey($_.item) })
        $otherDay = @($rows | Where-Object { $itemsByLesson.ContainsKey($_.item) -and ($itemsByLesson[$_.item] -notcontains $_.lesson) })
        foreach ($r in $notInRoadmap) { Warn "ledger has an item no lesson uses: $($r.item)" }
        foreach ($r in $otherDay) { Warn "ledger puts '$($r.item)' at L$($r.lesson); no lesson uses it there" }
        if (-not $notInRoadmap -and -not $otherDay) { Pass "the item ledger matches the roadmap's vocabulary ($($rows.Count) items)" }
    }

    Say ''
    Say '--- ENTRY FIELDS ---'
    $expectedFields = @('Focus', 'teaches', 'Deepens', 'Uses', 'Vocabulary', 'Examples', 'Real-world relevance', 'Generation')
    $fieldProblems = 0
    foreach ($k in ($lessons.Keys | Sort-Object)) {
        $f = $lessons[$k].fields
        $isExam = ($ExamLessons -contains $k)
        if ($isExam) {
            foreach ($need in @('Focus', 'Uses', 'Generation')) {
                if ($f -notcontains $need) { Fail "exam L$k is missing '$need'"; $fieldProblems++ }
            }
        }
        else {
            foreach ($need in $expectedFields) {
                if ($f -notcontains $need) { Fail "L$k is missing '$need'"; $fieldProblems++ }
            }
            if (($f -join ',') -ne ($expectedFields -join ',')) { Warn "L$k field order is: $($f -join ', ')" }
        }
    }
    if ($fieldProblems -eq 0) { Pass 'all entries carry their fields (8 on teaching lessons, Focus/Uses/Generation on exams)' }

    $lastExam = 0
    if (@($ExamLessons).Count -gt 0) { $lastExam = ($ExamLessons | Measure-Object -Maximum).Maximum }
    if ($lastExam -gt 0) {
        $tailProblems = 0
        $tailLessons = @($lessons.Keys | Where-Object { $_ -gt $lastExam } | Sort-Object)
        foreach ($k in $tailLessons) {
            if ([string]$lessons[$k].genText -notmatch '(?i)\btail\b') {
                Fail "L$k sits after the last exam (L$lastExam) but its Generation: line does not say the lesson is tail"
                $tailProblems++
            }
        }
        if ($tailLessons.Count -eq 0) { Warn "no lessons after the last exam (L$lastExam) - is the tail missing?" }
        elseif ($tailProblems -eq 0) { Pass "all $($tailLessons.Count) lessons after L$lastExam carry the tail statement" }
    }

    Say ''
    Say '--- STYLE GUARDS ---'
    $metaHit = @()
    $ln = 0
    $metaPattern = '(?i)(\b(page|class|chapter|section)\s*#?\d|\bthis page\b|\bnext page\b|\bprevious page\b|\bpage (above|below)\b|\bsection (above|below)\b|\bunit\s+\d)'
    foreach ($l in $lines) {
        $ln++
        if ($l -match '^\s*-\s' -and $l -match $metaPattern) { $metaHit += "L$ln`: $l" }
    }
    if ($metaHit) { foreach ($m in $metaHit) { Warn "entry names a page/class/section: $m" } }
    else { Pass 'no entry names a page, class or section' }

    $regLabel = $defined | Where-Object { $_ -match 'register' }
    if ($regLabel) { foreach ($r in $regLabel) { Fail "label uses 'register': $r" } }
    $regField = $lines | Where-Object { $_ -match '^\s*-\s*Register:' }
    if ($regField) { Fail 'an entry assigns a register (Register: field)' }
    if (-not $regLabel -and -not $regField) { Pass "no 'register' label and no per-entry register assignment" }

    Say ''
    Say '--- SUMMARY ---'
    Say "  files checked: 1   failures: $($failures.Count)   warnings: $($warnings.Count)"
    if ($failures.Count -eq 0) { Say '  RESULT: PASS' } else { Say '  RESULT: FAIL' }
    return ($failures.Count -eq 0)
}

# ---------------------------------------------------------------- driver
$targets = @()
if ($All) {
    $targets = Get-ChildItem -LiteralPath $repo -Filter '*-ROADMAP.md' -File |
        Where-Object { $_.Name -ne 'ROADMAP-GENERATOR.md' } | ForEach-Object { $_.FullName }
}
elseif ($Path) {
    $resolved = $Path
    if (-not [System.IO.Path]::IsPathRooted($resolved)) { $resolved = Join-Path $repo $Path }
    if (-not (Test-Path -LiteralPath $resolved)) { throw "file not found: $resolved" }
    $targets = @((Resolve-Path -LiteralPath $resolved).Path)
}
else {
    throw 'Pass -Path <file> or -All.'
}
if (-not $targets -or @($targets).Count -eq 0) { throw 'no *-ROADMAP.md found' }

$allPassed = $true
$transcript = New-Object System.Collections.Generic.List[string]
foreach ($t in $targets) {
    $ok = Test-OneRoadmap $t
    if (-not $ok) { $allPassed = $false }
    if ($Report) { $transcript.AddRange($out) }
}
if ($Report) {
    $reportPath = $Report
    if (-not [System.IO.Path]::IsPathRooted($reportPath)) { $reportPath = Join-Path $repo $Report }
    Set-Content -LiteralPath $reportPath -Value $transcript -Encoding UTF8
    Write-Host "report written: $reportPath"
}
if ($allPassed) { exit 0 } else { exit 1 }
