// Script para actualizar la configuración de contratos en el frontend con las ABIs correctas
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function updateFrontendContractConfig() {
  try {
    console.log("Obteniendo ABIs de los contratos desplegados...");  

    // Obtener las ABIs desde los artifacts
    const crosswordBoardArtifact = await hre.artifacts.readArtifact("CrosswordBoard");
    const crosswordPrizesArtifact = await hre.artifacts.readArtifact("CrosswordPrizes");

    // Las direcciones ya las conocemos de la transacción anterior
    const crosswordBoardAddress = "0xb1986b74e08134aff13fd2df8a150fe621279722";
    const crosswordPrizesAddress = "0x0ded91974d0ca80f96e0875d9c5553a24efafd57";

    // Configuración para la nueva red (Celo Sepolia con chain ID 11142220)
    const sepoliaConfig = {
      CrosswordBoard: {
        address: crosswordBoardAddress,
        abi: crosswordBoardArtifact.abi,
      },
      CrosswordPrizes: {
        address: crosswordPrizesAddress,
        abi: crosswordPrizesArtifact.abi,
      },
    };

    // Ruta del archivo de contratos en el frontend
    const contractsTsPath = path.join(__dirname, "..", "web", "src", "lib", "contracts.ts");

    // Leer el archivo actual
    let contractsContent = fs.readFileSync(contractsTsPath, 'utf8');

    // Verificar si ya existe una configuración para Sepolia
    if (contractsContent.includes('11142220:')) {
      console.log("Actualizando configuración existente para Celo Sepolia...");
      
      // Actualizar solo la parte específica de Sepolia
      const newChainConfig = `
  11142220: {
    CrosswordBoard: {
      address: "${crosswordBoardAddress}",
      abi: ${JSON.stringify(crosswordBoardArtifact.abi, null, 2)},
    },
    CrosswordPrizes: {
      address: "${crosswordPrizesAddress}",
      abi: ${JSON.stringify(crosswordPrizesArtifact.abi, null, 2)},
    },
  },`;
      
      // Remover la configuración anterior de Sepolia si existe
      contractsContent = contractsContent.replace(/[\s\n]*[0-9]+:\s*\{[^}]*CrosswordBoard:\s*\{[^}]*\},[^}]*CrosswordPrizes:\s*\{[^}]*\}[^}]*\},/g, '');
      
      // Añadir la nueva configuración antes del cierre del objeto CONTRACTS
      contractsContent = contractsContent.replace(
        /(const CONTRACTS = \{[\s\S]*?)(\};)/,
        `$1${newChainConfig}\n$2`
      );
    } else {
      // Añadir la configuración de Sepolia si no existe
      const newChainConfig = `
  11142220: {
    CrosswordBoard: {
      address: "${crosswordBoardAddress}",
      abi: ${JSON.stringify(crosswordBoardArtifact.abi, null, 2)},
    },
    CrosswordPrizes: {
      address: "${crosswordPrizesAddress}",
      abi: ${JSON.stringify(crosswordPrizesArtifact.abi, null, 2)},
    },
  },`;
      
      // Añadir antes del cierre del objeto CONTRACTS
      contractsContent = contractsContent.replace(
        /(const CONTRACTS = \{[\s\S]*?)(\};)/,
        `$1${newChainConfig}\n$2`
      );
    }

    // Actualizar el hook para usar el nuevo chain ID
    // Buscar la función getContractConfig y actualizarla para que use 11142220
    if (contractsContent.includes('|| chainId === 44787')) {
      contractsContent = contractsContent.replace(
        /\|\| chainId === 44787/g,
        `|| chainId === 44787 || chainId === 11142220`
      );
    } else {
      contractsContent = contractsContent.replace(
        /chainId === celoAlfajores\.id/g,
        'chainId === celoAlfajores.id || chainId === 11142220'
      );
    }

    // Escribir el archivo actualizado
    fs.writeFileSync(contractsTsPath, contractsContent);
    console.log("✅ Archivo de contratos actualizado con éxito!");
    console.log(`Dirección CrosswordBoard: ${crosswordBoardAddress}`);
    console.log(`Dirección CrosswordPrizes: ${crosswordPrizesAddress}`);
    console.log("ABIs actualizados para ambos contratos");

    // Verificar que la actualización se haya hecho correctamente
    console.log("\nVerificando la actualización...");
    if (contractsContent.includes(crosswordBoardAddress) && contractsContent.includes('"addAdmin"')) {
      console.log("✅ Verificación exitosa: Las direcciones y ABIs están correctamente actualizadas");
    } else {
      console.log("⚠️  Advertencia: No se encontraron las direcciones esperadas en el archivo");
    }

  } catch (error) {
    console.error("❌ Error actualizando el archivo de contratos:", error);
    throw error;
  }
}

async function main() {
  console.log("Actualizando configuración de contratos en el frontend...");
  await updateFrontendContractConfig();
  console.log("\n✅ Actualización completada con éxito!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });