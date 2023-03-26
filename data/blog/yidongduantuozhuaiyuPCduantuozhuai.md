---
  title: 移动端拖拽与PC端拖拽
  date: 2018-01-13T10:09:48Z
  lastmod: 2018-03-01T03:49:35Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### js实现拖拽的原理，大致可分为三个步骤：

1. 绑定mousedown事件，获取鼠标点在被拖拽元素上的初始坐标；同时给document绑定mousemove事件与mouseup事件
2. 在mousemove内去动态赋值被拖拽元素的left or top值；
3. 在mouseup的事件函数内解绑document上的mousemove事件，并初始化一些值
4. 需用注意的是mousedown的时候要阻止冒泡及通过onselectstart来禁止选中

### PC端与移动端的区别是：

1. 绑定的事件不一样，pc端被拖拽元素上绑定的是mousedown而移动端是touchstart，pc端document上绑定的时mousemove、mouseup而移动端上绑定的时touchmove、touchend;
2. 事件对象event中取值不一样，pc端是通过e.clientX/Y、e.pageX/Y而移动端是通过e.targetTouches[0].pageX/Y来获取坐标值

### 移动端拖拽实例
```
<template>
    <div class="ui-channel-manage" ref="channel">
        <p class="ui-channel-manage__title" ref="title">
            频道管理
        </p>
        <div class="ui-channel-manage__content" >
            <ul class="clearFix" ref="list">
                <li v-for="item in channelList" :key="item.key" @touchstart="handlerTouchStart($event, item.key)" :class="{'ui-active': currentIndex === item.key}">
                    <span>{{item.title}}</span>
                    <strong @click="closeTag(item.key)">x</strong>
                </li>
            </ul>
        </div>
        <div class="ui-channel-manage__back" ref="back">
            <p v-show="isEditor">
                编辑
            </p>
            <div v-show="!isEditor">
                <span>取消</span>
                <span>确定</span>
            </div>
        </div>
    </div>
</template>

<script>
    import {mapGetters} from 'vuex';
    export default {
        name: 'channelManage',
        data () {
            return {
                isEditor: false,
                disX: null,
                disY: null,
                disBlank: null,
                channelRect: null,
                currentTarget: null,
                currentIndex: null,
                startIndex: null,
                cursorDown: false,
                coordinateLi: [],
                initChannelList: [
                    {key: 0, title: 'SKU库存管理'},
                    {key: 1, title: '待处理订单'},
                    {key: 2, title: '亏损订单'},
                    {key: 3, title: '待处理包裹'},
                    {key: 4, title: '促销管理'},
                    {key: 5, title: '客服异常订单'},
                    {key: 6, title: '订单异常管理'},
                    {key: 7, title: '图片管理'},
                    {key: 8, title: '订单规则条件管理'}]
            };
        },
        computed: {
            ...mapGetters([
                'showSideBar'
            ]),
            channelList () {
                return this.initChannelList;
            }
        },
        watch: {
            showSideBar (val) {
                if (val) {
                    this.getAllCoordinateLi();
                }
            }
        },
        methods: {
            closeTag (index) {
                this.initChannelList.splice(index, 1);
                this.initChannelList.forEach(item => {
                    if (item.key > index) {
                        item.key -= 1;
                    }
                });
            },
            getAllCoordinateLi () {
                const lis = this.$refs.list.children;
                Array.from(lis).forEach((item, index) => {
                    const rect = item.getBoundingClientRect();
                    this.coordinateLi.push({
                        top: rect.top,
                        left: rect.left,
                        bottom: rect.bottom,
                        right: rect.right,
                        index: index
                    });
                });
            },
            judgePosition () {
                const rect = this.currentTarget.getBoundingClientRect();
                const left = rect.left;
                const bottom = rect.bottom;
                console.log(this.coordinateLi);
                this.coordinateLi.forEach(item => {
                    console.log(left, item.left, left > item.left, bottom, item.top, bottom > item.top);
                    if (left > item.left && bottom > item.top) {
                        console.log(this.$refs.list.children, item.index);
                        this.currentIndex = item.index;
                    }
                });
            },
            handlerTouchStart (e, index) {
                e.stopImmediatePropagation();
                this.cursorDown = true;
                const rect = e.target.getBoundingClientRect();
                this.disX = e.targetTouches[0].pageX - rect.left;
                this.disY = e.targetTouches[0].pageY - rect.top;
                let target = null;
                if (e.target.nodeName === 'SPAN' || e.target.nodeName === 'STRONG') {
                    target = e.target.parentNode;
                }
                const dom = target || e.target;
                this.currentTarget = dom.cloneNode(true);
                this.currentTarget.style.position = 'absolute';
                this.currentTarget.style.zIndex = '99';
                this.currentTarget.style.right = '1000px';
                this.$refs.list.appendChild(this.currentTarget);
                this.startIndex = index;
                this.channelRect = this.$refs.channel.getBoundingClientRect();
                // { passive: false }
                document.addEventListener('touchmove', this.handlerTouchMove, { passive: false });
                document.addEventListener('touchend', this.handlerTouchEnd);
                document.onselectstart = () => false;
            },
            handlerTouchMove (e) {
                if (!this.cursorDown) return;
                e.preventDefault();
                let left = e.targetTouches[0].pageX - this.channelRect.left - this.disX;
                let top = e.targetTouches[0].pageY - this.disY;
                this.currentTarget.style.left = left + 'px';
                this.currentTarget.style.top = top + 'px';
                this.judgePosition();
            },
            handlerTouchEnd (e) {
                if (!this.cursorDown) return;
                document.removeEventListener('touchmove', this.handlerTouchMove, { passive: false });
                this.cursorDown = false;
                document.onselectstart = null;
                this.disX = null;
                this.disY = null;
                this.$refs.list.removeChild(this.currentTarget);

                const currentItem = this.initChannelList[this.currentIndex];
                console.log(this.initChannelList, this.currentIndex, this.startIndex);
                this.initChannelList[this.currentIndex] = this.initChannelList[this.startIndex];
                this.initChannelList[this.startIndex] = currentItem;
                this.initChannelList[this.currentIndex].key = this.currentIndex;
                this.initChannelList[this.startIndex].key = this.startIndex;
                console.log(this.initChannelList);
                this.getAllCoordinateLi();
                this.currentTarget = null;
                this.currentIndex = null;
                this.startIndex = null;
            }
        },
        beforeDestroy () {
            document.removeEventListener('touchend', this.handlerTouchEnd);
        }
    };
</script>

<style lang="less" scoped>
    @import (reference) '../assets/less/index.less';
    .ui-channel-manage {
        display: flex;
        flex-direction: column;
        height: 100%;
        &__title {
            line-height: 92px;
            flex: 0 0 92px;
            font-size: 40px; /*px*/
            color: @color-info1;
            background-color: @color-white;
            z-index: 2;
            padding-left: 35px; 
            text-align: left;
            font-weight: bold;
        }
        &__content {
            flex: 1;
            text-align: left;
            padding-left: 35px;
            display: flex;
            flex-flow: wrap;
            justify-content: flex-start;
            flex-direction: column;
            ul > {
                flex: 0 0 auto;
                >li {
                    position: relative;
                    float: left;
                    width: 252px;
                    height: 70px;
                    line-height: 70px;
                    text-align: center;
                    background-color: #f7f7f7;
                    border-radius: 10px;
                    margin-bottom: 25px;
                    >span {
                        font-size: 26px; /*px*/
                        line-height: 26px;
                        color: @color-info1;
                    }
                    >strong {
                        position: absolute;
                        right: 13px;
                        top: 8px;
                        font-weight: normal;
                        font-size: 16px; /*px*/
                        line-height: 1;
                    }
                }
                
                >li:nth-child(odd) {
                    margin-right: 35px;
                }

                .ui-active {
                    background-color: @color-primary;
                    transform: scale(1.1);
                    >span {
                        color: #fff;
                    }
                }
            }
        }
        &__back {
            flex: 0 0 90px;
            line-height: 90px;
            font-size: 32px; /*px*/
            color: @color-primary;
            background-color: @color-white;
            z-index: 2;
            font-weight: bold;
            display: flex;
            flex-direction: column;
            >div {
                width: 100%;
                flex: 0 0 90px;
                display: flex;
                align-items: center;
                >span {
                    flex: 0 0 50%;
                    background-color: @color-white;
                    color: @color-info1;
                }
                >span:last-child {
                    background-color: @color-primary;
                    color: @color-white;
                }
            }
        }
    }

    
</style>
```
