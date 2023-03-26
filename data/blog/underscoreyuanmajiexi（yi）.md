---
  title: underscore源码解析（一）
  date: 2018-01-29T08:11:55Z
  lastmod: 2018-01-30T07:38:34Z
  summary: 
  tags: ["underscore"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

一时技痒，想找点源码来看看，于是找到了undescore这一个陪伴我们走过了好几个年头的工具函数库，来学习一下代码的组织方式及一些方法的实现思路，现整理如下，从underscore的第一个提交版本开始即0.1.0版本

总的思路是直接在window下添加一个对象，然后在这个对象内定义属性与方法，整个库的方法是按钮类型来划分，如集合类方法，数组类方法，函数类方法，对象类方法，工具方法等；

## 一.集合方法
**each**（**遍历数组or对象**）方法实现的思路: 先判断是否支持forEach方法，支持则直接调用，不支持则判断是否是数组，是则调用for循环，使用call方法来调用回调函数，考虑兼容性判断是否支持each方法，如果支持则调用，最后判断是否是对象，如果是则对对象则修改下传入参数的结构，如果以上都不是则直接抛出错误；

**关键点: call方法 及对对象传入参数的处理**
```
each : function(obj, iterator, context) {
    var index = 0;
    try {
   	  // 判断是否有传入的数据类型是否有forEach，有则执行
      if (obj.forEach) {
        obj.forEach(iterator, context);
      } else if (obj.length) {
      	// 没有forEach，然后判断是否是数组，是数组则使用for循环，然后调用回调函数，把参数传入
        for (var i=0; i<obj.length; i++) iterator.call(context, obj[i], i);
      } else if (obj.each) {
      	// 是否有each方法
        obj.each(function(value) { iterator.call(context, value, index++); });
      } else {
      	// 如果以上条件都不满足就使用for in 遍历，是对对象的一个扩展
        var i = 0;
        for (var key in obj) {
          var value = obj[key], pair = [key, value];
          pair.key = key;
          pair.value = value;
          iterator.call(context, pair, i++);
        }
      }
    } catch(e) {
      if (e != '__break__') throw e;
    }
    // 最后返回传入的数据
    return obj;
  },
```

**map**（**对数组or对象进行操作，并返回操作后的值的集合**）方法实现的思路: 先判断是否支持map方法，如果支持则直接调用map方法，如果不支持则直接调用each方法，在each方法内push回调函数的返回值，并返回包含回调函数返回值的数组

**关键点: 接收返回值并返回一个包含返回值的数组**
```
map : function(obj, iterator, context) {
  	// 如果支持map方法则使用原生的map方法
    if (obj && obj.map) return obj.map(iterator, context);
    // 否则使用each方法
    var results = [];
    _.each(obj, function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    // 返回iterator处理过后的回调
    return results;
  }
```

**inject**方法实现的思路: 调用each方法，在each方法内调用回调函数，并把回调函数赋值给传入的一个形参，并最终返回这个形参，该方法是一个中间方法，做闭包用

**关键点: memo形参即iterator回调函数必须返回memo形参**
```
inject : function(obj, memo, iterator, context) {
    _.each(obj, function(value, index) {
      memo = iterator.call(context, memo, value, index);
    });
    return memo;
  }
```
**detect**（**返回满足条件的第一个元素**）方法实现的思路: 调用each方法，在each方法内调用回调函数，对回调函数的值做判断，如果满足回调函数的值为真则终止循环，直接返回value值

**关键点: 回调函数需要有返回值**

```
detect : function(obj, iterator, context) {
    var result;
    _.each(obj, function(value, index) {
      if (iterator.call(context, value, index)) {
        result = value;
        throw '__break__';
      }
    });
    return result;
  }
```

**select**（**返回集合中满足条件的值的数组**）方法实现的思路: 先判断是否支持filter方法，如果支持则直接调用，如果不支持则调用each方法，然后判断回调函数的值，如果true则push，反之则不然，最后返回一个包含满足条件的数组

**关键点: 回调函数需要有返回值与detect方法的区别就是一个是获取的所有满足条件一个是获取第一个满足条件的值**

```
select : function(obj, iterator, context) {
  	// 判断是否支持filter方法
    if (obj.filter) return obj.filter(iterator, context);
    var results = [];
    _.each(obj, function(value, index) {
      if (iterator.call(context, value, index)) results.push(value);
    });
    return results;
  }
```

**reject**（**返回集合中不满足条件的值的数组**）方法实现的思路与select一致，只是判断条件取反

```
reject : function(obj, iterator, context) {
    var results = [];
    _.each(obj, function(value, index) {
      if (!iterator.call(context, value, index)) results.push(value);
    });
    return results;
  }
```

**all**（**判断集合内所有的选项是否都满足条件，满足返回true，不满足返回false**）实现的思路: 先判断是否有传入回调函数，没有则默认一个，判断是否支持every方法，支持则调用，不支持则调用each方法，定义一个变量，一旦出现不满足条件的情况，将变量至为false并终止循环返回结果

**关键点: 定义一个flag变量**

```
all : function(obj, iterator, context) {
    iterator = iterator || function(v){ return v; };
    if (obj.every) return obj.every(iterator, context);
    var result = true;
    _.each(obj, function(value, index) {
    	// 出现false就停止遍历
      result = result && !!iterator.call(context, value, index);
      if (!result) throw '__break__';
    });
    return result;
  }
```

**any**（**判断集合内是否有满足条件的选项，如果有则返回true，否则返回false**）方法实现的思路与all一致，只是判断条件不一样

```
any : function(obj, iterator, context) {
    iterator = iterator || function(v) { return v; };
    if (obj.some) return obj.some(iterator, context);
    var result = false;
    _.each(obj, function(value, index) {
      if (result = !!iterator.call(context, value, index)) throw '__break__';
    });
    return result;
  }
```

**include**（**判断集合内是否包含目标元素，如果包含则返回true，否则返回false**）实现的思路: 判断传入的集合是否是数组，如果是则直接调用indexOf进行判断，否则调用each方法判断，定义一个flag变量，如果有则将flag变量置为true，反之

**关键点: 判断类型，flag变量**

```
include : function(obj, target) {
    // 如果是数组，则用indexOf判断
    if (_.isArray(obj)) return _.indexOf(obj, target) != -1;
    var found = false;
    // 如果是对象
    _.each(obj, function(pair) {
      if (pair.value === target) {
        found = true;
        throw '__break__';
      }
    });
    return found;
  }
```

**invoke**（**将传入的集合，按照传入的某个方法进行操作之后在返回**）实现的思路: 截取第三个即以后传入的参数，调用map方法，判断是否有传入回调函数，如果有则执行，如果没有则返回

**关键点: 截取参数**

```
invoke : function(obj, method) {
    var args = _.toArray(arguments).slice(2);
    return _.map(obj, function(value) {
      return (method ? value[method] : value).apply(value, args);
    });
  }
```

**pluck**（**按某个key提取集合内对应的value值，并用数组返回**）实现思路: 调用each方法，将传入的key对应的value push到一个空数组内并返回

**关键点: key值**

```
pluck : function(obj, key) {
    var results = [];
    _.each(obj, function(value){ results.push(value[key]); });
    return results;
  }
```

**max**（**获取集合内的最大值**）实现思路: 如果是数组且没有传入回调函数，则使用Math.max方法进行获取最大值，如果是对象则调用each方法，定义一个flag对象用于保存原始值即当前比较的最大值，最后返回flag对象的value值

**关键点: 类型判断，flag对象**

```
max : function(obj, iterator, context) {
  	// 如果没有传入回调函数，且传入的集合为数组。则直接使用Math的max方法
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result;
    _.each(obj, function(value, index) {
      // 用一个对象对报错上一个值，当当前值大于上一个值的时候，重新赋值一次，最后输出result.value最大值
      var computed = iterator ? iterator.call(context, value, index) : value;
      if (result == null || computed >= result.computed) result = {value : value, computed : computed};
    });
    return result.value;
  }
```

**min**（**获取集合内的最小值**）方法: 实现的思路与max方法一致，只是判断条件不一样

**sortBy**（返回按某个字段排序之后的集合）实现思路: 

**sortedIndex**

**toArray**（**将类数组对象转换为数组**）实现思路: 判断传入的参数是否为空，如果为空则返回一个空数组，然后判断是否是一个数组，如果是一个数组则直接返回，最后调用map方法

**关键点: 类型判断，传入map方法的回调**

```
toArray : function(iterable) {
    if (!iterable) return [];
    if (_.isArray(iterable)) return iterable;
    // 否则调用map方法返回一个数组
    return _.map(iterable, function(val){ return val; });
  }
```

**size**（**获取集合的长度**）实现思路: 这里是先想传入的集合调用toArray处理，然后在取它的length属性

关键点: toArray处理

```
size : function(obj) {
    return _.toArray(obj).length;
  }
```

## 二、数组方法
**first**（**获取数组的第一个元素**）

```
first : function(array) {
    return array[0];
  }
```

**last**（**获取数组的最后一个元素**）

```
last : function(array) {
    return array[array.length - 1];
  }
```

**compact**（**去除数组中的空值**）实现思路，调用select方法，获取有值的项

**关键点: 传入select方法的回调**

```
compact : function(array) {
    return _.select(array, function(value){ return !!value; });
  }
```

**flatten**（**扁平化数组**）实现的思路: 调用inject方法，在回调里面判断每一项，如果是数组则继续调用flatten方法，并将扁平化之后的结果与上一次的结果进行合并，如果不是则push到传入的一个形参数组内，最终返回这个形参数组

**关键点: 闭包，形参数组、对每一项值的判断，如果是数组则继续调用flatten**

```
flatten : function(array) {
    return _.inject(array, [], function(memo, value) {
      // 如果是数组则继续调用flatten，调用完之后与上一次的结果concat，最终返回扁平化之后的数组
      if (_.isArray(value)) {
      	return memo.concat(_.flatten(value));
      }
      memo.push(value);
      return memo;
    });
  }
```

**without**（**返回一个不包含传入项的新数组**）实现思路是将传入的参数，转换为一个数组，然后调用select方法，在回调函数内判断传入数组的每一项是否在参数数组内，如果在则返回false，如果不在则返回true，最终返回不包含传入项的新数组

**关键点: 闭包，参数数组， select回调内的判断条件**

```
without : function(array) {
  	// 将传入的参数转换为数组
    var values = array.slice.call(arguments, 0);
    // 对该数组调用select方法
    return _.select(array, function(value){ 
    	// 判断第一个参数数组内的值，是否在传入参数values内，如果在则返回false，如果不在返回true，从而将一个数组内需要剔除的值剔除掉
    	return !_.include(values, value); 
    });
  }
```

**uniq**（**数组去重**）实现思路: 调用inject方法，在回调内进行判断，如果是第一项or不包含在形参数组内则push到形参数组内，最后返回形参数组

**关键点: 闭包， 形参数组，判断条件**

```
uniq : function(array, isSorted) {
    return _.inject(array, [], function(memo, el, i) {
      // 第一个元素 or _.include(memo, el)不包含在memo内的元素则memo.push(el)
      if (0 == i || (isSorted ? _.last(memo) != el : !_.include(memo, el))) memo.push(el);
      return memo;
    });
  }
```

**intersect**（**返回一个在所有传入参数内都包含的新数组**）实现思路: 获取第二个及其后面的参数并转换为数组，并已第一个数组调用select方法，在select的回调内调用all方法进行判断，只有第一个数组内的当前项在后面的数组内都有时select返回true，否则返回false

**关键点: 闭包， 去重，判断其余项是否含有当前项**

```
intersect : function(array) {
  	// 获取第一个参数之外的其它参数并转换为数组
    var rest = _.toArray(arguments).slice(1);
    // 调用select方法,先对第一个参数的数组去重，select的第二个函数为回调函数，及回调内的值为true则复核选择条件，最终返回一个包含符合条件的数组
    return _.select(_.uniq(array), function(item) {
      // 调用all方法，判断后面的每项参数内是否包含第一个参数内的元素，如果都包含返回true，否则返回false
      return _.all(rest, function(other) { 
        return _.indexOf(other, item) >= 0;
      });
    });
  }
```

**zip**（**返回一个组合后的新数组**）实现思路: 将传入的参数转换为数组，获取数组的最大长度，new一个空数组，调用pluck按下标获取元素，最终返回一个二维数组

**关键点: 获取传入参数数组中最大长度，利用pluck方法按下标来取值**

```
zip : function() {
    var args = _.toArray(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i=0; i<length; i++) results[i] = _.pluck(args, String(i));
    return results;
  }
```

**indexOf**（**获取某个元素在数组内的下标**）实现思路，判断是否支持indexOf方法，如果不支持则利用for循环遍历，判断是否有传入项，有则返回下标，没有则返回-1

```
indexOf : function(array, item) {
    if (array.indexOf) return array.indexOf(item);
    var length = array.length;
    for (i=0; i<length; i++) if (array[i] === item) return i;
    return -1;
  }
```

## 三、函数方法
**bind**（**绑定函数执行上下文**）实现思路: 截取传入的参数，返回一个函数，在返回的函数内合并参数，最终调用apply方法

**关键点: apply方法**

```
bind : function(func, context) {
  	// 如果传入的执行上下文为空则直接返回
    if (!context) return func;
    var args = _.toArray(arguments).slice(2);
    return function() {
      // 合并_.bind()时传入的参数与调用_.bind()()时传入的参数进行合并
      var a = args.concat(_.toArray(arguments));
      // 调用apply方法，传入参数
      return func.apply(context, a);
    };
  }
```

**bindAll**（**给某些方法一起绑定上下文环境**）实现思路: 获取最后一个参数为上下文执行环境，调用each方法遍历绑定bind方法

**关键点: 将方法利用bind重新绑定一次**

```
bindAll : function() {
    var args = _.toArray(arguments);
    // 第一个参数为上下文
    var context = args.pop();
    _.each(args, function(methodName) {
      context[methodName] = _.bind(context[methodName], context);
    });
  }
```

**delay**（**延迟多少秒执行**）实现思路: 利用setTimeout延迟调用

```
delay : function(func, wait) {
    var args = _.toArray(arguments).slice(2);
    return window.setTimeout(function(){ return func.apply(func, args); }, wait);
  }
```

**defer**（**延迟一毫米执行**）实现思路是内部调用了delay方法

```
defer : function(func) {
    return _.delay.apply(_, [func, 1].concat(_.toArray(arguments).slice(1)));
  }
```

**wrap**（**返回一个先执行wrapper函数在执行func函数的新函数**）实现思路是返回调用wrap的时候返回一个函数，在该函数内去使用apply来调用wrapper函数

```
wrap : function(func, wrapper) {
    return function() {
      var args = [func].concat(_.toArray(arguments));
      return wrapper.apply(wrapper, args);
    };
  },
```

## 四、对象方法
**keys**（**返回包含对象key值的数组**）实现思路是传入'key'调用pluck方法，之所以能够传入key获取到对象的key是因为each方法遍历对象的时候对传入回调的参数做了一下处理

```
keys : function(obj) {
    return _.pluck(obj, 'key');
  }
```

**values**（**返回包含对象value的数组**）实现思路与key一致

```
values : function(obj) {
    return _.pluck(obj, 'value');
  }
```

**extend**（**扩展对象的属性or方法**）实现思路for in 遍历需要被扩展的对象，利用中括号语法进行添加属性or方法

```
extend : function(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }
```

**clone**（**返回一个拷贝后的对象**）

```
clone : function(obj) {
    return _.extend({}, obj);
  }
```

**isEqual**（**判断是否相等**）

```
isEqual : function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    // 如果不是一个类型则直接返回false
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!_.isEqual(a[key], b[key])) return false;
    return true;
  }
```

**isElement**（**判断是否是dom节点**）

```
isElement : function(obj) {
    return !!(obj && obj.nodeType == 1);
  }
```

**isArray**（**判断是否是数组**）

```
isArray : function(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  }
```

**isFunction**（**判断是否是函数**）

```
isFunction : function(obj) {
    return typeof obj == 'function';
  }
```

**isUndefined**（**判断是否是undefined**）

```
isUndefined : function(obj) {
    return typeof obj == 'undefined';
  }
```

## 五、工具方法
**uniqueId**（**返回一个自增id**）

```
uniqueId : function(prefix) {
    var id = this._idCounter = (this._idCounter || 0) + 1;
    return prefix ? prefix + id : id;
  }
```

**template**（**编译一段模板**）

```
template : function(str, data) {
    var fn = new Function('obj', 
      'var p=[],print=function(){p.push.apply(p,arguments);};' +
      'with(obj){p.push(\'' +
      str
        .replace(/[\r\t\n]/g, " ") 
        .split("<%").join("\t") 
        .replace(/((^|%>)[^\t]*)'/g, "$1\r") 
        .replace(/\t=(.*?)%>/g, "',$1,'") 
        .split("\t").join("');") 
        .split("%>").join("p.push('") 
        .split("\r").join("\\'") 
    + "');}return p.join('');");
    return data ? fn(data) : fn;  
  }
```

资源链接
https://github.com/jashkenas/underscore/tree/0.1.0
