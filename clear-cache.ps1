# Clear all caches and restart Expo

Write-Host "Clearing Expo caches..." -ForegroundColor Green

# Clear Expo cache
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Cleared .expo cache" -ForegroundColor Green

# Clear node_modules cache
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Cleared node_modules cache" -ForegroundColor Green

# Clear Babel cache
Remove-Item -Path "node_modules\.babel-cache" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Cleared Babel cache" -ForegroundColor Green

# Clear Metro cache
Remove-Item -Path "node_modules\.metro-cache" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Cleared Metro cache" -ForegroundColor Green

Write-Host "`nReady to restart Expo!" -ForegroundColor Green
Write-Host "Run: npm start" -ForegroundColor Yellow
