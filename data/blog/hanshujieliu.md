---
  title: 函数节流
  date: 2018-03-01T08:44:29Z
  lastmod: 2018-03-01T08:44:35Z
  summary: 
  tags: ["原生JS", "节流"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

关于节流的实现，有两种主流的实现方式，一种是使用时间戳，一种是设置定时器，第一种事件会立刻执行，第二种事件会在 n 秒后第一次执行，第一种事件停止触发后没有办法再执行事件，第二种事件停止触发后依然会再执行一次事件

```
<div class="box"></div>

var box = document.getElementsByClassName("box")[0];
var WAIT_TIME = 500;

var throttle1 = function (func, time){
	var previous = 0,
		_this,
		args;
	return function (){
		var now = +new Date(); //使用时间搓
		_this = this;
		args = arguments;
		
		if(now - previous > time){
			func.apply(_this, args);
			previous = now;
		}
	}
}

var throttle2 = function (func, time){
	var _this,
		timeout,
		args;
	return function (){
		_this = this;
		args = arguments;
		if(!timeout){
			timeout = setTimeout(function (){
				func.apply(_this, args);
				timeout = null;
			}, time);
		}
		
	}
}

var throttle3 = function (func, time){//时间戳与定时器的结合
	var previous = 0,
		_this,
		timeout,
		args; 
		
	var later = function (){
		previous = +new Date();
		timeout = null;
		func.apply(_this, args);
	}
	
	return function (){
		var now = +new Date();	
		var remaining = time - (now - previous); //下次执行func剩余的时间
		
		_this = this;
		args = arguments;
		
		if(remaining < 0 || remaining > time){
			if(timeout){
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			func.apply(_this, args);
		}else if(!timeout) {
			timeout = setTimeout(later, remaining);
		}
	}
	
}

var throttle4 = function (func, time, options){//时间戳与定时器的结合
	var previous = 0,
		_this,
		timeout,
		args; 
		
	if (!options) options = {};
		
	var later = function (){
		previous = options.leading === false ? 0 : new Date().getTime();
		timeout = null;
		func.apply(_this, args);
		if (!timeout) _this = args = null;
	}
	
	return function (){
		var now = +new Date();	
		if(!previous && options.leading === false) previous = now;
		var remaining = time - (now - previous); //下次执行func剩余的时间
		
		_this = this;
		args = arguments;
		
		if(remaining < 0 || remaining > time){
			if(timeout){
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			func.apply(_this, args);
			if (!timeout) _this = args = null;
		}else if(!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining);
		}
	}
	
}

var getUserAction = function (){
	console.log(this);
	console.log(arguments);
}

// box.onmousemove = throttle1(getUserAction, 1000);
// box.onmousemove = throttle2(getUserAction, 1000);
// box.onmousemove = throttle3(getUserAction, 1000);
// box.onmousemove = throttle4(getUserAction, 1000,{
// leading：false 表示禁用第一次执行  trailing: false 表示禁用停止触发的回调
// });

box.onmousemove = throttle4(getUserAction, 1000,{
	trailing: false
});
```

