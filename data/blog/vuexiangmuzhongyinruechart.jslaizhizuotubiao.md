---
  title: vue项目中引入echart.js来制作图表
  date: 2017-12-11T12:44:05Z
  lastmod: 2017-12-11T12:50:46Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

echart.js是一款超级强大的图表制作插件，可以满足我们展示业务数据，如柱形图，饼状图，折线图，仪表图等，因为这次项目内大量地方用到数据展示，所以引入了echart.js插件用于制作图表，先总结下开发的时候遇到的小问题

1. 首先引入echarts.js，使用npm install --save echarts 

2. 定制组件，因为复用的地方比较多，所以抽出来成了组件，共封装了四个组件，折线图，柱状图，饼状图，仪表图，封装这四个组件的方法类似

3. 按需引入，因为echarts的组件较多导致文件较大，所以这里需要使用什么就引入什么，bar柱状图，gauge仪表盘，line折线图，pie饼状图
    `const echarts = require('echarts/lib/echarts'); // 引入echarts主模块
    require('echarts/lib/chart/bar'); // 引入柱状图
    require('echarts/lib/component/tooltip'); // 引入提示框
    require('echarts/lib/component/title'); // 引入标题组件
    require('echarts/theme/macarons'); // echarts 主题`

4. 柱状图通过xAxis，与yAxis的type属性的值来决定哪个是类目轴哪个是数值轴，category类目轴，value表示数值轴
    ` xAxis: {
                        // type参数决定那个是类目轴哪个是数值轴
                        type: this.isShowX ? 'category' : 'value',
                    },`
     `yAxis: {
                        type: this.isShowX ? 'value' : 'category',
                    },`

5. 怎样让echart.js制作出来的图表随着浏览器的窗口大小的变化而变化
    1. 初始化组件的时候，监听window对象的resize事件，回调函数是chart对象的返回值下的resize方法，echart插件自带的方法
     `window.addEventListener('resize', this.chart.resize)`
    2. 销毁组件的时候在注销掉resize事件
    ` window.removeEventListener('resize', this.chart.resize);`，注意要在this.chart.dispose();之前注销

6. 怎么去动态设置图表的值，让图表随着后端请求来的值进行实时更新
    1. watch父组件传入的数据
    2. this.chart.setOption(this.opt); 利用setOption方法重新赋值

7. 柱状图，折线图不显示坐标轴，通过设置xAxis，yAxis下的axisLine，不显示背景色通过设置xAxis，yAxis下的splitLine与splitArea

8. legend属性用于设置切换索引

开发效果图
![chart1](https://user-images.githubusercontent.com/20950813/33831586-989628d2-deb3-11e7-97f0-5dd1a1751449.png)

![chart3](https://user-images.githubusercontent.com/20950813/33831672-ee53252c-deb3-11e7-96e2-4ed0cc086022.png)


echart.js的使用不难，难的时配置参数的查找；

封装有该组件的项目地址


参考链接
http://echarts.baidu.com/option.html#series
   
