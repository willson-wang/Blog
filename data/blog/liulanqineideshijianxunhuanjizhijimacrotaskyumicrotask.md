---
  title: 浏览器内的事件循环机制及macrotask与microtask
  date: 2017-12-26T11:17:29Z
  lastmod: 2018-02-28T03:11:13Z
  summary: 
  tags: ["浏览器", "macrotask", "microtask"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

1. **浏览器的主要组件**包括用户界面、浏览器引擎、呈现引擎(即解析html及css的引擎)、网络、用户界面后端、JavaScript 解释器(js引擎如chrome的v8)、数据存储

2. **清楚浏览器与javascript的关系**
宿主关系，即javascript代码的执行依赖于浏览器，因为浏览器内置了javascript解析器(js引擎，如chrome v8)

3. **event loop到底属于谁的运行机制**
属于浏览器的一套基于事件驱动的循环检测机制，而不是属于js的循环检测机制
根据规范每个浏览器至少要有一个事件循环机制
一个eventloop有一个or多个task queues，一个task queues是一系列有序的task集合
task主要包括Events(并非所有事件都使用任务队列调度，许多任务在其他任务中调度。)、Parsing(解析html)、Callbacks、Using a resource(获取资源)、Reacting to DOM manipulation(dom操作如元素插入文档时)


4. **js是单线程的缘故**
因为js的主要目的是用于用户交互，而同时存在多个线程的话，可能会造成干扰，影响交互

5. **什么是同步，什么是异步，什么是同步操作(同步任务)，什么是异步操作(异步任务)**
一般而言，操作分为：发出调用和得到结果两步。发出调用，立即得到结果是为同步。发出调用，但无法立即得到结果，需要额外的操作才能得到预期的结果是为异步。
同步：就是调用之后一直等待，直到返回结果。
异步：异步则是调用之后，不能直接拿到结果，通过一系列的手段才最终拿到结果（调用之后，拿到结果中间的时间可以介入其他任务）
同步操作: 就是执行同步的过程；直接返回一个值的函数
异步操作: 就是执行异步的过程；如ajax,定时器

6. **什么是主线程，什么是任务队列，eventloop**
主线程是浏览器的一个设定，是浏览器的一个运行池，是浏览器的的运行机制，而不是js的运行机制，是所有任务都在上面执行的线程
任务队列:是一系列包含各种事件，异步操作，定时器等各种队列的一个集合，是在主线程上的一切调用，而队列是任务的集合
任务:分为macrotask（setTimeout、setInterval、setImmediate、I/O、UI交互事件）,microtask(Promise、process.nextTick、MutaionObserver)而主线程与任务队列之间又通过一个eventloop来保证主线程最大程度上来执行js代码(主线程永远在执行中。主线程会不断检查任务队列，即进行某个操作时，会产生某个事件，同时也会设置一个watcher，事件循环的过程中从该watcher上处理事件，处理完已有的事件后，处理下一个watcher,检查完所有watcher后，进入下一轮检查，对某类事件不关心时，则没有相关watcher)，避免出现阻塞等现象，即主线程上的代码执行完毕之后，就会去拿任务队列里面的任务来放到主线程执行，依此循环往复，同时任务队列之间是可以插队的，如定时器任务，


7. **javascript是一门事件驱动的脚本语言**，而事件驱动就是将一切抽象为事件。IO操作完成是一个事件，用户点击一次鼠标是事件，Ajax完成了是一个事件，一个图片加载完成是一个事件

8. **定时器**是浏览器有一个专门的队列来存放定时器，并且有一个专门的机制来判断定时器插入任务队列的时机，即到达时间点后，会形成一个事件（timeout事件）。不同的是一般事件是靠底层系统或者线程池之类的产生事件，定时器事件是靠事件循环不停检查系统时间来判定是否到达时间点来产生事件
换个说法当我们进行定时器调用时，首先会设置一个定时器watcher。事件循环的过程中，会去调用该watcher，检查它的事件队列上是否产生事件（比对时间的方式）

9. **DOM，AJAX，setTimeout是浏览器提供的api，而不是javascript提供的api**

10. **发起ajax前的逻辑和ajax的callback的逻辑**，是2个任务（事件），所以不存在一个事件状态这种东西，ajax回来以后浏览器只是简单的往事件队列里丢一个任务而已，之前发起ajax的那个任务早就结束消失了

11. **非堵塞**就是 js 可以异步执行，即有异步任务时，不会影响到异步任务之后的代码执行

12. **js代码的执行过程**
执行最旧的task（一次） -> 检查是否存在microtask，然后不停执行，直到清空队列（多次）-> render 重复之前步骤

```
console.log(1)

setTimeout(() => {
    console.log(2)
    new Promise(resolve => {
        console.log(4)
        resolve()
    }).then(() => {
        console.log(5)
    })
})

new Promise(resolve => {
    console.log(7)
    resolve()
}).then(() => {
    console.log(8)
})

setTimeout(() => {
    console.log(9)
    new Promise(resolve => {
        console.log(11)
        resolve()
    }).then(() => {
        console.log(12)
    })
})
//1、7、8、2、4、5、9、11、12
```

**代码执行的过程为**
同步任务的代码输出为：1、7
执行microtask,直到misrotask队列为空：8
执行第一任务内的同步任务输出为:2、4
执行第一个任务内的microtask,直到misrotask队列为空: 5
执行第二任务内的同步任务输出为:9、11
执行第二个任务内的microtask,直到misrotask队列为空: 12
依此类推

eventloop已经涉及到底层的一些原理，因为眼界有限，总结会有点片面，不过可以记录下来，等之后有了更深的理解之后再回头来看。

参考链接
https://html.spec.whatwg.org/multipage/webappapis.html#event-loops
https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setTimeout
http://blog.csdn.net/lin_credible/article/details/40143961
https://juejin.im/post/5a6155126fb9a01cb64edb45

