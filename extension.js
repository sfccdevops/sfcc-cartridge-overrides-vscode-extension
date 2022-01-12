const vscode = require('vscode');

const sfccCartridges = require('./sfccCartridges');
const sfccCartridgesView = require('./sfccCartridgesView');

/**
 * Handle Activating Extension
 * @param {*} context
 */
function activate(context) {
  // Create Cartridges Object
  const cartridges = new sfccCartridges();

  // Add the custom view
  const sfccCartridgesProvider = new sfccCartridgesView();

  // Register Tree Data Providers
  vscode.window.registerTreeDataProvider('sfccCartridgesView', sfccCartridgesProvider);

  // Register Commands
  const cartridgeListUpdated = vscode.commands.registerCommand('extension.sfccCartridges.cartridgeListUpdated', treeData => sfccCartridgesProvider.refresh(treeData));
  const cartridgeMissing = vscode.commands.registerCommand('extension.sfccCartridges.cartridgeMissing', cartridge => vscode.window.showErrorMessage(`Cartridge Missing from Workspace: ${cartridge}`));
  const disableFilter = vscode.commands.registerCommand('extension.sfccCartridges.disableFilter', () => vscode.workspace.getConfiguration().update('extension.sfccCartridges.overridesOnly', false, vscode.ConfigurationTarget.Global));
  const enableFilter = vscode.commands.registerCommand('extension.sfccCartridges.enableFilter', () => vscode.workspace.getConfiguration().update('extension.sfccCartridges.overridesOnly', true, vscode.ConfigurationTarget.Global));
  const openSettings = vscode.commands.registerCommand('extension.sfccCartridges.openSettings', () => vscode.commands.executeCommand('workbench.action.openSettings', 'extension.sfccCartridges'));
  const refreshCartridges = vscode.commands.registerCommand('extension.sfccCartridges.refreshCartridges', () => cartridges.refresh());
  const viewOverrides = vscode.commands.registerCommand('extension.sfccCartridges.viewOverrides', overrides => console.log(overrides));

  // Listen for Config Change of Overrides and Regenerate Tree when Changed
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(evt => {
    // Check if Overrides Only was Changed
    const overridesOnlyChanged = evt.affectsConfiguration('extension.sfccCartridges.overridesOnly');

    // Check if Overrides Only was Changed
    const pathChanged = evt.affectsConfiguration('extension.sfccCartridges.path');

    // Check if we should update Cartridge List
    if (overridesOnlyChanged || pathChanged) {
      cartridges.refresh();
    }
  }));

  // Update VS Code Extension Subscriptions
  context.subscriptions.push(cartridgeListUpdated);
  context.subscriptions.push(cartridgeMissing);
  context.subscriptions.push(disableFilter);
  context.subscriptions.push(enableFilter);
  context.subscriptions.push(openSettings);
  context.subscriptions.push(refreshCartridges);
  context.subscriptions.push(viewOverrides);
}

/**
 * Handle Deactivating Extension
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
}
