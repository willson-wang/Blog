---
  title: 深拷贝与浅拷贝
  date: 2018-03-01T09:00:55Z
  lastmod: 2018-03-01T09:01:46Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 简介
要了解深浅拷贝，首先要了解js里面的数据类型，js里面共有两种数据类型，第一类5种基本类型，第二类1种引用类型，二者的主要区别如下
1. 包含成员基本类型，包括number,string,boolean,undefined,null,引用类型包括obj
2. 存放位置，基本类型存放于栈区域，引用类型指针存放于栈区域，内容存放于堆区域
3. 值得可变性，基本类型的值不可变(注意与重新赋值的区别)，引用类型的值是可变的；
4. 比较，基本类型的比较是值得比较(即值相等就可以判断这两个变量相等，建议使用严格等，避免变量进行隐试转换)，引用类型的比较是引用的比较(即指针的比较)，引用相等即引用的时同一个引用类型的数据
5. 拷贝，基本数据类型的拷贝即是重新复制给另一个变量，两个变量互不影响，引用类型的拷贝分为三类，第一类引用类型赋值，即指针的赋值，二者指向同一个引用类型，当其中一个改变时，另一个也会跟着改变，第二类浅拷贝，只拷贝一层，没有对对象中的子对象也进行拷贝，两个对象中的基本类型的值改变，不会互相影响，但是引用类型改变时会互相影响，第三类深拷贝，对对象及对象中包含的子对象进行递归拷贝，拷贝完之后的两个对象不管是基本类型的值还是引用类型的值改变都互不影响；

传值与传址的区别，两者都是针对变量在赋值的时候而言的，传值指的时值得传递(即基本类型的赋值),传址指的是引用的赋值(及引用类型的赋值)

### 浅拷贝
```
var shallowCopy = function (src){
	var obj = {};
	for(var prop in src){
		if(src.hasOwnProperty(prop)){
			obj[prop] = src[prop]
		}
	}
	return obj
}
```

### 深拷贝
深拷贝核心思想就是递归去复制所有的引用类型，然后在复制的时候需要区分下数组与对象,可以复制函数
```
// 第一种方式
var deepCopy = function (source,target){
	var c = target || {};
	for(var prop in source){
		if(typeof source[prop] === "object"){
			if(source[prop].constructor === Array){
				c[prop] = [];
			}else if (source[prop].constructor === Object){
				c[prop] = {};
			}
			deepCopy(source[prop],c[prop]);
		}else {
			c[prop] = source[prop]
		}
	}
	return c
}

// 第二种方式
var deepCopy2 = function (obj) {
	return JSON.parse(JSON.stringify(obj));
}

// 第三种方式与第一种一样只是换个写法
var deepCopy3 = function(obj) {
    if (typeof obj !== 'object') return;
    var newObj = obj instanceof Array ? [] : {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            newObj[key] = typeof obj[key] === 'object' ? deepCopy3(obj[key]) : obj[key];
        }
    }
    return newObj;
}

```


