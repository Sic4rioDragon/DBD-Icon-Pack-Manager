# DBD Icon Pack Manager

Small local icon pack manager for Dead by Daylight.

It installs local icon packs you already have, lets you mix only the folders you want, compares icons across packs, and keeps a backup around so you can revert if needed.

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
- Compares matching PNG files across different packs
- Lets you keep or delete icon versions while comparing

## Getting packs

This app does not download packs by itself.

You can download packs from:

```txt
https://nightlight.gg/packs
````

After downloading/extracting a pack, add the folder that contains your packs in the app.

## First run

Before installing anything, click:

```txt
Create Default Backup
```

That saves your current DBD icon folder. The revert and repair buttons use that backup.

## Install Packs

The install page lets you:

* Add one or more pack folders
* Scan local packs
* Select a pack
* Pick which icon folders should be installed
* Preview how many files will be copied
* Install in clean or merge mode

## Compare Icons

The compare page scans all added pack folders and finds PNG files with the same name.

Example:

```txt
S41_SableWard_Portrait.png
```

If that file exists in multiple packs, the app shows each version side by side.

### Keep

Keeps the original file in the pack and removes only the temporary compare copy.

### Delete

Deletes the temporary compare copy and also deletes the original PNG from that pack.

Delete is destructive, so the app asks for confirmation first.

## Pack Builder

Pack Builder is in dev right now and is not part of the stable v0.0.1 flow yet.

The idea is:

- Pick icons from downloaded packs
- Copy selected icons into an existing pack
- Create a new local pack
- Build a custom merged pack without deleting anything from the source packs

For now, Compare Icons is the safer tool for sorting through packs.

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
  "compareFolder": "",
  "backupFolder": "",
  "installMode": "clean",
  "startupPage": "menu",
  "showMenuOnStartup": true,
  "selectedCategories": [
    "Actions",
    "CharPortraits",
    "Emblems",
    "Favors",
    "HelpLoading",
    "ItemAddons",
    "Items",
    "Perks",
    "Powers",
    "StatusEffects"
  ]
}
```

If `compareFolder` is empty, the app uses:

```txt
<first pack folder>\compare
```

## Supported pack folders

The app looks for these icon folders:

```txt
Actions
CharPortraits
Emblems
Favors
HelpLoading
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
   ├─ Actions
   ├─ CharPortraits
   ├─ Favors
   ├─ HelpLoading
   ├─ ItemAddons
   ├─ Items
   ├─ Perks
   ├─ Powers
   └─ StatusEffects
```

```txt
My Pack
├─ Actions
├─ CharPortraits
├─ Favors
├─ HelpLoading
├─ ItemAddons
├─ Items
├─ Perks
├─ Powers
└─ StatusEffects
```

Nested folders inside those categories also work.

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

Use at your own risk. This app only copies or deletes image files and does not modify game code.
