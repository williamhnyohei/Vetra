# Script de Setup Automático do Vetra
# Execute: .\setup.ps1

Write-Host "🚀 Configurando Vetra..." -ForegroundColor Yellow
Write-Host ""

# 1. Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($null -eq $nodeVersion) {
    Write-Host "❌ Node.js não encontrado! Instale: https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# 2. Instalar pnpm (se não tiver)
Write-Host ""
Write-Host "📦 Verificando pnpm..." -ForegroundColor Cyan
$pnpmVersion = pnpm --version 2>$null
if ($null -eq $pnpmVersion) {
    Write-Host "⏳ Instalando pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    $pnpmVersion = pnpm --version
}
Write-Host "✅ pnpm: $pnpmVersion" -ForegroundColor Green

# 3. Instalar dependências da extensão
Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
Set-Location -Path "frontend\extension"
pnpm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# 4. Build
Write-Host ""
Write-Host "🔨 Buildando extensão..." -ForegroundColor Cyan
pnpm build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build" -ForegroundColor Red
    exit 1
}

# 5. Instruções finais
Write-Host ""
Write-Host "🎉 Setup completo!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Abra Chrome em: chrome://extensions/" -ForegroundColor White
Write-Host "2. Ative 'Modo do desenvolvedor'" -ForegroundColor White
Write-Host "3. Clique 'Carregar sem compactação'" -ForegroundColor White
Write-Host "4. Selecione: frontend\extension\dist\" -ForegroundColor White
Write-Host ""
Write-Host "💻 Para desenvolvimento:" -ForegroundColor Yellow
Write-Host "   cd frontend\extension" -ForegroundColor White
Write-Host "   pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 Leia: GETTING_STARTED.md" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "..\..\"


