# upstream-brave-wallet-strings-to-metamask

A tiny project which syncs up strings that are in use by Brave into the MetaMask extension

The script will write available strings from source directory to the destination directory without adding/removing existing string identifiers in metmask-dir.
It will only add existing identifiers if the source language doesn't exist in the destination directory yet.

## Usage

1. Clone the project to upstream translations to (MetaMask/metamask-extension)
2. Clone the project to upstream translations from (brave/ethereum-remote-client)
3. Install dependencies if not already done: `yarn install`
4. Sync the strings from the source project to the destination project: `yarn run sync-strings ~/projects/projects/brave/ethereum-remote-client ~/projects/MetaMask/metamask-extension`
