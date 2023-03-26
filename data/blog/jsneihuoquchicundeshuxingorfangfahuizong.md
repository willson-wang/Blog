---
  title: js内获取尺寸的属性or方法汇总
  date: 2018-01-05T12:41:55Z
  lastmod: 2018-01-29T09:37:21Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

最近在项目中开发自定义滚动条组件，用到了拖拽及滚动，而用到拖拽及滚动的时候就不得不用到一些获取元素尺寸、滚动高度、鼠标位置、元素距离视口的位置等属性，于是写完组件之后抽了个时间总结了下，希望加深理解

![image](https://user-images.githubusercontent.com/20950813/34636413-9be914f4-f2db-11e7-8bcb-c7c6a5d84511.png)


## 标准盒模型
1. clientWidth = width + padding - scrollBarWidth; 因为滚动条会在border内也就是padding所占位置
2. offsetWidth = width + padding + border = clientWidth + border ，这里不需要另外加上scrollBarWidth的原因就是scrollBarWidth占用的宽度就是元素自身的width or padding
3. scrollWidth元素可滚动宽度,不包含元素的margin与border，scrollLeft = ( srollWidth - clientWidth )之间的值
同理clientHeight offsetHeight scrollHeight是一样的
4. scrollTop 属性可以获取或设置一个元素的内容垂直滚动的像素数。 注意是这个元素的顶部到它的最顶部可见内容（的顶部）的距离的度量，而不是到视口的高度

## box-size: border-box;盒模型 width包含了padding与border
1. offsetWidth = width;
2. clientWidth = width - border - scrollBarWidth = offsetWidth - border - scrollBarWidth 

同理其它属性值是一样的

## getBoudingClientRect()获取到的盒模型 兼容ie9+
1. .width = offsetWidth;  
2. .height = offsetHeight; 
3. .left = 元素左边框到视口的左侧距离; 
4. .top = 元素上边框到视口的上侧距离;
5. .right = .left + .width; 
6. .bottom = .top + .height

## 事件对象event获取的位置属性
1. offsetX offsetY 相对于target元素边框的位置
2. pageX pageY 相对于当前页面(整个文档)的左上角的位置  当有滚动条时包含了scrollTop and scrollLeft
3. clientX clientY 相当于当前可视屏幕的左上角位置

## offset定位系列位置属性
1. offsetLeft: 获取当前元素左侧边框到offsetParent的左侧边框内侧距离
2. offsetTop: 获取当前元素上侧边框到offsetParent的上侧边框内侧距离
3. offsetParent: 指向最近的包含改元素的定位元素，如果没有定位元素则为最近的table or table cell or 根元素（标准模式下为 html；quirks 模式下为 body），当元素设置为dispaly:none 时 offsetParent为null

## 常用的一些场景
1. 判断元素是否出现滚动条
根据scorllHeight、scrollWidth与clientHeight、clientWidth的大小关系来进行判断，因为二者获取到的宽高是相同的部分，所有没有滚条条时scrollHeight = clientHeight; scrollWidth = clientWidth;
判断水平方向滚动条 scrollWidth > clinetWidth 允许滚动的水平范围scrollLeft => scrollWidth - clientWidth
判断垂直方向滚条条 scrollHeight > clientHeight 允许滚动的垂直范围scrollTop => scrollHeight - clientHeight

2. 拖拽
在mousedown的时候获取鼠标点击的当前位置
在当前屏幕内拖拽
disX = e.clientX - e.target.offsetLeft 或者直接写e.offsetX;  
disY = e.clientY - e.target.offsetTop 或者直接写e.offsetY;
在整个文档内拖拽
disX = e.pageX - e.offsetX;  
disY = e.pageY - e.offsetY;
在mousemove的时候
left = e.clinetX - disX;
top = e.clinetY - disY;

3. 获取当前屏幕的尺寸
screenWidth = document.documentElement.clientWidth || document.body.clientWidth;
screenHeight = document.documentElement.clientHeight || document.body.clientHeight;

4. 监听window对象上的scroll事件时获取浏览器滚动条的scrollTop
scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

5. 获取浏览器滚动条的宽度
第一种思路设置元素overflow为scroll，计算设置scroll之前的clientWidth与之后的clientWidth，之差就是滚动条的宽度，原因是clientWidth是不包含滚动条宽度的，且有滚动条之后滚动条会占据clientWidth的宽度；
```
                function getScrollBar () {
			  var div = document.createElement('div'),
			        noScrollWidth,
				scrollWidth;
				div.style.width = '200px';
				div.style.height = '300px';
				div.style.position = 'absolute';
				div.style.left = '99999px';
				noScrollWidth = document.body.appendChild(div).clientWidth;
				div.style.overflowY = 'scroll';
				scrollWidth = div.clientWidth;
				document.body.removeChild(div);
				return noScrollWidth - scrollWidth;
		}
```

第二个思路直接设置overflow:scroll，然后使用offsetWidth - clientWidth之差来获取滚动条的宽度，因为offsetWidth是包含滚动条的，而clinetWidth是不包含滚动条宽度的
```
                     function getScrollBar () {
				var div = document.createElement('div'),
					clientWidth,
					offsetWidth;
				div.style.width = '200px';
				div.style.height = '300px';
				div.style.overflowY = 'scroll'
				div.style.position = 'absolute';
				div.style.left = '99999';
				clientWidth = document.body.appendChild(div).clientWidth;
				offsetWidth = div.offsetWidth;
				return offsetWidth - clientWidth;
			}
```

