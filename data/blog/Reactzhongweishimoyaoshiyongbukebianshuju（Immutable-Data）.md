---
  title: React中为什么要使用不可变数据（Immutable Data）
  date: 2020-11-10T12:14:37Z
  lastmod: 2020-11-10T12:15:02Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

首先看个例子

```
initState = {
    name: 'jack',
    page: {
        size: 10,
        current: 1
    }
}

const reducer = (state, action) => {
    switch(action.type) {
        case 'ADD':
            return {
                ...state,
                page: {
                    ...state.page,
                    current: state.page.current += 1
                }
            }
    }
}

const reducer = (state, action) => {
    switch(action.type) {
        case 'ADD':
            state.page.current += 1
            return state
    }
}
```

思考一下redux规定reducer要是一个纯函数，即reducer不能直接更改传入的state对象，而是需要重新返回一个新的state对象，这是为什么？

### 可变数据

什么是可变数据(mutable)即一个数据被创建之后，可以随时进行修改，修改之后会影响到原值，那么javascript中有没有这种可变数据，有

javascript中有7中数据类型

基本类型null、undefined、string、number、boolean、symbol

引用类型object

null、undefined、string、number、boolean、symbol都是不可变数据

object一般是可变数据，原因是javascript的对象使用了引用赋值，新的对象简单的引用了原始对象，改变新的对象将影响到原始对象，例如

```
const obj = {a: 1}

const obj2 = obj

obj2.a = 2

// obj2 {a: 2}
// obj {a: 2}
```

这样做的好处可以节约内存，但是在一些不需要这种引用赋值的场景下，而是需要一个一摸一样的object的场景，于是有了浅拷贝与深拷贝，浅拷贝与简单的深拷贝如下所示

```
// 浅拷贝,浅拷贝，只能拷贝对象的第一层属性
Object.assign({}, obj)

// 简单深拷贝
JSON.parse(JSON.stringify(obj))
```

在一些嵌套层级过多的对象上，浅拷贝明显不适用，这时候我们就需要进行深拷贝，一般都是递归实现深拷贝，实现深拷贝的时候需要考虑基本类型、引用类型，循环引用等问题

### 不可变数据

不可变数据(Immutable) 就是一旦创建，就不能再被更改的数据。对Immutable对象的任何修改或添加删除操作都会返回一个新的 Immutable对象。如下所示

```
const obj = {a: 1}

const obj2 = f(obj, (draft) => {
    draft.a = 2
})

const obj3 = function (obj) {
    return {
        ...obj,
        a: 3
    }
}

// obj {a: 1}
// obj {a: 2}
// obj {a: 3}
```

Immutable 实现的原理是Persistent Data Structure（持久化数据结构），也就是使用旧数据创建新数据时，要保证旧数据同时可用且不变。同时为了避免 deepCopy 把所有节点都复制一遍带来的性能损耗，Immutable 使用了（结构共享），即如果对象树中一个节点发生变化，只修改这个节点和受它影响的父节点，其它节点则进行共享。具体如下所示

![TB1zzi_KXXXXXctXFXXbrb8OVXX-613-575](https://user-images.githubusercontent.com/20950813/98672766-46ccf780-2391-11eb-8245-8a4fca2c061c.gif)


Immutable优点

1、 Immutable降低了Mutable带来的复杂度

可变（Mutable）数据耦合了Time和Value的概念，造成了数据很难被回溯

2、 节省内存

Immutable.js 使用了Structure Sharing会尽量复用内存。没有被引用的对象会被垃圾回收。

3、 Undo/Redo，Copy/Paste，甚至时间旅行这些功能做起来小菜一碟

因为每次数据都是不一样的，只要把这些数据放到一个数组里储存起来，想回退到哪里就拿出对应数据即可，很容易开发出撤销重做这种功能。

4、 拥抱函数式编程

Immutable 本身就是函数式编程中的概念，纯函数式编程比面向对象更适用于前端开发。因为只要输入一致，输出必然一致，这样开发的组件更易于调试和组装。


### 不可变数据的几种实现方式

```
// 原始写法
let foo = {a: {b: 1}};
let bar = foo;
bar.a.b = 2;
console.log(foo.a.b);  // 打印 2
console.log(foo === bar);  //  打印 true
```

```
// 不借助第三方库，使用解构写法
let bar = (function (obj) {
    return {
        ...obj,
        a: {
            ...a.b,
            b: 2
        }
    }
})(foo)

console.log(foo.a.b);  // 打印 2
console.log(foo === bar);  //  打印 false
```

```
// 使用 immutable.js
import Immutable from 'immutable';
foo = Immutable.fromJS({a: {b: 1}});
bar = foo.setIn(['a', 'b'], 2);   // 使用 setIn 赋值
console.log(foo.getIn(['a', 'b']));  // 使用 getIn 取值，打印 1
console.log(foo === bar);  //  打印 false
```

```
// 使用immer.js
// foo 原始对象，draftState是foo对象的副本，所有针对draftState的操作最终都会生成一个新的对象
produce(foo, draftState => {
  draftState.a.b = 2;
})

console.log(foo.a.b);  // 打印 2
console.log(foo === bar);  //  打印 false
```

更多的使用方式请直接参考文档

### 不可变数据在项目中运用

react项目中有两个地方用到了不可变数据

1、redux的使用上

2、setState的使用上

先从redux的使用上来说

先看我们的reducer的定义，这个也是最上面的那个例子
```
initState = {
    name: 'jack',
    page: {
        size: 10,
        current: 1
    }
}

const reducer = (state, action) => {
    switch(action.type) {
        case 'ADD':
            return {
                ...state,
                page: {
                    ...state.page,
                    current: state.page.current += 1
                }
            }
    }
}

const reducer = (state, action) => {
    switch(action.type) {
        case 'ADD':
            state.page.current += 1
            return state
    }
}
```

为什么不能直接在state上面修改，这样修改可以少写很多代码也易读，反而要把reducer设计成一个纯函数呢？

<b>首先我们要看不可变数据能够为我们带来如下好处</b>

1. 可以给应用带来性能提升，因为有共享结构那一层
2. 更简单的编程和调试体验
3. 与可被随意篡改的数据相比，永远不变的数据更容易追踪，推导
4. 可以让复杂的变化检测机制得以简单快速的实现。从而确保代价高昂的DOM更新过程只在真正需要的时候进行

<b>而redux需要不变性的原因是</b>

1. redux与react-redux中对与state等相关对象的比对都使用的是浅比较
2. 不可变数据的管理极大地提升了数据处理的安全性。
3. 进行时间旅行调试要求 reducer 是一个没有副作用的纯函数，以此在不同 state 之间正确的移动。

<b>浅比较和深比较有何区别？</b>

浅比较（也被称为 引用相等）只检查两个不同 变量 是否为同一对象的引用；与之相反，深比较（也被称为 原值相等）必须检查两个对象所有属性的值是否相等。

所以，浅比较就是简单的（且快速的）a === b，而深比较需要以递归的方式遍历两个对象的所有属性，在每一个循环中对比各个属性的值。

正是基于性能考虑，Redux 使用浅比较。

<b>为什么在使用可变对象时不能用浅比较？</b>

如果一个函数改变了传给它的可变对象的值，这时就不能使用浅比较。

这是因为对同一个对象的两个引用总是相同的，不管此对象的值有没有改变，它们都是同一个对象的引用。因此，以下这段代码总会返回 true

```
function mutateObj(obj) {
  obj.key = 'newValue'
  return obj
}

const param = { key: 'originalValue' }
const returnVal = mutateObj(param)

param === returnVal
//> true
```

param 与 returnValue 的浅比较只是检查了这两个对象是否为相同对象的引用，而这段代码中总是（相同的对象的引用）。mutateObj() 也许会改变 obj，但它仍是传入的对象的引用。浅比较根本无法判断 mutateObj 改变了它的值。

这也就是我们不能直接修改传入的state对象，而是需要利用解构返回一个新的state对象的原因

通过上一小结的内容，我们可以通过引入一些库来帮助我们实现不可变数据

如immer帮忙我们生成不可以数据，能够减少代码的书写量及可读性

```
// 写法一
const reducer = (state, action) => {
    switch(action.type) {
        case 'ADD':
            return produce(state, (draft) => {
                draft.page.current += 1
            })
    }
}

// 写法二，利用produce第一个参数可以直接传入函数
const reducer = produce((draft, action) => {
    switch(action.type) {
        case 'ADD':
            draft.page.current += 1
    }
})
```

在说setState的使用上，在react中规定state的变更如果要引起视图更新的话一定要显示的调用setState方法，并传入state；而setState只会做一层state属性的合并，也就是说如果一层属性是一个对象，那么我们想要改这个对象内的某个值时，必须要把这个对象的其它属性也添加进去，不然其它属性会丢失，如下所示

```
state = {
    name: 'jack',
    page: {
        size: 10,
        current: 1
    }
}

handleChange = () => {
    this.setState({
        page: {
            // 如果这里不解构一下state.page属性，最终新的state属性内page则只有current属性了；而name属性是会一直存在的
            ...this.state.page,
            current: this.state.page.current += 1
        }
    })
}
```

这个还只有一层，可能我们使用解构很好处理，当有多层的时候，代码将如下所示

```
this.setState({
    page: {
        ...this.state.page,
        current: {
            ...this.state.page.current,
            address: {
                ...this.state.page.current.address,
                time: new Date().getTime()
            }
        }
    }
})
```

换成immer来帮我们处理不可变数据

```
// 注意这里的address、current、page都会生成新的对象，其它属性保持不变，这样可以最大程度，避免依赖了其它引用类型属性的组件触发重新渲染，我们可以在子组件做一层判断
this.setState(produce(draft => {
    // 代码瞬间清爽，也易读，知道我们修改了某某某下面的某个属性值
    draft.page.current.address.time = new Date().getTime()
}))
```

但是从这里我们可以看出来，其实对于setState这个方法，它不关系传入的的state对象是不是一个可变数据，但是，我们可以利用不可变数据来进行性能优化，我们可以通过SCU或者子组件嵌套一层memo来做优化

### 总结

Immutable可以给应用带来极大的性能提升，但是我们还是需要根据实际项目决定，是否需要引入不可变数据库来帮助我们生成不可变数据；目前项目内推荐使用immer来帮助我们生成不可变数据，理由是操作简单，不需要学习新的数据解构及大量api

### 参考链接

[immer.js](https://github.com/immerjs/immer)
[immutable.js](https://github.com/immutable-js/immutable-js)
[Redux FAQ: Immutable Data](https://redux.js.org/faq/immutable-data)
[immer.js 使用文档及在Redux项目中的实践](https://juejin.im/post/6844904024693555213)
[Immutable 详解及 React 中实践](https://zhuanlan.zhihu.com/p/20295971?columnSlug=purerender)
[React高效渲染策略](https://github.com/fi3ework/blog/issues/15)
[为什么不可变性对React很重要？](https://python.freelycode.com/contribution/detail/179)
[React 数据更新 与 Immutable](https://ruirui.me/2019/09/17/react-immutable/)

