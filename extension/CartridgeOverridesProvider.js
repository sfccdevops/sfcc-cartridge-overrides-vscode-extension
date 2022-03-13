'use strict'

const vscode = require('vscode')

const util = require('./util')

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
    this.lastOpened = null

    // Populate Tree with Data
    this.treeData = []

    // Create Custom Event Listener
    this._onDidChangeTreeData = new vscode.EventEmitter()
    this.onDidChangeTreeData = this._onDidChangeTreeData.event
  }

  /**
   * Default Tree Generator
   * @param {Object} data Data to Generat Tree
   * @param {String} type Tree Type [controllers, models, templates, scripts, properties]
   * @returns Object
   */
  defaultGenerator(data, type) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`
    if (this.lastOpened === key) {
      return
    }

    const templateTree = []

    data.overrides.forEach((override, index) => {
      const isSelected = data.cartridge === override.cartridge ? 1 : 0

      templateTree.push({
        command: {
          command: 'vscode.open',
          arguments: [override.resourceUri],
        },
        name: data.name,
        description: override.cartridge,
        contextValue: 'file',
        isSelected: isSelected,
        sortOrder: index,
        iconPath: index === data.overrides.length - 1 ? util.getIcon(type, isSelected) : util.getIcon('override', isSelected),
      })
    })

    this.treeData = templateTree
    this._onDidChangeTreeData.fire(undefined)

    this.lastOpened = key

    return this
  }

  generateControllerTree(data) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`
    if (this.lastOpened === key) {
      return
    }

    const controllerTree = []

    // Loop through overrides in reverse to read files in order of override stack
    const checkControllers = () => {
      const routes = {}

      return new Promise(resolve => data.overrides.slice().reverse().forEach(async (override, index) => {
        // Open Document so we can get the text
        const document = await vscode.workspace.openTextDocument(override.resourceUri)

        // Break apart document into lines of text
        const text = document.getText()
        const lines = text.split('\n')

        // Standard Controller Routes ( server.get, server.post & server.use )
        const foundGets = [...text.matchAll(/server\.get\(([^'"]+)?['"]([^'"]+)['"]/g)]
        const foundPosts = [...text.matchAll(/server\.post\(([^'"]+)?['"]([^'"]+)['"]/g)]
        const foundUses = [...text.matchAll(/server\.use\(([^'"]+)?['"]([^'"]+)['"]/g)]

        // Override Controller Routes ( server.append, server.prepend & server.replace )
        const foundAppends = [...text.matchAll(/server\.append\(([^'"]+)?['"]([^'"]+)['"]/g)]
        const foundPrepends = [...text.matchAll(/server\.prepend\(([^'"]+)?['"]([^'"]+)['"]/g)]
        const foundReplaces = [...text.matchAll(/server\.replace\(([^'"]+)?['"]([^'"]+)['"]/g)]

        foundGets.forEach(found => {
          if (found.length > 2) {
            const routeName = found[2]

            if (!Object.prototype.hasOwnProperty.call(routes, 'get')) {
              routes['get'] = {}
            }

            if (!Object.prototype.hasOwnProperty.call(routes['get'], override.cartridge)) {
              routes['get'][override.cartridge] = []
            }

            let lineNumber = null

            // Loop through lines of code looking for this record
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              const nextLine = lines[i+1]

              // Some code formatters have the route name on the next line
              if ((line.includes('server.get') && line.includes(routeName)) || (line.includes('server.get') && nextLine.includes(routeName))) {
                lineNumber = i+1
                break
              }
            }

            routes['get'][override.cartridge].push({
              name: routeName,
              resourceUri: override.resourceUri,
              position: override.position,
              type: 'get',
              lineNumber: lineNumber,
              tooltip: `server.get('${routeName}')`
            })
          }
        })

        foundPosts.forEach(found => {
          if (found.length > 2) {
            const routeName = found[2]

            if (!Object.prototype.hasOwnProperty.call(routes, 'post')) {
              routes['post'] = {}
            }

            if (!Object.prototype.hasOwnProperty.call(routes['post'], override.cartridge)) {
              routes['post'][override.cartridge] = []
            }

            let lineNumber = null

            // Loop through lines of code looking for this record
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              const nextLine = lines[i+1]

              // Some code formatters have the route name on the next line
              if ((line.includes('server.post') && line.includes(routeName)) || (line.includes('server.post') && nextLine.includes(routeName))) {
                lineNumber = i+1
                break
              }
            }

            routes['post'][override.cartridge].push({
              name: routeName,
              resourceUri: override.resourceUri,
              position: override.position,
              type: 'post',
              lineNumber: lineNumber,
              tooltip: `server.post('${routeName}')`
            })
          }
        })

        foundUses.forEach(found => {
          if (found.length > 2) {
            const routeName = found[2]

            if (!Object.prototype.hasOwnProperty.call(routes, 'use')) {
              routes['use'] = {}
            }

            if (!Object.prototype.hasOwnProperty.call(routes['use'], override.cartridge)) {
              routes['use'][override.cartridge] = []
            }

            let lineNumber = null

            // Loop through lines of code looking for this record
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              const nextLine = lines[i+1]

              // Some code formatters have the route name on the next line
              if ((line.includes('server.use') && line.includes(routeName)) || (line.includes('server.use') && nextLine.includes(routeName))) {
                lineNumber = i+1
                break
              }
            }

            routes['use'][override.cartridge].push({
              name: routeName,
              resourceUri: override.resourceUri,
              position: override.position,
              type: 'use',
              lineNumber: lineNumber,
              tooltip: `server.use('${routeName}')`
            })
          }
        })

        foundAppends.forEach(found => {
          if (found.length > 2) {
            const routeName = found[2]

            if (!Object.prototype.hasOwnProperty.call(routes, 'append')) {
              routes['append'] = {}
            }

            if (!Object.prototype.hasOwnProperty.call(routes['append'], override.cartridge)) {
              routes['append'][override.cartridge] = []
            }

            let lineNumber = null

            // Loop through lines of code looking for this record
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              const nextLine = lines[i+1]

              // Some code formatters have the route name on the next line
              if ((line.includes('server.append') && line.includes(routeName)) || (line.includes('server.append') && nextLine.includes(routeName))) {
                lineNumber = i+1
                break
              }
            }

            routes['append'][override.cartridge].push({
              name: routeName,
              resourceUri: override.resourceUri,
              position: override.position,
              type: 'append',
              lineNumber: lineNumber,
              tooltip: `server.append('${routeName}')`
            })
          }
        })

        foundPrepends.forEach(found => {
          if (found.length > 2) {
            const routeName = found[2]

            if (!Object.prototype.hasOwnProperty.call(routes, 'prepend')) {
              routes['prepend'] = {}
            }

            if (!Object.prototype.hasOwnProperty.call(routes['prepend'], override.cartridge)) {
              routes['prepend'][override.cartridge] = []
            }

            let lineNumber = null

            // Loop through lines of code looking for this record
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              const nextLine = lines[i+1]

              // Some code formatters have the route name on the next line
              if ((line.includes('server.prepend') && line.includes(routeName)) || (line.includes('server.prepend') && nextLine.includes(routeName))) {
                lineNumber = i+1
                break
              }
            }

            routes['prepend'][override.cartridge].push({
              name: routeName,
              resourceUri: override.resourceUri,
              position: override.position,
              type: 'prepend',
              lineNumber: lineNumber,
              tooltip: `server.prepend('${routeName}')`
            })
          }
        })

        foundReplaces.forEach(found => {
          if (found.length > 2) {
            const routeName = found[2]

            if (!Object.prototype.hasOwnProperty.call(routes, 'replace')) {
              routes['replace'] = {}
            }

            if (!Object.prototype.hasOwnProperty.call(routes['replace'], override.cartridge)) {
              routes['replace'][override.cartridge] = []
            }

            let lineNumber = null

            // Loop through lines of code looking for this record
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              const nextLine = lines[i+1]

              // Some code formatters have the route name on the next line
              if ((line.includes('server.replace') && line.includes(routeName)) || (line.includes('server.replace') && nextLine.includes(routeName))) {
                lineNumber = i+1
                break
              }
            }

            routes['replace'][override.cartridge].push({
              name: routeName,
              resourceUri: override.resourceUri,
              position: override.position,
              type: 'replace',
              lineNumber: lineNumber,
              tooltip: `server.replace('${routeName}')`
            })
          }
        })

        return resolve(routes)
      }))
    }

    // Check all the property files line by line
    checkControllers().then(overrideRoutes => {
      // Start creation of File Tree
      data.overrides.forEach((override, index) => {
        const isSelected = data.cartridge === override.cartridge ? 1 : 0
        const children = []

        // Create Parent Tree Element
        const treeItem = {
          name: data.name.replace('.js', ''),
          description: override.cartridge,
          isSelected: isSelected,
          sortOrder: index,
          iconPath: index === data.overrides.length - 1 ? util.getIcon('controllers', isSelected) : util.getIcon('override', isSelected)
        }

        // Add any properties that were found to be overwritten as children
        Object.keys(overrideRoutes).forEach(prop => {
          if (Object.prototype.hasOwnProperty.call(overrideRoutes[prop], override.cartridge)) {
            const propObj = overrideRoutes[prop][override.cartridge][0]
            const range = propObj.lineNumber ? new vscode.Range(new vscode.Position(propObj.lineNumber - 1, 0), new vscode.Position(propObj.lineNumber - 1, 0)) : null
            const args = propObj.lineNumber ? [propObj.resourceUri, { selection: new vscode.Selection(range.start, range.end) }] : [propObj.resourceUri]

            children.push({
              command: {
                command: 'vscode.open',
                arguments: args,
              },
              name: propObj.name,
              contextValue: 'file',
              description: propObj.type,
              tooltip: propObj.tooltip,
              iconPath: util.getIcon('route')
            })
          }
        })

        // Make the Parent Tree item collapsable if it contains children
        if (children.length > 0) {
          treeItem.children = children
          treeItem.contextValue = 'folder'
        } else {
          treeItem.contextValue = 'file'
          treeItem.command = {
            command: 'vscode.open',
            arguments: [override.resourceUri],
          }
        }

        // Push Tree Item to List
        controllerTree.push(treeItem)
      })

      this.treeData = controllerTree
      this._onDidChangeTreeData.fire(undefined)
    })

    this.lastOpened = key

    return this
  }

  /**
   * Generate Tree for Model Files
   * @param {object} data
   * @returns object
   */
  generateModelTree(data) {
    // TODO: Expand this to provide custom tree rendering of Model Overrides
    return this.defaultGenerator(data, 'models')
  }

  /**
   * Generate Tree for Properties Files
   * @param {object} data
   * @returns object
   */
  generatePropertiesTree(data) {
    const key = `${data.cartridge}_${data.name.replace(/[\/.]/g, '-')}`
    if (this.lastOpened === key) {
      return
    }

    const templateTree = []

    // Loop through overrides in reverse to read files in order of override stack
    const checkProperties = () => {
      const properties = {}
      return new Promise(resolve => data.overrides.slice().reverse().forEach(async (override, index) => {
        // Open Document so we can get the text
        const document = await vscode.workspace.openTextDocument(override.resourceUri)

        // Break apart document into lines of text
        const lines = document.getText().split('\n')

        // Loop through lines of code
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const prop = line.split('=')

          if (prop.length > 1) {
            const propKey = prop[0].trim()

            if (!Object.prototype.hasOwnProperty.call(properties, propKey)) {
              properties[propKey] = {}
            }

            if (!Object.prototype.hasOwnProperty.call(properties[propKey], override.cartridge)) {
              properties[propKey][override.cartridge] = []
            }

            properties[propKey][override.cartridge].push({
              name: propKey,
              resourceUri: override.resourceUri,
              lineNumber: i + 1,
              position: override.position
            })
          }
        }

        return resolve(properties)
      }))
    }

    // Check all the property files line by line
    checkProperties().then(overrideProperties => {
      // Check each property for overrides
      Object.keys(overrideProperties).forEach(prop => {
        // If there are no overrides, let's do some cleanup
        if (Object.keys(overrideProperties[prop]).length < 2) {
          delete overrideProperties[prop]
        }
      })

      // Start creation of File Tree
      data.overrides.forEach((override, index) => {
        const isSelected = data.cartridge === override.cartridge ? 1 : 0
        const children = []

        // Create Parent Tree Element
        const treeItem = {
          name: data.name,
          description: override.cartridge,
          isSelected: isSelected,
          sortOrder: index,
          iconPath: index === data.overrides.length - 1 ? util.getIcon('templates', isSelected) : util.getIcon('override', isSelected)
        }

        // Add any properties that were found to be overwritten as children
        Object.keys(overrideProperties).forEach(prop => {
          if (Object.prototype.hasOwnProperty.call(overrideProperties[prop], override.cartridge)) {
            const propObj = overrideProperties[prop][override.cartridge][0]
            const range = new vscode.Range(new vscode.Position(propObj.lineNumber - 1, 0), new vscode.Position(propObj.lineNumber - 1, 0));

            children.push({
              command: {
                command: 'vscode.open',
                arguments: [propObj.resourceUri, {
                  selection: new vscode.Selection(range.start, range.end)
                }],
              },
              name: propObj.name,
              contextValue: 'file',
              iconPath: util.getIcon('property')
            })
          }
        })

        // Make the Parent Tree item collapsable if it contains children
        if (children.length > 0) {
          treeItem.children = children
          treeItem.contextValue = 'folder'
        } else {
          treeItem.contextValue = 'file'
          treeItem.command = {
            command: 'vscode.open',
            arguments: [override.resourceUri],
          }
        }

        // Push Tree Item to List
        templateTree.push(treeItem)
      })

      this.treeData = templateTree
      this._onDidChangeTreeData.fire(undefined)
    })

    this.lastOpened = key

    return this
  }

  /**
   * Generate Tree for Script Files
   * @param {object} data
   * @returns object
   */
  generateScriptTree(data) {
    // TODO: Expand this to provide custom tree rendering of Script Overrides
    return this.defaultGenerator(data, 'scripts')
  }

  /**
   * Generate Tree for Template Files
   * @param {object} data
   * @returns object
   */
  generateTemplateTree(data) {
    return this.defaultGenerator(data, 'templates')
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

  getParent(element) {
    return element.parent
  }

  getElement(cartridge) {
    // TODO: Figure out what this only works on some tabs
    return this.treeData.find((item) => {
      return item.description === cartridge
    })
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
    treeItem.description = item.description || null
    treeItem.iconPath = item.iconPath || null
    treeItem.resourceUri = item.resourceUri || null
    treeItem.tooltip = item.tooltip || null

    return treeItem
  }

  /**
   * Refresh Tree View Data
   * @param {Object} treeData Array of Cartridge Tree
   */
  load(override) {
    // Make sure whatever we clicked on had override data, otherwise ignore it
    if (override) {
      // Next, Generate Tree View Based on Override Type
      switch (override.type) {
        case 'controller':
          return Promise.resolve(this.generateControllerTree(override))
        case 'model':
          return Promise.resolve(this.generateModelTree(override))
        case 'script':
          return Promise.resolve(this.generateScriptTree(override))
        case 'template':
          if (override.name.split('.').pop() === 'properties') {
            return Promise.resolve(this.generatePropertiesTree(override))
          } else {
            return Promise.resolve(this.generateTemplateTree(override))
          }
      }
    }
  }

  reset() {
    this.treeData = []
    this._onDidChangeTreeData.fire(undefined)
  }
}

module.exports = CartridgeOverridesProvider
