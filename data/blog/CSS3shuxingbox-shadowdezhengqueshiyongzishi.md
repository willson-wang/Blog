---
  title: CSS3属性box-shadow的正确使用姿势
  date: 2017-12-14T13:32:24Z
  lastmod: 2017-12-14T13:32:24Z
  summary: 
  tags: ["CSS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

box-shadow虽然一直在使用，但是没有总结过，这几天在项目中频繁的用到，于是总结记录一番。

box-shadow **CSS3** 的属性，目前兼容ie9+及现代浏览器，共有6个属性值，如下所示

`box-shadow: outside|inside offset-x offset-y blur-radius spread-radius color`

1. 第一个参数 outside|inside 阴影位置显示参数，默认为outside(可以省略)；
2. 第二个参数offset-x设置水平方向的阴影，正值表示水平右方向阴影，负值表示水平左方向阴影，0表示水平左右阴影，值越大阴影偏移元素的位置越远；
3. 第三个参数offset-y设置垂直方向的阴影，正值表示垂直下方向阴影，负值表示垂直上方向阴影，0表示垂直上下阴影，值越大阴影偏移元素的位置越远；
4. 第四个参数blur-radius设置阴影的模糊面积，只能设正值，值越大阴影越模糊；
5. 第五个参数spread-radius设置阴影扩大收缩参数，正值表示扩大，负值表示缩小，值越大阴影的面积就越大(即阴影的面积会超过元素本身的面积)；
6. 第六个参数color设置阴影的颜色；

几种常用的场合

1. 设置4面阴影  `box-shadow: 0 0 10px 3px #ccc;`；
![image](https://user-images.githubusercontent.com/20950813/33994453-810b6d08-e115-11e7-93b4-30fd3bc64253.png)

2. 设置单边阴影如下边阴影，关键在spread-radius扩大收缩参数，这个时候需要设置成负值，不然水平方向会有阴影，其它同理`box-shadow: 0 10px 10px -5px #ccc;`；
![image](https://user-images.githubusercontent.com/20950813/33994583-0d0eb576-e116-11e7-8efd-dd27347c40a6.png)

3. 每边设置不同的阴影,需要注意的时候，因该是渲染了四次，只不过每组组侧重的阴影不一样，才能设置不同颜色的阴影，这里的blur-radius不能大，大的话阴影之间会互相渗透
`box-shadow: 3px 0 1px red, -3px 0 10px #ccc, 0 -3px 1px blue, 0 3px 1px #000;`
![image](https://user-images.githubusercontent.com/20950813/33994570-ffa92362-e115-11e7-8429-e9b653875ffd.png)


**参考链接**
https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-shadow
