---
  title: babel polyfill指南
  date: 2022-09-03T02:38:45Z
  lastmod: 2022-09-03T02:41:28Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

<a target='_blank' href='https://www.yuque.com/docs/share/82c2ca9c-c796-45eb-b54d-c1e157e2c05d?#%20%E3%80%8Ababel%20polyfill%E6%8C%87%E5%8D%97%E3%80%8B'>语雀地址</a>
<a name="OmC6r"></a>
# 目录
- [背景](#背景)
- [core-js介绍](core-js介绍)
- [babel polyfill](babelpolyfill)
- [推荐配置](推荐配置)
- [总结](总结)
<a name="hxcpo"></a>
# 背景
在公司内部对项目进行构建大小优化的时候，发现构建产物，包括core-js与core-js-pure两份core-js相关的代码，所以想去尝试能不能只保留一份core-js

另外在使用一些新的api时，比如[].at(index)，发现项目内并没有对array.at方法进行polyfill，这有点奇怪，毕竟项目的内的babel配置如下所示，按道理应该会有对应的polyfill，但是实际上并没有
```javascript
module.exports = {
  presets: [
    ['@babel/preset-typescript'],
    ['@babel/preset-react'],
    [
      '@babel/preset-env',
      {
        debug: false,
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true
        }
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
      },
    ],
  ],
};
```

为了解决上面的问题，及更近一步了解polyfill，于是有了如下实践
<a name="Qy3G4"></a>
# core-js介绍
core-js目前主流的polyfill库，babel内部默认的polyfill库

core-js目前有两个主流版本在使用2.x与3.x
<a name="HnVIS"></a>
## 3.x与2.x的主要区别

- 3.x支持一些最新的提案api，而2.x不支持最新的一些提案api
- 3.x相比2.x有更合理的命令方式
   - 稳定的方法命名为es.xxx
   - 提案的方法命名为esnext.xxx
   - 而在2.x使用es5、es6、es7这样的命名方式
- 3.x支持多种包结构
   - core-js   提供非纯的polyfill api
   - core-js-pure  提供纯的polyfill api
   - core-js-compact  提供core-js每个版本支持的api及每个api兼容情况，供babel这样的公司查询使用
   - core-js-builder  提供一个core-js自定义打包器，允许定义自定义的core-js
<a name="rz589"></a>
## 常见polyfill入口
```javascript
// 包含所有的Es 与 web api垫片
import "core-js";

// 只包含稳定的ES and web 标准api垫片
import "core-js/stable";

// 只包含稳定的ES api垫片
import "core-js/es";


// 包含所有Set相关api的垫片，包括提案中的api
import "core-js/features/set";

// 包含所有Set相关api的垫片，不包括提案中的api
import "core-js/stable/set";

// 只包含Es Set相关api的垫片
import "core-js/es/set";

// 与上面的Set含义一样，只不过是无污染的形式导入
import Set from "core-js-pure/features/set";
import Set from "core-js-pure/stable/set";
import Set from "core-js-pure/es/set";

// 仅仅polyfill某个方法
import "core-js/features/set/intersection";
import "core-js/stable/queue-microtask";
import "core-js/es/array/from";

// 仅仅包含某个提案
import "core-js/proposals/reflect-metadata";

// 包含state2及以上的提案垫片
import "core-js/stage/2";
```

其实不论是在项目中还是npm中，一般都不会直接使用core-js来进行polyfill，而是会使用babel来进行polyfill，原因是我们写的代码，如果需要运行在低版本的浏览器上，不仅需要对api进行polyfll，而且还需要对相关的es6+语法转换成es5语法，使用babel就可以把这两件事一起做了
<a name="y7vip"></a>
# babel polyfill
babel polyfill在陆续的演变中，提供了两种polyfill的方式，分别是@babel/preset-env与@babel/plugin-transform-runtime，二者都提供了polyfill的能力，但是提供的方式略有不同

**原理**：babel将code => ast => 遍历ast => 碰到对应的api则引入core-js对应的api or 直接引入整个core-js，如下所示
```javascript
require("core-js/modules/es.array.find-index.js");
OR
require("core-js");
OR
var _at = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/at"));
```
<a name="Ip8G2"></a>
## @babel/preset-env
`@babel/preset-env`与polyfill相关的参数如下所示

- `target`  法语与api兼容的最终终端目标
- `useBuiltIns`    是否开启polyfill功能
- `corejs`    core-js相关配置
   - `version`  允许设置成3.1、3.21等值
   - `proposals`         是否允许使用提案语法
- `shippedproposals`    是否允许使用稳定的提案语法

需要注意参数就是 `useBuiltIns: 'entry' | 'usage' | false;`

- `entry` 代表直接引入整个core-js包
- `usage` 代表代码内使用了哪些api，就引入对应api的polyfill
- `false`代表不进行polyfill

考虑到项目大小，一般推荐使用 `useBuiltIns: 'usage'`
<a name="FiNm7"></a>
## @babel/plugin-transform-runtime
为什么`@babel/preset-env`已经提供了polyfill，`@babel/plugin-transform-runtime`还需要提供polyfill，这不是增加使用难度吗？

原因是：`@babel/preset-env`仅提供非纯方式引入的polyfill，在项目使用场景没有问题，但是对于npm包场面，则可能会有问题，因为npm包一般是第三方提供的，为了尽可能的减少引入的npm对项目产生影响，使用无污染的方式导入polyfill更合理，所以最终演变成了`@babel/plugin-transform-runtime`提供无污染的polyfill方式(关于为什么不在`@babel/preset-env`直接做无污染的方式，猜测可能是不同的成员开发的)
```javascript
// 有污染的方式，会直接在arrary原型上添加findIndex方法
require("core-js/modules/es.array.find-index.js");

// 无污染方式，不会在arrary原型上添加findIndex方法
var _at = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/at"));
```

`@babel/plugin-transform-runtime`相关参数如下所示

- `corejs`
   - `version`  只允许设置2、3，这里与`@babel/preset-env`有差异
   - `propsals`

<a name="ctIpI"></a>
## babel新的polyfill方式
babel在polyfill方面，一直在致力以更优及更小的方式帮助项目or npm包导入polyfill，所以babel团队针对目前的polyfill方式，又提出了一种新的解决方案
之前babel polyfill存在两个问题

- babel 提供polyfill的方式有两种，为什么不能使用一种方式，降低使用成本，比如都使用`@babel/preset-env`或者`@babel/plugin-transform-runtime`
- 另外babel默认只支持core-js这一个polyfill库，为什么不支持其它的polyfill库

所以babel团队成员提供了一个新的polyfill插件，通过该插件支持`@babel/preset-env`与`@babel/plugin-transform-runtime`包含的polyfill方式

那么为什么不在`@babel/preset-env`或者`@babel/plugin-transform-runtime`基础上改造呢？原因就是这两个都是独立的包，改造起来成本都大，且都会有侵入性，所以干脆重新开一个仓库维护，并重写了polyfill的内部实现，更多详情可以参考[RFC: Rethink polyfilling story](https://github.com/babel/babel/issues/10008)

`@babel/preset-env`在[7.12.17版本](https://github.com/babel/babel/pull/12583)接入新的[babel-polyfills包](https://github.com/babel/babel-polyfills)
`@babel/plugin-transform-runtime`在[7.13.0](https://github.com/babel/babel/pull/12845)接入新的[babel-polyfills包](https://github.com/babel/babel-polyfills)

```javascript
// @babel/plugin-transform-runtime
createCorejsPlgin(pluginCorejs3, {
  method: "usage-pure",
  version: 3,
  proposals,
  [pluginsCompat]: {
    useBabelRuntime: modulePath,
    ext: corejsExt
  }
}
```

```javascript
// @babel/preset-env
const pluginOptions = {
  method: `${useBuiltIns}-global`,
  version: corejs ? corejs.toString() : undefined,
  targets: polyfillTargets,
  include,
  exclude,
  proposals,
  shippedProposals,
  debug
};

[pluginCoreJS3, pluginOptions]
```

<a name="vFL4c"></a>
## babel-plugin-polifill-corejs3原理
然后我们来看下，新的polyfill方式是如何来实现的，以babel-plugin-polyfill-corejs3@0.2.4为例
<a name="F7KFE"></a>
### 三种注入core-js的方式
<a name="BjX9H"></a>
#### entry-global
注入全局polyfill

| **Input code** | **Output code** |
| --- | --- |
| `import "core-js";` | `import "core-js/modules/es7.array.flat-map.js";`
`import "core-js/modules/es6.array.sort.js"; `
`import "core-js/modules/es7.string.trim-right.js";`
`import "core-js/modules/web.timers.js"; `
... |

对应`@babel/preset-env` 全局polyfill场景
<a name="dtHtu"></a>
#### usage-global
按需注入polyfill

| **Input code** | **Output code** |
| --- | --- |
| `foo.flatMap(x => [x, x+1]); `
`bar.trimLeft(); arr.includes(2);` | `import "core-js/modules/es.array.flat-map.js"; import "core-js/modules/es.array.unscopables.flat-map.js"; `
`import "core-js/modules/es.string.trim-start.js"; `
`foo.flatMap(x => [x, x + 1]); bar.trimLeft(); `
`arr.includes(2);` |

对应`@babel/preset-env` 按需polyfill场景
<a name="ED4Bx"></a>
#### usage-pure
以非全局污染的方式按需导入polyfill

| **Input code** | **Output code** |
| --- | --- |
| `foo.flatMap(x => [x, x+1]); `
`bar.trimLeft(); arr.includes(2);` | `import _flatMapInstanceProperty from "core-js-pure/stable/instance/flat-map.js";`
`import _trimLeftInstanceProperty from "core-js-pure/stable/instance/trim-left.js"; `
`_flatMapInstanceProperty(foo).call(foo, x => [x, x + 1]); `
`_trimLeftInstanceProperty(bar).call(bar); arr.includes(2);` |

对应`@babel/plugin-transform-runtime` polyfill 按需无污染场景

<a name="ACUsq"></a>
### polyfill原理

1. babel生成ast 
1. 遍历ast
1. 根据对应的ast，获取使用的api
1. 然后判断api是否符合polyfill规则 
1. 如果符合，则添加对应的corejs垫片 
   1. 如果是`uages`，则添加`import core-js/modules/es.array.find-index.js`
   1. 如果是`pure`，则添加 `import _findIndex from '@babel/runtime-corejs3/core-js/instance/find-index'`
6. 如果不符合则不添加对应的垫片

**关键点：怎么知道代码内使用的某个api是否符合polyfill规则**

**根据传入的corejs版本号及core-js-compat 包内提供的get-modules-list-for-target-version.js**

modules-by-versions.json 包含每个core-js版本支持的polyfill api，这样做的原因是ecma规范是不断变化的，那么api也会不断的变化状态，比如从state0-state4，在比如新增or删除一个api，所以core-js也是不断变化的，所以每个core-js版本支持的api也是不同的
```javascript
{
  "3.0": [
    "es.symbol",
    "es.symbol.description",
    "es.symbol.async-iterator",
    "es.symbol.has-instance",
    "es.symbol.is-concat-spreadable",
    ...
  ],
  "3.1": [
    "es.string.match-all",
    "es.symbol.match-all",
    "esnext.symbol.replace-all"
  ],
  "3.2": [
    "es.promise.all-settled",
    "esnext.array.is-template-object",
    "esnext.map.update-or-insert",
    "esnext.symbol.async-dispose"
  ],
  ...
  "3.16": [
    "esnext.array.filter-reject",
    "esnext.array.group-by",
    "esnext.typed-array.filter-reject",
    "esnext.typed-array.group-by"
  ],
  "3.17": [
    "es.array.at",
    "es.object.has-own",
    "es.string.at-alternative",
    "es.typed-array.at"
  ]
}

```

modules.json 包含core-js最新版本支持的所有api
```javascript
[
  "es.symbol",
  "es.symbol.description",
  "es.symbol.async-iterator",
  "es.symbol.has-instance",
  "es.symbol.is-concat-spreadable",
  "es.symbol.iterator",
  "es.symbol.match",
  "es.symbol.match-all",
  ...
]

```

```javascript
const modulesByVersions = require('./modules-by-versions');
const modules = require('./modules');

module.exports = function (raw) {
  // 判断传入的额corejs版本号是否符合npm版本号规范
  const corejs = semver(raw);
  if (corejs.major !== 3) {
    throw RangeError('This version of `core-js-compat` works only with `core-js@3`.');
  }
  const result = [];
  // modulesByVersions提供了core-js每个版本提供的polyfill api
  for (const version of Object.keys(modulesByVersions)) {
    // 将小于传入core-js版本号的api传入result数组
    if (compare(version, '<=', corejs)) {
      result.push(...modulesByVersions[version]);
    }
  }
  // modules包含core-js最新支持的所有api，这里的目的是从modules中过滤掉，不包含在result中的api
  return intersection(result, modules);
};
```


```javascript
// 根据传入的corejs版本号，获取当前core-js版本支持的api
const available = new Set(getModulesListForTargetVersion(version));

filterPolyfills(name) {
  // 通过available过滤api，如果api不存在，说明api不在当前的传入的corejs支持版本内，不支持当前api polyfill
  if (!available.has(name)) return false;
  
  // 判断proposals是否为true，如果为ture表示polyfill支持提案语法，所以支持当前 api polyfill
  if (proposals) return true;

  // 判断shippedProposals是否为true，且存在corejs3ShippedProposalsList内，则支持api polyfill
  if (shippedProposals && corejs3ShippedProposalsList.has(name)) {
    return true;
  }

  // 否则，判断api是否是esnext开头，如果是esnext开头，则不支持当前api polyfill，否则则支持当前api polyfill
  return !name.startsWith("esnext.");
},
```

注意`proposals`与`shippedProposals`的区别是，`proposals`代表所有提案， `shippedProposals`代表进入第四个阶段的提案

所以从这里看，如果是使用`@babel/preset-env`polyfill 应该这样设置

项目支持所有api的polyfill
```javascript
const pkg = require('core-js/package.json');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: {
          version: pkg.version,
          proposals: true
        }
      },
    ],
  ],
};

```

项目不支持提案api的polyfill
```javascript
const pkg = require('core-js/package.json');

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: {
          version: pkg.version,
          proposals: false
        }
      },
    ],
  ],
};

```

所以从这里看，如果是使用`@babel/plugin-transform-runtime`polyfill 应该这样设置

npm包支持所有api的polyfill
```javascript
module.exports = {
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: {
          version: 3,
          proposals: true
        },
        helpers: true,
        regenerator: true,
      },
    ],
  ],
};
```

npm包不支持提案api的polyfill
```javascript
module.exports = {
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: {
          version: 3,
          proposals: true
        },
        helpers: true,
        regenerator: true,
      },
    ],
  ],
};
```

注意这里`@babel/preset-env`与`@babel/plugin-transform-runtime`传入的corejs参数有两个差异

- `@babel/plugin-transform-runtime`的corejs参数，不支持传入3.x这样带小版本号的数字
- 因为第一点的不同，导致`proposals`二者插件之间的表象不一致

`@babel/plugin-transform-runtime`传入corejs小版本号会抛错
```javascript
if (![false, 2, 3].includes(corejsVersion)) {
  throw new Error(`The \`core-js\` version must be false, 2 or 3, but got ${JSON.stringify(rawVersion)}.`);
}
```

`@babel/preset-env`与`@babel/plugin-transform-runtime` 的`proposals: true`表象不一致
```javascript
// 输入内容
const getArr = (index) => [5, 12, 8, 130, 44].at(index);
const getIndex = (index) => [5, 12, 8, 130, 44].findIndex(index);

export {
  getArr,
  getIndex,
};

// '@babel/preset-env', version: 3, proposals: true 输出

require("core-js/modules/es.array.find-index.js");

var getArr = function getArr(index) {
  return [5, 12, 8, 130, 44].at(index);
};

var getIndex = function getIndex(index) {
  return [5, 12, 8, 130, 44].findIndex(index);
};

// '@babel/plugin-transform-runtime', version: 3, proposals: true 输出

var _at = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/at"));

var _findIndex = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find-index"));

var getArr = function getArr(index) {
  var _context;

  return (0, _at.default)(_context = [5, 12, 8, 130, 44]).call(_context, index);
};

var getIndex = function getIndex(index) {
  var _context2;

  return (0, _findIndex.default)(_context2 = [5, 12, 8, 130, 44]).call(_context2, index);
};
```

从babel输出结果可以看到，二者传入的都是`corejs: { version: 3, proposals: true}` 为什么得到的结果却是不同的，`@babel/preset-env`没有polyfill到`arrary.at`方法，而`@babel/plugin-transform-runtime`确polyfill到了`array.at`方法，原因是什么呢？

先看`babel-plugin-polyfill-corejs3`插件内的`usageGlobal`实现
![image.png](/static/images/yuque/1662108808647-2ea17cd3-9ce5-4e72-8553-b3d4ad0d3bcb.png#clientId=uccaf6df5-1511-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=480&id=ud8c20780&margin=%5Bobject%20Object%5D&name=image.png&originHeight=960&originWidth=1750&originalType=binary&ratio=1&rotation=0&showTitle=false&size=266592&status=done&style=none&taskId=ud00c3513-0490-4c9c-b30a-71a78a30c12&title=&width=875)

![image.png](/static/images/yuque/1662108760970-a067698e-c958-4517-916d-51bbaccacd5e.png#clientId=uccaf6df5-1511-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=348&id=u9b7c1ed0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=696&originWidth=1766&originalType=binary&ratio=1&rotation=0&showTitle=false&size=160628&status=done&style=none&taskId=u26f4459c-9ff8-4c7e-b3e3-7910be0fbd8&title=&width=883)

![image.png](/static/images/yuque/1662108917769-84792cc5-d2cd-48a8-bcbc-fde0f1d5faac.png#clientId=uccaf6df5-1511-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=239&id=u50f94eb3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=478&originWidth=908&originalType=binary&ratio=1&rotation=0&showTitle=false&size=64610&status=done&style=none&taskId=u6e5def13-740c-4d5e-b838-9c5e53dabd6&title=&width=454)

准确的过滤出`esnext.array.at`方法，而`esnext.array.at`是在core-js 3.8版本内提供的，所以core-js3.0版本内是存在该api，所以最终的polyfill不包含array.at方法

在看`babel-plugin-polyfill-corejs3`内的usagePure实现

![image.png](/static/images/yuque/1662109199541-836a1b37-641a-4da3-a8f0-b0cd873e5685.png#clientId=uccaf6df5-1511-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=493&id=u4b2ec000&margin=%5Bobject%20Object%5D&name=image.png&originHeight=986&originWidth=2008&originalType=binary&ratio=1&rotation=0&showTitle=false&size=370594&status=done&style=none&taskId=ub77d49f3-07a1-48b1-9f8a-24cdb312725&title=&width=1004)

![image.png](/static/images/yuque/1662109240910-110c122e-9f91-4df8-88f1-7519f65f3903.png#clientId=uccaf6df5-1511-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=280&id=ub142a6c1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=560&originWidth=1290&originalType=binary&ratio=1&rotation=0&showTitle=false&size=100268&status=done&style=none&taskId=u5611b0c5-ed40-4dc0-877d-c88da23b406&title=&width=645)

![image.png](/static/images/yuque/1662109284958-63c32ec9-504f-46ce-abba-9ab35ddbe053.png#clientId=uccaf6df5-1511-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=600&id=u2028b55c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1200&originWidth=1278&originalType=binary&ratio=1&rotation=0&showTitle=false&size=234163&status=done&style=none&taskId=u52a815c3-8bf5-4d29-82be-8c3e4c70894&title=&width=639)

![image.png](/static/images/yuque/1662109376947-3f4fc8ea-64eb-46a3-b593-684b98b6564d.png#clientId=uccaf6df5-1511-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=216&id=u77067577&margin=%5Bobject%20Object%5D&name=image.png&originHeight=432&originWidth=1838&originalType=binary&ratio=1&rotation=0&showTitle=false&size=137990&status=done&style=none&taskId=uaf613791-ed2f-4560-91d8-ad35043da3f&title=&width=919)

最终进行匹配的是`esnext.string.at` api, 而不是`esnext.arrary.at` api，而`esnext.string.at`恰好包含在corejs 3.0支持的api内，所以`@babel/plugin-transform-runtime` 场景下`arrary.at` polyfill成功了

结论：

- `proposals: true`在 `@babel/preset-env` 与 `@babel/plugin-transform-runtime`下表现可能是不一致的，需要看具体的api

<a name="pC41G"></a>
### core-js与core-js-pure共存问题
core-js是有污染的方式导入垫片，而core-js-pure是无污染的方式导入垫片；所以如果在项目使用中，出现了无污染方式进行polyfill的包，那么最终构建产物就会包含这两份，如下图所示
![image.png](/static/images/yuque/1662169767927-11380ffd-3da6-4067-a603-5245d16da54a.png#clientId=ucbad8b5b-9d00-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=278&id=udf9c44a2&margin=%5Bobject%20Object%5D&name=image.png&originHeight=555&originWidth=1247&originalType=binary&ratio=1&rotation=0&showTitle=false&size=181610&status=done&style=none&taskId=u5821d0c8-d4f9-4d4d-b183-0f73c31b2d4&title=&width=623.5)

对于这个问题有两个思路

1. 构建项目的时候给webpack设置别名的方式，让core-js-pure or core-js保留一个，但是目前这种方式可能会有问题，相关issues [Do we need both of core-js and core-js-pure in the bundle?](https://github.com/zloirock/core-js/issues/848) 以及[Is there a way to share code between app and libs](https://github.com/zloirock/core-js/issues/833)
1. 对于npm包不使用无污染的方式导入垫片，这样就不会出现core-js-pure

对于内部公司内部npm包在进行构建的时候，是否一定要无污染的polyfill？目前认为是不需要的
原因就是，公司内部的项目本身会做兼容性要求，所以会进行polyfill，是可控的，所以如果引入的npm包又是纯的polyfill，那么项目在构建的产物里面最终会包含core-js 以及 core-js-pure两个包，而这两个包又有一定的大小，所以是自己项目的npm包，**不推荐进行polyfill or 使用非纯的方式进行polyfill**

<a name="g1Epx"></a>
# 推荐配置
鉴于上面`@babel/preset-env` 与 `@babel/plugin-transform-runtime`关于`proposals: true`表现不一致，为了尽可能的降低理解成本，推荐直接使用`babel-plugin-polyfill-corejs3`插件，而关闭`@babel/preset-env` 与 `@babel/plugin-transform-runtime` polyfill的能力

如果还未升级到babel最新版本，建议升级到babel最新版本，以便支持新的polyfill方式
<a name="xOInS"></a>
## 公司内部npm包
```javascript
const pkg = require('core-js/package.json');

module.exports = {
  presets: [
    ['@babel/preset-typescript'],
    ['@babel/preset-react'],
    [
      '@babel/preset-env',
      {
        debug: false,
        useBuiltIns: false,
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
      },
    ],
    [
      "polyfill-corejs3", 
      { 
        "method": "usage-pure", 
        "version": pkg.version,
        "proposals": true
      }
    ]
  ],
};
```

<a name="sFhUT"></a>
## web项目
```javascript
const pkg = require('core-js/package.json');

module.exports = {
  presets: [
    ['@babel/preset-typescript'],
    ['@babel/preset-react'],
    [
      '@babel/preset-env',
      {
        debug: false,
        useBuiltIns: false,
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
      },
    ],
    [
      "polyfill-corejs3", 
      { 
        "method": "usage-global", 
        "version": pkg.version,
        "proposals": true
      }
    ]
  ],
};
```
<a name="RwfiR"></a>
# 总结
回到最开始的两个问题：
在公司内部对项目进行构建大小优化的时候，发现构建产物，包括core-js与core-js-pure两份core-js相关的代码，所以想去尝试能不能只保留一份core-js
解决方案：**对于公司内部的npm包，可以直接使用有污染的方式进行polyfill or 不进行polyfill由项目内统一处理，对于第三方的npm包，则可以尝试使用webpack alias来处理**

另外在使用一些新的api时，比如[].at(index)，发现项目内并没有对array.at方法进行polyfill，这有点奇怪，毕竟项目的内的babel配置如下所示，按道理应该会有对应的polyfill，但是实际上并没有
解决方案：**保证项目的core-js版本是最新的，同时确保传入的corejs参数版本号是最新的，且proposals设置为true**

如果碰到相关的api最终没有被polyfill，推荐按以下步骤进行排查

1. 确定项目使用core-js与core-js-compact版本 `yarn list core-js core-js-compat`
1. 确定使用哪种方式进行polyfill，比如`@babel/preset-env`or `@babel/plugin-transform-runtime`
1. 确认传入的`corejs`参数版本号及`proposals`参数
1. 从`core-js-compact/modules-by-versions.json`内查询使用的api在哪个corejs版本内
   1. 如果不在，则需要升级babel polyfill相关插件版本
   1. 如果在，则确认是否开启proposals语法
5. 如果上面还不能简单排查出来，则推荐使用断点的方式进行排查

