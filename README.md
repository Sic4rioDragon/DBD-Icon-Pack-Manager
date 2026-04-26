# DBD Icon Pack Manager

Small local icon pack manager for Dead by Daylight.

It installs local icon packs you already have, lets you mix only the folders you want, and keeps a backup around so you can revert if needed.

This project is not affiliated with Behaviour Interactive, Dead by Daylight, or NightLight.

## What it does

- Uses Steam, Epic Games, or a custom DBD install path
- Supports multiple local pack folders
- Scans downloaded packs on your PC
- Lets you install only selected icon folders
- Supports clean install or merge install
- Creates a default backup from your own DBD install
- Reverts from that backup
- Repairs missing icons from the backup

## Getting packs

This app does not download packs by itself.

You can download packs from:

```txt
https://nightlight.gg/packs
```

After downloading/extracting a pack, add the folder that contains your packs in the app.

## First run

Before installing anything, click:

```txt
Create Default Backup
```

That saves your current DBD icon folder. The revert and repair buttons use that backup.

## Local config

The app reads this file if it exists:

```txt
config.local.json
```

It is ignored by git so your personal paths do not get published.

Example:

```json
{
  "platform": "steam",
  "gamePaths": {
    "steam": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Dead by Daylight",
    "epic": "D:\\Games\\EpicGames\\dbd\\DeadByDaylight",
    "custom": ""
  },
  "packFolders": [
    "D:\\Documents\\deadbydaylight\\packs"
  ],
  "backupFolder": "",
  "installMode": "clean",
  "selectedCategories": [
    "CharPortraits",
    "Emblems",
    "Favors",
    "ItemAddons",
    "Items",
    "Perks",
    "Powers",
    "StatusEffects"
  ]
}
```

## Supported pack folders

The app looks for the same sort of icon folders NightLight-style packs normally use:

```txt
CharPortraits
Emblems
Favors
ItemAddons
Items
Perks
Powers
StatusEffects
```

It also accepts a few common names like `Portraits`, `Addons`, `Add-ons`, and `Offerings`.

## Pack layout

Both of these work:

```txt
My Pack
└─ Icons
   ├─ CharPortraits
   ├─ Favors
   ├─ ItemAddons
   ├─ Items
   ├─ Perks
   ├─ Powers
   └─ StatusEffects
```

```txt
My Pack
├─ CharPortraits
├─ Favors
├─ ItemAddons
├─ Items
├─ Perks
├─ Powers
└─ StatusEffects
```

## Install modes

### Clean install

Restores the backup first, then installs the selected pack folders.

This is the safest mode.

### Merge

Only overwrites files from the selected pack folders.

This is useful when you want to layer one pack over another.

## Running

```bat
install.bat
start.bat
```

or:

```bat
npm install
npm start
```

## Warning

Icon modding is commonly done, but it still changes local game image files.

Use at your own risk. This app only copies image files and does not modify game code.
