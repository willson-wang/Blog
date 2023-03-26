---
  title: 解决husky4.3.8版本在部分电脑上无法使用问题
  date: 2022-04-05T02:47:28Z
  lastmod: 2022-04-05T02:47:46Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

# 目录

- [背景](#背景)
- [husky4.3.8源码分析](#husky4.3.8源码分析)
- [排查错误并手动执行install](#排查错误并手动执行install)
- [husky执行命令实现](#husky执行命令实现)
- [总结](#总结)

### 背景
基于react开发了一套通用模版，在模版内集成了，通用的eslint、prettier等规则，结合huksy+lintstaged来做代码质量与规范的检查，husky选用的是4.3.8版本，package.json如下图所示；

```json
{
  "name": "test",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "typings": "dist/index.d.ts",
  "description": "a little globber",
  "scripts": {
    "ci": "yarn tsc --noEmit && yarn lint:all && yarn spell-check:all && yarn test:coverage",
    "lint:all": "yrc eslint --ext .js,.jsx,.ts,.tsx ./src",
    "spell-check:all": "echo '开始拼写检查' && yrc cspell \"**/*.{txt,ts,tsx,js,json,md}\"",
    "prettier": "yrc prettier --write \"**/**.{js,jsx,tsx,ts,less,md,json}\"",
  },
  "engines": {
    "node": ">=10.13.0"
  },
  "files": [
    "dist",
    "bin"
  ],
  "husky": {
    "hooks": {
      "pre-commit": "yarn setPushFollowTags && yarn tsc --noEmit && lint-staged --verbose",
      "commit-msg": "yrc commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx,md,json}": [
      "yrc prettier --write",
      "yrc cspell --no-must-find-files"
    ],
    "*.{js,jsx,ts,tsx}": [
      "yquality lint --source",
      "yrc eslint --fix "
    ]
  },
  "devDependencies": {
    "husky": "4.3.8",
    "lint-staged": "10.5.4",
  },
}

```
主要使用到husky的两个钩子`pre-commit`与`commit-msg`

但是在部分同事的电脑上，install之后，huksy没有初始化成功，也没有错误提示，导致无法正常使用husky的功能，为了彻底解决这个问题，决定去看一下husky的内部实现

### husky4.3.8源码分析

husky是在install的时候，往.git/hooks目录下注入对应的commit钩子，那么先看package.json

```json
"scripts": {
    "install": "node husky install",
    "preuninstall": "node husky uninstall",
    "postinstall": "opencollective-postinstall || exit 0"
 },
```
关键上面这三个script hook

先看`postinstall`这个钩子就是做了一些辅助工具，无需关注

重点是`install`这个钩子，install这个钩子做的事情如下

检查git版本 => 从环境变量INIT_CWD中获取到当前工作目录 => 创建各种git hook => 创建husky.local.sh 与 husky.sh 用于具体执行huksy命令的脚本

#### 初始化准备工作
```js
// lib/installer/bin.js

// Get INIT_CWD env variable
function getInitCwdEnv() {
    const { INIT_CWD } = process.env;
    if (INIT_CWD === undefined) {
        const { name, version } = which_pm_runs_1.default();
        throw new Error(`INIT_CWD is not set, please check that your package manager supports it (${name} ${version})

Alternatively, you could set it manually:
INIT_CWD="$(pwd)" npm install husky --save-dev

Or upgrade to husky v5`);
    }
    debug_1.debug(`INIT_CWD is set to ${INIT_CWD}`);
    return INIT_CWD;
}


function run() {
    const action = process.argv[2];
    try {
        if (action === 'install') {
            checkSkipInstallEnv();
            checkGitVersion_1.checkGitVersion();
        }
        const INIT_CWD = getInitCwdEnv();
        const userPkgDir = getUserPkgDir(INIT_CWD);
        checkGitDirEnv_1.checkGitDirEnv();
        const { absoluteGitCommonDir, relativeUserPkgDir } = getDirs(userPkgDir);
        if (action === 'install') {
            const { name: pmName } = which_pm_runs_1.default();
            _1.install({
                absoluteGitCommonDir,
                relativeUserPkgDir,
                userPkgDir,
                pmName,
                isCI: ci_info_1.isCI,
            });
        }
        else {
            _1.uninstall({ absoluteGitCommonDir, userPkgDir });
        }
        console.log(`husky > Done`);
    }(err){}
}
```

```js
// lib/installer/checkGitVersion.js

function checkGitVersion() {
    const { status, stderr, stdout } = cp.spawnSync('git', ['--version']);
    if (status !== 0) {
        throw new Error(`git --version command failed. Got ${String(stderr)}.`);
    }
    const [version] = find_versions_1.default(String(stdout));
    if (compare_versions_1.default(version, '2.13.0') === -1) {
        throw new Error(`Husky requires Git >=2.13.0. Got v${version}.`);
    }
}
```

在执行install or uninstall之前会做一些当前工作目录及git版本的检查，这里两个地方会中断执行，导致install失败

1. checkGitVersion内的git版本检查，husky 4.3.8版本要求git版本必须大于等于2.13.0；
1. 无法从环境变量process.env中获取INIT_CWD参数

#### 创建hook
当满足上述条件之后，就会执行对应的install or unstall方法

```js
// lib/installer/index.js

function install({ absoluteGitCommonDir, relativeUserPkgDir, userPkgDir, pmName, // package manager name
isCI, }) {
    // Get conf from package.json or .huskyrc
    const conf = getConf_1.getConf(userPkgDir);
    // Create hooks directory if it doesn't exist
    const gitHooksDir = getGitHooksDir(absoluteGitCommonDir);
    // 判断.git/hooks目录是否存在，如果不存在则创建
    if (!fs_1.default.existsSync(gitHooksDir)) {
        fs_1.default.mkdirSync(gitHooksDir);
    }

    // 创建commit-msg等一系列hook
    hooks_1.createHooks(gitHooksDir);
    
    // 往.git/hooks目录内生成husky.local.sh脚本，用于执行husky具体命令
    localScript_1.createLocalScript(gitHooksDir, pmName, relativeUserPkgDir);
  
    // 往.git/hooks目录内生成husky.sh脚本，用于执行husky具体命令
    mainScript_1.createMainScript(gitHooksDir);
}

function uninstall({ absoluteGitCommonDir, userPkgDir, }) {
    if (isInNodeModules(userPkgDir)) {
        console.log('Trying to uninstall from node_modules directory, skipping Git hooks uninstallation.');
        return;
    }
    // Remove hooks
    const gitHooksDir = getGitHooksDir(absoluteGitCommonDir);
    hooks_1.removeHooks(gitHooksDir);
    localScript_1.removeLocalScript(gitHooksDir);
    mainScript_1.removeMainScript(gitHooksDir);
}
```

install成功之后，我们可以在.git/hooks内看到生成的hook，如下图所示

![image.png](/static/images/yuque/1649124812079-bf15a7aa-6c52-4228-9323-aedb670fd154.png#clientId=ua3e70bd1-884a-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=114&id=ue3cdeb1d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=228&originWidth=1864&originalType=binary&ratio=1&rotation=0&showTitle=false&size=71504&status=done&style=none&taskId=u2f7a3b12-e8f5-4abf-b9db-f086343e8ad&title=&width=932)

具体的hook内容如下所示
```shell
#!/bin/sh
# husky

# Created by Husky v4.3.8 (https://github.com/typicode/husky#readme)
#   At: 2022-4-2 2:37:25 ├F10: PM┤
#   From: xxxx/node_modules/husky (https://github.com/typicode/husky#readme)

. "$(dirname "$0")/husky.sh"
```

到这里我们基本已经知道为什么部分电脑husky不生效，原因主要就是git版本低于指定的2.13.0版本，还有就是无法从环境变量中获取到INIT_CWD

### 排查错误并手动执行install
```jsx
const { execSync } = require('child_process');

const command = process.argv[2] || 'install';

const cwd = process.cwd();

const userAgent = execSync('yarnpkg config get user-agent', {
  encoding: 'utf-8',
}).replace('\n', '');

let pkg = {};
try {
  pkg = require(`${cwd}/package.json`);
} catch (error) {
  console.log('获取package.json错误', error);
}

const huksy = pkg.devDependencies.husky || pkg.dependencies.husky;

if (huksy !== '4.3.8') {
  console.log('仅支持husky 4.3.8版本, 推荐yarn remove husky && yarn add husky@4.3.8 -D');
  process.exit(1);
}

const lastCommand = `HUSKY_DEBUG=true INIT_CWD=${cwd} npm_config_user_agent="${userAgent}" node ./node_modules/husky/lib/installer/bin.js ${command}`;

console.log('实际执行命令：', lastCommand);

execSync(lastCommand, {
  stdio: 'inherit',
});
```
这里把husky内的debug日志开启，便于排查问题
所以当我们提示的是git版本低于要求版本时，则可以通过升级git版本来解决该问题

### husky执行命令实现

```jsx
function runCommand(cwd, hookName, cmd, env) {
    console.log(`husky > ${hookName} (node ${process.version})`);
    const { status } = child_process_1.spawnSync('sh', ['-c', cmd], {
        cwd,
        env: Object.assign(Object.assign({}, process.env), env),
        stdio: 'inherit',
    });
    if (status !== 0) {
        const noVerifyMessage = [
            'commit-msg',
            'pre-commit',
            'pre-rebase',
            'pre-push',
        ].includes(hookName)
            ? '(add --no-verify to bypass)'
            : '(cannot be bypassed with --no-verify due to Git specs)';
        console.log(`husky > ${hookName} hook failed ${noVerifyMessage}`);
    }
    // If shell exits with 127 it means that some command was not found.
    // However, if husky has been deleted from node_modules, it'll be a 127 too.
    // To be able to distinguish between both cases, 127 is changed to 1.
    if (status === 127) {
        return 1;
    }
    return status || 0;
}
```
通过shell方式执行，然后通过status来判断成功还是失败，所以如果我们自己自定义了一些工具，那么如果需要借助huksy来执行，出现错误的场景，一定需要通过process.exit(code)把code向上传递出来

### 总结

husky的runCommand执行方式值得我们在写类似工具时借鉴一二，另外就是为什么我们在install的时候，husky如果初始化失败，为什么没有中断整个install流程？后续有时间在去了解下这里


