#!/bin/bash

echo "==========================================="
echo "Verificación de Contrato - Día 2"
echo "==========================================="
echo ""
echo "Contrato: 0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648"
echo "Fecha deployment: Dec 9, 2024"
echo ""

# Verificar con Hardhat
echo "Intentando verificación en CeloScan..."
npx hardhat verify --network celo \
  0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648 \
  "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Verificación exitosa en CeloScan!"
    echo "Ver en: https://celoscan.io/address/0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648#code"
else
    echo ""
    echo "❌ CeloScan aún no indexó el contrato"
    echo ""
    echo "Opciones:"
    echo "1. Esperar más (el API puede tardar hasta 48h)"
    echo "2. Contactar soporte: https://celoscan.io/contactus"
    echo ""
    echo "Mientras tanto, el contrato está verificado en Sourcify:"
    echo "https://repo.sourcify.dev/contracts/full_match/42220/0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648/"
fi
