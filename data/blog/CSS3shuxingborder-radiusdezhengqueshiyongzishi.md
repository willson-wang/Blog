---
  title: CSS3属性border-radius的正确使用姿势
  date: 2017-12-14T13:55:43Z
  lastmod: 2017-12-14T13:57:36Z
  summary: 
  tags: ["CSS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

border-radius也是经常使用的一个CSS3属性，最近也经常在项目中使用，所以总结记录一番；

border-radius **CSS3**属性，兼容ie9+及现代浏览器，共有2个属性值，如下所示

`border-radius: <length-percentage>{1,4} [ / <length-percentage>{1,4} 半径的第一个语法取值可取1~4个值
 半径的第二个语法取值也可取1~4个值`

常用的几种写法

1. 一个属性值 border-radius: 20px; => border-radius: 20px 20px 20px 20px / 20px 20px 20px 20px;
![image](https://user-images.githubusercontent.com/20950813/33995444-ff210916-e118-11e7-8d75-3fb3867a12f2.png)

2. 两个属性值 border-radius: 20px 10px; => border-radius: 20px 10px 20px 10px / 20px 10px 20px 10px;
![image](https://user-images.githubusercontent.com/20950813/33995451-0761df42-e119-11e7-8045-7534cc48b471.png)

3. 三个属性值 border-radius: 20px 10px 5px; => border-radius: 20px 10px 5px 10px / 20px 10px 5px 10px;
![image](https://user-images.githubusercontent.com/20950813/33995457-0d3b614a-e119-11e7-9d41-fe39711d33dc.png)

4. 四个属性值 border-radius: 20px 10px 5px 15px; => border-radius: 20px 10px 5px 15px / 20px 10px 5px 15px；
![image](https://user-images.githubusercontent.com/20950813/33995468-1332b42c-e119-11e7-8470-021232ac0d6d.png)

5. 设置两组属性值 border-radius: 40px 10px 5px 15px / 10px 5px 25px 10px; (40/10左上角， 10/5右上角， 5/25右下角， 15/10左下角),每个值代表的意思如下所示40px(左上上边半径) 10px(右上上边半径) 5px(右下下边半径) 15px(左下下边半径) / 10px(左上左边半径) 5px(右上右边半径) 25px(右下右边半径) 10px(左下左边半径);第一组值要么是上边要么是下边，第二组值要么是左边要么是右边；
![image](https://user-images.githubusercontent.com/20950813/33995582-599387f2-e119-11e7-8936-2377fb3091b6.png)


6. 不使用简写属性
`border-top-left-radius: 40px; => border-top-left-radius: 40px 40px;
			border-top-right-radius:20px;
			border-bottom-right-radius: 30px;
			border-bottom-left-radius: 40px;`
![image](https://user-images.githubusercontent.com/20950813/33995587-5e144532-e119-11e7-89d6-9ce057679873.png)

**总结:理解一点一个元素总共可以设置4个圆角，而一个圆角是需要两个值来进行设置的**

**参考链接**
https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-radius

