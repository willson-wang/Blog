---
  title: 解决项目中的循环引用
  date: 2020-04-23T11:39:48Z
  lastmod: 2020-04-23T12:00:08Z
  summary: 
  tags: ["原生JS", "webpack", "babel"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/js4.jpeg']
  bibliography: references-data.bib
---

## 什么是循环引用
即a依赖b，b依赖c，c又依赖a这样的情况

我们实际项目开发中一般使用的是es6+的语法及api,那么当我们项目越来越大的时候，就有可能出现循环引用；那么怎么去解决呢？

第一个思路，提取新的方法，避免出现循环引用
第二个思路，升级babel配置or使用函数声明而不是函数表达式，使用函数来包裹变量而不是单独使用变量

## 以实际开发项目webpack及bable版本及配置为例子

```json
package.json

"devDependencies": {
    "babel-core": "^6.26.3",
    "babel-plugin-transform-runtime": "^6.23.0",
    "babel-preset-env": "^1.7.0",
    "babel-eslint": "^7.2.3",
    "babel-loader": "^7.1.3",
    "clean-webpack-plugin": "^3.0.0",
    "css-loader": "^3.2.0",
    "extract-text-webpack-plugin": "^3.0.2",
    "html-webpack-plugin": "^3.2.0",
    "postcss-loader": "^3.0.0",
    "style-loader": "^1.0.0",
    "webpack": "3.12.0",
    "webpack-bundle-analyzer": "^3.6.0",
    "babel-cli": "^6.26.0"
  },
  "dependencies": {
    "babel-runtime": "^6.26.0"
  }
```

```js
.babelrc

{
    "presets": [
        [
            "env",
            {
                "modules": false,
            }
        ]
    ],
    "plugins": [
        [
            "transform-runtime"
        ]
    ]
}
```

### 具体列子

```js
// a.js
import {bar} from './b';
console.log('a.js');
console.log(bar);
export let foo = 'foo';

// b.js
import {foo} from './a';
console.log('b.js');
console.log(foo);
export let bar = 'bar';
```

### babel-loader webpack处理后的文件，注意这里为了方便观察，把devtool去掉，加上moduleId展示名称与路径webpack插件

```js
plugins: [
        new CleanWebpackPlugin(),
        new ExtractTextPlugin('[name]-[contenthash].css'),
        new webpack.NamedModulesPlugin(),
        new webpack.NamedChunksPlugin(),
],
```

```js
/***/ "./src/a.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "foo", function() { return foo; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__b__ = __webpack_require__("./src/b.js");


console.log('a.js');
console.log(__WEBPACK_IMPORTED_MODULE_0__b__["a" /* bar */]);

var foo = 'foo';

/***/ })

/***/ "./src/b.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return bar; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__a__ = __webpack_require__("./src/a.js");


console.log('b.js');
console.log(__WEBPACK_IMPORTED_MODULE_0__a__["foo"]);

var bar = 'bar';

/***/ })
```

### 最终执行的结果：

```js
b.js
undefined
a.js
bar
```

### 小结
b.js内引入a.js内的foo，因为a.js最终转换之后变成var foo = 'foo'，然后通过__webpack_require__.d暴露出去，所以当我们在b.js内执行到console.log(foo)时，由于a.js内还没执行到var foo = 'foo'这一行，所以打印出的结果是undefiend

### 我们在a.js内加一个fn函数，一个expFn函数表达式，一个asyncFn async函数；

```js
// a.js 
import { bar } from './b'
console.log('a.js')
console.log(bar)
export function fn() {}
export const expFn = function () {}
export async function asyncFn() {}
export let foo = 'foo'


// b.js
import { foo, fn, asyncFn, expFn } from './a'

console.log('b.js')
console.log(foo)
console.log(fn)
console.log(asyncFn)
console.log(expFn)

export let bar = 'bar'
```

### babel-loader webpack处理之后

```js
/***/ "./src/a.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["fn"] = fn;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "expFn", function() { return expFn; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "asyncFn", function() { return asyncFn; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "foo", function() { return foo; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator__ = __webpack_require__("./node_modules/babel-runtime/regenerator/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_babel_runtime_helpers_asyncToGenerator__ = __webpack_require__("./node_modules/babel-runtime/helpers/asyncToGenerator.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_babel_runtime_helpers_asyncToGenerator___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_babel_runtime_helpers_asyncToGenerator__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__b__ = __webpack_require__("./src/b.js");


console.log('a.js');
console.log(__WEBPACK_IMPORTED_MODULE_2__b__["a" /* bar */]);

function fn() {}

var expFn = function expFn() {};

var asyncFn = function () {
  var _ref = __WEBPACK_IMPORTED_MODULE_1_babel_runtime_helpers_asyncToGenerator___default()( /*#__PURE__*/__WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default.a.mark(function _callee() {
    return __WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function asyncFn() {
    return _ref.apply(this, arguments);
  };
}();

var foo = 'foo';

/***/ })


/***/ "./src/b.js":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return bar; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__a__ = __webpack_require__("./src/a.js");


console.log('b.js');
console.log(__WEBPACK_IMPORTED_MODULE_0__a__["foo"]);
console.log(__WEBPACK_IMPORTED_MODULE_0__a__["fn"]);
console.log(__WEBPACK_IMPORTED_MODULE_0__a__["asyncFn"]);
console.log(__WEBPACK_IMPORTED_MODULE_0__a__["expFn"]);

var bar = 'bar';

/***/ })
```

### 最终打印结果

```js
b.js
undefined
ƒ fn() {}
undefined
undefined
a.js
bar
```

### 小结
分析：只有fn函数正确读取到了，其它foo变量、asyncFn、expFn打印出来的都是undefined；原因就在a.js经过babel处理之后，expFn与asyncFn变成了如下所示

```js
var expFn = function expFn() {};

var asyncFn = function () {
  var _ref = __WEBPACK_IMPORTED_MODULE_1_babel_runtime_helpers_asyncToGenerator___default()( /*#__PURE__*/__WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default.a.mark(function _callee() {
    return __WEBPACK_IMPORTED_MODULE_0_babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function asyncFn() {
    return _ref.apply(this, arguments);
  };
}();
```
都变成了函数表达式，所以跟foo变量就是一样的结果了，b.js内代码执行的时候，a.js从加载b.js后的那些代码都没有被执行，所以最终结果都输出不正确；

## 总结

1. 变量、函数表达式会变成undefined、函数定义不会，可以正常被读取引用
2. 在babel6.x且加入babel-pulgin-transform-runtime插件处理后的async函数会变成函数表达式；
3. webpack处理的代码内有循环引用，当被循环引用的文件内（b.js）去引用前面的（a.js）方法or变量时，因为前面（a.js）js代码没有执行完以及js变量、函数提升机制导致最终读取的方法为undefined


升级babel到7.x版本之后，async函数转换成了函数声明，而不是函数表达式

```js
function asyncFn() {
  return _asyncFn.apply(this, arguments);
}

function _asyncFn() {
  _asyncFn = __WEBPACK_IMPORTED_MODULE_1__babel_runtime_helpers_asyncToGenerator___default()( /*#__PURE__*/__WEBPACK_IMPORTED_MODULE_0__babel_runtime_regenerator___default.a.mark(function _callee() {
    return __WEBPACK_IMPORTED_MODULE_0__babel_runtime_regenerator___default.a.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _asyncFn.apply(this, arguments);
}
```

注意如果没有加入babel-pulgin-transform-runtime插件，代码中出现循环引用，webpack打包会直接报错

webpack转换后的文件

```js
// 暴露的函数声明
/* harmony export (immutable) */ __webpack_exports__["fn"] = fn;

// 暴露的函数表达式
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "expFn", function() { return expFn; });

// 暴露的函数声明
/* harmony export (immutable) */ __webpack_exports__["asyncFn"] = asyncFn;

// 暴露的变量
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "foo", function() { return foo; });

// 引入的webpack其它模块
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__babel_runtime_regenerator__ = __webpack_require__("./node_modules/@babel/runtime/regenerator/index.js");
```

参考链接：
https://es6.ruanyifeng.com/#docs/module-loader
