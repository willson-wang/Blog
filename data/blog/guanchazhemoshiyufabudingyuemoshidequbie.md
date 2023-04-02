---
  title: 观察者模式与发布订阅模式的区别
  date: 2020-06-15T08:16:27Z
  lastmod: 2020-06-15T08:22:38Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/js3.png']
  bibliography: references-data.bib
---

<h3>发布订阅模式 </h3>

三个核心因素：订阅者、发布者、调度中心

```
// 创建调度中心
class Event {
    constructor() {
        this.subs = {}
    }

    // 提供订阅方法 
    on(name, cb) {
        if (!this.subs[name]) {
            this.subs[name] = [cb]
        } else {
            this.subs[name].push(cb)
        }
    }

    // 发布方法
    fire(name, ...args) {
        if (this.subs[name]) {
            this.subs[name].forEach((cb) => {
                cb && cb(...args)
            })
        }
    }

    // 删除订阅cb
    remove(name, cb) {
        if (this.subs[name]) {
            const index = this.subs[name].indexOf(cb)
            this.subs[name].splice(index, 1)
        }
    }

    // 删除所有订阅cb
    removeAll(name) {
        this.subs[name].length = 0
    }
}

const eve = new Event() 

eve.on('event1', function (...args) {
    console.log('我在监听event1 cb1', ...args)
})

eve.on('event1', function (...args) {
    console.log('我在监听event1 cb2', ...args)
})

eve.on('event1', function (...args) {
    console.log('我在监听event1 cb3', ...args)
})

eve.removeAll('event1')

eve.fire('event1', {
    data: {
        age: 1,
        name: 'xiaoming'
    }
})

eve.on('event2', function (...args) {
    console.log('我在监听event2 cb1', ...args)
})

const cb2 = function (...args) {
    console.log('我在监听event2 cb2', ...args)
}

eve.on('event2', cb2)

eve.remove('event2', cb2)

eve.fire('event2', {
    data: {
        age: 18,
        name: 'xiaohei'
    }
})
```

还可以考虑不先进行监听也可以接受到消息的场景

<h3>观察者模式</h3> 

两个核心因素：观察者、观察目标

```
// 定义观察目标
class Dep {
    constructor() {
        // 为观察目标收集观察者
        this.subs = []
    }

    add(watcher) {
        this.subs.push(watcher)
    }

    notify() {
        for (let i = 0; i < this.subs.length; i++) {
            this.subs[i].update && this.subs[i].update()
        }
    }

    remove(watcher) {
        const index = this.subs.indexOf(watcher)
        this.subs.splice(index, 1)
    }
}

// 定义观察者
class Watch {
    constructor(name) {
        this.name = name
    }

    update() {
        console.log('update', this.name)
    }
}

const dep1 = new Dep()
const dep2 = new Dep()

const watcher1 = new Watch('watcher1')

const watcher2 = new Watch('watcher2')

const watcher3 = new Watch('watcher3')

dep1.add(watcher1)

dep2.add(watcher1)
dep2.add(watcher2)
dep2.add(watcher3)

dep2.remove(watcher2)

dep1.notify()

dep2.notify()

```
考虑对观察者去重

<h3>结论</h3>

发布-订阅模式是面向调度中心编程的，而观察者模式则是面向目标和观察者编程的。前者用于解耦发布者和订阅者，后者用于耦合目标和观察者，所以我们需要根据实际的业务来进行选择具体的实现方式

<h3>使用场景</h3>

发布订阅模式一般用于跨组件间通信；
观察者模式在vue2版本内实现依赖收集与视图更新

参考链接：
[第 23 题：介绍下观察者模式和订阅-发布模式的区别，各自适用于什么场景](https://github.com/Advanced-Frontend/Daily-Interview-Question/issues/25)
