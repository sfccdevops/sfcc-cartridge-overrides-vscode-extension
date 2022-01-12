const vscode = require('vscode');

/**
 * SFCC Cartridge Tree View Provider
 */
class CartridgesViewProvider {
  /**
   * SFCC Cartridge Tree View Provider
   * @param {Object} treeData Array of Cartridge Tree Data
   */
  constructor(treeData) {
    // Populate Tree with Data
    this.treeData = treeData;

    // Create Custom Event Listener
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  /**
   * Get Children for Tree View
   * @param {Object} element Tree Item
   * @returns Tree Item
   */
  getChildren(element) {
    // Check if this tree element has children
    if (element) {
      // This has children, so let's render them
      return Promise.resolve(element.children);
    } else {
      // No children here, so we can just render what we have
      return Promise.resolve(this.treeData);
    }
  }

  /**
   * Get Item for VS Code Tree
   * @param {Object} item Date for Tree View Item
   * @returns {Object} TreeItem
   */
  getTreeItem(item) {
    // Check if this item has children to support collapse & expand
    const collapsibleState = (item.children && item.children.length > 0) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;

    // Create VS Code Tree Item
    const treeItem = new vscode.TreeItem(item.name, collapsibleState);

    // Add Custom Tree Item Data
    treeItem.command = item.command || null;
    treeItem.description = item.description || null;
    treeItem.iconPath = item.iconPath || null;
    treeItem.resourceUri = item.resourceUri || null;
    treeItem.tooltip = item.tooltip || null;

    return treeItem;
  }

  /**
   * Refresh Tree View Data
   * @param {Object} treeData Array of Cartridge Tree
   */
  refresh(treeData) {
    this.treeData = treeData;
    this._onDidChangeTreeData.fire(undefined);
  }
}

module.exports = CartridgesViewProvider;
