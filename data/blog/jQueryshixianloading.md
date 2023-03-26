---
  title: jQuery实现loading
  date: 2018-03-01T08:21:18Z
  lastmod: 2019-07-06T13:45:53Z
  summary: 
  tags: ["jQuery"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

```
//页面的加载完毕可以使用onreadystatechange事件来进行dom结构的加载，通过readyState的状态值来进行判断，dom事件加载完毕，complate加载完成
//interactive（交互）也就是正在加载的意思
var complateLoading = function (){
	if(document.readyState == "complete"){
		var oMask = document.getElementById("mask");
			oMask.style.display = "none";
	}
}

var ajaxRequest = function (){  //这是第一种方式  就是利用beforesend方法（ajax请求前）来显示loading，success，error方法完成之后再none 掉loading
	var oMask = document.getElementById("mask");
	$.ajax({
		type:"get",
		url:"http://127.0.0.1:8020/小结文档/json/nes.json",
		data: "",
		beforeSend: function (){
				oMask.style.display = "block";
		},
		success: function (data){
			console.log(data);
			oMask.style.display = "none";
		},
		error: function (data){
			console.log(data);
			oMask.style.display = "none";
		}
	});
}

var ajaxRequestAll = function (){
	$.ajax({
		type:"get",
		url:"http://127.0.0.1:8020/小结文档/json/new.json",
		data: "",
		success: function (data){
			console.log(data);
		},
		error: function (data){
			console.log(data);
		}
	});
}

$.ajaxSetup({  //第二个思路就是利用ajaxSetup来进行全局配置loading
	beforeSend: function (){ //请求之前的操作
		console.log("beforeSend");
		var oMask = document.getElementById("mask");
			oMask.style.display = "block";
	},
	complete: function (){  //不论请求成功还是失败
		console.log("complete");
		var oMask = document.getElementById("mask");
			oMask.style.display = "none";
	}
});

document.onreadystatechange = complateLoading;
```

