---
  title: banner图新思路
  date: 2019-03-22T11:27:28Z
  lastmod: 2019-07-06T07:23:01Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

一般banner图思路，就是父容器定宽，并且overflow: hidden；然后包裹一个一级子元素，一级子元素需要清除浮动带来的高度塌陷；最后让所有的二级子元素float: left；
轮播的原理就是不断的改变一级子元素的left, top or transformX, transformY来实现轮播动画；这里需要注意的是区分无缝轮播及有缝轮播；

无缝轮播，在最首复制一个最末尾的元素，在最末复制一张最首的元素，这样就达到来无缝轮播；

有缝轮播，不对首尾进行复制元素，所有从最末到最首及从最首到最末的时候，会滑过中间的元素；

现在换一种新的banner实现思路，来实现无缝轮播，而有缝轮播跟一般的banner图思路是一致的；

使用transition及transitionEnd来实现，通过设置transition的动画时间来控制动画过程；当过渡时间为0的时候，是不会触发transitionEnd动画的；

目前transitionEnd的兼容性，兼容性加上前缀已经很不错了，可以放心的使用

![image](https://user-images.githubusercontent.com/20950813/60752951-cbba3b00-9ffe-11e9-93c5-c18ad3f93333.png)


两个关键点：轮播图片的处理、动画的设置

轮播图的处理，不需要复制首尾两个元素，实现思路就是设置每个siwper-item的transformX,按照顺序排列，需要显示在视窗内的元素，位置总是在第二个位置，且transformX为0，其它的分布在左右；如下图所示

![image](https://user-images.githubusercontent.com/20950813/60752894-c1e40800-9ffd-11e9-91a7-a8b1257812d5.png)

动画的设置分为移动时的动画与切换时的动画

移动时的动画在touchmove事件内处理，通过pageX的差值来进行设置transformX，此时tansition时间为0
切换时的动画通过每个元素现在的transformX 减 or 加上视图的宽度or高度

最后切换动画结束之后，在调整轮播元素的位置，始终将需要出现在视窗内的元素展示在第二个位置，并设置transformX为0

关于自动轮播，一般的实现思路是开一个定时器，然后递归自己，当进入轮播图的时候清除当前的定时器，离开轮播区域之后又重新开启定时器；现在换一个更简单的思路，即切换页面的时候清除当前定时器，结束之后在开启定时器，这样整个逻辑内只有一个定时器存在；

```
_auto() {
    this._stop()
    if (this.auto) {
        this.timer = setTimeout(() => {
            this.next()
        }, this.interval)
    }
}

_stop() {
    this.timer && clearTimeout(this.timer)
}

next() {
        this.slideDerection = 'nexted'
        this.currentIndex += 1
        this.go(this.currentIndex)
}

go(idx) {
    // 清除自动轮播定时器
    this._stop()
    if (idx > this.list.length - 1) {
        this.currentIndex = 0
    }
    if (idx < 0) {
        this.currentIndex = this.list.length - 1
    }
    this.forItems((item, key) => {
        this.setTransition(item, this.duration)
        let distance =
            this.slideDerection === 'nexted'
                ? this._offset[key] - this.width
                : this._offset[key] + this.width
        if (!this.loop && this.auto && this.currentIndex === 0) {
            distance = key * this.width
        }
        this.setTransform(item, distance)
    })
    // 设置完transform之后在开启定时器，因为transition的动画是小于定时器开启的时间的，所以离开后
    // 又可以自动轮播了，这里还可以放到transitionEnd内执行，跟之前的对比少监听了一些事件，减少了处理逻辑
    this._auto()
}
```

```
swiper.vue

<template>
    <div class="slide-wrap" ref="box">
        <div class="slide-content" ref="slide" :style="{ height }" :currentIndex="currentIndex">
            <div
                class="slide-item"
                v-for="(item, index) in newList"
                :class="[index === 1 && 'active']"
                :key="index"
            >
                <div v-if="!isBroadcast" class="slide-item__img" :style="{backgroundImage: `url(${item.img})`}"></div>
                <div class="swiper-txt" v-else :style="{ height, lineHeight: height }">
                    {{ item.txt }}
                </div>
            </div>
        </div>
        <div class="swiper-dots" v-if="showDots">
            <span
                v-for="(item, index) in list"
                :key="index"
                :class="[index === currentIndex ? 'active' : '']"
            ></span>
        </div>
    </div>
</template>

<script>
/**
 *  2 0 1
 *  0 1 2
 *  1 2 0
 *  2 0 1
 *
 *  2 0 1
 *  1 2 0
 *  0 1 2
 *  2 1 0
 *
 *  -375 -750
 *  0 -375
 *  375 0
 *
 *  -375 0
 *  0 375
 *  375 750
 *
 *  -375 -750
 *  0 -375
 *  375 0
 *  750 375
 *
    -750
    0
    750
    1500
    2250
    3000

    0 1 2 3 4 5

    5 0 1 2 3 4  cur = 0
    1 2 3 4 5 0
    2 3 4 5 0 1

    0 1 2 3 4 5  cur = 1  idx = 4
    3 4 5 0 1 2

    3 4 5 0 1 2  cur = 4 idx = 2
    1 2 3 4 5 0  cur = 2 idx = 1
    0 1 2 3 4 5

    0 1 2 3
  0 1 2 3
0 1 2 3
 *  */
import Swiper from './Swiper'

export default {
    name: 'Swiper',
    props: {
        value: {
            type: Number,
            default: 0
        },
        list: {
            type: Array,
            default: () => {
                return []
            }
        },
        height: {
            type: [String, Number]
        },
        duration: {
            type: Number,
            default: 300
        },
        auto: {
            type: Boolean,
            default: true
        },
        showDots: {
            type: Boolean,
            default: false
        },
        loop: {
            type: Boolean,
            default: false
        },
        direction: {
            type: String,
            default: 'horizontal'
        },
        isBroadcast: {
            type: Boolean,
            default: false
        },
        minMovingDistance: {
            type: Number,
            default: 30
        },
        interval: {
            type: Number,
            default: 4000
        }
    },
    data() {
        const index = this.value >= this.list.length ? 0 : this.value
        return {
            currentIndex: index || 0,
            newList: []
        }
    },
    computed: {
        newHeight() {
            return this.height
        }
    },
    methods: {
        init(index = 0) {
            const vm = this
            this.swiper && this.swiper.destory()
            this.swiper = new Swiper({
                wrap: this.$refs.box,
                currentIndex: index,
                slideDerection: this.slideDerection,
                list: this.newList,
                duration: this.duration,
                auto: this.auto,
                loop: this.loop,
                direction: this.direction,
                minMovingDistance: this.minMovingDistance
            }).on('swiperEnd', function end(index) {
                let idx = index
                if (vm.loop && vm.list.length === 2) {
                    idx = index % 2
                }
                vm.currentIndex = idx
                vm.$emit('swiperEnd', idx)
            })
        },
        reRender() {
            if (!this.$el) return
            this.$nextTick(() => {
                this.destory()
                this.currentIndex = this.value
                this.getNewList()
                this.init(this.value)
            })
        },
        getNewList() {
            let tempArr = JSON.parse(JSON.stringify(this.list))
            if (this.loop) {
                if (tempArr.length === 2) {
                    tempArr = [...tempArr, ...tempArr]
                }
                // 需要显示的元素永远处于第二个位置
                tempArr = [...tempArr.slice(this.currentIndex - 1), ...tempArr.slice(0, this.currentIndex - 1)]
            }
            return tempArr
        }
    },
    watch: {
        currentIndex(val) {
            this.$emit('input', val)
        },
        list(val, oldVal) {
            if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
                this.reRender()
            }
        }
    },
    created() {
        this.newList = this.getNewList()
    },
    mounted() {
        if (this.newList.length) {
            this.init(this.currentIndex)
        }
    },
    beforeDestory() {
        this.swiper && this.swiper.destroy()
    }
}
</script>
```

demo

