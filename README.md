![Logo](https://red-van-workshop.s3.us-east-1.amazonaws.com/logo.png "Logo") ![logo](extension/resources/icon.png)


SFCC Cartridge Overrides - VS Code Extension
---

> VS Code Extension to Display SFCC Cartridge Overrides

* Custom Panel for Displaying SFCC Cartridges with Overrides
* Uses your Cartridge Path to Determine Override Order
* Supports Controllers, Models, Scripts & Templates
* Easily Generate Diffs Between Overrides
* Contextual Listing by Override Type

Cartridge Path Panel
---

> Show your Cartridge in the Correct Order, and optionally filter to only show Overrides.

![screenshot-list](https://sfcc-cartridge-overrides.s3.amazonaws.com/screenshot-list.png)

> Each Cartridge contains Controllers, Models, Scripts & Templates.

![templates-list](https://sfcc-cartridge-overrides.s3.amazonaws.com/templates-list.png)

#### Indicator Meanings:

* `↑` Indicates how many Overrides were found Left of the Selected Cartridge
* `↓` Indicates how many Overrides were found Right of the Selected Cartridge
* On a Folder, `↑` & `↓` indicate the Total Number of Overrides Within the Folder
* On a File, `↑` & `↓` indicate the Total Number of Overrides in the Cartridge Path

Overrides Panel
---

> Once you select a file, view any overrides or files that override your chosen file.

![screenshot-overrides](https://sfcc-cartridge-overrides.s3.amazonaws.com/screenshot-overrides.png)

> Within the Overrides Panel, select Two Files & Right Click to Create a DIFF.

![create-diff](https://sfcc-cartridge-overrides.s3.amazonaws.com/create-diff.png)

#### Indicator Meanings:

* The Bottom File is furthest to the Right in the Cartridge Path
* The Top File is furthest to the Left in the Cartridge Path
* Arrow Indicator means the file is overwriting the file beneath it
* A Green Icon indicates the Current Selected File

Text Editor
---

> Anytime you are editing a file that might have an override, and you do not already have the Overrides Panel open, look for this icon in the Top Right of VS Code.  Clicking it will check for any overrides related to the current file you are editing.

![launch-overrides](https://sfcc-cartridge-overrides.s3.amazonaws.com/launch-overrides.png)

Need Help?
---

> Check out or Troubleshooting Page for help with any known issues or report new ones.

[![Create Issue](https://img.shields.io/badge/Get_Help-Troubleshooting-red.svg?style=for-the-badge&logo=github&logoColor=ffffff&logoWidth=16)](https://github.com/redvanworkshop/sfcc-cartridge-overrides-vscode-extension/blob/develop/TROUBLESHOOTING.md)

About Us
---

This extension was developed and maintained by [Peter Schmalfeldt](https://peterschmalfeldt.com), a Senior SFCC Developer & Open Source Advocate at Red Van Workshop.

[Red Van Workshop](https://redvanworkshop.com/) works with Digital Commerce Retailers who want to get things done.  Our developers enjoy publishing [Open Source](https://github.com/redvanworkshop) solutions to everyday problems.
