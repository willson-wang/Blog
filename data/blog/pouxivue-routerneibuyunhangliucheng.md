---
  title: 剖析vue-router内部运行流程
  date: 2020-10-02T08:43:50Z
  lastmod: 2020-10-02T08:48:33Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 全局概览

这里会借助下面这张内部流程图，先有个大致印象，然后后面在逐个进行分析；vue-router 3.1.2

![image](https://user-images.githubusercontent.com/20950813/94904642-32fabf80-04ce-11eb-92f2-c1a68e5850f6.png)

### VueRouter实例化

在得到VueRouter实例对象的时候我们可以传入需要的routes参数，目的是得到一个路由映射关系对象，可以根据path or name快速找到route对应的record记录;也可以传入mode参数，选择路由方式

```
const Foo = { template: '<div>foo</div>' }
const Bar = { template: '<div>bar</div>' }

const routes = [
    { path: '/foo', component: Foo },
    { path: '/bar', component: Bar }
]

const router = new VueRoutes({
	routes,
	mode: 'history' | 'hash' | 'abstract'
})
```

```
function addRouteRecord(pathList, pathMap, nameMap, route) {
    const record: RouteRecord = {
        path: normalizedPath,
        regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
        components: route.components || { default: route.component },
        instances: {},
        name,
        parent,
        matchAs,
        redirect: route.redirect,
        beforeEnter: route.beforeEnter,
        meta: route.meta || {},
        props:
            route.props == null
            ? {}
            : route.components
                ? route.props
                : { default: route.props }
    }

    if (!pathMap[record.path]) {
        pathList.push(record.path)
        pathMap[record.path] = record
    }

    if (!nameMap[name]) {
        nameMap[name] = record
    } 
}

function createRouteMap(routes, oldPathList, oldPathMap, oldNameMap) {
    const pathList = oldPathList || []
    const pathMap = oldPathMap || Object.create(null)
    const nameMap = oldNameMap || Object.create(null)

    routes.forEach(route => {
        addRouteRecord(pathList, pathMap, nameMap, route)
    })

    return {
        pathList,
        pathMap,
        nameMap
    }
}

function createMatcher(routes, router) {
    const { pathList, pathMap, nameMap } = createRouteMap(routes)
}

class VueRoutes {
    constructor(options) {
        this.matcher = createMatcher(options.routes || [], this)
    }
}
```

我们通过vue Router传入routes的时候，会根据routes内部会维护一份路由的映射关系，pathList、pathMap、nameMap对象，key为path or name 值为record;record会最终当成参数传入的route对象的matched属性内，用于router-view内渲染对应组件

### Vue.mixin内给根组件设置_router属性与_route属性

```
Vue.mixin({
    beforeCreate () {
        // 判断是不是根组件，根组件上添加_router、_route属性，并将_route设置为响应式，可以做到_route更新的时候，能够响应式更新视图，同时调用init方法
        if (isDef(this.$options.router)) {
            this._routerRoot = this
            this._router = this.$options.router
            this._router.init(this)
            Vue.util.defineReactive(this, '_route', this._router.history.current)
        } else {
            // 所有子组件访问根组件的_routerRoot属性
            this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
        }
    }
})

Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
})

Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
})

Vue.component('RouterView', View)
Vue.component('RouterLink', Link)
```

通过直接在Vue.prototype上添加$router、$route属性，保证每个vue组件可以通过this.$router及this.$route属性访问路由router对象与route对象；然后将_route属性设置为响应式属性，保证_route属性变化的时候，视图能够更新

### 初始化跳转流程

```
class VueRoutes {
    constructor(options) {
        this.matcher = createMatcher(options.routes || [], this)
    }

    init (app: any /* Vue component instance */) {

        this.apps.push(app)

        if (this.app) {
            return
        }

        this.app = app

        const history = this.history

        // 首次进入跳转逻辑
        if (history instanceof HTML5History) {
            // 如果是history模式，则直接使用history.transition跳转，传入当前url对应的location属性
            history.transitionTo(history.getCurrentLocation())
        } else if (history instanceof HashHistory) {
            const setupHashListener = () => {
                history.setupListeners()
            }
            // 这里与history模式下首次跳转有一个区别就是，这里在跳转成功or失败之后再去注册监听hashChange事件
            history.transitionTo(
                history.getCurrentLocation(),
                setupHashListener,
                setupHashListener
            )
        }

        history.listen(route => {
            this.apps.forEach((app) => {
                // 更新根组件上的_route对象，触发响应式更新
                app._route = route
            })
        })
    }
}

class History {
    listen (cb: Function) {
        this.cb = cb
    }

    transitionTo (
        location: RawLocation,
        onComplete?: Function,
        onAbort?: Function
    ) {
        const route = this.router.match(location, this.current)
        this.confirmTransition(
            route,
            () => {
            this.updateRoute(route)
            },
            err => {}
        )
    }

    confirmTransition (route: Route, onComplete: Function, onAbort?: Function) {
        const current = this.current
        const abort = err => {
            if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
                if (this.errorCbs.length) {
                    this.errorCbs.forEach(cb => {
                    cb(err)
                    })
                } else {
                    warn(false, 'uncaught error during route navigation:')
                    console.error(err)
                }
            }
            onAbort && onAbort(err)
        }
        if (
            isSameRoute(route, current) &&
            route.matched.length === current.matched.length
        ) {
            return abort(new NavigationDuplicated(route))
        }

        runQueue(queue, iterator, () => {
            runQueue(queue, iterator, () => {
                onComplete(route)
            })
        })
    }

    updateRoute (route: Route) {
        this.current = route
        this.cb && this.cb(route)
    }
}
```

init内通过history.transitionTo(history.getCurrentLocation())进行初始化跳转；transitionTo内会先通过this.router.match(location, this.current)返回匹配的route对象，而match方法内则是通过传入的location，然后在nameMap及pathMap内获取对应的匹配项；如果没有回到到则返回首页的route对象，但是route属性的matched属性值为空，最终渲染不出组件；

获取到route对象，之后调用confirmTransition，通过比对route与this.current是否相同，如果相同则abort取消跳转；不相同则调用成功回调，然后执行updateRoute(route)方法，更新this.current及调用this.cb;this.cb内最终会执行app._route = route赋值操作，触发响应式更新


### router.push or router.replace内部执行流程

```
class VueRouter {
    push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
        if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
            return new Promise((resolve, reject) => {
                this.history.push(location, resolve, reject)
            })
        } else {
            this.history.push(location, onComplete, onAbort)
        }
    }

    replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
        if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
            return new Promise((resolve, reject) => {
                this.history.replace(location, resolve, reject)
            })
        } else {
            this.history.replace(location, onComplete, onAbort)
        }
    }
}

class HTML5History extends History {
    push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
        this.transitionTo(location, route => {
            pushState(cleanPath(this.base + route.fullPath))
        }, onAbort)
    }

    replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
        this.transitionTo(location, route => {
            replaceState(cleanPath(this.base + route.fullPath))
        }, onAbort)
    }
}

export function pushState (url?: string, replace?: boolean) {

    const history = window.history
    try {
        if (replace) {
            history.replaceState({ key: getStateKey() }, '', url)
        } else {
            history.pushState({ key: setStateKey(genStateKey()) }, '', url)
        }
    } catch (e) {
        window.location[replace ? 'replace' : 'assign'](url)
    }
}

export function replaceState (url?: string) {
    pushState(url, true)
}

class HashHistory extends History {
    push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
        const { current: fromRoute } = this
        this.transitionTo(
            location,
            route => {
                pushHash(route.fullPath)
            },
            onAbort
        )
    }

    replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
        const { current: fromRoute } = this
        this.transitionTo(
            location,
            route => {
                replaceHash(route.fullPath)
            },
            onAbort
        )
    }
}

function pushHash (path) {
    if (supportsPushState) {
        pushState(getUrl(path))
    } else {
        window.location.hash = path
    }
}

function replaceHash (path) {
    if (supportsPushState) {
        replaceState(getUrl(path))
    } else {
        window.location.replace(getUrl(path))
    }
}
```

VueRouter原型上的push、replace方法，内部是调用this.history.push、this.history.replace方法，而this.history.push、this.history.replace方法内部最终确认跳转之后，使用的又是window.history.pushState、window.history.replaceState api；如果不支持pushState api则使用location.replace、location.assign进行跳转

hash模式下,如果不支持pushState，则使用location.hash、location.replace来实现跳转；

并且我们可以从上面看到，HashHistory、HashHistory内的push、replace方法都是用的是this.transitionTo来进行确认跳转，跳转成功之后，会调用updateRoute，然后更新app._route = route，最终触发根组件的响应式更新


### 浏览器前进后退怎么触发视图更新

history模式下,因为popstate事件，无法监听pushState、replaceState触发的跳转；所以我们直接在HTML5History()构造函数初始化的时候，直接注册popstate事件监听函数；监听回调函数内又通过获取更新后的location，然后通过this.transitionTo来进行导航，最终更新_route属性，从而触发视图更新

```
class HTML5History extends History {
    constructor (router: Router, base: ?string) {
        const initLocation = getLocation(this.base)
        window.addEventListener('popstate', e => {
            const current = this.current

            const location = getLocation(this.base)
            if (this.current === START && location === initLocation) {
                return
            }

            this.transitionTo(location, route => {})
        })
    }
}
```

hash 模式下,定义了setupListeners原型方法，该方法在init的时候会被调用；因为hashChange事件，能够监听到location.hash、location.replace触发的更新，所以没有在HashHistory构造函数执行的时候去过早的设置监听，而是init内的首次跳转成功or失败的回调内在去调用setupListeners设置监听；监听函数内又通过获取更新后的location，然后通过this.transitionTo来进行导航，最终更新_route属性，从而触发视图更新

```
class VueRouter {
    init() {
        if (history instanceof HTML5History) {
            history.transitionTo(history.getCurrentLocation())
        } else if (history instanceof HashHistory) {
            const setupHashListener = () => {
                history.setupListeners()
            }
            history.transitionTo(
                history.getCurrentLocation(),
                setupHashListener,
                setupHashListener
            )
        }
    }
}

class HashHistory extends History {
    setupListeners () {
        const router = this.router

        window.addEventListener(
            supportsPushState ? 'popstate' : 'hashchange',
            () => {
                const current = this.current
                this.transitionTo(getHash(), route => {
                    if (!supportsPushState) {
                        replaceHash(route.fullPath)
                    }
                })
            }
        )
    }
}
```

通过popstate、hashchange事件监听url的变化，然后在监听函数内通过this.transitionTo来进行确认跳转，跳转成功之后，更新_route属性，达到视图更新

注意hash模式下，且浏览器不支持pushState方法，那么我们在通过push、replace方法去实现hash跳转成功的时候，必然会再次触发hashChange事件；那么是怎么做到避免触发第二次跳转的呢？原因就在confirmTransition方法内，对isSameRoute的判断，因为第二次跳转匹配到的route与this.current存的上次route值，是相同的，所以取消了第二次跳转

### 路由钩子的执行机制与顺序

全局路由钩子

```
router.beforeEach((to, from, next) => {
  // ...
})

router.beforeResolve((to, from, next) => {
  // ...
})

router.afterEach((to, from) => {
  // ...
})
```

路由独享的钩子

```
const router = new VueRouter({
    routes: [
        {
            path: '/foo',
            component: Foo,
            beforeEnter: (to, from, next) => {
            // ...
            }
        }
    ]
})
```

组件路由钩子

```
const Foo = {
    template: `...`,
    beforeRouteEnter (to, from, next) {
        // 在渲染该组件的对应路由被 confirm 前调用
        // 不！能！获取组件实例 `this`
        // 因为当守卫执行前，组件实例还没被创建
    },
    beforeRouteUpdate (to, from, next) {
        // 在当前路由改变，但是该组件被复用时调用
        // 举例来说，对于一个带有动态参数的路径 /foo/:id，在 /foo/1 和 /foo/2 之间跳转的时候，
        // 由于会渲染同样的 Foo 组件，因此组件实例会被复用。而这个钩子就会在这个情况下被调用。
        // 可以访问组件实例 `this`
    },
    beforeRouteLeave (to, from, next) {
        // 导航离开该组件的对应路由时调用
        // 可以访问组件实例 `this`
    }
}
```

```

function registerHook (list: Array<any>, fn: Function): Function {
    list.push(fn)
    return () => {
        const i = list.indexOf(fn)
        if (i > -1) list.splice(i, 1)
    }
}

class VueRouter {
    beforeEach (fn: Function): Function {
        return registerHook(this.beforeHooks, fn)
    }

    beforeResolve (fn: Function): Function {
        return registerHook(this.resolveHooks, fn)
    }

    afterEach (fn: Function): Function {
        return registerHook(this.afterHooks, fn)
    }
}

const record = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    instances: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
        route.props == null
        ? {}
        : route.components
            ? route.props
            : { default: route.props }
}

class History {
    confirmTransition() {
    // matched属性是一个数组，包含record对象
    // deactivated 当前route第对应的record
    // updated、activated将要跳转到route对应的record
    const { updated, deactivated, activated } = resolveQueue(
        this.current.matched,
        route.matched
    )

    const queue: Array<?NavigationGuard> = [].concat(
        // 获取deactivated组件内的beforeRouteLeave钩子
        extractLeaveGuards(deactivated),
        // 全局beforeEach钩子
        this.router.beforeHooks,
        // 获取updatedbefore组件内的RouteUpdate钩子
        extractUpdateHooks(updated),
        // 获取路由对象内定义的beforeEnter钩子
        activated.map(m => m.beforeEnter),
        // 加载activated对应的组件，抹除同步引入与异步引入组件的差异，保证钩子也能够按顺序执行
        resolveAsyncComponents(activated)
    )

    const iterator = (hook: NavigationGuard, next) => {
        if (this.pending !== route) {
        return abort()
        }
        try {
            // 调用我们注册的hook，如beforeEach，传入三个参数to,from,next，第三个参数是一个函数；且我们在beforeEach钩子内必须要调用next函数的原因就是，只有调用了next才会真正的调用next，也就是会执行到一个钩子，否则执行就停止了
            hook(route, current, (to: any) => {
                // 根据next传入的参数，做不同的处理
                if (to === false || isError(to)) {
                    // next(false) -> abort navigation, ensure current URL
                    this.ensureURL(true)
                    abort(to)
                } else if (
                    typeof to === 'string' ||
                    (typeof to === 'object' &&
                        (typeof to.path === 'string' || typeof to.name === 'string'))
                    ) {
                        // next('/') or next({ path: '/' }) -> redirect
                        abort()
                        if (typeof to === 'object' && to.replace) {
                            this.replace(to)
                        } else {
                            this.push(to)
                        }
                } else {
                    // confirm transition and pass on the value
                    next(to)
                }
            })
        } catch (e) {
            abort(e)
        }
    }

    runQueue(queue, iterator, () => {
        const postEnterCbs = []
        const isValid = () => this.current === route

        // 获取activated组件的beforeRouteEnter钩子
        const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)

        // [activated组件的beforeRouteEnter钩子, this.router.resolveHooks]
        const queue = enterGuards.concat(this.router.resolveHooks)

        runQueue(queue, iterator, () => {
            if (this.pending !== route) {
                return abort()
            }
            this.pending = null
            onComplete(route)
            if (this.router.app) {
                this.router.app.$nextTick(() => {
                    postEnterCbs.forEach(cb => {
                        cb()
                    })
                })
            }
        })
    })
    }

    updateRoute(route) {
        const prev = this.current
        // 调用this.cb，更新_route属性，说明导航被确认
        this.cb && this.cb(route)
        this.router.afterHooks.forEach(hook => {
            hook && hook(route, prev)
        })
    }
}

function runQueue (queue: Array<?NavigationGuard>, fn: Function, cb: Function) {
    const step = index => {
        if (index >= queue.length) {
            cb()
        } else {
            if (queue[index]) {
                // 调用iterator函数，并传入当前hook，及包含执行下一步的callback
                fn(queue[index], () => {
                    step(index + 1)
                })
            } else {
                step(index + 1)
            }
        }
    }
    step(0)
}
```

完整的导航解析流程

1. 导航触发
2. 调用失活组件内的beforeRouteLeave钩子
3. 调用全局beforeEach钩子
4. 在重用的组件里调用beforeRouteUpdate钩子
5. 调用路由对象内配置的beforeEnter钩子
6. 加载组件
7. 调用被激活组件的beforeRouteEnter钩子
8. 调用全局的 beforeResolve钩子
9. 导航被确认
10. 调用全局的 afterEach 钩子
11. 触发 DOM 更新。
12. 调用 beforeRouteEnter 守卫中传给 next 的回调函数，创建好的组件实例会作为回调函数的参数传入。

### addRoutes动态添加路由规则

```
class VueRouter {
    constructor (options: RouterOptions = {}) {
        this.matcher = createMatcher(options.routes || [], this)
    }

    addRoutes (routes: Array<RouteConfig>) {
        // 调用createMatcher方法内的addRoutes方法，为什么要将addRoutes方法放到createMatcher方法，因为这样我们始终可以保持一份完整的pathList, pathMap, nameMap；而match是用来返回匹配的route对象，所以我们需要保证每次调用match方法的时候pathList, pathMap, nameMap包含所有的路由
        this.matcher.addRoutes(routes)

        // 这里是保证，如果直接访问/a 路径的时候，而/a路由又是通过addRoutes进行添加的，如果不重新执行一次导航的话，虽然pathList, pathMap, nameMap更新成功了，但是不会渲染出/a 匹配的组件

        if (this.history.current !== START) {
            this.history.transitionTo(this.history.getCurrentLocation())
        }
    }
}

function createMatcher(routes, router) {
    const { pathList, pathMap, nameMap } = createRouteMap(routes)

    function addRoutes (routes) {
        createRouteMap(routes, pathList, pathMap, nameMap)
    }

    function match() {}

    return {
        addRoutes,
        match
    }
}
```

我们可以通过addRoutes向我们的应用动态添加路由规则，然后我们就可以动态匹配页面及组件

### route-view渲染组件

```
export default {
    name: 'RouterView',
    functional: true,
    props: {
        name: {
            type: String,
            default: 'default'
        }
    },
    render (_, { props, children, parent, data }) {
        // 标识当前组件是一个router-view组件
        data.routerView = true

        // directly use parent context's createElement() function
        // so that components rendered by router-view can resolve named slots
        const h = parent.$createElement
        const name = props.name
        const route = parent.$route
        const cache = parent._routerViewCache || (parent._routerViewCache = {})

        // determine current view depth, also check to see if the tree
        // has been toggled inactive but kept-alive.
        let depth = 0
        let inactive = false
        // 获取router-view组件的嵌套层数
        while (parent && parent._routerRoot !== parent) {
            const vnodeData = parent.$vnode && parent.$vnode.data
            if (vnodeData) {
                if (vnodeData.routerView) {
                    depth++
                }
                if (vnodeData.keepAlive && parent._inactive) {
                    inactive = true
                }
            }
            parent = parent.$parent
        }
        data.routerViewDepth = depth

        // render previous view if the tree is inactive and kept-alive
        if (inactive) {
            return h(cache[name], data, children)
        }

        const matched = route.matched[depth]
        // 通过matched属性来获取需要渲染的组件
        if (!matched) {
            cache[name] = null
            return h()
        }

        const component = cache[name] = matched.components[name]

        // 合并一下route定义时候传入的props
        let propsToPass = data.props = resolveProps(route, matched.props && matched.props[name])
        if (propsToPass) {
            // clone to prevent mutation
            propsToPass = data.props = extend({}, propsToPass)
            // pass non-declared props as attrs
            const attrs = data.attrs = data.attrs || {}
            for (const key in propsToPass) {
                if (!component.props || !(key in component.props)) {
                    attrs[key] = propsToPass[key]
                    delete propsToPass[key]
                }
            }
        }

        return h(component, data, children)
    }
}
```

RouterView作为一个函数式组件，即无状态 (没有响应式数据)，也没有实例 (没有 this 上下文)，第二个参数提供上下文；通过获取route.matched[depth]属性内的组件，最终调用 h(component, data, children)来渲染对应的ui组件

### 在看全局

在看这张图，是不是清楚了vue-router内部的运行机制了；简而言之vue-router；分为两个部分，第一部分history部分，第二个部分与vue结合部分

history部分提供统一的跳转方法及返回路由对象，允许设置导航成功回调函数、执行钩子函数

vue结合部分则是，通过传入导航监听函数，然后在监听函数内更新app._route,从而达到响应式更新的目的；还有则是对history api的一层封装及提供hooks的注册方法等

![image](https://user-images.githubusercontent.com/20950813/94904729-532a7e80-04ce-11eb-8b7a-a06d3a577666.png)

