const vscode = require('vscode');

const sfccCartridgesView = require('./sfccCartridgesView');
const util = require('./util');

function activate(context) {
  const openSettings = vscode.commands.registerCommand('extension.sfccCartridges.openSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'extension.sfccCartridges');
	});

  context.subscriptions.push(openSettings);

  // Add the custom view
  const view = new sfccCartridgesView();
  vscode.window.registerTreeDataProvider('sfccCartridgesView', view);

  /* Save Extension Context for later use */
	util.saveContext(context);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
