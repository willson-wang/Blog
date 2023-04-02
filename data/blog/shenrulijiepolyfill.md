---
  title: 深入理解polyfill
  date: 2019-08-14T13:53:32Z
  lastmod: 2023-03-26T09:24:25Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/polyfill.jpeg']
  bibliography: references-data.bib
---

# 目录

1. 什么是polyfill
2. ECMASCRIPT近几年发布了哪些版本及新的api，兼容性总结
3. core-js是怎么去实现polyfill的
4. 如何使用browserslist
5. 参考链接

### 什么是polyfill

先看张图

![image](https://user-images.githubusercontent.com/20950813/67871498-67058c00-fb6b-11e9-9e99-480a98916f58.png)

要想使用es6+语法，且需要兼容低版本浏览器及手机系统就需要polyfill

polyfill的英文意思是填充工具，意义就是兜底的东西；为什么会有polyfill这个概念，因为ECMASCRIPT一直在发布新的api，当我们使用这些新的api的时候，在旧版本的浏览器上是无法使用的，因为旧的版本上是没有提供这些新的api的，所以为了让代码也能在旧的浏览器上跑起来，于是手动添加对应的api，这就是polyfill；

![image](https://user-images.githubusercontent.com/20950813/67930585-09b91b80-fbfb-11e9-9e8e-876e04450f8a.png)


### ECMASCRIPT近几年发布了哪些版本及新的api，兼容性总结

#### ECMASCRIPT 5 简称es5，首版发布于2009年，2012年发布了5.1

新增的api如下所示，列出常用的方法

```
Object
  .create(proto | null, descriptors?)    -> object
  .getPrototypeOf(object)                -> proto | null
  .defineProperty(target, key, desc)     -> target, cap for ie8-
  .defineProperties(target, descriptors) -> target, cap for ie8-
  .getOwnPropertyDescriptor(object, key) -> desc
  .getOwnPropertyNames(object)           -> array
  .keys(object)                          -> array
  .seal(object)                          -> object, cap for ie8-
  .freeze(object)                        -> object, cap for ie8-
  .preventExtensions(object)             -> object, cap for ie8-
  .isSealed(object)                      -> bool, cap for ie8-
  .isFrozen(object)                      -> bool, cap for ie8-
  .isExtensible(object)                  -> bool, cap for ie8-
Array
  .isArray(var)                                -> bool
  #slice(start?, end?)                         -> array, fix for ie7-
  #join(string = ',')                          -> string, fix for ie7-
  #indexOf(var, from?)                         -> int
  #lastIndexOf(var, from?)                     -> int
  #every(fn(val, index, @), that)              -> bool
  #some(fn(val, index, @), that)               -> bool
  #forEach(fn(val, index, @), that)            -> void
  #map(fn(val, index, @), that)                -> array
  #filter(fn(val, index, @), that)             -> array
  #reduce(fn(memo, val, index, @), memo?)      -> var
  #reduceRight(fn(memo, val, index, @), memo?) -> var
  #sort(fn?)                                   -> @, fixes for some engines
Function
  #bind(object, ...args) -> boundFn(...args)
String
  #split(separator, limit) -> array
  #trim()                  -> str
RegExp
  #toString() -> str
Number
  #toFixed(digits)        -> string
  #toPrecision(precision) -> string
parseInt(str, radix) -> int
parseFloat(str)      -> num
Date
  .now()         -> int
  #toISOString() -> string
  #toJSON()      -> string
```

Example

```
const person = {
    printIntroduction: function () {
      console.log(`My name is ${this.name}. Am I human? age ${this.age}`);
    }
};

// Object.create()方法创建一个新对象，使用现有的对象来提供新创建的对象的__proto__
const me = Object.create(person, {
    age: {
        value: 18,
        writable: true
    },
});
```

```
const prototype1 = {};
const object1 = Object.create(prototype1);

// 返回指定对象的原型（内部[[Prototype]]属性的值）
console.log(Object.getPrototypeOf(object1) === prototype1); // true
console.log(Object.getPrototypeOf(Object.prototype)); // null
```

```
var o = {}; // 创建一个新对象

// 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性， 并返回这个对象
Object.defineProperty(o, "a", {
  value : 37,
  writable : true,
  enumerable : true,
  configurable : true
});

console.log(o.a)
```

```
var obj = {};
// 直接在一个对象上定义多个新的属性或修改现有属性，并返回该对象。definePropertie一次只能定义一个属性
Object.defineProperties(obj, {
  'property1': {
    value: true,
    writable: true
  },
  'property2': {
    value: 'Hello',
    writable: false
  }
});

console.log(obj.property1, obj.property2)
```

```
var o, d;

o = { get foo() { return 17; } };
d = Object.getOwnPropertyDescriptor(o, "foo");
console.log(d)
// d {
//     configurable: true
//     enumerable: true
//     get: ƒ foo()
//     set: undefined
// }

o = { bar: 42 };
d = Object.getOwnPropertyDescriptor(o, "bar");
// d {
//     configurable: true
//     enumerable: true
//     value: 42
//     writable: true
// }

o = Object.create({age: 18})
Object.defineProperty(o, "baz", {
  value: 8675309,
  writable: false,
  enumerable: false
});
d = Object.getOwnPropertyDescriptor(o, "baz");
// d {
//     configurable: false
//     enumerable: false
//     value: 8675309
//     writable: false
// }

f = Object.getOwnPropertyDescriptor(o, "age");
// f undefined
```

```
var obj = Object.create({age: 18})

obj.name = 'jack'

Object.defineProperty(obj, 'gender', {
    value: '男',
    writable: true,
    configurable: true,
    enumerable: false
})
// 返回一个由指定对象的所有自身属性的属性名（包括不可枚举属性但不包括Symbol值作为名称的属性）组成的数组
console.log(Object.getOwnPropertyNames(obj)) // ["name", "gender"]
```

```
var obj = Object.create({age: 18})

obj.name = 'jack'

Object.defineProperty(obj, 'gender', {
    value: '男',
    writable: true,
    configurable: true,
    enumerable: false
})
// 返回一个由一个给定对象的自身可枚举属性组成的数组，数组中属性名的排列顺序和使用 for...in 循环遍历该对象时返回的顺序一致
console.log(Object.keys(obj)) // ["name"]
```

```
var obj = Object.create({age: 18})

obj.name = 'jack'

Object.defineProperty(obj, 'gender', {
    value: '男',
    writable: true,
    configurable: true,
    enumerable: false
})

// 封闭一个对象，阻止添加新属性并将所有现有属性标记为不可配置。当前属性的值只要可写就可以改变
Object.seal(obj)

obj.name = 'rose'
console.log(obj.name) // rose
delete obj.name
console.log(obj.name) // rose
obj.getName = function () {}
console.log(obj.getName) // undefined
```

```
var obj = Object.create({age: 18})

obj.name = 'jack'

Object.defineProperty(obj, 'gender', {
    value: '男',
    writable: true,
    configurable: true,
    enumerable: false
})

obj.info = {
    name: 'will'
}
// 冻结一个对象。一个被冻结的对象再也不能被修改；冻结了一个对象则不能向这个对象添加新的属性，
// 不能删除已有属性，不能修改该对象已有属性的可枚举性、可配置性、可写性，以及不能修改已有属性
// 的值。此外，冻结一个对象后该对象的原型也不能被修改。freeze() 返回和传入的参数相同的对象

// 数据属性的值不可更改，访问器属性（有getter和setter）也同样（但由于是函数调用，给人的错觉是
// 还是可以修改这个属性）。如果一个属性的值是个对象，则这个对象中的属性是可以修改的，除非它
// 也是个冻结对象

// 注意与seal方法的区别
Object.freeze(obj)

obj.name = 'rose'
console.log(obj.name) // jack
delete obj.name
console.log(obj.name) // jack
obj.getName = function () {}
console.log(obj.getName) // undefined
obj.info.name = 'mike'
console.log(obj.info.name) // mike
```

```
var obj = Object.create({age: 18})

obj.name = 'jack'

Object.defineProperty(obj, 'gender', {
    value: '男',
    writable: true,
    configurable: true,
    enumerable: false
})

obj.info = {
    name: 'will'
}

// 将对象标记为不再可扩展，因此它将永远不会具有超出它被标记为不可扩展的属性。注意，一般来说，不可扩展对象的属性可能仍然可被删除
// 仅阻止添加自身的属性。但属性仍然可以添加到对象原型
Object.preventExtensions(obj)

obj.name = 'rose'
console.log(obj.name) // rose
delete obj.name
console.log(obj.name) // undefined
obj.getName = function () {}
console.log(obj.getName) // undefined
obj.info.name = 'mike'
console.log(obj.info.name) // mike
```

```
var obj = {name: 'rose'}
// 判断一个对象是否被密封
console.log(Object.isSealed(obj)) // false
Object.seal(obj)
console.log(Object.isSealed(obj)) // true
```

```
var obj = {name: 'rose'}
// // 判断一个对象是否被冻结
console.log(Object.isFrozen(obj)) // false
Object.freeze(obj)
console.log(Object.isFrozen(obj)) // true
```

```
var obj = {name: 'rose'}
// 判断一个对象是否可拓展
console.log(Object.isExtensible(obj)) // true
Object.preventExtensions(obj)
console.log(Object.isExtensible(obj)) // false
```

```
const num = 3.1415926

// 指定小数点后保留的位数，默认为0
console.log(num.toFixed()) // 3
console.log(num.toFixed(1)) // 3.1
console.log(num.toFixed(2)) // 3.14
console.log(num.toFixed(3)) // 3.142
console.log(num.toFixed(4)) // 3.1416
```

```
const num = 3.1415926

// 指定有效数字位数，默认所有
console.log(num.toPrecision()) // 3.1415926
console.log(num.toPrecision(1)) // 3
console.log(num.toPrecision(2)) // 3.1
console.log(num.toPrecision(3)) // 3.14
console.log(num.toPrecision(4)) // 3.142
```

ECMASCRIPT 5 简称es5,兼容性,如下图所示

![image](https://user-images.githubusercontent.com/20950813/63211117-8d4b8c00-c125-11e9-8f12-1346c96f20e7.png)

pc端ie9+,ff21+,ch23+,sf6+;
mobile端ios6+,android4.4+;
node端0.1+

上面的版本都是至少支持90%以上的语法特性，通过上述的兼容性，我们已经能够很好的判断自身所需的兼容性来；如果我们不需要去兼容ie9-及andriod4.4-，ios6-，那我们在使用es5的语法时，是不需要考虑兼容性的；如果我们其中使用来一些es6的语法及api,则需要babel转译及polyfill；

#### ECMASCRIPT 2015 简称es6，首版发布于2015年6月，且后面的ECMASCRIPT标准，每年发布一次，年号命名

新增的常用api如下所示

```
Object
  .assign(target, ...src)                -> target
  .is(a, b)                              -> bool
  .setPrototypeOf(target, proto | null)  -> target (required __proto__ - IE11+)
Function
  #name                  -> string (IE9+)
  #@@hasInstance(var)    -> bool
Array
  .from(iterable | array-like, mapFn(val, index)?, that) -> array
  .of(...args)                                           -> array
  #copyWithin(target = 0, start = 0, end = @length)      -> @
  #fill(val, start = 0, end = @length)                   -> @
  #find(fn(val, index, @), that)                         -> val
  #findIndex(fn(val, index, @), that)                    -> index | -1
  #values()                                              -> iterator
  #keys()                                                -> iterator
  #entries()                                             -> iterator
String
  .fromCodePoint(...codePoints) -> str
  .raw({raw}, ...substitutions) -> str
  #includes(str, from?) -> bool
  #startsWith(str, from?) -> bool
  #endsWith(str, from?) -> bool
  #repeat(num) -> str
  #codePointAt(pos) -> uint
RegExp(pattern, flags?) -> regexp, ES6 fix: can alter flags (IE9+)
  #flags -> str (IE9+)
  #toString() -> str, ES6 fixes
  #@@match(str)             -> array | null
  #@@replace(str, replacer) -> string
  #@@search(str)            -> index
  #@@split(str, limit)      -> array
String
  #match(tpl)             -> var, ES6 fix for support @@match
  #replace(tpl, replacer) -> var, ES6 fix for support @@replace
  #search(tpl)            -> var, ES6 fix for support @@search
  #split(tpl, limit)      -> var, ES6 fix for support @@split, some fixes for old engines
Number(var)         -> number | number object
  .isFinite(num)          -> bool
  .isNaN(num)             -> bool
  .isInteger(num)         -> bool
  .isSafeInteger(num)     -> bool
  .parseFloat(str)        -> num
  .parseInt(str)          -> int
  .EPSILON                -> num
  .MAX_SAFE_INTEGER       -> int
  .MIN_SAFE_INTEGER       -> int
new Promise(executor(resolve(var), reject(var))) -> promise
  #then(resolved(var), rejected(var))            -> promise
  #catch(rejected(var))                          -> promise
  .resolve(promise | var)                        -> promise
  .reject(var)                                   -> promise
  .all(iterable)                                 -> promise
  .race(iterable)      
Symbol(description?)  -> symbol
  .hasInstance        -> @@hasInstance
  .isConcatSpreadable -> @@isConcatSpreadable
  .iterator           -> @@iterator
  .match              -> @@match
  .replace            -> @@replace
  .search             -> @@search
  .species            -> @@species
  .split              -> @@split
  .toPrimitive        -> @@toPrimitive
  .toStringTag        -> @@toStringTag
  .unscopables        -> @@unscopables
  .for(key)           -> symbol
  .keyFor(symbol)     -> key
  .useSimple()        -> void
  .useSetter()        -> void
new Map(iterable (entries) ?)     -> map
  #clear()                        -> void
  #delete(key)                    -> bool
  #forEach(fn(val, key, @), that) -> void
  #get(key)                       -> val
  #has(key)                       -> bool
  #set(key, val)                  -> @
  #size                           -> uint
  #values()                       -> iterator
  #keys()                         -> iterator
  #entries()                      -> iterator
new Set(iterable?)              -> set
  #add(key)                     -> @
  #clear()                      -> void
  #delete(key)                  -> bool
  #forEach(fn(el, el, @), that) -> void
  #has(key)                     -> bool
  #size                         -> uint
  #values()                     -> iterator
  #keys()                       -> iterator
  #entries()                    -> iterator
```

Example

```
var foo = {q: 1, w: 2, c: {a: 'jack'}}
  , bar = {e: 3, r: 4}
  , baz = {q: 5, y: 6};
Object.defineProperty(baz, 'd', {
    value: 'rose',
    writable: true,
    enumerable: false,
    configurable: true
})
// 用于将所有可枚举属性的值从一个或多个源对象复制到目标对象并返回目标对象
// 只会拷贝源对象自身的并且可枚举的属性到目标对象
const fo = Object.assign(foo, bar, baz)
console.log(fo, foo.c === fo.c);
```

```
// 判断两个值是否是相同的值。
// 这种相等性判断逻辑和传统的 == 运算不同，== 运算符会对它两边的操作数做隐式类型转换（如果它
// 们类型不同），然后才进行相等性比较，（所以才会有类似 "" == false 等于 true 的现象），但 
// Object.is 不会做这种类型转换。

// 这与 === 运算符的判定方式也不一样。=== 运算符（和== 运算符）将数字值 -0 和 +0 视为相等，并认为 Number.NaN 不等于 NaN。
console.log(Object.is(NaN, NaN), NaN == NaN, NaN === NaN); // => true false false
console.log(Object.is(0, -0), 0 == -0, 0 === -0);    // => false true true
console.log(Object.is(42, 42));   // => true
console.log(Object.is(42, '42'), 42 == '42', 42 === '42'); // => false true false
```

```
function Parent(){}
function Child(){}
// 设置一个指定的对象的原型 ( 即, 内部[[Prototype]]属性）到另一个对象或  null
Object.setPrototypeOf(Child.prototype, Parent.prototype);
console.log(new Child instanceof Child);  // => true
console.log(new Child instanceof Parent); // => true
```

```
// 从一个类似数组(拥有一个 length 属性和若干索引属性的任意对象)或可迭代对象(可以获取对象中的元素,如 Map和 Set 等)中创建一个新的，浅拷贝的数组实例
// Array.from(obj, mapFn, thisArg) 就相当于 Array.from(obj).map(mapFn, thisArg)
Array.from(new Set([1, 2, 3, 2, 1]));      // => [1, 2, 3]
Array.from({0: 1, 1: 2, 2: 3, length: 3}); // => [1, 2, 3]
Array.from('123', Number);                 // => [1, 2, 3]
Array.from('123', function(it){
  return it * it;
});                                        // => [1, 4, 9]
```

```
// 创建一个具有可变数量参数的新数组实例，而不考虑参数的数量或类型
Array.of(1);       // => [1]
Array.of(1, 2, 3); // => [1, 2, 3]

// Array.of() 和 Array 构造函数之间的区别在于处理整数参数：Array.of(7) 创建一个具有单个元素 7 的数组，而 Array(7) 创建一个长度为7的空数组
Array(7);          // [ , , , , , , ]
Array(1, 2, 3);    // [1, 2, 3]
```

```
var array = ['a', 'b', 'c'];

for(var val of array)console.log(val);          // => 'a', 'b', 'c'
for(var val of array.values())console.log(val); // => 'a', 'b', 'c'
for(var key of array.keys())console.log(key);   // => 0, 1, 2
for(var [key, val] of array.entries()){
  console.log(key);                             // => 0, 1, 2
  console.log(val);                             // => 'a', 'b', 'c'
}
```

```
function isOdd(val){
  return val % 2;
}
[4, 8, 15, 16, 23, 42].find(isOdd);      // => 15
[4, 8, 15, 16, 23, 42].findIndex(isOdd); // => 2
[4, 8, 15, 16, 23, 42].find(isNaN);      // => undefined
[4, 8, 15, 16, 23, 42].findIndex(isNaN); // => -1
```

```
Array(5).fill(42); // => [42, 42, 42, 42, 42]
```

```
[1, 2, 3, 4, 5].copyWithin(0, 3); // => [4, 5, 3, 4, 5]
```

```
'foobarbaz'.includes('bar');      // => true
'foobarbaz'.includes('bar', 4);   // => false
```

```
'foobarbaz'.startsWith('foo');    // => true
'foobarbaz'.startsWith('bar', 3); // => true
```

```
'foobarbaz'.endsWith('baz');      // => true
'foobarbaz'.endsWith('bar', 6);   // => true
```

```
var a = [1];

var map = new Map([['a', 1], [42, 2]]);
map.set(a, 3).set(true, 4);

console.log(map.size);        // => 4
console.log(map.has(a));      // => true
console.log(map.has([1]));    // => false
console.log(map.get(a));      // => 3
map.forEach(function(val, key){
  console.log(val);           // => 1, 2, 3, 4
  console.log(key);           // => 'a', 42, [1], true
});
map.delete(a);
console.log(map.size);        // => 3
console.log(map.get(a));      // => undefined
console.log(Array.from(map)); // => [['a', 1], [42, 2], [true, 4]]

var map = new Map([['a', 1], ['b', 2], ['c', 3]]);

for(var [key, val] of map){
  console.log(key);                           // => 'a', 'b', 'c'
  console.log(val);                           // => 1, 2, 3
}
for(var val of map.values())console.log(val); // => 1, 2, 3
for(var key of map.keys())console.log(key);   // => 'a', 'b', 'c'
for(var [key, val] of map.entries()){
  console.log(key);                           // => 'a', 'b', 'c'
  console.log(val);                           // => 1, 2, 3
}
```

```
var set = new Set(['a', 'b', 'a', 'c']);
set.add('d').add('b').add('e');
console.log(set.size);        // => 5
console.log(set.has('b'));    // => true
set.forEach(function(it){
  console.log(it);            // => 'a', 'b', 'c', 'd', 'e'
});
set.delete('b');
console.log(set.size);        // => 4
console.log(set.has('b'));    // => false
console.log(Array.from(set)); // => ['a', 'c', 'd', 'e']

var set = new Set([1, 2, 3, 2, 1]);

for(var val of set)console.log(val);          // => 1, 2, 3
for(var val of set.values())console.log(val); // => 1, 2, 3
for(var key of set.keys())console.log(key);   // => 1, 2, 3
for(var [key, val] of set.entries()){
  console.log(key);                           // => 1, 2, 3
  console.log(val);                           // => 1, 2, 3
}
```

ECMASCRIPT 2015,简称es6，兼容性如下图所示

![image](https://user-images.githubusercontent.com/20950813/63211140-ec110580-c125-11e9-8688-355cbdc67672.png)

pc端edge12+,ff54+,ch51+,sf10+;
mobile端ios10+,android5+;
node端6+

#### ECMASCRIPT 2016 简称es2016，2016年发布的版本

新增的常用api如下所示

```
Array
  #includes(var, from?) -> bool
```

Example

```
[1, 2, 3].includes(2);        // => true
[1, 2, 3].includes(4);        // => false
[1, 2, 3].includes(2, 2);     // => false

[NaN].indexOf(NaN);           // => -1
[NaN].includes(NaN);          // => true
Array(1).indexOf(undefined);  // => -1
Array(1).includes(undefined); // => true
```

#### ECMASCRIPT 2017 简称es2017，2017年发布的版本

```
Object
  .values(object) -> array
  .entries(object) -> array
  .getOwnPropertyDescriptors(object) -> object
String
  #padStart(length, fillStr = ' ') -> string
  #padEnd(length, fillStr = ' ') -> string
```

#### ECMASCRIPT 2018 简称es2018，2018年发布的版本

```
Promise
  #finally(onFinally()) -> promise
```

#### ECMASCRIPT 2019 简称es2019，2018年发布的版本

```
String
  #trimLeft()  -> string
  #trimRight() -> string
  #trimStart() -> string
  #trimEnd()   -> string
```

### core-js是怎么去实现polyfill的

core-js2.x常用的引入方式如下所示

```
// 全局polyfill
require('core-js');
// 没有全局污染的polyfill
var core = require('core-js/library');
// 仅有Shim
require('core-js/shim');

// 单个api polyfill
require('core-js/fn/array/find-index');

// 无全局污染的单个api polyfill
var findIndex = require('core-js/library/fn/array/find-index');
```

全局polyfill与单个api polyfill的区别，全局是引入es5、es6、es7等新增的所有api的polyfill；而单个只是引入某一个api的polyfill；所以在项目中如果知道使用了哪些api，那么仅引入对应的api的polyfill即可，这样可以减少包的体积；

全局polyfill与没有全局污染的polyfill的区别，有污染的指的是直接在window上添加静态方法or属性，在Array等构造函数上添加静态方法or原型方法，如findIndex方法，会直接添加到Array.prototype的原型上，这就直接污染了Array.prototype；而无污染指的是，不会直接在window上添加静态方法or属性，在Array等构造函数上添加静态方法or原型方法，而是放在了core全局变量or直接export该api；所以'core-js/library'引入的就是无污染的polyfill，源码的实现如下所示，已findIndex为例

```
有污染
// modules/es6.array.find-index.js

var $export = require('./_export');
var $find = require('./_array-methods')(6);
var KEY = 'findIndex';
var forced = true;

// 调用$export，往Array原型上添加findIndex方法
$export($export.P + $export.F * forced, 'Array', {
  // findIndex的polyfill实现
  findIndex: function findIndex(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// modules/_export.js

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // 判断浏览器是否支持原生方法
    own = !IS_FORCED && target && target[key] !== undefined;
    // 获取输出的方法，如果浏览器上支持该方法则直接返回该方法，如果浏览器不支持则返回传入的polyfill方法
    out = (own ? target : source)[key];
    // 如果是全局方法则需要绑定上下文
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // 判断是否需要往Array等构造函数or原型上添加对应的polyfill方法
    if (target) redefine(target, key, out, type & $export.U);
    // 往全局变量core上添加polyfill方法
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};

无污染
// library/modules/es6.array.find-index.js

var $export = require('./_export');
var $find = require('./_array-methods')(6);
var KEY = 'findIndex';
var forced = true;

$export($export.P + $export.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn /* , that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

// library/modules/_export.js，没有往Array等构造函数or原型上添加对应的polyfill方法

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && has(exports, key)) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
    }
  }
};
```

全局polyfill与shim区别，shim仅包含标准方法，而全局polyfill除了包含标准方法还有一些非标准的方法，如非标准方法

```
Object
  .isObject(var) -> bool
  .classof(var) -> string
  .define(target, mixin) -> target
  .make(proto | null, mixin?) -> object
```

### 如何使用browserslist

browserslist用于在不同前端工具之间共享目标浏览器和Node.js版本的配置，如Autoprefixer、babel等；告诉前端工具，当前项目运行的目标浏览器及node版本是，这样工具可以根据目标浏览器及node版本添加对应的css前缀及语法是否需要转化；以babel为例，已模版字符串及async函数为例

模版字符串的兼容性

![image](https://user-images.githubusercontent.com/20950813/63220770-e61c3280-c1c0-11e9-8aab-6136204caad6.png)

async的兼容性

![image](https://user-images.githubusercontent.com/20950813/63220781-0f3cc300-c1c1-11e9-891c-726dc1089317.png)

```
index.js

const name = 'jack';
const  desc = `你好 ${name}`;
async function getList() {}

```

```
.babelrc

{
    "presets": [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "node": "7.0.0",
                    "browsers": "ie >= 9"
                }
            }
        ]
    ]
}

```

babel处理后的index.js

```
"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var name = 'jack';
var desc = "\u4F60\u597D ".concat(name);

function getList() {
  return _getList.apply(this, arguments);
}

function _getList() {
  _getList = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getList.apply(this, arguments);
}
```

明显模版字符串及async都做例转化，因为我们的目标浏览器是ie >= 9，node版本是7.0.0；这些目标环境都是不支持模版字符串及async，所以都进行例转化；我们修改下目标参数

已支持async函数的版本为目标环境
```
.babelrc

{
    "presets": [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "node": "7.6.0",
                    "browsers": "edge >= 15"
                }
            }
        ]
    ]
}
```

babel转化后的index.js

```
"use strict";

const name = 'jack';
const desc = `你好 ${name}`;

async function getList() {}
```
明显模版字符串及async都没有做转化，因为我们的目标浏览器是edge >= 15，node版本是7.6.0；这些目标环境都是支持模版字符串及async，所以没有进行例转化；

已支持模版字符串的版本为目标环境
```
.babelrc
{
    "presets": [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "node": "4",
                    "browsers": "edge 13"
                }
            }
        ]
    ]
}
```

babel转化后的index.js

```
"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var name = 'jack';
var desc = `你好 ${name}`;

function getList() {
  return _getList.apply(this, arguments);
}

function _getList() {
  _getList = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getList.apply(this, arguments);
}

```
明显模版字符串没有做转化，而async则做了转化，因为我们的目标浏览器是edge >= 13，node版本是4；这些目标环境都是支持模版字符串但不支持async，所以模版字符串没有被转化，而async进行了转化；

通过babel中对browserslist的使用，可以看出其它前端工具使用browserslist的目的也是一样的；

browserslist的配置方式

1. 在package.json内添加browserslist字段

```
 "browserslist": [
    "last 1 version",
    "> 1%",
    "maintained node versions",
    "not dead"
  ]
```

2. 单独的.browserslistrc配置文件

```
last 1 version
> 1%
maintained node versions
not dead
```

3. 各个工具中对应的属性，如babel中的targets属性

```
{
    "presets": [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "node": "4",
                    "browsers": "edge >= 13"
                }
            }
        ]
    ]
}

{
    "presets": [
        [
            "@babel/preset-env",
            {
                "targets": "edge >= 13"
            }
        ]
    ]
}
```

browserslist中浏览器关键字

1. `Android` for Android WebView.
2. `Baidu` for Baidu Browser.
3. `Chrome` for Google Chrome.
4. `Edge` for Microsoft Edge.
5. `Explorer` or `ie` for Internet Explorer.
6. `Firefox` or `ff` for Mozilla Firefox.
7. `iOS` or `ios_saf` for iOS Safari.
8. `Node` for Node.js.
9. `Safari` for desktop Safari.

browserslist的组合查询，与、或、非

or
```
> .5% or last 2 versions 
> .5%, last 2 versions
```

and
```
> .5% and last 2 versions
```

not
```
> .5% and not last 2 versions 
> .5% or not last 2 versions 
> .5%, not last 2 versions
```

browserslist的常用查询条件

1. `> 5%`: browsers versions selected by global usage statistics. `>=, < and <=` work too.
2. `cover 99.5%`: most popular browsers that provide coverage.
3. `maintained node versions`: all Node.js versions, which are still maintained by Node.js Foundation.
4. `node 10` and `node 10.4`: selects latest Node.js 10.x.x or 10.4.x release.
5. `current node`: Node.js version used by Browserslist right now.
6. `ie 6-8`: selects an inclusive range of versions.
7. `Firefox > 20`: versions of Firefox newer than `20. >=`, `< and <=` work too. It also works with Node.js.
8. ` iOS 7`: the iOS browser version 7 directly.
9. `unreleased versions or unreleased Chrome versions`: alpha and beta versions.
10. `last 2 major versions or last 2 iOS major versions`: all minor/patch releases of last 2 major versions.
11. `since 2015 or last 2 years`: all versions released since year 2015 (also since 2015-03 and since 2015-03-10).
12. `dead`: browsers without official support or updates for 24 months. Right now it is IE 10, IE_Mob 10, BlackBerry 10, BlackBerry 7, Samsung 4 and OperaMobile 12.1.
13. `last 2 versions`: the last 2 versions for each browser.
14. `last 2 Chrome versions`: the last 2 versions of Chrome browser.
15. `defaults`: Browserslist’s default browsers (> 0.5%, last 2 versions, Firefox ESR, not dead).
16. `not ie <= 8`: exclude browsers selected by previous queries.

参考链接：
https://github.com/browserslist/browserslist
https://caniuse.com/
https://kangax.github.io/compat-table/es6/
https://github.com/zloirock/core-js
