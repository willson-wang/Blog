---
  title: 深入理解babel生态
  date: 2019-08-25T14:21:06Z
  lastmod: 2023-03-26T09:17:22Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/babel.jpeg']
  bibliography: references-data.bib
---

# 目录

1. babel是什么
2. babel的使用方式
3. babel的处理流程
4. babel的架构
5. babel插件执行顺序
6. 深入理解babel6.x插件
7. 深入理解babel7.x插件
8. 访问者模式
9. 怎样写一个babel插件
10. babel推荐配置
11. 总结

### 1. babel是什么

babel是一个javascript编译器，一个可以将现代ECMAScript 2015+代码转化为旧版浏览器或node环境中运行的JavaScript代码的工具。

#### babel的诞生

Babel 的前身是 6to5 这个库， 6to5的作者是Facebook 的澳大利亚的工程师 [Sebastian McKenzie](https://twitter.com/sebmck?lang=zh-cn), 6to5 是 2014 年 发布的，主要功能是 就是 ES6 转成 ES5 , 它使用 转换AST的引擎不是自己写的 ，fork了 一个更古老的库 acorn ,在2015年 1月份 6to5 和 Esnext 库(这个是 Ember cli 用的，Ember也是一个很出名的框架,国内用的人比较少)的团队决定一起开发 6to5,并改名为 Babel ,解析引擎改名为 Babylon ,再后来  Babylon 移入 到 @babel/parser


至于6to5改名的原因是因为：团队一致认为 6to5 这个名字并没有正确传达出团队的目标。后来 ES6 被重命名为 ECMAScript 2015 更是雪上加霜。为了消除关于 6to5 未来的担忧和闲言碎语，团队决定将它 重命名为 Babel 。

至于改名babel的原因是因为：团队和社区围绕着可能的名称进行了[一番讨论](https://github.com/babel/babel/issues/596)，最终决定使用 Babel 这个名称。Babel 一词来源于道格拉斯·亚当斯（Douglas Adams）所著的《银河系漫游指南》里的 [巴别鱼（BabelFish）](https://en.wikipedia.org/wiki/List_of_races_and_species_in_The_Hitchhiker%27s_Guide_to_the_Galaxy#Babel_fish)，它是一个能帮助人类理解任何语言的虚构物种，同时也恰好向 [巴别塔（Babel Tower)](https://en.wikipedia.org/wiki/Tower_of_Babel)的故事致敬，《创世纪》中正是巴别塔的坠落造就了各种各样的语言。

Babel fish

> "The Babel fish," said The Hitchhiker's Guide to the Galaxy quietly, "is small, yellow and leech-like, and probably the oddest thing in the Universe. It feeds on brainwave energy received not from its own carrier but from those around it. It absorbs all unconscious mental frequencies from this brainwave energy to nourish itself with. It then excretes into the mind of its carrier a telepathic matrix formed by combining the conscious thought frequencies with nerve signals picked up from the speech centres of the brain which has supplied them. The practical upshot of all this is that if you stick a Babel fish in your ear you can instantly understand anything in any form of language. The speech patterns you actually hear decode the brainwave matrix which has been fed into your mind by your Babel fish.

#### babel版本发布时间

- 2015-02-15，6to5重命名为babel
- 2015-03-31，babel 5.0发布
- 2015-10-30，babel 6.0发布
- 2018-08-27, babel 7.0发布

### 2. babel的使用方式

<h4>babel6.x</h4>

```
.babelrc

yarn add babel-core babel-preset-env babel-plugin-transform-runtime babel-cli --dev
yarn add babel-runtime
{
  "presets": [
    [
      "env",
      {
        "targets": {
          "browsers": "ie >= 9",
          "node": "6.1.0",
        },
        "modules": false,
        "debug": true,
        "include": [],
        "exclude": [],
        "useBuiltIns": true,
      }
    ]
  ],
  "plugins": [
    [
      "transform-runtime",
      {
        "polyfill": true,
        "helpers": true,
        "regenerator": true,
        "useESModules": false
      }
    ]
  ]
}
```

<h4>babel7.x</h4>

```
.babelrc

yarn add @babel/core @babel/preset-env @babel/plugin-transform-runtime @babel/cli --dev
yarn add @babel/runtime

.babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "useBuiltIns": "usage"
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 2
      }
    ]
  ]
}
```
看似很简单的配置，然而我们经常会迷失在babel的各种插件及配置上，所以为了更好的使用，便需要深入了解常用插件的作用，及产生的原因,然后进行总结(总结的时候以babel7版本为主，同时也包含了一部分babel6的内容)

### 3. babel的处理流程

![image](https://user-images.githubusercontent.com/20950813/67635484-dfb5df80-f902-11e9-95d0-07ea1f151c2b.png)

上图是babel的处理流程，如果了解编译原理的话，应该一眼就能看出来就是简单编译器的流程

首先从源码解析（parsing）开始,解析包含了两个步骤，词法分析及语法分析

词法分析(Lexical Analysis)，就是借助词法分析器将字符串形式的代码转化为Tokens令牌，Tokens可视作是一些语法片段的组成的数组，如`function add(a, b) {return a + b}`词法分析后的结果如下图所示

![image](https://user-images.githubusercontent.com/20950813/67635509-38857800-f903-11e9-9ea3-4d8477663f5e.png)


语法解析(Syntactic Analysis)：这个阶段语法解析器(Parser)会把Tokens转换为抽象语法树(Abstract Syntax Tree，AST)，如下图所示，如果不了解AST可以查看[JavaScript中的AST](https://github.com/willson-wang/Blog/issues/69)

![image](https://user-images.githubusercontent.com/20950813/67635524-5f43ae80-f903-11e9-9b97-04c12fffb965.png)

AST是babel转译的核心数据，后续的操作都依赖于AST

接着就是tranform(转化操作)，转化的过程中会对整个AST进行遍历，在这个过程中通过Visitor(访问者)模式对节点进行增删改查。babel所有的插件都在这个阶段工作，比如语法转化、工具函数等等

最后就是Generator（代码生成），生成阶段将AST转换回字符串形式的javascript;同时生成soucemap

### 4. babel的架构模式

通过我们日常使用babel的过程中，我们发现，我们基本都是在与插件及插件的配置打交到，不同的功能使用不同的插件来完成目的，各个插件之前互相独立，却又依赖与babel，那么这是不是就是一种架构模式呢？是的，这就是一种架构模式，叫做微内核架构。

微核架构（microkernel architecture）又称为"插件架构"（plug-in architecture），指的是软件的内核相对较小，主要功能和业务逻辑都通过插件实现

内核（core）通常只包含系统运行的最小功能。插件则是互相独立的，插件之间的通信，应该减少到最低，避免出现互相依赖的问题。如下图所示

![image](https://user-images.githubusercontent.com/20950813/67635569-b8abdd80-f903-11e9-9a53-37c623b4875f.png)

优点
    良好的功能延伸性（extensibility），需要什么功能，开发一个插件即可
    功能之间是隔离的，插件可以独立的加载和卸载，使得它比较容易部署，
    可定制性高，适应不同的开发需要
    可以渐进式地开发，逐步增加功能

缺点
    扩展性（scalability）差，内核通常是一个独立单元，不容易做成分布式
    开发难度相对较高，因为涉及到插件与内核的通信，以及内部的插件登记机制

前端领域比较典型的例子有webpack、babel、eslint、postCss等

然后我们在回过头来看babel

<h4>babel核心</h4>

@babel/core 这也是上面说的‘微内核’架构中的‘内核’。对于Babel来说，这个内核主要干这些事情：

- 加载和处理配置(config)
- 加载插件
- 调用 Parser 进行语法解析，生成 AST
- 调用 Traverser 遍历AST，并使用访问者模式应用'插件'对 AST 进行转换
- 生成代码，包括SourceMap转换和源代码生成

我们看下@babel/core的package.json

```
"dependencies": {
    "@babel/generator": "^7.6.4",
    "@babel/helpers": "^7.6.2",
    "@babel/parser": "^7.6.4",
    "@babel/template": "^7.6.0",
    "@babel/traverse": "^7.6.3",
    "@babel/types": "^7.6.3",
},
```

<h4>babel核心周边支撑</h4>

@babel/parser javascript解析器，提供生成AST的方法，fork于acron；它已经内置支持很多语法. 例如 JSX、Typescript、Flow、以及最新的ECMAScript规范。目前为了执行效率，parser是不支持扩展的，由官方进行维护。如果你要支持自定义语法，可以 fork 它，不过这种场景非常少。

@babel/traverse 实现了访问者模式，对 AST 进行遍历，转换插件会通过它获取感兴趣的AST节点，对节点继续操作, 下文会详细介绍访问器模式。

@babel/generator 将 AST 转换为源代码，支持 SourceMap

一个完整的解析流程

```
demo1.js

const babel =  require("@babel/core");
const generate = require('@babel/generator').default;

const code = `function square(n) {
    return n * n;
}`;

const ast = babel.parse(code);

babel.traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      path.node.name = "x";
    }
  }
});

const output = generate(ast, { /* options */ }, code);

console.log('output', output.code)
```

```
demo2.js

const parser =  require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require('@babel/generator').default;

const code = `function square(n) {
    return n * n;
}`;

const ast = parser.parse(code);

traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      path.node.name = "x";
    }
  }
});

const output = generate(ast, { /* options */ }, code);

console.log('output', output.code)

// output function square(x) {
//  return x * x;
// }
```

<h4>babel插件</h4>

babel的插件分为两类

Syntax Plugins (语法插件)这些插件只允许Babel解析特定类型的语法（不做代码转化）、转换插件自动启用语法插件。因此，如果已经使用了相应的转换插件，则无需指定语法插件；语法插件的命名(@babel/plugin-syntax-*)：上面说了 @babel/parser 已经支持了很多 JavaScript 语法特性，Parser也不支持扩展. 因此plugin-syntax-*实际上只是用于开启或者配置Parser的某个功能特性。

一般用户不需要关心这个，Transform 插件里面已经包含了相关的plugin-syntax-*插件了。用户也可以通过parserOpts配置项来直接配置 Parser

```
{
  "parserOpts": {
    "plugins": ["jsx", "flow"]
  }
}
```

Transform Plugins (转化插件)用于对 AST 进行转换, 实现转换为ES5代码、压缩、功能增强等目的. Babel仓库将转换插件划分为两种(只是命名上的区别)：

@babel/plugin-transform-*： 普通的转换插件
@babel/plugin-proposal-*： 还在'提议阶段'(非正式)的语言特性, 目前有[这些](https://babeljs.io/docs/en/next/plugins#experimental)

特殊的插件-预设插件(@babel/presets-*)： 插件集合或者分组，主要方便用户对插件进行管理和使用。比如preset-env含括所有的标准的最新特性; 再比如preset-react含括所有react相关的插件

<h4>babel插件开发辅助</h4>

@babel/template： 某些场景直接操作AST太麻烦，就比如我们直接操作DOM一样，所以Babel实现了这么一个简单的模板引擎，可以将字符串代码转换为AST。比如在生成一些辅助代码(helper)时会用到这个库

@babel/types： AST 节点构造器和断言. 插件开发时使用很频繁

@babel/helper-*： 一些辅助器，用于辅助插件开发，例如简化AST操作

@babel/helper： 辅助代码，单纯的语法转换可能无法让代码运行起来，比如低版本浏览器无法识别class关键字，这时候需要添加辅助代码，对class进行模拟。

<h4>babel工具</h4>

@babel/node： Node.js CLI, 通过它直接运行需要 Babel 处理的JavaScript文件

@babel/register： Patch NodeJs 的require方法，支持导入需要Babel处理的JavaScript模块

@babel/cli： CLI工具

### 4. babel插件执行顺序

在第三步中我们已经知道了哪些是babel的核心，哪些是babel的辅助工具，哪些是插件，我们现在就需要了解这些插件是怎样被调用的

<h4>常用的babel核心库及插件名称</h4>

babel7.x    | babel6.x
-----       | -----
@babel/core | babel-core
@babel/cli  | babel-cli
@babel/preset-env | babel-preset-env
@babel/plugin-transform-runtime | babel-plugin-transform-runtime
@babel/polyfill (7.4.0版本已被废弃),使用"core-js", "regenerator-runtime/runtime"来进行替换 | babel-polyfill;
@babel/runtime | babel-runtime

<h4>插件的引入的方式</h4>

```
// 可以是不带路径的方式，自动在node_modules内查找
{
  "plugins": ["babel-plugin-myPlugin"]
}

// 也可以使用相对or绝对路径
{
  "plugins": ["./node_modules/asdf/plugin"]
}
```

同时也可以使用插件速写来引入

```
// babel-plugin-xxx 的插件都可以省略babel-plugin-
{
  "plugins": [
    "myPlugin",
    "babel-plugin-myPlugin" // equivalent
  ]
}
```

<h4>插件执行的顺序</h4>

1. Plugins run before Presets  Plugins插件顺序在Presets插件顺序之前执行
2. Plugin ordering is first to last. // Plugins插件从左至右依次执行
3. Preset ordering is reversed (last to first) //Presets插件从右至走依次执行

```
{
  "presets": ["es2015", "react", "stage-2"],
  "plugins": ["transform-decorators-legacy", "transform-class-properties"]
}
```

插件的执行顺序是transform-decorators-legacy => transform-class-properties => stage-2 => react => es2015

所以我们在引入插件的时候一定要注意引入的插件是否有依赖关系

插件的传参格式，一般有以下几种

```
{
  "plugins": ["pluginA", ["pluginA"], ["pluginA", {}]]
}

// presets 与plugins传参方式是一致的
{
  "plugins": [
    [
      "transform-async-to-module-method",
      {
        "module": "bluebird",
        "method": "coroutine"
      }
    ]
  ]
}

```

<h4>常用的预设插件</h4>

@babel/preset-env
@babel/preset-flow
@babel/preset-react
@babel/preset-typescript

预设插件的作用的避免我们花费时间在寻找插件上，它提供了一个封装好的插件列表，我们只需要引入一个预设插件即可；

已@babel/preset-react为例，我们只需要引入这一个预设，我们就可以直接在项目中使用jsx语法

<details>
    <summary>@babel/preset-react源码</summary>

```
import { declare } from "@babel/helper-plugin-utils";
import transformReactJSX from "@babel/plugin-transform-react-jsx";
import transformReactDisplayName from "@babel/plugin-transform-react-display-name";
import transformReactJSXSource from "@babel/plugin-transform-react-jsx-source";
import transformReactJSXSelf from "@babel/plugin-transform-react-jsx-self";

export default declare((api, opts) => {

    const pragma = opts.pragma || "React.createElement";
    const pragmaFrag = opts.pragmaFrag || "React.Fragment";
    const throwIfNamespace =
        opts.throwIfNamespace === undefined ? true : !!opts.throwIfNamespace;
    const development = !!opts.development;
    const useBuiltIns = !!opts.useBuiltIns;

    return {
        plugins: [
        [
            transformReactJSX,
            { pragma, pragmaFrag, throwIfNamespace, useBuiltIns },
        ],
        transformReactDisplayName,

        development && transformReactJSXSource,
        development && transformReactJSXSelf,
        ].filter(Boolean),
    };
});
// 其实就是一组插件的引用
```
</details>


<h4>创建一个Preset插件</h4>

```
// 同plugin的书写格式
module.exports = () => ({
  presets: [
    require("@babel/preset-env"),
  ],
  plugins: [
    [require("@babel/plugin-proposal-class-properties"), { loose: true }],
    require("@babel/plugin-proposal-object-rest-spread"),
  ],
});
```

Preset插件的缩写同Plugin缩写一样，区别就是预算的前缀是babel-preset-

```
{
  "presets": [
    "myPreset",
    "babel-preset-myPreset" // equivalent
  ]
}

{
  "presets": [
    "@org/babel-preset-name",
    "@org/name" // equivalent
  ]
}
```

当了解完babel的一些基本概念之后,我们已经知道插件的引入方式，插件的运行顺序，预设插件的作用；所以接下来我们将要详细了解主要插件；从6.x的版本看起，因为6.x到7.x语法上是没什么变化的，主要变化是插件的名称及部分插件的配置项，还有一些包的拆分、废弃、重命名

### 6. 深入理解babel6.x插件

<h4>babel-preset-es2015（env之后被废弃）</h4>

babel-preset-es2015预设包含一些es6语法解析的插件，如箭头函数、块级作用域、结构、默认参数等；

可配置参数loose（boolean）, defaults to false.  是否松散转化
modules："amd" | "umd" | "systemjs" | "commonjs" | false, defaults to "commonjs" 输出任何模块

```
.babelrc

{
    "presets": [
        [
            "es2015",
            {
                "modules": false,
                "loose": true
            }
        ]
    ]
}
```

```
// babel-preset-es2015源码，其实暴露的就是一组es6语法转化的插件
return {
  plugins: [
    [transformES2015TemplateLiterals, { loose, spec }],
    transformES2015Literals,
    transformES2015FunctionName,
    [transformES2015ArrowFunctions, { spec }],
    transformES2015BlockScopedFunctions,
    [transformES2015Classes, optsLoose],
    transformES2015ObjectSuper,
    transformES2015ShorthandProperties,
    transformES2015DuplicateKeys,
    [transformES2015ComputedProperties, optsLoose],
    [transformES2015ForOf, optsLoose],
    transformES2015StickyRegex,
    transformES2015UnicodeRegex,
    checkES2015Constants,
    [transformES2015Spread, optsLoose],
    transformES2015Parameters,
    [transformES2015Destructuring, optsLoose],
    transformES2015BlockScoping,
    transformES2015TypeofSymbol,
    modules === "commonjs" && [transformES2015ModulesCommonJS, optsLoose],
    modules === "systemjs" && [transformES2015ModulesSystemJS, optsLoose],
    modules === "amd" && [transformES2015ModulesAMD, optsLoose],
    modules === "umd" && [transformES2015ModulesUMD, optsLoose],
    [transformRegenerator, { async: false, asyncGenerators: false }]
  ].filter(Boolean) // filter out falsy values
};
```

```
In
var a = (b) => b;

Out
var a = function (b) {
  return b;
};
```

<h4>babel-preset-es2016（env之后被废弃）</h4>

babel-preset-es2016只包含一个幂运算操作符转化插件，没有可配置参数；注意不包含es2015预设

```
.babelrc

{
    "presets": [
        [
            "es2015"
        ],
        [
            "es2016"
        ]
    ]
}
```

```
plugins: [
  transformExponentiationOperator
]
```

<h4>babel-preset-es2017（env之后被废弃）</h4>

babel-preset-es2017只包含一个尾逗号转化及asycn语法转化插件，没有可配置参数；注意不包含es2015、es2016预设

```
.babelrc

{
    "presets": [
        "es2015",
        "es2016",
        "es2017",
    ]
}
```

```
plugins: [
  syntaxTrailingFunctionCommas,
  transformAsyncToGenerator
]
```

<h4>babel-preset-latest（env之后被废弃）</h4>

babel-preset-latest是包含babel-preset-es2015|babel-preset-es2016|babel-preset-es2017三个预设的集合，避免我们在使用中单个引入，可以通过参数控制是否需要加载对应的预设

```
{
    "presets": [
        [
            "latest",
            {
                "es2015": {
                    "modules": "amd"
                },
                "es2016": false,
                "es2017": false
            }
        ]
    ]
}
```

```
export default function (context, opts = {}) {
  return {
    presets: [
      opts.es2015 !== false && [presetES2015.buildPreset, opts.es2015],
      opts.es2016 !== false && presetES2016,
      opts.es2017 !== false && presetES2017
    ].filter(Boolean) // filter out falsy values
  };
}
```

<h4>babel-preset-stage-0</h4>

babel-preset-stage-0预设是包含当年想法阶段的语法转化插件及其它的1、2、3个阶段的预设，ECMASCRIPT语法具体发布流程如下所示

```
The TC39 categorizes proposals into the following stages:

Stage 0 - Strawman: just an idea, possible Babel plugin. // 想法阶段
Stage 1 - Proposal: this is worth working on. // 值得继续阶段
Stage 2 - Draft: initial spec. // 草案阶段
Stage 3 - Candidate: complete spec and initial browser implementations. // 候选阶段，完整的规范和初始浏览器实现
Stage 4 - Finished: will be added to the next yearly release. // 完成阶段，下一年度发布

所以第3阶段之前的任何事情，都应该谨慎使用
```

```
{
    "presets": [
        "stage-0"
    ]
}
```

```
export default {
  presets: [
    presetStage1
  ],
  plugins: [
    transformDoExpressions,
    transformFunctionBind
  ]

```

其余的babel-preset-stage-1、babel-preset-stage-2、babel-preset-stage-3同babel-preset-stage-0的配置是类似的，只是包含的语法转化不一样

<h4>babel-preset-env（终极预设）</h4>

babel-preset-env根据目标环境加载对应的bable语法转化插件及polyfill；如果传入目标环境则，默认与babel-preset-latest的功能是一样的，如果传入了需要运行的目标环境，则会根据目标环境自动加载对应的plugin

目标环境指的是代码需要运行的web或node环境，通过一个第三方的库[compat-table](https://kangax.github.io/compat-table/es6/)，来判断某个语法or某个api目标环境是否一句支持，如果已支持则不加载对应的插件，如果不支持则加载对应的插件

babel-preset-env是不包含stage-x的预设的

然后我们看下babel-preset-env插件的几个参数

targets | include | exclude | useBuiltIns |
-----   | -----   |  -----  | -----       |
指定目标环境，查询条件必须是browserslist支持的查询语句|include除了babel-preset-env预设默认加载插件还可以添加新的Babel plugins or Built-ins;Babel plugins就是babel的语法转化插件，如babel-plugin-transform-es2015-spread，注意可以省略babel-plugin-前缀；Built-ins则是一些api的polyfill实现，如es6.map、es6.object.assign等；|排除babel-preset-env预设默认加载插件及Built-ins|defaults to false,是否开启polyfill,注意一定需要引入babel-polyfill；也会根据targets来自动引入polyfill的api；注意这种方式是全局污染的方式,还有这种方式不是按需引入|

<details>
    <summary>以targets >= ie9及targets >= edg15 useBuiltIns=true为例</summary> 

```
{
    "presets": [
        [
            "env",
            {
                "targets": {
                    // 注意不要写android,插件内没有添加android的判断
                    "browsers": ["edge >= 15", "ios >= 11"], 
                    "node": "8.1.0"
                },
                "modules": false,
                "debug": true,
                "include": [],
                "exclude": ["transform-es2015-for-of"],
                "useBuiltIns": true,
            }
        ]
    ]
}
```

我们已targets >= ie9及targets >= edg15来看下babel是怎样进行polyfill的处理

```
{
    "presets": [
        [
            "env",
            {
                "targets": {
                    "browsers": ["ie >= 9"],
                    // "browsers": ["ie >= edg15"],
                },
                "debug": true,
                "useBuiltIns": true,
            }
        ]
    ]
}
```

```
index.js

import "babel-polyfill";

const name = 'jack';

export const myName = `hi ${name}`

async function getName() {}

const index = [1, 3, 7, 9].findIndex((it) => {
    return it === 3
})

let x = 10 ** 2;

x **= 3;

class Person {}

var promise = new Promise;

Array.from(new Set([1, 4, 6]))
```

```
target >= 9 babel处理后的index.js

import "core-js/modules/es6.typed.array-buffer";
import "core-js/modules/es6.typed.data-view";
import "core-js/modules/es6.typed.int8-array";
import "core-js/modules/es6.typed.uint8-array";
import "core-js/modules/es6.typed.uint8-clamped-array";
import "core-js/modules/es6.typed.int16-array";
import "core-js/modules/es6.typed.uint16-array";
import "core-js/modules/es6.typed.int32-array";
import "core-js/modules/es6.typed.uint32-array";
import "core-js/modules/es6.typed.float32-array";
import "core-js/modules/es6.typed.float64-array";
import "core-js/modules/es6.map";
import "core-js/modules/es6.set";
import "core-js/modules/es6.weak-map";
import "core-js/modules/es6.weak-set";
import "core-js/modules/es6.reflect.apply";
import "core-js/modules/es6.reflect.construct";
import "core-js/modules/es6.reflect.define-property";
import "core-js/modules/es6.reflect.delete-property";
import "core-js/modules/es6.reflect.get";
import "core-js/modules/es6.reflect.get-own-property-descriptor";
import "core-js/modules/es6.reflect.get-prototype-of";
import "core-js/modules/es6.reflect.has";
import "core-js/modules/es6.reflect.is-extensible";
import "core-js/modules/es6.reflect.own-keys";
import "core-js/modules/es6.reflect.prevent-extensions";
import "core-js/modules/es6.reflect.set";
import "core-js/modules/es6.reflect.set-prototype-of";
import "core-js/modules/es6.promise";
import "core-js/modules/es6.symbol";
import "core-js/modules/es6.object.freeze";
import "core-js/modules/es6.object.seal";
import "core-js/modules/es6.object.prevent-extensions";
import "core-js/modules/es6.object.is-frozen";
import "core-js/modules/es6.object.is-sealed";
import "core-js/modules/es6.object.is-extensible";
import "core-js/modules/es6.object.get-own-property-descriptor";
import "core-js/modules/es6.object.get-prototype-of";
import "core-js/modules/es6.object.keys";
import "core-js/modules/es6.object.get-own-property-names";
import "core-js/modules/es6.object.assign";
import "core-js/modules/es6.object.is";
import "core-js/modules/es6.object.set-prototype-of";
import "core-js/modules/es6.function.name";
import "core-js/modules/es6.string.raw";
import "core-js/modules/es6.string.from-code-point";
import "core-js/modules/es6.string.code-point-at";
import "core-js/modules/es6.string.repeat";
import "core-js/modules/es6.string.starts-with";
import "core-js/modules/es6.string.ends-with";
import "core-js/modules/es6.string.includes";
import "core-js/modules/es6.regexp.flags";
import "core-js/modules/es6.regexp.match";
import "core-js/modules/es6.regexp.replace";
import "core-js/modules/es6.regexp.split";
import "core-js/modules/es6.regexp.search";
import "core-js/modules/es6.array.from";
import "core-js/modules/es6.array.of";
import "core-js/modules/es6.array.copy-within";
import "core-js/modules/es6.array.find";
import "core-js/modules/es6.array.find-index";
import "core-js/modules/es6.array.fill";
import "core-js/modules/es6.array.iterator";
import "core-js/modules/es6.number.is-finite";
import "core-js/modules/es6.number.is-integer";
import "core-js/modules/es6.number.is-safe-integer";
import "core-js/modules/es6.number.is-nan";
import "core-js/modules/es6.number.epsilon";
import "core-js/modules/es6.number.min-safe-integer";
import "core-js/modules/es6.number.max-safe-integer";
import "core-js/modules/es6.math.acosh";
import "core-js/modules/es6.math.asinh";
import "core-js/modules/es6.math.atanh";
import "core-js/modules/es6.math.cbrt";
import "core-js/modules/es6.math.clz32";
import "core-js/modules/es6.math.cosh";
import "core-js/modules/es6.math.expm1";
import "core-js/modules/es6.math.fround";
import "core-js/modules/es6.math.hypot";
import "core-js/modules/es6.math.imul";
import "core-js/modules/es6.math.log1p";
import "core-js/modules/es6.math.log10";
import "core-js/modules/es6.math.log2";
import "core-js/modules/es6.math.sign";
import "core-js/modules/es6.math.sinh";
import "core-js/modules/es6.math.tanh";
import "core-js/modules/es6.math.trunc";
import "core-js/modules/es7.array.includes";
import "core-js/modules/es7.object.values";
import "core-js/modules/es7.object.entries";
import "core-js/modules/es7.object.get-own-property-descriptors";
import "core-js/modules/es7.string.pad-start";
import "core-js/modules/es7.string.pad-end";
import "core-js/modules/web.timers";
import "core-js/modules/web.immediate";
import "core-js/modules/web.dom.iterable";
import "regenerator-runtime/runtime";

var getName = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function getName() {
        return _ref.apply(this, arguments);
    };
}();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var name = 'jack';

export var myName = "hi " + name;

var index = [1, 3, 7, 9].findIndex(function (it) {
    return it === 3;
});

var x = Math.pow(10, 2);

x = Math.pow(x, 3);

var Person = function Person() {
    _classCallCheck(this, Person);
};

var promise = new Promise();

Array.from(new Set([1, 4, 6]));

babel处理时加载的plugins:

  check-es2015-constants {"ie":"9"}
  transform-es2015-arrow-functions {"ie":"9"}
  transform-es2015-block-scoped-functions {"ie":"9"}
  transform-es2015-block-scoping {"ie":"9"}
  transform-es2015-classes {"ie":"9"}
  transform-es2015-computed-properties {"ie":"9"}
  transform-es2015-destructuring {"ie":"9"}
  transform-es2015-duplicate-keys {"ie":"9"}
  transform-es2015-for-of {"ie":"9"}
  transform-es2015-function-name {"ie":"9"}
  transform-es2015-literals {"ie":"9"}
  transform-es2015-object-super {"ie":"9"}
  transform-es2015-parameters {"ie":"9"}
  transform-es2015-shorthand-properties {"ie":"9"}
  transform-es2015-spread {"ie":"9"}
  transform-es2015-sticky-regex {"ie":"9"}
  transform-es2015-template-literals {"ie":"9"}
  transform-es2015-typeof-symbol {"ie":"9"}
  transform-es2015-unicode-regex {"ie":"9"}
  transform-regenerator {"ie":"9"}
  transform-exponentiation-operator {"ie":"9"}
  transform-async-to-generator {"ie":"9"}
  syntax-trailing-function-commas {"ie":"9"}

用到的polyfills方法

  es6.typed.array-buffer {"ie":"9"}
  es6.typed.data-view {"ie":"9"}
  es6.typed.int8-array {"ie":"9"}
  es6.typed.uint8-array {"ie":"9"}
  es6.typed.uint8-clamped-array {"ie":"9"}
  es6.typed.int16-array {"ie":"9"}
  es6.typed.uint16-array {"ie":"9"}
  es6.typed.int32-array {"ie":"9"}
  es6.typed.uint32-array {"ie":"9"}
  es6.typed.float32-array {"ie":"9"}
  es6.typed.float64-array {"ie":"9"}
  es6.map {"ie":"9"}
  es6.set {"ie":"9"}
  es6.weak-map {"ie":"9"}
  es6.weak-set {"ie":"9"}
  es6.reflect.apply {"ie":"9"}
  es6.reflect.construct {"ie":"9"}
  es6.reflect.define-property {"ie":"9"}
  es6.reflect.delete-property {"ie":"9"}
  es6.reflect.get {"ie":"9"}
  es6.reflect.get-own-property-descriptor {"ie":"9"}
  es6.reflect.get-prototype-of {"ie":"9"}
  es6.reflect.has {"ie":"9"}
  es6.reflect.is-extensible {"ie":"9"}
  es6.reflect.own-keys {"ie":"9"}
  es6.reflect.prevent-extensions {"ie":"9"}
  es6.reflect.set {"ie":"9"}
  es6.reflect.set-prototype-of {"ie":"9"}
  es6.promise {"ie":"9"}
  es6.symbol {"ie":"9"}
  es6.object.freeze {"ie":"9"}
  es6.object.seal {"ie":"9"}
  es6.object.prevent-extensions {"ie":"9"}
  es6.object.is-frozen {"ie":"9"}
  es6.object.is-sealed {"ie":"9"}
  es6.object.is-extensible {"ie":"9"}
  es6.object.get-own-property-descriptor {"ie":"9"}
  es6.object.get-prototype-of {"ie":"9"}
  es6.object.keys {"ie":"9"}
  es6.object.get-own-property-names {"ie":"9"}
  es6.object.assign {"ie":"9"}
  es6.object.is {"ie":"9"}
  es6.object.set-prototype-of {"ie":"9"}
  es6.function.name {"ie":"9"}
  es6.string.raw {"ie":"9"}
  es6.string.from-code-point {"ie":"9"}
  es6.string.code-point-at {"ie":"9"}
  es6.string.repeat {"ie":"9"}
  es6.string.starts-with {"ie":"9"}
  es6.string.ends-with {"ie":"9"}
  es6.string.includes {"ie":"9"}
  es6.regexp.flags {"ie":"9"}
  es6.regexp.match {"ie":"9"}
  es6.regexp.replace {"ie":"9"}
  es6.regexp.split {"ie":"9"}
  es6.regexp.search {"ie":"9"}
  es6.array.from {"ie":"9"}
  es6.array.of {"ie":"9"}
  es6.array.copy-within {"ie":"9"}
  es6.array.find {"ie":"9"}
  es6.array.find-index {"ie":"9"}
  es6.array.fill {"ie":"9"}
  es6.array.iterator {"ie":"9"}
  es6.number.is-finite {"ie":"9"}
  es6.number.is-integer {"ie":"9"}
  es6.number.is-safe-integer {"ie":"9"}
  es6.number.is-nan {"ie":"9"}
  es6.number.epsilon {"ie":"9"}
  es6.number.min-safe-integer {"ie":"9"}
  es6.number.max-safe-integer {"ie":"9"}
  es6.math.acosh {"ie":"9"}
  es6.math.asinh {"ie":"9"}
  es6.math.atanh {"ie":"9"}
  es6.math.cbrt {"ie":"9"}
  es6.math.clz32 {"ie":"9"}
  es6.math.cosh {"ie":"9"}
  es6.math.expm1 {"ie":"9"}
  es6.math.fround {"ie":"9"}
  es6.math.hypot {"ie":"9"}
  es6.math.imul {"ie":"9"}
  es6.math.log1p {"ie":"9"}
  es6.math.log10 {"ie":"9"}
  es6.math.log2 {"ie":"9"}
  es6.math.sign {"ie":"9"}
  es6.math.sinh {"ie":"9"}
  es6.math.tanh {"ie":"9"}
  es6.math.trunc {"ie":"9"}
  es7.array.includes {"ie":"9"}
  es7.object.values {"ie":"9"}
  es7.object.entries {"ie":"9"}
  es7.object.get-own-property-descriptors {"ie":"9"}
  es7.string.pad-start {"ie":"9"}
  es7.string.pad-end {"ie":"9"}
  web.timers {"ie":"9"}
  web.immediate {"ie":"9"}
  web.dom.iterable {"ie":"9"}

```

```
target >= edge15 babel处理后的index.js

import "core-js/modules/es6.symbol";
import "core-js/modules/es6.function.name";
import "core-js/modules/es6.regexp.flags";
import "core-js/modules/es6.regexp.match";
import "core-js/modules/es6.regexp.replace";
import "core-js/modules/es6.regexp.split";
import "core-js/modules/es6.regexp.search";
import "core-js/modules/web.timers";
import "core-js/modules/web.immediate";
import "core-js/modules/web.dom.iterable";


const name = 'jack';

export const myName = `hi ${name}`;

async function getName() {}

const index = [1, 3, 7, 9].findIndex(it => {
    return it === 3;
});

let x = 10 ** 2;

x **= 3;

class Person {}

var promise = new Promise();

Array.from(new Set([1, 4, 6]));

babel处理时加载的plugins:

  transform-es2015-destructuring {"edge":"15"}
  transform-es2015-function-name {"edge":"15"}

polyfills:

  es6.symbol {"edge":"15"}
  es6.function.name {"edge":"15"}
  es6.regexp.flags {"edge":"15"}
  es6.regexp.match {"edge":"15"}
  es6.regexp.replace {"edge":"15"}
  es6.regexp.split {"edge":"15"}
  es6.regexp.search {"edge":"15"}
  web.timers {"edge":"15"}
  web.immediate {"edge":"15"}
  web.dom.iterable {"edge":"15"}

```

我们可以上面的例子明显的看出来，babel会根据targets来加载plugins及polyfills；ie9肯定是不支持es6语法的，所以加载了很多的语法转化插件及polyfills；而edge15已经差不多全部支持es6的语法了，所以基本没有加载什么插件及polyfills，转化之后的代码变化也不大；然后我们看下babel-preset-env是怎么处理的

babel-preset-env源码

```
export const isPluginRequired = (supportedEnvironments, plugin) => {
  const targetEnvironments = Object.keys(supportedEnvironments);

  if (targetEnvironments.length === 0) { return true; }

  const isRequiredForEnvironments = targetEnvironments
    .filter((environment) => {
      // Feature is not implemented in that environment
      if (!plugin[environment]) { return true; }

      const lowestImplementedVersion = plugin[environment];
      const lowestTargetedVersion = supportedEnvironments[environment];

      if (!semver.valid(lowestTargetedVersion)) {
        throw new Error(
          // eslint-disable-next-line max-len
          `Invalid version passed for target "${environment}": "${lowestTargetedVersion}". Versions must be in semver format (major.minor.patch)`,
        );
      }

      return semver.gt(
        semverify(lowestImplementedVersion),
        lowestTargetedVersion,
      );
    });

  return isRequiredForEnvironments.length > 0;
};

let hasBeenLogged = false;

const logPlugin = (plugin, targets, list) => {
  const envList = list[plugin] || {};
  const filteredList = Object.keys(targets)
  .reduce((a, b) => {
    if (!envList[b] || semver.lt(targets[b], semverify(envList[b]))) {
      a[b] = prettifyVersion(targets[b]);
    }
    return a;
  }, {});
  const logStr = `  ${plugin} ${JSON.stringify(filteredList)}`;
  console.log(logStr);
};

const filterItem = (targets, exclusions, list, item) => {
  const isDefault = defaultWebIncludes.indexOf(item) >= 0;
  const notExcluded = exclusions.indexOf(item) === -1;

  if (isDefault) return notExcluded;
  const isRequired = isPluginRequired(targets, list[item]);
  return isRequired && notExcluded;
};

const getBuiltInTargets = (targets) => {
  const builtInTargets = _extends({}, targets);
  if (builtInTargets.uglify != null) {
    delete builtInTargets.uglify;
  }
  return builtInTargets;
};

export const transformIncludesAndExcludes = (opts) => ({
  all: opts,
  plugins: opts.filter((opt) => !opt.match(/^(es\d+|web)\./)),
  builtIns: opts.filter((opt) => opt.match(/^(es\d+|web)\./))
});

function getPlatformSpecificDefaultFor(targets) {
  const targetNames = Object.keys(targets);
  const isAnyTarget = !targetNames.length;
  const isWebTarget = targetNames.some((name) => name !== "node");

  return (isAnyTarget || isWebTarget) ? defaultWebIncludes : [];
}

export default function buildPreset(context, opts = {}) {
  const validatedOptions = normalizeOptions(opts);
  const { debug, loose, moduleType, spec, useBuiltIns } = validatedOptions;

  const targets = getTargets(validatedOptions.targets);
  const include = transformIncludesAndExcludes(validatedOptions.include);
  const exclude = transformIncludesAndExcludes(validatedOptions.exclude);

  const filterPlugins = filterItem.bind(null, targets, exclude.plugins, pluginList);
  const transformations = Object.keys(pluginList)
    .filter(filterPlugins)
    .concat(include.plugins);

  let polyfills;
  let polyfillTargets;
  // 是否开启useBuiltIns
  if (useBuiltIns) {
    polyfillTargets = getBuiltInTargets(targets);
    // builtInsList babel维护的一个es6+方法兼容性对象，
    {
        "es6.typed.array-buffer": {
            "chrome": "51",
            "edge": "13",
            "firefox": "48",
            "safari": "10",
            "node": "6.5",
            "ios": "10",
            "opera": "38",
            "electron": "1.2"
        }
    }
    const filterBuiltIns = filterItem.bind(null, polyfillTargets, exclude.builtIns, builtInsList);
    // 根据传入的targets参数获取需要引入的polyfill方法or对象
    polyfills = Object.keys(builtInsList)
      .concat(getPlatformSpecificDefaultFor(polyfillTargets))
      .filter(filterBuiltIns)
      .concat(include.builtIns);
  }

  if (debug && !hasBeenLogged) {
    hasBeenLogged = true;
    console.log("babel-preset-env: `DEBUG` option");
    console.log("\nUsing targets:");
    console.log(JSON.stringify(prettifyTargets(targets), null, 2));
    console.log(`\nModules transform: ${moduleType}`);
    console.log("\nUsing plugins:");
    transformations.forEach((transform) => {
      logPlugin(transform, targets, pluginList);
    });
    if (useBuiltIns && polyfills.length) {
      console.log("\nUsing polyfills:");
      polyfills.forEach((polyfill) => {
        logPlugin(polyfill, polyfillTargets, builtInsList);
      });
    }
  }

  const regenerator = transformations.indexOf("transform-regenerator") >= 0;
  const modulePlugin = moduleType !== false && moduleTransformations[moduleType];
  const plugins = [];

  // NOTE: not giving spec here yet to avoid compatibility issues when
  // babel-plugin-transform-es2015-modules-commonjs gets its spec mode
  modulePlugin &&
    plugins.push([require(`babel-plugin-${modulePlugin}`), { loose }]);

  plugins.push(...transformations.map((pluginName) =>
    [require(`babel-plugin-${pluginName}`), { spec, loose }]
  ));

  useBuiltIns &&
    plugins.push([transformPolyfillRequirePlugin, { polyfills, regenerator }]);

  return {
    plugins
  };
```
</details>

<h4>babel-polyfill</h4>

polyfill为目标环境提供垫片，其内部引用的是core-js及regenerator-runtime这两个包；core-js提供所有es5+ api polyfill;regenerator-runtime提供generator polyfill

```
if (global._babelPolyfill) {
  throw new Error("only one instance of babel-polyfill is allowed");
}
global._babelPolyfill = true;

import "core-js/shim";
import "regenerator-runtime/runtime";
```

<h4>babel-runtime（babel-plugin-transform-runtime配合使用）</h4>

1. 提供regenerator-runtime插件，便于转化generator函数
2. 通过corejs引入无污染的polyfill
3. 提供公共的helper函数

```
// core-js/library下提供的就是无污染的polyfill
module.exports = { "default": require("core-js/library/fn/promise"), __esModule: true };
```

babel-runtime有一个缺陷就是只对内置函数如Promise、Set及静态方法Array.from等进行polyfill，而对原型方法是无法进行polyfill的，所以如果还需要对原型方法进行polyfill则还需要，引入babel-polyfill，并将env的useBuiltIns的值设置为true

babel-runtime与babel-polyfill的区别则是前者可以提供部分无污染的polyfill，及helper函数及无污染的regenerator；而后者只提供全局的polyfill及regenerator

<h4>babel-plugin-transform-runtime（与babel-runtime配合使用）</h4>

plugin-transform-runtime做3件事情
1. 引入babel-runtime/regenerator插件，便于转化generator函数
2. 通过引入corejs来解决全局变量污染的问题、注意不包括原型方法,如findIndex等
3. 将helper函数从外部引入，而不是每个需要的地方生成，减少重复代码

```
{
    "presets": [
        [
            "env",
            {
                "targets": {
                    "browsers": ["ie >= 9"]
                },
                "modules": false,
                "debug": true,
                "include": [],
                "exclude": [],
                "useBuiltIns": false,
            }
        ]
    ],
    "plugins": [
        [
            "transform-runtime", 
            {
                "helpers": true,
                "polyfill": true,
                "regenerator": true,
                "moduleName": "babel-runtime"
            }]
    ]
}
```

```
In
class Person {
}

var promise = new Promise;

Array.from(new Set([1, 4, 6]))

Out 

"use strict";

import _classCallCheck from "babel-runtime/helpers/classCallCheck";
import _Promise from "babel-runtime/core-js/promise";
import _Set from "babel-runtime/core-js/set";
import _Array$from from "babel-runtime/core-js/array/from";

var Person = function Person() {
  _classCallCheck(this, Person);
};

var promise = new _Promise();

_Array$from(new _Set([1, 4, 6]));
```

<details>
    <summary>看一个具体的例子</summary> 

```
// targes >= ie9 useBuiltIns = false transform-runtime
{
    "presets": [
        [
            "env",
            {
                "targets": {
                    "browsers": ["ie >= 9"]
                },
                "debug": true,
                "useBuiltIns": false
            }
        ]
    ],
    "plugins": [
        [
            "transform-runtime", 
            {
                "helpers": true,
                "polyfill": true,
                "regenerator": true,
                "moduleName": "babel-runtime"
            }]
    ]
}

```

```
index.js

const name = 'jack';

export const myName = `hi ${name}`

async function getName() {}

const index = [1, 3, 7, 9].findIndex((it) => {
    return it === 3
})

let x = 10 ** 2;

x **= 3;

class Person {}

var promise = new Promise;

Array.from(new Set([1, 4, 6]))
```

```
targes >= ie9 useBuiltIns = false transform-runtime babel处理后的index.js

import _Set from 'babel-runtime/core-js/set';
import _Array$from from 'babel-runtime/core-js/array/from';
import _Promise from 'babel-runtime/core-js/promise';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';

var getName = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function getName() {
        return _ref.apply(this, arguments);
    };
}();

var name = 'jack';

export var myName = 'hi ' + name;

var index = [1, 3, 7, 9].findIndex(function (it) {
    return it === 3;
});

var x = Math.pow(10, 2);

x = Math.pow(x, 3);

var Person = function Person() {
    _classCallCheck(this, Person);
};

var promise = new _Promise();

_Array$from(new _Set([1, 4, 6]));

// 实现了按需加载，并且没有污染全局变量，但是没有提供原型方法的polyfill，所以我在使用的时候一定要注意
```
</details>

### 7. 深入理解babel7.x插件

后面都会围绕下面这个例子来进行讲解

```
index.js 

const arr = [1, 3, 5, 7]

const idx = arr.findIndex(item => {
  return item === 3
})

const a = Promise.resolve(2)

a.then((res) => {
  console.log(res)
})

class Circe {}

function* foo() {}
```

<h4>@babel-cli</h4> 

babel的cli工具，帮助我们可以通过命令行来实现对文件的转化，一般按项目安装，而不是全局安装，这样便于不同的项目允许使用不同版本的babel

使用方式，如下所示

```
执行方式
放在npm scripts内 babel script.js || ./node_modules/.bin/babel script.js

指定输出编译后的文件, --out-file
./node_modules/.bin/babel script.js --out-file compiler.js

指定是否生成source-map文件, --source-map
./node_modules/.bin/babel script.js --out-file compiler.js --source-map

指定编译后放置目录, --out-dir
babel src --out-dir lib

忽略文件, --ignore
babel src --out-dir lib --ignore "src/**/*.spec.js","src/**/*.test.js"

使用plugin插件, --plugins=
babel script.js --out-file script-compiled.js --plugins=@babel/proposal-class-properties

使用Presets预置插件, --presets=
babel script.js --out-file script-compiled.js --presets=@babel/preset-env,@babel/flow

忽略根目录下的.babelrc, --no-babelrc
babel --no-babelrc script.js --out-file script-compiled.js --presets=es2015,react
```

<h4>@babel/preset-env(由babel-env更名而来)</h4>

回顾之前的babel6的preset-env中，polyfill是不支持按需引入的，所以无形中增加了包的体积；

与6.x最大的变化就是配置项useBuiltIns，由之前的true|false变化为现在的"usage" | "entry" | false,以及新增的corejs、shippedProposals参数

targets | modules | useBuiltIns | corejs | shippedProposals |
----    | -----   | ------      | ---    | -----          |
描述您为项目支持/定位的环境,`defaults {}` | "amd" 、 "umd" 、 "systemjs" 、 "commonjs" 、 "cjs" 、 "auto" 、 false, defaults to "auto" 启用将ES6模块语法转换为其他模块类型，fasle则不会进行语法转化；cjs是commonjs的简写 | "usage" 、 "entry" 、 false, defaults to false 处理polyfills的选项 | `2, 3 or { version: 2 or 3, proposals: boolean }, defaults to 2` | 是否启用提案转化插件。默认为false|

通过参数我们可以知道@babel/preset-env插件为了支持按需polyfill增加了useBuiltIns的值，由之前的true跟false变成现的"usage" | "entry" | false；那么corejs这个参数是做什么的呢？且默认值是2；

是因为polyfill依赖的核心包core-js做了重大升级，由之前的2.x变成了现在的3.x；3.x基本重构了整个目录及api的命名规范，如之前方法都是es6.array.copy-within现在都统一改成了es.array.copy-within，在3.x版本中提案都用esnext表示，如esnext.weak-map.of；所以env中出现了corejs这个参数，用于指定corejs包的版本；然后在说下proposals这个参数，true表示加载es提案的polyfill，与shippedProposals的区别是，shippedProposals表示现阶段稳定的提案即已经到了第4个阶段，而proposals表示所有提案；这两个参数都只有在corejs版本为3的时候才有效；所以推荐使用corejs3

那么我们结合这两个参数一起看下5种结合场景

<h5>场景一 useBuiltIns "usage" and core-js 2</h5>

```
.babelrc 
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
        },
        "debug": true,
        "useBuiltIns": "usage",
        "corejs": 2
      }
    ]
  ]
}
```

```
babel 处理后的index.js

import "regenerator-runtime/runtime";
import "core-js/modules/es6.promise";
import "core-js/modules/es6.object.to-string";
import "core-js/modules/es6.array.find-index";

var _marked =
/*#__PURE__*/
regeneratorRuntime.mark(foo);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var arr = [1, 3, 5, 7];
var idx = arr.findIndex(function (item) {
  return item === 3;
});
var a = Promise.resolve(2);
a.then(function (res) {
  console.log(res);
});

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};

function foo() {
  return regeneratorRuntime.wrap(function foo$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}


关键字： 按需引入、全局污染、不需要在index.js内引入@babel/polyfill or core-js@2 、不支持提案
```

<h5>场景二 useBuiltIns "usage" and core-js 2</h5>

```
.babelrc 
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
        },
        "debug": true,
        "useBuiltIns": "entry",
        "corejs": 2
      }
    ]
  ]
}
```

```
babel处理后的index.js 

import "core-js/modules/es6.array.copy-within";
import "core-js/modules/es6.array.fill";
import "core-js/modules/es6.array.find";
import "core-js/modules/es6.array.find-index";
import "core-js/modules/es7.array.flat-map";
import "core-js/modules/es6.array.from";
import "core-js/modules/es7.array.includes";
...
import "core-js/modules/es6.array.iterator";

var _marked =
/*#__PURE__*/
regeneratorRuntime.mark(foo);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var arr = [1, 3, 5, 7];
var idx = arr.findIndex(function (item) {
  return item === 3;
});
var a = Promise.resolve(2);
a.then(function (res) {
  console.log(res);
});

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};

function foo() {
  return regeneratorRuntime.wrap(function foo$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

关键字： 全局引入、全局污染、需要在index.js内引入@babel/polyfill or core-js@2 、不支持提案
```

<h5>场景三 useBuiltIns "usage" and core-js 3</h5>

```
.babelrc 
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
        },
        "debug": true,
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ]
}
```

```
babel 处理后的index.js

import "core-js/modules/es.array.find-index";
import "core-js/modules/es.object.to-string";
import "core-js/modules/es.promise";
import "regenerator-runtime/runtime";

var _marked =
/*#__PURE__*/
regeneratorRuntime.mark(foo);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var arr = [1, 3, 5, 7];
var idx = arr.findIndex(function (item) {
  return item === 3;
});
var a = Promise.resolve(2);
a.then(function (res) {
  console.log(res);
});

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};

function foo() {
  return regeneratorRuntime.wrap(function foo$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

关键字： 按需引入、全局污染、不需要在index.js内引入@babel/polyfill or core-js@3 、支持所有的阶段的提案
```

<h5>场景四 useBuiltIns "entry" and core-js 3</h5>

```
.babelrc 
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
        },
        "debug": true,
        "useBuiltIns": "entry",
        "corejs": 3
      }
    ]
  ]
}
```

```
import "core-js/modules/es.symbol";
import "core-js/modules/es.symbol.description";
import "core-js/modules/es.symbol.async-iterator";
import "core-js/modules/es.symbol.has-instance";
import "core-js/modules/es.symbol.is-concat-spreadable";
import "core-js/modules/es.symbol.iterator";
...
import "core-js/modules/web.url-search-params";

var _marked =
/*#__PURE__*/
regeneratorRuntime.mark(foo);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import 'regenerator-runtime/runtime';
var arr = [1, 3, 5, 7];
var idx = arr.findIndex(function (item) {
  return item === 3;
});
var a = Promise.resolve(2);
a.then(function (res) {
  console.log(res);
});

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};

function foo() {
  return regeneratorRuntime.wrap(function foo$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
        case "end":
          return _context.stop();
      }
    }
  }, _marked);
}

关键字： 全局引入、全局污染、需要在index.js内引入core-js@3 、支持所有的阶段的提案
```

<h5>场景五 useBuiltIns false 不进行polyfill</h5>

```
.babelrc 
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
        },
        "debug": true,
        "useBuiltIns": false,
        "corejs": 3
      }
    ]
  ]
}
```

通过上面的例子我们已经支持@babel/preset-env支持按需加载，且通过不同版本的core-js来支持提案，那么@babel/preset-env是怎么做的，我们一起看下源码

<details>
    <summary>@babel/preset-env源码</summary> 

```
import addCoreJS2UsagePlugin from "./polyfills/corejs2/usage-plugin";
import addCoreJS3UsagePlugin from "./polyfills/corejs3/usage-plugin";
import addRegeneratorUsagePlugin from "./polyfills/regenerator/usage-plugin";
import replaceCoreJS2EntryPlugin from "./polyfills/corejs2/entry-plugin";
import replaceCoreJS3EntryPlugin from "./polyfills/corejs3/entry-plugin";
import removeRegeneratorEntryPlugin from "./polyfills/regenerator/entry-plugin";

// 获取polyfill列表
export const getPolyfillPlugins = ({
  useBuiltIns,
  corejs,
  polyfillTargets,
  include,
  exclude,
  proposals,
  shippedProposals,
  regenerator,
  debug,
}: {
  useBuiltIns: BuiltInsOption,
  corejs: typeof SemVer | null | false,
  polyfillTargets: Targets,
  include: Set<string>,
  exclude: Set<string>,
  proposals: boolean,
  shippedProposals: boolean,
  regenerator: boolean,
  debug: boolean,
}) => {
  const polyfillPlugins = [];
  if (useBuiltIns === "usage" || useBuiltIns === "entry") {
    const pluginOptions = {
      corejs,
      polyfillTargets,
      include,
      exclude,
      proposals,
      shippedProposals,
      regenerator,
      debug,
    };

    if (corejs) {
      if (useBuiltIns === "usage") {
        if (corejs.major === 2) {
          // 获取CoreJS2UsagePlugin
          polyfillPlugins.push([addCoreJS2UsagePlugin, pluginOptions]);
        } else {
          // 获取CoreJS3UsagePlugin
          polyfillPlugins.push([addCoreJS3UsagePlugin, pluginOptions]);
        }
        if (regenerator) {
          polyfillPlugins.push([addRegeneratorUsagePlugin, pluginOptions]);
        }
      } else {
        if (corejs.major === 2) {
          // replaceCoreJS2EntryPlugin获取CoreJS2EntryPlugin
          polyfillPlugins.push([replaceCoreJS2EntryPlugin, pluginOptions]);
        } else {
          // replaceCoreJS2EntryPlugin获取CoreJS3EntryPlugin
          polyfillPlugins.push([replaceCoreJS3EntryPlugin, pluginOptions]);
          if (!regenerator) {
            polyfillPlugins.push([removeRegeneratorEntryPlugin, pluginOptions]);
          }
        }
      }
    }
  }
  return polyfillPlugins;
};

export default declare((api, opts) => {
  api.assertVersion(7);

  const {
    configPath,
    debug,
    exclude: optionsExclude,
    forceAllTransforms,
    ignoreBrowserslistConfig,
    include: optionsInclude,
    loose,
    modules,
    shippedProposals,
    spec,
    targets: optionsTargets,
    useBuiltIns,
    corejs: { version: corejs, proposals },
  } = normalizeOptions(opts);
  // remove this in next major
  let hasUglifyTarget = false;


  const targets = getTargets(optionsTargets, {
    ignoreBrowserslistConfig,
    configPath,
  });

  // 获取转化插件列表
  const pluginNames = filterItems(
    shippedProposals ? pluginList : pluginListWithoutProposals,
    include.plugins,
    exclude.plugins,
    transformTargets,
    modulesPluginNames,
    getOptionSpecificExcludesFor({ loose }),
    pluginSyntaxMap,
  );
 
  // 通过getPolyfillPlugins函数获取polyfill插件列表
  const polyfillPlugins = getPolyfillPlugins({
    useBuiltIns,
    corejs,
    polyfillTargets: targets,
    include: include.builtIns,
    exclude: exclude.builtIns,
    proposals,
    shippedProposals,
    regenerator: pluginNames.has("transform-regenerator"),
    debug,
  });

  const pluginUseBuiltIns = useBuiltIns !== false;
  
  // 最后合并插件列表
  const plugins = Array.from(pluginNames)
    .map(pluginName => [
      getPlugin(pluginName),
      { spec, loose, useBuiltIns: pluginUseBuiltIns },
    ])
    .concat(polyfillPlugins);

  return { plugins };
});
```

从上一步我们可以知道，通过getPolyfillPlugins方法获取四种场景下的polyfill插件列表

#### 场景一 useBuiltIns: "entry" corejs: 2 引入的是replaceCoreJS2EntryPlugin插件

```
export default function(
  _: any,
  {
    include,
    exclude,
    polyfillTargets,
    regenerator,
    debug,
  }: InternalPluginOptions,
) {
  // corejs2Polyfills = {
  //  "es6.array.copy-within": {
  //      "chrome": "45",
  //      "edge": "12",
  //      "firefox": "32",
  //      "safari": "9",
  //      "node": "4",
  //      "ios": "9",
  //      "samsung": "5",
  //      "opera": "32",
  //      "electron": "0.35"
  //  },
  //  ...
  // }
  const polyfills = filterItems(
    corejs2Polyfills,
    include,
    exclude,
    polyfillTargets,
    getPlatformSpecificDefaultFor(polyfillTargets), // ["web.timers","web.immediate","web.dom.iterable"]
  );

  // 访问者
  const isPolyfillImport = {
    // 开启entry配置，需要在入口处引入babel-polyfill or core-js
    // 替换import 'babel-polyfill'为import "core-js/modules/es6.array.copy-within" ...;
    ImportDeclaration(path: NodePath) {
      if (isPolyfillSource(getImportSource(path))) {
        this.replaceBySeparateModulesImport(path);
      }
    },
    // 替换require('babel-polyfill')为import "core-js/modules/es6.array.copy-within" ...;
    Program(path: NodePath) {
      path.get("body").forEach(bodyPath => {
        if (isPolyfillSource(getRequireSource(bodyPath))) {
          this.replaceBySeparateModulesImport(bodyPath);
        }
      });
    },
  };

  return {
    name: "corejs2-entry",
    visitor: isPolyfillImport,
    pre() {
      this.importPolyfillIncluded = false;
      
      // 具体的替换方法
      this.replaceBySeparateModulesImport = function(path) {
        this.importPolyfillIncluded = true;

        if (regenerator) {
          createImport(path, "regenerator-runtime");
        }
        
        // 获取到polyfill的模块，如下所示['web.dom.iterable','web.immediate','web.timers','es6.weak-set']
        const modules = Array.from(polyfills).reverse();

        for (const module of modules) {
          // 场景import "core-js/modules/es6.array.copy-within"
          createImport(path, module);
        }

        // 删除import 'babel-polyfill'引入
        path.remove();
      };
    }
  };
}
```

#### 场景二 useBuiltIns: "entry" corejs: 3 引入的是replaceCoreJS3EntryPlugin插件

```
export default function(
  _: any,
  { corejs, include, exclude, polyfillTargets, debug }: InternalPluginOptions,
) {
  // corejs3Polyfills = 'esnext.string.match-all': {
  //  chrome: '73',
  //  firefox: '67',
  //  safari: '13',
  //  opera: '60',
  //  node: '12.0',
  //  electron: '5.0'
  // }
  const polyfills = filterItems(
    corejs3Polyfills,
    include,
    exclude,
    polyfillTargets,
    null,
  );

  const available = new Set(getModulesListForTargetVersion(corejs.version));

  const isPolyfillImport = {
    ImportDeclaration(path: NodePath) {
      const source = getImportSource(path);
      if (!source) return;
      if (isBabelPolyfillSource(source)) {
        console.warn(BABEL_POLYFILL_DEPRECATION);
      } else {
        const modules = isCoreJSSource(source);
        if (modules) {
          this.replaceBySeparateModulesImport(path, modules);
        }
      }
    },
    Program(path: NodePath) {
      path.get("body").forEach(bodyPath => {
        const source = getRequireSource(bodyPath);
        if (!source) return;
        if (isBabelPolyfillSource(source)) {
          console.warn(BABEL_POLYFILL_DEPRECATION);
        } else {
          const modules = isCoreJSSource(source);
          if (modules) {
            this.replaceBySeparateModulesImport(bodyPath, modules);
          }
        }
      });
    },
  };

  return {
    name: "corejs3-entry",
    visitor: isPolyfillImport,
    pre() {
      this.polyfillsSet = new Set();

      this.replaceBySeparateModulesImport = function(path, modules) {
        for (const module of modules) {
          this.polyfillsSet.add(module);
        }

        path.remove();
      };
    },
    post({ path }: { path: NodePath }) {
      const filtered = intersection(polyfills, this.polyfillsSet, available);
      const reversed = Array.from(filtered).reverse();
      
      // 退出插件的时候，统一添加core-js引用
      for (const module of reversed) {
        createImport(path, module);
      }
    },
  };
}

与replaceCoreJS3EntryPlugin的区别除来core-js引入的版本不同，还有就是创建引入core-js/modules/es.symbol等依赖的时候增加了去重及循环引用
```

#### 场景三 useBuiltIns: "usage" corejs: 2 引入的是addCoreJS2UsagePlugin插件

```
export default function(
  { types: t }: { types: Object },
  { include, exclude, polyfillTargets, debug }: InternalPluginOptions,
) {
  // 根据获取polyfill方法列表
  const polyfills = filterItems(
    corejs2Polyfills,
    include,
    exclude,
    polyfillTargets,
    getPlatformSpecificDefaultFor(polyfillTargets),
  );

  const addAndRemovePolyfillImports = {
    // 匹配import "@babel/polyfill" or import "core-js" 有就给出警告并删除，因为不需要手动引入
    ImportDeclaration(path: NodePath) {
      if (isPolyfillSource(getImportSource(path))) {
        console.warn(NO_DIRECT_POLYFILL_IMPORT);
        path.remove();
      }
    },
    // 匹配require("@babel/polyfill") or require("core-js") 有就给出警告并删除，因为不需要手动引入
    Program(path: NodePath) {
      path.get("body").forEach(bodyPath => {
        if (isPolyfillSource(getRequireSource(bodyPath))) {
          console.warn(NO_DIRECT_POLYFILL_IMPORT);
          bodyPath.remove();
        }
      });
    },

    // Symbol()
    // new Promise
    ReferencedIdentifier({ node: { name }, parent, scope }: NodePath) {
      if (t.isMemberExpression(parent)) return;
      if (!has(BuiltIns, name)) return;
      if (scope.getBindingIdentifier(name)) return;

      const BuiltInDependencies = BuiltIns[name];
      this.addUnsupported(BuiltInDependencies);
    },

    // arr[Symbol.iterator]()
    CallExpression(path: NodePath) {
      // we can't compile this
      if (path.node.arguments.length) return;

      const callee = path.node.callee;

      if (!t.isMemberExpression(callee)) return;
      if (!callee.computed) return;
      if (!path.get("callee.property").matchesPattern("Symbol.iterator")) {
        return;
      }

      this.addImport("web.dom.iterable");
    },

    // Symbol.iterator in arr
    BinaryExpression(path: NodePath) {
      if (path.node.operator !== "in") return;
      if (!path.get("left").matchesPattern("Symbol.iterator")) return;

      this.addImport("web.dom.iterable");
    },

    // yield*
    YieldExpression(path: NodePath) {
      if (path.node.delegate) {
        this.addImport("web.dom.iterable");
      }
    },

    // 匹配Array.from [].findIndex
    MemberExpression: {
      enter(path: NodePath) {
        const { node } = path;
        const { object, property } = node;

        let evaluatedPropType = object.name;
        let propertyName = "";
        let instanceType = "";

        // 是否是计算属性，如果是计算属性则获取计算属性的名称
        if (node.computed) {
          if (t.isStringLiteral(property)) {
            propertyName = property.value;
          } else {
            const result = path.get("property").evaluate();
            if (result.confident && result.value) {
              propertyName = result.value;
            }
          }
        } else {
          propertyName = property.name;
        }

        // 获取调用原型方法的对象，如[].findexIndex ,那么获取到的result.value就是[]
        if (path.scope.getBindingIdentifier(object.name)) {
          const result = path.get("object").evaluate();
          if (result.value) {
            instanceType = getType(result.value);
          } else if (result.deopt && result.deopt.isIdentifier()) {
            evaluatedPropType = result.deopt.node.name;
          }
        }

        // 匹配静态方法，如Array.from || Promise.then等等
        if (has(StaticProperties, evaluatedPropType)) {
          const BuiltInProperties = StaticProperties[evaluatedPropType];
          if (has(BuiltInProperties, propertyName)) {
            const StaticPropertyDependencies = BuiltInProperties[propertyName];
            this.addUnsupported(StaticPropertyDependencies);
          }
        }

        // 匹配原型方法，如[].findIndex等
        if (has(InstanceProperties, propertyName)) {
          let InstancePropertyDependencies = InstanceProperties[propertyName];
          if (instanceType) {
            InstancePropertyDependencies = InstancePropertyDependencies.filter(
              module => module.includes(instanceType),
            );
          }
          this.addUnsupported(InstancePropertyDependencies);
        }
      },

      // Symbol.match
      exit(path: NodePath) {
        const { name } = path.node.object;

        if (!has(BuiltIns, name)) return;
        if (path.scope.getBindingIdentifier(name)) return;

        const BuiltInDependencies = BuiltIns[name];
        this.addUnsupported(BuiltInDependencies);
      },
    },

    // var { repeat, startsWith } = String
    VariableDeclarator(path: NodePath) {
      const { node } = path;
      const { id, init } = node;

      if (!t.isObjectPattern(id)) return;

      // doesn't reference the global
      if (init && path.scope.getBindingIdentifier(init.name)) return;

      for (const { key } of id.properties) {
        if (
          !node.computed &&
          t.isIdentifier(key) &&
          has(InstanceProperties, key.name)
        ) {
          const InstancePropertyDependencies = InstanceProperties[key.name];
          this.addUnsupported(InstancePropertyDependencies);
        }
      }
    },
  };

  return {
    name: "corejs2-usage",
    pre({ path }: { path: NodePath }) {
      this.polyfillsSet = new Set();
      
      // 添加单个的polyfill导入，this.addImport("web.dom.iterable") => import "core-js/modules/web.dom.iterable";
      this.addImport = function(builtIn) {
        if (!this.polyfillsSet.has(builtIn)) {
          this.polyfillsSet.add(builtIn);
          createImport(path, builtIn);
        }
      };

      this.addUnsupported = function(builtIn) {
        const modules = Array.isArray(builtIn) ? builtIn : [builtIn];
        for (const module of modules) {
          if (polyfills.has(module)) {
            this.addImport(module);
          }
        }
      };
    },
    visitor: addAndRemovePolyfillImports,
  };
}
```

#### 场景四 useBuiltIns: "usage" corejs: 3 引入的是addCoreJS3UsagePlugin插件

```
export default function(
  _: any,
  {
    corejs,
    include,
    exclude,
    polyfillTargets,
    proposals,
    shippedProposals,
    debug,
  }: InternalPluginOptions,
) {
  const polyfills = filterItems(
    proposals
      ? corejs3Polyfills
      : shippedProposals
      ? corejs3PolyfillsWithShippedProposals
      : corejs3PolyfillsWithoutProposals,
    include,
    exclude,
    polyfillTargets,
    null,
  );

  const available = new Set(getModulesListForTargetVersion(corejs.version));

  function resolveKey(path, computed) {
    const { node, parent, scope } = path;
    if (path.isStringLiteral()) return node.value;
    const { name } = node;
    const isIdentifier = path.isIdentifier();
    if (isIdentifier && !(computed || parent.computed)) return name;
    if (!isIdentifier || scope.getBindingIdentifier(name)) {
      const { value } = path.evaluate();
      if (typeof value === "string") return value;
    }
  }

  function resolveSource(path) {
    const { node, scope } = path;
    let builtIn, instanceType;
    if (node) {
      builtIn = node.name;
      if (!path.isIdentifier() || scope.getBindingIdentifier(builtIn)) {
        const { deopt, value } = path.evaluate();
        if (value !== undefined) {
          instanceType = getType(value);
        } else if (deopt && deopt.isIdentifier()) {
          builtIn = deopt.node.name;
        }
      }
    }
    return { builtIn, instanceType, isNamespaced: isNamespaced(path) };
  }

  const addAndRemovePolyfillImports = {
    // import 'core-js'
    ImportDeclaration(path: NodePath) {
      if (isPolyfillSource(getImportSource(path))) {
        console.warn(NO_DIRECT_POLYFILL_IMPORT);
        path.remove();
      }
    },

    // require('core-js')
    Program(path: NodePath) {
      path.get("body").forEach(bodyPath => {
        if (isPolyfillSource(getRequireSource(bodyPath))) {
          console.warn(NO_DIRECT_POLYFILL_IMPORT);
          bodyPath.remove();
        }
      });
    },

    // import('something').then(...)
    Import() {
      this.addUnsupported(PromiseDependencies);
    },

    Function({ node }: NodePath) {
      // (async function () { }).finally(...)
      if (node.async) {
        this.addUnsupported(PromiseDependencies);
      }
    },

    // for-of, [a, b] = c
    "ForOfStatement|ArrayPattern"() {
      this.addUnsupported(CommonIterators);
    },

    // [...spread]
    SpreadElement({ parentPath }: NodePath) {
      if (!parentPath.isObjectExpression()) {
        this.addUnsupported(CommonIterators);
      }
    },

    // yield*
    YieldExpression({ node }: NodePath) {
      if (node.delegate) {
        this.addUnsupported(CommonIterators);
      }
    },

    // Symbol(), new Promise
    ReferencedIdentifier({ node: { name }, scope }: NodePath) {
      if (scope.getBindingIdentifier(name)) return;

      this.addBuiltInDependencies(name);
    },

    MemberExpression(path: NodePath) {
      const source = resolveSource(path.get("object"));
      const key = resolveKey(path.get("property"));

      // Object.entries
      // [1, 2, 3].entries
      this.addPropertyDependencies(source, key);
    },

    ObjectPattern(path: NodePath) {
      const { parentPath, parent, key } = path;
      let source;

      // const { keys, values } = Object
      if (parentPath.isVariableDeclarator()) {
        source = resolveSource(parentPath.get("init"));
        // ({ keys, values } = Object)
      } else if (parentPath.isAssignmentExpression()) {
        source = resolveSource(parentPath.get("right"));
        // !function ({ keys, values }) {...} (Object)
        // resolution does not work after properties transform :-(
      } else if (parentPath.isFunctionExpression()) {
        const grand = parentPath.parentPath;
        if (grand.isCallExpression() || grand.isNewExpression()) {
          if (grand.node.callee === parent) {
            source = resolveSource(grand.get("arguments")[key]);
          }
        }
      }

      for (const property of path.get("properties")) {
        if (property.isObjectProperty()) {
          const key = resolveKey(property.get("key"));
          // const { keys, values } = Object
          // const { keys, values } = [1, 2, 3]
          this.addPropertyDependencies(source, key);
        }
      }
    },

    BinaryExpression(path: NodePath) {
      if (path.node.operator !== "in") return;

      const source = resolveSource(path.get("right"));
      const key = resolveKey(path.get("left"), true);

      // 'entries' in Object
      // 'entries' in [1, 2, 3]
      this.addPropertyDependencies(source, key);
    },
  };

  return {
    name: "corejs3-usage",
    pre() {
      this.polyfillsSet = new Set();

      this.addUnsupported = function(builtIn) {
        const modules = Array.isArray(builtIn) ? builtIn : [builtIn];
        for (const module of modules) {
          this.polyfillsSet.add(module);
        }
      };

      this.addBuiltInDependencies = function(builtIn) {
        if (has(BuiltIns, builtIn)) {
          const BuiltInDependencies = BuiltIns[builtIn];
          this.addUnsupported(BuiltInDependencies);
        }
      };

      this.addPropertyDependencies = function(source = {}, key) {
        const { builtIn, instanceType, isNamespaced } = source;
        if (isNamespaced) return;
        if (PossibleGlobalObjects.has(builtIn)) {
          this.addBuiltInDependencies(key);
        } else if (has(StaticProperties, builtIn)) {
          const BuiltInProperties = StaticProperties[builtIn];
          if (has(BuiltInProperties, key)) {
            const StaticPropertyDependencies = BuiltInProperties[key];
            return this.addUnsupported(StaticPropertyDependencies);
          }
        }
        if (!has(InstanceProperties, key)) return;
        let InstancePropertyDependencies = InstanceProperties[key];
        if (instanceType) {
          InstancePropertyDependencies = InstancePropertyDependencies.filter(
            m => m.includes(instanceType) || CommonInstanceDependencies.has(m),
          );
        }
        this.addUnsupported(InstancePropertyDependencies);
      };
    },
    post({ path }: { path: NodePath }) {
      const filtered = intersection(polyfills, this.polyfillsSet, available);
      const reversed = Array.from(filtered).reverse();

      for (const module of reversed) {
        createImport(path, module);
      }
    },
    visitor: addAndRemovePolyfillImports,
  };
}
```

通过上面的源码了解@babel/preset-env的实现机制

corejs3、按需polyfill，不支持提案polyfill

```
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
          "node": "6.1.0",
          "esmodules": false,
        },
        "modules": false,
        "debug": true,
        "include": [],
        "exclude": [],
        "useBuiltIns": "usage",
        "corejs": {
          "version": 3,
          "proposals": false
        },
        "forceAllTransforms": false,
        "shippedProposals": false
      }
    ]
  ]
}
```
</details>

corejs3、按需polyfill，支持所有提案polyfill

```
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
          "node": "6.1.0",
          "esmodules": false,
        },
        "modules": false,
        "debug": true,
        "include": [],
        "exclude": [],
        "useBuiltIns": "usage",
        "corejs": {
          "version": 3,
          "proposals": true
        },
        "forceAllTransforms": false,
        "shippedProposals": false
      }
    ]
  ]
}
```

<h4>@babel/polyfill</h4>

babel插件默认只对语法进行转化，不会对api进行转化，所以诸如es6、es7的新内置函数WeakMap, Promise, 静态方法Array.from, Object.assign, 实例方法Array.prototype.includes, generator函数都是不会转化的，所以我们为了现在低版本浏览器的兼容，则需要引入垫片polyfill，确保在低版本浏览器上这些函数or方法能够正常运行

在babel7.4版本以后已被弃用，建议使用core-js/stable及regenerator-runtime/runtime来替代

在Node / Browserify / Webpack中的使用方式

```
node
require("@babel/polyfill"); || import "@babel/polyfill"; 在项目的开头位置引入

Webpack
建议这样写，也可以直接在入口文件引入
module.exports = {
  entry: ["@babel/polyfill", "./app/js"],
};

Browser
dist/polyfill.js

结合@babel/preset-env一起使用，需要注意的是根据useBuiltIns参数的不同而进行不同的引入方式

跟多polyfill的内容可以查看[深入理解polyfill](https://github.com/willson-wang/Blog/issues/66)
```

当我们引入polyfill之后，转化后的代码明显包含了两个问题，第一个污染了全局的Map，Set，Promise方法等，二，重复了生成了很多help函数。

污染全局函数，举个例子
我们自己写了一个插件，插件内使用到了Promise，然后这时候我们在我们插件内加了ployfill，等爱他人从npm上下载我们插件使用的时候，如果他们自己内部定义了Promise，那么这时候由于引入我们的库，自己定义的Promise被覆盖了

什么是helper函数,做一些通用辅助工作的

```
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};
```

既然我们在引入polyfill之后会污染全局变量及重复引入一些函数，那么有没有什么解决方法呢？有答案就是引入@babel/plugin-transform-runtime

<h4>@babel/plugin-transform-runtime</h4>

plugin-transform-runtime做3件事情
1. 引入@babel/runtime/regenerator插件，便于转化generator函数
2. 通过引入corejs来解决全局变量污染的问题
3. 将helper函数从外部引入，而不是每个需要的地方生成，减少重复代码

```
var promise = Promise.resolve();

通过plugin-transform-runtime转化之后
import _Promise from "@babel/runtime-corejs3/core-js-stable/promise";
```

```
class Person {}

没有添加runtime

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Person = function Person() {
  _classCallCheck(this, Person);
};

添加runtime
var _classCallCheck2 = require("@babel/runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var Person = function Person() {
  (0, _classCallCheck3.default)(this, Person);
};
```

corejs | helpers | regenerator | useESModules | 
----   | -----   | ------      | ------       |
corejs false, 2, 3 or `{ version: 2 , 3, proposals: boolean }`, defaults to false;注意，corejs：2仅支持全局变量（例如Promise）和静态属性（例如Array.from），而corejs：3还支持实例属性（例如[] .includes; | helpers：是否需要引入外部helpers函数 | regenerator： 是否自动引入generator | useESModules：是否进行esModule处理 |

不同的corejs参数，对应不同的runtime插件

```
false	npm install --save @babel/runtime
2	npm install --save @babel/runtime-corejs2
3	npm install --save @babel/runtime-corejs3
```

通过@babel/plugin-transform-runtime插件转化之后，会根据我们设置的corejs参数去做不同的处理polyfill处理

<h5>场景一、corejs为false</h5>

corejs为false时，只从@babel/runtime中引入了helper函数及_regeneratorRuntime

```
// Promise及findIndex都是没有做处理的
var arr = [1, 3, 5, 7];
var idx = arr.findIndex(function (item) {
  return item === 3;
});
var a = Promise.resolve(2);
a.then(function (res) {
  console.log(res);
});
var Circe = function Circe() {
  _classCallCheck(this, Circe);
};
```

<h5>场景二、corejs为2时</h5>

如corejs为2时，从@babel/runtime-corejs2中引入了helper函数、_regeneratorRuntime及对应全局属性的polyfill

```
// 会处理全局属性，避免全局变量污染
import _Promise from "@babel/runtime-corejs2/core-js/promise";
var arr = [1, 3, 5, 7];
var idx = arr.findIndex(function (item) {
  return item === 3;
});

var a = _Promise.resolve(2);

a.then(function (res) {
  console.log(res);
});

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};
```

<h5>场景三、corejs为3时</h5>

如corejs为3时，从@babel/runtime-corejs3中引入了helper函数、_regeneratorRuntime及对应全局属性、静态方法、原型方法、提案方法的polyfill
```
// 会处理全局属性、静态方法、原型方法
import _Promise from "@babel/runtime-corejs3/core-js-stable/promise";
import _findIndexInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/find-index";
var arr = [1, 3, 5, 7];

var idx = _findIndexInstanceProperty(arr).call(arr, function (item) {
  return item === 3;
});

var a = _Promise.resolve(2);

a.then(function (res) {
  console.log(res);
});

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};
```

<h5>场景四、corejs为3，且roposals为true</h5>

如corejs为3时,且proposals为true
```
// 会处理全局属性、静态方法、原型方法及提案
import _Promise from "@babel/runtime-corejs3/core-js-stable/promise";
import _findIndexInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/find-index";
import _matchAllInstanceProperty from "@babel/runtime-corejs3/core-js/instance/match-all";
var arr = [1, 3, 5, 7];

var idx = _findIndexInstanceProperty(arr).call(arr, function (item) {
  return item === 3;
});

var a = _Promise.resolve(2);

a.then(function (res) {
  console.log(res);
});

var Circe = function Circe() {
  _classCallCheck(this, Circe);
};

var matches = _matchAllInstanceProperty(str).call(str, regexp);
```

同时这些辅助函数及polyfill垫片都会从对应的@babel/runtime中引入

<h4>@babel/runtime</h4>

为@babel/plugin-transform-runtime插件提供helper方法

会根据@babel/plugin-transform-runtime插件的corejs参数做不同的引入

```
false	npm install --save @babel/runtime
2	npm install --save @babel/runtime-corejs2
3	npm install --save @babel/runtime-corejs3
```

<h4>@babel-polyfill与@babel-runtime的区别</h4>

@babel-polyfill包含core-js及regenerator-runtime这两个插件
@babel-runtime包含helper方法、regenerator,然后还有@babel/runtime-corejs2、@babel/runtime-corejs3里面都有少许区别

@babel-polyfill可以提供polyfill,而@babel-runtime是不提供的polyfill的，@babel/runtime-corejs2 || @babel/runtime-corejs3才提供polyfill, 另外@babel-polyfill可以单独使用，也可以结合@babel/plugin-transform-runtime插件使用，而@babel-runtime需要结合@babel/plugin-transform-runtime插件使用，二者结合@babel/plugin-transform-runtime时效果是一致的

@babel-polyfill与@babel/runtime-corejs2及@babel/runtime-corejs3的区别，相同点这三个插件都可以用来polyfill，不同点@babel-polyfill如果不是手动去添加不同api的polyfill的话，则需要配合env插件的useBuiltInsc按时来决定是按需polyfill还是全部polyfill，且都是全局污染的进行；而@babel/runtime-corejs2及@babel/runtime-corejs3则都是按需polyfill，还有就是@babel/runtime-corejs3还能对提案进行polyfill，而@babel/runtime-corejs2不支持

全局引入，会污染全局变量及修改原型链上的方法
```
import "core-js/modules/es6.promise";

var a = Promise.resolve(2);
a.then(function (res) {
  console.log(res);
});
```

模块的方式引入，不会污染全局的变量
```
import _Promise from "@babel/runtime-corejs2/core-js/promise";

var a = _Promise.resolve(2);
a.then(function (res) {
  console.log(res);
});
```

### 8. 访问者模式

<h4>AST遍历</h4>

先看一个例子
```
function square(n) {
  return n * n;
}
```

假设它的AST如下所示
```
{
  type: "FunctionDeclaration",
  id: {
    type: "Identifier",
    name: "square"
  },
  params: [{
    type: "Identifier",
    name: "n"
  }],
  body: {
    type: "BlockStatement",
    body: [{
      type: "ReturnStatement",
      argument: {
        type: "BinaryExpression",
        operator: "*",
        left: {
          type: "Identifier",
          name: "n"
        },
        right: {
          type: "Identifier",
          name: "n"
        }
      }
    }]
  }
}
```

我们使用traverse遍历节点
```
const parse = require('@babel/parser')
const traverse = require('@babel/traverse').default

const input = 'function square(n) {return n * n;}'

const ast = parse.parse(input)

traverse(ast, {
    enter(path) {
        console.log(`enter ${path.type}(${path.key})`)
    },
    exit(path) {
        console.log(`exit ${path.type}(${path.key})`)
    }
})
```

最终的整个遍历流程如下所示
```
进入 FunctionDeclaration
    进入 Identifier (id)
    走到尽头
    退出 Identifier (id)
    进入 Identifier (params[0])
    走到尽头
    退出 Identifier (params[0])
    进入 BlockStatement (body)
    进入 ReturnStatement (body)
        进入 BinaryExpression (argument)
        进入 Identifier (left)
        走到尽头
        退出 Identifier (left)
        进入 Identifier (right)
        走到尽头
        退出 Identifier (right)
        退出 BinaryExpression (argument)
    退出 ReturnStatement (body)
    退出 BlockStatement (body)
退出 FunctionDeclaration
```

那么通过上面的例子中我们可以发现两个问题

第一个问题traverse方法对ast节点进行了深度优先的遍历，遍历的过程如下所示

我们从FunctionDeclaration开始，并且我们知道它的内部属性（即：id，params，body），所以我们依次访问每一个属性及它们的子节点

接着我们来到id,id是一个Identifier（标识）类型，它没有包含任何有效信息的子节点属性，所以我们继续遍历

之后是 params，由于它是一个数组节点所以我们访问其中的每一个，然后它们都是 Identifier 类型的单一节点，然后我们继续遍历

此时我们来到了 body，这是一个 BlockStatement 并且也有一个 body节点，而且也是一个数组节点，我们继续访问其中的每一个

这里唯一的一个属性是 ReturnStatement 节点，它有一个 argument，我们访问 argument 就找到了 BinaryExpression

BinaryExpression 有一个 operator，一个 left，和一个 right。 Operator 不是一个节点，它只是一个值因此我们不用继续向内遍历，我们只需要访问 left 和 right

这个遍历过程被称之为[树形遍历](https://en.wikipedia.org/wiki/Tree_traversal)

第二个问题，在遍历的过程中我们可以获取当前具体的节点，如FunctionDeclaration、Identifier等等，而在遍历的时候有一种模式，可以获取当前具体节点，我们把这种方式叫做[访问者模式（visitor）](https://en.wikipedia.org/wiki/Visitor_pattern)

<h4>babel中访问者模式的使用方式</h4>

1. 创建一个访问者对象,然后这个访问者对象具有不同节点类型的方法

```
const visitor = {
    NumberLiteral() {

    },
    CallExpression() {

    }
}
```

2. 当我们遍历我们的ast时，进入一个匹配的节点类型时，我们将会调用访问者对应的方法,然后在调用的时候，传入当前节点相关的信息，以便我们在方法内操作节点

```
const visitor = {
    NumberLiteral(path) {

    },
    CallExpression(path) {

    }
}
```

3. 因为采用的是树形遍历，当我们向下遍历的时候，将会到达树分支的尽头，当我们遍历完每个树分支的时候，我们又需要退出树分支，所以当我们向下遍历的时候我们enter进入树的每个节点，当向下遍历完之后我们退出exit每个节点，所有最终的访问者形式如下所示

```
const visitor = {
    NumberLiteral: {
        enter(path) {},
        exit(path) {}
    },
    CallExpression: {
        enter(path) {},
        exit(path) {}
    }
}
```

所以到这里我们知道babel中转化操作AST使用的是访问者模式，由这个访问者(Visitor)来；1.进行统一的遍历操作，2.提供节点的操作方法，3.响应式维护节点之间的关系；而插件(设计模式中称为‘具体访问者’)只需要定义自己感兴趣的节点类型，当访问者访问到对应节点时，就调用插件的访问(visit)方法。

那么babel插件是怎么被应用的

Babel 会按照插件定义的顺序来应用访问方法，比如你注册了多个插件，babel-core 最后传递给访问器的数据结构大概长这样：

```
{
  Identifier: {
    enter: [plugin-xx, plugin-yy,] // 数组形式
  }
}
```

当进入一个节点时，这些插件会按照注册的顺序被执行。大部分插件是不需要开发者关心定义的顺序的，有少数的情况需要稍微注意以下，例如plugin-proposal-decorators:

```
{
  "plugins": [
    "@babel/plugin-proposal-decorators",     // 必须在plugin-proposal-class-properties之前
    "@babel/plugin-proposal-class-properties"
  ]
}
```

所有插件定义的顺序，按照惯例，应该是新的或者说实验性的插件在前面，老的插件定义在后面。因为可能需要新的插件将 AST 转换后，老的插件才能识别语法（向后兼容）。下面是官方配置例子, 为了确保先后兼容，stage-*阶段的插件先执行:

```
{
  "presets": ["es2015", "react", "stage-2"]
}
```

通过上面的了解我们知道，插件(设计模式中称为‘具体访问者’)只需要定义自己感兴趣的节点类型，当访问者访问到对应节点时，就调用插件的访问(visit)方法。这时babel会为我们的访问者方法传入一个path参数，那么这个path参数的作用是什么呢？

<h4>path路径</h4>

path参数的作用就是关联节点，是表示两个节点之间连接的对象；把这个AST看成一棵树，树上节点之前的关联关系通过path来表示；这样最终是用一个可操作和访问的巨大可变对象表示节点之间的关联关系

例如,如果有下面这样一个节点及其子节点︰

```
{
  type: "FunctionDeclaration",
  id: {
    type: "Identifier",
    name: "square"
  },
  ...
}
```

将子节点 Identifier 表示为一个路径（Path）的话，看起来是这样的

```
{
  "parent": {  // 父节点FunctionDeclaration
    "type": "FunctionDeclaration",
    "id": {...},
    ....
  },
  "node": { // 当前节点Identifier
    "type": "Identifier",
    "name": "square"
  }
}
```

同时路径path还包含如下信息

```
{
  "parent": {...}, // 父节点
  "node": {...},  // 当前节点
  "hub": {...},
  "contexts": [],
  "data": {},
  "shouldSkip": false,
  "shouldStop": false,
  "removed": false,
  "state": null,
  "opts": null,
  "skipKeys": null,
  "parentPath": null,
  "context": null,
  "container": null,
  "listKey": null, // 如果节点在一个数组中，这个就是节点数组的键
  "inList": false,
  "parentKey": null,
  "key": null,  // 节点所在的键或索引
  "scope": null, // 当前节点所在的作用域
  "type": null, // 节点类型
  "typeAnnotation": null
  ... 还有很多方法，实现增删查改
}
```

在某种意义上，path路径是一个节点在树中的位置以及关于该节点各种信息的响应式 Reactive 表示。 当你调用一个修改树的方法后，路径信息也会被更新

也就是AST在转化的时候产生的副作用，已经被babel处理了，那什么是副作用，举个列子

将`function square(n) {return n * n}`
```
traverse(ast, {
    ReturnStatement(path) {
        const new = t.expressionStatement(t.callExpression(t.memberExpression('console', t.identifier('log'), false, false), path.node.argument))
        path.replaceWith()
    }
})
```

这个例子中将return n * n 转化为console.log(n * n),那么相当于这一部分的AST节点发生了变化，如果如果靠插件的开发者来维护AST显然是不可能的，所以只能是babel的来维护AST，插件开发者只管对AST节点进行增删改查即可；

另外我们在看一个例子

```
const a = 1
const b = 1
function square (n) {
    console.log(a, b)
    return function () {
        const a = 1
        return a * n * n
    }
}
```

如果我们需要把函数传入的参数n名称改为a

```
traverse(ast, {
    FunctionDeclaration(path) {
        // 获取参数及参数名称
        const param = path.node.params[0]
        if (!param) {
            return
        }

        const paramName = param.node.name
        // 然后我们又在FunctionDeclaration内进行递归遍历
        path.traverse({
            Identifier(path) {
                if (path.node.name === paramName) {
                    path.replaceWidth(t.identifier('a'))
                }
            }
        })
    }
})

console.log(generate(ast).code)
// function square (a) {
//    console.log(a, b)
//    return function () {
//        const a = 1
//        return a * a * a
//    }
// }
```

<h4>作用域Scope</h4>

显然console.log(a, b)的行为已经被破坏了，因为a已经成了传入的参数a，而不是外层的变量a；所以我们需要换了变量名，如c等等；所以从这个例子我们可以看出来，当我们在操作AST是，需要考虑作用域Scope；babel中为了我们能够更好的操作AST，提供了Scope，每个Scope包含如下信息

```
{
  path: path,
  block: path.node, 
  parentBlock: path.parent,  // 父节点
  parent: parentScope, // 父作用域
  bindings: [...]  // 当前作用的所有绑定
}
```

在词法区块(block)中，由于新建变量、函数、类、函数参数等创建的标识符，都属于这个区块作用域. 这些标识符也称为绑定(Binding)，而对这些绑定的使用称为引用(Reference)

Scope 对象和 Path 对象差不多，它包含了作用域之间的关联关系(通过parent指向父作用域)，收集了作用域下面的所有绑定(bindings), 另外还提供了丰富的方法来对作用域仅限操作

每个bingding对象如下所示

```
{
  identifier: t.Identifier;
  scope: Scope;
  path: NodePath;
  kind: "var" | "let" | "const" | "module";
  referenced: boolean;
  references: number;              // 被引用的数量
  referencePaths: NodePath[];      // 获取所有应用该标识符的节点路径
  constant: boolean;               // 是否是常量
  constantViolations: NodePath[];
}
```

有了这些信息你就可以查找一个绑定的所有引用，并且知道这是什么类型的绑定(参数，定义等等)，查找它所属的作用域，或者拷贝它的标识符。 你甚至可以知道它是不是常量，如果不是，那么是哪个路径修改了它

然后我们在回过头来看之前修改变量名的例子,现在我们需要重命名n变量为a的时候，不仅需要考虑副作用域，而且还需要考虑子级作用域，完善后的写法

```
const getUid() {
    let uid = 0
    return function () {
        return `_${(uid++) || ''}`
    }
}
traverse(ast, {
    FunctionDeclaration(path) {
        // 获取参数及参数名称
        const param = path.node.params[0]
        if (!param) {
            return
        }

        const paramName = param.node.name
        // 获取当前参数名的绑定关系
        const currentBinding = path.scope.getBinding(paramName)

        const gid = getUid()

        // 然后遍历找出新建的没有被占用的变量名，比如新的变量名为_0,那么需要去父级及子级查找是否有变量名_0的绑定
        while(true) {
            const newName = gid()

            // 首先看下父作用域是否有该变量名的绑定
            if (path.scope.parentHasBinding(newName)) {
                continue
            }

            // 检查当前作用域是否定义了该变量
            if (path.scope.hasBingding(newName)) {
                continue
            }

            // 在检查参数的引用情况，如果引用所在的作用域已经定义了同名的变量，则也不能更改名称
            if(currentBinding.references > 0) {
                const hasBinding = currentBinding.referencePaths.some(() => {
                    return refNode.scope !== path.scope && refNode.scope.hasBinding(newName)
                })

                if (hasBinding) {
                    continue
                }
            }

            break
        }
        
        // 如果都不存在新的变量名及引用则进行替换
        const i = t.identifier(newName)
        currentBinding.referencePaths.forEach(p => p.replaceWith(i))
        param.replaceWith(i)
    }
})
```

上面的例子虽然没有什么实用性，而且还有Bug(没考虑label)，但是正好可以揭示了作用域处理的复杂性

然而Babel的 Scope 对象其实提供了一个generateUid方法来生成唯一的、不冲突的标识符。我们利用这个方法再简化一下我们的代码:


```
traverse(ast, {
    FunctionDeclaration(path) {
        // 获取参数及参数名称
        const param = path.node.params[0]
        if (!param) {
            return
        }

        const paramName = param.node.name
        // 获取当前参数名的绑定关系
        const currentBinding = path.scope.getBinding(paramName)
        
        // 如果都不存在新的变量名及引用则进行替换
        const i = path.scope.generateUidIdentifier('uid')
        currentBinding.referencePaths.forEach(p => p.replaceWith(i))
        param.replaceWith(i)
    }
})
```

还可以使用babel提供的rename直接修改变量名称

```
traverse(ast, {
    FunctionDeclaration(path) {
        // 获取参数及参数名称
        const param = path.node.params[0]
        if (!param) {
            return
        }

        const paramName = param.node.name
        
        // 如果都不存在新的变量名及引用则进行替换
        const i = path.scope.generateUid('uid')
        path.scope.rename(paramName, i)
    }
})
```

到这里我们对AST节点的处理已经有了一定的了解，那么接下来让我们一起动手写一个babel插件


### 9. 怎样写一个babel插件

在写插件之前我们在了解下，babel提供操作AST节点及scope的方法

常用Path操作方法

<h4>新增节点</h4>

当前节点之前插入新节点 insertBefore(nodes: [Object])

```
BooleanLiteral(path) {
  const nodes = [
    t.returnStatement()
  ];

  path.insertBefore(nodes);
}
```

当前节点之后插入新节点 insertAfter

```
BooleanLiteral(path) {
  const nodes = [
    t.returnStatement()
  ];

  path.insertBefore(nodes);
}
```

<h4>删除节点</h4>

删除当前remove

```
BooleanLiteral(path) {
  path.remove();
}
```

<h4>替换节点</h4>

单节点替换 replaceWith(replacement: Object)

```
BooleanLiteral(path) {
  path.replaceWithMultiple(t.identifier("bar"));
}
```

多节点替换 replaceWithMultiple(nodes: [Object])

```
BooleanLiteral(path) {
  const nodes = [
    t.identifier("foo"),
    t.identifier("bar")
  ];

  path.replaceWithMultiple(nodes);
}
```

常用Scope操作方法

generateUidIdentifier(name: string = "temp") 生成一个uniq ID并返回一个标识符

```
Identifier(path) {
  path.node.name = path.scope.generateUidIdentifier().name;
}
```

```
in
var foo = "test";

out
var _temp = "test";
```

generateUid(name: string = "temp")生成一个uniq ID并返回一个字符串

```
Identifier(path) {
  path.node.name = path.scope.generateUid().name;
}
```

```
in
var foo = "test";

out
var _temp = "test";
```

rename(oldName: string, newName?: string, block?: Object) 重命名当前作用域内的某个变量名

```
Identifier(path) {
  path.scope.rename("foo");
}
```

```
in 

var foo = "test";

out

var _foo = "test";
```

getBinding(name: string) 获取某个name对应的绑定关系

getBindingIdentifier(name: string) 获取某个name对应的绑定关系的标识

getOwnBindingIdentifier(name: string) 获取name所在作用域对应的绑定关系的标识

hasOwnBinding(name: string)  判断name是否定义在当前作用域

parentHasBinding(name: string, noGlobals?: boolean) 判断name是否定义父前作用域

```
var foo = 'test'
var foo1 = "test1";
var foo2 = "test2";
var foo3 = "test3";

function add (a, b) {
    const c = '10'
    return function () {
        return foo + a + b + c
    }
}

function add2() {
    return foo + foo1
}

path.scope.getBinding('foo').references // 3 
path.scope.getBinding('foo1').references // 2 
```

下面让我们一起写两个插件

<h4>针对传入的library进行按需编译</h4>

```
module.exports = function ({ types: t }) {
    return {
        visitor: {
            ImportDeclaration(path, {opts}) {
                if (!opts.library) return
                let librarys = []
                if (Array.isArray(opts.library)) {
                    librarys = opts.library
                } else {
                    librarys = opts.library.split(',')
                }
                // get方法获取某个属性的路径，如果是数组的话，就直接是一个数组
                const specifiers = path.get('specifiers');
                if (!specifiers.length) return;
                const source = path.get('source');
                const library = source.node.value
                if (librarys.indexOf(library) > -1) {
                    const nodes = specifiers.map((it) => {
                        const localNode = it.get("local").node
                        const importedNode = it.get("imported").node
                        return t.ImportDeclaration(
                            [t.importDefaultSpecifier(localNode)], 
                            t.StringLiteral(`${library}/${importedNode.name}`)
                        )
                    })
                    path.replaceWithMultiple(nodes)
                }
            }
        }
    }
}
```

<h4>箭头函数转化为普通函数</h4>

```
module.exports = function ({ types: t }) {
  return {
      name: '',
      visitor: {
          ArrowFunctionExpression(path) {
              if (!path.isArrowFunctionExpression()) return

              const body = path.get("body");
              const bodyNode = body.node;
              if (Array.isArray(body)) {
                throw new Error("Can't convert array path to a block statement");
              }
            
              if (!bodyNode) {
                throw new Error("Can't convert node without a body");
              }
              // 匹配有() => {}花括号的格式
              if (body.isBlockStatement()) {
                // 方法1采用节点赋值的方式更改
                // body不做改动
                path.node.body = bodyNode;
                // 改成普通函数类型FunctionExpression
                path.node.type = "FunctionExpression";
                // 将函数名致空
                path.node.id = t.identifier('')

                // 方式2采用path提供的替换节点及types提供的节点生成方法先生成节点在替换
                // path.replaceWith(t.functionExpression(t.identifier(''), path.node.params, body.node));
                return
              }

              // 匹配没有花括号的形式
              const statements = [];
              // 判断返回值类型
              if (path.isFunction()) {
                statements.push(t.returnStatement(body.node));
              } else {
                statements.push(t.expressionStatement(body.node));
              }
              // 判断函数内是否使用了this
              path.get('body').traverse({
                  ThisExpression(pa) {
                    const id = pa.scope.generateUidIdentifierBasedOnNode(pa.node.id);
                    // 往包含this的父作用域创建一个新的变量，值为this
                    pa.scope.parent.push({ id, init: pa.node })
                    // 将当前this替换为上面生成的变量名
                    console.log('id', id)
                    pa.replaceWith(id)
                  }
              })
              // 创建花括号
              path.node.body = t.blockStatement(statements);
              path.node.type = "FunctionExpression";
              path.node.id = t.identifier('')
              
          }
      }
  }
}
```



### 10. babel推荐配置

通过上面的了解，我们已经知道babel的架构及核心插件的作用，所以在使用的时候，可以针对应用的类型来合理使用babel

常规业务项目，推荐使用env-useBuiltIns-usage、corejs3,且配合@babel/plugin-transform-runtime，corejs-false,因为我们不需要考虑全局污染带给我们的影响，因为这些都是可控的，babel配置如下所示

```
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
          "node": "6.1.0",
          "esmodules": false,
        },
        "modules": false,
        "debug": true,
        "include": [],
        "exclude": [],
        "useBuiltIns": "usage",
        "corejs": {
          "version": 3,
          "proposals": false
        },
        "forceAllTransforms": false,
        "shippedProposals": false
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": false,
        "helpers": true,
        "regenerator": true,
        "useESModules": false
      }
    ]
  ]
}
```

库or插件则，推荐使用env-useBuiltIns-false,使用@babel/runtime-corejs3配合@babel/plugin-transform-runtime，corejs-3,因为我们需要考虑全局污染带给插件使用者的影响，babel配置如下所示

```
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "browsers": "ie >= 9",
          "node": "6.1.0",
          "esmodules": false,
        },
        "modules": false,
        "debug": true,
        "include": [],
        "exclude": [],
        "useBuiltIns": false,
        "forceAllTransforms": false,
        "shippedProposals": false
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3,
        "helpers": true,
        "regenerator": true,
        "useESModules": false
      }
    ]
  ]
}
```

### 11. 总结

babel现在已经不仅仅是一个将es6+语法转换为es5语法的工具，借助 Babel插件的力量，我们在JavaScript的世界里还有着非常巨大的想象空间，比如添加如jsx一样的自定义语法，换一个generator将javascript代码转化成其它语言的代码等等；

总之就像babel功能列表最后一项And more！

参考链接：

https://babeljs.io/docs/en/
https://github.com/babel/babel/tree/master/packages
https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md
https://babeljs.io/blog/2015/01/12/6to5-esnext
https://www.infoq.com/news/2015/02/babel-new-name-for-6to5/
https://juejin.im/post/5d94bfbf5188256db95589be
https://astexplorer.net/
https://github.com/jamiebuilds/the-super-tiny-compiler
http://www.ruanyifeng.com/blog/2016/09/software-architecture.html
https://babel.docschina.org/blog/2018/08/27/7.0.0

