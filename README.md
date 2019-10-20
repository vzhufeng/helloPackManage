# helloPackManage
A lite tool for managing npm packages, if you got some npm packages in a project, you manage it with lerna, or other tools, you want to modify one of the packages' name, or version, you maybe find other packages' dependencies not modified(like me, maybe that's bacause I use lerna in a wrong way). hello-pack-manage dose this. Don't forget to use it in a git folder, so that after run it, you can check which files and which parts was modified. It may have some bus now(😂).

## usage
1.install
`npm i hello-pack-manage -g`

2.simple use
`hpm -s module1 -d module2 -v 1.2.0`
`-s` is required, which is the source package name to modify, `-d` is the target package name to modify to, `-v` is the target version to modify to.

3.complex use
hmp(short for hello-pack-manage) has a default config, as below

```
// default semver symbol(or version control symbol? don't know the name), but you saw it in package.json, like ^2.2.1. ^, ~, > and so on, can be use, range version, like 1.0.0 - 1.2.0, please write in 'version' field
vc: "~",

// dafault file ext, only these types will be scanned and modified
fileext: ["js", "ts"],

// dafault dir
pckDir: ["packages"],

// dafault package.json fields that will be scanned and modified
pckjsonKey: ["dependencies", "devDependencies", "peerDependencies"],

// dafault regex
regex: [/require\([\'\"](.+?)[\'\"]\)/, /import.+from.+[\'\"](.+?)[\'\"]/]
```

a json file to customise the configuration above is supported, such as 
```
"vc": "^",
"fileext": ["js", "jsx", "css"],
"pckDir": ["packages", "dev-packages"],
"pckjsonKey": ["dependencies"],
```
you can omit any field, use `-c` option to set the config file path

the workspace should like this
```
packages
  |-module1
    |-package.json
    |-index.js
    |-module-nest   // nest is ok
      |-package.json
      |-index.js
  |-module2
  |-package.json   // notice this package.json will not be modified
  |-index.js       // but this index.js will be
```

