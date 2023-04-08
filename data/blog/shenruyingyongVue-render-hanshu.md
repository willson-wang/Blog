---
  title: 深入应用Vue render 函数
  date: 2020-05-22T15:39:58Z
  lastmod: 2023-03-26T09:29:44Z
  summary: 
  tags: ["前端框架", "vue", "vue render"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/vuejs.png']
  bibliography: references-data.bib
---

我们在vue项目的日常开发中基本都是template模版形式，几乎不会用到render函数去生成模版，最近因为有需求，需要更加灵活的生成模版，所以深入了解了一下render函数

如果对render函数还没有一点了解建议先看下文档[渲染函数 & JSX](https://cn.vuejs.org/v2/guide/render-function.html)

内容分为4个部分

1、如何使用render函数生成与template写法一致的模版
2、理解render函数中的slot
3、理解render函数中的scopeSlot
4、对比2.6之后slot的新旧语法

## 如何使用render函数生成与template写法一致的模版

Vue 通过建立一个虚拟 DOM 来追踪自己要如何改变真实 DOM，而虚拟DOM则通过createElement方法创建，一个简单的虚拟DOM如下所示

```
createElement('h1', this.blogTitle)
```

而render函数正是Vue用来生成虚拟DOM的，我们平常的template写法，也会被vue-loader转换成createElement的形式

```
createElement(
  // {String | Object | Function}
  // 一个 HTML 标签名、组件选项对象，或者
  // resolve 了上述任何一种的一个 async 函数。必填项。
  'div',

  // {Object}
  // 一个与模板中 attribute 对应的数据对象。可选。
  {
    // 与 `v-bind:class` 的 API 相同，
    // 接受一个字符串、对象或字符串和对象组成的数组
    'class': {
      foo: true,
      bar: false
    },
    // 与 `v-bind:style` 的 API 相同，
    // 接受一个字符串、对象，或对象组成的数组
    style: {
      color: 'red',
      fontSize: '14px'
    },
    // 普通的 HTML attribute
    attrs: {
      id: 'foo'
    },
    // 组件 prop
    props: {
      myProp: 'bar'
    },
    // DOM property
    domProps: {
      innerHTML: 'baz'
    },
    // 事件监听器在 `on` 内，
    // 但不再支持如 `v-on:keyup.enter` 这样的修饰器。
    // 需要在处理函数中手动检查 keyCode。
    on: {
      click: this.clickHandler
    },
    // 仅用于组件，用于监听原生事件，而不是组件内部使用
    // `vm.$emit` 触发的事件。
    nativeOn: {
      click: this.nativeClickHandler
    },
    // 自定义指令。注意，你无法对 `binding` 中的 `oldValue`
    // 赋值，因为 Vue 已经自动为你进行了同步。
    directives: [
      {
        name: 'my-custom-directive',
        value: '2',
        expression: '1 + 1',
        arg: 'foo',
        modifiers: {
          bar: true
        }
      }
    ],
    // 作用域插槽的格式为
    // { name: props => VNode | Array<VNode> }
    scopedSlots: {
      default: props => createElement('span', props.text)
    },
    // 如果组件是其它组件的子组件，需为插槽指定名称
    slot: 'name-of-slot',
    // 其它特殊顶层 property
    key: 'myKey',
    ref: 'myRef',
    // 如果你在渲染函数中给多个元素都应用了相同的 ref 名，
    // 那么 `$refs.myRef` 会变成一个数组。
    refInFor: true
  },

  // {String | Array}
  // 子级虚拟节点 (VNodes)，由 `createElement()` 构建而成，
  // 也可以使用字符串来生成“文本虚拟节点”。可选。
  [
    '先写一些文字',
    createElement('h1', '一则头条'),
    createElement(MyComponent, {
      props: {
        someProp: 'foobar'
      }
    })
  ]
)
```

其实看完上面的第二个参数，是不怎么好理解的，尤其是针对props、domProps、attrs、on、nativeOn、slot、scopedSlots这几个参数

我们先看domProps、attrs、on、class、style这几个参数

我们从我们最熟悉的template写法，来先写一个模版，然后在通过render函数来写出渲染一致的模版，通过二者比较来快速熟悉各个参数的含义

<h4>template写出例子</h4>

```
<template>
    <!-- 通过模版模版功能写一个组件，之后在通过render方法来写template部分，最后做对比 -->
    <div class="wrap" :class="[isDesign && 'wrap-design']" style="color: #ccc" :style="{backGroundColor: bg}" @click="goTo" id="normal" data-type="normar-type" :type="innerType">
        <div>{{count}}</div>
        <div>{{msg}}</div>
        <div>
            <button @click.stop="incr">+</button>
            <button @click.stop="decr">-</button>
        </div>
        <div>
            <span v-if="count % 2">奇数</span>
            <span v-else>偶数</span>
        </div>
        <div>
            <img src="../assets/logo.png" alt="" />
        </div>
        <ul>
            <li v-for="(item, index) in count" :key="index">{{item}}</li>
        </ul>
        <div @click.stop="emitHandle">
            emit
        </div>
        <div title='aaa'>
            <a href="www.baidu.com">我是一个超链接</a>
            <input type="text" maxlength="10" value="1111">
        </div>
    </div>
</template>

<script>
/* eslint-disable */

export default {
    name: 'normalTemplate',
    components: {},
    props: {
        msg: String
    },
    data() {
        return {
            isDesign: true,
            count: 0,
            innerType: 'normal'
        }
    },
    computed: {
        bg() {
            return '#fff'
        },
        newCount() {
            return `新count${this.count}`
        }
    },
    methods: {
        goTo() {
            console.log('goto', this.$listeners)
            // this.$emit('click')
        },
        incr() {
            this.count += 1
            this.$emit('incr', this.count)
        },
        decr() {
            this.count -= 1
        },
        emitHandle() {
            this.$emit('my-emit')
        }
    }
}
</script>
```

生成的dom结构如下所示

```
<div
  id="normal"
  data-type="normar-type"
  type="normal"
  class="wrap wrap-design"
  style="color: rgb(204, 204, 204);"
>
  <div>0</div>
  <div>basicTemplate</div>
  <div>
    <button>+</button>
    <button>-</button>
  </div>
  <div>
    <span>偶数</span>
  </div>
  <div>
    <img src="/img/logo.82b9c7a5.png" alt  />
  </div>
  <ul></ul>
  <div>emit</div>
  <div title="aaa">
    <a href="www.baidu.com">我是一个超链接</a>
    <input type="text" maxlength="10" value="1111" />
  </div>
</div>
```

<h4>render函数写出跟template一样的例子</h4>

```
<script>
/* eslint-disable */
export default {
    name: 'basicRender',
    props: {
        msg: String
    },
    data() {
        return {
            isDesign: true,
            count: 0,
            innerType: 'normal',
            arr: [0]
        }
    },
    computed: {
        bg() {
            return '#fff'
        },
        newCount() {
            return `新count${this.count}`
        }
    },
    methods: {
        goTo() {
            console.log('goto', this)
        },
        incr() {
            this.count += 1
            this.arr.push(this.count)
        },
        decr() {
            this.count -= 1
            this.arr.pop()
        },
        emitHandle() {
            this.$emit('my-emit')
        }
    },
    render(h) {
        return h(
            'div',
            {
                class: [
                    'warp',
                    this.isDesign && 'wrap-design'
                ],
                style: {
                    color: '#333',
                    backGroundColor: this.bg
                },
                props: {
                    a: 1
                },
                attrs: {
                    id: 'Test',
                    'data-type': "normar-type",
                    type: this.innerType
                },
                on: {
                    click: this.goTo
                }
            },
            [
                h(
                    'div',
                    [
                        `basicRender${this.count}`,
                    ]
                ),
                h(
                    'div',
                    [
                        `新${this.newCount}`,
                    ]
                ),
                h(
                    'div',
                    [
                        `${this.msg}`,
                    ]
                ),
                h(
                    'div',
                    [
                        h(
                            'button',
                            {
                                on: {
                                    click: this.incr,
                                }
                            },
                            [
                                '+'
                            ]
                        ),
                        h(
                            'button',
                            {
                                on: {
                                    click: this.decr,
                                }
                            },
                            [
                                '-'
                            ]
                        )
                    ]
                ),
                h(
                    'div',
                    [
                        h(
                            'span',
                            [
                                this.count % 2 ? '奇数' : '偶数'
                            ]
                        )
                    ]
                ),
                h(
                    'div',
                    [
                        h(
                            'img',
                            {
                                attrs: {
                                    src: require('../assets/logo.png'),
                                    alt: ''
                                }
                            }
                        )
                    ]
                ),
                h(
                    'ul',
                    [
                        this.arr.map((item, key) => {
                            return h(
                                'li',
                                {
                                    key
                                },
                                [
                                    item
                                ]
                            )
                        }) 
                    ]
                ),
                h(
                    'div',
                    {
                        on: {
                            click: this.emitHandle
                        },
                        domProps: {
                            innerHTML: 'emit'
                        }
                    }
                ),
                h(
                    'div',
                    {
                        attrs: {
                            title: 'aaa'
                        }
                    },
                    [
                        h(
                            'a',
                            {
                                domProps: {
                                    href: 'www.baidu.com'
                                }
                            },
                            [
                                '我是一个超链接'
                            ]
                        ),
                        h(
                            'input',
                            {
                                attrs: {
                                    type: 'text',
                                    maxlength: 10,
                                    value: '1111'
                                }
                            }
                        )
                    ]
                )
            ]
        )
    }
} 
</script>
```

生成的dom结构如下所示

```
<div
  id="Test"
  data-type="normar-type"
  type="normal"
  class="warp wrap-design"
  style="color: rgb(51, 51, 51);"
>
  <div>basicRender0</div>
  <div>新新count0</div>
  <div>basicRender</div>
  <div>
    <button>+</button>
    <button>-</button>
  </div>
  <div>
    <span>偶数</span>
  </div>
  <div>
    <img src="/img/logo.82b9c7a5.png" alt  />
  </div>
  <ul>
    <li>0</li>
  </ul>
  <div>emit</div>
  <div title="aaa">
    <a href="www.baidu.com">我是一个超链接</a>
    <input type="text" maxlength="10" value="1111" />
  </div>
</div>
```

<h4>对比template与render二者最终生成的dom结构可以发现</h4>

```
{
  'class': { // 相当于template内的:class,可以是单个值、数组、对象
    foo: true,
    bar: false
  },
  style: { // 相当于template内的:style
    color: 'red',
    fontSize: '14px'
  },
  attrs: { // 给html元素添加属性
    id: 'foo'
  },
  domProps: { // 给html原属添加DOM属性，具体的区别是参考https://juejin.im/post/58d11689a22b9d00644015f1
    innerHTML: 'baz'
  },
  on: { // dom元素上绑定事件，相当于template内的@click等事件
    click: this.clickHandler
  }
}
```

## 理解render函数中的slot

slot的目的是，允许在父组件内使用子组件时可以向子组件传入不同的内容

子组件内定义有slot,父组件内使用的时候传入的内容才会生效

<h4>child template写法</h4>

```
<template>
    <div>
        child --a = {{a}} --- b = {{b}}
        <slot class="defalt-slot"></slot>
        <slot name="child-solt" class="name-slot"></slot>
    </div>
</template>

<script>
/* eslint-disable */
export default {
    name: 'childTemplateSlot',
    props: {
        a: String,
        b: String
    }
}
</script>
```

child render写法

```
<script>
/* eslint-disable */
export default {
    name: 'childRenderSlot',
    props: {
        a: String,
        b: String
    },
    render(h) {
        return h(
            'div',
            [
                `child --a = ${this.a} --- b = ${this.b} `,
                this.$scopedSlots.default,
                this.$scopedSlots['child-solt']
            ]
        )
    }
}
</script>
```

parent template 使用子组件内包含slot写法

```
<div class="default-solt">
    <!-- 匿名slot -->
    <slot></slot>
</div>
<div class="name-slot">
    <!-- 具名slot -->
    <slot name="my-slot"></slot>
</div>

<ChildTemplateSlot a="aa" b="bb">
    <div>child template default solt </div>
    <div slot="child-solt">child template child-solt solt </div>
</ChildTemplateSlot>

<ChildRenderSlot a="aa" b="bb">
    <div>child render default solt </div>
    <div slot="child-solt">child render child-solt solt </div>
</ChildRenderSlot>
```

最终dom结构

```
<div>
  child --a = aa --- b = bb
  <div>child template default solt</div>
  <div>child template child-solt solt</div>
</div>

<div>
  child --a = aa --- b = bb
  <div>child render default solt</div>
  <div>child render child-solt solt</div>
</div>
```

<h4>父组件template写法，子组件采用template、render写法得到的dom结构是一致的</h4>

<h4>parent render 写法</h4>

```
<script>
/* eslint-disable */
import ChildRenderSlot from '../components/childRenderSlot'
import ChildTemplateSlot from '../components/childTemplateSlot'

export default {
    name: 'parentRenderSlot',
    render(h) {
        return h(
            'div',
            [
                h(
                    'div',
                    [
                        this.$slots.default
                    ]
                ),
                h(
                    'div',
                    [
                        this.$slots['my-slot']
                    ]
                ),
                h(
                    'div',
                    [
                        h(
                            ChildRenderSlot,
                            {
                                props: {
                                    a: '1',
                                    b: '2'
                                }
                            },
                            [
                                h(
                                    'div',
                                    [
                                        'child render default solt render'
                                    ]
                                ),
                                h(
                                    'div',
                                    {
                                        slot: 'child-solt',
                                    },
                                    [
                                        'child render child-slot solt render'
                                    ]
                                )
                            ]
                        ),
                        h(
                            ChildTemplateSlot,
                            {
                                props: {
                                    a: '3',
                                    b: '4'
                                }
                            },
                            [
                                h(
                                    'div',
                                    [
                                        'child template default solt render'
                                    ]
                                ),
                                h(
                                    'div',
                                    {
                                        slot: 'child-solt',
                                    },
                                    [
                                        'child template child-solt solt render'
                                    ]
                                )
                            ]
                        )
                    ]
                )
            ]
        )
    }
} 
</script>
```

最终dom结构

```
<div>
  child --a = aa --- b = bb
  <div>child render default solt</div>
  <div>child render child-solt solt</div>
</div>
<div>
  child --a = aa --- b = bb
  <div>child template default solt</div>
  <div>child template child-solt solt</div>
</div>


<div>
  child --a = 1 --- b = 2
  <div>child render default solt render</div>
  <div>child render child-slot solt render</div>
</div>
<div>
  child --a = 3 --- b = 4
  <div>child template default solt render</div>
  <div>child template child-solt solt render</div>
</div>
```

<h4>从上面我们可以看出，当createElemet的第一个元素是组件时，第二个参数内的props是传入第一个组件参数内的props；第二个参数内的slot参数用于指定当前的虚拟dom元素，插入子组件内的哪个slot内；如果子组件也是render写法，默认插槽通过this.$slots.default，具名插槽通过this.$slots['my-slot']渲染</h4>


## 理解render函数中的scopeSlot

<h4>child template 写法</h4>

```
<template>
    <div>
        child --a = {{a}} --- b = {{b}}
        <slot class="defalt-slot" :info="info"></slot>
        <slot name="child-solt" class="name-slot" :info="info2"></slot>
    </div>
</template>

<script>
/* eslint-disable */
export default {
    name: 'childTemplateSlotScope',
    props: {
        a: String,
        b: String
    },
    data() {
        return {
            info: {
                name: `child-${this.a}`,
                sex: `child-${this.b}`,
            },
            info2: {
                name: `child2-${this.a}`,
                sex: `child2-${this.b}`,
            }
        }
    }
}
</script>
```

<h4>child render 写法</h4>

```
<script>
/* eslint-disable */
export default {
    name: 'childRenderSlotScope',
    props: {
        a: String,
        b: String
    },
    data() {
        return {
            info: {
                name: `child-render-${this.a}`,
                sex: `child-render-${this.b}`,
            },
            info2: {
                name: `child2-render-${this.a}`,
                sex: `child2-render-${this.b}`,
            }
        }
    },
    render(h) {
        return h(
            'div',
            [
                `child --a = ${this.a} --- b = ${this.b} `,
                this.$scopedSlots.default({
                    info: this.info
                }),
                this.$scopedSlots['child-solt']({
                    info: this.info2
                })
            ]
        )
    }
}
</script>
```

<h4>parent template 写法</h4>

```
<ChildRenderSlotScope a="aa" b="bb">
    <div slot-scope="slotScope3">child render default solt {{slotScope3.info.name}}  --- {{slotScope3.info.sex}}</div>
    <div slot="child-solt" slot-scope="slotScope4">child render child-solt solt  {{slotScope4.info.name}}  --- {{slotScope4.info.sex}} </div>
</ChildRenderSlotScope>
<ChildTemplateSlotScope a="aa" b="bb">
    <div slot-scope="slotScope">child template default solt {{slotScope.info.name}}  --- {{slotScope.info.sex}}</div>
    <div slot="child-solt" slot-scope="slotScope2">child template child-solt solt {{slotScope2.info.name}}  --- {{slotScope2.info.sex}} </div>
</ChildTemplateSlotScope>
```

得到的dom结构

```
<div>
  child --a = aa --- b = bb
  <div>child render default solt child-render-aa --- child-render-bb</div>
  <div>child render child-solt solt child2-render-aa --- child2-render-bb</div>
</div>
<div>
  child --a = aa --- b = bb
  <div>child template default solt child-aa --- child-bb</div>
  <div>child template child-solt solt child2-aa --- child2-bb</div>
</div>
```

<h4>parent render 写法</h4>

```
<script>
/* eslint-disable */
import ChildRenderSlot from '../components/childRenderSlot'
import ChildTemplateSlot from '../components/childTemplateSlot'

export default {
    name: 'parentRenderSlotScope',
    render(h) {
        return h(
            'div',
            [
                h(
                    'div',
                    [
                        'scope slot',
                        h(
                            ChildRenderSlot,
                            {
                                props: {
                                    a: '999',
                                    b: '888'
                                },
                                scopedSlots: {
                                    default: (props) => {
                                        return h(
                                            'div',
                                            [
                                                `child render default solt render ${props.info.name} xxx ${props.info.sex}`
                                            ]
                                        )
                                    },
                                    'child-solt': (props) => {
                                        return h(
                                            'div',
                                            [
                                                `child render child-slot solt render ${props.info.name} xxx ${props.info.sex}`
                                            ]
                                        )
                                    }
                                }
                            }
                        ),
                        h(
                            ChildTemplateSlot,
                            {
                                props: {
                                    a: '22',
                                    b: '44'
                                },
                                scopedSlots: {
                                    default: (props) => {
                                        return h(
                                            'div',
                                            [
                                                `child template default solt render ${props.info.name} xxx ${props.info.sex}`
                                            ]
                                        )
                                    },
                                    'child-solt': (props) => {
                                        return h(
                                            'div',
                                            [
                                                `child template child-solt solt render ${props.info.name} xxx ${props.info.sex}`
                                            ]
                                        )
                                    }
                                }
                            }
                        )
                    ]
                )
            ]
        )
    }
} 
</script>
```

最终得到的dom结构
```
  <div>
    child --a = 999 --- b = 888
    <div>child render default solt render child-render-999 xxx child-render-888</div>
    <div>child render child-slot solt render child2-render-999 xxx child2-render-888</div>
  </div>
  <div>
    child --a = 22 --- b = 44
    <div>child template default solt render child-22 xxx child-44</div>
    <div>child template child-solt solt render child2-22 xxx child2-44</div>
  </div>
```

<b>
从上面我们可以看出，当createElemet的第一个元素是组件时，第二个参数内的scopedSlots参数用于，传入子slot传入的参数并返回最终插入子slot的模版

如果子组件也是render写法，
默认插槽通过this.$scopedSlots.default传入scope参数
```js
this.$scopedSlots.default({
    info: this.info
})
```
具名插槽通过this.$slots['slot名']传入scope参数
```js
this.$scopedSlots['child-solt']({
    info: this.info2
})
```
</b>


## 对比2.6之后slot的新旧语法

<h4>定义包含slot的子组件</h4>

```
<template>
    <div>
        用于新的slot语法，子组件内的slot写法保持不变
        <div class="default-slot">
            <!-- 匿名插槽 -->
            <slot></slot>
        </div>
        <div class="name-slot">
            <!-- 具名插槽 -->
            <slot name="test"></slot>
        </div>
        <div>
            <!--具名作用域插槽 -->
            <slot name="test2" :info="test"></slot>
        </div>
    </div>
</template>

<script>
export default {
    name: 'newVSlot',
    data() {
        return {
            test: {
                name: 'xiaoming',
                age: 18,
            }
        }
    },
}
</script>
```

<h4>旧写法</h4>

```
<NewVSlot>
    <div>我是匿名插槽2.6之前写法，现已废弃，3.0中不会支持</div>
    <div slot="test">
        我是具名插槽
    </div>
    <div slot="test2" slot-scope="slotScope">
        我是具名作用域插槽{{slotScope.info.name}}---{{slotScope.info.age}}
    </div>
</NewVSlot>
```

<h4>新写法,注意新写法的v-slot只能写到template or component上</h4>

```
<NewVSlot>
    <div>我是匿名插槽2.6之后写法，新特性</div>
    <template v-slot:test>
      <div>
          我是具名插槽
      </div>
    </template>
    <template v-slot:test2="test2">
      <div >
        我是具名作用域插槽{{test2.info.name}}---{{test2.info.age}}
      </div>
    </template>
</NewVSlot>
```

<h4>新写法，简写,使用#代替v-slot:</h4>

```
<NewVSlot>
    <div>我是匿名插槽2.6之后写法，新特性,缩写形式</div>
    <template #test>
      <div>
          我是具名插槽
      </div>
    </template>
    <template #test2="test2">
      <div >
        我是具名作用域插槽{{test2.info.name}}---{{test2.info.age}}
      </div>
    </template>
</NewVSlot>
```

总结：

  1、 createElement的第一个参数，可以是html标签、组件、全局注册的组件名、一个可以返回html标签、组件、全局注册的组件名的函数
  2、 createElement的第二个参数中的，当第一个参数是组件时，props、slot、scopedSlots才有意义

具体demo可查看[vue-render](https://github.com/willson-wang/vue-render)

参考链接：
https://cn.vuejs.org/v2/guide/render-function.html#createElement-%E5%8F%82%E6%95%B0
https://cn.vuejs.org/v2/guide/components-slots.html#%E5%BA%9F%E5%BC%83%E4%BA%86%E7%9A%84%E8%AF%AD%E6%B3%95
