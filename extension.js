const vscode = require('vscode');

const sfccCartridges = require('./sfccCartridges');
const sfccCartridgesView = require('./sfccCartridgesView');

function activate(context) {
  // Register Commands
  const cartridgeListUpdated = vscode.commands.registerCommand('extension.sfccCartridges.cartridgeListUpdated', (treeData) => sfccCartridgesProvider.update(treeData));
  const openSettings = vscode.commands.registerCommand('extension.sfccCartridges.openSettings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'extension.sfccCartridges'));
  const refreshCartridges = vscode.commands.registerCommand('extension.sfccCartridges.refreshCartridges', () => sfccCartridgesProvider.refresh());

  // Update VS Code Extension Subscriptions
  context.subscriptions.push(cartridgeListUpdated);
  context.subscriptions.push(openSettings);
  context.subscriptions.push(refreshCartridges);

  // Create Cartridges Object
  const cartridges = new sfccCartridges();

  // Add the custom view
  const sfccCartridgesProvider = new sfccCartridgesView(cartridges.treeCartridges);

  // Register Tree Data Providers
  vscode.window.registerTreeDataProvider('sfccCartridgesView', sfccCartridgesProvider);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
