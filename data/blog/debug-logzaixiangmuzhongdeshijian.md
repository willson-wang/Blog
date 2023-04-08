---
  title: debug log在项目中的实践
  date: 2021-12-03T04:32:47Z
  lastmod: 2021-12-03T04:33:12Z
  summary: 
  tags: ["node", "debub", "log"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/nodejs2.png']
  bibliography: references-data.bib
---

## 目录

- [背景](#背景)
- [使用debug包](#使用debug包)
- [注意事项](#注意事项)
- [总结](#总结)



## 背景

当我们在写代码的时候，总是需要调试的，而比较常用的一种方式则是使用console.log来打印一些我们想要看到的信息，已读写文件的代码为例，如下所示

```js
fs.readFile(usersJson, 'utf-8', function (err, contents){
  console.log('reading', usersJson);
  if(err){ throw err; }
  var users = JSON.parse(contents);
  console.log('User ids & names :');
  console.log(users.map(user => [user.id, user.name]));
  users.forEach(function(user){
    db.accounts.findOne({id: user.id}, function(err, address){
      if(err){ throw err; }
      var filename = 'address' + address.id + '.json';
      console.log(JSON.parse('address'));
      console.log(`writing address file: ${filename}`)
      fs.writeFile(filename, 'utf-8', address, function(err){
        if(err){ throw err; }
        console.log(filename + ' written successfully!');
      });
    });
  });
});
```

我们在开发的时候通过console.log来打印信息，当项目准备上线的时候在删掉console.log，当下次这里出现bug的时候又可能把console.log加回来，那么有没有一种更好的方式，保证我在开发的时候可以console.log，上线的时候把console.log去掉



我们做如下改进

```js
function log(...items){   //console.log can take multiple arguments!
  if(typeof DEBUG !== 'undefined' && DEBUG === true){
    console.log(...items)
  }
}
```

我们自定义一个log方法，然后通过变量DEBUG来开启打印与不打印，这样我们就达到了只写一次代码，可以通过变量来控制console.log



但是这里带来了两个问题

- 硬编码即我们在代码里面需要显示的声明DEBUG的值
- 要么都打印，要么都不打印



第一个问题，在node端我们可以通过环境变量来解决



第二个问题，我们可以通过增加命名空间，然后环境变量传入命名空间来决定console哪个



最终改进代码如下所示

```js
const DEBUG = process.env.DEBUG.split(',');
function log(key, ...items){
  if(typeof DEBUG !== 'undefined' && DEBUG.includes(key)){ 
    console.log(...items)
  }
}

log('database','results recieved');             // using database key
log('http','route not found', request.url);     // using http key
```

到这里我们的console.log已经可以根据环境变量来控制是否需要console，且console哪个命名空间，最终我们也不需要将我们的console代码删除，因为代码内已经是具体的log方式，而不是console.log



那么我们需要自己去封装这个console功能吗？目前来看是不需要的，因为已经有现成的npm包debug封装了这个能力，且提供了更丰富的功能



## 使用debug包

### 安装

```shell
yarn add debug -D
```



### 基础使用

创建一个命名空间的debug函数

```js
// app.js
var debug = require('debug')('http')

debug('第一条console输出');
```



开启console输出

```shell
// linux系统
DEBUG=http node app.js

// window系统
set DEBUG=http & node app.js
```



创建一个库下面不同模块之间的命名空间

```js
var a = require('debug')('worker:a')
  , b = require('debug')('worker:b');
  
var a = require('debug')('worker:a')
  , b = require('debug')('worker:b');

function work() {
  a('doing lots of uninteresting work');
  setTimeout(work, Math.random() * 1000);
}

work();

function workb() {
  b('doing some work');
  setTimeout(workb, Math.random() * 2000);
}

workb();
```



开启所有模块的console输出,以linux为例

```shell
// 方式1:
DEBUG=worker:a,worker:b node app.js

// 方式2
DEBUG=worker:* node app.js

// 方式3
DEBUG=* node app.js
```



开启部分模块的console输出，以linux为例

```
// 方式1:
DEBUG=worker:a node app.js

// 方式2:
DEBUG=worker:*,-worker:b node app.js

// 方式3:
DEBUG=*,-worker:b node app.js
```

注意可以通`-`来排除某个模块



### 进阶使用

#### 环境变量

通过不同的环境变量控制输出

| Name                | Purpose                     |
| ------------------- | --------------------------- |
| `DEBUG`             | 开启与关闭console输         |
| `DEBUG_HIDE_DATE`   | console的时候隐藏TTY时间    |
| `DEBUG_COLORS`      | console的时候隐藏color      |
| `DEBUG_DEPTH`       | console对象时输出的对象深度 |
| `DEBUG_SHOW_HIDDEN` | 显示对应的隐藏属性          |



比如输出的时候不使用颜色

```shell
DEBUG=* DEBUG_COLORS=false node app.js
```



比如输出的时候隐藏时间

```shell
DEBUG=* DEBUG_COLORS=false DEBUG_HIDE_DATE=true node app.js
```



#### 格式化输出

通过内置的与自定义的格式化方法帮助我们优化输出内容的格式

| Formatter | Representation                               |
| --------- | -------------------------------------------- |
| `%O`      | 多行输出对象                                 |
| `%o`      | 单行输出对象                                 |
| `%s`      | 字符串输出                                   |
| `%d`      | 数字输出                                     |
| `%j`      | 当对象出现循环引用的时候，已'[Circular]'表示 |
| `%%`      | 添加%号                                      |

%o与%O内部借助的是util.inspect方法实现的

举个例子

```shell
debug('我叫%s，今年%d岁, 我读的幼儿园在%o, 我们班四岁小朋友占比%%', '小明', 4, {name: '深大幼儿园'}, 60)
// 我叫小明，今年4岁, 我读的幼儿园在{ name: '深大幼儿园' }, 我们班四岁小朋友占比% 60
```



自定义格式化输出方法

比如将Buffer 转化为十六进制

```js
const createDebug = require('debug')
createDebug.formatters.h = (v) => {
  return v.toString('hex')
}

// …elsewhere
const debug = createDebug('foo')
debug('this is hex: %h', new Buffer('hello world'))
//   foo this is hex: 68656c6c6f20776f726c6421 +0ms
```



#### 动态开启与关闭

通过enable与disable来实现动态开启与关闭，而不是环境变量的方式

```js
let debug = require('debug');

console.log(1, debug.enabled('test'));

debug.enable('test');
console.log(2, debug.enabled('test'));

debug.disable();
console.log(3, debug.enabled('test'));
```



## 注意事项

#### node端%O的时候对象没有换行输出 

原因%O内部使用的是`util.inspect`方法来输出对象，而该方法breakLength的默认值为100,也就是字符长度大于100的时候才会换行输出，更多参数参考[util.inspect](https://nodejs.org/api/util.html#util_util_inspect_object_options)



#### 浏览器端也可以使用debug这个库

原因：这个库内部做了判断，实现了node端与browser端，browser端通过通过localStorage保存开启与关闭状态

## 总结

debug库很好的帮助我们解决了频繁删除与添加console.log的问题，也在其它的一些大型开源库中也看到使用debug这个库，比如babel、jest、eslint等，所以我们在开发一些命令行工具的时候很有必要引入这个包帮助我们console.log代码，提高我们的开发效率


