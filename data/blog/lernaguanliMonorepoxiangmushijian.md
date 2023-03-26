---
  title: lerna管理Monorepo项目实践
  date: 2021-07-18T04:13:14Z
  lastmod: 2021-07-18T04:14:44Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

## Monorepo vs Multirepo

Monorepo 的全称是 monolithic repository，即单体式仓库，与之对应的是 Multirepo(multiple repository)，这里的“单”和“多”是指每个仓库中所管理的模块数量。

Multirepo 是比较传统的做法，即每一个 package 都单独用一个仓库来进行管理。例如：Rollup, ...

Monorep 是把所有相关的 package 都放在一个仓库里进行管理，每个 package 独立发布。 例如：React, Angular, Babel, Jest, Umijs, Vue ...

具体看下图

![multirepo monorepo](https://user-images.githubusercontent.com/20950813/126055171-2c7d64cd-69b8-4f18-8de0-52dd22da8524.png)

当然到底哪一种管理方式更好，仁者见仁，智者见智。前者允许多元化发展（各项目可以有自己的构建工具、依赖管理策略、单元测试方法），后者希望集中管理，减少项目间的差异带来的沟通成本。

虽然拆分子仓库、拆分子 npm 包是进行项目隔离的天然方案，但当仓库内容出现关联时，没有任何一种调试方式比源码放在一起更高效。

结合我们项目的实际场景和业务需要，天然的 MonoRepo ! 因为工程化的最终目的是让业务开发可以 100% 聚焦在业务逻辑上，那么这不仅仅是脚手架、框架需要从自动化、设计上解决的问题，这涉及到仓库管理的设计。

一个理想的开发环境可以抽象成这样：

“只关心业务代码，可以直接跨业务复用而不关心复用方式，调试时所有代码都在源码中。”

在前端开发环境中，多 Git Repo，多 npm 则是这个理想的阻力，它们导致复用要关心版本号，调试需要 npm link。而这些是 MonoRepo 最大的优势。

上图中提到的利用相关工具就是今天的主角 Lerna ! Lerna是业界知名度最高的 Monorepo 管理工具，功能完整。

## lerna

### lerna是什么

> A tool for managing JavaScript projects with multiple packages.
> Lerna is a tool that optimizes the workflow around managing multi-package repositories with git and npm.

Lerna 是一个管理多个 npm 模块的工具，是 Babel 自己用来维护自己的 Monorepo 并开源出的一个项目。优化维护多包的工作流，解决多个包互相依赖，且发布需要手动维护多个包的问题。

一个基本的 Lerna 管理的仓库结构如下

```
my-lerna-repo/
  package.json
  lerna.json
  packages/
    package-1/
      package.json
    package-2/
      package.json
```

### 安装

```
yarn global add lerna
```

### 初始化项目

```
mkdir lerna-demo
cd lerna-demo

lerna init # 固定模式(Fixed mode)默认为固定模式，packages下的所有包共用一个版本号(version)
lerna init --independent # 独立模式(Independent mode)，每一个包有一个独立的版本号
```
##### independent与fixed区别

Fixed/Locked mode，在这种模式下，实际上lerna是把工程当作一个整体来对待。每次发布packges，都是全量发布，无论是否修改。
在Independent mode下，lerna会配合Git，检查文件变动，只发布有改动的packge及依赖了该package的包。


### 创建包

方法1-手动创建:

```
mkdir package-a
cd package-a
npm init -y
```

方法2-使用lerna create方法创建:
```
lerna create <name> [loc]

lerna create cli-ui

lerna create @myfast/core --access public
```

> create 命令详情 请参考 [lerna create](https://github.com/lerna/lerna/blob/main/commands/create/README.md)


### lerna常用命令

lerna提供了很多的命令，我们可以通过`lerna --help`查看，但根据2/8法则我们更应该关注下面这几个命令

- `lerna bootstrap` 等同于`lerna link + yarn install`，用于创建软链包与安装依赖包
- `lerna run`：会像执行一个 for 循环一样，在所有子项目中执行 `npm script` 脚本，并且，它会非常智能的识别依赖关系，并从根依赖开始执行命令；
- `lerna add <package>[@version] [--dev]`  向packages内的包安装本地或者线上包，该命令让 Lerna 可以识别并追踪包之间的依赖关系，因此非常重要
- `lerna exec -- <command> [..args]`  像 `lerna run` 一样，会按照依赖顺序执行命令，不同的是，它可以执行任何命令，例如 `shell` 脚本；
- `lerna version` 根据有变动的包，生成新的包版本，并更新其它包的依赖关系，最终打上tag并提交到远程git仓库，是`lerna publish`命令中的默认前置命令
- `lerna publish` 发布代码有变动的 `package`，因此首先您需要在使用 `Lerna` 前使用 `git commit` 命令提交代码，好让 `Lerna` 有一个 `baseline`；

详细整理了lerna version 及 lerna publish内部流程脑图（lernav4.0.0），如下所示

<img width="2077" alt="lerna" src="https://user-images.githubusercontent.com/20950813/126055283-74d7b698-058c-421e-a57a-598ab7b23699.png" />

#### 项目添加依赖

1、手动在package-a的`dependencies` or `devDependencies`内添加依赖

2、命令行添加

```
lerna add <package>[@version] [--dev] # 命令签名

# 例如
lerna add package-a --scope=package-b # 将 package-a 安装到 package-b
lerna add package-a --scope=package-b --dev # 将 package-a 安装到 package-b 的 devDependencies 下
lerna add package-a --scope=package-b --peer # 将 package-a 安装到 package-b 的 peerDependencies 下
lerna add package-a # 将 package-a 安装到除 package-a 以外的所有模块
lerna add @babel/core # 将 @babel/core 安装到所有模块
```

#### 项目卸载依赖

```
lerna exec -- <command> [..args] # 在每个 package 中执行任意命令，用波折号(--)分割命令语句

lerna exec --scope=npm-list  yarn remove listr # 将 npm-list 包下的 listr 卸载
lerna exec -- yarn remove listr # 将所有包下的 listr 卸载
```

#### 安装依赖

执行lerna bootstrap用于创建软链包与安装依赖包

```
lerna bootstrap
```

执行该命令式做了以下四件事：
1. 为每个 `package` 安装依赖
2. 链接相互依赖的库到具体的目录，例如：如果 package1 依赖 package2，且版本刚好为本地版本，那么会在 node_modules 中链接本地项目，如果版本不满足，需按正常依赖安装
3. 在 bootstraped packages 中 执行 `npm run prepublish`
4. 在 bootstraped packages 中 执行 `npm run prepare`


#### 显示packages下的各个package的version及依赖关系

```
lerna ls
lerna ls --json

[
  {
    "name": "@mykkty/cli-serve",
    "version": "0.0.9",
    "private": false,
    "location": "/Users/wangks/Documents/f/react/lerna-demo/packages/cli-serve"
  },
  {
    "name": "@mykkty/cli-uid",
    "version": "0.1.1",
    "private": false,
    "location": "/Users/wangks/Documents/f/react/lerna-demo/packages/cli-uid"
  },
  {
    "name": "@mykkty/cli-utils",
    "version": "0.0.9",
    "private": false,
    "location": "/Users/wangks/Documents/f/react/lerna-demo/packages/cli-utils"
  },
  {
    "name": "@mykkty/cli",
    "version": "0.0.10",
    "private": false,
    "location": "/Users/wangks/Documents/f/react/lerna-demo/packages/cli"
  }
]
lerna success found 4 packages
```

```
lerna ls --graph // 查看内部依赖

{
  "@mykkty/cli-serve": [
    "@mykkty/cli-utils"
  ],
  "@mykkty/cli-uid": [],
  "@mykkty/cli-utils": [
    "@mykkty/cli-uid"
  ],
  "@mykkty/cli": [
    "@mykkty/cli-serve",
    "@mykkty/cli-utils"
  ]
}
```


```
lerna ls --graph --all // 查看所有依赖

{
  "@mykkty/cli-serve": [
    "@mykkty/cli-utils",
    "rimraf",
    "typescript"
  ],
  "@mykkty/cli-uid": [
    "rimraf",
    "typescript"
  ],
  "@mykkty/cli-utils": [
    "@mykkty/cli-uid",
    "rimraf",
    "typescript"
  ],
  "@mykkty/cli": [
    "@mykkty/cli-serve",
    "@mykkty/cli-utils",
    "rimraf",
    "typescript"
  ]
}
```

#### 清理packages中每个package的node_modules

```
lerna clean
```

#### 执行packages中每个pacakge内的scripts
```
lerna run <script> -- [..args] # 在所有包下运行指定

# 例如
lerna run test # 运行所有包的 test 命令
lerna run build # 运行所有包的 build 命令
lerna run --parallel watch # 观看所有包并在更改时发报，流式处理前缀输出

lerna run --scope package-a test # 运行 package-a 模块下的 test
```

#### 获取本地发包的涉及到的包的新版本号及changeLog

lerna version 生成新的唯一版本号

```
lerna version 1.0.1 # 显示指定

lerna version patch # 语义关键字

lerna version # 从提示中选择

lerna version [major | minor | patch | premajor | preminor | prepatch | prerelease]

lerna version -m "chore(release): publish"

lerna version --conventional-prerelease 生成alpha版本

> Changes:
 - @mykkty/cli-serve: 0.0.1 => 0.1.0-alpha.0
 - @mykkty/cli-uid: 0.0.1 => 0.0.2-alpha.0
 - @mykkty/cli-utils: 0.0.1 => 0.0.2-alpha.0
 - @mykkty/cli: 0.0.1 => 0.1.0-alpha.0


lerna version --conventional-prerelease --preid beta 生成beta版本

> Changes:
 - @mykkty/cli-serve: 0.0.1 => 0.1.0-beta.0
 - @mykkty/cli-uid: 0.0.1 => 0.0.2-beta.0
 - @mykkty/cli-utils: 0.0.1 => 0.0.2-beta.0
 - @mykkty/cli: 0.0.1 => 0.1.0-beta.0
```

##### 自动计算包的新版本号的规则,即conventionalCommits:true的场景

<h6>fixed模式</h6>

1. 根据commit信息计算，当前包的版本是major | minor | patch | premajor | preminor | prepatch | prerelease等，注意这里每个包的comit信息会包含指定scope的commit及没有指定scope的commit msg;这个自动判断是在conventional-changelog-xxx预设内


2. 计算完成之后，会在做一层统一更新，先从包的版本内，获取最高的版本号，然后将其它包的版本号都更改成最高的这个版本号

```
setGlobalVersionCeiling(versions) {
  let highestVersion = this.project.version;

  versions.forEach((bump) => {
    if (bump && semver.gt(bump, highestVersion)) {
      highestVersion = bump;
    }
  });

  versions.forEach((_, name) => versions.set(name, highestVersion));

  return highestVersion;
}
```

<h6>independent模式下</h6>

1. 第一步跟fixed模式下的第一步是一样的，只是没有第二部在统一修改版本号的操作


<h6>所以自动推算版本号可以做如下总结</h6>

1. independent模式下，通过git来判断改动了哪些文件，从而判断哪些包做了变动，变了的包会将本次commit msg添加到commits数组内，用于版本推导，推导版本的规则是 type=feat|feture => minor ， commit msg footer内BREAK CHANGE，或者scope后面有!,比如fix(cli-utils)!: xxxx; => major（0.x.x开始的版本会被做一次修正 major => minor）; 其它都是patch版本

2. fixed模式下，上一步推导出每个包的版本号之后，在做一次版本号修正，获取每个包推导的版本号，用最大的版本号，去覆盖其它包的版本号

3. 我们推送commit msg的时候，一定要注意改动了哪些包内的文件，然后正确的使用feat|!等推导 minor ｜ major的关键type或者标识

4. 如果使用了bump关键字，不论independent模式还是fixed模式，都是按照bump关键字生成版本号

bump: patch => lerna version patch

![image](https://user-images.githubusercontent.com/20950813/126055381-76881745-e10e-4c8c-b1c4-c7e5d469afb0.png)

bump: prepatch => lerna version prepatch
![image](https://user-images.githubusercontent.com/20950813/126055405-02551aee-90d0-435c-8d16-d713176dbc01.png)

bump: minor => lerna version minor

![image](https://user-images.githubusercontent.com/20950813/126055394-f35fe6aa-05d4-4d12-817b-728797b7d200.png)

bump: preminor => lerna version preminor

![image](https://user-images.githubusercontent.com/20950813/126055396-4f2e48db-4de1-45fe-95f2-06657a9c66f5.png)


0.x.x升级主版本的时候，不会成功，会变成小版本，只有包的主版本本身大于1的时候才会直接升主版本
```
if (semver.major(pkg.version) === 0) {
  if (releaseType === "major") {
    releaseType = "minor";
  }
}
```

##### 非自动计算包的新版本号的规则,即conventionalCommits:false的场景

版本号都是通过交互工具，让用户确定包的新版本号，具体如下图所示

![image](https://user-images.githubusercontent.com/20950813/126055348-53e0c682-8852-46fe-85cb-40724d7d9b7c.png)

lerna version内部流程可以参考总结的脑图

> 更多lerna version命令可以[lerna version](https://github.com/lerna/lerna/blob/main/commands/version/README.md)

#### 发布npm包

```
lerna publish

// 强制重新发布
lerna publish --force-publish 

// 显示的发布在当前commit中打了符合规则的tag的packages
lerna publish from-git 

// 显示的发布当前版本在注册表中（registry）不存在的packages（之前没有发布到npm上）
lerna publish from-package 
```

lerna publish --conventional-commits false 成功发布的一个例子
```
➜  lerna-demo git:(main) lerna publish
info cli using local version of lerna
lerna notice cli v4.0.0
lerna info versioning independent
lerna info Looking for changed packages since @mykkty/cli-serve@0.0.6
lerna info ignoring diff in paths matching [ 'ignored-file', '*.md' ]
? Select a new version for @mykkty/cli-serve (currently 0.0.6) Patch (0.0.7)
? Select a new version for @mykkty/cli-uid (currently 0.0.6) Patch (0.0.7)
? Select a new version for @mykkty/cli-utils (currently 0.0.6) Patch (0.0.7)
? Select a new version for @mykkty/cli (currently 0.0.6) Patch (0.0.7)

Changes:
 - @mykkty/cli-serve: 0.0.6 => 0.0.7
 - @mykkty/cli-uid: 0.0.6 => 0.0.7
 - @mykkty/cli-utils: 0.0.6 => 0.0.7
 - @mykkty/cli: 0.0.6 => 0.0.7

? Are you sure you want to publish these packages? Yes
lerna info execute Skipping releases
lerna info git Pushing tags...
lerna info publish Publishing packages to npm...
lerna notice Skipping all user and access validation due to third-party registry
lerna notice Make sure you're authenticated properly ¯\_(ツ)_/¯
lerna WARN ENOLICENSE Packages @mykkty/cli-serve, @mykkty/cli-uid, @mykkty/cli-utils, and @mykkty/cli are missing a license.
lerna WARN ENOLICENSE One way to fix this is to add a LICENSE.md file to the root of this repository.
lerna WARN ENOLICENSE See https://choosealicense.com for additional guidance.
lerna http fetch PUT 200 https://registry.npmjs.org/@mykkty%2fcli-uid 5172ms
lerna success published @mykkty/cli-uid 0.0.7
lerna notice 
lerna notice 📦  @mykkty/cli-uid@0.0.7
lerna notice === Tarball Contents === 
lerna notice 269B lib/index.js  
lerna notice 484B package.json  
lerna notice 20B  README.md     
lerna notice 42B  lib/index.d.ts
lerna notice === Tarball Details === 
lerna notice name:          @mykkty/cli-uid                         
lerna notice version:       0.0.7                                   
lerna notice filename:      mykkty-cli-uid-0.0.7.tgz                
lerna notice package size:  664 B                                   
lerna notice unpacked size: 815 B                                   
lerna notice shasum:        dce9bf9ed93c2dd5610aecedd685cd1952837487
lerna notice integrity:     sha512-s1eD1laBP+X1n[...]YqiZFueT3sq6A==
lerna notice total files:   4                                       
lerna notice 
lerna http fetch PUT 200 https://registry.npmjs.org/@mykkty%2fcli-utils 3216ms
lerna success published @mykkty/cli-utils 0.0.7
lerna notice 
lerna notice 📦  @mykkty/cli-utils@0.0.7
lerna notice === Tarball Contents === 
lerna notice 352B lib/index.js  
lerna notice 547B package.json  
lerna notice 22B  README.md     
lerna notice 90B  lib/index.d.ts
lerna notice === Tarball Details === 
lerna notice name:          @mykkty/cli-utils                       
lerna notice version:       0.0.7                                   
lerna notice filename:      mykkty-cli-utils-0.0.7.tgz              
lerna notice package size:  692 B                                   
lerna notice unpacked size: 1.0 kB                                  
lerna notice shasum:        10d09e808179638625fd018e5b4ee822d4ee2637
lerna notice integrity:     sha512-/Y0w9dDmBG5z9[...]X8OUPYzkBA/Sg==
lerna notice total files:   4                                       
lerna notice 
lerna http fetch PUT 200 https://registry.npmjs.org/@mykkty%2fcli-serve 3485ms
lerna success published @mykkty/cli-serve 0.0.7
lerna notice 
lerna notice 📦  @mykkty/cli-serve@0.0.7
lerna notice === Tarball Contents === 
lerna notice 394B lib/index.js  
lerna notice 549B package.json  
lerna notice 22B  README.md     
lerna notice 137B lib/index.d.ts
lerna notice === Tarball Details === 
lerna notice name:          @mykkty/cli-serve                       
lerna notice version:       0.0.7                                   
lerna notice filename:      mykkty-cli-serve-0.0.7.tgz              
lerna notice package size:  745 B                                   
lerna notice unpacked size: 1.1 kB                                  
lerna notice shasum:        e466b8c1873d4dae0f0533e86db429055f7bd0c3
lerna notice integrity:     sha512-pJVJjYlfl1/33[...]vlyI0Nv6bxDjg==
lerna notice total files:   4                                       
lerna notice 
lerna http fetch PUT 200 https://registry.npmjs.org/@mykkty%2fcli 3289ms
lerna success published @mykkty/cli 0.0.7
lerna notice 
lerna notice 📦  @mykkty/cli@0.0.7
lerna notice === Tarball Contents === 
lerna notice 539B lib/index.js         
lerna notice 49B  bin/test-lerna-cli.js
lerna notice 638B package.json         
lerna notice 16B  README.md            
lerna notice 39B  lib/index.d.ts       
lerna notice === Tarball Details === 
lerna notice name:          @mykkty/cli                             
lerna notice version:       0.0.7                                   
lerna notice filename:      mykkty-cli-0.0.7.tgz                    
lerna notice package size:  853 B                                   
lerna notice unpacked size: 1.3 kB                                  
lerna notice shasum:        0400e986307ee562cf9cf562479ed701d8c6e193
lerna notice integrity:     sha512-C0AHp+I/uvfPd[...]uYoj75avUv0Wg==
lerna notice total files:   5                                       
lerna notice 
Successfully published:
 - @mykkty/cli-serve@0.0.7
 - @mykkty/cli-uid@0.0.7
 - @mykkty/cli-utils@0.0.7
 - @mykkty/cli@0.0.7
lerna success published 4 packages
```

lerna publish内部流程可以参考总结的脑图

> 更多lerna publish命令可以[lerna publish](https://github.com/lerna/lerna/blob/main/commands/publish/README.md)

## lerna.json字段解析

lerna.json解析
```
{
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "command": {
    "version": {
      "conventionalCommits": true,
      "changelogPreset": {
        "name": "conventional-changelog-conventionalcommits",
        "types": [
          {
            "type": "feat",
            "section": ":rocket: New Features",
            "hidden": false
          },
          {
            "type": "fix",
            "section": ":bug: Bug Fix",
            "hidden": false
          },
          {
            "type": "docs",
            "section": ":memo: Documentation",
            "hidden": false
          },
          {
            "type": "style",
            "section": ":sparkles: Styling",
            "hidden": false
          },
          {
            "type": "refactor",
            "section": ":house: Code Refactoring",
            "hidden": false
          },
          {
            "type": "build",
            "section": ":hammer: Build System",
            "hidden": false
          },
          {
            "type": "chore",
            "section": ":mega: Other",
            "hidden": false
          }
        ]
      },
      "gitTagVersion": true,
      "push": false
    },
    "publish": {
      "conventionalCommits": true,
      "ignoreChanges": ["ignored-file", "*.md"],
      "registry": "https://registry.npmjs.org",
      "message": "chore: publish"
    }
  }
}
```

version：当前库的版本,如果是具体数字则是fixed模式，如果是independent则是independent模式
npmClient： 允许指定命令使用的client， 默认是 npm， 可以设置成 yarn
command.publish 控制发布的参数，所有命令行的参数都可以在这里定义，避免在命令行上输入参数，其它的命令参数都可以同样的方式书写
command.publish.ignoreChanges：可以指定那些目录或者文件的变更不会被publish
command.bootstrap.ignore：指定不受 bootstrap 命令影响的包
command.bootstrap.npmClientArgs：指定默认传给 lerna bootstrap 命令的参数
command.bootstrap.scope：指定那些包会受 lerna bootstrap 命令影响
packages：指定包所在的目录
command.version.changelogPreset：修改生成changelog文件的预设
 
## 生成changeLog

```
{
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "command": {
    "version": {
      "conventionalCommits": true,
    },
    "publish": {
      "conventionalCommits": true,
      "ignoreChanges": ["ignored-file", "*.md"],
      "registry": "https://registry.npmjs.org",
      "message": "chore: publish %s"
    }
  }
}
```

通过命令行参数--conventional-commits or 在lerna.json中配置"conventionalCommits": true,如上所示，则会在每个package中生成一份changlog；需要注意的是fixed模式下，会在根目录也生成一份changeLog，而independent模式则不会在根目录下生成一份changeLog

然后为了保成生成changelog内容的格式，我们需要规范我们的commit-msg

规范comit-msg的方式有很多中，我们选择@commitlint/cli + husky的方式，在提交的时候做校验，然后这里有不同的规范，
- @commitlint/config-conventional // 提供交互与icon
- @commitlint/config-lerna-scopes // 提供lerna 管理的 memorepo的 scope校验
- @commitlint/config-angular  // angular的共享规则

这里我们选择
```
module.exports = {
  // 继承默认配置
  extends: [
    '@commitlint/config-conventional',
    '@commitlint/config-lerna-scopes'
  ]
};
```

注意点：
1. 当我们执行version or publish命令的时候，如果conventionalCommits: true 或者命令行添加了该参数，则会直接跳过选择包升级版本的步骤，直接到确认版本是否是需要的版本步骤，如果命令行在加上--yes，会跳过所有命令行确认步骤

2. publish中的message字段是，lerna在在计算版本的时候，会修改package.json且会进行一次commit，所以这里需要我们添加message，且要符合commit-msg校验的，之前本来是想使用包名称的"chore(包名称): publish"，但是包名称这里不能使用变量，或者变量不生效，这里到时可以看下源码

lerna-changelog 作用结合pr来生成changelog，具体可以参考下面三个例子
- https://github.com/frontend9/fe9-library/issues/243  
- https://github.com/lzhengms/lerna-changelog-demo  
- https://github.com/zWingz/acyort-donob-plugins

在仓库改造成monorepo之前的commit怎么生成对应的changLog

```
yarn add conventional-changelog-cli -D -W

// fixed 模式
// 根目录生成
./node_modules/.bin/conventional-changelog --preset angular --release-count 0 --outfile ./CHANGELOG.md --verbose

// packages内的package目录生成
lerna exec --concurrency 1 --stream -- './node_modules/.bin/conventional-changelog --preset angular --release-count 0 --commit-path $PWD --pkg $PWD/package.json --outfile $PWD/CHANGELOG.md --verbose'

// independent模式
// 不需要生成根目录的changeLog
// packages内的package目录生成
lerna exec --concurrency 1 --stream -- './node_modules/.bin/conventional-changelog --preset angular --release-count 0 --commit-path $PWD --pkg $PWD/package.json --outfile $PWD/CHANGELOG.md --verbose --lerna-package $LERNA_PACKAGE_NAME'
```

注意通过命令行conventional-changelog脚本，生成的changeLog指定的预设只包含下面这几种angular, atom, codemirror, ember, eslint, express, jquery, jscs or jshint
conventional-changelog -p angular -i CHANGELOG.md -s

#### conventional-changelog-angular vs conventional-changelog-conventionalcommits

相同点：
conventional-changelog-angular、conventional-changelog-conventionalcommits 一个类型的库，都是生成changeLog的预设

不同点：
conventional-recommended-bump 自动计算得出包的新版本，而计算得到包的新版本，是由不同的preset内的whatBump函数来计算，而对commit messgae的解析是由conventional-commits-parser解析得出，然后conventional-commits-parser解析的出来的commit.notes来判断是否要升级主版本，而notes是否有值，是通过commit的footer内是否有BREAKING CHANGE关键字来判断；而conventional-changelog-conventionalcommits preset加了一个取巧的方式，通过!，比如test(system)!:xxx来给notes赋值，从而判断是否是主版本升级；

另外conventional-changelog-conventionalcommits预设允许自定义types，而conventional-changelog-angular不可以自定义types

conventional-changelog-conventionalcommits whatBump源码

```
whatBump: (commits) => {
  let level = 2
  let breakings = 0
  let features = 0

  commits.forEach(commit => {
    // adds additional breaking change notes
    // for the special case, test(system)!: hello world, where there is
    // a '!' but no 'BREAKING CHANGE' in body:
    addBangNotes(commit)
    if (commit.notes.length > 0) {
      breakings += commit.notes.length
      level = 0
    } else if (commit.type === 'feat' || commit.type === 'feature') {
      features += 1
      if (level === 2) {
        level = 1
      }
    }
  })

  if (config.preMajor && level < 2) {
    level++
  }

  return {
    level: level,
    reason: breakings === 1
      ? `There is ${breakings} BREAKING CHANGE and ${features} features`
      : `There are ${breakings} BREAKING CHANGES and ${features} features`
  }
}

// 返回值
{
  level:0
  reason:'There is 1 BREAKING CHANGE and 0 features'
}


{	
  releaseType:'patch'
  reason:'There are 0 BREAKING CHANGES and 0 features'
  level:2
}
```

#### 怎么调试conventional-commits-parser，获取commit-message解析之后的值

可以在控制台直接输入 conventional-commits-parser，然后进入交互模式

fix(title): a title is fixed 回车三次则会输出解析结果

```
{"type":"fix","scope":"title","subject":"a title is fixed","header":"fix(title): a title is fixed","body":null,"footer":null,"notes":[],"references":[],"revert":null}
```

commit message type的作用用于推导version是patch minor major 版本,判断依据是默认是patch版本，当commit message type是feat or feature 则认为是minor版本，如果scope后面有!,比如test(system)!: 'xxx'，那么则认为是major版本

更多commit message 解析详情参考[conventional-commits-parser](https://github.com/conventional-changelog-archived-repos/conventional-commits-parser)

## yarn workspace

### 作用
Workspace 能更好的统一管理有多个项目的仓库，既可在每个项目下使用独立的 package.json 管理依赖，又可便利的享受一条 yarn 命令安装或者升级所有依赖等。更重要的是可以使多个项目共享同一个 node_modules 目录，提升开发效率和降低磁盘空间占用。

Yarn Workspace 共享 node_modules 依赖

```
projects/
|--project1/
|  |--package.json
|  |--node_modules/
|  |  |--a/
|--project2
|  |--package.json
|  |--node_modules/
|  |  |--a/
|  |  |--project1/
```

project1/package.json:

```
{
  "name": "project1",
  "version": "1.0.0",
  "dependencies": {
    "a": "1.0.0"
  }
}
```

```
{
  "name": "project2",
  "version": "1.0.0",
  "dependencies": {
    "a": "1.0.0",
    "project1": "1.0.0"
  }
}
```

没有使用 Yarn Workspace 前，需要分别在 project1 和 project2 目录下分别执行 yarn|npm install 来安装依赖包到各自的 node_modules 目录下。或者使用 yarn|npm upgrade 来升级依赖的包。

这会产生很多不良的问题：

如果 project1 和 project2 有相同的依赖项目 a，a 都会各自下载一次，这不仅耗时降低开发效率，还额外占用重复的磁盘空间；当 project 项目比较多的时候，此类问题就会显得十分严重。

如果 project2 依赖 project1，而 project1 并没有发布到 npm 仓库，只是一个本地项目，有两种方式配置依赖：

使用相对路径（如 file: 协议）在 project2 中指定 project1 的依赖。
使用 yarn|npm link 来配置依赖。

> 第 1 种方式缺少版本号的具体指定，每次发布版本时都需要相应的依赖版本的修改；第 2 种方式需要自行手工操作，配置复杂易出错。

> 需要 npm-2.0.0+ 才支持模块间的相对路径依赖，详见 npm 官方文档 package.json/Local Paths

没有一个统一的地方对全部项目进行统一构建等，需要到各个项目内执行 yarn|npm build 来构架项目。

使用 Yarn Workspace 之后，上述问题都能得到很好的解决。而且这是 Yarn 内置的功能，并不需要安装什么其他的包，只需要简单的在 projects 目录（Yarn 称之为 workspace-root）下增加如下内容的 package.json 文件即可。

projects/package.json：
```
{
  "private": true,
  "workspaces": ["project1", "project2"] // 也可以使用通配符设置为 ["project*"]
}
```

在 workspace-root 目录下执行 yarn install：

```
$ cd projects
$ rm -r project1/node_modules
$ rm -r project2/node_modules

$ yarn install
yarn install v1.22.0
info No lockfile found.
[1/4] 🔍  Resolving packages...
[2/4] 🚚  Fetching packages...
[3/4] 🔗  Linking dependencies...
[4/4] 🔨  Building fresh packages...
success Saved lockfile.
✨  Done in 0.56s.
```

此时查看目录结构如下：

```
projects/
|--package.json
|--project1/
|  |--package.json
|--project2
|  |--package.json
|--node_modules/
|  |--a/
|  |--project1/ -> ./project1/
```

说明：

- projects 是各个子项目的上级目录，术语上称之为 workspace-root，而 project1 和 project2 术语上称之为 workspace。
- yarn install 命令既可以在 workspace-root 目录下执行，也可以在任何一个 workspace 目录下执行，效果是一样的。
如果需要某个特殊的 workspace 不受 Yarn Workspace 管理，只需在此 workspace 目录下添加 .yarnrc 文件，并添加如下内容禁用即可：
```
workspaces-experimental false
```
- 在 project1 和 project2 目录下并没有 node_modules 目录（特殊情况下才会有，如当 project1 和 project2 依赖了不同版本的 a 时）。
- /node_modules/project1 是 /project1 的软链接，软链接的名称使用的是 /project1/package.json#name 属性的值。
- 如果只是修改单个 workspace，可以使用 --focus 参数来快速安装相邻的依赖配置从而避免全部安装一次。

### Yarn Workspace 命令

```
yarn workspace <workspace_name> <command>

yarn workspace project1 add vue --dev 《 往 project1 添加 vue 开发依赖
yarn workspace project1 remove vue    《 从 project1 移除 vue 依赖
```

### yarn workspaces命令
```
yarn workspaces <command>

yarn workspaces run <command>
yarn workspaces info [--json]
```

projects/package.json:

```
{
  "scripts": {
    "build": "yarn workspaces run build"
  }
}
```

project1|project2/package.json:

```
{
  "scripts": {
    "build": "rollup -i index.js -f esm -o dist/bundle.js"
  }
}
```

### lerna中开启workspace

lerna默认事没有开启workspace的，也就是packages/xxx目录下的每个包会存在一份node_modules，也就是同一份依赖会存在每个node_modules下

开启workspace

```
{
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true
}
```

```
{
  "private": true, // 为true，workspaces才会生效
    "workspaces": [
      "packages/*"
  ],
}
```

### 同一个依赖不同版本
Yarn使用放置在工作空间根目录中的一个yarn.lock文件。
此外，它尝试将所有项目的依赖项移至工作区根目录的node_modules，以尽可能避免重复。
只有当当前目录的某个依赖包有不同的版本时才会被放到对应目录的node_modues下

比如
package-a  "react-router": "^5.2.0"
package-b  "react-router": "4", 
这时候根目录会存在一个版本，对应的包下面会存在一个版本

### 注意点
workspace不能嵌套（只能有一个根workspace）
workspace采用的是向上遍历，所以workspace并不能识别根workspace之外的依赖。

### lerna最佳实践

开源项目,采用fixed模式，原因是开源项目涉及到的包比较多，且发布版本之间的时间间隔会比较长

```
lerna.json
{
  "version": "0.0.1",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "command": {
    "version": {
      "conventionalCommits": true,
      "changelogPreset": {
        "name": "conventional-changelog-conventionalcommits"
      }
    },
    "publish": {
      "ignoreChanges": ["ignored-file", "*.md"],
      "registry": "https://registry.npmjs.org",
      "message": "chore: publish"
    }
  }
}
```
```
{
  "scripts": {
    "p-prepatch": "lerna publish prepatch",
    "p-prepatch": "lerna publish prepatch --preid beta"
  }
}
```

公司内部项目可以根据具体场景决定采用fixed模式还是independent模式

```
lerna.json
{
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "command": {
    "version": {
      "conventionalCommits": true,
      "changelogPreset": {
        "name": "conventional-changelog-conventionalcommits"
      }
    },
    "publish": {
      "ignoreChanges": ["ignored-file", "*.md"],
      "registry": "https://registry.npmjs.org",
      "message": "chore: publish"
    }
  }
}
```

