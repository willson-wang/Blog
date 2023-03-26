---
  title: 移动端抓包及调试
  date: 2018-05-05T09:59:53Z
  lastmod: 2020-03-04T08:02:12Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

移动端项目必不可少的问题就是怎么去调试线上项目，以最快最简便的方式去快速定位问题；

我总结下自己常用调试及定位问题的方法，通过加入控制台查看代码是否有无报错；通过charles等抓包工具进行断点、转发、代理到本地等方式进行调试线上bug；通过chrome webview的方式调试app or 微信内打开的h5页面等，下面主要记录前两种方式

<h3>加入控制台调试</h3>

方法一、代码内引入，以eruda为例

```
const erudaDebug = {
    hasInit: false,
    initDruda: (config = {}) => {
        if (!erudaDebug.hasInit) {
            require.ensure([], require => {
                eruda = require('./eruda')
                eruda.init(config)
                eruda.show()
                erudaDebug.hasInit = true
            })
        } else {
            erudaDebug.show()
        }
    },
    show: () => {
        eruda && eruda.show()
    },
    hide: () => {
        eruda && eruda.hide()
    }
}
```

方法二、通过cdn引入，以eruda为例

```
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/eruda@1.10.3/eruda.min.js"></script>
<script>
	eruda.init()
</script>
```

<h3>通过charles调试</h3>

如果不懂charles抓包，先查看这里[十分钟学会Charles抓包(iOS的http/https请求)](https://www.jianshu.com/p/5539599c7a25)

方法一、接口断点调试

比如我要在接口请求or返回时修改请求参数or修改返回参数

![image](https://user-images.githubusercontent.com/20950813/75856589-9d138f00-5e2f-11ea-96f5-b276b185989d.png)

方法二、接口转发调试

比如我要将本地的某个接口请求转发到测试环境or生产环境

![image](https://user-images.githubusercontent.com/20950813/75856482-6ccbf080-5e2f-11ea-8288-39ff3c65b88b.png)

方法三、文件本地代理调试

调试线上生产环境代码，将代码下载到本地，然后通过map local功能，进行本地修改调试

![image](https://user-images.githubusercontent.com/20950813/75856414-45752380-5e2f-11ea-9fbe-d3cf36754044.png)

方法四、线上环境rewrite到本地环境调试

比如直接将生产的站点重写到本地环境，接口保持请求不变

这里需要使用rewrite功能，rewrite的功能功能有，将某个站点重定向到新的地址、修改站点请求头、参数、返回头，返回参数等；这里以将站点重定向到本地开发环境为例

先补充一点replace方法的知识，以便理解rewrite使用正则来进行替换重定向

```
str.replace(regexp|substr, newSubStr|function) 我们只看第一个参数是正则表达式的场景
```

- str.replace(regexp, newSubStr) // newSubStr内可以使用$$	插入一个 "$"。$&	插入匹配的子串。$`	插入当前匹配的子串左边的内容。$'	插入当前匹配的子串右边的内容。$n,假如第一个参数是 RegExp对象，并且 n 是个小于100的非负整数，那么插入第 n 个括号匹配的字符串。提示：索引是从1开始

- str.replace(regexp, function) //  函数的返回值作为替换字符串。 (注意：上面提到的特殊替换参数在这里不能被使用。) 另外要注意的是，如果第一个参数是正则表达式，并且其为全局匹配模式，那么这个方法将被多次调用，每次匹配都会被调用。该函数的参数：match	匹配的子串。（对应于上述的$&。）p1,p2, ...	假如replace()方法的第一个参数是一个RegExp 对象，则代表第n个括号匹配的字符串。（对应于上述的$1，$2等。）例如，如果是用 /(\a+)(\b+)/ 这个来匹配，p1 就是匹配的 \a+，p2 就是匹配的 \b+。offset	匹配到的子字符串在原字符串中的偏移量。（比如，如果原字符串是 'abcd'，匹配到的子字符串是 'bc'，那么这个参数将会是 1; string	被匹配的原字符串。(精确的参数个数依赖于 replace() 的第一个参数是否是一个正则表达式（RegExp）对象，以及这个正则表达式中指定了多少个括号子串，如果这个正则表达式里使用了命名捕获， 还会添加一个命名捕获的对象

看几个具体的例子

```
const str = 'abc12345#$*%';
const reg1 = /([^\d]*)(\d*)([^\w]*)/;

const replaceFn1 = (match, p1, p2, p3, offset, string) => {
    return `${p1}-${p2}-${p3}`
}

const newStr1 = str.replace(reg1, "$1-$2-$3") // abc-12345-#$*%
const newStr2 = str.replace(reg1, replaceFn1) // abc-12345-#$*%
```

```
var reg3 = /(\w+)\s(\w+)/;
var str1 = "John Smith";
var newstr5 = str1.replace(reg3, "$2, $1"); // Smith, John
```

```
const reg4 = /https:\/\/baidu.com.cn\/(?!api\/index\.php)(.*)/

const str2 = 'https://baidu.com.cn/page/customer_management/customer_management.shtml?fromApp=5003&token=cdkqqf1407307954'
const str3 = 'https://baidu.com.cn/api/index.php?r=common/my-applicationto-project/get-applicationto-project&token=cdkqqf1407307954'

console.log('replace', str2.replace(reg4, 'http://127.0.0.1:8006/$1'))
```

```
const reg5 = /https:\/\/baidu.com.cn\/(?!(api|Broker|broker)\/.*)(.*)/

const str4 = 'https://baidu.com.cn/api/broker/broker/get-broker-info?token=eurkya1565078719'
const str5 = 'https://baidu.com.cn/front_static/index?style=red&token=eurkya1565078719'
const str6 = 'https://baidu.com.cn/api/index.php?r=broker/index/get-building-list&token=eurkya1565078719&pageIndex=1'
const str7 = 'https://baidu.com.cn/Broker/UserCenter/index?token=eurkya1565078719&style=red'
const fn1 = function (match, p1, p2, offset, string) {
    return `http://127.0.0.1:9001/${p2}`
}

console.log('replace', str4.replace(reg5, 'http://127.0.0.1:9001/$2'))
console.log('replace', str5.replace(reg5, 'http://127.0.0.1:9001/$2'))
console.log('replace', str6.replace(reg5, 'http://127.0.0.1:9001/$2'))
console.log('replace', str7.replace(reg5, 'http://127.0.0.1:9001/$2'))
console.log('replace', str5.replace(reg5, fn1))
```

1、进入rewrite界面

![image](https://user-images.githubusercontent.com/20950813/75855237-c7b01880-5e2c-11ea-8836-fa0f9e55bfe5.png)

2、选择类型URL
![image](https://user-images.githubusercontent.com/20950813/75855291-e9110480-5e2c-11ea-93cf-ab466da72023.png)

3、添加需要转发的规则
![image](https://user-images.githubusercontent.com/20950813/75855334-fd550180-5e2c-11ea-8496-33079becd7a0.png)

 参考链接：

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/replace
https://tool.oschina.net/uploads/apidocs/jquery/regexp.html
https://github.com/liriliri/eruda


