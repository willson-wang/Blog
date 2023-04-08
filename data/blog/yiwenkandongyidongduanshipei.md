---
  title: 一文看懂移动端适配
  date: 2020-06-25T06:29:58Z
  lastmod: 2023-03-26T09:31:56Z
  summary: 
  tags: ["CSS", "移动端", "适配", "1px"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/css.png']
  bibliography: references-data.bib
---

在我们的移动端开发中，常用的方式还是直接使用手淘的Flexible方案，引入手淘的flexible.js，然后通过postcss等插件将px转换成rem，不需要缩放的字体使用px，图片根据不同的dpr选择二倍、三倍图，或者要求不高的直接使用二倍图，通过各种方法解决1px边框问题

那么我们想过Flexible方案能够实现移动端适配的原理是什么？我们先看下代码，以0.3.2版本为例,仅保留关键代码

```js
if (!dpr && !scale) {
    var isAndroid = win.navigator.appVersion.match(/android/gi);
    var isIPhone = win.navigator.appVersion.match(/iphone/gi);
    var devicePixelRatio = win.devicePixelRatio;
    // 如果是iphone，则根据window.devicePixelRatio获取dpr
    if (isIPhone) {
        // iOS下，对于2和3的屏，用2倍的方案，其余的用1倍方案
        if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {                
            dpr = 3;
        } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)){
            dpr = 2;
        } else {
            dpr = 1;
        }
    } else {
        // 其他设备下，仍旧使用1倍的方案
        dpr = 1;
    }
    // 计算缩放比例
    scale = 1 / dpr;
}

// 设置data-dpr属性，以便可以通过css属性选择器做一些样式处理
docEl.setAttribute('data-dpr', dpr);

// 设置meta标签
if (!metaEl) {
    metaEl = doc.createElement('meta');
    metaEl.setAttribute('name', 'viewport');
    // 设置initial-scale的值
    metaEl.setAttribute('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', minimum-scale=' + scale + ', user-scalable=no');
    if (docEl.firstElementChild) {
        docEl.firstElementChild.appendChild(metaEl);
    } else {
        var wrap = doc.createElement('div');
        wrap.appendChild(metaEl);
        doc.write(wrap.innerHTML);
    }
}

function refreshRem(){
    var width = docEl.getBoundingClientRect().width;
    if (width / dpr > 540) {
        width = 540 * dpr;
    }
    // 将docuemntElement宽度分成10份，用于等比缩放
    var rem = width / 10;
    docEl.style.fontSize = rem + 'px';
    flexible.rem = win.rem = rem;
}

// 监听resize事件，如果触发resize事件，重新设置根元素的font-size
win.addEventListener('resize', function() {
    clearTimeout(tid);
    tid = setTimeout(refreshRem, 300);
}, false);


win.addEventListener('pageshow', function(e) {
    if (e.persisted) {
        clearTimeout(tid);
        tid = setTimeout(refreshRem, 300);
    }
}, false);

refreshRem();

```

从源码看，总共做了如下几件事

1. 判断是否是iphone，如果是iphone则通过devicePixelRatio获取dpr，如果是安卓则dpr都默认是1，然后计算scale缩放比例

2. 在html元素上设置data-dpr属性

3. 如果没有meta标签则创建meta标签，且name=viewport content='initial-scale=' + scale + ', maximum-scale=' + scale + ', minimum-scale=' + scale + ', user-scalable=no'

4. 调用refreshRem方法，在html元素上设置fontSize

5. 监听resize or pageshow事件，重新执行refreshRem方法

我们看完之可能会有如下疑问

- 为什么需要判断iphone？

- devicePixelRatio又是什么？

- 在html元素上设置data-dpr属性的目的是什么？

- 添加meta标签及meta标签上的属性都有什么作用？

- 设置html上的font-size又是为什么？

- 监听resize及pageshow事件的目的又是什么？

- 做了上面这些事情之后，只需要我们将代码中的px转化为rem即可实现移动端的适配了，这又是为什么？

为了解决上面的疑惑，让我们了解下移动端布局的一些历史及一些专业名词

## 关于viewport

移动端刚开始的时候是没有专门针对移动端适配这一说法的，都是直接在手机上打开pc端的站点，那么导致浏览器上查看的时候就有左右滚动条，且需要我们自己手动去缩放屏幕才能够看清内容，在移动端流行之后，这样肯定不行，需要针对移动端进行适配，就出现了viewport，适口的概念；

根据ppk大神关于viewport的描述，移动端上有三个viewport，分别是layout viewport布局视口、visual viewport可视视口、ideal viewport理想视口，具体参考下图

![image](https://user-images.githubusercontent.com/20950813/85668022-cdd64780-b6f0-11ea-9d49-2f182191275d.png)

![image](https://user-images.githubusercontent.com/20950813/85668049-d75faf80-b6f0-11ea-82c1-8044cd77e109.png)

![image](https://user-images.githubusercontent.com/20950813/85668074-ddee2700-b6f0-11ea-949e-7a3791c9978d.png)

ideal viewport并没有一个固定的尺寸，不同的设备拥有有不同的ideal viewport。所有的iphone的ideal viewport宽度都是320px，无论它的屏幕宽度是320还是640，也就是说，在iphone中，css中的320px就代表iphone屏幕的宽度。安卓设备就比较复杂了，有320px的，有360px的，有384px的等等

ideal viewport是最适合移动设备的viewport，ideal viewport的宽度等于移动设备的屏幕宽度，只要在css中把某一元素的宽度设为ideal viewport的宽度(单位用px)，那么这个元素的宽度就是设备屏幕的宽度了，也就是宽度为100%的效果。ideal viewport 的意义在于，无论在何种分辨率的屏幕下，那些针对ideal viewport 而设计的网站，不需要用户手动缩放，也不需要出现横向滚动条，都可以完美的呈现给用户。

利用meta标签对viewport进行控制

移动设备默认的viewport是layout viewport，也就是那个比屏幕要宽的viewport，但在进行移动设备网站的开发时，我们需要的是ideal viewport。那么怎么才能得到ideal viewport呢？这就该轮到meta标签出场了

```
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
```

当我们如上设置时，既可以得到ideal viewport，至于具体原因可以参考[移动前端开发之viewport的深入理解](https://www.cnblogs.com/2050/p/3877280.html)


我们还需要注意一个属性initial-scal，他的值范围时0-10之前的正数，通过移动前端开发之viewport的深入理解这篇文章可以了解到，缩放是相对于ideal viewport来缩放的，缩放值越大，当前viewport的宽度就会越小，反之亦然

以iphone5为例，ideal viewport的宽度是320px，如果设置initial-scal=1.0，则ideal viewport还是320，如果ideal viewport=2，则ideal viewport变成160，如果ideal viewport=0.5，则ideal viewport变成640

## 关于retina屏

在pc端布局的时候我们写100px,那么在屏幕上展示的时候往往对应着100个物理像素，所以我们一般认为css中的像素就是对应着设备的物理像素，其实不然的，pc端也不尽是这样，对于快速发展的移动端来说就更不尽然了，早期的移动端一般都是低清屏，也就是一个css像素对应一个设备像素，但是随着iphone4开始，苹果公司便推出了所谓的Retina屏，分辨率提高了一倍，变成640x960，但屏幕尺寸却没变化，这就意味着同样大小的屏幕上，像素却多了一倍，这时，一个css像素是等于两个物理像素的，之后安卓设备上的一个css像素相当于多少个屏幕物理像素，也因设备的不同而不同，没有一个定论

所以我们在写css样式的时候，同样的100px，在低清屏，即dpr为1的设备上，占据的是100个物理像素，但是在高清屏，dpr为2的设备上则会占据200个物理像素，这样就会导致1px占据2个物理像素，渲染情况被改变，可能对一个宽高固定的div看不出什么，但是对于图片来说则不一样；对于1px的边框也不一样；

我们平时使用的图片大多数是png、jpg这样格式的图片，它们称作是位图图像（bitmap），是由一个个像素点构成，缩放会失真；举个例子一张100px*100px的图片，在dpr为1的屏幕上刚好占据，100*100的物理像素，每一个像素一一对应，图片刚好被正常展示；但是在dpr2的屏幕上则会用200*200的物理像素来展示这种图片，超过来图片本身的像素，则浏览器在处理的时候会放大该图片，导致图片变模糊，同理一张200*200的图片，被展示在100*100的物理像素上，浏览器也会进行对应的压缩，将图片展示处理，导致图片略微失真

这种场景下1px的边框会占用2px的物理像素来展示，导致边框变粗，这个也就是移动端布局常说的1px边框问题

## 关于等比缩放

加入在html header内加入如下meta标签下，得到ideal viewport
```
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
```

我开始写代码,以iphone6 375为标准，有如下标签及样式

```
.wrap {
    font-size: 0;
}

.box1, .box2 {
    display: inline-block;
}

.box1 {
    width: 200px;
    height: 100px;  
    background-color: yellow;
}

.box2 {
    width: 175px;
    height: 100px;  
    background-color: blue;
}

<div class="wrap">
    <div class="box1"></div>
    <div class="box2"></div>
</div>
```

这种在ideal viewport为375的机型上完美展示在一行，但是到宽度比375小的屏幕时，则会出现换行现象，如下图所示

这时候可能会想到，我用百分比布局不久好了吗，但是碰到复杂的dom结构呢？那么有没有一种方式，可以让我在不同的ideal viewport上展示一样的效果呢？答案就是等比缩放，我根据不同的ideal viewport去缩放不就行了吗？那么怎么去达到等比缩放的效果呢？
答案就是rem单位

rem的具体原理可以查看[Rem布局的原理解析](https://yanhaijing.com/css/2017/09/29/principle-of-rem-layout/)

简单点说rem单位是相对html元素上的font-size来进行计算的，也就是说我们只要改变font-size这个基准，那么rem单位尺寸就会发生改变

还是以上面的代码为例子，以iphone6 375为准的话，我们将375分成10份，那么每一份就是37.5，那么我们可以认为在375的屏幕下，1rem=37.5px,同理在320的屏幕下，1rem=32rem,所以我们只需要根据不同的屏幕设置html上的font-size，然后将px尺寸转化成rem尺寸

```
.wrap {
    font-size: 0;
}

.box1, .box2 {
    display: inline-block;
}

.box1 {
    width: 5.333333333333333rem; // 1rem=375px,那么200px就是200/37.5 = 5.333333333333333rem
    height: 2.6666666666666665rem;   // 2.6666666666666665rem
    background-color: yellow;
}

.box2 {
    width: 4.666666666666667rem; // 4.666666666666667rem，也就是.box1的width+.box2的width=10rem
    height: 2.6666666666666665rem;  // 2.6666666666666665rem
    background-color: blue;
}

<div class="wrap">
    <div class="box1"></div>
    <div class="box2"></div>
</div>

<script>
document.documentElement.style.fontSize = document.documentElement.clientWidth / 10 + 'px'
</script>
```
所以我们可以知道通过rem可以达到等比缩放的效果

## 关于1px

通过上面的等比缩放，我们已经知道，通过rem已经可以适配不同的屏幕了，但是我们1px的问题还没解决，就是在高清屏下，1px会用2个物理像素来进行展示，到时1px变粗，那么怎么解决呢？

以iphone6为例，屏幕尺寸当成是375，但是因为dpr等于2，那么宽上的物理像素有750，那么有没有办法，让ideal vieport变成750呢？这样就是1px对应一个1个物理像素；通过前面我们知道initial-scale是针对ideal vieport去进行缩放的，当initial-scale=0.5时，ideal vieport会放大一倍，变成750,所以刚好满足1px对应一个物理像素，同理，我们只需要根据dpr去进行对应的缩放就能满足1px占据一个1个物理像素

```
.wrap {
    font-size: 0;
}

.box1, .box2 {
    display: inline-block;
}

.box1 {
    width: 5.333333333333333rem; // 1rem=375px,那么200px就是200/37.5 = 5.333333333333333rem
    height: 2.6666666666666665rem;   // 2.6666666666666665rem
    background-color: yellow;
}

.box2 {
    width: 4.666666666666667rem; // 4.666666666666667rem，也就是.box1的width+.box2的width=10rem
    height: 2.6666666666666665rem;  // 2.6666666666666665rem
    background-color: blue;
}
.list1, .list2 {
    list-style: none;
    font-size: 16px;
    line-height: 44px;
}
.list1 li {
    border-bottom: 1px solid #ccc;
}

.list2 li {
    border-bottom: 0.5px solid #ccc;
}

<div class="wrap">
    <div class="box1"></div>
    <div class="box2"></div>
</div>
<ul class="list1">
    <li>小明</li>
    <li>小黑</li>
    <li>小白</li>
</ul>
<ul class="list2">
    <li>小明</li>
    <li>小黑</li>
    <li>小白</li>
</ul>

<script>
document.documentElement.style.fontSize = document.documentElement.clientWidth / 10 + 'px'

</script>
```

具体展示如下图所示

![image](https://user-images.githubusercontent.com/20950813/85668906-de3af200-b6f1-11ea-924e-2e4255ce01a6.png)

通过initial-scale进行缩放，将ideal vieport变成实际物理尺寸的宽度，满足1px刚好适用1个物理像素来进行渲染就解决了1px的问题

```
const dpr = window.devicePixelRatio
const meta = document.createElement('meta')
meta.setAttribute('name', 'viewport')
meta.setAttribute('content', `initial-scale=${1 / dpr}, user-scalable=no`)
document.head.appendChild(meta)
document.documentElement.style.fontSize = document.documentElement.clientWidth / 10 + 'px'
```

![image](https://user-images.githubusercontent.com/20950813/85668997-f6ab0c80-b6f1-11ea-89e8-255e8bbba443.png)

当然这只是其中的一种解决1px的方式，另外还有其它很多方法解决1px的问题，详情了解[再谈Retina下1px的解决方案](https://juejin.im/entry/5aa0aa056fb9a028be358ff4)

## 关于一倍图、二倍图、三倍图

从前面我们已经知道png、jpg等格式的图片时位图，而位图根矢量图的区别可以参考[位图和矢量图区别](https://www.cnblogs.com/areliang/archive/2006/04/29/388769.html)

也就是100px*100px的图片，刚好使用100*100的物理像素来展示是刚刚好的，一一对应的关系，如果使用多于or少于100*100的物理像素来展示图片，则会出现缩放的情况，导致图片失真，如下所示

```
.img1 {
    width: 6.933333333333334rem;
    height: 4.8rem;
}

<div>
    <p>
        260px*180px
    </p>
    <img class="img1" src="../static/image/bg.png" alt="" />
</div>
<div>
    <p>
        520px*360px
    </p>
    <img class="img1" src="../static/image/bg@2x.png" alt="" />
</div>
```

![image](https://user-images.githubusercontent.com/20950813/85669293-438ee300-b6f2-11ea-81bc-6c9fb0188193.png)

在dpr2的高清屏下二倍图刚好展示，一倍图模糊

所以我们需要根据dpr来选择不同的倍图来进行展示，尽量保证图片不失真，当然还有折中方案，就是不根据dpr来进行判断，直接使用二倍图

## 了解来了上面这些内容之后，在回过头看前面的的问题

<b>为什么需要判断iphone？</b>

因为总iphone4最开始引入高清屏，又因为安卓下机型过多，放弃适配，所以只特殊判断了iphone，安卓统一为1

<b>devicePixelRatio又是什么？</b>

返回当前显示设备的物理像素分辨率与CSS像素分辨率之比。 此值也可以解释为像素大小的比率：一个CSS像素的大小与一个物理像素的大小。 简单来说，它告诉浏览器应使用多少屏幕实际像素来绘制单个CSS像素。比如iphone6 dpr为2，那么告诉浏览器需要使用2个物理像素来绘制单个css像素

<b>在html元素上设置data-dpr属性的目的是什么？</b>

有些场景下不需要使用rem单位进行等比缩放，但是又需要进行不同的大小展示，这时可以直接使用css属性选择器来进行匹配

<b>添加meta标签及meta标签上的属性都有什么作用？</b>

设置ideal viewport，及ideal viewport的比例，是否允许缩放

<b>设置html上的font-size又是为什么？</b>

进行等比缩放，适配不同机型

<b>监听resize及pageshow事件的目的又是什么？</b>

当我们转动横竖屏的时候，需要重新计算html上的font-size保证样式能够重新适配

<b>做了上面这些事情之后，只需要我们将代码中的px转化为rem即可实现移动端的适配了，这又是为什么？</b>

因为通过添加meta标签，设置ideal viewpor，通过rem实现等比缩放，所以已经基本满足移动端的适配了，剩下只需要考虑1px边框问题及不同倍图图片问题

## 关于vw、vh

vw、vh是css中的长度单位，更具体点就是视口的长度单位

1vw=1%的宽度、1vh=1%的高度，也就是说任何机型下任何屏幕的宽度刚好是100vw，高度是100vh；到这里是不是感觉这个单位就是用来进行等比缩放的；跟rem一样都是用来进行等比缩放，而不像rem需要依赖html元素上的font-size，vw、vh则不需要依赖其它东西

替换rem进行等比缩放

以iphone6 375为准
```
.wrap {
    font-size: 0;
    width: 100vw;
    height: 100vh;
}

.box1, .box2 {
    display: inline-block;
}

.box1 {
    width: 53.333333333333336vw; // vw 100vw = 375 1vw=3.75px
    height: 14.992503748125937vh;   // vh 100vh = 667 1h=6.67px
    background-color: yellow;
}

.box2 {
    width: 46.666666666666664vw;
    height: 14.992503748125937vh;   
    background-color: blue;
}

<div class="wrap">
    <div class="box1"></div>
    <div class="box2"></div>
</div>
```

更多使用方式参考[基于vw等viewport视区单位配合rem响应式排版和布局](https://www.zhangxinxu.com/wordpress/2016/08/vw-viewport-responsive-layout-typography/)

兼容性如下图所示

![image](https://user-images.githubusercontent.com/20950813/85669580-923c7d00-b6f2-11ea-9790-3d4e03de5cf6.png)

注意就算使用vw、vh单位进行布局，还是会存在1px及img失真问题

## 总结

1. 通过meta标签实现ideal viewport
2. 通过rem、vw、vh css长度单位实现等比缩放
3. 缩放init-sacle的目的是解决1px的问题
4. 关于图片的最佳展示，是根据dpr去选择不同倍图

参考链接：

[lib-flexible](https://github.com/amfe/lib-flexible/tree/master)
[移动前端开发之viewport的深入理解](https://www.cnblogs.com/2050/p/3877280.html)
[基于vw等viewport视区单位配合rem响应式排版和布局](https://www.zhangxinxu.com/wordpress/2016/08/vw-viewport-responsive-layout-typography/)
[使用Flexible实现手淘H5页面的终端适配](https://github.com/amfe/article/issues/17)
[再谈Retina下1px的解决方案](https://juejin.im/entry/5aa0aa056fb9a028be358ff4)
[再聊移动端页面的适配](https://juejin.im/entry/5a9d07ee6fb9a028c149f55b)
[HTML meta 元素](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/meta)
[A tale of two viewports — part two](https://www.quirksmode.org/mobile/viewports2.html)
[Meta viewport](https://www.quirksmode.org/mobile/metaviewport/)
