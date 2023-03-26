---
  title: 记一次indexList组件的开发
  date: 2018-07-10T11:21:34Z
  lastmod: 2018-07-10T11:24:01Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

#### indexList组件开发只要捋清楚了核心逻辑那么实现起来就会比较简单了，于是总结一下，便于下次查阅；

#### indexList的两个基本需求
1. 列表滚动的时候，右侧的导航标识也需要跟着变化；

2. 点击or滑动右边导航标识的时候，左侧的列表可以滚动到对应的位置；

#### 列表滚动的时候，右侧的导航标识怎么样去跟随滚动?

实现思路，监听列表的滚动事件，事实获取滚动的scrollY值，根据scrollY值，来计算当前滚动到的index索引；计算方式如下，首先通过getBoundingClientRect()获取每个滚动小块的height高度，并保存到一个数组中；然后判断，如果scrollY小于height[0]，那么index = 0 or 负数；如果scrollY > height [i] && scrollY < height[i + 1]，那么index = i + 1（因为0没有计算在内）; 如果scrollY 不符合上面两个条件则等于height.length - 2，这个2自己根据情况定，目的是防止导航标识跟随到最底部；

```
scrollY(newY) {
      const listHeight = this.listHeight;
      if (-newY < this.menuHeaderElHeight) {
        this.currentIndex = -1;
        return;
      }
      newY = newY + this.menuHeaderElHeight;
      if (-newY < listHeight[0]) {
        this.currentIndex = 0;
        return;
      }

      for (let i = 0; i < listHeight.length; i++) {
        let height1 = listHeight[i];
        let height2 = listHeight[i + 1];

        if (-newY >=height1 && -newY < height2) {
          // 如果修改结构，需要修改currentIndex的计算方式
          this.currentIndex = i + 1;
          this.diff = height2 + newY;
          return;
        }
      }

      this.currentIndex = listHeight.length - 2;
    }
```

#### 点击or滑动右边导航标识的时候，左侧的列表可以滚动到对应的位置

实现思路，绑定touchstart及touchmove事件，通过当前点击的索引来设置当前需要滚动到的元素，如果当前的索引小于0，则置0 or 其它；如果大于height.length - 2则都置为height.length - 2；而move得时候是通过计算（move时获取的touches[0].pageY - 点击时的touches[0].pageY）/ 一个导航标识的高度 | 0；

```
_scrollTo(index, flag) {
      if (index < 0) {
        this.$refs.scroll.scrollTo(0, 0);
        this.scrollY = 0;
        return;
      } else if (index > this.listHeight.length - 2) {
        index = this.listHeight.length - 2;
      }
      console.log(index);
      this.$refs.scroll.scrollToElement(this.groudList[+index], 0);
      this.scrollY = this.$refs.scroll.scroll.y;
    },
```

#### 一种效果的实现方式

![indexlist](https://user-images.githubusercontent.com/20950813/42507147-ad4a79f4-8476-11e8-8713-7f2213daeedb.png)


```
<template>
  <div class="city-map relative">
    <div class="city-map__header">
      <span class="city-map__back" @click="$router.back()"><i class="brokericon icon-arrow-left"></i></span>
      <div>
        <span><i class="brokericon icon-search"></i></span>
        <input type="text" placeholder="请输入城市名称" v-model="searchCity">
      </div>
    </div>
    <div class="city-map__content" v-show="!searchResult.length && !searchCity && list.menu.length">
      <vue-better-scroll class="scroller-container"
        :class="designTime && 'design'"
        ref="scroll"
        :probeType="3"
        :listenScroll="listenScroll"
        :pullDownRefresh="pullDownRefreshObj"
        :pullUpLoad="pullUpLoadObj"
        @pullingDown="$emit('pullingDown')"
        @scroll="scrollHandler"
        @pullingUp="$emit('pullingUp')">
        <div class="city-map__menu">
          <slot name="header"></slot>
          <ul class="city-map__group" v-for="(group, index) in list.menu" :key="index">
            <li class="city-map__group__item city-map__group__item--scroll">
              <h2 class="city-map__group__anchor">{{group.name}}</h2>
              <ul class="city-map__group__list">
                <li v-for="(item, index) in group.items" :key="index" @click="click(item)">
                  <div>{{item.city_name}}</div>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </vue-better-scroll>
      <ul class="city-map__nav" @touchstart="onTouchstartHandler" @touchmove.stop.prevent="onTouchmoveHandler" @touchend="onTouchendHandler">
        <li :data-index="-1" :class="fixedCurrentIndex === -1 ? 'activted' : ''" v-if="this.$slots['header']">#</li>
        <li v-for="(item, index) in list.nav" :key="index" :data-index="index" :class="fixedCurrentIndex === index ? 'activted' : ''">
          {{item}}
        </li>
      </ul>
      <div ref="fixed"
        v-show="isFixedTitle && fixedTitle"
        v-html="fixedTitle"
        class="city-map__group__anchor--fixed city-map__group__anchor">
      </div>
    </div>
    <div class="city-map__search" v-show="searchResult.length || searchCity">
      <ul v-if="searchResult.length">
        <li v-for="(city, index) in searchResult" class="city-map__search__item" :key="index" @click="click(city, true)">{{city.city_name}}</li>
      </ul>
      <div v-else class="no-data">
          <span class="no-data-img" />
          <p>暂无数据哦~</p>
      </div>
    </div>
    <div v-if="!list.menu.length" class="loading">
      <inline-loading></inline-loading>加载中
    </div>
  </div>
</template>

<script>
import VueBetterScroll from "vue2-better-scroll";
import { mapState, mapActions } from "vuex";
import { InlineLoading } from 'vux';

const cities = require('./cities.json').data.cities;


export default {
  name: 'cityMap',
  components: {
    VueBetterScroll,
    InlineLoading
  },
  props: {
    city: Object,
    isFixedTitle: {
        type: Boolean,
        default: false
    }
  },
  data() {
    return {
      pullDownRefreshObj: false,
      pullUpLoadObj: false,
      listenScroll: true,
      currentIndex: -1,
      diff: -1,
      scrollY: -1,
      subTitleEl: null,
      searchResult: [],
      searchCity: '',
      touchmoving: false,
      fixedCurrentIndex: -1,
      touchIndex: -1,
      locCity: {},
      cities: {},
    }
  },
  computed: {
    designTime() {
      return this.isDesignTime
    },
    fixedTitle() {
      return this.list.menu[this.currentIndex] ? this.list.menu[this.currentIndex].name : ''
    },
    list() {
      let nav = [];
      let menu = [];
      const cities = this.cities && this.cities.nested && this.cities.nested.by_pinyin || {};
      for (let prop in cities) {
        if (cities.hasOwnProperty(prop)) {
          nav.push(prop);
          menu.push({
            name: prop,
            items: cities[prop]
          })
        }
      }
      return {nav, menu}
    },
  },
  methods: {
    getRect(el) {
      if (!el) return;
      return el.getBoundingClientRect && el.getBoundingClientRect()
    },
    scrollHandler(e) {
      this.scrollY = e.y;
    },
    _calculateHeight() {
      // 这里是获取了包含固定项的，如果换个类名就需要同步，修改下scrollY内的currentIndex的计算方式
      this.groudList = this.$el.getElementsByClassName('city-map__group__item--scroll');
      this.subTitleEl = this.$el.getElementsByClassName('city-map__group__anchor--fixed')[0];
      this.subTitleHeight = this.subTitleEl ? this.getRect(this.subTitleEl).height : 0;

      this.navItemEles = this.$el.getElementsByClassName('city-map__nav')[0].children;
      this.navItemEl = this.navItemEles[0];
      this.navItemHeight = this.navItemEl ? this.getRect(this.navItemEl).height : 0;

      this.menuHeaderElHeight = (this.$slots['header'] && this.getRect(this.$slots['header'][0].elm).height) || 0;

      this.listHeight = [];

      if (!this.groudList) return;
      let height = 0;
      for (let i = 0; i < this.groudList.length; i++) {
        let item = this.groudList[i];
        height += item.clientHeight;
        this.listHeight.push(height);
      }

        console.log(this.listHeight);
    },
    showToast(ele) {
      this.$vux.toast.show({
        text: ele.innerHTML,
        position: 'middle',
        type: 'text',
        width: '12%'
      })
    },
    onTouchstartHandler(e) {
      const firstTouch = e.touches[0]
      const target = e.targetTouches[0].target.nodeName === 'LI' && e.targetTouches[0].target;
      if (!target) return;
      let navIndex = target.dataset && target.dataset.index;

      this.touch.y1 = firstTouch.pageY;
      this.touch.navIndex = navIndex;
      this.touchIndex = navIndex;

      this.showToast(target);
      this._scrollTo(navIndex, +navIndex < 0);
    },
    onTouchmoveHandler(e) {
      const firstTouch = e.touches[0];
      this.touch.y2 = firstTouch.pageY;
      let delTa = (this.touch.y2 - this.touch.y1) / this.navItemHeight | 0;
      let navIndex = parseInt(this.touch.navIndex) + delTa;
      this.touchIndex = navIndex;
      this.touchmoving = true;
      this._scrollTo(navIndex, +navIndex < 0);
    },
    onTouchendHandler() {
      this.touchmoving = false;
    },
    _scrollTo(index, flag) {
      if (index < 0) {
        this.$refs.scroll.scrollTo(0, 0);
        this.scrollY = 0;
        return;
      } else if (index > this.listHeight.length - 2) {
        index = this.listHeight.length - 2;
      }
      console.log(index);
      this.$refs.scroll.scrollToElement(this.groudList[+index], 0);
      this.scrollY = this.$refs.scroll.scroll.y;
    },
    click(city, flag) {
      this.$emit('checkAddr', city);
    }
  },
  watch: {
    currentIndex(val) {
      this.fixedCurrentIndex = val;
      this.touchmoving && this.showToast(this.navItemEles[val < 0 ? 0 : val]);
    },
    scrollY(newY) {
      const listHeight = this.listHeight;
      if (-newY < this.menuHeaderElHeight) {
        this.currentIndex = -1;
        return;
      }
      newY = newY + this.menuHeaderElHeight;
      if (-newY < listHeight[0]) {
        this.currentIndex = 0;
        return;
      }

      for (let i = 0; i < listHeight.length; i++) {
        let height1 = listHeight[i];
        let height2 = listHeight[i + 1];

        if (-newY >=height1 && -newY < height2) {
          // 如果修改结构，需要修改currentIndex的计算方式
          this.currentIndex = i + 1;
          this.diff = height2 + newY;
          return;
        }
      }

      this.currentIndex = listHeight.length - 2;
    },
    diff(newVal) {
      this.subTitleHeight = this.subTitleHeight ? this.subTitleHeight : this.getRect(this.subTitleEl).height;
      let fixedTop = (newVal > 0 && newVal < this.subTitleHeight) ? newVal - this.subTitleHeight : 0;

      if (this.fixedTop === fixedTop) return;

      this.fixedTop = fixedTop;
      this.$refs.fixed.style['transform'] = `translate3d(0,${fixedTop}px,0)`;
    },
    searchCity(val) {
      if (!val) {
        this.searchResult = [];
        this.$nextTick(() => {
          this._scrollTo(this.currentIndex, true);
        })
      } else {
        this.searchResult = [];
        this.list.menu.forEach((item) => {
          item.items.forEach((city) => {
            if (city.city_name.indexOf(val) > -1) {
              this.searchResult.push(city);
            }
          })
        })
        // this.searchResult = [...new Set(this.searchResult)];
      }
    },
    cities(val) {
      this.$nextTick(() => {
        this._calculateHeight();
      })
    },
    touchIndex(val) {
      if (val && +val > this.currentIndex) {
        this.fixedCurrentIndex = +val;
      } else {
        this.fixedCurrentIndex = this.currentIndex;
      }
    }
  },
  activated() {
    this.groudList = [];
    this.listHeight = [];
    this.subTitleHeight = 0;
    this.touch = {};
    this.searchCity = '';
    this.cities = cities;
    this.$nextTick(() => {
      this._calculateHeight();
    })
  }
}
</script>

<style lang="less" scoped>
  @import '~vux/src/styles/1px.less';

  ul, li {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .city-map {
    display: flex;
    height: 100%;
    flex-direction: column;

    &__header {
      flex: 0 0 45px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #ddd;

      >span {
        flex: 0 0 56px;
        height: 30px;
        text-align: center;
        line-height: 30px;
        i {
          color: #939899;
          font-size: 22px;
        }
      }

      >div {
        flex: 0 0 274px;
        align-items: center;
        position: relative;
        height: 30px;

        span {
          position: absolute;
          top: 50%;
          left: 12px;
          transform: translate(0, -50%);
          
          i {
            color: #aeaeae;
            font-size: 16px;
          }
        }

        input {
          color: #000;
          background-color: #e3e6e6;
          font-size: 14px;
          width: 100%;
          border: 0;
          outline: none;
          border-radius: 3px;
          text-indent: 34px;
          height: 30px;
          line-height: 30px;
        }
      }
    }

    &__content {
      flex: 1;
      position: relative;
      overflow: hidden;

      .scroller-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        bottom: 0;
        overflow: hidden;
      }
    }

    &__group {
      

      &__item {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      &__anchor {
        flex: 0 0 41px;
        width: 100%;
        line-height: 41px;
        border-bottom: 1px solid #f5f5f5;
        background-color: #f5f5f5;
        font-size: 12px;
        color: #999;
        padding-left: 22px;
        font-weight: normal;
      }

      &__list {
        display: flex;
        flex-direction: column;
        justify-content: center;

        >li {
          flex: 0 0 50px;

          >div {
            height: 50px;
            line-height: 50px;
            border-bottom: 1px solid #e2e2e2;
            font-size: 16px;
            color: #000;
            padding-left: 22px;
            background-color: #fff;
          }

          &:last-of-type div {
            border-bottom: 1px solid #f5f5f5;
          }
        }
      }
    }

    &__nav {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;

      li {
        flex: 0 0 24px;
        width: 100%;
        font-size: 14px;
        line-height: 24px;
        color: #000;
        font-weight: 700;
      }

      .activted {
        color: orange;
      }
    }

    &__search {
      flex: 1;
      position: relative;
      overflow: hidden;

      &__item {
        height: 50px;
        line-height: 50px;
        border-bottom: 1px solid #ddd;
        font-size: 16px;
        color: #000;
        padding-left: 22px;
        background-color: #fff;
      }
    }

    .no-data{
        margin-top: 90px;
        font-size: 12px;
        color: #999;
        text-align: center;
        .no-data-img{
            background: url("./img/noData.jpg")  no-repeat center;
            display: inline-block;
            background-size: 100% 100%;
            width: 80px;
            height: 70px;
        }
    }

    .loading {
      margin-top: 90px;
      text-align: center;
    }
  }
</style>

<style lang="less" scoped>
.relative {
    position: relative;
}
html.ios,
html.iphone {
    &.is-app,
    &[data-runtime="app"] {
        .relative {
            position: relative;
            padding-top: 20px
        }
    }
}
@iphonex: ~"only screen and (device-width: 375PX) and (device-height: 812PX) and (-webkit-device-pixel-ratio: 3)";
@media @iphonex {
    html.ios,
    html.iphone {
        &.is-app,
        &[data-runtime="app"] {
            .relative{
                padding-top: 44px;
            }
        }
    }
}
</style>
```
