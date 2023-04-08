---
  title: 预渲染实现
  date: 2020-11-19T10:17:21Z
  lastmod: 2020-11-19T10:18:23Z
  summary: 
  tags: ["HTML5", "预渲染", "白屏"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/chrome2.jpeg']
  bibliography: references-data.bib
---

## 前言

目前spa大行其道的时候，首屏白屏问题越来越受到关注，那么目前行业内针对首屏白屏的问题有了多种解决方案，比如ssr、预渲染等

这里要说的就是预渲染，因为相对于ssr，前端项目接入预渲染的成本相对低一些，那么我们先来看下什么是预渲染

在说预渲染之前我们需要先了解客户端渲染

访问url -> 服务端返回index.html -> 浏览器解析index.html -> 浏览器加载静态js、css文件 -> 生成renderTree -> 呈现页面 -> 执行前端框架react or vue的代码构建dom树 -> 将dom树挂载到app节点上 -> 呈现页面

那么我们看下一般的spa项目服务端返回的index.html，如下所示

```html
<!DOCTYPE html>
<html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link href="https://xxxx/static/css/app.3dca586be353adccc49862bd671ccc5b.css">    
</head>
<body>
    <div id="app"></div>
    <script src="https://xxxx/static/js/manifest.db4be5c29ce8b1bac3c1.js"></script>
    <script src="https://xxxx/static/js/vendor.ajsjskdjk893hsjhdjsh.js"></script>
    <script src="https://xxxx/static/js/app.jdkaj898432njdsahjkm.js"></script>
</body>
</html>
```

也就是说，我们想要看到具体的视图，需要等待react or vue执行了挂载到app节点的操作才可以，那么从url输入到执行app挂载这个阶段都是白屏时间；这种场景还是路由没有进行懒加载的情况，如果路由进行了懒加载，那么执行app挂载的时候，因为没有对应的组件进行渲染，我们看到的页面实质上还是空白页面，我们可以通过chrome浏览器的performance来看下整个页面渲染的过程，如下图所示，图中这个例子采用的是react+react-router路由懒加载的方式，所以导致白屏时间相对长

![image](https://user-images.githubusercontent.com/20950813/99650843-dd37a200-2a90-11eb-8f76-676c0ada9c0f.png)

那么导致长时间白屏的原因主要如下
1. 首页index.html加载的时间  - 理论白屏时间
2. 静态资源加载的时间 - 实际白屏时间
3. 前端框架生成dom树并挂载的时间 - 实际白屏时间
4. 如果首页的路由是懒加载的方式进行加载，还需要加上子路由的静态资源加载及前端框架重新渲染的时间 - 实际白屏时间

## 什么是预渲染

上面我已经知道了白屏时间主要由两部分组成，理论白屏时间+实际白屏时间；理论白屏时间需要我们通过网络及服务器来进行相关的优化，并且这个优化一般也很难有提升；那么针对这个实际白屏时间，我们是不是有优化空间呢？是的，这一部分有很大的优化空间，如果我们直接返回的index.html内就包含了首页需要渲染的dom结构，那么是不是当index.html加载完成之后，我们就可以直接看到返回的dom结构呢？我们还是通过chrome浏览器的performance来看下整个页面渲染的过程

![image](https://user-images.githubusercontent.com/20950813/99651092-238d0100-2a91-11eb-9ad0-b4c89613a263.png)

我们从图上可以看出来，实际白屏时间已经几乎没有了，这种先将对应的dom结构提前生成到index.html内的方式就叫预渲染

### 静态数据预渲染

那么我们在实际项目中怎么去做预渲染，我们不可能动过手动的方式去把dom结构写到到index.html内去，那我们实现自动插入的思路是怎样的呢？

以webpack插件为例

通过谷歌发布的无头浏览器库puppeteer启动一个无头浏览器 -> 打开指定路由的页面（可以是本地，也可以是线上url）-> 通过无头浏览器提供的api拿到某个时间节点对应的dom（需要对数据脱敏，或者做些修正处理） -> 通过处理html的插件，将生成的dom节点插入到对应的index.html内去

这样我们的预渲染dom结构就可以自动插入到对应的index.html内去了

这种预渲染又带来什么问题呢？

1. 针对动态展示数据的页面不好处理
2. 首页预渲染出来的dom，不适配其它路由页面

针对动态展示数据的页面不好处理什么意思，也就是当我们的页面是通过接口返回的数据做不同的渲染，那么我们则无法通过预渲染直接拿某个状态的dom结构了，因为不同的用户看到的内容可能不一至；如下所示

<img width="375"  src="https://user-images.githubusercontent.com/20950813/99652296-9ba7f680-2a92-11eb-8720-bdf1dc139f42.png"  />

不同的用户看到的列表内容可能是不一样的

首页预渲染出来的dom，不适配其它路由页面什么意思，也就是说，我们只根据我们的首页的来生成对应的dom结构，但是我们切换到其它路由，然后重新刷新的时候，因为预渲染出来的dom还是首页的dom，但是当前的路径已经不是首页路径的话，那么这里页面会有一个严重的页面过度问题；怎么解决，有两个思路

第一个思路：默认插入的预渲染dom display：none;然后在预渲染dom的下面插入一段script脚本，判断当前path是首页的时候才展示预渲染的dom，如果不是则还是不展示；这样子的话其实相当于做了部分场景下的首屏白屏优化

第二个思路：每个页面都生成一份对应有预渲染dom的html，除了预渲染dom不一样，其它引入的js、css都一样,如下所示

```html
首页 ／

<div id="app">
    <div>我是首页预渲染dom</div>
</div>

首页 /a

<div id="app">
    <div>我是a页面预渲染dom</div>
</div>
```

然后我们需要修改我们的nginx配置，当匹配到不同的路径时，要返回对应的那个html文件，这样就可以保证每个路由页面单独刷新的时候，不会展示其它页面的预渲染dom；但是这种方式成本过高

看下常用的用来生成预渲染页面的插件

```js
const path = require('path')
const PrerenderSPAPlugin = require('prerender-spa-plugin')

module.exports = {
  plugins: [
    ...
    new PrerenderSPAPlugin({
      // 生成预渲染文件的目录
      staticDir: path.join(__dirname, 'dist'),
      // 需要生成预渲染的路由
      routes: [ '/', '/about', '/some/deep/nested/route' ],
    })
  ]
}
```

更多使用方式直接[参考文档](https://github.com/chrisvfritz/prerender-spa-plugin)

### 动态数据预渲染

除了上面预渲染思路还有没有其它的预渲染思路，有骨架屏

通过上面已经知道，有些动态数据的场景不方便直接生成对应的预渲染dom,那么我可不可使用一种更抽象一点的方式来表示预渲染dom呢？答案就是骨架屏

我们通过一些灰色的占位div，大致描述出一个页面的内容，然后用来过度展示，这样即不会看到的是白屏，也不用担心数据问题，如下所示

<img width="375"  src="https://user-images.githubusercontent.com/20950813/99652488-d9a51a80-2a92-11eb-8ef8-35243fd0ba8b.png"  />

骨架屏的实现思路

1、通过谷歌发布的无头浏览器库puppeteer启动一个无头浏览器 -> 打开指定路由的页面（可以是本地，也可以是线上url）-> 通过无头浏览器提供的api拿到某个时间节点对应的dom -> 去掉dom节点的内容及背景色等等，维持原本的dom结构 -> 通过处理html的插件，将生成的dom节点插入到对应的index.html内去

2、通过谷歌发布的无头浏览器库puppeteer启动一个无头浏览器 -> 打开指定路由的页面（可以是本地，也可以是线上url）-> 通过无头浏览器提供的api拿到某个时间节点对应的dom -> 遍历所有的dom，使用定位的方式重新组织dom结构 -> 通过处理html的插件，将生成的dom节点插入到对应的index.html内去

当然骨架屏的使用也会碰到首页预渲染出来的dom，不适配其它路由页面的问题，这个需要我们在实际项目中灵活对待

常用的生成骨架屏的插件

饿了么的骨架屏插件page-skeleton-webpack-plugin
```js
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { SkeletonPlugin } = require('page-skeleton-webpack-plugin')
const path = require('path')
const webpackConfig = {
  entry: 'index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index.bundle.js'
  },
  plugin: [
    new HtmlWebpackPlugin({
       // Your HtmlWebpackPlugin config
    }),
    new SkeletonPlugin({
        pathname: path.resolve(__dirname, `${customPath}`), // the path to store shell file
        staticDir: path.resolve(__dirname, './dist'), // the same as the `output.path`
        routes: ['/', '/search'], // Which routes you want to generate skeleton screen
    })
  ]
}
```

更多使用方式[参数文档](https://github.com/ElemeFE/page-skeleton-webpack-plugin)

auto-skeleton-cli

```js
module.exports = {
    "url": "https://m.jd.com/",
    "wrapEle": "body",
    "viewportParams": {
        "width": 375,
        "height": 667,
        "deviceScaleFactor": 1,
        "isMobile": true
    },
    "awaitTime": 3000,
    "launchParams": {
        "headless": true,
        "devtools": false,
        "ignoreHTTPSErrors": false
    },
    "outputFile": {
        "path": "./index.html",
        "wrap": "#app"
    },
    "goToOptions": {
        "waitUntil": 'networkidle0'
    }
}
```

最后如果即不想使用预渲染的dom也不想要骨架屏，同时不想白屏时间过长，那么也可以直接使用一些loading或者动态的logo之类的gif图or svg来作为预渲染的内容，如下所示

<img width="375"  src="https://user-images.githubusercontent.com/20950813/99652402-bed2a600-2a92-11eb-9a75-62e2abfc614b.png"  />

## 总结

我们首先要知道白屏时间主要由两部分组成理论白屏实际+实际白屏时间，我们可以通过预渲染的方式优化我们的实际白屏时间；需要注意的是如果我们的路由不是通过懒加载的方式进行加载的，我们的预渲染的dom结构可以直接生成到id=app的节点内，等待框架自动挂载替换app节点内的内容；如果我们的路由是通过懒加载的方式实现的，有两个思路，第一个预渲染的dom还是放到id=app内的节点内，但是这里还要处理子路由对应的js及框架render的这个时间；第二个思路就是将预渲染的dom放到id=app同级的一个div内，然后在路由加载完成之后在隐藏这个div
