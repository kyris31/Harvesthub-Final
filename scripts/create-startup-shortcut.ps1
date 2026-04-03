# Create a startup shortcut for HarvestHub Report Organizer
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$vbsScriptPath = "C:\Users\e53638\Desktop\FarmManagement\harvesthub-v2\scripts\start-report-organizer-silent.vbs"
$shortcutPath = Join-Path $startupFolder "HarvestHub Report Organizer.lnk"

# Create WScript Shell object
$WshShell = New-Object -ComObject WScript.Shell

# Create the shortcut
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $vbsScriptPath
$Shortcut.WorkingDirectory = "C:\Users\e53638\Desktop\FarmManagement\harvesthub-v2\scripts"
$Shortcut.Description = "HarvestHub Report Organizer - Auto-organize downloaded report PDFs"
$Shortcut.Save()

Write-Host "Startup shortcut created successfully at: $shortcutPath" -ForegroundColor Green
Write-Host "The report organizer will now start automatically when you log in." -ForegroundColor Green
