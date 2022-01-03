const vscode = require('vscode');
const path = require('path');

const util = require('./util');

class Cartridges {
  constructor() {
    this.workspacePath = util.getWorkspace();
    this.cartridgesPath = this.getFromPath();

    // Fetch files from Workspace and wait for Promise with cartridgeData
    this.getFromWorkspace().then(cartridgeData => {
      this.overrides = cartridgeData.overrides;
      this.cartridgesFound = cartridgeData.cartridgesFound;

      this.treeCartridges = this.generateTree();
      this.treeOverrides = [];

      vscode.commands.executeCommand('extension.sfccCartridges.cartridgeListUpdated', this.treeCartridges);
    });

    /**
     * TODO: Need to complete these steps in this order
     *
     * [X] 1. Get Cartridge Path from Config and build Cartridges Array
     * [X] 2. Find and save Each Cartridges Relative Path to Workspace
     * [X] 3. Loop through each cartridge path and locate `controllers`, `models`, `scripts` and `templates` folders and save matching files to mapped object properties with same name
     * [X] 4. Once we have all the mapped files, loop through the new collection and look for overrides ( files with same relative path from cartridge root ) and store to new overrides object using relative path as key
     * [ ] 5. Once we have all the overrides stored, loop through that object and create new properties tracking number of overrides on a cartridge, folder, and file level ( for both directions in the cartridge path )
     * [ ] 6. Once we have everything mapped out, create a tree view that we can export for VS Code
     */
  }

  generateTree() {
    let treeData = [];
    let level = {
      treeData
    };
    let currentCartridge;

    this.cartridgesFound.forEach(filePath => {
      filePath.split('/').reduce((obj, name, index) => {
        if (!obj[name]) {
          obj[name] = {
            treeData: []
          };

          const treeItem = {
            name,
            children: obj[name].treeData
          }

          let overrideCount = 0;

          if (index === 0) {
            treeItem.contextValue = 'folder';
            currentCartridge = name;
            overrideCount = this.overrides.cartridges[name].total;
          } else if (index === 1 && typeof this.overrides.cartridges[currentCartridge][name] !== 'undefined') {
            treeItem.contextValue = 'folder';
            overrideCount = this.overrides.cartridges[currentCartridge][name];
          } else if (typeof this.overrides.files[filePath.replace(`${currentCartridge}${path.sep}`, '')] !== 'undefined') {
            overrideCount = this.overrides.files[filePath.replace(`${currentCartridge}${path.sep}`, '')].length - 1;

            treeItem.contextValue = 'file';
            treeItem.resourceUri = vscode.Uri.file(`${this.workspacePath}${this.overrides.files[filePath.replace(`${currentCartridge}${path.sep}`, '')][0].file}`);

            // Handle Clicking Tree Item
            if (overrideCount === 0) {
              treeItem.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [treeItem.resourceUri]
              };
            }
          }

          // Show
          if (overrideCount > 0) {
            treeItem.tooltip = `↑ ${overrideCount} Overrides`;
            treeItem.description = `↑ ${overrideCount}`;
          }

          obj.treeData.push(treeItem);
        }

        return obj[name];
      }, level)
    });

    return treeData;
  }

  getFromPath() {
    // Get Cartridge Path from Settings and Convert it to an Array
    const cartridgePath = vscode.workspace.getConfiguration().get('extension.sfccCartridges.path');
    const cartridgesArray = cartridgePath.split(':');

    // Cartridges we want to ignore if detected
    const ignoredCartridges = ['modules'];

    // Strip Ignored Cartridges from Cartridge List
    return cartridgesArray.filter(cartridge => ignoredCartridges.indexOf(cartridge) === -1);
  }

  getFromWorkspace() {
    // Generate Relative Path for Cartridge Pattern Matching
    const includePattern = new vscode.RelativePattern(this.workspacePath, `**/cartridges/{${this.cartridgesPath.join(',')}}/cartridge/{controllers,models,scripts,templates}/**/*.{js,ds,isml,properties}`);
    const excludePattern = new vscode.RelativePattern(this.workspacePath, '**/node_modules/');

    const fileData = {
      overrides: {
        files: {},
        cartridges: {},
      },
      cartridgesFound: []
    };

    // Use Native VS Code methods to locate Cartridges
    return (vscode.workspace.findFiles(includePattern, excludePattern).then(files => {
      const filesClone = files.map(file => file.fsPath.replace(this.workspacePath, ''));

      this.cartridgesPath.forEach(cartridge => {
        filesClone.forEach((file, index) => {
          const isCartridgeMatch = file.includes(`${path.sep}${cartridge}${path.sep}`);
          const isController = file.includes(`${path.sep}controllers${path.sep}`);
          const isModel = file.includes(`${path.sep}models${path.sep}`);
          const isScript = file.includes(`${path.sep}scripts${path.sep}`);
          const isTemplate = file.includes(`${path.sep}templates${path.sep}`);

          if (isCartridgeMatch) {
            const splitPath = file.split(`${path.sep}${cartridge}${path.sep}`);
            const relativePath = splitPath[1].replace(`cartridge${path.sep}`, '');

            // Add File to Cartridge Tree
            fileData.cartridgesFound.push(`${cartridge}/${relativePath}`);

            if (!fileData.overrides.files.hasOwnProperty(relativePath)) {
              fileData.overrides.files[relativePath] = [{
                cartridge: cartridge,
                file: file
              }];
            } else {
              fileData.overrides.files[relativePath].push({
                cartridge: cartridge,
                file: file
              });
            }

            // Track counts of overrides
            if (!fileData.overrides.cartridges.hasOwnProperty(cartridge)) {
              fileData.overrides.cartridges[cartridge] = {
                total: 0,
                controllers: 0,
                models: 0,
                scripts: 0,
                templates: 0
              };
            } else if (fileData.overrides.files[relativePath].length > 1) {
              fileData.overrides.cartridges[cartridge].total += 1;

              if (isController) {
                fileData.overrides.cartridges[cartridge].controllers += 1;
              }

              if (isModel) {
                fileData.overrides.cartridges[cartridge].models += 1;
              }

              if (isScript) {
                fileData.overrides.cartridges[cartridge].scripts += 1;
              }

              if (isTemplate) {
                fileData.overrides.cartridges[cartridge].templates += 1;
              }
            }

            // If this is a match, let's remove it from the sorting list to make next iteration faster
            filesClone.splice(index, 1);
          }
        });
      });

      return fileData;
    }))
  }
  getIcon(type) {
    // TODO: Map Custom Icons for Overwritten Files and Folders
    return null;
  }
}

module.exports = Cartridges;
