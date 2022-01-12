const path = require('path');
const vscode = require('vscode');

// Create custom Output Channel to Log Helpful Messages
const logger = vscode.window.createOutputChannel('SFCC Cartridge Overrides');

/**
 * Debug output to "SFCC Cartridge Overrides" Output Terminal
 * @param {String} message Debug Message
 * @param {String} type Debug Type
 */
function debug(message, type) {
  let icon = '';
  let newLine = type ? '\n' : '';

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
  logger.appendLine(`${newLine}${icon}${message}`);
}

/**
 * Get VS Code Workspace Base
 * @param {*} resource
 * @returns
 */
function getWorkspace(resource) {
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
    debug(message, 'error');
    vscode.window.showErrorMessage(`SFCC Cartridge Overrides: ${message}`);
  }

  // Debug Cartridge Path
  debug(`\nWORKSPACE: ${workspace}`);

  return workspace;
}

module.exports = {
  debug,
  getWorkspace
}
