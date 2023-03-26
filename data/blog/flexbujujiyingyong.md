---
  title: flex布局及应用
  date: 2018-03-01T07:16:33Z
  lastmod: 2018-03-01T07:18:19Z
  summary: 
  tags: ["CSS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 简介
flex布局简称弹性盒模型布局，是2009年w3c提出的一种可以简洁、快速弹性布局的属性。主要思想是给予容器控制内部元素高度和宽度的能力，是目前移动端布局常用的一种方式

flex布局主要包括flex容器与flex项目，而flex项目又可以是一个新的flex容器，依次类推；只要给一个元素设置了display: flex；那么浏览器在渲染的时候就会该元素为一个flex容器，其内的子元素为flex项目；

flex中的有两条轴分别代表水平和垂直方向，常常称为主轴与交叉轴，默认情况下主轴为水平方向(从左至右)，交叉轴为垂直方向,因为flex-direction的默认值为row

![flexbox](https://user-images.githubusercontent.com/20950813/36831658-6f302d96-1d63-11e8-93fa-f6f4f059bb89.png)


### flex容器的属性

1. flex-direction: row(行，左至右)(默认值) || column(列，上至下) || row-reverse(行，右至左) || column-reverse(列， 下至上); 控制Flex项目沿着主轴（Main Axis）的排列方向

2. flex-wrap: wrap(当主轴方向无法显示足够的flex项目时，则会换行显示，从主轴的默认排列方向)(默认值) || nowrap(不换行显示，所有的flex项目显示在这一行，当flex容器的宽度超过视窗宽度则出现滚动条) || wrap-reverse(当主轴方向无法显示足够的flex项目时，则会换行显示，从主轴的默认排列方向的反方向开始排列);

3. flex-flow: flex-direction flex-wrap 是这两个属性的简写属性

4. justify-content(类似text-align属性)(只对主轴有效): flex-start(让flex项目从主轴默认开始的方向对齐)(默认值) || flex-end(让flex项目从主轴默认结束的方向对齐) || center(延主轴居中对齐) || space-between(让除了第一个和最一个Flex项目的两者间间距相同（两端对齐）) || space-around(让每个Flex项目具有相同的空间,即让每个flex项目的左右有一个相同的margin值)

5. align-items(类似text-align属性)(只对交叉轴有效): flex-start(让flex项目从交叉轴默认开始的方向对齐) || flex-end(让flex项目从交叉轴默认结束的方向对齐)(默认值) || center(延交叉轴居中对齐) || stretch(让所有的flex项目与flex容器等高 or 等宽根据主轴的方向来，如果是row方向则等高，column方向则等宽)(默认值) || baseline(延基线对齐)

6. align-content(与align-items类似只是少了baseline属性值，也是设置flex项目的对齐方式): flex-start(让多行flex项目从交叉轴默认开始的方向对齐) || flex-end(让多行flex项目从交叉轴默认结束的方向对齐)(默认值) || center(延交叉轴居中对齐) || stretch(延交叉轴的方向拉伸flex的项目，让flex项目占满flex容器一个合适的高度or宽度)(默认值)
        	
### flex-item项目属性

1. order(定义flex项目在主轴方向的排列顺序):number(所有的flex项目order默认值为0，值越大排列越靠后，值越小排列越靠前，允许正负值)；

2. flex-grow(控制Flex项目在容器有多余的空间如何放大（扩展）): 0(默认值为0) or 正值，0表示Flex项目不会增长，填充Flex容器可用空间，正值表示flex项目会随着flex容器变大

3. flex-shrink(控制Flex项目在没有额外空间如何缩小): 0 or正值(默认值为1)，0表示Flex项目不会变小，填充Flex容器可用空间，正值表示flex项目会随着flex容器缩小

4. flex-basis(指定Flex项目的初始大小):% || em || rem || px (默认值为auto);注意的是flex-basis: 0px不能写成flex-basis:0;

5. flex(简写属性): flex-grow flex-shrink flex-basis; flex: 0 1 auto;(默认属性值)

7. align-self(改变flex项目沿着侧轴的位置，而不影响相邻的弹性项目)：auto(继承父元素的align-items的值) || flex-start || flex-end || center || baseline || stretch(默认值)；当不想局限于flex容器align-items对齐方式时就可以使用align-self属性来自动设置
        		
绝对flex项目与相对flex项目:一个相对Flex项目内的间距是根据它的内容大小来计算的。而在绝对Flex项目中，只根据 flex 属性来计算，而不是内容; flex: auto; or flex: 1 1 auto;的flex项目为相对flex项目； flex：1; or flex: 1 1 0;的项目为绝对flex项目

### 应用

1. flex固定头部or底部
```
html,body {
	height: 100%;
	width: 100%;
	margin: 0;
	padding: 0;
}
.app {
	display: flex;
	height: 100%;
	flex-direction: column;
}
.header {
	flex: 0 0 50px;
	background: red;
}
.main {
	flex: 1;
	background-color: blue;
	overflow: auto;
}
.content {
	height: 100vh;
}

<div class="app">
	<div class="header">header</div>
	<div class="main">
		<div class="content">
			content
		</div>
	</div>
</div>
```

### 移动端兼容性
![image](https://user-images.githubusercontent.com/20950813/36831579-3c5ba44a-1d63-11e8-86b0-b52703daaea4.png)

参考链接：https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout/Using_CSS_flexible_boxes
