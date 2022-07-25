'use strict'

const vscode = require('vscode')
const { init, localize } = require('vscode-nls-i18n')

const CartridgeOverridesProvider = require('./CartridgeOverridesProvider')
const Cartridges = require('./Cartridges')
const CartridgesProvider = require('./CartridgesProvider')
const util = require('./util')
const { SEP } = require('./constants')

const WelcomePane = require('./welcome')

/**
 * Handle Activating Extension
 * @param {*} context
 */
function activate(context) {
  // Initialize Localization
  init(context.extensionPath)

  // Get Extension Version Info
  const currentVersion = context.globalState.get('sfcc-cartridge-overrides.version')
  const packageVersion = vscode.extensions.getExtension('PeterSchmalfeldt.sfcc-cartridge-overrides').packageJSON.version

  // Check if there was a recent change to installed version
  if (currentVersion !== packageVersion) {
    // Update version number so we don't show this again until next update
    context.globalState.update('sfcc-cartridge-overrides.version', packageVersion)

    // Show Welcome Modal since this is a new version or install
    const welcome = new WelcomePane(context)
    welcome.show()
  }

  // Handle Override Timeouts
  let overrideTimeout

  // Handle Reveal Timeouts
  let revealTimeout

  // Store Current Opened File Name
  let currentEditorFileName

  // Store which Tree View File is Selected
  let currentSelectedFileName

  // Create Cartridges Object
  const cartridges = new Cartridges(context)

  // Initialize Tree View Providers
  const cartridgesViewProvider = new CartridgesProvider(context)
  const cartridgeOverridesProvider = new CartridgeOverridesProvider(context)

  // Register Tree Data Providers to Workspace
  const sfccCartridgesView = vscode.window.createTreeView('sfccCartridgesView', { treeDataProvider: cartridgesViewProvider, showCollapseAll: true })
  const sfccCartridgeOverridesView = vscode.window.createTreeView('sfccCartridgeOverridesView', { treeDataProvider: cartridgeOverridesProvider, showCollapseAll: false, canSelectMany: true })

  // Handle File Switcher
  const selectTreeViewFile = () => {
    clearTimeout(overrideTimeout)

    // Exit if the Selected File is the same as the Active File
    if (currentEditorFileName !== undefined && currentEditorFileName === currentSelectedFileName) {
      return
    }

    // Make sure this is a file we care about
    if (util.getType(currentEditorFileName) !== 'unknown' && ['ds', 'js', 'isml', 'properties'].indexOf(currentEditorFileName.split('.').pop()) > -1) {
      // Update Current Selected File Name
      currentSelectedFileName = currentEditorFileName

      // Store some lookup info
      let max = 0
      let found = null

      // Try to Find Tree Item
      const nodes = cartridgesViewProvider.getElement(currentEditorFileName)

      // Reveal Cartridge File in Tree View
      const revealCartridgeFile = (index) => {
        // Check if we are at the end, if so, this is the file
        const isFile = index === max

        // Use native VS Code Tree View to Expand Node Element
        if (sfccCartridgesView) {
          sfccCartridgesView
            .reveal(nodes[index], { focus: isFile, select: isFile, expand: true })
            .then(() => {
              // Check if we need to expand more of the Tree View
              if (index < max) {
                revealCartridgeFile(index + 1)
              }
            })
            .catch((err) => {
              util.logger(localize('debug.logger.error', 'revealCartridgeFile', err.toString()), 'error')
            })
        }
      }

      // If we found a match, reveal it in the tree
      if (nodes && nodes.length > 0) {
        // Store Last Node
        max = nodes.length - 1

        // Get Override for Last Node ( this will be the file name )
        found = nodes[max].data ? nodes[max].data : null
      }

      // Check if we found a matching Override and reveal it in the Tree View
      if (found) {
        // Walk Tree View to Reveal File
        revealCartridgeFile(0)

        // Go ahead an update the Overrides Panel with Selected File
        cartridgeOverridesProvider
          .load(found)
          .then(() => {
            // Once we have populated the Override Panel, let's select the active override
            const selectedOverride = cartridgeOverridesProvider.getElement(found.cartridge)

            clearTimeout(revealTimeout)
            revealTimeout = setTimeout(() => {
              if (sfccCartridgeOverridesView) {
                sfccCartridgeOverridesView.reveal(selectedOverride, { focus: true, select: true, expand: true }).catch((err) => {
                  util.logger(localize('debug.logger.error', 'activate.selectTreeViewFile:reveal', err.toString()), 'error')
                })
              }
            }, 500)
          })
          .catch((err) => {
            util.logger(localize('debug.logger.error', 'activate.selectTreeViewFile:cartridgeOverridesProvider', err.toString()), 'error')
          })
      } else {
        // Show Information Message
        vscode.window.showInformationMessage(localize('command.checkOverrides.noneFound', currentSelectedFileName.substring(currentSelectedFileName.lastIndexOf(SEP) + 1)))
      }
    }
  }

  // Register Commands
  const cartridgeListUpdated = vscode.commands.registerCommand('extension.sfccCartridges.cartridgeListUpdated', (treeData) => cartridgesViewProvider.refresh(treeData))
  const cartridgeMissing = vscode.commands.registerCommand('extension.sfccCartridges.cartridgeMissing', (cartridge) => vscode.window.showErrorMessage(localize('command.cartridgeMissing.error', cartridge)))
  const disableFilter = vscode.commands.registerCommand('extension.sfccCartridges.disableFilter', () => vscode.workspace.getConfiguration().update('extension.sfccCartridges.overridesOnly', false, vscode.ConfigurationTarget.Global))
  const enableFilter = vscode.commands.registerCommand('extension.sfccCartridges.enableFilter', () => vscode.workspace.getConfiguration().update('extension.sfccCartridges.overridesOnly', true, vscode.ConfigurationTarget.Global))
  const openSettings = vscode.commands.registerCommand('extension.sfccCartridges.openSettings', () => vscode.commands.executeCommand('workbench.action.openWorkspaceSettings', 'extension.sfccCartridges'))
  const refreshCartridges = vscode.commands.registerCommand('extension.sfccCartridges.refreshCartridges', () => cartridges.refresh(false))
  const viewOverrides = vscode.commands.registerCommand('extension.sfccCartridges.viewOverrides', (overrides) => cartridgeOverridesProvider.load(overrides))

  // Check if the user clicked the Cartridge Icon in the File Tab list
  const checkOverrides = vscode.commands.registerCommand('extension.sfccCartridges.checkOverrides', (file) => {
    if (file && file.path && currentEditorFileName !== file.path) {
      currentEditorFileName = file.path
      clearTimeout(overrideTimeout)
      overrideTimeout = setTimeout(selectTreeViewFile, 100)
    }
  })

  // Listen for when a Developer has two files selected and clicked the DIFF Context Menu
  const generateDiff = vscode.commands.registerCommand('extension.sfccCartridges.generateDiff', (selected, choices) => {
    // We will need to sort out which order to generate the diff in
    let before
    let after
    let title

    // Sanity check to make sure we have exactly two files selected
    if (selected && choices && choices.length === 2 && choices[0].command && choices[1].command && choices[0].command.arguments && choices[1].command.arguments) {
      if (choices[0].sortOrder < choices[1].sortOrder) {
        // Files were selected in reverse order, let's update it
        before = choices[1].command.arguments[0]
        after = choices[0].command.arguments[0]
        title = `${choices[1].description} ↔ ${choices[0].description}`
      } else {
        // Files were selected in sort order
        before = choices[0].command.arguments[0]
        after = choices[1].command.arguments[0]
        title = `${choices[0].description} ↔ ${choices[1].description}`
      }

      // Generate DIFF between `before` and `after` files
      vscode.commands.executeCommand('vscode.diff', before, after, title, { background: false, preview: false })
    }
  })

  // Listen for Config Change of Overrides and Regenerate Tree when Changed
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((evt) => {
      // Check if Overrides Only was Changed
      const overridesOnlyChanged = evt.affectsConfiguration('extension.sfccCartridges.overridesOnly')

      // Check if Overrides Only was Changed
      const pathChanged = evt.affectsConfiguration('extension.sfccCartridges.path')

      // Check if we should update Cartridge List
      if (overridesOnlyChanged) {
        cartridges.refresh(true)
        cartridgeOverridesProvider.reset()
      } else if (pathChanged) {
        cartridges.refresh(false)
        cartridgeOverridesProvider.reset()
      }
    })
  )

  // Listen for File Creation in Workspace
  context.subscriptions.push(
    vscode.workspace.onDidCreateFiles((evt) => {
      // If a file was created that belonged to a cartridge, we need to refresh
      if (evt.files.some((file) => util.getType(file.path) !== 'unknown')) {
        cartridges.refresh(false)
        cartridgeOverridesProvider.reset()
      }
    })
  )

  // Listen for File Deletion in Workspace
  context.subscriptions.push(
    vscode.workspace.onDidDeleteFiles((evt) => {
      // If a file was deleted that belonged to a cartridge, we need to refresh
      if (evt.files.some((file) => util.getType(file.path) !== 'unknown')) {
        cartridges.refresh(false)
        cartridgeOverridesProvider.reset()
      }
    })
  )

  // Listen for Initial ( so we can switch to the file in our Tree View, if present )
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      // Make sure we have an active document in the editor
      if (document && document.fileName && currentEditorFileName !== document.fileName) {
        // Get current Document File Name
        currentEditorFileName = document.fileName

        // Make sure our View is Visible and select the current file
        if (sfccCartridgesView && sfccCartridgesView.visible) {
          clearTimeout(overrideTimeout)
          overrideTimeout = setTimeout(selectTreeViewFile, 100)
        }
      }
    })
  )

  // Listen for Tab Switching in Window ( so we can switch to the file in our Tree View, if present )
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      // Make sure we have an active document in the editor
      if (editor && editor.document && currentEditorFileName !== editor.document.fileName) {
        // Get current Document File Name
        currentEditorFileName = editor.document.fileName

        // Make sure our View is Visible and select the current file
        if (sfccCartridgesView && sfccCartridgesView.visible) {
          clearTimeout(overrideTimeout)
          overrideTimeout = setTimeout(selectTreeViewFile, 100)
        }
      }
    })
  )

  // Check if our Cartridge View has Changed Visibility
  if (sfccCartridgesView) {
    sfccCartridgesView.onDidChangeVisibility((view) => {
      // Get Active Editor so we can check for open files
      const activeEditor = vscode.window.activeTextEditor

      // Check if our View is Visible and if we already had a file open
      if (view.visible && currentEditorFileName) {
        // Open File in Tree View
        clearTimeout(overrideTimeout)
        overrideTimeout = setTimeout(selectTreeViewFile, 100)
      } else if (view.visible && activeEditor && activeEditor.document && currentEditorFileName !== activeEditor.document.fileName) {
        // Our View is Visible, but we did not have any previous files open with it, so let's get the current file
        currentEditorFileName = activeEditor.document.fileName

        // Let's give the editor a little bit to finish changing since we need to ask for file info
        clearTimeout(overrideTimeout)
        overrideTimeout = setTimeout(selectTreeViewFile, 100)
      }
    })
  }

  // Update VS Code Extension Subscriptions
  context.subscriptions.push(cartridgeListUpdated)
  context.subscriptions.push(cartridgeMissing)
  context.subscriptions.push(checkOverrides)
  context.subscriptions.push(disableFilter)
  context.subscriptions.push(enableFilter)
  context.subscriptions.push(generateDiff)
  context.subscriptions.push(openSettings)
  context.subscriptions.push(refreshCartridges)
  context.subscriptions.push(viewOverrides)
}

/**
 * Handle Deactivating Extension
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
