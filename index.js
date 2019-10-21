#!/usr/bin/env node
const program = require("commander");
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();

program
  .usage("[options] <file ...>")
  .option("-s, --pckSrcName <v>", "source package name")
  .option("-d, --pckDstName <v>", "target package name")
  .option("-v, --version <v>", "package version")
  .option("-c, --configFile <v>", "config file dir");

program.parse(process.argv);

let config = {
  // 默认版本控制字符
  vc: "~",
  // 默认修改的文件类型
  fileext: ["js", "ts"],
  // 默认的修改目录
  pckDir: ["packages"],
  pckjsonKey: ["dependencies", "devDependencies", "peerDependencies"],
  regex: [/require\([\'\"](.+?)[\'\"]\)/, /import.+?from.+?[\'\"](.+?)[\'\"]/]
};
if (program.configFile) {
  const chunk = fs.readFileSync(path.resolve(cwd, program.configFile), {
    encoding: "utf8"
  });
  config = {
    ...config,
    ...JSON.parse(chunk)
  };
} else {
  config = {
    ...config,
    pckSrcName: program.pckSrcName,
    pckDstName: program.pckDstName,
    version: program.version
  };
}

if (config.pckSrcName) {
  for (let i = 0, len = config.pckDir.length; i < len; i++) {
    readFiles(path.resolve(cwd, config.pckDir[i]));
  }
} else {
  console.error("pckSrcName must be set");
}

function readFiles(p) {
  const items = fs.readdirSync(path.resolve(cwd, p));
  if (!items) return;
  const { pckSrcName, pckDstName, version } = config;

  for (let i = 0, len = items.length; i < len; i++) {
    const ele = items[i];
    const info = fs.statSync(path.resolve(cwd, p, ele));
    if (info.isDirectory()) {
      if (version || (pckDstName && pckSrcName !== pckDstName)) {
        modPck(path.resolve(p, ele));
      }
      readFiles(path.resolve(p, ele));
    } else {
      if (pckDstName && pckSrcName !== pckDstName) {
        modFile(path.resolve(p, ele), ele);
      }
    }
  }
}

function modPck(dir) {
  const workpath = path.resolve(cwd, dir, "package.json");

  if (fs.existsSync(workpath)) {
    const tmppath = workpath + ".tmp";
    const { pckSrcName, pckDstName, version } = config;
    const chunk = fs.readFileSync(workpath, { encoding: "utf8" });
    // 没必要try catch
    const obj = JSON.parse(chunk);
    // 如果是当前包，直接改当前版本，不需要版本控制符号
    if (obj.name === pckSrcName) {
      obj.version = version;
      pckDstName && (obj.name = pckDstName);
    }
    for (let i = 0, len = config.pckjsonKey.length; i < len; i++) {
      mod(config.pckjsonKey[i]);
    }

    fs.writeFileSync(tmppath, JSON.stringify(obj, null, 2), {
      encoding: "utf8"
    });
    fs.unlinkSync(workpath);
    fs.renameSync(tmppath, workpath);

    function mod(k) {
      if (obj[k] && obj[k][pckSrcName]) {
        if (pckDstName) {
          // 改包名
          obj[k][pckDstName] = obj[k][pckSrcName];
          delete obj[k][pckSrcName];
          // 加上版本控制字符
          obj[k][pckDstName] = config.vc + version;
        }else{
          // 只改版本号
          obj[k][pckSrcName] = config.vc + version;
        }
      }
    }
  }
}

function modFile(dir, filename) {
  const workpath = dir;
  // 选择需要修改的文件
  if (
    filename !== "package.json" &&
    filename !== "package-lock.json" &&
    filename !== "yarn.lock" &&
    config.fileext.includes(path.extname(filename).slice(1))
  ) {
    const tmppath = workpath + ".tmp";
    // 存在截断的可能所以没法用stream，悲剧
    let chunk = fs.readFileSync(workpath, { encoding: "utf8" });
    const { pckSrcName, pckDstName } = config;

    for (let i = 0, len = config.regex.length; i < len; i++) {
      let cnt = 0;
      while (cnt < chunk.length) {
        const target = chunk.slice(cnt);
        // 先查找出应该替换的部分
        const res = target.match(config.regex[i]);
        if (res) {
          const temp1 = chunk.slice(0, res.index + cnt);
          const temp3 = chunk.slice(res.index + cnt + res[0].length);
          let temp2 = res[0];
          // 如果包名匹配就替换
          if (res[1] === pckSrcName) {
            temp2 = res[0].replace(res[1], pckDstName);
          }
          chunk = temp1 + temp2 + temp3;
          cnt += res.index + temp2.length;
        } else {
          break;
        }
      }
    }
    fs.writeFileSync(tmppath, chunk, { encoding: "utf8" });
    fs.unlinkSync(workpath);
    fs.renameSync(tmppath, workpath);
  }
}
