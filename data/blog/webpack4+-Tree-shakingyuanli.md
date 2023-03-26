---
  title: webpack4+ Tree shaking原理
  date: 2022-09-03T03:13:02Z
  lastmod: 2022-09-03T03:13:58Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

<a href='https://www.yuque.com/docs/share/d2a1d7bb-825b-4e6e-94ac-de909a575ec7?# 《webpack Tree shaking》'>语雀地址</a>
<a name="vn2Gs"></a>
# 目录
- 背景
- webpack2 tree shaking
- webpack4 sideEffects
- 最佳实践
- 总结
<a name="UOwNA"></a>
# 背景
说到tree shaking，马上想到的是

- 可以减少代码大小
- 这是一个在javascript中使用之前就存在的概念
- 由 `rollup`率先在`javascript`中使用
- 需要`es6`模块才能生效
- `webpack`项目开启了tree shaking好像并没用什么用
<a name="i8S1I"></a>
## tree shaking究竟是什么
tree shaking 是一个术语，通常用于描述移除 `JavaScript `上下文中的未引用代码(`dead-code`)
<a name="a9DrT"></a>
## 为什么依赖es module
```javascript
// commonjs、amd等模块化方案中，导入导出是动态的，难以预测
if (flag) {
   require('foo.js');
   exports.foo = 'foo';
}
```

```javascript
// es module 下面代码非法，因为导入导出是静态的，不允许放到if等判断条件内
if (flag) {
   import foo from 'foo.js';
   exports const bar = 'bar';
}
```

es module规范中

- import只能出现在在顶层，不能出现在条件等语句中
- import是immutable

这就决定了，模块的导入导出，不需要运行就能够确定关系，所以tree shaking才能够被运用起来

`rollup`的tree shaking在构建npm包的场景已经很成熟，也取得了很好的效果，所以现在关注的重点是，在2022年的今天，`webpack`的tree shaking到底有没有用，相比于之前又有了哪些改进，及中间大概的一个历程
<a name="o11Ko"></a>
# webpack2 tree shaking
在`wbepack2`之前，`webpack2`无法做到两件事情

- 无法直接处理es6 module，`webpack`是借助`babel-loader`来将es module转化为`webpack`能够识别的commonjs module
- 没有tree shaking能力，因为tree shaking依赖es module

为了增加这两项主要能力，`webpack`在2017年1月发布第一个正式的2.2.0版本，此版本直接包含了直接处理es6 module，及借助[UglifyJS](https://github.com/mishoo/UglifyJS2)实现tree shaking的能力

看一个例子
```javascript
export class V6Engine {
  toString() {
    return 'V6';
  }
}

export class V8Engine {
  toString() {
    return 'V8';
  }
}

export function getVersion() {
  return '1.0';
}
```

```javascript
import { V8Engine } from './engine';

class SportsCar {
  constructor(engine) {
    this.engine = engine;
  }

  toString() {
    return this.engine.toString() + ' Sports Car';
  }
}

console.log(new SportsCar(new V8Engine()).toString());
```

通过定义类 `SportsCar`，我们只使用了 `V8Engine`，而没有用到 `V6Engine`。

代码 tree shaking 后，我们期望打包结果只包含用到的类和函数。在这个例子中，意味着它只有 `V8Engine` 和 `SportsCar` 类。

打包时不使用编译器（[Babel](https://babeljs.io/) 等）和压缩工具（[UglifyJS](https://github.com/mishoo/UglifyJS2) 等），可以得到如下输出：
```javascript
(function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export getVersion */
class V6Engine {
  toString() {
    return 'V6';
  }
}
/* unused harmony export V6Engine */

class V8Engine {
  toString() {
    return 'V8';
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = V8Engine;

function getVersion() {
  return '1.0';
}

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__engine__ = __webpack_require__(0);

class SportsCar {
  constructor(engine) {
    this.engine = engine;
  }

  toString() {
    return this.engine.toString() + ' Sports Car';
  }
}

console.log(new SportsCar(new __WEBPACK_IMPORTED_MODULE_0__engine__["a" /* V8Engine */]()).toString());

/***/ })
```

`Webpack` 用注释 `/*unused harmony export V6Engine*/` 将未使用的类和函数标记下来，用 `/*harmony export (immutable)*/ webpack_exports[“a”] = V8Engine; `来标记用到的。

**为什么未使用的代码怎么还在？tree shaking 没有生效吗？**

背后的原因是：`Webpack` 仅仅标记未使用的代码（而不移除），并且不将其导出到模块外。它拉取所有用到的代码，将剩余的（未使用的）代码留给像 `UglifyJS` 这类压缩代码的工具来移除。`UglifyJS` 读取打包结果，在压缩之后移除未使用的代码。通过这一机制，就可以移除未使用的函数 `getVersion` 和类 `V6Engine`。这里与`rollup`是有差异的

`UglifyJS`当时是 [不支持 ES6](https://github.com/mishoo/UglifyJS2/issues/448)及以上语法压缩的。所以需要用 `Babel` 将代码编译为 `ES5`，然后再用 `UglifyJS` 来清除无用代码。添加 `babel`配置，并且需要保证 `babel`不影响模块的输出方式，所以将 `babel`预设的modules改为false，原样输出es6 module
```diff
- ["es2015", { "modules": 'cjs' }]
+ ["es2015", { "modules": false }]
```

对应的`webpack`配置
```javascript
module: {
  rules: [
    { test: /\.js$/, loader: 'babel-loader' }
  ]
},

plugins: [
  new webpack.LoaderOptionsPlugin({
    minimize: true,
    debug: false
  }),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: true
    },
    output: {
      comments: false
    },
    sourceMap: false
  })
]
```

压缩之后的代码,可以看到函数 `getVersion` 被移除了，这是我们所预期的，但是类 `V6Engine` 并没有被移除
```javascript
! function (n) {
  function t(e) {
    if (r[e]) return r[e].exports;
    var o = r[e] = {
      i: e,
      l: !1,
      exports: {}
    };
    return n[e].call(o.exports, o, o.exports, t), o.l = !0, o.exports
  }
  var r = {};
  t.m = n, t.c = r, t.i = function (n) {
    return n
  }, t.d = function (n, r, e) {
    t.o(n, r) || Object.defineProperty(n, r, {
      configurable: !1,
      enumerable: !0,
      get: e
    })
  }, t.n = function (n) {
    var r = n && n.__esModule ? function () {
      return n.default
    } : function () {
      return n
    };
    return t.d(r, "a", r), r
  }, t.o = function (n, t) {
    return Object.prototype.hasOwnProperty.call(n, t)
  }, t.p = "", t(t.s = 2)
}([function (n, t, r) {
  "use strict";
  t.__esModule = !0, t.default = function (n, t) {
    if (!(n instanceof t)) throw new TypeError("Cannot call a class as a function")
  }
}, function (n, t, r) {
  "use strict";
  r.d(t, "a", function () {
    return u
  });
  var e = r(0),
    o = r.n(e),
    u = (function () {
      function n() {
        o()(this, n)
      }
      n.prototype.toString = function () {
        return "V6"
      }
    }(), function () {
      function n() {
        o()(this, n)
      }
      return n.prototype.toString = function () {
        return "V8"
      }, n
    }())
}, function (n, t, r) {
  "use strict";
  Object.defineProperty(t, "__esModule", {
    value: !0
  });
  var e = r(0),
    o = r.n(e),
    u = r(1),
    i = function () {
      function n(t) {
        o()(this, n), this.engine = t
      }
      return n.prototype.toString = function () {
        return this.engine.toString() + " Sports Car"
      }, n
    }();
  console.log(new i(new u.a).toString())
}]);

```

**为什么 **`**V6Engine**`**没有被移除？原因是什么**

我们先看整个过程是

- `babel-loader`将模块语法转化成`es5`，然后保留es module输出
- `webpack`将所有模块整合成bundle
- `webpack`将bundle交给`UglifyJS`压缩移

这期间 `UglifyJS`输出如下 warning
`WARNING in car.prod.bundle.js from UglifyJs Dropping unused function getVersion [car.prod.bundle.js:103,9] Side effects in initialization of unused variable V6Engine [car.prod.bundle.js:79,4]`

`uglifyjs`删除了未使用的函数`getVersion`，但是未使用的变量`V6Engine`有副作用

我们看下`babel`转化成`es5`输出的代码
```javascript
var V6Engine = function () {
  function V6Engine() {
    _classCallCheck(this, V6Engine);
  }

  V6Engine.prototype.toString = function toString() {
    return 'V6';
  };

  return V6Engine;
}();
```
在使用 `ES5` 语法定义类时，类的成员函数会被添加到属性 `prototype`。`UglifyJS` 不能够知道它仅仅是类声明，还是其它有副作用的操作，因为`UglifyJS` 不能做控制流分析。

**所以最终tree shaking只对函数生效，对类未生效**

这里是一些当时关于class tree shaking的issues [Webpack repository](https://github.com/webpack/webpack/issues/2867)、[UglifyJS repository](https://github.com/mishoo/UglifyJS2/issues/1261), 以及解决这个问题的两个思路

- 思路1: 不转化成`es5`，直接输出`es6`代码，然后`UglifyJS`支持es6+语法压缩
- 思路2: 另一个就是讨论出来的pure注释方案，这个除了需要`UglifyJS`自身支持，还需要`babel`、`typescipt`等转换器支持，具体issues：[Babel](https://github.com/babel/babel/issues/5632)、[Typescript](https://github.com/Microsoft/TypeScript/issues/13721)。
```javascript
var V6Engine = /*#__PURE__*/function () {
  function V6Engine() {
    _classCallCheck(this, V6Engine);
  }

  V6Engine.prototype.toString = function toString() {
    return 'V6';
  };

  return V6Engine;
}();
```


针对思路1: 后续的`uglify`直接支持压缩es6+语法
针对思路2:  `uglify`、`babel`、`typescript`都做了对应的支持

- 2017年1月[Support marking a call as pure](https://github.com/mishoo/UglifyJS/pull/1448)支持通过注释的方式标记调用方式是否是pure
- 2017年9月[Annotating transformed classes with #__PURE__ comment](https://github.com/babel/babel/pull/6209)支持转换后的类添加pure注释
- 2017年6月[Emit class annotation comment on downlevel classes](https://github.com/microsoft/TypeScript/pull/16631)支持生成注释的方式比较是否有副作用

当然`babel`团队提供了第三个思路，就是不使用`uglify`压缩代码，`babel`自己写一个压缩工具，为什么？因为`babel`插件体系本身就支持es6+语法，可以直接复用插件，`babel`团队只需要写压缩部分代码

所以在当时的条件下，`babel`团队基于`babel`的生态做作了一个压缩工具，叫做`babili`，现在改名叫`babel-minify`，压缩器直接支持`es6`语法的压缩，整个压缩流程如下所示
之前
`ES2015+ code -> Babel es5 -> BabelMinify/Uglify -> Minified ES5 Code `

之后
`ES2015+ code -> BabelMinify -> Minified ES2015+ Code`

遗憾的是`babel-minify`还是0.x的版本，其官方也是不建议在生产环境使用

**到这个时间节点我们能够得出的结论**

- `webpack`场景下， tree shaking不做具体的代码删减，只做标记
- `webpack`场景下，代码tree shaking 交给了`uglifyJS`这样的压缩工具来做
- `babel`团队基于`babel`生态做了一个压缩工具

**tree shaking还存在如下问题**

- 无法针对转化之后的`es5`类做tree shaking
- 有副作用的场景，tree shaking会不起作用
<a name="GRkwg"></a>
# webpack4 sideEffects
<a name="HyaBq"></a>
## 什么是副作用
在es module模块上下文中，副作用就是在加载该模块的时候会执行一些影响外部模块执行的代码
比如下面的代码
```javascript
// a.js
export const a = 'a'

window.abc = 'abc'

Arrary.prototype.sum = function () {
  return a + b;
}

// index.js
import a from './a'

sum(1, 2)
```

这里的模块`index.js`内未使用`a.js`导出的`a`变量，反而使用了`a`模块内在数组圆形上添加的`sum`方法，这些向全局变量上添加属性or方法，以及填充浏览器的行为都是副作用

常见的副作用有

- 控制台输出，比如`console.log`
- `dom`操作，比如`document.write`
- 修改外部or全局变量或属性

这么看其实副作用代码，貌似也没多大影响，因为项目内的代码都是我们自己写的，我们自己可以控制副作用代码，但是项目不止包含我们自己写的代码，更多的代码是来自第三方npm包，对于第三方npm包内是否有副作用，我们是无法保证的

比如有一个包`big-module`，代码如下所示
```javascript
// index.js
export { a } from "./a";
export { b } from "./b";
console.log();

// a.js
export const a = 'a'

// b.js
export const b = 'b'
console.log('side effect');

// 项目app.js
import { a } from 'big-module'

console.log(a);
```
项目中仅使用`a`，没有使用`b`，但是最终的结果是b模块内容也被打包进来了，为什么`b`会被保留，原因是`b.js`内有副作用代码，当有副作用代码的时候，`webpack`无法判断副作用是否能够删除

所以最终经过压缩工具的时候虽然b能够被删除，但是b模块的副作用代码会被保留下来

这样无形之中我们项目的代码就变大了，只引用了npm包中的一个方法或者组件，但是额外保留了一些副作用代码

另外看一些更复杂一点的场景，还是上面的类似例子
![image.png](/static/images/yuque/1659059089585-13a71bea-013a-4a47-8780-5111a62fc9ab.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=368&id=u1659a1ef&margin=%5Bobject%20Object%5D&name=image.png&originHeight=736&originWidth=3358&originalType=binary&ratio=1&rotation=0&showTitle=false&size=153715&status=done&style=none&taskId=u7e20e738-dc78-43a5-a5e4-8e68e43307e&title=&width=1679)
这里可以看到`re-export`重写导出，`a`、`b`、`c`三个模块，之间是没有互相影响的，如果给`webpack`一个标记，就可以精确的排除`b`、`c`模块，而不需要通过跟踪或者判断是否被使用，这样可以减少bundle尺寸，与优化构建性能

如果我们给`c`一些副作用，也就是将`b+a`的导出赋值给`c`，然后在重新导出`c`，那么`webpack`在最终处理的时候，虽然外部最终只引用了`c`，但是`a、b`也会被打进bundle内
![image.png](/static/images/yuque/1659059123772-a3d3e2e8-918e-4120-b798-29667bad4d1c.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=455&id=uc834f653&margin=%5Bobject%20Object%5D&name=image.png&originHeight=910&originWidth=3356&originalType=binary&ratio=1&rotation=0&showTitle=false&size=266296&status=done&style=none&taskId=u973d7104-8bc7-49bc-9aa3-9f1ffbe602f&title=&width=1678)

所以模块中的副作用除了上面列的几点，还有这里的模块重导出，也就是说有模块重导出的场景，其它每个模块导入之后的模块，都有可能对后导入的模块产生副作用，及模块最终导出的时候可能产生新的副作用

为了针对各种副作用的处理，`webpack`选择了`sideEffects: false`一种声明式的方式，帮助`webpack`快速识别模块副作用，从而更好的实现代码tree shaking
<a name="mXDRC"></a>
## sideEffects作用
上面说到了，`webpack4`中引入了新的处理副作用的方式，那就是通过在package.json中声明一个`sideEffects`字段来表明npm包或者项目内的模块是否有副作用

为什么用声明式，而不是通过程序流程判断的方式，原因是声明式更简单，也有效，将项目与包是否有副作用的控制权交个项目或者包的开发着，而`webpack`在构建的时候只需要根据声明来判断怎么处理副作用，而不用通过复杂的程序分析流程去判断模块是否有副作用，这样可以大大减少构建时间

`webpack`把`sideEffects`当成一个优化项，通过`optimization.sideEffects`配置控制，该配置在`mode: production`模式下默认开启，只有`optimization.sideEffects: true`，声明在`package.json`内的`sideEffects` or `rule.sideEffects`字段才会生效

三种方式控制副作用

| 方式/范围 | 影响范围 | 优先级 |
| --- | --- | --- |
| 项目package.json sideEffects | 项目内模块，不包括npm包 | 低 |
| npm包package.json sideEffects | 当前npm包 | 低 |
| rule.sideEffects | 当前loader作用模块 | 高 |


看一个具体的例子
`big-module`与`big-module-with-flag`是两个npm包，代码内容一模一样，唯一不同的是`big-module-with-flag` `package.json`内有`"sideEffects": false`
![image.png](/static/images/yuque/1659191662687-249045c8-b8b7-4381-a982-56dea96f86f0.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=354&id=u6bff2c35&margin=%5Bobject%20Object%5D&name=image.png&originHeight=708&originWidth=3154&originalType=binary&ratio=1&rotation=0&showTitle=false&size=174809&status=done&style=none&taskId=u46c93349-75b4-4ba6-ace3-ab256ff3495&title=&width=1577)

app内有如下模块，且使用关系如下图所示
![image.png](/static/images/yuque/1659192347429-c8c07972-5e31-4f56-ba20-e1dd5f3b9902.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=890&id=u590a306a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1780&originWidth=3274&originalType=binary&ratio=1&rotation=0&showTitle=false&size=581098&status=done&style=none&taskId=u4b46ad96-f637-43ea-a2bb-ba966a9901b&title=&width=1637)

`mode: production`，项目`package.json` 不设置`sideEffects` 构建，不进行压缩，构建结果如下图所示
![image.png](/static/images/yuque/1659252870665-49f1497b-4ba9-4d32-b419-ccd640cc593a.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=847&id=u6ba96184&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1694&originWidth=2470&originalType=binary&ratio=1&rotation=0&showTitle=false&size=540545&status=done&style=none&taskId=u73e89638-d70f-42c2-9778-acd7c840af7&title=&width=1235)

`mode: production`，项目`package.json` 设置`sideEffects: false` 构建，不进行压缩，构建结果如下图所示
![image.png](/static/images/yuque/1659253111194-c91cbeac-9598-4a0f-8400-327a63d1bcf6.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=808&id=u6b492565&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1616&originWidth=2362&originalType=binary&ratio=1&rotation=0&showTitle=false&size=525026&status=done&style=none&taskId=u5ebc1ea1-7e05-4d4d-90ab-75a5a48120c&title=&width=1181)

从上面结果，我们可以得出如下结论

- `sideEffects:true`，模块的`export`没有一个被父模块使用，只要模块内有副作用，那么模块内所有代码就会被保留，比如`./no-used-effects.js`，`big-module/index.js``
- `sideEffects:false`，且模块不论是否有副作用代码，只要模块的`export`没有一个被父模块使用，则整个模块会被删除，比如`./no-used-effects.js`, `big-module-with-flag/index.js`
- `export`有没有被使用，是根据父模块导入的变量来进行判断，注意这里的判断是简单的通过引用关系判断，没有深入分析导入的变量是否被使用，比如`const newGetVersion = getVersion`这行代码，其实`newGetVersion`在app模块内是没有被使用的

到这里有几个疑问？

- `webpack`是怎么判断模块`export`的变量有没有被使用？
- `webpack`是怎么判断模块是否有副作用？
- `webpack`生成代码的时候是怎样排除无`export`被使用，且无副作用的模块？

下面以`webpack`(5.73.0)版本为案例，看下`webpack`内部是怎么实现的
<a name="bKwmX"></a>
## webpack usedExport 实现原理
`optimization.usedExport` 标记模块导出是否被使用，用于压缩插件直接去掉未使用的导出，具体输出如下所示

![image.png](/static/images/yuque/1659061393865-0f9ffc08-a220-4c2d-84e0-532f83ab518f.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=581&id=u87dd2747&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1162&originWidth=2566&originalType=binary&ratio=1&rotation=0&showTitle=false&size=365029&status=done&style=none&taskId=u2ab9f867-cb06-43a6-bf43-524e412ee32&title=&width=1283)

标记`export`是否被使用，在`FlagDependencyExportsPlugin`与`FlagDependencyUsagePlugin`插件内处理
```javascript
if (options.optimization.providedExports) {
  const FlagDependencyExportsPlugin = require("./FlagDependencyExportsPlugin");
  new FlagDependencyExportsPlugin().apply(compiler);
}
if (options.optimization.usedExports) {
  const FlagDependencyUsagePlugin = require("./FlagDependencyUsagePlugin");
  new FlagDependencyUsagePlugin(
    options.optimization.usedExports === "global"
  ).apply(compiler);
}
```

<a name="lZtKB"></a>
### FlagDependencyExportsPlugin插件
```javascript
// 在finishModules 钩子内处理，此时所有的模块已经全部转化成module实例
compilation.hooks.finishModules.tapAsync

let exportsInfo;
while (modules.length > 0) {
  // 通过module获取moduleGraphModule.exports对象
  exportsInfo = moduleGraph.getExportsInfo(module);
  
  // 获取module下原始的dependcy
  processDependenciesBlock(module);
  for (const [
    dep,
    exportsSpec
  ] of exportsSpecsFromDependencies) {
    // 将原始的dependcy转化成exportInfo,并将exportInfo设置到exportsInfo，便于后续usedExport的时候用到
    processExportsSpec(dep, exportsSpec);
  }
}

const processDependenciesBlock = depBlock => {
  // 遍历所有module的依赖项，比如index.js 引入 import {V8Engine} from './engine' 如下所示
  // [
  //   {
  //     request: "./engine",
  //     ids: [
  //       "V8Engine",
  //     ],
  //     name: "V8Engine",
  //   }
  // ]
  for (const dep of depBlock.dependencies) {
    processDependency(dep);   
  }
};

const processDependency = dep => {
  // 获取模块export的值
  const exportDesc = dep.getExports(moduleGraph);
  if (!exportDesc) return;
  exportsSpecsFromDependencies.set(dep, exportDesc);
};

const processExportsSpec = (dep, exportDesc) {
  // 如果name对应的exportInfo在exportsInfo上没有，则new ExportInfo，并设置到exportsInfo上
  const exportInfo = exportsInfo.getExportInfo(name);

}
```
`FlagDependencyExportsPlugin`插件内的主流程为：

1. 在`finishModules hook`内开始处理模块依赖，此时所有的模块都已经转换成对应的`Module`实例
1. 遍历所有的`Module`实例，通过`moduleGraph`获取`Module`实例的`exportsInfo`对象
1. 在`processDependenciesBlock`方法内遍历`Module.dependencies`，将`dependecy`存储到`exportsSpecsFromDependencies` `map`上
1. 继续遍历`exportsSpecsFromDependencies`，将`depenecy`转化成`exportInfo`，并存储在`exportsInfo`内
1. 整个流程结束，此时每个模块的`ModuleGraphModule.exports`上，已经保留了每个模块的`export`对象信息，用于下一步的判断模块内的`export`是否有被使用

![image.png](/static/images/yuque/1659254265224-e9042673-ee5a-4aad-91f9-04d3733c52cf.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=364&id=u561afcd8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=728&originWidth=1094&originalType=binary&ratio=1&rotation=0&showTitle=false&size=205920&status=done&style=none&taskId=u731fddac-5741-4c9d-9416-b2733c6b821&title=&width=547)
<a name="imqDC"></a>
### FlagDependencyUsagePlugin
```javascript
compilation.hooks.optimizeDependencies.tap

const queue = new TupleQueue();

// 从entry模块开始遍历，然后将entryModule推到queue队列
for of compilation.entries

// 将entrymodule推到queue队列
queue.enqueue(entrymodule, runtime);

// 从入口模块开始 遍历
while (queue.length) {
  const [module, runtime] = queue.dequeue();
  processModule(module, runtime, false);
}

// 获取模块的依赖项，即模块impport的依赖模块，然后进行遍历
for of block.dependencies

// 根据依赖然后从moduleGraph的_depenciesMap内获取到ModuleGraphConnection
// ModuleGraphConnection.module 获取当前模块信息，ModuleGraphConnection.originModule获取父模块信息
const connection = moduleGraph.getConnection(dep);

// HarmonyImportSideEffectDependency => false
// HarmonyImportSpecifierDependency => true
const activeState = connection.getActiveState(runtime);
if (activeState === false) continue;

// 根据depency实例获取对应的导出名称
const referencedExports = compilation.getDependencyReferencedExports(dep, runtime);

// 存储module与导出的exportInfo信息,这里的referencedExports就是当前模块内被使用的依赖模块的exportName
// {
  module => {
    exportName: [exportName]
  }
}
// 比如index.js import A from './a'; import B from './b'; console.log(A)
// 那么 module 则是a.js 对应的referencedExports{"A" => [A]}
map.set(module, referencedExports);


// 然后遍历map对象
for (const [module, referencedExports] of map) {
  processReferencedModule(
      module,
      Array.from(referencedExports.values()),
      runtime,
      forceSideEffects
  );
}

// 在processReferencedModule方法内，通过moduleGraph与module获取当前module的所有exportsInfo
const exportsInfo = moduleGraph.getExportsInfo(module);

// 遍历在父模块内使用的export
for of usedExports

const UsageState: Readonly<{
    Unused: 0;
    OnlyPropertiesUsed: 1;
    NoInfo: 2;
    Unknown: 3;
    Used: 4;
}>

// 然后将当前模块的exportInfo设置成Used
exportInfo.setUsedConditionally(
  v => v !== UsageState.Used,
  UsageState.Used,
  runtime
)

// 设置成功之后会在_useInRuntime添加状态
exportInfo._useInRuntime = new Map({0: {app => 4}})

// 让后再将当前子模块推到queue，继续根据当前子模块内使用的dependy转化成包含子子模块的模块与，子模块使用了的referencedExports map对象
queue.enqueue(currentModule, runtime);
```
`FlagDependencyUsagePlugin`插件的主流程为：

1. 在`optimizeDependencies hook`内开始处理，注意这个`hook`在`finnishModules hook`之后
1. 从入口模块开始遍历，遍历入口模块的`dependencies`（注意这里模块在生成`dependencies`的时候，就已经过滤了未使用的导入变量）
1. 根据`dependecy`获取`ModuleGraphConnection`，然后通过`ModuleGraphConnection.getActiveState`判断当前模块是否有副作用，如果无副作用直接过滤
1. 然后通过`getDependencyReferencedExports`方法获取当前模块使用了的子应用的`export`变量，并将子模块与`referencedExports`存储在一个`map`对象
1. 然后遍历`map`对象，通过父模块内已使用的`export`对象，与子模块的`exportsInfo`对象，判断子模块的`export`是否被父模块使用，如果被父模块使用，则将子模块对应的`exportInfo._useInRuntime`进行标记，用于最终生成代码时的判断，然后将当前子模块推入到队列，重复上述步骤，直到所有的子模块的`export`都判断完成

![image.png](/static/images/yuque/1659255263778-e660558c-66cc-4f26-8974-a48849d70f06.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=369&id=u461e77a0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=738&originWidth=1108&originalType=binary&ratio=1&rotation=0&showTitle=false&size=166570&status=done&style=none&taskId=ufd06dd15-34d6-45d9-b9f6-f20027248a8&title=&width=554)

```javascript
generate

// 生成代码的时候，会调用每个模块的sourceModule方法生成模块代码
this.sourceModule(module, initFragments, source, generateContext);

// 遍历模块依赖，生成依赖项代码
for (const dependency of module.dependencies) {
  this.sourceDependency(
    module,
    dependency,
    initFragments,
    source,
    generateContext
  );
}

const template = generateContext.dependencyTemplates.get(constructor);

template.apply(dependency, source, templateContext);

const used = moduleGraph
  .getExportsInfo(module) // 获取ModuleGraphModule.exports
  .getUsedName(dep.name, runtime); // 回去ExportsInfo._exports._usedInRuntime 在FlagDependencyUsagePlugin插件内如果有使用则有值

if (!used) {
  const set = new Set();
  set.add(dep.name || "namespace");
  initFragments.push(
    new HarmonyExportInitFragment(module.exportsArgument, undefined, set)
  );
  return;
}

const map = new Map();
map.set(used, `/* binding */ ${dep.id}`);
initFragments.push(
  new HarmonyExportInitFragment(module.exportsArgument, map, undefined)
);

InitFragment.addToSource(source, initFragments, generateContext);

concatSource.add(fragment.getContent(context));

const unusedPart =
      this.unusedExports.size > 1
      ? `/* unused harmony exports ${joinIterableWithComma(
        this.unusedExports
      )} */\n`
      : this.unusedExports.size > 0
      ? `/* unused harmony export ${first(this.unusedExports)} */\n`
      : "";
const definitions = [];
const orderedExportMap = Array.from(this.exportMap).sort(([a], [b]) =>
                                                         a < b ? -1 : 1
                                                        );
for (const [key, value] of orderedExportMap) {
  definitions.push(
    `\n/* harmony export */   ${JSON.stringify(
      key
    )}: ${runtimeTemplate.returningFunction(value)}`
  );
}
const definePart =
      this.exportMap.size > 0
? `/* harmony export */ ${RuntimeGlobals.definePropertyGetters}(${
this.exportsArgument
}, {${definitions.join(",")}\n/* harmony export */ });\n`
: "";
return `${definePart}${unusedPart}`;
```
代码最终生成时的主流程为：

1. 在`sourceModule`方法内遍历`module.dependencies`
1. 在`sourceDependency`方法内`moduleGraph.getExportsInfo(module).getUsedName(dep.name, runtime);`通过`ModuleGraphModule.exports `对应 `exportInfo._usedInRuntime`进行判断当前模块`export`是否被使用

![image.png](/static/images/yuque/1659083788619-e8f50d44-0550-479d-a4e5-b593d695ccf0.png#clientId=u17f4d2aa-d639-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=201&id=uc1a4d04e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=402&originWidth=1938&originalType=binary&ratio=1&rotation=0&showTitle=false&size=149842&status=done&style=none&taskId=u2e2f44fc-3223-48d3-8fd0-174466238a6&title=&width=969)
<a name="hjxBI"></a>
## webpack sideEffect 实现原理
副作用的处理在`SideEffectsFlagPlugin`插件内
```javascript
if (options.optimization.sideEffects) {
  const SideEffectsFlagPlugin = require("./optimize/SideEffectsFlagPlugin");
  new SideEffectsFlagPlugin(
    options.optimization.sideEffects === true
  ).apply(compiler);
}
```

```javascript
compiler.hooks.compilation.tap
  normalModuleFactory.hooks.module.tap
    const sideEffects = resolveData.descriptionFileData.sideEffects;
    module.factoryMeta.sideEffectFree = !sideEffects;

  normalModuleFactory.hooks.parser.for('javascript/auto').tap
    parser.hooks.program.tap("SideEffectsFlagPlugin", () => {
      sideEffectsStatement = undefined;
    });
    parser.hooks.statement.tap(
      { name: "SideEffectsFlagPlugin", stage: -100 },
      statement => {
        if (sideEffectsStatement) return;
        if (parser.scope.topLevelScope !== true) return;
        switch (statement.type) {
          case "ExpressionStatement":
            if (
              !parser.isPure(statement.expression, statement.range[0])
            ) {
              sideEffectsStatement = statement;
            }
            break;
          case "VariableDeclaration":
          case "ClassDeclaration":
          case "FunctionDeclaration":
            if (!parser.isPure(statement, statement.range[0])) {
              sideEffectsStatement = statement;
            }
            break;
          default:
            sideEffectsStatement = statement;
            break;
        }
      }
    );
    parser.hooks.finish.tap("SideEffectsFlagPlugin", () => {
      if (sideEffectsStatement === undefined) {
        parser.state.module.buildMeta.sideEffectFree = true;
      } else {
        const { loc, type } = sideEffectsStatement;
        moduleGraph
          .getOptimizationBailout(parser.state.module)
          .push(
          () =>
          `Statement (${type}) with side effects in source code at ${formatLocation(
            loc
          )}`
        );
      }
    });
```
`SideEffectsFlagPlugin`插件的主流程为：

1. 在`normalModuleFactory module hook`内进行模块副作用标记，这时候`Module`实例刚创建
1. `package.json sideEffects: false`，对用的模块`factoryMeta.sideEffectFree = true`
1. 然后又在`normalModuleFactory parse hook`内针对不同的语句，来判断当前模块是否有副作用，如果当前模块没有副作用，则`buildMeta.sideEffectFree=true`，否则将有副作用的语句，存储到`module.Bailout`属性内，便于输出日志
1. 整个插件的作用就是给模块添加对应是否有副作用的属性标记，为生成模块及比较模块做准备

后面生成`chunk`的时候，会根据`factoryMeta.sideEffectFree` or `buildMeta.sideEffectFree`标记决定当前`chunk`是否需要包含该`module`，最终达到tree shaking效果
```javascript
// 构建chunkGraph
buildChunkGraph

// 根据entry module提取依赖module
extractBlockModules

// 根据当前模块的outgoingConnections获取到当前模块的依赖，并遍历这些依赖
for of moduleGraph.getOutgoingConnections(module)

// 获取当前module的状态
const state = connection.getActiveState(runtime);

// 调用当前模块的getSideEffectsConnectionState获取当前模块状态
refModule.getSideEffectsConnectionState(moduleGraph);

getSideEffectsConnectionState(moduleGraph) {
  // 如果设置了sideEffects: false 这里的this.factoryMeta.sideEffectFree=true
  if (this.factoryMeta !== undefined) {
    if (this.factoryMeta.sideEffectFree) return false;
    if (this.factoryMeta.sideEffectFree === false) return true;
  }
  
  // 如果没有设置sideEffects,则通过sideEffects插件在webpack解析ast的过程，如果判定模块没有副作用this.buildMeta.sideEffectFree=true
  if (this.buildMeta !== undefined && this.buildMeta.sideEffectFree) {
    if (this._isEvaluatingSideEffects)
      return ModuleGraphConnection.CIRCULAR_CONNECTION;
    this._isEvaluatingSideEffects = true;
    /** @type {ConnectionState} */
    let current = false;
    for (const dep of this.dependencies) {
      const state = dep.getModuleEvaluationSideEffectsState(moduleGraph);
      if (state === true) {
        this._isEvaluatingSideEffects = false;
        return true;
      } else if (state !== ModuleGraphConnection.CIRCULAR_CONNECTION) {
        current = ModuleGraphConnection.addConnectionStates(current, state);
      }
    }
    this._isEvaluatingSideEffects = false;
    // When caching is implemented here, make sure to not cache when
    // at least one circular connection was in the loop above
    return current;
  } else {
    // 其它情况，需要包含当前module
    return true;
  }
}


// 如果模块状态为false，则该模块不会被包含进当前chunk
if (state === false) continue;
```
生成`chunk`时过滤模块的主流程为：

1. 从`entry`模块开始遍历，通过`moduleGraph.getOutgoingConnections`获取`entry`模块导入的子模块
1. 然后遍历`OutgoingConnections`，通过`getActiveState`方法判断当前模块是否有副作用
1. 如果子模块的导出没有被父模块使用，且子模块标记当前子模块是无副作用模块，那么子模块不会被打进当前`chunk`
1. 所以最终模块是否被包含，是在生成`chunk`的阶段来进行判断

在回过头来看之前的几个疑问？

- `webpack`是怎么判断模块`export`的变量有没有被使用？
   - 答：是通过父模块的已使用的导入变量，深入到模块模块内进行判断当前子模块哪些的`export`被使用
- `webpack`是怎么判断模块是否有副作用？
   - 答：是直接通过`package.json`内的`sideEffects`标识，以及`webpack`在解析代码成`ast`的过程中判断模块是否有副作用的
- `webpack`生成代码的时候是怎样排除无`export`被使用，且无副作用的模块？
   - 答：是在生成`chunk`的时候，通过判断当前的副作用标识来决定当前模块是否要保留
<a name="nhURa"></a>
## 压缩插件
<a name="C5cdl"></a>
### Uglify-js 压缩扛霸子

最早的`uglify`，仅支持`es5`语法，不支持新的es6+语法，所以在`uglify`的基础上出了一个`uglify-es`，后面又丢弃了`uglify-es`，并重新回到`uglify-js`，现在的uglify3.x是支持直接压缩es6+语法的

为什么会有这么一个过程，原因是`uglify`缺少维护者，导致对es6+语法的支持不够，直到现在又重新维护，所以我们在使用`webpack`压缩代码的时候，会经历过使用`uglify`压缩，然后又是`uglify-es`压缩，现在又是`terser`进行压缩
<a name="s5snI"></a>
### Terser webpack内置压缩工具
`terser`是从uglify3.x fork过来之后单独维护的压缩工具，为什么会fork过来，还是因为当时的`uglify-es`没有长期维护着，经常有一些bug没有修复，所以就fork了一份，单独维护

所以`terser`的api与unglify3.x版本的api几乎一致
<a name="oPrjg"></a>
#### terser-webpack-plugin
`terser-webpack-plugin`插件已经被`webpack5`内置，开箱即用

`terser-webpack-plugin`封装了多种压缩工具

- terser
- uglify
- esbuild
- swc

我们在项目使用的时候可以根据项目灵活选择压缩工具，以便提升压缩速度
```javascript
const buildTerserOptions = (terserOptions = {}) => {
    // Need deep copy objects to avoid https://github.com/terser/terser/issues/366
    return {
      ...terserOptions,
      compress:
        typeof terserOptions.compress === "boolean"
          ? terserOptions.compress
          : { ...terserOptions.compress },
      // ecma: terserOptions.ecma,
      // ie8: terserOptions.ie8,
      // keep_classnames: terserOptions.keep_classnames,
      // keep_fnames: terserOptions.keep_fnames,
      mangle:
        terserOptions.mangle == null
          ? true
          : typeof terserOptions.mangle === "boolean"
          ? terserOptions.mangle
          : { ...terserOptions.mangle },
      // module: terserOptions.module,
      // nameCache: { ...terserOptions.toplevel },
      // the `output` option is deprecated
      ...(terserOptions.format
        ? { format: { beautify: false, ...terserOptions.format } }
        : { output: { beautify: false, ...terserOptions.output } }),
      parse: { ...terserOptions.parse },
      // safari10: terserOptions.safari10,
      // Ignoring sourceMap from options
      // eslint-disable-next-line no-undefined
      sourceMap: undefined,
      // toplevel: terserOptions.toplevel
    };
  };

const { minify } = require("terser");
// Copy `terser` options
const terserOptions = buildTerserOptions(minimizerOptions);
const result = await minify({ [filename]: code }, terserOptions);
```

```javascript
 const buildUglifyJsOptions = (uglifyJsOptions = {}) => {
    // eslint-disable-next-line no-param-reassign
    delete minimizerOptions.ecma;
    // eslint-disable-next-line no-param-reassign
    delete minimizerOptions.module;

    // Need deep copy objects to avoid https://github.com/terser/terser/issues/366
    return {
      ...uglifyJsOptions,
      // warnings: uglifyJsOptions.warnings,
      parse: { ...uglifyJsOptions.parse },
      compress:
        typeof uglifyJsOptions.compress === "boolean"
          ? uglifyJsOptions.compress
          : { ...uglifyJsOptions.compress },
      mangle:
        uglifyJsOptions.mangle == null
          ? true
          : typeof uglifyJsOptions.mangle === "boolean"
          ? uglifyJsOptions.mangle
          : { ...uglifyJsOptions.mangle },
      output: { beautify: false, ...uglifyJsOptions.output },
      // Ignoring sourceMap from options
      // eslint-disable-next-line no-undefined
      sourceMap: undefined,
      // toplevel: uglifyJsOptions.toplevel
      // nameCache: { ...uglifyJsOptions.toplevel },
      // ie8: uglifyJsOptions.ie8,
      // keep_fnames: uglifyJsOptions.keep_fnames,
    };
  };
const { minify } = require("uglify-js");

// Copy `uglify-js` options
const uglifyJsOptions = buildUglifyJsOptions(minimizerOptions);
const result = await minify({ [filename]: code }, uglifyJsOptions);
```

<a name="takbV"></a>
#### 关键compress参数

- dead_code
- drop_console
- drop_debugger
- pure_funcs
- pure_getters
- side_effects
- unused

<a name="mCsEh"></a>
##### dead_code
```javascript
function fn() {
  return 1;
  const a = 'a'; // dead_code
  for () {}
}
```
<a name="s6mst"></a>
##### unused
```javascript
function f(x, y) {
  function g() { // unused
    something();
  }
  return x + y;
}
```
<a name="wFlRH"></a>
# 最佳实践
虽然`webpack4`及以上在`webpack2`的基础上添加了`sideEffects`标识来帮助tree shaking，但是受限于js的灵活性与模块的复杂性，还是有很多没有解决的副作用场景，使得最终的tree shaking效果不够完美，所以要想更好的tree shaking效果，我们可以人为的使用一些手段去提高tree shaking的效果

<a name="ZCB6C"></a>
## 配置mainFields优先级
```javascript
module.exports = {
  //...
  resolve: {
    // module推荐放到main前面，因为大部分npm包提供了es module模块，而es module入口约定通过module字段暴露
    mainFields: ['browser', 'module', 'main'],
  },
};
```
<a name="Esj63"></a>
## 禁止babel转换模块语法
```javascript
// babel.config.js

module.exports = {
  "presets": [
    ["@babel/preset-env", {
      "loose": true,
      "modules": false // 配置成false or auto，避免babel将模块转化成commonjs模块
    }]
  ]
}
```

<a name="qk0RH"></a>
## 使用自带tree shaking的包
比如使用`lodash-es`替换`lodash`等
不过并不是所有的npm包都还有tree shaking的优化空间，比如`vue`、`react`等提供的`min`版本已经是最小功能集的版本

<a name="EBXrW"></a>
## 避免无意义的赋值
```javascript
import { getVersion } from './used-no-sideEffect';

const newGetversion = getVersion
```
从之前的例子可以看到，`webpack`判断模块的`export`是否被使用，只是简单的判断了是否有引用关系，没有进行程序流程分析，所以这就导致了明明可以被摇树的包，最终还保留了下来
<a name="FIYit"></a>
## 优化导出方式
`webpack`的tree shaking依赖的是模块的`export`，所以下面这样的导出方式,虽然只使用了一个，但最终都会被保留下来
```javascript
export default {
    bar: 'bar',
    foo: 'foo'
}
```
所以实际开发中，应该尽量保持导出值颗粒度和原子性，上例代码的优化版本
```javascript
const bar = 'bar'
const foo = 'foo'

export {
    bar,
    foo
}
```
<a name="HS5Il"></a>
## npm包配置sideEffects
如果npm不是用于`polyfill`，可以大胆的在`package.json`内设置`"sideEffects": false`
```javascript
{
  "name": "awesome npm module",
  "version": "1.0.0",
  "sideEffects": false
}
```

如果包内有些模块确定是有副作用，可以设置数组形式，以`@abc/yked`为例
```javascript
{
  "name": "@abc/yked",
  "version": "2.5.6",
  "description": "租户后台公用组件库",
  "main": "lib/index.js",
  "module": "es/index.js",
  "types": "lib/index.d.ts",
  "sideEffects": [
    "lib/index.js",
    "es/index.js",
    "*.less"
  ]
}
```

```javascript
// index.js
import { initHotIconfont } from '@abc/yk-hot-iconfont';
import { setDomainUrl } from './utils/set-domain-url';

// 设置使用方a标签跳转带有token和mini_app_id
setDomainUrl();

// 初始化热更新iconfont
initHotIconfont({
  pid: [48757, 83033, 84450], // 项目pid
  fileType: 'css', // 'js' | 'css' 引入的文件类型
});

export * from './components';
export * from './decorator';
```
该npm包内`.less`与`index.js`文件是有副作用的，这些副作用需要保留，其它模块都是可以认为没有副作用的

如果包确实是有副作用的，那么久不需要设置了，不设置就默认`sideEffects: true`
<a name="sngAe"></a>
### 已添加sideEffects的npm包

- [vue](https://github.com/vuejs/vue/blob/main/package.json#L36)
- [three.js](https://github.com/mrdoob/three.js/blob/dev/package.json#L21)
- [lodash](https://github.com/lodash/lodash/blob/master/package.json#L10)
- [ant-design-mobile](https://github.com/ant-design/ant-design-mobile/blob/master/package.json#L131)
- [ramda](https://github.com/ramda/ramda/blob/master/package.json#L40)
- [rxjs](https://github.com/ReactiveX/rxjs/blob/master/package.json#L16)

等等还有很多现在使用量非常大的包
<a name="ATNW5"></a>
## 新项目配置sideEffects
其实对于一个项目的组成，主要由两部分组成，一部分是自己写的代码，一部分是第三方npm包，所以对项目配置`sideEffects`也可以
如果是新项目推荐如下配置
```javascript
{
  "name": "app",
  "version": "1.0.0",
  "sideEffects": [
    '*.css',
    'run.js' // 添加需要保留副作用的模块
  ]
}
```

如果是旧项目不推荐在`package.json`内设置`sideEffects`字段

如果想要给第三方npm包添加无副作用标识，可以通过自己写一个插件，针对需要的模块设置副作用的值
```javascript
module.exports = class AddSideEffectsPlugin {
  constructor({
    includePackages = [], // 传入需要处理的npm package name
  } = {}) {
    this.includePackages = includePackages;
  }
  apply(compiler /*: any */) {
    const name = this.constructor.name;
    const { context } = compiler;
    compiler.hooks.normalModuleFactory.tap(name, normalModuleFactory => {
      normalModuleFactory.hooks.module.tap(name, (module, data) => {
        const resolveData = data.resourceResolveData;
        
        // 如果npm包没有设置sideEffects，且满足includePackages，就设置sideEffectFree: true,表示该模块是纯的
        if (
          this.includePackages.some((item) => data.resource.include(item)),
          resolveData &&
          resolveData.descriptionFileData &&
          resolveData.descriptionFileData.sideEffects === void 0
        ) {
          module.factoryMeta.sideEffectFree = true;
        }
      });
    });
  }
};
```

<a name="Eq5ZO"></a>
# 总结
`webpack4`及以上的tree shaking包含两部分

- `webpack`标记`unused`，然后由压缩插件`terser`等直接删除未使用的这部分代码(可以配置压缩插件参数不删除)
- `webpack` `sideEffects`是模块级别，根据模块的`export`变量是否使用来判断模块是否需要保留

`sideEffects: false` 标记的作用就是告诉`webpack` 当前项目 or `npm`包内的模块是没有副作用的，就是有副作用，也当成没有副作用处理


参考链接
[Everything you never wanted to know about side effects](https://sgom.es/posts/2020-06-15-everything-you-never-wanted-to-know-about-side-effects/)
[What Does Webpack 4 Expect From A Package With sideEffects: false](https://stackoverflow.com/questions/49160752/what-does-webpack-4-expect-from-a-package-with-sideeffects-false)
[Tree Shaking](https://webpack.js.org/guides/tree-shaking/#root)
[你的Tree-Shaking并没什么卵用](https://github.com/wuomzfx/tree-shaking-test)
[Tree-Shaking性能优化实践 - 原理篇](https://juejin.cn/post/6844903544756109319)
