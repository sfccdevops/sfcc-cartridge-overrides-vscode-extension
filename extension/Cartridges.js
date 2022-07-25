'use strict'

const path = require('path')
const vscode = require('vscode')
const { init, localize } = require('vscode-nls-i18n')

const Cache = require('./Cache')
const util = require('./util')
const { REGEXP_CARTRIDGE, REGEXP_PATH } = require('./constants')

/**
 * SFCC Cartridges
 */
class Cartridges {
  /**
   * Initialize Cartridges
   */
  constructor(context) {
    // Initialize Localization
    init(context.extensionPath)

    // Create Cache Instances
    this.cacheFiles = new Cache(context, 'sfcc-files')
    this.cacheOverrides = new Cache(context, 'sfcc-overrides')

    // Establish VS Code Context
    this.context = context

    // Fetch Cartridge Path from Configuration
    this.cartridgesPath = this.getCartridgesPath()

    // Fetch current Workspace Path from VS Code
    this.workspacePath = util.getWorkspace(context)

    // Default Tree View data
    this.treeCartridges = []

    // Do initial load of data using cache
    this.refresh(true)

    // Get Cartridges and Start Loading Data
    this.getCartridgesFromConfig()
      .then((updateCartridgePath) => {
        if (updateCartridgePath) {
          // Refetch Cartridge since the settings changed
          this.cartridgesPath = this.getCartridgesPath()

          // Do initial load of data using cache
          this.refresh(true)
        }
      })
      .catch((err) => {
        util.logger(localize('debug.logger.error', 'Cartridges.constructor', err.toString()), 'error')
      })
  }

  /**
   * Generate VS Code Tree View Data
   * @param {Object} cartridges Created from getCartridges
   * @returns
   */
  generateTree(cartridges) {
    // Collect Tree Data
    const treeData = []

    // Loop through Cartridge Path in the order provided
    this.cartridgesPath.forEach((name) => {
      // Root Tree Item Meta Data
      const description = []
      const tooltip = []

      // Command Handler for Tree Item Click
      let command = null

      // Sanity check that `name` belongs to `cartridges`
      if (Object.prototype.hasOwnProperty.call(cartridges, name)) {
        // Show if Root Tree Item is overwritten by another cartridge
        if (cartridges[name].overrides && cartridges[name].overrides.above > 0) {
          const aboveCount = cartridges[name].overrides.above
          description.push(localize('panel.cartridges.above.description', aboveCount))
          tooltip.push(aboveCount > 1 ? localize('panel.cartridges.above.tooltip.plural', aboveCount) : localize('panel.cartridges.above.tooltip.singular', aboveCount))
        }

        // Show if Root Tree Item overrides another cartridge
        if (cartridges[name].overrides && cartridges[name].overrides.below > 0) {
          const belowCount = cartridges[name].overrides.below
          description.push(localize('panel.cartridges.below.description', belowCount))
          tooltip.push(belowCount > 1 ? localize('panel.cartridges.below.tooltip.plural', belowCount) : localize('panel.cartridges.below.tooltip.singular', belowCount))
        }

        // Create Root Tree Meta Data
        let iconPath = util.getIcon('cartridge', cartridges[name].overrides ? cartridges[name].overrides.total : 0)
        let descriptionText = description.length > 0 ? description.join(' ') : null
        let tooltipText = tooltip.length > 0 ? tooltip.join(' ') : null

        // Check if Cartridge is Missing from Workspace
        if (cartridges[name].missing) {
          iconPath = util.getIcon('cartridge-missing', cartridges[name].overrides ? cartridges[name].overrides.total : 0)
          tooltipText = localize('panel.cartridges.missing.tooltip')
          descriptionText = localize('panel.cartridges.missing.description')

          // Handle Clicks on Missing Cartridges
          command = {
            command: 'extension.sfccCartridges.cartridgeMissing',
            title: localize('panel.cartridges.missing.title'),
            arguments: [name],
          }

          // Debug Missing Cartridge to Log
          util.logger(localize('debug.logger.cartridgesMissing', name), 'warn')
        }

        // Push Item to Tree View
        treeData.push({
          name,
          contextValue: 'folder',
          children: cartridges[name].tree,
          iconPath: iconPath,
          tooltip: tooltipText,
          description: descriptionText,
          command: command,
        })
      }
    })

    return treeData
  }

  /**
   * Get Cartridge Path
   *
   * @note There may be use cases where a developer needs to leave their dw.json "as is",
   * but still needs to test their cartridge path overrides ( multiple sites, BM vs Storefront, etc )
   * So we will use a custom config option just for this extension and default to dw.json if present
   * but want to make sure they are not forced to change dw.json to use this override tool as that
   * could impact other development processes in ways this extension should not be doing.
   *
   * @returns {Object} Filtered Cartridge Array
   */
  getCartridgesPath() {
    // Get Cartridge Path from Settings and Convert it to an Array
    const cartridgePath = vscode.workspace.getConfiguration().get('extension.sfccCartridges.path')
    const cartridgesArray = cartridgePath ? cartridgePath.split(':') : []

    // Debug Cartridge Path
    util.logger(localize('debug.logger.path', cartridgesArray.join('\n- ')))

    // Cartridges we want to ignore if detected
    const ignoredCartridges = ['modules']

    // Strip Ignored Cartridges from Cartridge List
    return cartridgesArray.filter((cartridge) => ignoredCartridges.indexOf(cartridge) === -1)
  }

  /**
   * Get Cartridge Names from Config File
   * @returns Promise
   */
  getCartridgesFromConfig() {
    return new Promise((resolve) => {
      // Get current cartridge path from settings
      const cartridgePath = vscode.workspace.getConfiguration().get('extension.sfccCartridges.path')

      // Find dw.json file in root
      vscode.workspace
        .findFiles(new vscode.RelativePattern(this.workspacePath, 'dw.{json,js}'))
        .then((dwConfig) => {
          // Make sure we found a file
          if (dwConfig && typeof dwConfig[0] !== 'undefined' && typeof dwConfig[0].path !== 'undefined') {
            // Read file and get its content
            vscode.workspace
              .openTextDocument(dwConfig[0].path)
              .then((config) => {
                // Get Text
                const configText = config.getText()

                // Try to parse the JSON
                try {
                  const configJson = JSON.parse(configText)

                  // Check if cartridgesPath was defined in the dw.json and if it is different than the one in VS Code Settings
                  if (configJson.cartridgesPath && cartridgePath !== configJson.cartridgesPath && configJson.cartridgesPath !== '') {
                    // Check which message to show
                    const message = cartridgePath && cartridgePath.length > 0 ? localize('config.properties.path.changed') : localize('config.properties.path.found')

                    // Looks like the local dw.json is different than VS Code Settings, check if we should save the dw.json into VS Code
                    vscode.window
                      .showInformationMessage(message, localize('ui.dialog.yes'), localize('ui.dialog.no'))
                      .then((answer) => {
                        if (answer === localize('ui.dialog.yes')) {
                          // Update VS Code Settings and reload
                          vscode.workspace
                            .getConfiguration()
                            .update('extension.sfccCartridges.path', configJson.cartridgesPath, vscode.ConfigurationTarget.Global)
                            .then(() => {
                              // Let the developer know their settings have been saved
                              vscode.window.showInformationMessage(localize('config.properties.path.updated'))
                              return resolve(true)
                            })
                            .catch((err) => {
                              util.logger(localize('debug.logger.error', 'Cartridges.getCartridgesFromConfig:getConfiguration', err.toString()), 'error')
                              return resolve(false)
                            })
                        } else {
                          return resolve(false)
                        }
                      })
                      .catch((err) => {
                        util.logger(localize('debug.logger.error', 'Cartridges.getCartridgesFromConfig:showInformationMessage', err.toString()), 'error')
                        return resolve(false)
                      })
                  } else {
                    // Config was present, but no cartridge path found
                    return resolve(false)
                  }
                } catch (err) {
                  util.logger(localize('debug.logger.error', 'Cartridges.getCartridgesFromConfig:JSON.parse', err.toString()), 'error')
                  return resolve(false)
                }
              })
              .catch((err) => {
                util.logger(localize('debug.logger.error', 'Cartridges.getCartridgesFromConfig:openTextDocument', err.toString()), 'error')
              })
          } else {
            // No file to load
            return resolve(false)
          }
        })
        .catch((err) => {
          util.logger(localize('debug.logger.error', 'Cartridges.findFiles', err.toString()), 'error')
        })
    })
  }

  /**
   * Get Cartridge Files
   * @returns Promise
   */
  getCartridges() {
    // Fetch Config for Override Visibility
    const overridesOnly = vscode.workspace.getConfiguration().get('extension.sfccCartridges.overridesOnly')

    // Generate Relative Path for Cartridge Pattern Matching
    const includePattern = new vscode.RelativePattern(this.workspacePath, `**/cartridges/{${this.cartridgesPath.join(',')}}/cartridge/{controllers,models,scripts,templates}/**/*.{js,ds,isml,properties}`)
    const excludePattern = new vscode.RelativePattern(this.workspacePath, '**/node_modules/')

    // Debug Possibly Helpful Info
    util.logger(localize('debug.logger.fetchingCartridges'), 'debug')
    util.logger(overridesOnly ? localize('debug.logger.overridesEnabled') : localize('debug.logger.overridesDisabled'), 'debug')

    // Store Cartridge File Data
    const cartridgeFileData = {}
    const cartridges = {}

    /**
     * Calculate Cartridge, Folder & Filter Overrides
     * @param {String} cartridge Name of Cartridge
     * @param {String} relativeKey Relative Path to Tree Item
     * @param {Boolean} skipCacheWrite Whether we should skip writing to cache
     * @returns {Object} Override Counts
     */
    const getOverrides = (cartridge, relativeKey, skipCacheWrite) => {
      // Generate Cache Key for Override Lookup
      const cacheKey = `${cartridge}${relativeKey ? relativeKey.replace(REGEXP_PATH, '-') : ''}`

      // Return Cache if Present ( calculating overrides is a time consuming process )
      if (this.cacheOverrides.has(cacheKey)) {
        return this.cacheOverrides.get(cacheKey)
      }

      // Store matches between cartridges
      const matches = []

      // Get position of current cartridge in cartridge path
      const position = this.cartridgesPath.indexOf(cartridge)

      // Get total for overrides contained inside this cartridge for a given folder or file
      const total = Object.keys(cartridgeFileData).reduce((cart, key) => {
        return cart.concat(
          cartridgeFileData[key].filter((override) => {
            // Check if this tree item exists in another cartridge
            const isMatch = relativeKey && override.file ? cartridgeFileData[key].length > 1 && override.cartridge === cartridge && override.file.indexOf(relativeKey) > -1 : cartridgeFileData[key].length > 1 && override.cartridge === cartridge

            // Track matches
            if (isMatch) {
              matches.push(key)
            }

            return isMatch
          })
        )
      }, [])

      // Keep track of matching files to the left and right of cartridge path
      let above = 0
      let below = 0

      // Loop through matches we found inside this cartridge against other cartridges
      matches.forEach((match) => {
        // Check if this relative path exists in another cartridge to the left of the current cartridge path
        above += cartridgeFileData[match].filter((override) => override.cartridge !== cartridge && override.position < position).length

        // Check if this relative path exists in another cartridge to the right of the current cartridge path
        below += cartridgeFileData[match].filter((override) => override.cartridge !== cartridge && override.position > position).length
      })

      // Create Simplified Overrides Count for Tree View
      const overrides = {
        above: above,
        below: below,
        total: total.length,
      }

      if (!skipCacheWrite) {
        this.cacheOverrides.set(cacheKey, overrides)
      }

      return overrides
    }

    /**
     * Process Cartridge Files
     * @param {Array} files Cartridge Files
     * @param {Boolean} skipCacheWrite Whether to Skip Writing to Cache
     * @returns Object
     */
    const processFiles = (files, skipCacheWrite) => {
      let filesClone

      // Cache Files
      if (!skipCacheWrite) {
        // Clone Files so we can sort them
        filesClone = files.map((file) => file.fsPath.replace(this.workspacePath, ''))

        // Sort File List Alphabetically
        filesClone.sort((a, b) => {
          return a.localeCompare(b)
        })

        this.cacheFiles.set('workspaceFiles', filesClone)
      } else {
        filesClone = files
      }

      // Loop through files and look for overrides
      filesClone.forEach((file) => {
        // Pattern to grab some cartridge data about this file
        const fileParts = file.match(REGEXP_CARTRIDGE)

        // Make sure this is a cartridge file
        if (fileParts && fileParts.length === 4) {
          // Map file parts to more helpful names
          const cartridgeName = fileParts[2]
          const relativeFilePath = fileParts[3]

          // Check where this cartridge is in the cartridge path
          const position = this.cartridgesPath.indexOf(cartridgeName)

          // Track relative file path info
          if (!Object.prototype.hasOwnProperty.call(cartridgeFileData, relativeFilePath)) {
            // This is a new file, so no overrides so far
            cartridgeFileData[relativeFilePath] = [
              {
                cartridge: cartridgeName,
                file: file,
                position: position,
                resourceUri: vscode.Uri.file(`${this.workspacePath}${file}`),
              },
            ]
          } else {
            // We already have this file somewhere so there are overrides now
            cartridgeFileData[relativeFilePath].push({
              cartridge: cartridgeName,
              file: file,
              position: position,
              resourceUri: vscode.Uri.file(`${this.workspacePath}${file}`),
            })
          }

          // Sort files by position in cartridge path
          cartridgeFileData[relativeFilePath].sort((a, b) => a.position - b.position)
        }
      })

      // Loop through Cartridge Path in the order they were listed
      this.cartridgesPath.forEach((cartridge) => {
        // Filter Detected files to just the files in the current cartridge
        const cartridgeFiles = filesClone.filter((file) => file.indexOf(`cartridges${path.sep}${cartridge}${path.sep}cartridge`) > -1)

        // Check if Cartridge is missing
        if (cartridgeFiles && cartridgeFiles.length === 0 && !Object.prototype.hasOwnProperty.call(cartridges, cartridge) && !overridesOnly) {
          cartridges[cartridge] = {
            missing: true,
            overrides: null,
            tree: [],
          }
        }

        // Create Tree
        let treeData = []
        let level = {
          treeData,
        }

        // Loop through Cartridge Files
        cartridgeFiles.forEach((file) => {
          // Create RegEx pattern to find information from file path
          const parts = file.match(REGEXP_CARTRIDGE)

          // Sanity check that we have all the info we need
          if (parts && parts.length === 4) {
            // Break out file parts into variables
            const base = parts[1]
            const cartridge = parts[2]
            const relativePath = parts[3]
            const splitRelativePath = relativePath.split(path.sep)

            // Create Cartridge Tree View Root
            if (!Object.prototype.hasOwnProperty.call(cartridges, cartridge)) {
              const baseOverrides = getOverrides(cartridge, null, skipCacheWrite)

              if (!overridesOnly || baseOverrides.total > 0) {
                cartridges[cartridge] = {
                  missing: false,
                  overrides: baseOverrides,
                }
              }
            }

            // Create Tree Structure from Relative File Path
            splitRelativePath.reduce((obj, name, index) => {
              const relativeKey = `${base}${path.sep}cartridges${path.sep}${cartridge}${path.sep}cartridge${path.sep}${splitRelativePath.slice(0, index + 1).join(path.sep)}`

              // Create Tree Item if Not Present
              if (!obj[name]) {
                obj[name] = {
                  treeData: [],
                }

                // Get Data about Tree Item
                const contextValue = index === 0 ? name : index === splitRelativePath.length - 1 ? 'file' : 'folder'
                const fileOverrides = getOverrides(cartridge, relativeKey, skipCacheWrite)

                // Generate Custom Icon for Tree View
                let iconPath = contextValue !== 'file' && contextValue !== 'folder' ? util.getIcon(name, fileOverrides ? fileOverrides.total : 0) : null

                // Build Tree Item
                const treeItem = {
                  name,
                  contextValue: contextValue,
                  children: obj[name].treeData,
                  overrides: fileOverrides,
                  iconPath: iconPath,
                }

                // Add Click Handle Support for File Contexts
                if (contextValue === 'file') {
                  treeItem.resourceUri = vscode.Uri.file(`${this.workspacePath}${relativeKey}`)

                  // This Tree Item is an override, or has overrides, so we need to do hand that off to the Overrides Panel
                  treeItem.command = {
                    command: 'vscode.open',
                    arguments: [treeItem.resourceUri],
                  }

                  // We need some additional data for handing off to Overrides Panel
                  treeItem.data = {
                    cartridge: cartridge,
                    name: relativePath.substring(relativePath.lastIndexOf(path.sep) + 1),
                    overrides: cartridgeFileData[relativePath],
                    resourceUri: vscode.Uri.file(`${this.workspacePath}${relativeKey}`),
                    type: util.getType(file),
                  }
                }

                // Tree Item Meta Data
                const description = []
                const tooltip = []

                // Show if Tree Item is overwritten by another cartridge
                if (fileOverrides && fileOverrides.above > 0) {
                  const aboveCount = fileOverrides.above
                  description.push(localize('panel.cartridges.above.description', aboveCount))
                  tooltip.push(aboveCount > 1 ? localize('panel.cartridges.above.tooltip.plural', aboveCount) : localize('panel.cartridges.above.tooltip.singular', aboveCount))
                }

                // Show if Tree Item overrides another cartridge
                if (fileOverrides && fileOverrides.below > 0) {
                  const belowCount = fileOverrides.below
                  description.push(localize('panel.cartridges.below.description', belowCount))
                  tooltip.push(belowCount > 1 ? localize('panel.cartridges.below.tooltip.plural', belowCount) : localize('panel.cartridges.below.tooltip.singular', belowCount))
                }

                // Create Tree Meta Data
                let descriptionText = description && description.length > 0 ? description.join(' ') : null
                let tooltipText = tooltip && tooltip.length > 0 ? tooltip.join(' ') : null

                // Update Tree Item Labels
                treeItem.description = descriptionText
                treeItem.tooltip = tooltipText

                // Add Tree Item
                if (!overridesOnly || fileOverrides.total > 0) {
                  obj.treeData.push(treeItem)
                }

                // Sort tree by folder first, then file
                obj.treeData.sort((a, b) => {
                  // Skip custom sorting on root level
                  if (index > 0) {
                    // If both are same type, sort by name
                    if (a.contextValue === b.contextValue) {
                      return a.name.localeCompare(b.name)
                    }

                    // Otherwise, sort folders before files
                    return b.contextValue !== 'file' ? 1 : -1
                  }

                  // Use default sorting for root level
                  return a.name.localeCompare(b.name)
                })
              }

              return obj[name]
            }, level)

            // Add Children to Cartridge Root if Present
            if (Object.prototype.hasOwnProperty.call(cartridges, cartridge)) {
              cartridges[cartridge].tree = treeData
            }
          }
        })
      })

      // Let debugger know what we found
      util.logger(localize('debug.logger.cartridgesSummary', files.length.toLocaleString(), Object.keys(cartridges).length.toLocaleString()), 'success')

      return cartridges
    }

    // Check if we have cache for Workspace Files
    if (this.cacheFiles.has('workspaceFiles')) {
      // We have a cached file list
      return Promise.resolve(processFiles(this.cacheFiles.get('workspaceFiles'), true))
    } else {
      // Use Native VS Code methods to locate Cartridges
      return vscode.workspace
        .findFiles(includePattern, excludePattern)
        .then((files) => processFiles(files))
        .catch((err) => {
          util.logger(localize('debug.logger.error', 'Cartridges.getCartridges:processFiles', err.toString()), 'error')
        })
    }
  }

  /**
   * Refresh Cartridge Tree
   * @param {Boolean} useCache Whether to Refresh Tree Using Cache
   */
  refresh(useCache) {
    // Show Loading Indicator Until Loaded
    vscode.window.withProgress(
      {
        location: { viewId: 'sfccCartridgesView' },
      },
      () =>
        new Promise((resolve, reject) => {
          if (!useCache) {
            // Clear Cache
            this.cacheFiles.flush()
            this.cacheOverrides.flush()
          }

          // Fetch Files from Workspace
          this.getCartridges()
            .then((cartridges) => {
              // Update Tree View Data
              this.treeCartridges = this.generateTree(cartridges)

              // Let VS Code know we have updated data
              vscode.commands.executeCommand('extension.sfccCartridges.cartridgeListUpdated', this.treeCartridges)

              // Stop Loading Indicator
              resolve()
            })
            .catch((err) => {
              util.logger(localize('debug.logger.error', 'Cartridges.refresh:getCartridges', err.toString()), 'error')
              reject(err)
            })
        })
    )
  }
}

module.exports = Cartridges
