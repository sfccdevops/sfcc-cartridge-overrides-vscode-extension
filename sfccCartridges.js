const vscode = require('vscode');
const path = require('path');

const util = require('./util');

/**
 * SFCC Cartridges
 */
class Cartridges {
  /**
   * Initialize Cartridges
   */
  constructor() {
    // Fetch Cartridge Path from Configuration
    this.cartridgesPath = this.getCartridgesPath();

    // Fetch current Workspace Path from VS Code
    this.workspacePath = util.getWorkspace();

    // Default Tree View data
    this.treeCartridges = [];

    // Do initial load of data
    this.refresh();
  }

  /**
   * Generate VS Code Tree View Data
   * @param {Object} cartridges Created from getCartridges
   * @returns
   */
  generateTree(cartridges) {
    // Collect Tree Data
    const treeData = [];

    // Loop through Cartridge Path in the order provided
    this.cartridgesPath.forEach(name => {
      // Root Tree Item Meta Data
      const description = [];
      const tooltip = [];

      // Command Handler for Tree Item Click
      let command = null;

      // Sanity check that `name` belongs to `cartridges`
      if (cartridges.hasOwnProperty(name)) {
        // Show if Root Tree Item is overwritten by another cartridge
        if (cartridges[name].overrides && cartridges[name].overrides.above > 0) {
          const aboveCount = cartridges[name].overrides.above;
          description.push(`↑ ${aboveCount}`);
          tooltip.push(`↑ ${aboveCount} Cartridge Override${aboveCount > 1 ? 's' : ''} ${aboveCount > 1 ? 's' : ''} Above`);
        }

        // Show if Root Tree Item overrides another cartridge
        if (cartridges[name].overrides && cartridges[name].overrides.below > 0) {
          const belowCount = cartridges[name].overrides.below;
          description.push(`↓ ${belowCount}`);
          tooltip.push(`↓ Overrides ${belowCount} Cartridge${belowCount > 1 ? 's' : ''} Below`);
        }

        // Create Root Tree Meta Data
        let iconPath = this.getIcon('cartridge', cartridges[name].overrides ? cartridges[name].overrides.total : 0);
        let descriptionText = description.length > 0 ? description.join(' ') : null;
        let tooltipText = tooltip.length > 0 ? tooltip.join(' ') : null;

        // Check if Cartridge is Missing from Workspace
        if (cartridges[name].missing) {
          iconPath = this.getIcon('cartridge-missing', cartridges[name].overrides ? cartridges[name].overrides.total : 0);
          tooltipText = '⚠ Cartridge Missing from Workspace';
          descriptionText = '⚠';

          // Handle Clicks on Missing Cartridges
          command = {
            command: 'extension.sfccCartridges.cartridgeMissing',
            title: 'Cartridge Missing',
            arguments: [name]
          }

          // Debug Missing Cartridge to Log
          util.debug(`Cartridge Missing from Workspace: ${name}`, 'warn');
        }

        // Push Item to Tree View
        treeData.push({
          name,
          contextValue: 'folder',
          children: cartridges[name].tree,
          iconPath: iconPath,
          tooltip: tooltipText,
          description: descriptionText,
          command: command
        })
      }
    });

    return treeData;
  }

  /**
   * Get Cartridge Path
   * @returns {Object} Filtered Cartridge Array
   */
  getCartridgesPath() {
    // Get Cartridge Path from Settings and Convert it to an Array
    const cartridgePath = vscode.workspace.getConfiguration().get('extension.sfccCartridges.path');
    const cartridgesArray = cartridgePath.split(':');

    // Debug Cartridge Path
    util.debug(`CARTRIDGE PATH:\n- ${cartridgesArray.join('\n- ')}`);

    // Cartridges we want to ignore if detected
    const ignoredCartridges = ['modules'];

    // Strip Ignored Cartridges from Cartridge List
    return cartridgesArray.filter(cartridge => ignoredCartridges.indexOf(cartridge) === -1);
  }

  /**
   *
   * @returns
   */
  getCartridges() {
    // Fetch Config for Override Visibility
    const overridesOnly = vscode.workspace.getConfiguration().get('extension.sfccCartridges.overridesOnly');

    // Generate Relative Path for Cartridge Pattern Matching
    const includePattern = new vscode.RelativePattern(this.workspacePath, `**/cartridges/{${this.cartridgesPath.join(',')}}/cartridge/{controllers,models,scripts,templates}/**/*.{js,ds,isml,properties}`);
    const excludePattern = new vscode.RelativePattern(this.workspacePath, '**/node_modules/');

    // Debug Possibly Helpful Info
    util.debug(`Fetching SFCC Cartridges from Workspace ...`, 'debug');
    util.debug(`Overrides Only: ${overridesOnly ? 'Enabled' : 'Disabled'}`, 'debug');

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

      /**
       * Calculate Cartridge, Folder & Filter Overrides
       * @param {String} cartridge Name of Cartridge
       * @param {String} relativeKey Relative Path to Tree Item
       * @returns {Object} Override Counts
       */
      const getOverrides = (cartridge, relativeKey) => {
        // Store matches between cartridges
        const matches = [];

        // Get position of current cartridge in cartridge path
        const position = this.cartridgesPath.indexOf(cartridge);

        // Get total for overrides contained inside this cartridge for a given folder or file
        const total = Object.keys(cartridgeFileData).reduce((cart, key) => {
          return cart.concat(cartridgeFileData[key].filter(override => {
            // Check if this tree item exists in another cartridge
            const isMatch = relativeKey
              ? cartridgeFileData[key].length > 1 && override.cartridge === cartridge && override.file.indexOf(relativeKey) > -1
              : cartridgeFileData[key].length > 1 && override.cartridge === cartridge;

            // Track matches
            if (isMatch) {
              matches.push(key);
            }

            return isMatch;
          }));
        }, []);

        // Keep track of matching files to the left and right of cartridge path
        let above = 0;
        let below = 0;

        // Loop through matches we found inside this cartridge against other cartridges
        matches.forEach(match => {
          // Check if this relative path exists in another cartridge to the left of the current cartridge path
          if (cartridgeFileData[match].filter(override => override.cartridge !== cartridge && override.position < position).length > 0) {
            above++;
          }

          // Check if this relative path exists in another cartridge to the right of the current cartridge path
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

      // Loop through Cartridge Path in the order they were listed
      this.cartridgesPath.forEach(cartridge => {
        // Filter Detected files to just the files in the current cartridge
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

        // Loop through Cartridge Files
        cartridgeFiles.forEach(file => {
          // Create RegEx pattern to find information from file path
          const regex = /^(.+)\/cartridges\/([^/]+)\/cartridge\/(.+)$/;
          const parts = file.match(regex);

          // Sanity check that we have all the info we need
          if (parts.length === 4) {
            // Break out file parts into variables
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

            // Create Tree Structure from Relative File Path
            splitRelativePath.reduce((obj, name, index) => {
              const relativeKey = `${base}/cartridges/${cartridge}/cartridge/${splitRelativePath.slice(0, index + 1).join('/')}`;

              // Create Tree Item if Not Present
              if (!obj[name]) {
                obj[name] = {
                  treeData: []
                };

                // Get Data about Tree Item
                const contextValue = (index === 0) ? name : (index === splitRelativePath.length - 1) ? 'file' : 'folder';
                const fileOverrides = getOverrides(cartridge, relativeKey);

                let iconPath = contextValue !== 'file' && contextValue !== 'folder'
                  ? this.getIcon(name, fileOverrides ? fileOverrides.total : 0)
                  : null;

                // Build Tree Item
                const treeItem = {
                  name,
                  contextValue: contextValue,
                  children: obj[name].treeData,
                  overrides: fileOverrides,
                  iconPath: iconPath
                }

                // Add Click Handle Support for File Contexts
                if (contextValue === 'file') {
                  treeItem.resourceUri = vscode.Uri.file(`${this.workspacePath}${relativeKey}`);

                  // Handle Clicking Tree Item
                  if (fileOverrides.total === 0) {
                    // This Tree Item does not have overrides, so we can just open the file
                    treeItem.command = {
                      command: 'vscode.open',
                      title: 'Open File',
                      arguments: [treeItem.resourceUri]
                    };
                  } else {
                    // This Tree Item is an override, or has overrides, so we need to do hand that off to the Overrides Panel
                    treeItem.command = {
                      command: 'extension.sfccCartridges.viewOverrides',
                      title: 'View Overrides',
                      arguments: [{
                        overrides: cartridgeFileData[relativePath],
                        cartridge: cartridge
                      }]
                    };
                  }
                }

                // Tree Item Meta Data
                const description = [];
                const tooltip = [];

                // Show if Tree Item is overwritten by another cartridge
                if (fileOverrides && fileOverrides.above > 0) {
                  const aboveCount = fileOverrides.above;
                  description.push(`↑ ${aboveCount}`);
                  tooltip.push(`↑ ${aboveCount} Cartridge Override${aboveCount > 1 ? 's' : ''} Above`);
                }

                // Show if Tree Item overrides another cartridge
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

                // Add Tree Item
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

            // Add Children to Cartridge Root if Present
            if (cartridges.hasOwnProperty(cartridge)) {
              cartridges[cartridge].tree = treeData;
            }
          }
        });
      });

      // Let debugger know what we found
      util.debug(`Found ${files.length.toLocaleString()} files in ${Object.keys(cartridges).length.toLocaleString()} Cartridges in Workspace`, 'success');

      return cartridges;
    }))
  }

  /**
   * Get Icon for Tree View
   * @param {String} type Tree Item Type
   * @param {Integer} overrideCount Use to Indicate Override
   * @returns {Object} Tree Item iconPath
   */
  getIcon(type, overrideCount) {
    return {
      light: path.join(__filename, '..', 'resources', 'light', `${type}${overrideCount && overrideCount > 0 ? '-override' : ''}.svg`),
      dark: path.join(__filename, '..', 'resources', 'dark', `${type}${overrideCount && overrideCount > 0 ? '-override' : ''}.svg`)
    };
  }

  /**
   * Refresh Cartridge Tree
   */
  refresh() {
    // TODO: Add start & stop time to track performance of different cartridge tree parsing options during development

    // Show Loading Indicator Until Loaded
    vscode.window.withProgress({
			location: { viewId: 'sfccCartridgesView' }
		}, () => new Promise(resolve => {
      // Fetch Files from Workspace
      this.getCartridges().then(cartridges => {
        // Update Tree View Data
        this.treeCartridges = this.generateTree(cartridges);

        // Let VS Code know we have updated data
        vscode.commands.executeCommand('extension.sfccCartridges.cartridgeListUpdated', this.treeCartridges);

        // Stop Loading Indicator
        resolve();
      });
    }));
  }
}

module.exports = Cartridges;
