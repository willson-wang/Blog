---
  title: 剖析react-router内部运行流程
  date: 2020-10-05T03:10:24Z
  lastmod: 2020-10-05T03:14:04Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/react-router.jpeg']
  bibliography: references-data.bib
---

### 全局概览

这里会借助下面这张内部流程图，先有个大致印象，然后后面在逐个进行分析；react-router 5.2.0

![image](https://user-images.githubusercontent.com/20950813/95036238-e09de680-06f9-11eb-8bcb-117aafeb7be5.png)

### react-router与react-router-dom是什么关系

react-router是一个monorepo仓库；多个项目放在react-router的packages目录下，分别为react-router、react-router-dom、react-router-config、react-router-native；

react-router是核心方法及组件库被react-router-dom及react-router-native依赖，如提供router、route、redirect、prompt、switch、withRouter、matchPath组件or方法

react-router-dom 浏览器端路由库，提供了BrowserRouter、HashRouter、Link、NavLink组件，供我们直接使用

react-router-native native端路由库

react-router-config 提供静态配置路由的组件

所以我们浏览器端直接引入react-router-dom即可，如果我们使用静态路由配置，可以引入react-router-config or 自己封装一次

### BrowserRouter与HashRouter初始化

```
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";


<Router>
    <Switch>
        <Route exact path="/">
            <Home />
        </Route>
        <Route path="/about">
            <About />
        </Route>
        <Route path="/dashboard">
            <Dashboard />
        </Route>
    </Switch>
</Router>

class BrowserRouter extends React.Component {
    history = createBrowserHistory(this.props);

    render() {
        return <Router history={this.history} children={this.props.children} />;
    }
}

function createBrowserHistory() {
    const globalHistory = window.history;

    const transitionManager = createTransitionManager();

    let listenerCount = 0;

    function checkDOMListeners(delta) {
        listenerCount += delta;

        if (listenerCount === 1 && delta === 1) {
            window.addEventListener(PopStateEvent, handlePopState);

            if (needsHashChangeListener)
            window.addEventListener(HashChangeEvent, handleHashChange);
        } else if (listenerCount === 0) {
            window.removeEventListener(PopStateEvent, handlePopState);

            if (needsHashChangeListener)
            window.removeEventListener(HashChangeEvent, handleHashChange);
        }
    }

    let isBlocked = false;

    function block(prompt = false) {
        const unblock = transitionManager.setPrompt(prompt);

        if (!isBlocked) {
            checkDOMListeners(1);
            isBlocked = true;
        }

        return () => {
            if (isBlocked) {
            isBlocked = false;
            checkDOMListeners(-1);
            }

            return unblock();
        };
    }

    function listen(listener) {
        const unlisten = transitionManager.appendListener(listener);
        checkDOMListeners(1);

        return () => {
            checkDOMListeners(-1);
            unlisten();
        };
    }

    const history = {
        length: globalHistory.length,
        action: 'POP',
        location: initialLocation,
        block,
        listen
    };

    return history; 

}

```

BrowserRouter组件内引入router组件，并传入createBrowserHistory返回的history对象；history对象，提供了listen方法，用于注册路由跳转成功之后的回调方法；提供了block方法，用于切换路由时弹出阻止弹窗，确认则继续跳转，取消则不进行跳转；提供location对象，location对象用于描述当前url的所有信息


### 初始化渲染流程

```
function createBrowserHistory() {
    function getDOMLocation(historyState) {
        const { key, state } = historyState || {};
        const { pathname, search, hash } = window.location;

        let path = pathname + search + hash;

        if (basename) path = stripBasename(path, basename);

        return createLocation(path, state, key);
    }

    // 获取当前url所在的location对象
    const initialLocation = getDOMLocation(getHistoryState());

    return {
        location: initialLocation,
    }
}

class Router extends React.Component {
    static computeRootMatch(pathname) {
        return { path: "/", url: "/", params: {}, isExact: pathname === "/" };
    }

    constructor(props) {
        super(props);

        this.state = {
            location: props.history.location
        };

        this._isMounted = false;
        this._pendingLocation = null;

        if (!props.staticContext) {
            this.unlisten = props.history.listen(location => {
            // 有redirect组件，且直接触发跳转的话，会先触发这里的回调，但是Router组件可能还没有到mounted阶段，所有不能直接调用this.state来更新location参数
            if (this._isMounted) {
                this.setState({ location });
            } else {
                this._pendingLocation = location;
            }
            });
        }

    }

    componentDidMount() {
        this._isMounted = true;

        if (this._pendingLocation) {
            this.setState({ location: this._pendingLocation });
        }
    }

    componentWillUnmount() {
        if (this.unlisten) {
            this.unlisten();
            this._isMounted = false;
            this._pendingLocation = null;
        }
    }

    render() {
        return (
            <RouterContext.Provider
            value={{
                history: this.props.history,
                location: this.state.location,
                match: Router.computeRootMatch(this.state.location.pathname),
                staticContext: this.props.staticContext
            }}
            >
            <HistoryContext.Provider
                children={this.props.children || null}
                value={this.props.history}
            />
            </RouterContext.Provider>
        );
    }
}

class Route extends React.Component {
    render() {
        return (
            <RouterContext.Consumer>
            {context => {

                const location = this.props.location || context.location;
                const match = this.props.computedMatch
                ? this.props.computedMatch 、
                : this.props.path
                ? matchPath(location.pathname, this.props)
                : context.match;

                const props = { ...context, location, match };

                let { children, component, render } = this.props;


                return (
                    <RouterContext.Provider value={props}>
                        {props.match
                        ? children
                            ? typeof children === "function"
                            ? __DEV__
                                ? evalChildrenDev(children, props, this.props.path)
                                : children(props)
                            : children
                            : component
                            ? React.createElement(component, props)
                            : render
                            ? render(props)
                            : null
                        : typeof children === "function"
                        ? __DEV__
                            ? evalChildrenDev(children, props, this.props.path)
                            : children(props)
                        : null}
                    </RouterContext.Provider>
                );
            }}
            </RouterContext.Consumer>
        );
    }
}
```

Router组件开始渲染，state内有一个location属性，初始值为当前url所在的location对象，然后Route组件开始渲染，Route组件会优先取switch组件注入的computedMatch属性，如果没有则通过matchPath方法获取，最终根据Route组件传入的children || component || render参数来进行渲染对应的组件；也就是说哪个组件会被渲染，完全取决于Route组件传入的path参数是否与传入的location对象内的pathname是否匹配；最后Router组件内通过history.listen注册一个路由跳转成功回调，在回调函数内通过this.setState重新设置location，从而触发Router组件更新，从而引起子组件Route重新渲染; 


### history.push or history.replace内部执行流程

```
function createBrowserHistory() {
    const transitionManager = createTransitionManager()

    function setState(nextState) {
        Object.assign(history, nextState);
        history.length = globalHistory.length;
        transitionManager.notifyListeners(history.location, history.action);
    }

    function push(path, state) {

        const action = 'PUSH';
        const location = createLocation(path, state, createKey(), history.location);

        transitionManager.confirmTransitionTo(
            location,
            action,
            getUserConfirmation,
            ok => {
                if (!ok) return;

                const href = createHref(location);
                const { key, state } = location;

                if (canUseHistory) {
                    globalHistory.pushState({ key, state }, null, href);
                    setState({ action, location });
                } else {
                    window.location.href = href;
                }
            }
        );
    }

    function replace(path, state) {

        const action = 'REPLACE';
        const location = createLocation(path, state, createKey(), history.location);

        transitionManager.confirmTransitionTo(
            location,
            action,
            getUserConfirmation,
            ok => {
                if (!ok) return;

                const href = createHref(location);
                const { key, state } = location;

                if (canUseHistory) {
                    globalHistory.replaceState({ key, state }, null, href);
                    setState({ action, location });
                } else {
                    window.location.replace(href);
                }
            }
        );
    }

    const history = {
        push,
        replace
    }

    return history

}

function createTransitionManager() {
    function confirmTransitionTo(
        location,
        action,
        getUserConfirmation,
        callback
        ) {
        callback(true);
    }

    function notifyListeners(...args) {
        listeners.forEach(listener => listener(...args));
    }

    return {
        confirmTransitionTo,
        notifyListeners
    }
}
```

push、replace方法内部调用createTransitionManager内的confirmTransitionTo方法，confirmTransitionTo方法内会做拦截相关的处理，后面说，执行拦截操作之后，调用callback，如果为true，则通过history.pushState || history.replaceState进行url的真正跳转；跳转之后执行setState方法，并传入`{ action, location }`参数；setState内直接调用transitionManager.notifyListeners方法，transitionManager.notifyListeners方法内会执行所有通过listen注册的回调函数，并传入更新后的location参数；最终触发Router组件内注册的监听函数，触发视图更新

### 浏览器前进后退怎么触发视图更新

```
function handlePop(location) {
    const action = 'POP';

    transitionManager.confirmTransitionTo(
        location,
        action,
        getUserConfirmation,
        ok => {
            if (ok) {
                setState({ action, location });
            } else {
                revertPop(location);
            }
        }
    );
}

function revertPop(fromLocation) {
    const toLocation = history.location;

    let toIndex = allKeys.indexOf(toLocation.key);

    if (toIndex === -1) toIndex = 0;

    let fromIndex = allKeys.indexOf(fromLocation.key);

    if (fromIndex === -1) fromIndex = 0;

    const delta = toIndex - fromIndex;

    if (delta) {
        go(delta);
    }
}

// history

function handlePopState(event) {
    handlePop(getDOMLocation(event.state));
}

function createBrowserHistory() {
    function checkDOMListeners(delta) {
        listenerCount += delta;

        if (listenerCount === 1 && delta === 1) {
                window.addEventListener(PopStateEvent, handlePopState);
            } else if (listenerCount === 0) {
                window.removeEventListener(PopStateEvent, handlePopState);
        }
    }
}


// hash

function handleHashChange() {
    const path = getHashPath();
    const encodedPath = encodePath(path);

    if (path !== encodedPath) {
        // Ensure we always have a properly-encoded hash.
        replaceHashPath(encodedPath);
    } else {
        const location = getDOMLocation();
        const prevLocation = history.location;

        if (!forceNextPop && locationsAreEqual(prevLocation, location)) return; // A hashchange doesn't always == location change.

        if (ignorePath === createPath(location)) return; // Ignore this change; we already setState in push/replace.

        ignorePath = null;

        handlePop(location);
    }
}

function createHashHistory() {
    function checkDOMListeners(delta) {
        listenerCount += delta;

        if (listenerCount === 1 && delta === 1) {
            window.addEventListener(HashChangeEvent, handleHashChange);
        } else if (listenerCount === 0) {
            window.removeEventListener(HashChangeEvent, handleHashChange);
        }
    }
}
```

不论是createBrowserHistory还是createHashHistory，都是通过history对象暴露listen or block方法内去注册对应的url变更事件回调，并在回调内通过transitionManager.confirmTransitionTo方法来达到跳转url并更新location的目的；这里需要注意的hash模式下，通过push、replace方法进行跳转之后，会触发hashChange事件，所有在push及replace的时候会给变量ignorePath赋值为当前的location对象，然后在handleHashChange事件回调内会做一次if (ignorePath === createPath(location)) return的判断，避免重复跳转

### react-router跳转拦截

```
function confirmTransitionTo(
    location,
    action,
    getUserConfirmation,
    callback
  ) {
    if (prompt != null) {
        const result =
        typeof prompt === 'function' ? prompt(location, action) : prompt;

        if (typeof result === 'string') {
        if (typeof getUserConfirmation === 'function') {
            getUserConfirmation(result, callback);
        } else {
            warning(
            false,
            'A history needs a getUserConfirmation function in order to use a prompt message'
            );

            callback(true);
        }
        } else {
        // Return false from a transition hook to cancel the transition.
        callback(result !== false);
        }
    } else {
        callback(true);
    }
}
```

history对象暴露出了block方法，我们可以通过block方法注册路由跳转拦截信息，及通过getUserConfirmation方法提供拦截弹窗，当我通过了block注册了拦截信息之后，每次调用confirmTransitionTo方法，confirmTransitionTo内先判断有没有设置block，如果有，在判断有没有设置getUserConfirmation方法，如果有则调用getUserConfirmation方法，并把callback传入getUserConfirmation方法，在getUserConfirmation方法内调用callback，并传入true or false；如果没有设置block则直接调用callback并传入true；我们可以设置block来做跳转之前的确认操作场景

### route组件及switch如何渲染

```
function matchPath(pathname, options = {}) {
    if (typeof options === "string" || Array.isArray(options)) {
        options = { path: options };
    }

    const { path, exact = false, strict = false, sensitive = false } = options;

    const paths = [].concat(path);

    return paths.reduce((matched, path) => {
        if (!path && path !== "") return null;
        if (matched) return matched;

        // 利用Route组件传入的path构建一个path的正则表达式
        // keys 是用来匹配:id params形式的参数
        const { regexp, keys } = compilePath(path, {
            end: exact,
            strict,
            sensitive
        });

        // 然后利用regexp去匹配location传入的pathname，如果匹配上了，说明当前Route需要展示，没有匹配上则返回null
        const match = regexp.exec(pathname);

        if (!match) return null;

        const [url, ...values] = match;
        const isExact = pathname === url;

        if (exact && !isExact) return null;

        return {
            path, // the path used to match
            url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
            isExact, // whether or not we matched exactly
            params: keys.reduce((memo, key, index) => {
            memo[key.name] = values[index];
            return memo;
            }, {})
        };
    }, null);
}

class Route extends React.Component {
    render() {
        return (
            <RouterContext.Consumer>
            {context => {

                const location = this.props.location || context.location;
                // 先判断父组件是非有传入computedMatch属性，如果有则直接使用，没有则判断是非有传入path，有则利用matchPath返回匹配对象
                // 
                const match = this.props.computedMatch
                ? this.props.computedMatch // <Switch> already computed the match for us
                : this.props.path
                ? matchPath(location.pathname, this.props)
                : context.match;

                const props = { ...context, location, match };

                let { children, component, render } = this.props;

                return (
                    <RouterContext.Provider value={props}>
                        {props.match
                        ? children
                            ? typeof children === "function"
                            ? __DEV__
                                ? evalChildrenDev(children, props, this.props.path)
                                : children(props)
                            : children
                            : component
                            ? React.createElement(component, props)
                            : render
                            ? render(props)
                            : null
                        : typeof children === "function"
                        ? __DEV__
                            ? evalChildrenDev(children, props, this.props.path)
                            : children(props)
                        : null}
                    </RouterContext.Provider>
                );
            }}
            </RouterContext.Consumer>
        );
    }
}

class Switch extends React.Component {
    render() {
        return (
            <RouterContext.Consumer>
            {context => {
                const location = this.props.location || context.location;

                let element, match;

                React.Children.forEach(this.props.children, child => {
                    if (match == null && React.isValidElement(child)) {
                        element = child;

                        const path = child.props.path || child.props.from;

                        match = path
                        ? matchPath(location.pathname, { ...child.props, path })
                        : context.match;
                    }
                });

                return match
                ? React.cloneElement(element, { location, computedMatch: match })
                : null;
            }}
            </RouterContext.Consumer>
        );
    }
}
```

先说matched，matched是通过当前Route传入的path参数，然后利用path及其它几个相关参数，生成一个路径正则，然后利用这个路径正则去匹配location对象内的pathname属性，如果返回有匹配项，说明当前Route是与当前url pathname相匹配的路由组件，然后进行展示；如果没有返回匹配项，则直接返回null，表示当前Route组件没有被匹配到；

没有switch组件的时候，只要与当前location.pathname匹配的Route组件都会被渲染出来；而有switch组件的时候，则会在switch组件内先遍历一次switch组件的一级子元素（注意这里的一级子元素及Route组件），从上到下然后找出第一个匹配项，然后传入computedMatch属性；

从这里看出react-router 4.x之后为什么称之为动态路由就是因为，每次location更新的时候，都会执行所有的Route组件，然后通过Route组件的path与location.pathname进行匹配，来最终决定渲染哪个Route组件，相当于pathname渲染什么，完全可以通过动态控制传入Route的path来进行控制；此时Router及Route组件完全就是React组件，包括生命周期与内部状态

### redirect组件如何渲染

```
function Redirect({ computedMatch, to, push = false }) {
    return (
        <RouterContext.Consumer>
            {context => {

            const { history, staticContext } = context;

            const method = push ? history.push : history.replace;
            const location = createLocation(
                computedMatch
                ? typeof to === "string"
                    ? generatePath(to, computedMatch.params)
                    : {
                        ...to,
                        pathname: generatePath(to.pathname, computedMatch.params)
                    }
                : to
            );

            return (
                <Lifecycle
                    onMount={() => {
                        method(location);
                    }}
                    onUpdate={(self, prevProps) => {
                        const prevLocation = createLocation(prevProps.to);
                        if (
                        !locationsAreEqual(prevLocation, {
                            ...location,
                            key: prevLocation.key
                        })
                        ) {
                        method(location);
                        }
                    }}
                    to={to}
                />
            );
            }}
        </RouterContext.Consumer>
    );
}

class Lifecycle extends React.Component {
    componentDidMount() {
        if (this.props.onMount) this.props.onMount.call(this, this);
    }

    componentDidUpdate(prevProps) {
        if (this.props.onUpdate) this.props.onUpdate.call(this, this, prevProps);
    }

    componentWillUnmount() {
        if (this.props.onUnmount) this.props.onUnmount.call(this, this);
    }

    render() {
        return null;
    }
}
```

redirect组件完全就是根据computedMatch or to属性转换成对应的location对象，然后通过history.replace or history.push 在componentDidMount钩子内进行对应路由跳转；

### withRouter组件如何渲染

```
function withRouter(Component) {
    const displayName = `withRouter(${Component.displayName || Component.name})`;
    const C = props => {
        const { wrappedComponentRef, ...remainingProps } = props;

        return (
            <RouterContext.Consumer>
            {context => {
                return (
                <Component
                    {...remainingProps}
                    {...context}
                    ref={wrappedComponentRef}
                />
                );
            }}
            </RouterContext.Consumer>
        );
    };

    C.displayName = displayName;
    C.WrappedComponent = Component;

    return hoistStatics(C, Component);
}
```

withRouter就是一个高阶组件，为我们不在route下的组件提供history,location等属性

### 在看全局

在看这张图，是不是清楚了react-router内部的运行机制了；简而言之react-router；分为两个部分，第一部分history部分，第二个部分与react结合部分

history部分提供统一的跳转方法及返回路由对象，允许设置导航成功回调函数、执行路由跳转拦截

react结合部分则是，在Router组件内，通过设置导航监听函数，然后在监听函数内通过调用this.setState(location),从而达到更新视图的目的；同时在Router组件内通过context，来为子组件提供history、location等属性

![image](https://user-images.githubusercontent.com/20950813/95036238-e09de680-06f9-11eb-8bcb-117aafeb7be5.png)

### react-router与vue-router对比

其实二者的思路差不多是一致的，分为两个部分，一个部分是history导航部分，一部分是与对应框架结合部分，只不过react抽离了单独的history库，而vue-router则没有；同时vue-router有更丰富的路由钩子，而react-router没有；

