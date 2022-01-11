const vscode = require('vscode');
const path = require('path');

const util = require('./util');

class Cartridges {
  constructor() {
    this.workspacePath = util.getWorkspace();
    this.cartridgesPath = this.getCartridgesPath();

    // Fetch files from Workspace and wait for Promise with cartridgeFiles
    this.getCartridges().then(cartridges => {
      // this.cartridgeFiles = cartridgeFiles;
      //this.overrides = this.getOverrides();
      this.treeCartridges = this.generateTree(cartridges);

      //console.log(this.overrides.cartridges.app_storefront_core);
      //console.log(this.overrides);
      //console.log(this.cartridgeFiles);
      //console.log(this.overrides);

      vscode.commands.executeCommand('extension.sfccCartridges.cartridgeListUpdated', this.treeCartridges);
    });
  }
  generateTree(cartridges) {
    const treeData = [];

    this.cartridgesPath.forEach(name => {
      const description = [];
      const tooltip = [];

      if (cartridges[name].overrides && cartridges[name].overrides.above > 0) {
        const aboveCount = cartridges[name].overrides.above;
        description.push(`↑ ${aboveCount}`);
        tooltip.push(`↑ ${aboveCount} Cartridge Override${aboveCount > 1 ? 's' : ''} ${aboveCount > 1 ? 's' : ''} Above`);
      }

      if (cartridges[name].overrides && cartridges[name].overrides.below > 0) {
        const belowCount = cartridges[name].overrides.below;
        description.push(`↓ ${belowCount}`);
        tooltip.push(`↓ Overrides ${belowCount} Cartridge${belowCount > 1 ? 's' : ''} Below`);
      }

      // Create Tree Meta Data
      let iconPath = this.getIcon('cartridge', cartridges[name].overrides ? cartridges[name].overrides.total : 0);
      let descriptionText = description.length > 0 ? description.join(' ') : null;
      let tooltipText = tooltip.length > 0 ? tooltip.join(' ') : null;

      // Check if Cartridge is Missing from Workspace
      if (cartridges[name].missing) {
        iconPath = this.getIcon('cartridge-missing', cartridges[name].overrides ? cartridges[name].overrides.total : 0);
        tooltipText = '⚠ Cartridge Missing from Workspace';
        descriptionText = '⚠';
      }

      treeData.push({
        name,
        contextValue: 'folder',
        children: cartridges[name].tree,
        iconPath: iconPath,
        tooltip: tooltipText,
        description: descriptionText
      })
    });

    return treeData;
  }

  getCartridgesPath() {
    // Get Cartridge Path from Settings and Convert it to an Array
    const cartridgePath = vscode.workspace.getConfiguration().get('extension.sfccCartridges.path');
    const cartridgesArray = cartridgePath.split(':');

    // Cartridges we want to ignore if detected
    const ignoredCartridges = ['modules'];

    // Strip Ignored Cartridges from Cartridge List
    return cartridgesArray.filter(cartridge => ignoredCartridges.indexOf(cartridge) === -1);
  }

  getCartridges() {
    // Fetch Config for Override Visibility
    const overridesOnly = vscode.workspace.getConfiguration().get('extension.sfccCartridges.overridesOnly');

    // Generate Relative Path for Cartridge Pattern Matching
    const includePattern = new vscode.RelativePattern(this.workspacePath, `**/cartridges/{${this.cartridgesPath.join(',')}}/cartridge/{controllers,models,scripts,templates}/**/*.{js,ds,isml,properties}`);
    const excludePattern = new vscode.RelativePattern(this.workspacePath, '**/node_modules/');

    // Use Native VS Code methods to locate Cartridges
    return (vscode.workspace.findFiles(includePattern, excludePattern).then(files => {
      // Store Cartridge File Data
      const cartridgeFileData = {};
      const cartridges = {};

      // Clone Files so we can sort them
      const filesClone = files.map(file => file.fsPath.replace(this.workspacePath, ''));

      // Sort File List Alphabetically
      filesClone.sort((a, b) => {
        return a.localeCompare(b);
      });

      // Loop through files and look for overrides
      filesClone.forEach((file, index) => {
        // Pattern to grab some cartridge data about this file
        const regexPattern = /^(.+)\/cartridges\/([^/]+)\/cartridge\/(.+)$/;
        const fileParts = file.match(regexPattern);

        // Make sure this is a cartridge file
        if (fileParts.length === 4) {
          // Map file parts to more helpful names
          const basePath = fileParts[1];
          const cartridgeName = fileParts[2];
          const relativeFilePath = fileParts[3];

          // Check where this cartridge is in the cartridge path
          const position = this.cartridgesPath.indexOf(cartridgeName);

          // Track relative file path info
          if (!cartridgeFileData.hasOwnProperty(relativeFilePath)) {
            // This is a new file, so no overrides so far
            cartridgeFileData[relativeFilePath] = [
              {
                cartridge: cartridgeName,
                file: file,
                position: position
              }
            ];
          } else {
            // We already have this file somewhere so there are overrides now
            cartridgeFileData[relativeFilePath].push({
              cartridge: cartridgeName,
              file: file,
              position: position
            })
          }

          // Sort files by position in cartridge path
          cartridgeFileData[relativeFilePath].sort((a, b) => a.position - b.position)
        }
      });

      const getOverrides = (cartridge, relativeKey) => {
        const matches = [];
        const position = this.cartridgesPath.indexOf(cartridge);

        const total = Object.keys(cartridgeFileData).reduce((cart, key) => {
          return cart.concat(cartridgeFileData[key].filter(override => {
            const isMatch = relativeKey
              ? cartridgeFileData[key].length > 1 && override.cartridge === cartridge && override.file.indexOf(relativeKey) > -1
              : cartridgeFileData[key].length > 1 && override.cartridge === cartridge;

            if (isMatch) {
              matches.push(key);
            }

            return isMatch;
          }));
        }, []);

        let above = 0;
        let below = 0;

        matches.forEach(match => {
          if (cartridgeFileData[match].filter(override => override.cartridge !== cartridge && override.position < position).length > 0) {
            above++;
          }

          if (cartridgeFileData[match].filter(override => override.cartridge !== cartridge && override.position > position).length > 0) {
            below++;
          }
        })

        return {
          above: above,
          below: below,
          total: total.length
        };
      }

      this.cartridgesPath.forEach(cartridge => {
        const cartridgeFiles = filesClone.filter(file => file.indexOf(`cartridges/${cartridge}/cartridge`) > -1);

        // Check if Cartridge is missing
        if (cartridgeFiles.length === 0 && !cartridges.hasOwnProperty(cartridge) && !overridesOnly) {
          cartridges[cartridge] = {
            missing: true,
            overrides: null,
            tree: []
          }
        }

        // Create Tree
        let treeData = [];
        let level = {
          treeData
        };

        cartridgeFiles.forEach(file => {
          const regex = /^(.+)\/cartridges\/([^/]+)\/cartridge\/(.+)$/;
          const parts = file.match(regex);

          if (parts.length === 4) {
            const base = parts[1];
            const cartridge = parts[2];
            const relativePath = parts[3];
            const splitRelativePath = relativePath.split('/');

            // Create Cartridge Tracker
            if (!cartridges.hasOwnProperty(cartridge)) {
              const baseOverrides = getOverrides(cartridge);

              if (!overridesOnly || baseOverrides.total > 0) {
                cartridges[cartridge] = {
                  missing: false,
                  overrides: baseOverrides
                };
              }
            }

            splitRelativePath.reduce((obj, name, index) => {
              const relativeKey = `${base}/cartridges/${cartridge}/cartridge/${splitRelativePath.slice(0, index + 1).join('/')}`;

              if (!obj[name]) {
                obj[name] = {
                  treeData: []
                };

                const contextValue = (index === 0) ? name : (index === splitRelativePath.length - 1) ? 'file' : 'folder';
                const fileOverrides = getOverrides(cartridge, relativeKey);

                let iconPath = contextValue !== 'file' && contextValue !== 'folder'
                  ? this.getIcon(name, fileOverrides ? fileOverrides.total : 0)
                  : null;

                const treeItem = {
                  name,
                  contextValue: contextValue,
                  children: obj[name].treeData,
                  overrides: fileOverrides,
                  iconPath: iconPath
                }

                if (contextValue === 'file') {
                  treeItem.resourceUri = vscode.Uri.file(`${this.workspacePath}${relativeKey}`);

                  // Handle Clicking Tree Item
                  if (fileOverrides.total === 0) {
                    treeItem.command = {
                      command: 'vscode.open',
                      title: 'Open File',
                      arguments: [treeItem.resourceUri]
                    };
                  }
                }

                const description = [];
                const tooltip = [];

                if (fileOverrides && fileOverrides.above > 0) {
                  const aboveCount = fileOverrides.above;
                  description.push(`↑ ${aboveCount}`);
                  tooltip.push(`↑ ${aboveCount} Cartridge Override${aboveCount > 1 ? 's' : ''} Above`);
                }

                if (fileOverrides && fileOverrides.below > 0) {
                  const belowCount = fileOverrides.below;
                  description.push(`↓ ${belowCount}`);
                  tooltip.push(`↓ Overrides ${belowCount} Cartridge${belowCount > 1 ? 's' : ''} Below`);
                }

                // Create Tree Meta Data
                let descriptionText = description.length > 0 ? description.join(' ') : null;
                let tooltipText = tooltip.length > 0 ? tooltip.join(' ') : null;

                treeItem.description = descriptionText;
                treeItem.tooltip = tooltipText;

                if (!overridesOnly || fileOverrides.total > 0) {
                  obj.treeData.push(treeItem);
                }

                // Sort tree by folder first, then file
                obj.treeData.sort((a, b) => {
                  // Skip custom sorting on root level
                  if (index > 0) {
                    // If both are same type, sort by name
                    if (a.contextValue === b.contextValue) {
                      return a.name.localeCompare(b.name);
                    }

                    // Otherwise, sort folders before files
                    return (b.contextValue !== 'file') ? 1 : -1;
                  }

                  // Use default sorting for root level
                  return a.name.localeCompare(b.name);
                });
              }

              return obj[name];
            }, level);

            cartridges[cartridge].tree = treeData;
          }
        });
      });

      return cartridges;
    }))
  }
  getIcon(type, overrideCount) {
    return {
      light: path.join(__filename, '..', 'resources', 'light', `${type}${overrideCount && overrideCount > 0 ? '-override' : ''}.svg`),
      dark: path.join(__filename, '..', 'resources', 'dark', `${type}${overrideCount && overrideCount > 0 ? '-override' : ''}.svg`)
    };
  }
}

module.exports = Cartridges;
