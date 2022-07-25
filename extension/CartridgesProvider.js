'use strict'

const vscode = require('vscode')

const { REGEXP_CARTRIDGE, SEP } = require('./constants')

/**
 * SFCC Cartridge Tree View Provider
 */
class CartridgesProvider {
  /**
   * SFCC Cartridge Tree View Provider
   * @param {Object} treeData Array of Cartridge Tree Data
   */
  constructor(context) {
    // Establish VS Code Context
    this.context = context

    // Populate Tree with Data
    this.treeData = null

    // Create Custom Event Listener
    this._onDidChangeTreeData = new vscode.EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event
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
      return Promise.resolve(element.children)
    } else {
      // No children here, so we can just render what we have
      return Promise.resolve(this.treeData)
    }
  }

  /**
   * Get Tree View Node Element
   * @param {String} file File Path to Lookup
   * @returns
   */
  getElement(file) {
    let level = 0
    let found = []

    const parts = file.match(REGEXP_CARTRIDGE)

    // Sanity check that we have all the info we need
    if (parts.length === 4) {
      // Break out file parts into variables
      const cartridge = parts[2]
      const relativePath = parts[3]
      const splitRelativePath = relativePath.split(SEP)
      const tree = [cartridge].concat(splitRelativePath)

      // Get Root Element from Tree Item
      let element = this.treeData.find((item) => {
        return item.name === tree[level]
      })

      // Loop through any possible Tree Item Children to find Match
      while (element !== undefined) {
        ++level
        found.push(element)

        element = element.children
          ? element.children.find((item) => {
              return item.name === tree[level]
            })
          : undefined
      }
    }

    return found
  }

  /**
   * Get Parent ( used for Tree View `reveal` method )
   * @param {Object} element
   * @returns
   */
  getParent(element) {
    return element.parent
  }

  /**
   * Get Item for VS Code Tree
   * @param {Object} item Date for Tree View Item
   * @returns {Object} TreeItem
   */
  getTreeItem(item) {
    // Check if this item has children to support collapse & expand
    const collapsibleState = item.children && item.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None

    // Create VS Code Tree Item
    const treeItem = new vscode.TreeItem(item.name, collapsibleState)

    // Add Custom Tree Item Data
    treeItem.command = item.command || null
    treeItem.description = item.description || ''
    treeItem.iconPath = item.iconPath || null
    treeItem.resourceUri = item.resourceUri || null
    treeItem.tooltip = item.tooltip || ''

    return treeItem
  }

  /**
   * Refresh Tree View Data
   * @param {Object} treeData Array of Cartridge Tree
   */
  refresh(treeData) {
    this.treeData = treeData
    this._onDidChangeTreeData.fire()
  }
}

module.exports = CartridgesProvider
