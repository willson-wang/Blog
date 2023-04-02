---
  title: 记一次React15升级到React16过程
  date: 2019-11-24T07:10:53Z
  lastmod: 2020-05-23T01:46:55Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/react.png']
  bibliography: references-data.bib
---

有一个react项目一直停留在15.6.2版本上面，考虑到react16已经发布两三年了以及想在项目中使用react-hooks，所以决定将react版本从15.6.2升级到当前最新的16.12.0版本上来，由于15=>16.3之后的版本有较大的变动，以及react周边也需要一起升级，于是记录一下升级过程

1、先比对一下当前当前package内有哪些可以升级的包，可以使用npm-check来进行查看可升级的版本，如下所示

![image](https://user-images.githubusercontent.com/20950813/75605024-ce334d00-5b19-11ea-8959-966a59419295.png)

2、将react升级到16.12.0之后，react-router内PropTypes报错,查看一下源码是因为，当前的react-router内使用的还是react.PropTypes.func这种属性校验方式

```
yarn upgrade react@16.12.0
```

然后去github react-router上去找版本，发现react-router已经到v5了，而当前项目还停在v2；然后又仔细看了下changeLog，v3到v4是断代升级，整个路由的方式由之前的静态配置，改成了react组件；考虑到升级到4以上代价太大，先暂时升级到v3

![image](https://user-images.githubusercontent.com/20950813/75605090-a1336a00-5b1a-11ea-84f4-cb50aeb79c37.png)

```
yarn upgrade react-router@3.2.5
```

需要注意的是props内去掉了history，我们需要通过this.context.router来进行路由操作

![image](https://user-images.githubusercontent.com/20950813/75605584-02f5d300-5b1f-11ea-86f5-da595dddd473.png)

![image](https://user-images.githubusercontent.com/20950813/75605708-ead28380-5b1f-11ea-80fb-ef1f061ae461.png)

![image](https://user-images.githubusercontent.com/20950813/75605713-0b9ad900-5b20-11ea-9b65-6cffe07e6489.png)

3、自己组件内同样有react.PropTypes的写法，统一修改

![image](https://user-images.githubusercontent.com/20950813/75605120-e8b9f600-5b1a-11ea-9517-7f1ed6a1bf2a.png)

4、redux升级当前版本v3，最新版本v4，查看changLog v3 => v4没有断代升级，所以直接升级到redux4

```
yarn upgrade redux@4.0.4
```

5、react-redux升级当前版本v4，最新版本v7

react-redux5.0版本是对之前的版本一次重构，api保持不变
react-redux6.0重写，有断代更次，使用了新的react.context api等，且还有性能问题
react-redux7.0修复6.0中的性能问题，然后开展支持useRedux

所以直接升级到v7

```
yarn upgrade react-redux@7.1.3
```

6、rc-from升级，当前版本v1，最新版本v2

```
yarn upgrade rc-form@2.4.11
```

7、redux-form升级，当前版本v7，最新版本v8

![image](https://user-images.githubusercontent.com/20950813/75605375-40596100-5b1d-11ea-9893-16f482cce541.png)

主要是react内部withRef需要改成forwardRef，且7.x到8.x是一次断代更新，但是没有废弃api

```
yarn upgrade redux-form@8.2.6
```

8、react-swipeable升级，当前版本v3，最新版本v4

![image](https://user-images.githubusercontent.com/20950813/75605469-0fc5f700-5b1e-11ea-8413-863501d910d3.png)

react-swipeable 4.0不是断代升级，增加了prop-types
react-swipeable 5.0断代升级，使用hooks的方式来使用

```
yarn upgrade react-swipeable@4.3.2
```

9、rc-notification

![image](https://user-images.githubusercontent.com/20950813/75605414-9dedad80-5b1d-11ea-9433-70ec3d5edb83.png)

react16版本中ReactDom.render返回null

```
yarn upgrade rc-notification
```

10. antd-mobile升级，当前版本v1，最新版本v2

antd-mobile v1 => v2有断代升级，所以需要特殊处理

主要变化在在2.0去掉了高清方案，需要把高清方案在加上，以及antd DatePicker 去掉moment依赖、searchBar组件内ref的调整、Tabs组件、Icon组件等等

![image](https://user-images.githubusercontent.com/20950813/75605510-7519e800-5b1e-11ea-9ab0-3ba7d285cad8.png)

![image](https://user-images.githubusercontent.com/20950813/75605514-7a773280-5b1e-11ea-9498-5d5f62502583.png)

![image](https://user-images.githubusercontent.com/20950813/75605521-86fb8b00-5b1e-11ea-8042-77cafa62845b.png)

![image](https://user-images.githubusercontent.com/20950813/75605519-83680400-5b1e-11ea-9edf-804015df9627.png)


升级方案直接查看[文档](https://antd-mobile.gitee.io/docs/react/upgrade-notes-cn#%E9%AB%98%E6%B8%85%E6%96%B9%E6%A1%88?nsukey=U97lQ7d7a7z1UxPEuxG0HwQOrpqocSAEr8yOmV43eRqNsybdOsVSuPmg2btoqUC8jsYY5HrhblNkSCL58dc4a1T2kIWewBE8tYmGQ2rRHmUebN98sOYw82RxtueNN76hPmuiv83FqcA57aBXnml2ro8zWWM8EfeuYGkKjlb0i9b9rMzZgcH%2BHKPecE5zF4ZDPcmBPTEgtHz%2FGGdR%2BnEYnQ%3D%3D)

其它修改

- 使用componentDidMount替换componentWillMount，因为componentWillMount中进行抓取可以避免出现第一个空渲染状态。实际上，这从来都不是真的，因为React总是在componentWillMount之后立即执行渲染。如果在componentWillMount触发时数据不可用，则无论您在何处启动获取，第一个渲染器仍将显示加载状态。这就是为什么在大多数情况下将获取移到componentDidMount不会产生明显影响的原因。

- 使用getDerivedStateFromProps代替componentWillReceiveProps

- 使用componentDidUpdate替换componentWillUpdate

- componentWillReceiveProps也可以根据场景使用componentDidUpdate进行替换


这是最终升级前后的包对比图

![image](https://user-images.githubusercontent.com/20950813/75605202-ad6bf700-5b1b-11ea-8f00-fcc491e5e8a8.png)

总结：升级的关键在于查看每个库对应的changeLog，然后在根据实际业务场景去做决定是否要升级，且升级到哪个版本
