---
  title: 快速理解node glob语法
  date: 2022-02-25T07:59:06Z
  lastmod: 2023-03-25T12:18:38Z
  summary: 
  tags: ["node"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/glob.webp']
  bibliography: references-data.bib
---

## 目录

- [背景](#背景)
- [glob语法](#glob语法)
- [常用应用场景](#常用应用场景)
- [总结](#总结)



### 背景

封装了一个基于`rollup`的构建工具，在多`entry`场景下，只需要写一个简单的glob语句就行，而不用自己遍历或者手动写上所有的entry路径，但是在使用的过程中，总是受到`.d.ts`及`__tests__`目录下的文件干扰，所以在解决了问题之后，总结一下，方便后面在有类似问题的时候可以快速解决



### glob语法

理解glob语法的两个关键点

- 路径片段， 比如`src/**/*.js` 这里有三个路径片段，分别是`src`、`**`、`*.js`
- 特殊字符
  - `*`: 在单个路径片段中匹配0个或者多个字符，比如`src/*.js`, `*.js`就可以匹配src目录下的index.js、app.js、任何.js文件
  - `?`: 匹配单个路径片段中的单个字符，比如`src/index.??`，`index.??` 可与匹配src目录下的index.js、index.ts等，任意两个字符结尾的文件
  - `[...]`: 字符合集与正则表达式中的[]意思一样，[!] or [^]表示取反，不再这个集合内，比如`src/index.[jt]s` 匹配`src/index.js` or `src/index.ts`,`src/index.[^jt]s` 匹配除`src/index.js` or `src/index.ts`之外的其它字符s文件
  - `!(pattern|pattern|pattern)`: 匹配非给定的模式，比如`src/!(index|app).ts` 匹配`src/index.ts`与`src/app.ts`之外的其它ts文件
  - `?(pattern|pattern|pattern)`: 匹配括号内的模式0次or1次，比如`'src/*.[tj]s?(x)'`匹配src下的`ts`、`js`、`tsx`、`jsx`结尾的文件
  - `+(pattern|pattern|pattern)`: 匹配括号内的模式1次or多次
  - `*(a|b|c)`: 匹配括号内的模式0次or多次
  - `@(pattern|pat*|pat?erN)`: 严格匹配括号内给定的模式
  - `**`: 在单独的一个路径片断，则匹配零级或多级目录，不会搜索符号链接目录，比如`src/**/*.ts`，这里的`**`，则会匹配src/test、src/test/fixtures、src/utils等，src下任意层级的目录
  - `{}`: 匹配大括号内的所有模式，模式之间用逗号进行分隔，支持大括号嵌套，支持用 .. 匹配连续的字符，即 `{start..end}` 语法，比如`a.{png,jp{,e}g}`匹配`a.png`、`a.jpg`、`a.gpeg`



glob匹配看了下大概的源码是通过对传入的`glob`语句，按照`/`来`split`，然后在根据`cwd`参数，通过`fs.readdirSync`一步步来读取对应的目录与文件，所以理解路径片段很重要

上面的特殊字符其实挺多的，但是只要记一些关键词就可以，比如`*`、`**`、`?`、`!?+*@()`、`{}`、`[]`这五类就可以

更多内容及使用参数，参考[文档](https://github.com/isaacs/node-glob)



### 常用应用场景

以下面的文件结构作为测试目录

#### 文件目录结构

```
.
├── CHANGELOG.md
├── LICENSE
├── README.md
├── cspell.json
├── dist
│   ├── components
│   │   ├── alert
│   │   │   └── index.js
│   │   ├── button.d.js
│   │   └── button.js
│   ├── componentsCss.d.ts
│   ├── componentsCss.js
│   ├── index.d.ts
│   ├── index.js
│   ├── normalCss.d.ts
│   ├── normalCss.js
│   ├── type.d.js
│   ├── util.d.ts
│   └── util.js
├── index.js
├── node_modules
├── jest.config.js
├── package.json
├── result.json
├── src
│   ├── __tests__
│   │   ├── fixtures
│   │   │   ├── css
│   │   │   │   ├── expect.ts
│   │   │   │   ├── index.css
│   │   │   │   └── index.js
│   │   │   ├── css-module
│   │   │   │   ├── expect.ts
│   │   │   │   ├── index.js
│   │   │   │   └── index.module.css
│   │   │   ├── less
│   │   │   │   ├── expect.ts
│   │   │   │   ├── index.js
│   │   │   │   └── index.less
│   │   │   └── less-module
│   │   │       ├── expect.ts
│   │   │       ├── index.js
│   │   │       └── index.module.less
│   │   └── index.test.ts
│   ├── abc.jsx
│   ├── abc.tsx
│   ├── components
│   │   ├── alert
│   │   │   ├── index.d.ts
│   │   │   └── index.ts
│   │   ├── button.d.ts
│   │   ├── button.ts
│   │   └── index.tsx
│   ├── componentsCss.ts
│   ├── index.ts
│   ├── my.js
│   ├── normalCss.ts
│   ├── type.d.ts
│   └── util.ts
├── test
│   └── index.test.ts
├── tsconfig.json
└── yarn.lock
```



**匹配src目录下所有的ts文件，不包括子目录**

```
'src/*.ts'
=>
'src/componentsCss.ts',
'src/index.ts',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```

注意`'/src/*.ts'` 这种写法匹配不到结果，'./src/*.ts'这种写法与'src/*.ts'写法匹配到的结果是等价的，但是传入ignore参数的时候就会有区别了，推荐使用'src/*.ts'，不使用相对路径的写法



**匹配src目录下所有的ts、js文件，不包括子目录**

```
'src/*.[t|j]s' or 'src/*.[tj]s' 这两种写法是等价的
=>
'src/componentsCss.ts',
'src/index.ts',
'src/my.js',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```



**匹配src目录下所有的ts、js、tsx、jsx文件，不包括子目录**

```
'src/*.[t|j]s?(x)' or src/*.[tj]s?(x)
=>
'src/abc.jsx',
'src/abc.tsx',
'src/componentsCss.ts',
'src/index.ts',
'src/my.js',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```



**匹配src目录下除以js结尾的其它符号s结尾的文件，不包括子目录**

```
src/*.[^j]s or 'src/*.[!j]s'
=>
'src/componentsCss.ts',
'src/index.ts',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```



**匹配src目录下除index.ts与abc.ts之外的其它.ts文件，不包括子目录**

```
'src/!(index|abc).ts'
=>
'src/componentsCss.ts',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```



**src目录下abc.tsx or ab任意字符.ts结尾的文件，不包括子目录**

```
'src/ab?.tsx'
=>
'src/abc.tsx'
```



**src目录及所有子目录下的以ts结尾的文件**

```
src/**/*.ts
=>
'src/__tests__/fixtures/css-module/expect.ts',
'src/__tests__/fixtures/css/expect.ts',
'src/__tests__/fixtures/less-module/expect.ts',
'src/__tests__/fixtures/less/expect.ts',
'src/__tests__/index.test.ts',
'src/components/alert/index.d.ts',
'src/components/alert/index.ts',
'src/components/button.d.ts',
'src/components/button.ts',
'src/componentsCss.ts',
'src/index.ts',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```



**src目录下以ts结尾的文件，及子目录__test__下以ts结尾的文件，不包括其它src下的子目录**

```
src/{*.ts,__tests__/*.ts}
=>
'src/__tests__/index.test.ts',
'src/componentsCss.ts',
'src/index.ts',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```



**src除__tests__之外二级目录下以.ts结尾的文件,不包含三级及以上目录**

```
src/!(__tests__)/*.ts
=>
'src/components/button.d.ts', 'src/components/button.ts'
```



**src除__tests__之外二级及二级以上目录下以.ts结尾的文件**

```
src/!(__tests__)/**/*.ts
=>
'src/components/alert/index.d.ts',
'src/components/alert/index.ts',
'src/components/button.d.ts',
'src/components/button.ts'
```



**匹配src一级目录及除__tests__之外二级及二级以下目录下除.d.ts之外以.ts结尾的文件**



```
src/{!(*.d).ts,!(__tests__)/**/!(*.d).ts}
=>
'src/components/alert/index.ts',
'src/components/button.ts',
'src/componentsCss.ts',
'src/index.ts',
'src/normalCss.ts',
'src/util.ts'
```



```
glob.sync('src/**/*.ts', {
    cwd: process.cwd(),
    ignore: ['{!(node_modules|dist)/**/*.d.ts,{!(node_modules|dist)/?(test|tests|__tests__|__test__),test,tests,__tests__,__test__}/**/*.ts}']
})
```



**匹配不了任何文件**

```
__tests__
=>
[]
```



**匹配cwd目录下任何`__tests__`目录下的任何目录及文件**

```
**/__tests__/**
=>
'node_modules/import-sort-style-custom/dist/__tests__',
'node_modules/import-sort-style-custom/dist/__tests__/index.test.d.ts',
'node_modules/import-sort-style-custom/dist/__tests__/index.test.d.ts.map',
'node_modules/import-sort-style-custom/src/__tests__',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__/tsconfig.custom.json',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__/tsconfig.json',
'node_modules/import-sort-style-custom/src/__tests__/index.test.ts',
'node_modules/prettier-plugin-sorted/src/__tests__',
'node_modules/prettier-plugin-sorted/src/__tests__/index.test.ts',
'src/__tests__',
'src/__tests__/fixtures',
'src/__tests__/fixtures/css',
'src/__tests__/fixtures/css-module',
'src/__tests__/fixtures/css-module/expect.ts',
'src/__tests__/fixtures/css-module/index.js',
'src/__tests__/fixtures/css-module/index.module.css',
'src/__tests__/fixtures/css/expect.ts',
'src/__tests__/fixtures/css/index.css',
'src/__tests__/fixtures/css/index.js',
'src/__tests__/fixtures/less',
'src/__tests__/fixtures/less-module',
'src/__tests__/fixtures/less-module/expect.ts',
'src/__tests__/fixtures/less-module/index.js',
'src/__tests__/fixtures/less-module/index.module.less',
'src/__tests__/fixtures/less/expect.ts',
'src/__tests__/fixtures/less/index.js',
'src/__tests__/fixtures/less/index.less',
'src/__tests__/index.test.ts'
```



**匹配cwd目录下任何`__tests__`子目录下的任何目录及文件**

```
**/__tests__/**/*
=> 
'node_modules/import-sort-style-custom/dist/__tests__/index.test.d.ts',
'node_modules/import-sort-style-custom/dist/__tests__/index.test.d.ts.map',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__/tsconfig.custom.json',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__/tsconfig.json',
'node_modules/import-sort-style-custom/src/__tests__/index.test.ts',
'src/__tests__/fixtures',
'src/__tests__/fixtures/css',
'src/__tests__/fixtures/css-module',
'src/__tests__/fixtures/css-module/expect.ts',
'src/__tests__/fixtures/css-module/index.js',
'src/__tests__/fixtures/css-module/index.module.css',
'src/__tests__/fixtures/css/expect.ts',
'src/__tests__/fixtures/css/index.css',
'src/__tests__/fixtures/css/index.js',
'src/__tests__/fixtures/less',
'src/__tests__/fixtures/less-module',
'src/__tests__/fixtures/less-module/expect.ts',
'src/__tests__/fixtures/less-module/index.js',
'src/__tests__/fixtures/less-module/index.module.less',
'src/__tests__/fixtures/less/expect.ts',
'src/__tests__/fixtures/less/index.js',
'src/__tests__/fixtures/less/index.less',
'src/__tests__/index.test.ts'
```



**匹配cwd目录下任何`__tests__`子目录下的任何目录及文件**

```
'**/__tests__/**/*.*'
=>
'node_modules/import-sort-style-custom/dist/__tests__/index.test.d.ts',
'node_modules/import-sort-style-custom/dist/__tests__/index.test.d.ts.map',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__/tsconfig.custom.json',
'node_modules/import-sort-style-custom/src/__tests__/__fixtures__/tsconfig.json',
'node_modules/import-sort-style-custom/src/__tests__/index.test.ts',
'src/__tests__/fixtures/css-module/expect.ts',
'src/__tests__/fixtures/css-module/index.js',
'src/__tests__/fixtures/css-module/index.module.css',
'src/__tests__/fixtures/css/expect.ts',
'src/__tests__/fixtures/css/index.css',
'src/__tests__/fixtures/css/index.js',
'src/__tests__/fixtures/less-module/expect.ts',
'src/__tests__/fixtures/less-module/index.js',
'src/__tests__/fixtures/less-module/index.module.less',
'src/__tests__/fixtures/less/expect.ts',
'src/__tests__/fixtures/less/index.js',
'src/__tests__/fixtures/less/index.less',
'src/__tests__/index.test.ts'
```



**匹配cwd目录下任何`__tests__`目录**

```
**/__tests__ or **/__tests__/
=>
'node_modules/import-sort-style-custom/dist/__tests__',
'node_modules/import-sort-style-custom/src/__tests__',
'src/__tests__'
```



**匹配cwd目录下所有.ts结尾的文件**

```
**/*.ts
=>
'dist/componentsCss.d.ts',
'dist/index.d.ts',
'dist/normalCss.d.ts',
'dist/util.d.ts',
'node_modules/@ampproject/remapping/dist/types/build-source-map-tree.d.ts',
'node_modules/@ampproject/remapping/dist/types/fast-string-array.d.ts',
'node_modules/@ampproject/remapping/dist/types/original-source.d.ts',
'node_modules/@ampproject/remapping/dist/types/remapping.d.ts',
... 6174 more items
```



**匹配cwd目录下除node_modules之外一级目录下的以.ts结尾的文件**

```
!(node_modules)/*.ts
=>
'dist/componentsCss.d.ts',
'dist/index.d.ts',
'dist/normalCss.d.ts',
'dist/util.d.ts',
'src/componentsCss.ts',
'src/index.ts',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts',
'test/index.test.ts'
```



**匹配所有.d.ts文件及test相关目录下的ts文件**

```
{!(node_modules|dist)/**/*.d.ts,{!(node_modules|dist)/?(test|tests|__tests__|__test__),test,tests,__tests__,__test__}/**/*.ts}
=>
'src/__tests__/fixtures/css-module/expect.ts',
'src/__tests__/fixtures/css/expect.ts',
'src/__tests__/fixtures/less-module/expect.ts',
'src/__tests__/fixtures/less/expect.ts',
'src/__tests__/index.test.ts',
'src/components/alert/index.d.ts',
'src/components/button.d.ts',
'src/type.d.ts',
'test/index.test.ts'
```



**匹配src下的所有目录及文件**

```
src/**/*
=>
'src/__tests__',
'src/__tests__/fixtures',
'src/__tests__/fixtures/css',
'src/__tests__/fixtures/css-module',
'src/__tests__/fixtures/css-module/expect.ts',
'src/__tests__/fixtures/css-module/index.js',
'src/__tests__/fixtures/css-module/index.module.css',
'src/__tests__/fixtures/css/expect.ts',
'src/__tests__/fixtures/css/index.css',
'src/__tests__/fixtures/css/index.js',
'src/__tests__/fixtures/less',
'src/__tests__/fixtures/less-module',
'src/__tests__/fixtures/less-module/expect.ts',
'src/__tests__/fixtures/less-module/index.js',
'src/__tests__/fixtures/less-module/index.module.less',
'src/__tests__/fixtures/less/expect.ts',
'src/__tests__/fixtures/less/index.js',
'src/__tests__/fixtures/less/index.less',
'src/__tests__/index.test.ts',
'src/abc.jsx',
'src/abc.tsx',
'src/components',
'src/components/alert',
'src/components/alert/index.d.ts',
'src/components/alert/index.ts',
'src/components/button.d.ts',
'src/components/button.ts',
'src/components/index.tsx',
'src/componentsCss.ts',
'src/index.ts',
'src/my.js',
'src/normalCss.ts',
'src/type.d.ts',
'src/util.ts'
```



### 总结

glob语法在很多前端工具中都有用到，比如`prettier`、`eslint`、`stylelint`、`babel`、`typescript`等,都是作为查找输入文件的语法，虽然语法上可能会有差异，但是大同小异，掌握了之后基本上可以快速写出符合要求的glob语句，而不用每次想要的时候再去找文档，记这个的原因也是，下次有场景不记得了，直接来这里找下
