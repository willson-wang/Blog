---
  title: vue响应式原理
  date: 2018-01-27T06:33:02Z
  lastmod: 2018-02-28T03:10:15Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

vue的响应式指的是data、props内的数据改变时，对应个的视图也会动态改变，那么vue是怎么做到的呢？

开始分析之前看下Vue.js官网介绍响应式原理的这张图
![vue](https://user-images.githubusercontent.com/20950813/35470269-169401a4-0381-11e8-8259-dc81eb65691d.png)


让我们从源码的角度来捋一遍，以data为例，大致流程如下所示:
-> 调用**initData**() 
-> 调用**proxy**(vm, `_data`, keys[i]), **observe**(data, true)
-> 判断是否已经Observer实例有则拿来用，没有则初始化一个实例 new **Observer**(value) 
-> 判断data每个key对应的value，如果是纯对象则this.walk(value) 如果是数组 **this.observeArray**(value) 
-> 对象直接调用**defineReactive**(obj, keys[i], obj[keys[i]])  数组则进行遍历每个成员调用**observe**(items[i]) 
-> 在**mountComponent**内调用new Watcher来收集依赖，区分数据
-> **Object.defineProperty**的**getter**内调用**dep.depend**()进行依赖收集 , **setter**内通过**dep.notify**()来发布消息，最终达到响应式的效果；

```
// 初始化data操作
function initData (vm: Component) {
  let data = vm.$options.data
  // 如果data是函数则调用getData进行获取
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  // 获取包含key的数组
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
     // 判断data内的key是否与methods内的方法名是否有重名
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    // 判断data内的key是否与props内的属性名是否有重名
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
     // 对data进行一次代理，便于我们能够直接通过this.a 来访问this._data.a
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 对data内的数据进行observe
  observe(data, true /* asRootData */)
}
```

```
// 当传入的data是一个函数时，返回一个data对象
export function getData (data: Function, vm: Component): any {
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  }
}
```

```
// 对data进行代理操作
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

```
// 尝试创建Observe实例，如果没有则创建，如果有则返回现有的Observe实例
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 判断是否已经有了Observe实例
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    observerState.shouldConvert &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 直接new 一个Observe实例
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```

```
// Observer 构造函数
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that has this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    // 将 Observer 实例添加到传入value数组的__ob__属性上，如传入的value是data，那么就在data对象上添加__ob__属性
    def(value, '__ob__', this)
    // 如果是数组，调用observeArray方法
    if (Array.isArray(value)) {
      // 判断是否支持__propto__属性，如果支持调用protoAugment方法否则调用copyAugment方法
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      this.observeArray(value)
    } else {
      // 是对象则调用walk方法
      this.walk(value)
    }
  }
  
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // 对每个属性调用defineReactive方法进行getter与setter设置
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      // 对数组中的每项成员继续调用observe方法，直至结束
      observe(items[i])
    }
  }
 }
```

```
// 如果有__proto__属性则，直接将传入数组实例的原型上的7个方法改成自定义的7个数组方法
function protoAugment (target, src: Object, keys: any) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}
```

```
// 如果不支持__proto__属性则覆盖数组实例的原型上的7个方法
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}
```

```
// 定义对象属性的getter与setter
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // new 一个Dep实例，用来收集依赖，一个容器，用于存放订阅者(watcher)即发布消息
  const dep = new Dep()
  
 // 获取传入对象对应key的属性描述，如果该property.configurable === false则retrurn调
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 获取之前定义的getter与setter
  const getter = property && property.get
  const setter = property && property.set
  // 对属性值进行observe，如果是对象or数组则重复改步骤，如果是简单类型则不用，如data: {msg: {a: 1, b: 2}}，则方便对msg: {a: 1, b: 2}继续进行observe
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      // 区分普通调用还是watcher内的get调用
      if (Dep.target) {
        // 订阅消息
        dep.depend()
        // 如果有子项，同理继续订阅消息
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      // set之前先获取一次值 
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 比较新值与旧值
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // 如果有setter函数则执行，否则直接把新值赋给val
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 对新值重新observe
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}
```

```
// 用于存放订阅者与发布消息
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }
  // 新增订阅列表，订阅Watcher
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
  // 发布消息
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      // 调用每个watcher的update方法
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null
const targetStack = []

// 设置Dep的target属性，区分watcher内调用的getter与普通调用的getter
export function pushTarget (_target: Watcher) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

export function popTarget () {
  Dep.target = targetStack.pop()
}
```

```
// 观察者
export default class Watcher {
	  vm: Component;
	  expression: string;
	  cb: Function;
	  id: number;
	  deep: boolean;
	  user: boolean;
	  lazy: boolean;
	  sync: boolean;
	  dirty: boolean;
	  active: boolean;
	  deps: Array<Dep>;
	  newDeps: Array<Dep>;
	  depIds: SimpleSet;
	  newDepIds: SimpleSet;
	  getter: Function;
	  value: any;
	
	  constructor (
	    vm: Component,
	    expOrFn: string | Function,
	    cb: Function,
	    options?: ?Object,
	    isRenderWatcher?: boolean
	  ) {
	    this.vm = vm
	    if (isRenderWatcher) {
	      vm._watcher = this
	    }
	    vm._watchers.push(this)
	    // options
	    if (options) {
	      this.deep = !!options.deep
	      this.user = !!options.user
	      this.lazy = !!options.lazy
	      this.sync = !!options.sync
	    } else {
	      this.deep = this.user = this.lazy = this.sync = false
	    }
	    this.cb = cb
	    this.id = ++uid // uid for batching
	    this.active = true
	    this.dirty = this.lazy // for lazy watchers
	    this.deps = []
	    this.newDeps = []
	    this.depIds = new Set()
	    this.newDepIds = new Set()
	    this.expression = process.env.NODE_ENV !== 'production'
	      ? expOrFn.toString()
	      : ''
	    // parse expression for getter
	    if (typeof expOrFn === 'function') {
	      this.getter = expOrFn
	    } else {
	      this.getter = parsePath(expOrFn)
	      if (!this.getter) {
	        this.getter = function () {}
	        process.env.NODE_ENV !== 'production' && warn(
	          `Failed watching path: "${expOrFn}" ` +
	          'Watcher only accepts simple dot-delimited paths. ' +
	          'For full control, use a function instead.',
	          vm
	        )
	      }
	    }
            // 调用get方法来收集依赖
	    this.value = this.lazy
	      ? undefined
	      : this.get()
	  }
	
	  /**
	   * Evaluate the getter, and re-collect dependencies.
	   */
	  get () {
            // 区分是watcher内调用的getter方法还是普通的getter方法调用
	    pushTarget(this)
	    let value
	    const vm = this.vm
	    try {
              // 调用对象属性的getter方法  这里不怎么懂的是，为什么所有的用于视图渲染的数据都能够被调用一次
	      value = this.getter.call(vm, vm)
	    } catch (e) {
	      if (this.user) {
	        handleError(e, vm, `getter for watcher "${this.expression}"`)
	      } else {
	        throw e
	      }
	    } finally {
	      // "touch" every property so they are all tracked as
	      // dependencies for deep watching
	      if (this.deep) {
	        traverse(value)
	      }
	      popTarget()
	      this.cleanupDeps()
	    }
	    return value
	  }
	
	  /**
	   * Add a dependency to this directive.
	   */
	  addDep (dep: Dep) {
	    const id = dep.id
	    if (!this.newDepIds.has(id)) {
	      this.newDepIds.add(id)
	      this.newDeps.push(dep)
	      if (!this.depIds.has(id)) {
	        dep.addSub(this)
	      }
	    }
	  }
	
	  /**
	   * Clean up for dependency collection.
	   */
	  cleanupDeps () {
	    let i = this.deps.length
	    while (i--) {
	      const dep = this.deps[i]
	      if (!this.newDepIds.has(dep.id)) {
	        dep.removeSub(this)
	      }
	    }
	    let tmp = this.depIds
	    this.depIds = this.newDepIds
	    this.newDepIds = tmp
	    this.newDepIds.clear()
	    tmp = this.deps
	    this.deps = this.newDeps
	    this.newDeps = tmp
	    this.newDeps.length = 0
	  }
	
	  /**
	   * Subscriber interface.
	   * Will be called when a dependency changes.
	   */
          // 依赖发生变化时触发
	  update () {
	    /* istanbul ignore else */
	    if (this.lazy) {
	      this.dirty = true
	    } else if (this.sync) {
              // 同步执行
	      this.run()
	    } else {
	      queueWatcher(this)
	    }
	  }
	
	  /**
	   * Scheduler job interface.
	   * Will be called by the scheduler.
	   */
	  run () {
	    if (this.active) {
              // 调用watcher的get方法用于收集新的依赖于重新渲染视图
	      const value = this.get()
	      if (
	        value !== this.value ||
	        // Deep watchers and watchers on Object/Arrays should fire even
	        // when the value is the same, because the value may
	        // have mutated.
	        isObject(value) ||
	        this.deep
	      ) {
	        // set new value
	        const oldValue = this.value
	        this.value = value
	        if (this.user) {
	          try {
                    // 更新视图
	            this.cb.call(this.vm, value, oldValue)
	          } catch (e) {
	            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
	          }
	        } else {
	          this.cb.call(this.vm, value, oldValue)
	        }
	      }
	    }
	  }
```

```
// 重写数组实例上的7中方法，便于数据响应
const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 如果有新的元素插入则调用observeArray
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 发布消息
    ob.dep.notify()
    return result
  })
})
```

```
// 挂载组件
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  callHook(vm, 'beforeMount')

  let updateComponent
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  // 组件data/props等数据初始化之后调用Watcher收集依赖
  new Watcher(vm, updateComponent, noop, null, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

总结: 大致思路是捋清楚了，但是中间的一些实现细节，还是有待去研究，不过总的来说，不得不感叹这种实现的方式，太精妙了。
