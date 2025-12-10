# Documentación Técnica Completa: Crossword Board DApp

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Contrato Inteligente](#contrato-inteligente)
4. [Frontend y UI](#frontend-y-ui)
5. [Flujos de Usuario](#flujos-de-usuario)
6. [Implementaciones Específicas](#implementaciones-específicas)
7. [APIs y Contratos](#apis-y-contratos)
8. [Deployment y Operación](#deployment-y-operación)
9. [Consideraciones Técnicas](#consideraciones-técnicas)
10. [Testing](#testing)

---

## Resumen Ejecutivo

Crossword Board es una DApp descentralizada construida en la blockchain Celo que permite a los usuarios completar crucigramas con recompensas basadas en velocidad de completación. El sistema otorga premios automáticos a los primeros X completadores de cada crucigrama, con verificación on-chain y distribución de premios inmediata.

### Características Principales:

- **Premios automáticos**: Los primeros X completadores reciben recompensas inmediatamente
- **Verificación on-chain**: Todos los estados y transacciones se almacenan en la blockchain
- **Interfaz intuitiva**: Experiencia de usuario optimizada para móviles y web
- **Sistema de liderazgo**: Tabla pública de los primeros 10 completadores
- **Integración con Farcaster**: Perfiles sociales y reputación en cadena

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────┐
│              Frontend               │
├─────────────────────────────────────┤
│ • Next.js App Router (React)        │
│ • Wagmi + Viem Integration          │
│ • Farcaster Frame SDK               │
│ • Tailwind CSS + shadcn/ui          │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│           Blockchain Layer          │
├─────────────────────────────────────┤
│ • Celo Sepolia Testnet              │
│ • Contrato: CrosswordBoard          │
│ • ABI dinámico (importado en hooks) │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Infraestructura             │
├─────────────────────────────────────┤
│ • Hardhat (desarrollo)              │
│ • Viem (interacción con contratos)  │
│ • Wagmi (wallet integration)        │
└─────────────────────────────────────┘
```

### Stack Tecnológico:

- **Frontend**: Next.js 14+, React 18+, TypeScript
- **Blockchain**: Celo Sepolia, Solidity 0.8.28
- **Web3**: Wagmi, Viem 2.x, Hardhat
- **Estilos**: Tailwind CSS, shadcn/ui
- **Infraestructura**: Celo Foro Nodes

---

## Contrato Inteligente

### Archivo: `CrosswordBoard.sol`

#### Estructuras de Datos Principales:

```solidity
struct Crossword {
    address token;                    // Token ERC20 o address(0) para CELO nativo
    uint256 totalPrizePool;           // Pool total de premios
    uint256[] winnerPercentages;      // Porcentajes para ganadores (basis points)
    CompletionRecord[] completions;   // Lista de completadores con rango
    mapping(address => bool) hasClaimed; // Registro de reclamos
    uint256 activationTime;           // Tiempo de activación
    uint256 endTime;                  // Tiempo límite (0 = sin límite)
    CrosswordState state;             // Estado del crucigrama
    uint256 createdAt;                // Fecha de creación
    uint256 claimedAmount;            // Monto total reclamado
}

struct CompletionRecord {
    address user;                     // Usuario que completó
    uint256 timestamp;                // Timestamp de completación
    uint256 rank;                     // Rango de finalización
}
```

#### Roles de Acceso:

- `DEFAULT_ADMIN_ROLE`: Propietario del contrato
- `ADMIN_ROLE`: Administradores del sistema
- `OPERATOR_ROLE`: Operadores que pueden registrar completaciones

### Funciones Públicas Clave:

#### `setCrossword(bytes32 crosswordId, string memory crosswordData)`

**Rol requerido**: `ADMIN_ROLE`**Finalidad**: Establece el crucigrama activo para todos los usuarios**Parámetros**:

- `crosswordId`: Identificador único del crucigrama (keccak256 hash)
- `crosswordData`: JSON string con la configuración del crucigrama
  **Evento emitido**: `CrosswordUpdated`

#### `createCrosswordWithNativeCELO(bytes32 crosswordId, uint256 prizePool, uint256[] memory winnerPercentages, uint256 endTime)`

**Rol requerido**: `ADMIN_ROLE`**Finalidad**: Crea un nuevo crucigrama con premios en CELO nativo**Parámetros**:

- `crosswordId`: ID del crucigrama
- `prizePool`: Monto total de premios (wei)
- `winnerPercentages`: Array de porcentajes por posición (en basis points)
- `endTime`: Timestamp límite para completaciones o 0 para sin límite
  **Pago requerido**: `msg.value == prizePool`
  **Evento emitido**: `CrosswordCreated`, `CrosswordActivated`

#### `completeCrossword(uint256 durationMs, string username, string displayName, string pfpUrl)`

**Acceso**: Público**Finalidad**: Completa un crucigrama y otorga premio automático si es elegible**Parámetros**:

- `durationMs`: Duración en milisegundos
- `username`: Nombre de usuario (Farcaster)
- `displayName`: Nombre para mostrar
- `pfpUrl`: URL de imagen de perfil**Funcionalidad**:
- Registra la completación en el estado global
- **Automáticamente llama a `recordCompletion` para posibles premios**
- Emite `CrosswordCompleted`**Requisitos**:
- Usuario no debe haber completado este crucigrama antes
- Crucigrama debe estar activo
- Duración debe ser > 0

#### `recordCompletion(bytes32 crosswordId, address user) external onlyRole(OPERATOR_ROLE) returns (bool rewarded)`

**Rol requerido**: `OPERATOR_ROLE`**Finalidad**: Registra la completación y distribuye premios automático**Acceso interno**: Llamada desde `completeCrossword` usando `try-catch`**Lógica**:

- Verifica que el crucigrama esté activo
- Verifica límites de premios (no más de `winnerPercentages.length`)
- Prevención de duplicados
- Cálculo de premio: `(totalPrizePool * winnerPercentages[rank - 1]) / MAX_PERCENTAGE`
- Transferencia de premio (CELO nativo o ERC20)
- Marca como reclamado: `crossword.hasClaimed[user] = true`

#### `claimPrize(bytes32 crosswordId)`

**Acceso**: Público**Finalidad**: Permitir reclamo manual de premio (para feedback UX)**Lógica**:

- Verifica que el crucigrama tenga premios
- Verifica que el usuario haya completado (`hasCompletedCrossword`)
- Busca posición del usuario en el array `completions`
- Verifica que no haya reclamado antes (`crossword.hasClaimed`)
- **Importante**: Si ya reclamó, permite transacción para feedback pero sin doble pago
- Emite `PrizeDistributed`**Errores comunes**:
- "no prize pool available" - Crucigrama no tiene premios
- "not a verified winner" - Usuario no completó
- "completion record not found" - Usuario no está en el array `completions`

#### `hasClaimedPrize(bytes32 crosswordId, address user) external view returns (bool)`

**Acceso**: Público (view)
**Finalidad**: Verificación directa del estado de reclamo
**Retorno**: `true` si el usuario ya reclamó para este crucigrama
**Uso**: Verificación por frontend para mostrar estado correcto

### Estados y Validaciones:

#### Estados del Crucigrama:

```solidity
enum CrosswordState {
    Inactive, // No activo
    Active,   // Activo para completación
    Complete  // Premios distribuidos
}
```

#### Validaciones de Seguridad:

- Control de acceso mediante `AccessControl`
- Protección contra reentrancy con `ReentrancyGuard`
- Pausable mediante `Pausable`
- Validación de porcentajes totales ≤ 10000 (100%)
- Verificación de saldos antes de transferencias
- Prevención de reclamos duplicados con `hasClaimed` mapping

---

## Frontend y UI

### Archivo Principal: `/app/leaderboard/page.tsx`

#### Componentes Clave:

1. **Tabla de Líderes**: Muestra los primeros 10 completadores on-chain
2. **Botón de Claim**: Únicamente para usuarios elegibles con verificación de estado real
3. **Perfil Farcaster**: Integración con perfiles sociales descentralizados
4. **Navegación**: Home, Refresh, etc.

#### Hooks Personalizados:

##### `useClaimPrize`

- Maneja la interacción con `claimPrize` en el contrato
- Proporciona estados: `isLoading`, `isSuccess`, `isError`
- Gestiona notificaciones toast

##### `useGetCrosswordCompletions`

- Lee completaciones directamente del contrato
- Mapea datos de tuple-style a object-style
- Proporciona datos para leaderboard

##### `useCrosswordPrizesDetails`

- Obtiene información detallada del crucigrama (premios, ganadores)
- Incluye array de completions con rango y tiempo

#### Lógica de Verificación de Estado:

```javascript
// Verifica el estado real del contrato, no solo estado local
const checkClaimStatus = async () => {
  const hasClaimed = await readContract(config, {
    address: contractInfo.address as `0x${string}`,
    abi: abi, // ABI para hasClaimedPrize
    functionName: 'hasClaimedPrize',
    args: [crosswordId, userAddress as `0x${string}`]
  });
  return Boolean(hasClaimed);
};
```

### Componente Juego: `/components/crossword-game.tsx`

#### Funcionalidades:

- Interfaz de juego de crucigrama (grid, clues)
- Verificación de completitud
- Guardado automático en blockchain
- Integración con Farcaster para perfiles
- Sistema de claim integrado (aunque no se usa en la mayoría de los casos)

---

## Flujos de Usuario

### Flujo Completo de Completador Ganador:

1. **Usuario accede al crucigrama**

   - Lee crucigrama desde `currentCrosswordId` del contrato
   - Muestra datos en formato JSON a través de UI
2. **Usuario completa rápidamente**

   - Interfaz verifica completitud
   - Calcula duración (time to complete)
   - Prepara datos de usuario (Farcaster profile)
3. **Llama `completeCrossword()`**

   - Transacción con duración y metadatos de usuario
   - Contrato registra completación en `hasCompletedCrossword`
   - Contrato llama a `recordCompletion` internamente
4. **Premio automático si es elegible**

   - Si está entre top X finishers → recibe premio inmediatamente
   - Contrato marca `hasClaimed[user] = true`
   - Transferencia de tokens/CELO realizada
5. **Redirección a leaderboard**

   - Usuario aparece como "Winner" y "Claimed!"
6. **Estado persiste tras reload**

   - Frontend consulta `hasClaimedPrize` del contrato
   - Botón muestra "Claimed!" basado en estado real del contrato

### Flujo de Completador No Ganador:

1. **Usuario completa después de slots llenos**
2. **Recibe confirmación de completación** pero no premio
3. **Aparece en leaderboard** pero sin estatus de ganador
4. **No puede reclamar premio** (no está en top winners)

### Flujo de Reclamo Manual (caso especial):

1. **Usuario fue ganador pero no recibió pago automático**
2. **Botón de "Claim Prize" visible** con verificación de elegibilidad
3. **Llama `claimPrize()`** con validación en contrato
4. **Recibe premio** si es elegible y no reclamado

---

## Implementaciones Específicas

### Problema Resuelto: "CrosswordBoard: completion record not found"

- **Causa**: Frontend mostraba botón de claim para usuarios que no estaban en array `completions`
- **Solución**:
  - Verificación de elegibilidad basada en presencia en `completions` array
  - Validación de estado real del contrato en lugar de solo estado local

### Problema Resuelto: Estado no persistía tras recarga

- **Causa**: Estado `isClaimSuccess` era local y se reiniciaba
- **Solución**:
  - Agregada función `hasClaimedPrize` al contrato
  - Frontend consulta estado real del contrato tras cada carga
  - Botón refleja estado真实 del contrato, no estado de sesión

### Problema Resuelto: Posibilidad de reclamos múltiples

- **Causa**: Falta de validación suficiente en UI
- **Solución**:
  - Contrato maneja prevención de doble pago con `hasClaimed` mapping
  - UI verifica elegibilidad antes de permitir interacción
  - Botón se deshabilita en base al estado del contrato

### Implementación de Premios Automáticos:

- **Concepto**: Ganadores reciben premios inmediatamente al completar
- **Mecanismo**: `completeCrossword` → `recordCompletion` interno
- **Beneficio**: Experiencia de usuario mejorada sin paso adicional

---

## APIs y Contratos

### Endpoints del Contrato:

#### Lectura (View Functions):

- `getCurrentCrossword()`: Obtiene crucigrama activo
- `getCrosswordDetails(bytes32)`: Detalles completos del crucigrama
- `getUserCompletions(bytes32, address)`: Completación específica de usuario
- `hasClaimedPrize(bytes32, address)`: Estado de reclamo (nuevo)
- `isWinner(bytes32, address)`: Verifica si es ganador

#### Escritura (External Functions):

- `setCrossword(bytes32, string)`: Establece nuevo crucigrama
- `createCrosswordWithNativeCELO(...)`: Crea crucigrama con premios
- `completeCrossword(...)`: Completa crucigrama y otorga premio
- `claimPrize(bytes32)`: Reclama premio manualmente
- `activateCrossword(bytes32)`: Activa crucigrama

### ABI Dinámica:

Los ABIs se cargan dinámicamente en los hooks para mantener archivos pequeños y actualizados.

### Direcciones de Contrato:

- **Celo Sepolia**: `0x5516d6bc563270Cbe27ca7Ed965cAA597130954A`

---

## Deployment y Operación

### Despliegue:

```bash
cd /apps/contracts
pnpm run deploy:sepolia
```

### Configuración Requerida:

- Variable de entorno: `PRIVATE_KEY`
- Configuración de red: `SEPOLIA_RPC_URL`
- Variables: `REPORT_GAS` (opcional)

### Scripts de Hardhat:

- `ignition/modules/Crossword.ts`: Módulo de deployment
- `hardhat.config.ts`: Configuración de redes
- Contrato: `CrosswordBoard` con roles de acceso

---

## Consideraciones Técnicas

### Seguridad:

- **Access Control**: Roles específicos para diferentes operaciones
- **Reentrancy Guard**: Prevención de ataques de reentrada
- **Balance Checks**: Validación de saldos antes de transferencias
- **State Validation**: Verificaciones múltiples antes de cambios

### Eficiencia:

- **Gas Optimization**: Cálculos eficientes, validaciones tempranas
- **Storage Layout**: Uso eficiente de mappings y arrays
- **View Functions**: Operaciones de lectura baratas

### Escalabilidad:

- **State Management**: Datos indexados por IDs
- **Completions Tracking**: Arrays eficientes con límites
- **Prize Distribution**: Lógica rápida con bases points

### Experiencia de Usuario:

- **Immediate Feedback**: Estados visuales instantáneos
- **Consistent States**: Persistencia de estado entre sesiones
- **Error Handling**: Mensajes claros y acciónables
- **Loading States**: Indicadores de progreso

---

## Testing

### Casos de Prueba Clave:

1. **Creación de crucigrama con premios**
2. **Completación por múltiples usuarios**
3. **Recepción automática de premios**
4. **Verificación de estado post-recarga**
5. **Intentos de reclamo múltiple**
6. **Usuarios no ganadores intentando reclamar**
7. **Edge cases (completaciones simultáneas)**

### Pruebas Unitarias:

- Funciones del contrato con Hardhat
- Hooks personalizados con Jest
- UI components con React Testing Library

### Pruebas End-to-End:

- Flujos completos de usuario
- Validación de estados en contrato
- Interacción blockchain-Frontend

---

## Mantenimiento y Actualizaciones Futuras

### Monitoreo:

- Estados de contrato
- Transacciones de premios
- Balance de contratos
- Uptime de servicios

### Actualizaciones:

- ABI regeneration automática
- Deployment scripts versionados
- Breaking changes tracking

### Soporte:

- Logs detallados
- Errores descriptivos
- Documentación de troubleshooting



# Guía de Deployment y Verificación en Celo Mainnet

Esta guía detalla los pasos para desplegar y verificar el contrato `CrosswordBoard` en la red Celo Mainnet.

## 1. Prerrequisitos

Asegúrate de tener lo siguiente configurado en tu archivo `.env`:

```bash
# Tu clave privada (debe tener CELO real para gas)
PRIVATE_KEY=tu_clave_privada_aqui

# API Key de CeloScan (Regístrate en celoscan.io)
CELOSCAN_API_KEY=tu_api_key_aqui
```

> **Nota Importante**: Asegúrate de que la cuenta asociada a `PRIVATE_KEY` tenga suficientes tokens CELO para cubrir el costo del gas en Mainnet.

## 2. Configuración de Hardhat

Verifica que tu `hardhat.config.ts` tenga la configuración correcta para `celo` (Mainnet). Ya debería estar configurado así:

```typescript
    celo: {
      url: "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42220,
    },
```

Y la configuración de Etherscan para la verificación:

```typescript
    etherscan: {
        apiKey: process.env.CELOSCAN_API_KEY,
        customChains: [
            {
                network: "celo",
                chainId: 42220,
                urls: {
                    apiURL: "https://api.etherscan.io/v2/api",
                    browserURL: "https://celoscan.io/",
                },
            },
            // ...
        ]
    },
```

## 3. Deployment en Mainnet

Para desplegar el contrato en Mainnet, ejecuta el siguiente comando. Esto usará Hardhat Ignition con el módulo que ya tenemos.

```bash
npx hardhat ignition deploy ignition/modules/CrosswordBoard.ts --network celo --parameters ignition/parameters.json
```

> Si no tienes un archivo `parameters.json` específico, puedes omitir `--parameters` si los valores por defecto en el módulo son correctos, o crear uno si necesitas cambiar el `initialOwner`.

El comando te pedirá confirmación. Una vez confirmado, verás la dirección del contrato desplegado.

**Ejemplo de salida:**

```
Deployed Addresses

CrosswordModule#CrosswordBoard - 0x... (Tu Nueva Dirección Mainnet)
```

## 4. Verificación en Mainnet

Una vez desplegado, espera unos minutos para que el explorador indexe el contrato. Luego ejecuta el comando de verificación.

Reemplaza `DIRECCION_DEL_CONTRATO` con la dirección que obtuviste en el paso anterior y `DIRECCION_OWNER` con la dirección que usaste como `initialOwner` (generalmente tu address si no especificaste otra).

```bash
npx hardhat verify --network celo DIRECCION_DEL_CONTRATO "DIRECCION_OWNER"
```

### Ejemplo:

```bash
npx hardhat verify --network celo 0x123...abc "0xYourWalletAddress"
```

## 5. Solución de Problemas Comunes

### Error: "Invalid API Key"

Si recibes este error, asegúrate de que tu `CELOSCAN_API_KEY` en el archivo `.env` sea válida y corresponda a una cuenta en [celoscan.io](https://celoscan.io/). A veces las keys de testnet funcionan en mainnet, pero es mejor verificar.

### Error: "Bytecode does not match"

Esto sucede si el código local ha cambiado desde el deployment. Asegúrate de no modificar ningún archivo `.sol` entre el deployment y la verificación.

### Verificación Manual (Si falla la automática)

1. Genera el archivo aplanado:
   ```bash
   npx hardhat flatten contracts/CrosswordBoard.sol > CrosswordBoard-Mainnet.sol
   ```
2. Ve a [CeloScan Mainnet](https://celoscan.io/).
3. Busca tu contrato por su dirección.
4. Ve a la pestaña **Contract** -> **Verify and Publish**.
5. Selecciona:
   - **Compiler Type**: Solidity (Single file)
   - **Compiler Version**: v0.8.28 (o la que aparezca en tu hardhat config)
   - **License**: MIT
6. Pega el contenido de `CrosswordBoard-Mainnet.sol`.
7. Asegúrate de que "Optimization" esté en **Yes** y Runs en **200** (según tu config).
8. Pega los argumentos del constructor codificados en ABI si es necesario (Hardhat verify suele imprimirlos si falla).

## 6. Actualización del Frontend

Una vez verificado:

1. Copia el nuevo ABI y la dirección.
2. Crea o actualiza el archivo `apps/contracts/web/contracts/mainnet-deployment.json` (similar a `sepolia-deployment.json` pero para mainnet).
3. Actualiza tu aplicación web para apuntar a la dirección de Mainnet cuando esté en modo producción.



# Contract Verification Information

## Corrected Contract File

I have prepared a corrected contract file by removing the dotenv injection lines that were causing the verification error.

## Original Error

The original error was due to the flattened contract file containing this line at the beginning:
`[dotenv@17.2.3] injecting env (5) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com`

This is not valid Solidity code and was causing the parsing error.

## Correction Applied

- Removed all dotenv injection lines from the flattened contract
- Verified the contract starts with proper Solidity code
- Confirmed the contract has the correct structure ending with a proper closing brace

## Contract Details

- Contract Name: CrosswordBoard
- Constructor: `constructor(address initialOwner)`
- Constructor Parameter: `0xA35Dc36B55D9A67c8433De7e790074ACC939f39e`
- Compiler Version: v0.8.28+commit.7893614a (based on CeloScan data)
- Optimizer: Enabled (runs: 200)
- License: MIT

## File Location

Corrected contract file: `/Users/brito/crossword-app/celo-crossword/apps/contracts/flattened-contract-corrected.sol`

## Steps to Verify on CeloScan

1. Go to CeloScan contract verification page for address `0x5516d6bc563270Cbe27ca7Ed965cAA597130954A`
2. Select "Solidity (Single file)" verification type
3. Use compiler version: v0.8.28+commit.7893614a
4. Set optimization to: Yes (200 runs)
5. Paste the contract code from the corrected file
6. Enter the constructor arguments ABI-encoded: `0x00000000000000000000000066299c18c60ce709777ec79c73b131ce2634f58e`
7. Submit for verification
