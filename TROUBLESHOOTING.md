Troubleshooting
===

> This document contains a list of known issues, and how to solve them.

Missing Catridges
---

![Missing Cartridges](https://sfcc-cartridge-overrides.s3.amazonaws.com/troubleshooting-missing-cartridges.png "Missing Cartridges")

### All Cartridges Missing

If all of your cartridges are showing as missing, you should be able to resolve this issue by clicking the `Refresh Cartridges` icon to the right of the `CARTRIDGE PATH` label. If you do not see this, hover over the list with your cursor, and it should show up.

### Some Cartridges Missing

Sometimes you have a cartridge in your cartridge path that does not exist in your codebase. If you see other cartridges correctly, those showing as missing are missing. You either have a typo in your cartridge name, or you have actually removed that cartridge from your codebase and should probably remove it from your cartridge path. It might also indicate you are on a git branch that no longer has this cartridge, which is safe to ignore. You can also click the filter icon to only show detected cartridges and files. Enabling the filter will also hide the missing cartridges and any cartridges or files that were not part of any overrides.

Working with Multiple Sites
---

Our extension is built to work within various VS Code setups, whether you are using a Single Workspace, Multiple Workspaces, or No Workspace at all. While we try to help get you started by looking for `cartridgePath` in your `dw.json` file when you first install the extension, we do not rely on it.

Our extension uses a custom ` extension.sfccCartridges.path` setting. VS Code lets you add this as a User, Workspace, or Global setting. You can even set it in a `*.code-workspace` file for your team and make the cartridge path specific to a given git branch.

However you choose to manage your VS Code Workspaces, this is the setting you would need to add to make the magic happen.

```jsonc
{
    // Add this to your workspace settings
    "extension.sfccCartridges.path": "your:cartridge:path"
}
```

Need Help?
===

> You can check for existing issues, or create a new one, by visiting our GitHub Issues page.

[![Create Issue](https://img.shields.io/badge/Github-Issues-red.svg?style=for-the-badge&logo=github&logoColor=ffffff&logoWidth=16)](https://github.com/sfccdevops/sfcc-cartridge-overrides-vscode-extension/issues)
