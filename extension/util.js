'use strict'

const path = require('path')
const vscode = require('vscode')

const { init, localize } = require('vscode-nls-i18n')

const { SEP } = require('./constants')

// Create custom Output Channel to Log Helpful Messages
const output = vscode.window.createOutputChannel('SFCC Cartridge Overrides')

/**
 * Log output to "SFCC Cartridge Overrides" Output Terminal
 * @param {String} message Debug Message
 * @param {String} type Debug Type
 */
const logger = (message, type) => {
  let icon = ''
  let newLine = type ? '\n' : ''

  // Convert message to String if it was not already
  if (typeof message !== 'string') {
    message = JSON.stringify(message)
  }

  // Prefix Logger Messages with Icons
  if (type === 'debug') {
    icon = '› '
  } else if (type === 'error') {
    icon = '✖ '
  } else if (type === 'success') {
    icon = '✔ '
  } else if (type === 'warn') {
    icon = '⚠ '
  }

  // Write Output to Terminal
  output.appendLine(`${newLine}${icon}${message}`)
}

/**
 * Get Icon for Tree View
 * @param {String} type Tree Item Type
 * @param {Integer} overrideCount Use to Indicate Override
 * @returns {Object} Tree Item iconPath
 */
const getIcon = (type, overrideCount) => {
  return {
    light: path.join(__filename, '..', 'resources', 'light', `${type}${overrideCount && overrideCount > 0 ? '-active' : ''}.svg`),
    dark: path.join(__filename, '..', 'resources', 'dark', `${type}${overrideCount && overrideCount > 0 ? '-active' : ''}.svg`),
  }
}

/**
 * Get File Type from Path
 * @param {String} file Relative File Path
 * @returns {String} SFCC File Type
 */
const getType = (file) => {
  if (file.includes(`${SEP}controllers${SEP}`)) {
    return 'controller'
  } else if (file.includes(`${SEP}models${SEP}`)) {
    return 'model'
  } else if (file.includes(`${SEP}scripts${SEP}`)) {
    return 'script'
  } else if (file.includes(`${SEP}templates${SEP}`)) {
    return 'template'
  } else {
    return 'unknown'
  }
}

/**
 * Get VS Code Workspace Base
 * @param {*} context
 * @returns
 */
const getWorkspace = (context) => {
  // Initialize Localization
  init(context.extensionPath)

  let root
  let workspace

  // Check for missing VS Code Workspace, if present, otherwise use context path
  if (context && !vscode.workspace && !vscode.workspace.workspaceFolders) {
    workspace = vscode.workspace.rootPath ? vscode.workspace.rootPath : path.dirname(context.fsPath)
  } else {
    // We have a Workspace, now let's figure out if it's single or multiroot
    if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length === 1) {
      // There was only one Workspace, so we can just use it
      root = vscode.workspace.workspaceFolders[0]
      workspace = root && root.uri ? root.uri.fsPath : null
    } else if (vscode.workspace && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
      // There is more than one Workspace, so let's grab the active one
      if (vscode.window.activeTextEditor) {
        // Since there is a file active, let's find the workspace from that file
        root = vscode.workspace.workspaceFolders.find((wsFolder) => {
          const relative = path.relative(wsFolder.uri.fsPath, vscode.window.activeTextEditor.document.uri.path)
          return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
        })
        workspace = root && root.uri ? root.uri.fsPath : null
      } else {
        // No file was open, so just grab the first available workspace
        root = vscode.workspace.workspaceFolders[0]
        workspace = root && root.uri ? root.uri.fsPath : null
      }
    } else if (context && vscode.workspace) {
      // Something else is going on, let's see if we can still figure it out
      try {
        root = vscode.workspace.getWorkspaceFolder(context)
        workspace = root && root.uri ? root.uri.fsPath : null
      } catch (err) {
        logger(err, 'error')
      }
    }
  }

  // If we did not get Workspace, let the user know
  if (!workspace) {
    const message = localize('debug.logger.missingWorkspace')
    logger(message, 'error')
    vscode.window.showErrorMessage(`${localize('extension.title')}: ${message}`)
  }

  // Debug Cartridge Path
  logger(localize('debug.logger.workspace', workspace))

  return workspace
}

module.exports = {
  logger,
  getIcon,
  getType,
  getWorkspace,
}
