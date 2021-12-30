const vscode = require('vscode');

const util = require('./util');

class ViewPane {
  getChildren() {
    // Get Cartridge Path from Settings and Convert it to an Array
    const cartridgePath = vscode.workspace.getConfiguration().get('extension.sfccCartridges.path');
    let cartridges = cartridgePath.split(':');

    // Cartridges we want to ignore if detected
    const ignored = ['modules'];

    // List of Cartridges to Render in VS Code Panel Tree
    const items = [];

    // Strip Ignored Cartridges from Cartridge List
    cartridges = cartridges.filter(cartridge => ignored.indexOf(cartridge) === -1);

    // Map Cartridge Names to Relative Workspace URLs
    util.getCartridgeDirectories(cartridges).then(data => {
      console.log('DONE');
      console.log(data);
    });

    /**
     * TODO: Get All Files within Cartridge Path
     *
     * - controllers
     * - models
     * - scripts
     * - templates
     *   - default
     *   - resources
     */

    /**
     * TODO: Process Cartridge File List
     *
     * - May need to limit this to: `controllers`, `scripts`, `models` & `templates` folders
     * - Filter by File Type ( exclude: static )
     *   - ++/cartridge/++/+.ds
     *   - ++/cartridge/++/+.isml
     *   - ++/cartridge/++/+.js
     *   - ++/cartridge/++/+.properties
     *   - ++/cartridge/++/+.xml
     *  - Special Handling for Controllers using `server` ( e.g. get, post, prepend, append, replace, extend )
     */

    // Send Cartridge List to VS Code Panel Tree
    cartridges.forEach(cartridge => {
      items.push(new vscode.TreeItem(cartridge))
    })

    return Promise.resolve(items);
  }

  getTreeItem(element) {
    return element;
  }
}

module.exports = ViewPane;
