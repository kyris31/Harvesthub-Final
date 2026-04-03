@echo off
REM HarvestHub Report Organizer - Startup Script
REM This runs the report organizer in a hidden window

PowerShell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\e53638\Desktop\FarmManagement\harvesthub-v2\scripts\organize-reports.ps1"
