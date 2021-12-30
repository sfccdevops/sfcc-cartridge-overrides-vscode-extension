const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const cache = require('./cache');

const logger = vscode.window.createOutputChannel('SFCC Cartridge Overrides');

let VS_CONTEXT = null;

function getWorkspace(resource) {
  let root;
  let workspace;

  if (!vscode.workspace && !vscode.workspace.workspaceFolders) {
    workspace = vscode.workspace.rootPath ?? path.dirname(resource.fsPath);
  } else {
    if (vscode.workspace.workspaceFolders.length === 1) {
      root = vscode.workspace.workspaceFolders[0];
      workspace = (root && root.uri) ? root.uri.fsPath : null;
    } else if (resource) {
      root = vscode.workspace.getWorkspaceFolder(resource);
      workspace = (root && root.uri) ? root.uri.fsPath : null;
    }
  }

  return workspace;
}

async function getCartridgeDirectories(cartridges) {
  const workspacePath = getWorkspace();
  const cartridgeMap = [];

  // If we did not get Workspace, let the user know
  if (!workspacePath) {
    const message = 'Workspace Folder Not Found. Open Folder or Workspace and try again.';
    logger.appendLine(`✖ ${message}`);
    return vscode.window.showErrorMessage(`SFCC Cartridge Overrides: ${message}`);
  }

  // Output Log Details about Workspace Settings
  logger.appendLine(`WORKSPACE: ${workspacePath}`);
  logger.appendLine(`CARTRIDGE PATH: ${cartridges.join(':')}`);
  logger.appendLine('\n› Fetching SFCC Cartridges from Workspace ...\n');

  // Generate Relative Path for Cartridge Pattern Matching
  const cartridgePattern = new vscode.RelativePattern(workspacePath, '**/cartridges/**/.project');

  // Use Native VS Code methods to locate Cartridges
  const items = await vscode.workspace.findFiles(cartridgePattern);

  // Clean up Cartridge Path
  const detected = items.map(item => item.fsPath.replace(/\/\.project$/, ''));

  // We only care about cartridges listed in the Cartridge Path
  const filtered = detected.filter(item => {
    const name = item.match(/([^\/]*)\/*$/)[1];
    return (cartridges.indexOf(name) > -1);
  })

  // Clone filtered list for sorting so we can prune it as we go
  const filteredClone = [...filtered];

  // Track Missing Cartridge Count
  let missingCartridges = [];

  // Map Cartridge Names to the Path for later use ( keeping the cartridge path order )
  cartridges.forEach(cartridge => {
    // Find our specific cartridge in the list
    const cartridgeFilter = filteredClone.filter((item, index) => {
      const name = item.match(/([^\/]*)\/*$/)[1];
      const isMatch = name === cartridge;

      // If this is a match, let's remove it from the sorting list to make next iteration faster
      if (isMatch) {
        filteredClone.splice(index, 1);
      }

      return isMatch;
    });

    // Check if the cartridge path has a cartridge we are missing in the code
    const missing = (!cartridgeFilter || typeof cartridgeFilter[0] !== 'string');

    if (missing) {
      missingCartridges.push(cartridge);
    }

    // Add Cartridge back into our list in the order they were listed in the cartridge path
    cartridgeMap.push({
      name: cartridge,
      path: (!missing) ? cartridgeFilter[0].replace(workspacePath, '.') : null,
      missing: missing
    })
  });

  // Output Log Details about Cartridges Found
  logger.appendLine(`✔ Found ${detected.length} Cartridge${detected.length === 1 ? '' : 's'}`);
  logger.appendLine(`✔ Using ${filtered.length} Cartridge${filtered.length === 1 ? '' : 's'} in Cartridge Path`);

  // Notify user of total number of missing cartridges
  if (missingCartridges.length > 0) {
    logger.appendLine(`\n⚠ NOTICE: There are ${missingCartridges.length} Cartridge${missingCartridges === 1 ? '' : 's'} listed in your Cartridge Path that are missing from your Workspace:`);

    missingCartridges.forEach(missingCartridge => {
      logger.appendLine(`  - ${missingCartridge}`);
    });
  }

  // Return Cartridge Map
  return cartridgeMap;
}

/**
 * Get Resource Path
 * @param {string} file
 * @param {string} theme
 */
function getResourcePath(file, theme) {
    return (theme) ? VS_CONTEXT.asAbsolutePath(path.join('resources', theme, file)) : VS_CONTEXT.asAbsolutePath(path.join('resources', file));
}

/**
 * Save VS Code Context for Pane Reference
 * @param {object} context
 */
function saveContext(context) {
  VS_CONTEXT = context;
}


module.exports = {
  getCartridgeDirectories,
  getResourcePath,
  getWorkspace,
  saveContext
}
