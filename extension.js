const vscode = require('vscode');

const sfccCartridges = require('./sfccCartridges');
const sfccCartridgesView = require('./sfccCartridgesView');

function activate(context) {
  // Create Cartridges Object
  const cartridges = new sfccCartridges();

  // Add the custom view
  const sfccCartridgesProvider = new sfccCartridgesView(cartridges.treeCartridges);

  // Register Tree Data Providers
  vscode.window.registerTreeDataProvider('sfccCartridgesView', sfccCartridgesProvider);

  // Register Commands
  const cartridgeListUpdated = vscode.commands.registerCommand('extension.sfccCartridges.cartridgeListUpdated', treeData => sfccCartridgesProvider.update(treeData));
  const openSettings = vscode.commands.registerCommand('extension.sfccCartridges.openSettings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'extension.sfccCartridges'));
  const enableFilter = vscode.commands.registerCommand('extension.sfccCartridges.enableFilter', () => vscode.workspace.getConfiguration().update('extension.sfccCartridges.overridesOnly', true, vscode.ConfigurationTarget.Global));
  const disableFilter = vscode.commands.registerCommand('extension.sfccCartridges.disableFilter', () => vscode.workspace.getConfiguration().update('extension.sfccCartridges.overridesOnly', false, vscode.ConfigurationTarget.Global));
  const refreshCartridges = vscode.commands.registerCommand('extension.sfccCartridges.refreshCartridges', () => cartridges.generateTree());

  // Listen for Config Change of Overrides and Regenerate Tree when Changed
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(evt => {
    if (evt.affectsConfiguration('extension.sfccCartridges.overridesOnly')) {
      cartridges.generateTree();
    }
  }));

  // Update VS Code Extension Subscriptions
  context.subscriptions.push(cartridgeListUpdated);
  context.subscriptions.push(enableFilter);
  context.subscriptions.push(disableFilter);
  context.subscriptions.push(openSettings);
  context.subscriptions.push(refreshCartridges);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
