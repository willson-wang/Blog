---
  title: 函数防抖
  date: 2018-03-01T08:41:30Z
  lastmod: 2018-03-01T08:41:30Z
  summary: 
  tags: ["原生JS", "防抖"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

函数防抖应用于频繁触发的事件，防止浏览器崩溃，常见的应用事件有window对象的resize事件，scroll事件，还有就是mousedown，mousemove，keyup，keydown等事件

```
<div class="box"></div>

var box = document.getElementsByClassName("box")[0];
var WAIT_TIME = 500;

//第一种方式  就是当move事件停止之后500ms触发
var debounce1 = function (func, time){
	var timeout;
	return function (){
		var _this = this,
			args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(function (){
			func.apply(_this, args);
		},time);
	}
}

var getUserAction = function (){
	console.log(this);
	console.log(arguments);
}

//			box.onmousemove = debounce1(getUserAction, WAIT_TIME);

//第二种方式、当move事件开始的时候就触发，然后等到move事件停止后在执行一次
var debounce2 = function (func, time, immediate){
	var timeout;
	return function (){
		var _this = this,
			args = arguments;
		if(timeout) clearTimeout(timeout);
	
		if(immediate){
			var callNow = !timeout;
			timeout = setTimeout(function (){
				timeout = null;
				func.apply(_this, args); //move停止之后执行
			},time);
			if(callNow) func.apply(_this, args); //第一次执行
		}else {
			timeout = setTimeout(function (){
				func.apply(_this, args);
			},time);
		}
		
	}
}

box.onmousemove = debounce2(getUserAction, WAIT_TIME, true);
```
