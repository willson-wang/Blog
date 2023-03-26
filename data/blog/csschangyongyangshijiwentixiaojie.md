---
  title: css常用样式及问题小结
  date: 2018-02-28T06:24:31Z
  lastmod: 2018-03-01T06:45:57Z
  summary: 
  tags: ["CSS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

1. **display: none;与visibility: hidden;的区别**
    1. 联系：它们都能让元素不可见

    2. 区别：
        1. display:none;会让元素完全从渲染树中消失，渲染的时候不占据任何空间；visibility: hidden;不会让元素从渲染树消失，渲染师元素继续占据空间，只是内容不可见
        2. display: none;是非继承属性，子孙节点消失由于元素从渲染树消失造成，通过修改子孙节点属性无法显示；visibility: hidden;是继承属性，子孙节点消失由于继承了hidden，通过设置visibility: visible;可以让子孙节点显式
        3. 修改常规流中元素的display通常会造成文档重排。修改visibility属性只会造成本元素的重绘。
        4. 读屏器不会读取display: none;元素内容；会读取visibility: hidden;元素内容

2. **specified value,computed value,used value计算方法**
    1. specified value: 计算方法如下：
        1. 如果样式表设置了一个值，使用这个值
        2. 如果没有设置值，这个属性是继承属性，从父元素继承
        3. 如果没设置，并且不是继承属性，使用css规范指定的初始值
        4. computed value: 以specified value根据规范定义的行为进行计算，通常将相对值计算为绝对值，例如em根据font-size进行计算。一些使用百分数并且需要布局来决定最终值的属性，如width，margin。百分数就直接作为computed value。line-height的无单位值也直接作为computed value。这些值将在计算used value时得到绝对值。computed value的主要作用是用于继承
        5. used value：属性计算后的最终值，对于大多数属性可以通过window.getComputedStyle获得，尺寸值单位为像素。以下属性依赖于布局，
```
background-position
bottom, left, right, top
height, width
margin-bottom, margin-left, margin-right, margin-top
min-height, min-width
padding-bottom, padding-left, padding-right, padding-top
text-indent
```

3. **link与@import的区别**
    1. link是HTML方式， @import是CSS方式
    2. link最大限度支持并行下载，@import过多嵌套导致串行下载，出现FOUC
    3. link可以通过rel="alternate stylesheet"指定候选样式
    4. 浏览器对link支持早于@import，可以使用@import对老浏览器隐藏样式
    5. @import必须在样式规则之前，可以在css文件中引用其他文件
总体来说：link优于@import

4. **PNG,GIF,JPG的区别及如何选**
    1. GIF:
         1. 8位像素，256色
         2. 无损压缩
         3. 支持简单动画
         4. 支持boolean透明
         5. 适合简单动画

    2. JPEG：
         1. 颜色限于256
         2. 有损压缩
         3. 可控制压缩质量
         4. 不支持透明
         5. 适合照片

    3. PNG：
         1. 有PNG8和truecolor PNG
         2. PNG8类似GIF颜色上限为256，文件小，支持alpha透明度，无动画
         3. 适合图标、背景、按钮

5. **CSS有哪些继承属性**
```
关于文字排版的属性如：
font
word-break
letter-spacing
text-align
text-rendering
word-spacing
white-space
text-indent
text-transform
text-shadow
line-height
color
visibility
cursor
```

6. **什么是FOUC?如何避免**
Flash Of Unstyled Content：用户定义样式表加载之前浏览器使用默认样式显示文档，用户样式加载渲染之后再从新显示文档，造成页面闪烁。解决方法：把样式表放到文档的head

7. **stacking context,布局规则**
    1. z轴上的默认层叠顺序如下（从下到上）：
         1. 根元素的边界和背景
         2. 常规流中的元素按照html中顺序
         3. 浮动块
         4. positioned元素按照html中出现顺序

    2. 如何创建stacking context：
         1. 根元素
         2. z-index不为auto的定位元素
         3. a flex item with a z-index value other than 'auto'
         4. opacity小于1的元素
         5. 在移动端webkit和chrome22+，z-index为auto，position: fixed也将创建新的stacking context

8. **什么是BFC，BFC有什么用？**

    1. BFC是block formatting context，也就是块级格式化上下文，是用于布局块级盒子的一块渲染区域，及一种块级盒子的布局方式，至于有什么用，是因为我们常说的文档流其实分为定位流、浮动流和普通流三种。而普通流其实就是指BFC中的FC。FC是formatting context的首字母缩写，直译过来是格式化上下文，它是页面中的一块渲染区域，有一套渲染规则，决定了其子元素如何布局，以及和其他元素之间的关系和作用，而BFC则是FC的一种扩展方式，可以给我们布局的时候提供一些便利 

    2. 换个方式也就是说，变成了BFC的块级盒子，具有了一个普通盒子不具有的功能，它成了一个独立的隔离的容器，外面的元素无法影响到BFC盒子内的元素，BFC盒子内的元素也无法影响到外面的元素，如包含浮动的元素，清除浮动等

    3. 触发BFC的方式
         1. html元素（默认BFC）
         2. float属性值不为none的元素
         3. postion属性值为absolute与fixed的元素
         4. overflow属性值不为visible的元素
         5. display的值为inline-block、table-cell、table-caption

    4. 主要作用
         1. 可以阻止元素被浮动元素覆盖
         2. 包含浮动元素，避免高度塌陷
         3. 阻止margin会发生重叠，注意的是属于同一个BFC的两个相邻块级子元素的上下margin会发生重叠，所以当两个相邻块级子元素分属于不同的BFC时可以阻止margin重叠

```
// 阻止元素被浮动元素覆盖
.normal {
	overflow: auto; // 设置触发BFC的属性
	height: 100px;
	background-color: pink;
}
.float {
	float: left;
	width: 100px;
	height: 50px;
	background-color: red;
}

<div class="box">
	<div class="float">float</div>
	<div class="normal"></div>
</div>

// 包含浮动元素，避免高度塌陷
.wrap {
	overflow: auto; // 设置触发BFC的属性
	background-color: green;
}
.content {
	float: left;
	width: 200px;
	height: 100px;
	background-color: blue;
}

<div class="wrap">
	<div class="content">content</div>
</div>

// 阻止margin会发生重叠
.box1,.box2-child {
	height: 100px;
	background-color: #ccc;
	margin: 20px 0;
}
.box2-child {
	background-color: #0099FF;
}
.box2 {
	overflow: auto;
}
<div class="main">
	<div class="box1">box1</div>
	<div class="box2">
		<div class="box2-child">box2</div>
	</div>
</div>
```

9. **行内元素float:left后orposition：absolute/fiex后是否变为块级元素？**
浮动后or定位后，行内元素会成为类块状元素（即具有块级元素的特征），可以设置宽高与margin，但是需要注意的是由于浮动与position是脱离了文档流，所以变成块元素的宽度不会是独占一行，而是其内容的宽度or自设的宽度来决定。同理块级元素浮动即定位之后的宽度也一样由内容宽度决定or自设宽度决定；

10. **::before 和 :after中双冒号和单冒号 有什么区别？**
单冒号(:)用于CSS3伪类，双冒号(::)用于CSS3伪元素
用于区分伪类和伪元素
伪类表状态
伪元素是真的有元素

11. **设置元素水平成功垂直居中的方式有哪些**

```
// 第一种  position: absolute + transform 实现垂直居中，宽高自适应，兼容ie9+ （优先使用此方式）
.box {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	background-color: pink;
}
<div class="box">position: absolute + transform</div>

// 第二种 position： absolute，top+left+top+bottom等0实现水平垂直居中，需要设置具体宽高，兼容ie6+（其次使用此方式）
.box1 {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	margin: auto;
	width: 50%;
	height: 50px;
	background-color: pink;
}
<div class="box1">position： absolute，top+left+top+bottom</div>

// 第三种 flex实现 
// 父元素
.wrap3 {
	width: 100%;
	height: 200px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	background-color: blue;
	margin-top: 10px;
}

// 居中子元素
.box3 {
	width: 10%;
	flex: 0 0 50px;
	background-color: pink;
	align-self: center;
}
<div class="wrap3">
	<div class="box3">flex布局</div>
</div>

// 第四种 table-cell实现
.wrap4 {
	display: table;
	width: 100%;
	height: 200px;
	
	margin-top: 10px;
}
.box4 {
	display: table-cell;
	
	background-color: blue;
	vertical-align: middle;
	text-align: center; 
}
.content {
	width: 50%;
	height: 50px;
	margin: auto;
	background-color: pink;
}

<div class="wrap4">
	<div class="box4">
		<div class="content">display:table-cell</div>
	</div>
</div>
```

12. **实现左侧定宽右侧自适应的方法有哪些，各有什么优缺点**

```
// 第一种方式，定宽的元素float脱离文档流，右侧元素给对应宽度的margin-left（优先推荐使用该方法）
.wrap {
	width: 100%;
	height: 200px;
	margin-top: 10px;
	background-color: blue;
}
.left {
	float: left;
	width: 200px;
	background-color: pink;
}
.right {
	margin-left: 200px;
	height: 200px;
	background-color: gray;
}
<div class="wrap">
	<div class="left">left，左侧浮动，脱离文档流，右侧设置一个margin-left</div>
	<div class="right">right</div>
</div>

// 第二种方式左右两侧都浮动，左侧设置固定宽度，及一个固定宽度的margin-right负值，右侧设置宽度100%，然后在右侧div内设一个子元素，给子元素设置一个margin-left
.left1 {
        float: left;
        margin-right: -200px;
        width: 200px;
        background-color: pink;
}
.right1 {
	float: left;  
	width: 100%; 
}
<div class="wrap">
	<div class="left1">left</div>
	<div class="right1">
		<div class="content">right</div>
	</div>
</div>

// 第三种方式 flex，这种方法需要注意兼容性，ie10+,移动端可以用
.wrap1 {
	display: flex;
	width: 100%;
	height: 200px;
	margin-top: 10px;
	background-color: blue;
}
.left2 {
	flex: 0 0 200px;
	background-color: pink;
}
.right2 {
	flex: 1;
	background-color: gray;
}

<div class="wrap1">
	<div class="left2">left,这种方法需要注意兼容性，ie10+,移动端可以用</div>
	<div class="right2">right</div>
</div>
```

13. **选择器的权重，除去行内样式，及!important，其它的权重如下所示**
    1. ID选择器（例如, #example） 0100简单理解为100
    2. 类选择器（class selectors） (例如,.example)，属性选择器（attributes selectors）（例如, [type="radio"]），伪类（pseudo-classes）（例如, :hover,:first-of-type,:nth-child(),:not()）0010简单理解为10
    3. 类型选择器（type selectors）（例如, h1）和 伪元素（pseudo-elements）（例如, ::before） 简单理解为1
    4. 通用选择器（universal selector）(*), 组合子（combinators） (+, >, ~, ' ')  简单理解为0
    5. 伪元素如::after，::before，伪类如:active，:nth-child():hover:first-of-type等
    6. 这里计算权重的时候需要注意三点
        1.权重计算都是按选择器的个数来算，不管连多长，如.box:nth-of-type(1):nth-last-of-type(1) 权重就是30
        2. 注意:not伪类，:not伪类自身时没有权重的，它的权重是计算:not(select)这个select的权重，如.box:not(#list) 权重就是110 .box:not(.list)权重就是20
        3. 权重一样的时候按书写位置进行覆盖

14. **注意nth-child与nth-of-type选择器之间的区别**
    1. :nth-child(an+b) 这个 CSS 伪类匹配文档树中在其之前具有 an+b-1 个兄弟节点的元素，其中 n 为正值或零值。简单点说就是，这个选择器匹配那些在同系列兄弟节点中的位置与模式 an+b 匹配的元素；如果包含字母n则，n由0开始一直计算
    2. :nth-of-type(an+b) 这个 CSS 伪类 匹配那些在它之前有 an+b-1 个相同类型兄弟节点的元素，其中 n 为正值或零值；如果包含字母n则，n由0开始一直计算
    3. 二者的区别是:nth-child是所以的兄弟元素为数量，而:nth-of-type是同一类的所有兄弟元素为数量都是从1开始；当使用的兄弟元素都是同一类时，二者选择的元素都是一致的；
```
tr:nth-child(2n+1) === tr:nth-child(odd)选择奇数行；
tr:nth-child(2n) === tr:nth-child(even)选择偶数行；
span:nth-child(0n+1) === span:nth-child(1) === first-child匹配第一个元素；
span:nth-child(-n+3)匹配前三个元素
```

