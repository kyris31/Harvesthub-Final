# HarvestHub Report File Organizer
# This script monitors the Downloads folder and automatically moves HarvestHub report PDFs
# to the appropriate folders in C:\Users\e53638\Documents\Reports

param(
    [switch]$RunOnce,
    [int]$IntervalSeconds = 5
)

# Define paths
$downloadsPath = "$env:USERPROFILE\Downloads"
$reportsBasePath = "C:\Users\e53638\Documents\Reports"

# Define report folders
$reportFolders = @{
    "Financial_Report"   = "Financial"
    "Harvest_Report"     = "Harvest"
    "Inventory_Report"   = "Inventory"
    "Cultivation_Report" = "Cultivation"
}

# Create base reports directory if it doesn't exist
if (-not (Test-Path $reportsBasePath)) {
    New-Item -ItemType Directory -Path $reportsBasePath -Force | Out-Null
    Write-Host "Created base reports directory: $reportsBasePath" -ForegroundColor Green
}

# Create subdirectories for each report type
foreach ($folder in $reportFolders.Values) {
    $folderPath = Join-Path $reportsBasePath $folder
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-Host "Created folder: $folderPath" -ForegroundColor Green
    }
}

function Move-ReportFiles {
    # Get all PDF files in Downloads folder
    $pdfFiles = Get-ChildItem -Path $downloadsPath -Filter "*.pdf" -ErrorAction SilentlyContinue
    
    foreach ($file in $pdfFiles) {
        $moved = $false
        
        # Check which report type this file belongs to
        foreach ($pattern in $reportFolders.Keys) {
            if ($file.Name -like "$pattern*") {
                $destinationFolder = Join-Path $reportsBasePath $reportFolders[$pattern]
                $destinationPath = Join-Path $destinationFolder $file.Name
                
                # Check if file already exists at destination
                if (Test-Path $destinationPath) {
                    # Add timestamp to filename to avoid overwriting
                    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
                    $nameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
                    $extension = [System.IO.Path]::GetExtension($file.Name)
                    $newName = "${nameWithoutExt}_${timestamp}${extension}"
                    $destinationPath = Join-Path $destinationFolder $newName
                }
                
                # Try to move the file with retry logic for locked files
                $maxRetries = 3
                $retryDelay = 2  # seconds
                
                for ($retry = 1; $retry -le $maxRetries; $retry++) {
                    try {
                        Move-Item -Path $file.FullName -Destination $destinationPath -Force -ErrorAction Stop
                        Write-Host "Moved: $($file.Name) -> $($reportFolders[$pattern])\" -ForegroundColor Cyan
                        $moved = $true
                        break
                    }
                    catch {
                        if ($_.Exception.Message -like "*being used by another process*") {
                            if ($retry -lt $maxRetries) {
                                Write-Host "File is locked: $($file.Name) - Retry $retry/$maxRetries in ${retryDelay}s..." -ForegroundColor Yellow
                                Start-Sleep -Seconds $retryDelay
                            }
                            else {
                                Write-Host "Could not move $($file.Name) - file is locked (close PDF viewer and it will be moved on next check)" -ForegroundColor Yellow
                            }
                        }
                        else {
                            Write-Host "Error moving $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
                            break
                        }
                    }
                }
                
                if ($moved) {
                    break
                }
            }
        }
    }
}

# Main execution
Write-Host "=== HarvestHub Report Organizer ===" -ForegroundColor Yellow
Write-Host "Monitoring: $downloadsPath" -ForegroundColor Yellow
Write-Host "Destination: $reportsBasePath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Report Types Monitored:" -ForegroundColor Yellow
foreach ($pattern in $reportFolders.Keys) {
    Write-Host "  - $pattern -> $($reportFolders[$pattern])\" -ForegroundColor Gray
}
Write-Host ""

if ($RunOnce) {
    Write-Host "Running once..." -ForegroundColor Green
    Move-ReportFiles
    Write-Host "Done!" -ForegroundColor Green
}
else {
    Write-Host "Monitoring started. Press Ctrl+C to stop." -ForegroundColor Green
    Write-Host "Checking every $IntervalSeconds seconds..." -ForegroundColor Gray
    Write-Host ""
    
    $iteration = 0
    while ($true) {
        $iteration++
        
        # Show a heartbeat every 12 iterations (1 minute if 5 second interval)
        if ($iteration % 12 -eq 0) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Monitoring..." -ForegroundColor DarkGray
        }
        
        Move-ReportFiles
        Start-Sleep -Seconds $IntervalSeconds
    }
}
