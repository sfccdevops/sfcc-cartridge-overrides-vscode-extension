const path = require('path');
const vscode = require('vscode');

// Create custom Output Channel to Log Helpful Messages
const output = vscode.window.createOutputChannel('SFCC Cartridge Overrides');

/**
 * Log output to "SFCC Cartridge Overrides" Output Terminal
 * @param {String} message Debug Message
 * @param {String} type Debug Type
 */
const logger = (message, type) => {
  let icon = '';
  let newLine = type ? '\n' : '';

  // Convert message to String if it was not already
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  // Prefix Logger Messages with Icons
  if (type === 'debug') {
    icon = '› ';
  } else if (type === 'error') {
    icon = '✖ ';
  } else if (type === 'success') {
    icon = '✔ ';
  } else if (type === 'warn') {
    icon = '⚠ ';
  }

  // Write Output to Terminal
  output.appendLine(`${newLine}${icon}${message}`);
}

/**
 * Get Icon for Tree View
 * @param {String} type Tree Item Type
 * @param {Integer} overrideCount Use to Indicate Override
 * @returns {Object} Tree Item iconPath
 */
const getIcon = (type, overrideCount) => {
  return {
    light: path.join(__filename, '..', 'resources', 'light', `${type}${overrideCount && overrideCount > 0 ? '-active' : ''}.svg`),
    dark: path.join(__filename, '..', 'resources', 'dark', `${type}${overrideCount && overrideCount > 0 ? '-active' : ''}.svg`)
  };
}

/**
 * Get File Type from Path
 * @param {String} file Relative File Path
 * @returns {String} SFCC File Type
 */
const getType = file => {
  if (file.includes(`${path.sep}controllers${path.sep}`)) {
    return 'controller';
  }
  else if (file.includes(`${path.sep}models${path.sep}`)) {
    return 'model';
  }
  else if (file.includes(`${path.sep}scripts${path.sep}`)) {
    return 'script';
  }
  else if (file.includes(`${path.sep}templates${path.sep}`)) {
    return 'template';
  }
  else {
    return 'unknown';
  }
}

/**
 * Get VS Code Workspace Base
 * @param {*} resource
 * @returns
 */
const getWorkspace = resource => {
  let root;
  let workspace;

  // Check for missing VS Code Workspace, if present, otherwise use resource path
  if (resource && !vscode.workspace && !vscode.workspace.workspaceFolders) {
    workspace = vscode.workspace.rootPath ?? path.dirname(resource.fsPath);
  } else {
    // We have a Workspace, now let's figure out if it's single or multiroot
    if (vscode.workspace.workspaceFolders.length === 1) {
      // There was only one Workspace, so we can just use it
      root = vscode.workspace.workspaceFolders[0];
      workspace = (root && root.uri) ? root.uri.fsPath : null;
    } else if (resource) {
      // There is more than one, so let's use the provided resource to figure out our root
      root = vscode.workspace.getWorkspaceFolder(resource);
      workspace = (root && root.uri) ? root.uri.fsPath : null;
    }
  }

  // If we did not get Workspace, let the user know
  if (!workspace) {
    const message = 'Workspace Folder Not Found. Open Folder or Workspace and try again.';
    logger(message, 'error');
    vscode.window.showErrorMessage(`SFCC Cartridge Overrides: ${message}`);
  }

  // Debug Cartridge Path
  logger(`\nWORKSPACE: ${workspace}`);

  return workspace;
}

module.exports = {
  logger,
  getIcon,
  getType,
  getWorkspace
}
