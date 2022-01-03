const path = require('path');
const vscode = require('vscode');

// Create custom Output Channel to Log Helpful Messages
const logger = vscode.window.createOutputChannel('SFCC Cartridge Overrides');

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

  // If we did not get Workspace, let the user know
  if (!workspace) {
    const message = 'Workspace Folder Not Found. Open Folder or Workspace and try again.';
    logger.appendLine(`✖ ${message}`);
    vscode.window.showErrorMessage(`SFCC Cartridge Overrides: ${message}`);
  }

  return workspace;
}

module.exports = {
  getWorkspace
}
