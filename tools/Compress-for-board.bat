@echo off
rem ADCI reception board - shrink photos and videos before uploading them to GitHub.
rem Drag photos, videos or a folder onto this file. Compressed copies are saved in a
rem "Compressed for board" folder next to them; the originals are never changed.
rem The PowerShell part below is copied to a temp file and run with the dropped files.
setlocal
set "SELF=%~f0"
set "PS1=%TEMP%\adci-compress-for-board.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s = Get-Content -Raw -LiteralPath $env:SELF; Set-Content -LiteralPath $env:PS1 -Encoding UTF8 -Value $s.Substring($s.IndexOf('#' + 'PS-START'))"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" %*
exit /b

#PS-START
$ErrorActionPreference = 'Continue'
$Host.UI.RawUI.WindowTitle = 'ADCI board - compress photos and videos'
$MaxSide = 1920          # the board never shows more than this
$LimitMB = 25            # github.com upload limit per file
$Images = '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff'
$Videos = '.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.wmv'

function Find-FFmpeg {
    $c = Get-Command ffmpeg -ErrorAction SilentlyContinue
    if ($c) { return $c.Source }
    $w = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter ffmpeg.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($w) { return $w.FullName }
    return $null
}
function Show-MB($bytes) { if ($bytes -lt 1MB) { '{0:N0} KB' -f ($bytes / 1KB) } else { '{0:N1} MB' -f ($bytes / 1MB) } }
function Wait-Close { Write-Host ''; Read-Host 'Press Enter to close' | Out-Null }

$ff = Find-FFmpeg
if (-not $ff) {
    Write-Host 'This tool needs ffmpeg (free), which is not installed on this PC.' -ForegroundColor Yellow
    $a = Read-Host 'Install it now? (Y/N)'
    if ($a -match '^[Yy]') {
        winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements
        $ff = Find-FFmpeg
    }
    if (-not $ff) { Write-Host 'ffmpeg is still missing. Ask IT to install it (winget install Gyan.FFmpeg).' -ForegroundColor Red; Wait-Close; exit 1 }
}

$files = @()
foreach ($p in $args) {
    if (Test-Path -LiteralPath $p -PathType Container) { $files += Get-ChildItem -LiteralPath $p -File }
    elseif (Test-Path -LiteralPath $p) { $files += Get-Item -LiteralPath $p }
}
$files = @($files | Where-Object { ($Images + $Videos) -contains $_.Extension.ToLower() })
if (-not $files.Count) {
    Write-Host 'Drag photos, videos or a folder onto Compress-for-board.bat.'
    Write-Host "Photos: $($Images -join ' ')   Videos: $($Videos -join ' ')"
    Wait-Close; exit 0
}

$out = Join-Path $files[0].DirectoryName 'Compressed for board'
New-Item -ItemType Directory -Force -Path $out | Out-Null
Write-Host "Saving compressed copies to: $out`n"

$n = 0
foreach ($f in $files) {
    $n++
    $ext = $f.Extension.ToLower()
    $isVideo = $Videos -contains $ext
    $dest = Join-Path $out ($f.BaseName + $(if ($isVideo) { '.mp4' } else { '.jpg' }))
    Write-Host ("[{0}/{1}] {2} ..." -f $n, $files.Count, $f.Name) -NoNewline
    if ($isVideo) {
        # 1080p H.264, about 4 Mbit/s at most, no sound (the board plays videos muted),
        # index at the start so playback can begin while the rest downloads.
        & $ff -v error -y -i $f.FullName -vf "scale='trunc(min($MaxSide,iw)/2)*2':-2" -c:v libx264 -profile:v high -preset medium -crf 23 -maxrate 4M -bufsize 8M -pix_fmt yuv420p -an -movflags +faststart $dest
    } else {
        & $ff -v error -y -i $f.FullName -vf "scale='min($MaxSide,iw)':'min($MaxSide,ih)':force_original_aspect_ratio=decrease,format=yuvj420p" -q:v 3 $dest
    }
    if (-not (Test-Path -LiteralPath $dest)) { Write-Host ' FAILED (could not read this file)' -ForegroundColor Red; continue }
    $new = (Get-Item -LiteralPath $dest).Length
    # Already small: keep the original if ours came out bigger and the format is already right.
    if ($new -ge $f.Length -and ($ext -eq '.jpg' -or $ext -eq '.jpeg' -or $ext -eq '.mp4')) {
        Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $out $f.Name) -Force
        if ($dest -ne (Join-Path $out $f.Name)) { Remove-Item -LiteralPath $dest }
        $dest = Join-Path $out $f.Name; $new = $f.Length
    }
    $msg = " {0} -> {1}" -f (Show-MB $f.Length), (Show-MB $new)
    if ($new -gt $LimitMB * 1MB) { Write-Host "$msg  STILL OVER $LimitMB MB - trim the video shorter" -ForegroundColor Red }
    else { Write-Host $msg -ForegroundColor Green }
    if ((Split-Path $dest -Leaf) -ne $f.Name) { Write-Host "      saved as $(Split-Path $dest -Leaf)" }
}
Write-Host "`nDone. Upload the files from '$out' to media/photos or media/videos on github.com."
if (-not $env:ADCI_NO_OPEN) { Start-Process explorer.exe -ArgumentList "`"$out`"" }
Wait-Close
