$ADB       = "C:\Users\thiag\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$JAVA_HOME = "C:\Dev\Android\jbr"
$FRONTEND  = "C:\Dev\dispensa\frontend"
$APK       = "$FRONTEND\android\app\build\outputs\apk\debug\app-debug.apk"

Set-Location $FRONTEND

Write-Host "`n=== Build frontend ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no build do frontend" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Sync Capacitor ===" -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no cap sync" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Build APK ===" -ForegroundColor Cyan
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"
$env:ANDROID_HOME = "C:\Users\thiag\AppData\Local\Android\Sdk"
Set-Location "$FRONTEND\android"
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { Write-Host "ERRO no build do APK" -ForegroundColor Red; exit 1 }

Write-Host "`n=== Instalar no celular ===" -ForegroundColor Cyan
$devices = & $ADB devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }
if (-not $devices) {
    Write-Host "Nenhum celular conectado. Conecta o celular e tenta de novo." -ForegroundColor Yellow
    exit 1
}
& $ADB install -r $APK
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n APK instalado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`nERRO ao instalar o APK" -ForegroundColor Red
}
