# HarvestHub Report Organizer - Quick Start

## How to Use This Script

### Option 1: Run Once (Organize existing reports)
```powershell
.\organize-reports.ps1 -RunOnce
```

### Option 2: Continuous Monitoring (Recommended)
```powershell
.\organize-reports.ps1
```
This will monitor your Downloads folder every 5 seconds and automatically move report files.

### Option 3: Custom Interval
```powershell
.\organize-reports.ps1 -IntervalSeconds 10
```

### Option 4: Run in Background
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\organize-reports.ps1" -WindowStyle Minimized
```

## What It Does

The script monitors your Downloads folder for HarvestHub report PDFs and automatically organizes them into:

```
C:\Users\e53638\Documents\Reports\
├── Financial\     (Financial_Report_*.pdf)
├── Harvest\       (Harvest_Report_*.pdf)
├── Inventory\     (Inventory_Report_*.pdf)
└── Cultivation\   (Cultivation_Report_*.pdf)
```

## Features

- ✅ Auto-creates folder structure
- ✅ Prevents file overwrites (adds timestamp if file exists)
- ✅ Real-time monitoring
- ✅ Error handling
- ✅ Colored console output

## To Run on Startup

1. Press `Win + R`
2. Type `shell:startup` and press Enter
3. Create a shortcut to this script in that folder
4. Right-click shortcut → Properties
5. In "Target" field, add:
   ```
   powershell.exe -WindowStyle Hidden -File "C:\Users\e53638\Desktop\FarmManagement\harvesthub-v2\scripts\organize-reports.ps1"
   ```

## Stopping the Script

Press `Ctrl + C` in the PowerShell window running the script.
