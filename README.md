Project Support
===

If you or your company enjoy using this project, please consider supporting my work and joining my discord. 💖

[![Become a GitHub Sponsor](https://img.shields.io/badge/Sponsor-171515.svg?logo=github&logoColor=white&style=for-the-badge "Become a GitHub Sponsor")](https://github.com/sponsors/sfccdevops)
[![Become a Patreon Sponsor](https://img.shields.io/badge/Sponsor-FF424D.svg?logo=patreon&logoColor=white&style=for-the-badge "Become a Patreon Sponsor")](https://patreon.com/peter_schmalfeldt)
[![Donate via PayPal](https://img.shields.io/badge/Donate-169BD7.svg?logo=paypal&logoColor=white&style=for-the-badge "Donate via PayPal")](https://www.paypal.me/manifestinteractive)
[![Join Discord Community](https://img.shields.io/badge/Community-5865F2.svg?logo=discord&logoColor=white&style=for-the-badge "Join Discord Community")](https://discord.gg/MrrkxYn53Q)

------

![Logo](https://sfccdevops.s3.amazonaws.com/logo-128.png "Logo")

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

[![Create Issue](https://img.shields.io/badge/Get_Help-Troubleshooting-red.svg?style=for-the-badge&logo=github&logoColor=ffffff&logoWidth=16)](https://github.com/sfccdevops/sfcc-cartridge-overrides-vscode-extension/blob/develop/TROUBLESHOOTING.md)

About the Author
---

> [Peter Schmalfeldt](https://peterschmalfeldt.com/) is a Certified Senior Salesforce Commerce Cloud Developer with over 20 years of experience building eCommerce websites, providing everything you need to design, develop & deploy eCommerce applications for Web, Mobile & Desktop platforms.

Disclaimer
---

> The trademarks and product names of Salesforce®, including the mark Salesforce®, are the property of Salesforce.com. SFCC DevOps is not affiliated with Salesforce.com, nor does Salesforce.com sponsor or endorse the SFCC DevOps products or website. The use of the Salesforce® trademark on this project does not indicate an endorsement, recommendation, or business relationship between Salesforce.com and SFCC DevOps.
