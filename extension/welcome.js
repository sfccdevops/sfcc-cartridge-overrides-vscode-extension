const fs = require('fs')
const path = require('path')
const vscode = require('vscode')

const { marked } = require('marked')

class WelcomePane {
  constructor(context) {
    this.context = context
  }

  show() {
    // Set File Path for Documents
    const fileReadme = this.context.asAbsolutePath('README.md')
    const fileWelcome = this.context.asAbsolutePath(path.join('extension', 'resources', 'welcome.html'))

    // Load README File for Welcome Page
    const README = fs.readFileSync(fileReadme, 'utf8')

    // Initialize Webview Panel
    const panel = vscode.window.createWebviewPanel('sfccCartridgeOverridesWelcome', 'Welcome', vscode.ViewColumn.One, {})

    // Read in HTML Template
    let welcomePage = fs.readFileSync(fileWelcome, 'utf8')

    // Replace Template with README
    welcomePage = welcomePage.replace('{{README}}', marked(README))

    // Update Panel Title and Content
    panel.title = 'SFCC Cartridge Overrides Welcome'
    panel.webview.html = welcomePage
  }
}

module.exports = WelcomePane
