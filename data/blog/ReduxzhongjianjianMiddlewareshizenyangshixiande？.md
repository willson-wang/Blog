---
  title: Redux中间件原理
  date: 2021-06-08T11:07:10Z
  lastmod: 2023-03-26T08:45:01Z
  summary: 
  tags: ["前端框架", "redux", "中间件", "原理"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/react_redux.png']
  bibliography: references-data.bib
---

redux 的 middleware 是为了增强 dispatch 而出现的

没有middleware
![image](https://user-images.githubusercontent.com/20950813/121174305-5dd2ba00-c88c-11eb-8102-25e1b83a399a.png)

有middleware
![image](https://user-images.githubusercontent.com/20950813/121174418-75aa3e00-c88c-11eb-80a3-72ebc2320cdf.png)

那么redux中间件是怎样实现的？

我首先想到的是redux-thunk，因为这个最简单，也最好理解，它是怎么做到支持传入disptach方法的参数可以是函数，然后看了下源码实现，只有短短几行代码，如下所示

```js
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

实现逻辑就是对传入的action做判断，如果传入的action是函数，则调用action，把dispatch、getState在传入到action函数内，方便action函数内处理完副作用之后，可以执行dispatch，也可以通过getState获取到最新的store内容

```js
action.js 
// 获取用户信息
export function getUserInfo(params) {
    return async function(dispatch, getState) {
        const { app } = getState()
        const { userInfo } = app
        if (Object.keys(userInfo).length && !params._force) {
            return userInfo
        }
        const user = await authorize.getUserInfoPromise()
        dispatch({
            type: types.UPDATEUSERINFO,
            payload: user
        })
        return {
            userInfo: user
        }
    }
}


index.js
const mapDispathToProps = (dispath: Dispatch): Actions.AppActionsMethodTypes => {
    return {
        getUserInfo: (parmas) => {
        	// dispatch传入的action是一个函数
            return dispath(Actions.getUserInfo(parmas))
        }
    }
}
this.props.getUserInfo({})


redux-thunk.js
if (typeof action === 'function') {
    return action(dispatch, getState, extraArgument);
}
```

显然redux-thunk是通过一种劫持的手段，来支持了传入的action是function的场景

那么我们在来看下为什么要 return next(action); 这个next是什么？redux中间件说的洋葱模型又是什么？

先看下redux中间件的书写及调用方式，以redux-thunk为例

```js
redux-tunk.js
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;


store.js
const middlewares = [thunk]
const middlewareEnhancer = applyMiddleware(...middlewares)

const store = createStore(createReducer(), preloadState, middlewareEnhancer)
return store
```

调用applyMiddleware方法传入middlewares参数


看下applyMiddleware的源码实现

```js
export default function applyMiddleware(
  ...middlewares
){
  return (createStore) =>
    (
      reducer,
      preloadedState
    ) => {
      const store = createStore(reducer, preloadedState)
      let dispatch: Dispatch = () => {
        throw new Error(
          'Dispatching while constructing your middleware is not allowed. ' +
            'Other middleware would not be applied to this dispatch.'
        )
      }

      const middlewareAPI: MiddlewareAPI = {
        getState: store.getState,
        dispatch: (action, ...args) => dispatch(action, ...args)
      }
      const chain = middlewares.map(middleware => middleware(middlewareAPI))
      dispatch = compose(...chain)(store.dispatch)

      return {
        ...store,
        dispatch
      }
    }
}
```

applyMiddleware接受一个middlewares数组，然后返回一个函数，这个函数接受一个createStore参数，其实这就是一个闭包

然后我们在看下

```js
createStore(createReducer(), preloadState, middlewareEnhancer)

redux.js
function createStore(reducer, preloadedState, enhancer) {

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error(
        `Expected the enhancer to be a function. Instead, received: '${kindOf(
          enhancer
        )}'`
      )
    }

    return enhancer(createStore)(reducer,preloadedState)
  }
}

这里判断是否传入了enhancer函数，也就是传入了applyMiddleware函数的返回值
```

回过头来看这里

我们在项目代码内调用
```js
const store = createStore(createReducer(), preloadState, middlewareEnhancer)
return store

<Provider store={store}>
    <Root />
</Provider>

这个store则是applyMiddleware内最终反回的
return {
   ...store,
   dispatch
}
```

然后我们细看下applyMiddleware方法内的实现
```js
const store = createStore(reducer, preloadedState)
let dispatch = () => {
	throw new Error(
	  'Dispatching while constructing your middleware is not allowed. ' +
	    'Other middleware would not be applied to this dispatch.'
	)
}

const middlewareAPI: MiddlewareAPI = {
	getState: store.getState,
	dispatch: (action, ...args) => dispatch(action, ...args)
}
// 关键步骤一，往每个中间件函数传入getState，及dispatch这两个方法
const chain = middlewares.map(middleware => middleware(middlewareAPI))

// 关键步骤二，通过compose组合调用中间件函数，然后传入原始的store.dispatch方法
dispatch = compose(...chain)(store.dispatch)

return {
	...store,
	dispatch
}
```

加入我们传入三个中间件fn1, fn2,fn3先看下chain得到的是什么
```js
middlewares数组应该是这样的 [ // 三层函数的中间件
	({getState, dispatch}) => next1 => action => next1(action), 
	({getState, dispatch}) => next2 => action => next2(action),
	({getState, dispatch}) => next3 => action => next3(action)
]

const chain = middlewares.map(middleware => middleware(middlewareAPI))

// 传入middlewareAPI之后，得到的chain应用事这样的数组 [ // 2层函数的中间件了，此时已经可以去访问调用dispatch与getState变量了
	next1 => action => next1(action),
	next2 => action => next2(action),
	next3 => action => next3(action)
]
```

我们看下compose的实现
```js
const compose = (...fns) => {
	if (!fns.length) {
		return (arg) => arg
	}

	if (fns.length === 1) {
		return fns[0]
	}

	return fns.reduce((a, b) => {
		return (...args) => {
			return a(b(...args))
		}
	})
}
```
`compose(fn1, fn2, fn3) =>` 最终返回的事一个函数 `(...args) => {return a(b(...args))}`

我们用个例子来试下
```js
function fn1(...args) {
	console.log('fn1', ...args)
	return 1
}

function fn2(...args) {
	console.log('fn2', ...args)
	return 2
}

function fn3(...args) {
	console.log('fn3', ...args)
	return 3
}

我们传入一个函数,
const result1 = compose(fn1)     
result1(999)

打印结果：fn1 999

传入两个函数，会遍历一次
const result2 = compose(fn1, fn2)                  
result2(999)											
													
打印结果：fn2 999; fn1 2; 1

我们传入三个函数,会遍历两次
const result3 = compose(fn1, fn2, fn3) 
result3(999)

打印结果：fn3 999; fn2 3; fn1 2; 1

所以compose(fn1, fn2, fn3) === (...args) => fn1(fn2(fn3(...args)))

compose的作用：从右至左依次执行函数，将上一个函数的执行结果传入到下一个函数


// 在来看这行代码

dispatch = compose(...chain)(store.dispatch)

拆开来看

第一步
const composeMiddleware = compose(...chain)

composeMiddleware的值事这样的 (...args) => fn1(fn2(fn3(...args)))

第二步

dispatch = composeMiddleware(store.dispatch)

dispatch的值如下所示fn1(fn2(fn3(store.dispatch)))，也就是第一个中间件函数最终返回的值，通过前面的步骤我们可以知道chain数组如下所示
[
	next1 => action => next1(action),
	next2 => action => next2(action),
	next3 => action => next3(action)
]

那么fn1(fn2(fn3(store.dispatch)))调用过程如下所示

fn3(store.dispatch)调用 传入参数 next3(store.dispatch)  返回值为action => store.dispatch(action)
fn2(fn3调用返回参数)调用  传入参数 next2(action => store.dispatch(action)) 返回值为action => (action => store.dispatch(action))(action)
fn1(fn2调用返回参数)调用  传入参数 next1(action => (action => store.dispatch(action))(action))  返回值为 (action => (action => store.dispatch(action))(action))(action)


调用完之后的返回值是fn1 next => action => next(action) 调用的返回值 action => next(action), 这个next就是fn2调用返回的值

dispatch = action => next1(action) (也就是fn1的返回值)
```

实际上将每个fn函数都执行一边，第一个执行的函数，也就是最右边的函数，会接受到一个store.dispatch函数，后面的函数接受到的都是上一个函数执行的返回结果

我们看下洋葱模型，定义三个中间件logger1、logger2、logger3
```js
function logger1(...args) { // 这一层函数的目的，可以帮助中间件定义的时候传入一些自定义参数
    return function({dispatch, getState}) { // 这一层函数的目的是，接受getState,dispatch函数，可以拿到store内容，并做一些操作
        return function (next) { // 接受store.dispatch参数或者下一个中间件的返回函数
            return function (action) {
                console.log('logger1 enter', action)
                const result = next(action)
                console.log('logger1 outer', result)
                return result
            }
        }
    }
}

const log1 = logger1()

function logger2(...args) {
    return function({dispatch, getState}) {
        return function (next) {
            return function (action) {
                console.log('logger2 enter', action)
                const result = next(action)
                console.log('logger2 outer', result)
                return result
            }
        }
    }
}

const log2 = logger2()

function logger3(...args) {
    return function({dispatch, getState}) {
        return function (next) {
            return function (action) {
                console.log('logger3 enter', action)
                const result = next(action)
                console.log('logger3 outer', result)
                return result
            }
        }
    }
}

const log3 = logger3()

const obj = {
    getState: () => {},
    dispatch: () => {}
}

const chain = [log1(obj), log2(obj), log3(obj)]

var dispatch = (...args) => {
    console.log('原始 dispatch')
    return args
}

const newDispatch = compose1(...chain)(dispatch)

console.log('last', newDispatch)

newDispatch({
     type: 'INIT',
     payload: {
         a: 123
     }
})


// 执行结果为
// logger1 enter {type: "INIT", payload: {…}}
// logger2 enter {type: "INIT", payload: {…}}
// logger3 enter {type: "INIT", payload: {…}}

// 原始 dispatch

// logger3 outer {type: "INIT", payload: {…}}
// logger2 outer {type: "INIT", payload: {…}}
// logger1 outer {type: "INIT", payload: {…}}

```
这个就是洋葱模型,如下图所示

![image](https://user-images.githubusercontent.com/20950813/121174526-96729380-c88c-11eb-8e15-dd362d64d9cd.png)

到这里我们已经知道，redux的中间件是怎么去设计的了，同时也知道中间件为什么需要定义4层函数，同时我们在看之前的一个细节
```js
// 这里定义了一次dispatch函数
let dispatch: Dispatch = () => {
	throw new Error(
	  'Dispatching while constructing your middleware is not allowed. ' +
	    'Other middleware would not be applied to this dispatch.'
	)
}

const middlewareAPI: MiddlewareAPI = {
	getState: store.getState,
	dispatch: (action, ...args) => dispatch(action, ...args) // 这里传入的dispatch方法，内部调用的就是上面定义的dispatch方法，这里只所以没有直接传入store.dispatch，就是为了避免中间件在初始化的时候，或者执行的时候去修改了原始的dispatch方法
}
const chain = middlewares.map(middleware => middleware(middlewareAPI))
dispatch = compose(...chain)(store.dispatch)
```

总体来说，中间件的实现的关键思路是使用compose组合的方式，将一系列函数组合成如下函数(...args) => fn1(fn2(fn3(...args)))，即将最后一个函数调用的返回值当成参数传入到前一个函数，当第一个函数被调用的时候，依次调用传入的参数，直到把传入的参数传入最后一个函数；


[middleware](https://redux.js.org/tutorials/fundamentals/part-4-store#middleware)

