---
  title: 数组去重、数组去重并寻找最大项、数组排序
  date: 2018-03-01T09:16:22Z
  lastmod: 2018-03-01T09:16:32Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 简介
数组去重的方法很多，于是把平常自己用到的总结了一下

### indexOf 去重

```
var fn1 = function (arr){
	var arr1 = [];
	for(var i=0; i<arr.length; i++){
		if(arr1.indexOf(arr[i]) === -1){
			arr1.push(arr[i]);
		}
	}
	return arr1
}

```

### 创建空对象去重

```
var fn3 = function (arr){ 
	var arrObj = {},
		arr2 = [];
	for(var j=0; j<arr.length; j++){
                //区分1与'1'
		var typeEle = typeof arr[j] + arr[j];
		if(!arrObj[typeEle]){
			arrObj[typeEle] = 1;
			arr2.push(arr[j]);
		}
	}
	return arr2
}
```

### indexOf + forEach去重

数组的下标去重,原理就是当数组内当前元素的下标与自身的下标相等时，表示该数组里面只有一个当前元素，当下标不相等时，表示不只一个当前元素

```
var fn4 = function (arr){
	var ret = [];
	arr.forEach(function (item,index,ar){
		if(ar.indexOf(item) === index){
			ret.push(item);
		}
	})
	return ret;
}
```

### 排序去重

先排序后比较，当后一项不等于前一项时，就不是重复项
```
var fn6 = function (arr){ // 当数组内有字母时，去重不准确
	var ret = [];
	arr = arr.sort(function (x,y){
		return x-y
	})
	var end = arr[0];
	ret.push(end);
	for(var i=1; i<arr.length; i++){
		if(arr[i] !== end){
			ret.push(arr[i]);
			end = arr[i];
		}
	}
	return ret;
}
```

### filter方法去重

filter不会改变原数组，会返回一个新的过滤后的数组,filter方法是通过true与false来确定返回的数组中是否包含改元素，true包含，false不包含

```
var fn12 = function (arr){
	return arr.filter(function (item, index, array){
		return index === array.indexOf(item);
	})
}
```

### 去重并记录重复项最大的项

```
var fn7 = function (arr){
	  var max = 1,
		typeEle, 
		ret = [],
		retObj = {},
		maxItem = []; 
		
	for(var i=0; i<arr.length; i++){
		typeEle = typeof arr[i] + arr[i];
		if(!retObj[typeEle]){
			ret.push(arr[i]);
			retObj[typeEle] = 1;
		}else {
			retObj[typeEle]++;
		}
		
		if(retObj[typeEle] === max){
			maxItem.push(arr[i]);
		}else if (retObj[typeEle] > max){
			maxItem.length = 0;
			max = retObj[typeEle];
			maxItem.push(arr[i]);
		}
	}
	
	return {
		maxItem: maxItem, //重复项最多的项
		ret: ret, //去重后的数组
		max: max, //重复的最大次数
		retObj: retObj //无重复项的对象
	}
}
```

### sort排序

使用数组的sort方法排序，当有字母的时候不建议用
```
var fn8 = function (arr){
	arr.sort(function (x,y){
//		return x-y //小到大
		return y-x //大到小
	});
	return arr;
}
```

### 冒泡排序

```
var fn9 = function (arr){
	var temp;
	for(var i=0; i<arr.length-1; i++){
		for(var j=0; j<arr.length-1-i; j++){
			if(arr[j]>arr[j+1]){//从小到大
				temp = arr[j];
				arr[j] = arr[j+1];
				arr[j+1] = temp;
			}
		}
	}
	return arr;
}
```

### 比较排序

```
var fn10 = function (arr){
	var max,
		k;
	for(var i=0; i<arr.length-1; i++){
		max = arr[i];
		k = i;
		for(var j=i+1; j<arr.length; j++){
			if(arr[j]>max){
				max = arr[j];
				k = j;
			}
		}
		arr[k] = arr[i];
		arr[i] = max;
	}
	return arr;
}
```


