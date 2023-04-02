---
  title: 了解ESLint各个parser之间的关系
  date: 2021-06-27T14:48:33Z
  lastmod: 2021-06-27T14:49:04Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/eslint.png']
  bibliography: references-data.bib
---


我们在项目中使用了处在提案1阶段的语法时，比如

```
export foo from 'foo' 
export foo, { bar } from "foo";
```

该语法还处于1阶段，具体查看[proposal-export-default-from](https://github.com/tc39/proposal-export-default-from) [stage-1-proposals](https://github.com/tc39/proposals/blob/master/stage-1-proposals.md)

当我们使用eslint检查的时候会报如下错误

```
Parsing error: Unexpected token foo eslint
export foo from './foo'
```

然后网上去找资料，安装@babel/eslint-parser包可以通过这个校验

```
yarn add @babel/core @babel/eslint-parser -D

{
  parser: "@babel/eslint-parser",
  parserOptions: { 
    sourceType: "module",
    allowImportExportEverywhere: false,
  },
  "plugins": ["@babel"]
};
```

安装完成之后再次执行eslint检查,可能会提示下面的错误

```
Parsing error: No Babel config file detected for /Users/wangks/Documents/f/practice/src/stage1/foo.js. Either disable config file checking with requireConfigFile: false, or configure Babel so that it can find the config files
```

新建一个空的.babelrc文件

在重新eslint .

这时候可能提示如下错误
```
Parsing error: This experimental syntax requires enabling the parser plugin: 'exportDefaultFrom' (1:7)
```

然后我们安装对应的babel插件

```
yarn add @babel/plugin-proposal-export-default-from -D
```

在.babelrc内添加plugins
```
{
    "plugins": [
        "@babel/plugin-proposal-export-default-from"
    ]
}
```

在重新eslint .

校验通过了

虽然通过了验证，但是这里有会有一些疑问？

- eslint的parser可以指定不同的解析器，解析器的作用是什么？
- eslint为什么对于阶段1的语法解析不出来？
- @babel/eslint-parser的作用是什么？

### 为什么parser可以指定不同的解析器，解析器的作用是什么？

首先我们看下eslint检查代码的原理：

- ESLint uses Espree for JavaScript parsing.
- ESLint uses an AST to evaluate patterns in code.

从eslint的lint原理来看，需要将代码转换成ast，而这个将code转换成ast，则需要一个解析器，而eslint选择的解析器则是[Espree](https://github.com/eslint/espree)，而Espree最开始是从[Esprima](https://github.com/jquery/esprima)中拉出来的一个分支

### eslint为什么对于阶段1的语法解析不出来？

原因：ESLint's parser only officially supports the latest final ECMAScript standard

Once a language feature has been adopted into the ECMAScript standard (stage 4 according to the TC39 process), we will accept issues and pull requests related to the new feature, subject to our contributing guidelines.

也就是说[eslint](https://github.com/eslint/eslint/blob/a675c89573836adaf108a932696b061946abf1e6/README.md#what-about-experimental-features)只支持已发布了的ECMAScript标准语法及进入到stage 4阶段的实验性语法

### @babel/eslint-parser的作用是什么？

我们知道新语法从提案到发布是需要经历比较长的一段时间，而有些新语法是会带来不错的开发体验，所以我们会选择在项目中使用这些新语法，而我们一般在项目中都会借助babel来将我们的代码从es6+转化成es5的代码，及选择babel插件来支持实验性的语法;

从eslint知道，对于JS的实验性（例如新功能）和非标准（例如 Flow 或 TypeScript 类型）语法是不支持检测的，那么我们在实际项目开发的时候想要对这些法语进行支持，则通过@babel/eslint-parser解析器即可，@babel/eslint-parser 是一个解析器，它允许 ESLint 在 Babel 转换的源代码上运行

@babel/eslint-parser将代码生成ast的时候，会被转换成 ESLint 可以理解的 ESTree兼容结构；这样我们就可以在标准的语法上，针对实验性或者非标准的语法做lint检测

@babel/eslint-parser的使用
```
yarn add eslint @babel/core @babel/eslint-parser @babel/eslint-plugin -D

// 需要注意当使用@babel/eslint-parser时，parserOptions部分属性可能不生效，因为parserOptions的属性是针对默认的parser设置的
module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: { 
    sourceType: "module",
    allowImportExportEverywhere: false,
    ecmaFeatures: {
      globalReturn: false,
    },
    babelOptions: {
      configFile: "path/to/config.js",
    },
  },
  "plugins": ["@babel"]
};
```

也可以只针对部分js文件使用@babel/eslint-parser解析
```
module.exports = {
  rules: {
    indent: "error",
  },
  overrides: [
    {
      files: ["files/transformed/by/babel/*.js"],
      parser: "@babel/eslint-parser",
      "plugins": ["@babel"]
    },
  ],
};
```

@babel/eslint-parser 将code转换成ESLint可以理解的ESTree兼容结构，但它无法更改内置规则以支持实验性语法。
@babel/eslint-plugin 从新定义实验性语法的lint规则

<b>到这里我们已经知道，针对js的lint，如果我们在项目开发的时候只选择标准语法，不使用实验性的语法或者非标准性的语法，我们使用默认的eslint解析器即可，反之则选择babel/eslint-parser</b>

### 我们现在已经知道js的lint该怎么选了，那么ts的lint要怎么做呢？

首先最开始我们的ts项目都是通过tslint来做ts代码的lint检测,eslint是做不到ts代码的代码检测的

eslint为什么做不到ts代码的检测呢？

我们先看下TypeScript是什么，TypeScript是javascript的超集，在javascript基础上加了静态类型定义与分析；而eslint是没有去支持这些功能的

tslint又是什么呢？

tslint是一个专门为基于上述 TypeScript AST 格式而编写的 linter。

专门的tslint有优点也有缺点；

- 优点：是不需要任何工具来协调AST格式之间的差异，
- 缺点：是该工具因此无法重用之前在JavaScript生态系统中围绕linting所做的任何工作，它必须重新实现所有内容从头开始。从规则到自动修复功能等等。

最后经过tslint的核心开发者2019年决定放弃tslint，转而支持 typescript-eslint;具体文章可参考[TSLint in 2019](https://blog.palantir.com/tslint-in-2019-1a144c2317a9);后续TypeScript 团队自己也宣布了将 TypeScript 代码库从 TSLint 迁移到 typescript-eslint 的计划[Migrate the repo to ESLint](https://github.com/microsoft/TypeScript/issues/30553)


### 而typescript-eslint又是什么呢？

ESLint 和 TypeScript 都依赖于将源代码转换为AST的数据格式来完成它们的工作。实际情况是ESLint和TypeScript彼此使用不同的AST；

typescript-eslint 的存在就是让我们可以一起使用 ESLint和TypeScript，而无需担心任何可能的实现细节差异。

typescript-eslint的使用方式

```
yarn add -D eslint typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
};
```

@typescript-eslint/parser 将typescript转换成eslint能过理解的estree

到这里我们知道了针对ts文件的lint检测需要通过@typescript-eslint/parser来做？那么问题来了？

1、@typescript-eslint/parser支持实验性的语法或者非标准性的语法吗？

要看@typescript-eslint/parser是否支持实验性的语法或者非标准性的语法，我们需要先看下typescript是否支持？

没有在typescript的文档内看到有对实验性的语法或者非标准性的语法的说明，只在相关issues内看到有说到？

We have no plans to implement any proposals unless they hit stage 3 and we have high confidence in them. 
[TypeScript Roadmap: January - June 2019](https://github.com/microsoft/TypeScript/issues/29288)
[Nightly-only experimental features](https://github.com/microsoft/TypeScript/issues/28152)
[Suggestion: Experimental Support for ECMAScript Stage 1/2 Proposals](https://github.com/microsoft/TypeScript/issues/19044)

所以typescript是基本不支持实验性的语法或者非标准性的语法

那么@typescript-eslint/parser也就不可能去支持实验性的语法或者非标准性的语法

2、@babel/eslint-parser与@typescript-eslint/parser之间有什么异同？

相同点：都是用于eslint代码检测的一种解析器

不同点：一个用于支持实验性的js语法，一个支持ts语法

概括起来就是@babel/eslint-parser支持TypeScript本身不支持的额外语法，但是不支持ts的类型检查，而typescript-eslint支持ts的类型检查

最终由于它们是由不同底层工具驱动的独立项目，因此目前两个项目的维护者，不打算将它们结合起来。

具体原因参考[What about Babel and @babel/eslint-parser](https://github.com/typescript-eslint/typescript-eslint#what-about-babel-and-babeleslint-parser)

### 总结
1. eslint常用的解析器有：babel/eslint-parser、@typescript-eslint/parser、espree、esprima
2. 对js项目，需要支持实验性语法的lint检测，可以使用@babel/eslint-parser，反之则使用默认解析器
3. 对于ts项目，使用@typescript-eslint/parser，不推荐使用实验性阶段的语法，除非是typescript本身支持的实验性语法

### 推荐配置

js项目不支持实验性语法配置

```
yarn add eslint eslint-config-standard eslint-plugin-promise eslint-plugin-import eslint-plugin-node -D
{
  parserOptions: { 
    "sourceType": "module",
    "ecmaVersion": 2021,
  },
  "extends": [
    "standard"  
  ],
};
```

js项目支持实验性语法配置

```
yarn add eslint @babel/core @babel/eslint-parser -D

{
  parser: "@babel/eslint-parser",
  parserOptions: { 
    sourceType: "module",
    allowImportExportEverywhere: false,
  },
  "plugins": ["@babel"]
};
```

ts项目配置
```
yarn add -D eslint typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
};
```

### 补充eslint中extends、plugins、rules之间的区别

先看rules，rules的具体作用,就是实际的eslint检查规则，一条规则对应一种语法检查
```
module.exports = {
  rules: {
    'quotes': 'single',
    'space-before-blocks': 'always',
  }
};
```

当我们把项目内的eslint规则都定义好，最后如果我们想要在其它项目内仍然复用当前的eslint配置，最直接的方法，当然是拷贝一份过去，但是这样太麻烦了，也不利于后面的规则变更，所以有了extends的用武之地

extends的作用就是封装一份常用的eslint配置并当成npm包来使用，需要用到的项目安装对应的npm包,并在extends内引入即可

```
module.exports = {
  "extends": [
    "standard"  
  ],
  rules: {
    'quotes': 'single',
    'space-before-blocks': 'always',
  }
};
```

允许 extends 多个模块，如果规则冲突，位置靠后的包将覆盖前面的。rules 中的规则相同，并且优先级恒定高于 extends

最后我们知道一条规则对应一种检查，那么eslint不可能提供所有的规则来覆盖我们的语法，这时候eslint提供了plugin，允许自定义plugin定义语法检查规则

```
module.exports = {
  "extends": [
    "standard"  
  ],
  "plugins": [
    "import",
    "node",
    "promise"
  ],
  rules: {
    'quotes': 'single',
    'space-before-blocks': 'always',
  }
};
```

