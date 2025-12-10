# Verificación Manual del Contrato en CeloScan

## Pasos para Verificar Manualmente

Ya que el API de CeloScan está tardando en indexar, puedes verificar manualmente siguiendo estos pasos:

### 1. Ve a la página del contrato

https://celoscan.io/address/0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648#code

### 2. Click en "Verify and Publish"

Encontrarás este botón en la sección de "Contract" tab.

### 3. Completa el formulario con estos datos:

**Contract Address (auto-filled)**:

```
0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648
```

**Compiler Type**:

```
Solidity (Single file)
```

**Compiler Version**:

```
v0.8.28+commit.7893614a
```

**Open Source License Type**:

```
MIT License (MIT)
```

**Optimization**:

```
Yes
```

**Optimization Runs**:

```
1
```

**Enter the Solidity Contract Code**:

- Usa el archivo: `/Users/0x66/celo-crossword/apps/contracts/CrosswordBoard-flattened-mainnet.sol`
- Copia todo el contenido de ese archivo

**Constructor Arguments ABI-encoded** (Optional):

```
000000000000000000000000a35dc36b55d9a67c8433de7e790074acc939f39e
```

### 4. Click "Verify and Publish"

El proceso tomará unos segundos y luego tu contrato estará verificado.

---

## Alternativa: Esperar y reintentar automáticamente

Si prefieres esperar a que el API se sincronice, puedes reintentar en 10-15 minutos con:

```bash
cd apps/contracts
npx hardhat verify --network celo \
  0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648 \
  "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e"
```

---

## Información Técnica

**Deployment TX**: https://celoscan.io/tx/0xcc62376b99ea6232eb9f77e103d4cf1bdfe17e83399b9bd4a4c78719090e3eaf

**Archivo Flattened**: `CrosswordBoard-flattened-mainnet.sol` (ya generado)

**Constructor Argument Decodificado**:

- Type: address
- Value: 0xA35Dc36B55D9A67c8433De7e790074ACC939f39e (tu dirección de deployer/owner)
