# Resumen del Deployment a Celo Mainnet

## ✅ Deployment Exitoso

**Fecha**: 9 de Diciembre, 2025  
**Contrato**: CrosswordBoard  
**Red**: Celo Mainnet (Chain ID: 42220)

### Información del Contrato

- **Dirección del Contrato**: `0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648`
- **Owner/Deployer**: `0xA35Dc36B55D9A67c8433De7e790074ACC939f39e`
- **Tx Hash del Deployment**: `0xcc62376b99ea6232eb9f77e103d4cf1bdfe17e83399b9bd4a4c78719090e3eaf`
- **Bloque**: 53430138

### Enlaces

- **CeloScan**: https://celoscan.io/address/0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648
- **Tx de Deployment**: https://celoscan.io/tx/0xcc62376b99ea6232eb9f77e103d4cf1bdfe17e83399b9bd4a4c78719090e3eaf

---

## 📝 Verificación del Contrato

### Estado Actual

⏳ **Pendiente** - El API de CeloScan aún está indexando el bytecode del contrato.

### Verificación Automática

Comando para verificar cuando esté listo:

```bash
cd apps/contracts
npx hardhat verify --network celo \
  0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648 \
  "0xA35Dc36B55D9A67c8433De7e790074ACC939f39e"
```

O usando Hardhat Ignition:

```bash
npx hardhat ignition verify chain-42220 --include-unrelated-contracts
```

### Verificación Manual (Si es necesario)

Si la verificación automática sigue fallando, puedes verificar manualmente en CeloScan:

1. Ve a: https://celoscan.io/address/0x9057D09e0C9cBb863C002FC0E1Af1098df5B7648#code

2. Click en "Verify and Publish"

3. Usa estos parámetros:

   - **Compiler Type**: Solidity (Single file)
   - **Compiler Version**: v0.8.28+commit.7893614a
   - **License**: MIT
   - **Optimization**: Yes
   - **Optimization Runs**: 1
   - **Constructor Arguments ABI-encoded**:
     ```
     000000000000000000000000a35dc36b55d9a67c8433de7e790074acc939f39e
     ```
   - **Contract Source Code**: Usar el archivo flattened (ver instrucciones abajo)

4. Para generar el código flattened:
   ```bash
   cd apps/contracts
   npx hardhat flatten contracts/CrosswordBoard.sol > CrosswordBoard-flattened.sol
   ```

---

## 🎯 Próximos Pasos

### 1. Configurar Tokens Permitidos

El contrato necesita que configures qué tokens pueden usarse para los premios:

```solidity
// Para permitir CELO nativo
contract.setAllowedToken(
  "0x471EcE3750Da237f93B8E339c536989b8978a438", // CELO token address
  true
)
```

### 2. Crear Primer Crucigrama

Una vez configurados los tokens, puedes crear crucigramas:

```solidity
contract.createCrosswordWithNativeCELO(
  crosswordId,        // bytes32: ID único del crucigrama
  "Mi Primer Crucigrama", // string: nombre
  gridData,           // string: datos del grid en JSON
  prizePool,          // uint256: pool de premios en wei
  [50, 30, 20],      // uint256[]: porcentajes para ganadores
  endTime            // uint256: timestamp de finalización
)
```

### 3. Verificar en el Frontend

El frontend ya está configurado con la nueva dirección:

- Dirección actualizada en `/apps/web/src/lib/contracts.ts`
- ABIs actualizados en `/apps/web/src/lib/abis/`

Para probar:

```bash
cd apps/web
npm run dev
```

---

## ⚙️ Configuración Técnica

### Compilador

- **Solidity**: 0.8.28
- **Optimizer**: Enabled (1 run)
- **Via IR**: Enabled

### Roles y Permisos

- **Owner**: `0xA35Dc36B55D9A67c8433De7e790074ACC939f39e`

  - Puede agregar/remover admins
  - Puede transferir ownership
  - Tiene todos los permisos de admin

- **Admin Role**: Otorgado automáticamente al owner
  - Puede crear crucigramas
  - Puede configurar tokens permitidos
  - Puede pausar/despausar el contrato

### Funciones Principales

**Para la App**:

- `createCrosswordWithNativeCELO()` - Crear crucigrama con CELO
- `createCrossword()` - Crear crucigrama con ERC20
- `solveCrossword()` - Resolver crucigrama (usuarios)
- `getCrossword()` - Obtener datos del crucigrama
- `getAllCrosswordIds()` - Listar todos los crucigramas

**Administración**:

- `setAllowedToken()` - Permitir/denegar tokens
- `addAdmin()` / `removeAdmin()` - Gestionar admins
- `pause()` / `unpause()` - Pausar contrato
- `recoverUnclaimedPrizes()` - Recuperar premios no reclamados

---

## 📊 Próxima Validación

Una vez verificado el contrato en CeloScan:

1. ✅ Código fuente visible y verificado
2. ✅ Usuarios pueden leer el contrato directamente
3. ✅ Funciones write disponibles para interactuar
4. ✅ Mayor transparencia y confianza

---

## 🔗 Referencias

- **Documentación de Hardhat Verify**: https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify
- **CeloScan API**: https://celoscan.io/apis
- **Deployment History**: `/apps/contracts/ignition/deployments/chain-42220/`

---

**Fecha de Generación**: 9 de Diciembre, 2025  
**Deployment Transaction**: https://celoscan.io/tx/0xcc62376b99ea6232eb9f77e103d4cf1bdfe17e83399b9bd4a4c78719090e3eaf
