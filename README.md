# Description

help to package node_modules locally when dependencies change.

## Usage

```
yarn add pack-node-modules
```

config prebuild script to package node_modules (if it's necessary) before running build script

```json
{
  "scripts": {
    "prebuild": "packit",
    "build": "build.sh",
  }
}
```