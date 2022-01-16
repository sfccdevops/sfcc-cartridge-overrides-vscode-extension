const vscode = require('vscode');

const util = require('./util');

/**
 * SFCC Cartridge Overrides Tree View Provider
 */
class CartridgeOverridesProvider {
  /**
   * SFCC Cartridge Overrides Tree View Provider
   * @param {Object} treeData Array of Cartridge Tree Data
   */
   constructor() {
    // Track last opened file
    this.lastOpened = null;

    // Populate Tree with Data
    this.treeData = [];

    // Create Custom Event Listener
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  generateControllerTree(data) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`;
    if (this.lastOpened === key) {
      return
    }

    console.log('controller', data);
    this.treeData = []; // treeData;
    this._onDidChangeTreeData.fire(undefined);

    this.lastOpened = key;
  }
  generateModelTree(data) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`;
    if (this.lastOpened === key) {
      return
    }

    console.log('model', data);
    this.treeData = []; // treeData;
    this._onDidChangeTreeData.fire(undefined);

    this.lastOpened = key;
  }

  generatePropertiesTree(data) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`;
    if (this.lastOpened === key) {
      return
    }

    console.log('properties', data);
    this.treeData = []; // treeData;
    this._onDidChangeTreeData.fire(undefined);

    this.lastOpened = key;
  }

  generateScriptTree(data) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`;
    if (this.lastOpened === key) {
      return
    }

    console.log('script', data);
    this.treeData = []; // treeData;
    this._onDidChangeTreeData.fire(undefined);

    this.lastOpened = key;
  }
  generateTemplateTree(data) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`;
    if (this.lastOpened === key) {
      return
    }

    const templateTree = [];

    data.overrides.forEach((override, index) => {
      const isSelected = data.cartridge === override.cartridge ? 1 : 0;

      templateTree.push({
        command: {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [override.resourceUri]
        },
        name: data.name,
        description: override.cartridge,
        contextValue: 'file',
        isSelected: isSelected,
        sortOrder: index,
        iconPath: (index === data.overrides.length - 1)
          ? util.getIcon('templates', isSelected)
          : util.getIcon('override', isSelected)
      })
    });

    this.treeData = templateTree;
    this._onDidChangeTreeData.fire(undefined);

    this.lastOpened = key;

    return this;
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

  getParent(element) {
    return element.parent;
  }

  getElement(cartridge) {
    // TODO: Figure out what this only works on some tabs
    console.log('cartridge', cartridge)
    return this.treeData.find(item => {
      console.log(`${item.description} === ${cartridge}`);
      return item.description === cartridge
    });
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
  load(override) {
    // Make sure whatever we clicked on had override data, otherwise ignore it
    if (override) {
      // Next, Generate Tree View Based on Override Type
      switch(override.type) {
        case 'controller':
          return Promise.resolve(this.generateControllerTree(override));
        case 'model':
          return Promise.resolve(this.generateModelTree(override));
        case 'script':
          return Promise.resolve(this.generateScriptTree(override));
        case 'template':
          if (override.name.split('.').pop() === 'properties') {
            return Promise.resolve(this.generatePropertiesTree(override));
          } else {
            return Promise.resolve(this.generateTemplateTree(override));
          }
      }
    }
  }

  reset() {
    this.treeData = [];
    this._onDidChangeTreeData.fire(undefined);
  }
}

module.exports = CartridgeOverridesProvider;
