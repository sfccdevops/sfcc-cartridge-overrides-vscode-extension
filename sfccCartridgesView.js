const path = require('path');
const vscode = require('vscode');

const util = require('./util');

class CartridgesViewProvider {
  constructor(treeData) {
    this.treeData = treeData;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.autoRefresh = true;
  }

  getChildren(element) {
    // TODO: Sort children so folders are first, then files
    if (element) {
      return Promise.resolve(element.children);
    } else {
      return Promise.resolve(this.treeData);
    }
  }

  getTreeItem(item) {
    const collapsibleState = (item.children && item.children.length > 0) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
    const treeItem = new vscode.TreeItem(item.name, collapsibleState);

    // Add Custom Tree Item Data
    treeItem.command = item.command || null;
    treeItem.description = item.description || null;
    treeItem.iconPath = item.iconPath || null;
    treeItem.resourceUri = item.resourceUri || null;
    treeItem.tooltip = item.tooltip || null;

    return treeItem;
  }

  update(treeData) {
    this.treeData = treeData;
    this._onDidChangeTreeData.fire();
  }
}

module.exports = CartridgesViewProvider;
