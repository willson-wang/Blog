---
  title: 快速掌握前端路由
  date: 2020-08-09T03:56:49Z
  lastmod: 2020-08-09T03:57:35Z
  summary: 
  tags: ["浏览器"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

<h3>什么是web路由？</h3>

在web开发中，“route”是指根据url分配到对应的处理程序。更通俗一点就是route就是URL到函数的映射

<h3>什么又是前端路由？</h3>

在早期的web应用中，每个url都对应一个后端的路由，这意味着，跳转到不同的页面都需要与服务端进行一次交互，也就是说一个web应用一般都是多页面的；

随着ajax的发展，慢慢有了spa，spa的出现大大提高了WEB应用的交互体验。在与用户的交互过程中，不再需要重新刷新页面，获取数据也是通过Ajax 异步获取，页面显示变的更加流畅

但由于SPA中用户的交互是通过JS改变HTML内容来实现的，页面本身的url并没有变化，这导致了两个问题

1. SPA 无法记住用户的操作记录，无论是刷新、前进还是后退，都无法展示用户真实的期望内容。
2. SPA 中虽然由于业务的不同会有多种页面展示形式，但只有一个 url，对 SEO 不友好，不方便搜索引擎进行收录。

为了解决上述的两个问题，前端路由出现了

浏览器提供了可以改变url但不会请求服务端的方式，同时提供了事件用于监听浏览器url的变化，方便我们在url变化之后能够更新视图；也就说在同一个html页面内，通过浏览器提供的方式改变url，然后根据不同的url来进行不同的视图，且url的变化不会去请求服务端；

为此浏览器提供了两种改变url，但是不会去请求服务器的方式，分别是hash值的变化及history对象提供的pushState及replaceState方法


<h3>hash路由</h3>

最早的前端路由方案，可以看成是一种hack方案，因为hash值最早就是用来做锚标记的，只是后面spa流行之后才被用作前端路由

```
https://github.com/willson-wang/Blog?a=1#test
```

主要用到的API

```
const currentHash = window.location.hash // 获取当前hash值

window.location.hash = '#test' // 设置新的hash值

window.replace(window.location.origin + window.location.pathname + '#test') // 替换当前的url

window.addEventListener('hashchange', () => {}) // 监听hash值的变化
```

通过上面的api,我们就已经可以通过改变不同的hash值，然后通过监听hashchange事件，来改变后的hash值，最后根据获取后的hash值，来更新对应的视图，达到前端路由的目的

具体例子如下所示

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="nav">
        <a href="#/page1">page1</a>
        <a href="#/page2">page2</a>
        <a href="#/page3">page3</a>
        <a href="#/page4">page4</a>
    </div>
    <div>
        <button id="btn1">push page2</button>
        <button id="btn2">replace page3</button>
    </div>
    <div id="content"></div>
    <script>
        class HashRouter {
            constructor({routes}) {
                this.routes = routes
                this.render()
                this.bindEvent()
            }

            push(path) {
                window.location.hash = `#${path}`
            }

            replace(path) {
                window.location.replace(window.location.origin + window.location.pathname + '#' + path)
            }

            render() {
                const currentHash = window.location.hash
                const content = document.querySelector('#content')
                const hashValue = currentHash.slice(1)
                console.log('currentHash', currentHash, hashValue)
                let index = 0
                for (let i = 0; i < this.routes.length; i++) {
                    if (this.routes[i].path === hashValue) {
                        index = i
                        break
                    }
                }
                const component = this.routes[index] ? this.routes[index].component : this.routes[0].component
                content.innerHTML = component;
            }

            bindEvent() {
                window.addEventListener('hashchange', this.render.bind(this))
            }
        }

        const routes = [
            {
                path: '/page1',
                component: '<div>page1</div>'
            },
            {
                path: '/page2',
                component: '<div>page2</div>'
            },
            {
                path: '/page3',
                component: '<div>page3</div>'
            },
            {
                path: '/page4',
                component: '<div>page4</div>'
            },
        ]

        const router = new HashRouter({
            routes
        })

        const btn1 = document.querySelector('#btn1')
        const btn2 = document.querySelector('#btn2')
    
        btn1.addEventListener('click', function () {
            router.push('/page2')
        })

        btn2.addEventListener('click', function () {
            router.replace('/page3')
        })
    </script>
</body>
</html>
```

<h3>history路由</h3>

随着前端的spa越来越流行之后，开发者们已经不满足于通过hash的这种前端路由方式，因为url上的#无法去掉，导致url看起来很丑，会导致锚点功能失效，相同 hash 值不会触发动作将记录加入到历史栈中，为了提供更好的体验，html5拓展了history对象，提供了新的api history.pushState() 和 history.replaceState() 方法，它们分别可以添加和修改历史记录条目

```
// state：合法的 Javascript 对象，可以用在 popstate 事件中
// title：现在大多浏览器忽略这个参数，可以直接用 null 代替
// url：任意有效的 URL，用于更新浏览器的地址栏
history.pushState(state, title[, url]) // history.pushState({ 'page_id': 1, 'user_id': 5 }, null, 'hello-world.html')

history.replaceState(state, title[, url]) // / history.replaceState({ 'page_id': 1, 'user_id': 5 }, null, 'hello-world.html')
```

pushState与replaceState方法的唯一区别就是，pushState是向history记录内新增一条url记录，而replaceState是用新的url替换当前旧的当前url记录

监听url的变化，通过onpopstate事件，但是需要注意的是调用history.pushState()或者history.replaceState()不会触发popstate事件. popstate事件只会在浏览器某些行为下触发, 比如点击后退、前进按钮(或者在JavaScript中调用history.back()、history.forward()、history.go()方法)，此外，a 标签的锚点也会触发该事件.

所以跟hashChange事件不同的是，我们不能直接通过onpopstate监听所有url改变的场景，所以我们需要进行拦截操作，以便url变化之后可以达到视图更新的目的

拦截的场景有：

1. a标签的跳转
2. pushState、replaceState改变url

具体例子如下所示

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="nav">
        <a href="/page1">page1</a>
        <a href="/page2">page2</a>
        <a href="/page3">page3</a>
        <a href="/page4">page4</a>
    </div>
    <div>
        <button id="btn1">push page2</button>
        <button id="btn2">replace page3</button>
    </div>
    <div id="content"></div>
    <script>
        class HistoryRouter {
            constructor({routes}) {
                this.routes = routes
                this.render()
                this.bindEvent()
                this.attachA()
            }

            push(path) {
                window.history.pushState({}, null, path)
                this.render()
            }

            replace(path) {
                window.history.replaceState({}, null, path)
                this.render()
            }

            attachA() {
                const nav = document.querySelector('#nav')
                const aEles = nav.children
                const _this = this
                Array.from(aEles).forEach((ele) => {
                    ele.addEventListener('click', function(e) {
                        e.preventDefault()
                        _this.push(e.target.href)
                    })
                })
            }

            render() {
                const pathname = window.location.pathname
                const content = document.querySelector('#content')
                console.log('currenPath', pathname)
                let index = 0
                for (let i = 0; i < this.routes.length; i++) {
                    if (this.routes[i].path === pathname) {
                        index = i
                        break
                    }
                }
                const component = this.routes[index] ? this.routes[index].component : this.routes[0].component
                content.innerHTML = component;
            }

            bindEvent() {
                window.addEventListener('popstate', this.render.bind(this))
            }
        }

        const routes = [
            {
                path: '/page1',
                component: '<div>page1</div>'
            },
            {
                path: '/page2',
                component: '<div>page2</div>'
            },
            {
                path: '/page3',
                component: '<div>page3</div>'
            },
            {
                path: '/page4',
                component: '<div>page4</div>'
            },
        ]

        const router = new HistoryRouter({
            routes
        })

        const btn1 = document.querySelector('#btn1')
        const btn2 = document.querySelector('#btn2')
    
        btn1.addEventListener('click', function () {
            router.push('/page2')
        })

        btn2.addEventListener('click', function () {
            router.replace('/page3')
        })
    </script>
</body>
</html>
```

<h3>最后我们写一个通用一点的Router类</h3>

需要具备以下功能

1. 能够支持hash模式与history模式
2. 能够提供统一的API，进行跳转
3. 能够支持路由钩子
4. 触发前进后退浏览器的默认行为时也能够自动更新视图

整个例子只是一个思路，如果需要用于生产，需要去完善各种边界条件及支持更多的场景

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="nav">
        <a href="/page1">page1</a>
        <a href="/page2">page2</a>
        <a href="/page3">page3</a>
        <a href="/page4">page4</a>
    </div>
    <div>
        <button id="btn1">push page2</button>
        <button id="btn2">replace page3</button>
    </div>
    <div id="content"></div>
    <script>
        // 执行路由钩子，保证钩子能够按顺序执行
        function runQueue(queue, iterator, callback) {
            const step = (index) => {
                if (index >= queue.length) {
                    callback()
                } else {
                    if (queue[index]) {
                        iterator(queue[index], () => {
                            step(index + 1)
                        })
                    } else {
                        step(index + 1)
                    }
                }
            }

            step(0)
        }

        function nomalizeRoute(location) {
            if (typeof location === 'string') {
                const path = location.indexOf('http') > -1 ? location.slice(window.location.origin.length) : location
                return {
                    path
                }
            }
            return location
        }
        class Base {
            constructor(router) {
                this.attachA()
                this.router = router
            }
            push() {}
            replace() {}
            go() {}
            render() {}

            hasRouteInRoutes(route) {
                const index = this.router.routes.findIndex((it) => {
                    return it.path === route.path
                })

                const idx = this.router.routes.findIndex((it) => {
                    return it.path === '/'
                })

                if (index === -1 && idx !== -1) {
                    route.path = '/'
                }

                return index === -1 && idx === -1
            }

            transitionTo(location, onComplete, onAbort) {
                const route = nomalizeRoute(location)
                this.comfirmTransition(route, (newRoute) => {
                    this.router.afterHooks.forEach((cb) => {
                        cb && cb(newRoute, this.router.route)
                    })
                    this.updateRoute(newRoute)
                    onComplete && onComplete(newRoute)
                }, (err) => {
                    onAbort && onAbort(err)
                })
            }

            comfirmTransition(route, onComplete, onAbort) {
                let queue = [].concat(
                    this.router.beforeHooks
                )

                if (this.router.route.path === route.path) {
                    onAbort('跳转到相同地址')
                    return
                }

                if (this.hasRouteInRoutes(route)) {
                    onAbort('找不到当前route')
                    return
                }

                const iterator = (hook, next) => {
                    try {
                        // 执行注册的钩子，传一个next参数给钩子，把控制权交个钩子
                        hook(route, this.router.route, (to) => {
                            if (to === false) {
                                onAbort()
                            } else if (typeof to === 'string' || (typeof to === 'object' && typeof to.path === 'string')) {
                                onAbort()
                                if (typeof to === 'object' && to.isReplace) {
                                    this.replace(to)
                                } else {
                                    this.push(to)
                                }
                            } else {
                                next()
                            }
                        })
                    } catch (error) {
                        onAbort(error)
                    }
                }

                runQueue(queue, iterator, () => {
                    onComplete(route)
                })
            }

            // 阻止a标签的默认事件
            attachA() {
                const nav = document.querySelector('#nav')
                const aEles = nav.children
                const _this = this
                Array.from(aEles).forEach((ele) => {
                    ele.addEventListener('click', function(e) {
                        e.preventDefault()
                        _this.push(e.target.href)
                    })
                })
            }

            updateRoute(route) {
                this.router.route = route
            }
        }
        function pushHash(path) {
            window.location.hash = `#${path}`
        }

        function replaceHash() {
            window.replace(window.location.origin + window.location.pathname + '#' + path)
        }

        class HashRouter extends Base {
            constructor(router) {
                super(router)

                // 监听hashchange事件，保证浏览器前进后台的时候，能够触发钩子及更新视图
                window.addEventListener('hashchange', () => {
                    this.transitionTo({
                        path: window.location.hash.slice(1)
                    }, () => {
                        this.render()
                    })
                })
            }

            push(location, onComplete, onAbort) {
                this.transitionTo(location, (route) => {
                    pushHash(route.path)
                    onComplete && onComplete()
                    this.render()
                }, onAbort)
            }

            replace(location, onComplete, onAbort) {
                this.transitionTo(location, (route) => {
                    replaceHash(route.path)
                    onComplete && onComplete()
                    this.render()
                }, onAbort)
            }

            go(n) {
                window.history.go(n)
            }

            render() {
                const { path } = this.router.route
                // const hashValue = currentHash.slice(1)
                console.log('currentHash', path)
                let index = 0
                for (let i = 0; i < this.router.routes.length; i++) {
                    if (this.router.routes[i].path === path) {
                        index = i
                        break
                    }
                }
                const component = this.router.routes[index] ? this.router.routes[index].component : this.router.routes[0].component
                this.router.routeViewEle.innerHTML = component;
            }
        }

        function pushState(path) {
            window.history.pushState({}, null, path)
        }

        function replaceState(path) {
            window.history.replaceState({}, null, path)
        }

        class HistoryRouter extends Base {
            constructor(router) {
                super(router)

                window.addEventListener('popstate', () => {
                    this.transitionTo({
                        path: window.location.pathname
                    }, () => {
                        this.render()
                    })
                })
            }

            push(location, onComplete, onAbort) {
                this.transitionTo(location, (route) => {
                    pushState(route.path)
                    onComplete && onComplete()
                    this.render()
                }, onAbort)
            }

            replace(location, onComplete, onAbort) {
                this.transitionTo(location, (route) => {
                    replaceState(route.path)
                    onComplete && onComplete()
                    this.render()
                }, onAbort)
            }

            go(n) {
                window.history.go(n)
            }

            render() {
                const { path } = this.router.route
                console.log('currenPath', path)
                let index = 0
                for (let i = 0; i < this.router.routes.length; i++) {
                    if (this.router.routes[i].path === path) {
                        index = i
                        break
                    }
                }
                const component = this.router.routes[index] ? this.router.routes[index].component : this.router.routes[0].component
                this.router.routeViewEle.innerHTML = component;
            }
        }

        function getCurrentRoute (mode) {
            if (mode === 'history') {
                return window.location.pathname
            } else {
                return window.location.hash
            }
        }

        function registerHook(hooks, cb) {
            hooks.push(cb)
            return () => {
                const index = hooks.indexOf(cb)
                if (index > -1) hooks.splite(index, 1) 
            }
        }

        class Router {
            constructor(options) {
                this.beforeHooks = []
                this.afterHooks = []
                this.options = options
                this.routeViewEle = document.querySelector('#content')

                this.routes = options.routes
                this.route = {}

                if (options.mode === 'history') {
                    this.history = new HistoryRouter(this)
                } else {
                    this.history = new HashRouter(this)
                }

                this.init()
            }

            init() {
                const currentRoute = getCurrentRoute(this.options.mode)

                this.history.push(currentRoute)
            }

            push(route) {
                this.history.push(route)
            }

            replace(route) {
                this.history.push(route)
            }

            go(n) {
                this.history.go(n)
            }

            back() {
                this.go(-1)
            }

            forward() {
                this.go(1)
            }

            beforeEach(cb) {
                return registerHook(this.beforeHooks, cb)
            }

            afterEach(cb) {
                return registerHook(this.afterHooks, cb)
            }
        }

        const router = new Router({
            mode: 'hash', // history | hash
            viewEle: '#content',
            routes: [
                {
                    path: '/page1',
                    component: '<div>page1</div>'
                },
                {
                    path: '/page2',
                    component: '<div>page2</div>'
                },
                {
                    path: '/page3',
                    component: '<div>page3</div>'
                },
                {
                    path: '/page4',
                    component: '<div>page4</div>'
                },
                {
                    path: '/',
                    component: '<div>page1</div>'
                },
            ]
        })

        router.beforeEach((to, from, next) => {
            console.log('beforeEach', to, from)
            next()
        })

        router.afterEach((to, from) => {
            console.log('afterEach', to, from)
        })

        const btn1 = document.querySelector('#btn1')
        const btn2 = document.querySelector('#btn2')
    
        btn1.addEventListener('click', function () {
            router.push('/page2')
        })

        btn2.addEventListener('click', function () {
            router.replace('/page3')
        })

    </script>
</body>
</html>
```


总结：
	前端路由只要把握两个点：1. 提供方法改变url而不会向服务端发起请求；2. 有方法能够监听url的变化；就已经知道前端路由具体是什么了；其它的都是结合各自的前端框架，写出符合当前框架的前端路由

参考链接：
[前端进阶彻底弄懂前端路由](https://juejin.im/post/6844903890278694919)
[History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)
[vue-router](https://github.com/vuejs/vue-router)
