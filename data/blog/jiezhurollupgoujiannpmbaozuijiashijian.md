---
  title: 借助rollup构建npm包最佳实践
  date: 2021-08-12T12:32:53Z
  lastmod: 2021-08-12T12:33:43Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

## 目录

- [背景](#背景)
- [使用](#使用)
- [rollup插件](#rollup插件)
- [最佳实践](#最佳实践)
- [FAQ](#FAQ)
- [总结](#总结)



### 背景

公司鉴于经常开发`npm`包，于是需要统一一下`npm`包的开发规范，总结一个可以通用的`npm`包模版

开发`npm`通用模版，最关的就是构建工具的选择，该构建工具需要包含如下功能

- 构建快速
- 能过输出不同模块规范的包
- 支持`babel`转化
- 支持`typescript`
- 学习成本低
- 支持tree-shaking

鉴于上述功能，最终选择了rollup来作为我们构建npm包的工具，理由如下

- `rollup`相对于`webpack`更轻量
- `rollup`相对于`webpack`更适合构建`npm`包的场景
- `rollup`目录社区也是越来越活跃，满足上述的功能
- `rollup`相对于`webpack`学习成本更低



### 使用

1. 全局安装

```js
yarn global add rollup
```



2. 项目内安装

```js
yarn add rollup -D
```



`npm`包打包构建默认选择项目内安装方式，便于`rollup`版本的升级



3. 命令行指定配置

```js
// 全局命令使用
rollup ./src/main.js --file ./dist/bundle.js --format cjs

// 项目内安装使用
./node_modules/.bin/rollup ./src/main.js --file ./dist/bundle.js --format cjs

// 项目内package.json scripts内使用
"build": "rollup ./src/main.js --file ./dist/bundle.js --format cjs"
```



4. 命令行指定配置文件

```js
// rollup.config.js
export default {
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'cjs'
  }
};

rollup -c ./rollup.config.js
```



5. rollup.config.js参数解析

```js
// rollup.config.js

export default { // 可以是一个数组
  // 核心输入参数
  external, // 排除不需要被打包到文件内的模块
  input, // entry，可以有多个输入
  plugins, // 插件列表

  // 高级参数
  cache, 
  onwarn,
  preserveEntrySignatures,
  strictDeprecations,

  // danger zone
  acorn,
  acornInjectPlugins,
  context,
  moduleContext,
  preserveSymlinks,
  shimMissingExports,
  treeshake,

  // experimental
  experimentalCacheExpiry,
  perf,

  output: { 可以是数组，同一个输入有多份输出
    // 核心输出参数
    dir,  // 多entry的时候需要这个参数
    file, // 单entry的时候需要定义这个参数,与dir参数不能同时使用
    format, // 输出文件的模块规范，amd、cmd、es module
    globals, // 针对输出umd/iife格式的时候，导入的全局变量 
    name, // 针对输出iife/umd格式时的，包的全局变量名称或者自执行之后接收变量
    plugins, // 此插件仅处理该output内容，仅限于使用在 bundle.generate() 或 bundle.write() 期间运行的钩子的插件，即在 Rollup 的主要分析完成之后

    // advanced output options
    assetFileNames, // 自定义输出文件的名称[extname][]
    banner,
    chunkFileNames, // 异步加载chunk [hash][format][name]
    compact, 
    entryFileNames, // 入口chunk [name][hash][format]
    extend,
    footer,
    hoistTransitiveImports, // 模块导入优化项
    inlineDynamicImports,
    interop, // 导入外部模块的方式
    intro,
    manualChunks, // 提取chunk
    minifyInternalExports,
    outro,
    paths, // 将模块id替换成路径，比如资源换成cnd路径
    preserveModules,  // 生成的模块按照原目录结构生成
    preserveModulesRoot, // 配合preserveModules使用
    sourcemap,
    sourcemapExcludeSources,
    sourcemapFile,
    sourcemapPathTransform,
    validate,

    // danger zone
    amd,
    esModule,
    exports, // 模块内部导出方式
    externalLiveBindings,
    freeze,
    indent,
    namespaceToStringTag,
    noConflict,
    preferConst,
    sanitizeFileName,
    strict,
    systemNullSetters
  },

  watch: {
    buildDelay,
    chokidar,
    clearScreen,
    skipWrite,
    exclude,
    include
  } | false
};
```



### rollup插件

#### 常用插件

`rollup`默认只能识别es module，原因是`tree-shaking`的条件就是需要es module才能进行，而es module能够进行`tree-shaking`的原因是，es module是静态模块导入，我们在引入一个模块的时候就已经确定了该模块导出的内容，所以我们在借助rollup来进行`npm`包开发的时候，可能会引入一写第三方`npm`包，而目前很多第三方`npm`包都使用的是commonjs模块规范导出的模块，所以在开发的时候需要借助`rollup`的插件来帮助我们完成npm包的开发



我们先定义下我们常用的`npm`包开发，需要做哪些事情

1. javascript工具库，只包含javascript代码
   - 基于`typescrip`t开发，所以我们需要能够将ts转化成js的插件
   - 能过进行语法转换与polyfill，避免其它项目使用的时候，还需要在项目的`babel-loader`那里再来处理我们的npm包
   - 能够处理外部引入的第三方`npm`包
   - dist目录下能够分别生成符合es module 与 commonjs 规范的包
2. 组件库，即包含js也包含css
   - 基于`typescript`开发，所以我们需要能够将ts转化成js的插件
   - 能过进行语法转换与polyfill，避免其它项目使用的时候，还需要在项目的`babel-loader`那里再来处理我们的`npm`包
   - 能够处理外部引入的第三方`npm`包
   - 能过生成dist目录与es目录，分包包含符合commonjs规范与es module规范的包

##### 基于typescript开发

```js
yarn add @rollup/plugin-typescript -D
```

```js
// rollup.config.js
plugins: [
    typescript({
      tsconfig: './tsconfig.mutil.json', // 解决插件没有应用 tsconfig 内的配置
    }),
  ],
```



##### 基于babel做语法转换与polyfill

```js
yarn add @rollup/plugin-babel -D
```

```js
// rollup.config.js
plugins: [
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      configFile: path.resolve(__dirname, '.babelrc'),
    })
  ],
  
or

plugins: [
    getBabelOutputPlugin({
        configFile: path.resolve(__dirname, '.babelrc'),
      }),
  ],
```

```js
// .babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "debug": true
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "absoluteRuntime": false,
        "corejs": {
          "version": 3,
          "proposals": false
        },
        "helpers": true,
        "regenerator": true
      }
    ]
  ]
}
```



注意babel与getBabelOutputPlugin方法的区别

- babel是getBabelInputPlugin的别名，表示先用babel处理代码，然后在把代码交给rollup处理
- getBabelOutputPlugin，表示先用rollup处理代码，然后在把代码交给babel处理

二者之前有细微的差异，前者可以包含includes、excludes参数，后者不能使用includes、excludes参数



借助`@babel/plugin-transform-runtime`插件解决polyfill而不是`@babel/preset-env`解决ployfill的原因是前者是无污染的polyfill后者是有污染的polyfill

目前前端处理js polyfill的方式主要有这两种

- 借助`polypill.io`来添加垫片

- 借助`babel`来处理ployfill，而`babel`实际上借助的`core-js`来实现具体的ployfill功能

  - `core-js`目前分为2个主要版本2.x与3.x，二者的区别主要是代码目录的划分与模块命名不一致

  - `babe`处理polyfill有三种方式

    - 直接在项目入口引用`core-js`
    - 借助`@babel/preset-env`处理polyfill
      - entry：全局引入polyfill，这种方式改动的是全局的对象，是有污染的
      - usage: 根据代码导入polypill，导入方式是import 'core-js/xxxx/xxx.js'，这种方式改动的是全局的对象，是有污染的

    - 借助`@babel/plugin-transform-runtime`处理polyfill，该插件与usage一样也是扫描代码得出哪些api需要进行polypill，只不过引用的方式改成了import _promise from 'core-js/xxx/xxx.js'，这种方式就是无污染的polypill

##### 处理第三方npm包

```js
yarn add @rollup/plugin-node-resolve -D
yarn add @rollup/plugin-commonjs -D
yarn add @rollup/plugin-json -D
```



```js
// rollup.config.js
plugins: [
    resolve(),
    json(),
    commonjs({
      transformMixedEsModules: true,
    }),
  ],
```

注意transformMixedEsModules这个参数，允许导入的模块内commonjs与esmodule混用



##### 处理css文件

```js
yarn add rollup-plugin-import-css -D
```



```js
plugins: [
	css(),
],
```

有些`npm`包内有css文件，所以需要借助css插件进行处理



##### 处理amd规范的模块

```js
yarn add rollup-plugin-amd -D
```



```
plugins: [
	amd(),
],
```

改包可以将amd规范的模块转化成es module

该包只能识别`exports.foo = foo`这种语法，不支持`module.exports.foo = foo`这种语法



##### 生成符合es module与 commons 规范的包

```js
// rollup.config.js
export default [
  {
    input: './src/index.ts',
    output: [{
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      paths: {
        axios: 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js'
      }
    },{
      file: pkg.module,
      format: 'esm',
      exports: 'named',
      paths: {
        axios: 'https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js'
      }
    }]
  }
];
```



```json
// package.json
{
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
}
```



注意file的取值，分别是`dist/index.cjs.js`，`dist/index.esm.js`

目前主流的构建工具都支持识别`package.json`内的`module`字段，而我们将`module`字段指向es module规范的文件，这样做的目的是，通过构建工具的`tree-shaking`功能将没有使用到的代码去掉，减少包的体积大小



#### 插件开发

开发`rollup`插件因该遵循如下规范

- 插件名称应该以 `rollup-plugin-`为前缀
- `package.json`内的keyword字段应该包含`rollup-plugin-`
- 插件应该是已测试的
- 插件内部最好使用异步方法



开发一个简单的替换内容的插件

```js
// rollup-plugin-rename-amd-exports
import { createFilter } from 'rollup-pluginutils';

const firstpass = /\b(?:define)\b/;

export default function index(options = {}) {

  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'rollup-plugin-rename-amd-exports',

    transform: function transform(code, id) {
      if (!filter(id)) {
        return;
      }
      if (!firstpass.test(code)) {
        return;
      }
      const newCode = code.replace('module.exports = UI;', 'exports.UI = UI;')

      return newCode;
    }
  };
}
```



### 最佳实践

#### 单文件输出es module与commonjs规范文件

```js
// rollup.config.js
import path from 'path'
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default [
  {
    input: './src/index.ts',
    output: [{
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
    },{
      file: pkg.module,
      format: 'esm',
      exports: 'named',
    }],
    plugins: [
      resolve(),
      json(),
      commonjs({
        transformMixedEsModules: true,
      }),
      typescript({
        tsconfig: './tsconfig.json', // 解决插件没有应用 tsconfig 内的配置
      }),
      getBabelOutputPlugin({
        configFile: path.resolve(__dirname, '.babelrc'),
      }),
    ],
    external: [], // 不需要打入包内的第三方npm包,例如['lodash']
  }
];
```



```json
// tsconfig.json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "es2015",
    "target": "es5",
    "strict": true,
    "allowJs": false,
    "noUnusedLocals": true,
    "removeComments": true,
    "declaration": true,
    "skipLibCheck": true,
    "importHelpers": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "forceConsistentCasingInFileNames": true,
    "emitDecoratorMetadata": true,
    "noEmitOnError": true,
    "noUnusedParameters": false,
    "strictPropertyInitialization": false,
    "sourceMap": false,
    "declarationDir": "./"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "src/__tests__"]
}
```



```json
// .babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "debug": false
      }
    ]
  ]
}
```



如果需要对`npm`包的代码进行polyfill，需要借助`@babel/plugin-transform-runtime`插件

```
yarn add @babel/plugin-transform-runtime -D
yarn add @babel/runtime-corejs3
```



```json
// .babelrc
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "debug": true
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "absoluteRuntime": false,
        "corejs": {
          "version": 3,
          "proposals": false
        },
        "helpers": true,
        "regenerator": true
      }
    ]
  ]
}
```



#### 多文件输出es module or commonjs规范文件

单文件输出不能做到按需加载，因为代码都已经合并到一个模块了，如果我们要做代码的按需加载需要满足下面两个条件



1. `npm`包的模块是多模块导出的，而不是聚合的一个模块，比如

```js
|-- modules
    |-- permission
    |-- token
|-- index.js
```

```js
index.js

export { default as permission } from './modules/permission'
export { default as token } from './modules/token'
```



2. 项目内使用上面的`npm`包，实现按需导入，有两种引入方式

```js
1. import permission from '@yunke/core/modules/permission'
2. import { permission } from '@yunke/core' 需要借助babel插件转化成import permission from '@yunke/core/modules/permission'
```



代码目录结构

![image](https://user-images.githubusercontent.com/20950813/129197068-b86321f5-ac0f-459a-97c0-3a4316812424.png)


rollup配置文件

```js
// .rollup.config.js
import path from 'path'
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [{
  input: ['./src/index.ts', './src/modules/permission.ts', './src/modules/token.ts'],
  output: [{
    dir: 'dist',
    format: 'cjs',
    exports: 'named',
    preserveModules: true,
    preserveModulesRoot: 'src',
  }],
  plugins: [
    resolve(),
    json(),
    commonjs({
      transformMixedEsModules: true,
    }),
    typescript({
      tsconfig: './tsconfig.mutil.json', // 解决插件没有应用 tsconfig 内的配置
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      configFile: path.resolve(__dirname, '.babelrc'),
    })
  ],
  external: [], // 不需要打入包内的第三方npm包,例如['lodash']
}];

```

多文件输出的时候，如果ts有输出.d.ts文件，那么`declarationDir`参数需要设置为dir对应的目录

输出结果如下图所示

![image](https://user-images.githubusercontent.com/20950813/129197122-66a93861-aa4c-4b1a-b6d7-43a13f189116.png)

注意这时候输出的文件是按照源文件的目录结构输出的，如果代码内引入了npm包，且`preserveModules:true`则会在dist目录生成对应的node_modules目录，具体解决方法可以参考FAQ，如果`preserveModules:false`则不会生成多余的`node_modules`，但是不会按照原目录结构生成文件



#### 多文件多目录输出

比如组件库，可能输出dist目录与es目录

代码目录如下图所示

![image](https://user-images.githubusercontent.com/20950813/129197150-ada13a96-dc41-4331-beed-e20958250b03.png)

rollup配置

```js
import path from 'path'
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

function createConfig({output, tsconfig}) {
  return {
    input: ['./src/index.ts', './src/components/toast.ts', './src/components/button.ts'],
    output,
    plugins: [
      resolve(),
      json(),
      commonjs({
        transformMixedEsModules: true,
      }),
      typescript({
        tsconfig, // 解决插件没有应用 tsconfig 内的配置
      }),
      getBabelOutputPlugin({
        configFile: path.resolve(__dirname, '.babelrc'),
      }),
    ],
    external: [], // 不需要打入包内的第三方npm包,例如['lodash']
  }
}

export default [
  createConfig({
    output: [{
      dir: 'dist',
      format: 'cjs',
      exports: 'named',
      preserveModules: true, // 保持模块按照目录结构输出
      preserveModulesRoot: 'dist',
    }],
    tsconfig: './tsconfig.dist.json',
  }),
  createConfig({
    output: [{
      dir: 'es',
      format: 'esm',
      exports: 'named',
      preserveModules: true,
      preserveModulesRoot: 'es',
    }],
    tsconfig: './tsconfig.es.json',
  }),
];
```

tsconfig.dist.json与tsconfig.es.json的区别就是`outDir`与`declarationDir`参数值不同，分别是`./dist`与`./es`

输出结果入下图所示

![image](https://user-images.githubusercontent.com/20950813/129197176-c4981ebc-ccc3-4e5c-901e-d62415db1743.png)

这样构建出来的组件库就可以实现按需导入，同时支持满足`tree-shaking`的条件



### FAQ

1. 多文件输出的时候，且`preserveModules：true`的场景，如果有引入npm包，且没有通过`external`参数排除，则生成的目录内会包含node_modules目录，当包真正构建的时候被报错，解决方法如下所示[Why does the `preserveModules` option generate `node_modules` folder](https://github.com/rollup/rollup/issues/3684)

### 总结

在通过`rollup`构建`npm`包的过程中，碰到了很多的坑，比如碰到了`npm`模块内有amd的模块，碰到了`npm`包内有css文件，碰到了多文件输出有`node_modules`的问题，碰到了`babel`插件没有生效的问题等等，最后总结了一些最佳实践，以备后续使用


