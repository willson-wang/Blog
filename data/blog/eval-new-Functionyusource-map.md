---
  title: new Function source-map
  date: 2022-07-09T08:12:56Z
  lastmod: 2022-07-09T08:14:13Z
  summary: 
  tags: ["原生JS","浏览器", "eval", "new Function", "source-map"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/js3.png']
  bibliography: references-data.bib
---

<a name="xT1Vj"></a>
## 目录
- 动态执行js字符串方式
- source map
- 错误监听
- 总结
<a name="JfOvx"></a>
## 动态执行js字符串方式
动态执行js字符串的能力，有利于我们去做一些热更新，劫持子应用js并渲染子应用js等，常用的动态执行js字符串有三种方式

- 内联script
- eval
- new Function

<a name="LZTDQ"></a>
### 内联script
比如通过fetch or ajax获取到可执行的js字符串之后，通过创建一个script标签，然后将内容设置到script标签，最后在append到dom中，即可达到动态执行字符串的目的，伪代码如下所示
```javascript
const code = await fetch('xxxx')

const scriptEle = document.createElement('script');
scriptEle.textContent = code
document.bbody.appendChild(scriptEle)
```

注意这种执行方式，js的作用域是全局作用域
<a name="Bv8Xs"></a>
### eval
比如通过fetch or ajax获取到可执行的js字符串之后，通过eval来执行可以执行的js字符串，即可达到动态执行字符串的目的，伪代码如下
```javascript
const code = await fetch('xxxx')

eval(code);
```

注意点: eval执行的作用域为当前作用域，而间接执行的eval作用域为全局作用域
```javascript
var x = 1;
function fn() {
  var x = 2;
  eval('alert(x)'); // alert 2  当前作用域
  (0, eval)('alert(x)') // alert 1 全局作用域
}
```

所以我们需要根据场景来决定怎么使用eval
<a name="c60Uu"></a>
### new Function
比如通过fetch or ajax获取到可执行的js字符串之后，通过new Function()()来执行可以执行的js字符串，即可达到动态执行字符串的目的，伪代码如下
```javascript
const code = await fetch('xxxx')

new Function(code)();
```

注意点：new Function()的作用域是全局作用域，不存在当前作用域的情况；所以推荐使用new Function来替换eval的原因就是，eval如果是直接调用的场景，那么js引擎在执行eval内代码的时候需要判断变量是当前最用域内的变量还是全局变量，所以相对new Function 只有全局作用域会慢；
<a name="EuKyL"></a>
## soure map
为什么需要source map?
便于调试压缩后的代码及还原压缩后代码真实的源码报错信息

source map会不会影响性能？
不会，只有开启了浏览器的devtool的时候浏览器才会去根据js文件内是否有souceMapUrl的标识去加载对应的source map文件

source map有没有标准？
有，目前的版本是3，标准包含了source map应该包含的信息，及怎么去设置source map，具体内容请查看[sourcemaps spec](https://sourcemaps.info/spec.html)

webpack为什么有那么多种source-map格式?
因为webpack基于安全、大小（性能）生成了不同方式的source map，但是本质上包含的内容都是标准规定的内容，只是做了部分增减

<a name="EZNKh"></a>
### webpack source map
webpack生成的source map虽然有很多类型，但是归根结底就是几个场景的组合，具体场景如下所示

- eval:  使用eval包裹模块，通过sourceURL来设置eval模块的名称，不会生成source map文件，即无法还原源代码
- cheap：生成source map，不包含列信息、loader的souce map
- source-map: 生产完整的source map文件
- module：生成source map，不包含列信息，包含loader的source map
- inline: 生成内联的source map
- nosources: 生成source map，不含源码，仅包含行列信息
- hidden: 仅生成source map, 不主动添加sourceMapUrl

具体组合规则如下所示
[inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map

下面以如下源码为例
```javascript
document.write(`broker`)
```
<a name="RYNGf"></a>
#### source-map
```javascript
document.write("broker");
//# sourceMappingURL=broker.0af4c32c350c702937dc.js.map
```

<a name="baQam"></a>
#### eval
```javascript
eval('document.write("broker");\n\n//# sourceURL=webpack://webpack5/./src/broker.js?')
```
<a name="waFIl"></a>
#### ![image.png](/static/images/yuque/1657264072166-d660ae4f-787e-4e1c-9e22-8abdecb014a9.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=263&id=djVbP&margin=%5Bobject%20Object%5D&name=image.png&originHeight=526&originWidth=2206&originalType=binary&ratio=1&rotation=0&showTitle=false&size=176801&status=done&style=none&taskId=u58d27f6d-42ef-4e94-ae36-8c774c88d08&title=&width=1103)
**相对于source-map，eval 不生成source-map，仅添加sourceURL，用于提示错误文件来源**
<a name="FgZPH"></a>
#### inline-source-map
```javascript
document.write("broker");
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJva2VyLjBhZjRjMzJjMzUwYzcwMjkzN2RjLmpzIiwibWFwcGluZ3MiOiJBQUFBQSxTQUFTQyxNQUFUIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd2VicGFjazUvLi9zcmMvYnJva2VyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRvY3VtZW50LndyaXRlKGBicm9rZXJgKSJdLCJuYW1lcyI6WyJkb2N1bWVudCIsIndyaXRlIl0sInNvdXJjZVJvb3QiOiIifQ==
```
<a name="N6HkI"></a>
#### ![image.png](/static/images/yuque/1657263979755-c8b67cad-6a02-4f8d-8464-8c859e8fd8a3.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=354&id=u77056c88&margin=%5Bobject%20Object%5D&name=image.png&originHeight=708&originWidth=2210&originalType=binary&ratio=1&rotation=0&showTitle=false&size=246229&status=done&style=none&taskId=ue67abc1a-283e-43e1-900f-413456c6eb0&title=&width=1105)
**相对于source-map、inline-source-map将单独的source map文件，通过base64的方式添加到源文件内**
<a name="UnPUl"></a>
#### nosources-source-map
```javascript

// 少了sourcesContent包含源码的字段
{"version":3,"file":"broker.0af4c32c350c702937dc.js","mappings":"AAAAA,SAASC,MAAT","sources":["webpack://webpack5/./src/broker.js"],"names":["document","write"],"sourceRoot":""}
```
![image.png](/static/images/yuque/1657263905011-e12583b1-c7c1-4241-aa68-863669ee546f.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=374&id=u84a75e29&margin=%5Bobject%20Object%5D&name=image.png&originHeight=748&originWidth=2206&originalType=binary&ratio=1&rotation=0&showTitle=false&size=182580&status=done&style=none&taskId=ua9b7e2d7-8657-49b7-9cc8-6e97721a3d2&title=&width=1103)
**相对于source-map、nosources-source-map生成的map文件缺少了源代码，只能用于定位错误的文件及行列号，无法查看源码信息**
<a name="nmSth"></a>
#### hidden-source-map
```javascript
document.write("broker");
```

![image.png](/static/images/yuque/1657263749193-78ebd846-d168-4295-9060-faf19ae83da2.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=246&id=u0307ea44&margin=%5Bobject%20Object%5D&name=image.png&originHeight=492&originWidth=2194&originalType=binary&ratio=1&rotation=0&showTitle=false&size=111746&status=done&style=none&taskId=u20d69209-dda4-4db3-8b21-9ccddd67591&title=&width=1097)
**相对于source-map、hidden-source-map不在源码中添加顶级注释//# sourceMappingURL**
<a name="qWuTe"></a>
#### cheap-source-map

![image.png](/static/images/yuque/1657329608454-c866536d-9645-473b-964f-7c8c31a68596.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=224&id=uc91e017e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=448&originWidth=1892&originalType=binary&ratio=1&rotation=0&showTitle=false&size=145862&status=done&style=none&taskId=ue690d477-f5f7-4664-baf0-be58d26b0d0&title=&width=946)
![image.png](/static/images/yuque/1657265150252-b3d7148f-bc30-4d4c-b998-c33cdef729b7.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=242&id=ufc2cb8c1&margin=%5Bobject%20Object%5D&name=image.png&originHeight=484&originWidth=1080&originalType=binary&ratio=1&rotation=0&showTitle=false&size=86439&status=done&style=none&taskId=u17ef2991-c905-4e76-ba4f-476cf91994f&title=&width=540)
**source-map 完整的行列信息，点击错误信息的时候光标会直接定位到错误行列**

![image.png](/static/images/yuque/1657329453058-e05ccdee-9adb-4900-8a4a-e1424ed01e63.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=288&id=u0c22179e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=576&originWidth=2824&originalType=binary&ratio=1&rotation=0&showTitle=false&size=193786&status=done&style=none&taskId=u5c892d49-dea4-4ed6-b054-9d451cfa534&title=&width=1412)

![image.png](/static/images/yuque/1657329484617-2e376d0e-eb9a-4936-b3ea-58638fd92484.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=212&id=u7d8dfa41&margin=%5Bobject%20Object%5D&name=image.png&originHeight=424&originWidth=1178&originalType=binary&ratio=1&rotation=0&showTitle=false&size=88463&status=done&style=none&taskId=uf6d78ed1-a565-433b-a198-3ae134c34e7&title=&width=589)
**cheap-source-map 完整的行信息，点击错误信息的时候光标会直接定位到错误行**
**cheap-source-map	相对于source-map少了列信息，少了loader转化的source-map，也就是定位的文件是loader转化后的代码，而不是源文件**
<a name="NMsuw"></a>
#### cheap-module-source-map
![image.png](/static/images/yuque/1657330143864-fa97669a-0c6a-43c5-96f8-b7ba467cca2d.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=211&id=u8596e56f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=422&originWidth=1018&originalType=binary&ratio=1&rotation=0&showTitle=false&size=77770&status=done&style=none&taskId=ufe247ed8-49ee-43b5-8840-151fb7712f2&title=&width=509)

**cheap-module-source-map	相对于source-map少了列信息，定位的文件是源文件**

<a name="XOAbE"></a>
#### 注意点
**webpack mode production 开启压缩的场景下，devtoo仅支持source-map，inline-source-map，hidden-source-map 和 nosources-source-map，其它模式不会按照预期生成source map，具体可以查看**[**note-about-source-maps**](https://webpack.js.org/plugins/terser-webpack-plugin/#note-about-source-maps)

<a name="zCQW4"></a>
#### 总结
其实webpack的source map的生成，主要围绕的是安全、大小（也就是速度）两个维度来生成不同种类的source map
首先是最完整的source-map
然后从安全角度看

- nosources-source-map
- hidden-source-map

从大小（速度）角度看

- eval
- cheap
- cheap-module

所以只要理解了source map这么多种类的目的，那么我们就可以结合实际场景做出最适合当前项目的source map
<a name="WyKEc"></a>
## 内联script、eval、new Function错误定位
在微前端或者一些动态执行脚本的场景需要先fetch js代码，然后在通过内联script or eval or new Function的方式来执行js，这时候怎么去快速定位错误及记录错误来源是很重要与关键的能力，那么分别看下这三种场景下的错误应该怎么处理才是最佳

在看内联script、eval、new Function三种执行js代码报错之前，我们先看下通过script src脚本执行报错，有source map与无source map的场景是怎么样的
<a name="eoz54"></a>
### script src
<a name="u4gcC"></a>
#### 无source map
![image.png](/static/images/yuque/1657332616699-9fddc8ac-af16-44b4-93bf-d206de2a6b41.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=225&id=u7dd3f584&margin=%5Bobject%20Object%5D&name=image.png&originHeight=450&originWidth=1128&originalType=binary&ratio=1&rotation=0&showTitle=false&size=124700&status=done&style=none&taskId=u157c2322-1394-4033-a89a-1af5a2c583c&title=&width=564)

**可以看出js出错的文件名，不能直接映射到源文件**
<a name="jOQnB"></a>
#### 有source map
![image.png](/static/images/yuque/1657332816599-f702c008-1b9c-4e07-be0a-15a36897d92a.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=246&id=u34a45ae3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=492&originWidth=1140&originalType=binary&ratio=1&rotation=0&showTitle=false&size=129925&status=done&style=none&taskId=udbdf3909-0d99-4f78-8f78-89539ee8771&title=&width=570)
**可以看出js出错的源文件名，能直接映射到源文件**
<a name="ixn8D"></a>
### 内联script
<a name="nChIm"></a>
#### 无source map
![image.png](/static/images/yuque/1657333536305-affd8955-f9ef-49da-9007-9739049663a4.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=181&id=u4c1d86ec&margin=%5Bobject%20Object%5D&name=image.png&originHeight=362&originWidth=2836&originalType=binary&ratio=1&rotation=0&showTitle=false&size=86126&status=done&style=none&taskId=ubc8c9e5d-0ff9-44d0-9aa4-2e130997742&title=&width=1418)

![image.png](/static/images/yuque/1657333631232-f65a9a2b-654f-469d-945d-3a086b91454e.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=65&id=u8eae4872&margin=%5Bobject%20Object%5D&name=image.png&originHeight=130&originWidth=1140&originalType=binary&ratio=1&rotation=0&showTitle=false&size=28130&status=done&style=none&taskId=u6d0bc924-f16e-4815-9d12-eebfa26ccf4&title=&width=570)
**内联脚本名是anonymous， 不能够看出是哪个js文件的报错，不能映射到原文件**

<a name="OSTrK"></a>
#### 有source map
![image.png](/static/images/yuque/1657334213805-a5d6e35c-b883-4f79-99e8-f2285b9f39f4.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=141&id=ud32d51c8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=282&originWidth=1996&originalType=binary&ratio=1&rotation=0&showTitle=false&size=125735&status=done&style=none&taskId=u58698194-2d45-413e-8dc0-b24a5e6208d&title=&width=998)

![image.png](/static/images/yuque/1657333711975-72e8cf7e-ac8f-422a-9909-706d762f046c.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=198&id=u012ef61a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=396&originWidth=2842&originalType=binary&ratio=1&rotation=0&showTitle=false&size=91431&status=done&style=none&taskId=u8aaf7d4b-6170-40da-ae84-31474aef16f&title=&width=1421)

![image.png](/static/images/yuque/1657333734851-e828fb67-bfd4-4d04-93a0-a422a08ca5ad.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=116&id=u136b601f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=232&originWidth=1076&originalType=binary&ratio=1&rotation=0&showTitle=false&size=42634&status=done&style=none&taskId=u4794a2e7-8c86-4387-ad33-e5b708c51b1&title=&width=538)
**内联脚本名是anonymous，能看到报错源文件名， 能映射到原文件，但是在微前端场景，不能够知道报错的这段js来自于哪个子应用**

<a name="tj4V3"></a>
#### 有sourceURL
![image.png](/static/images/yuque/1657334133463-e420982c-b03f-4658-8769-7f766c8a2e8b.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=135&id=u9c1d3c2a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=270&originWidth=2006&originalType=binary&ratio=1&rotation=0&showTitle=false&size=125324&status=done&style=none&taskId=u3820e533-4c9c-41a5-8973-f084ef8bc5f&title=&width=1003)

![image.png](/static/images/yuque/1657334050161-f0275a50-4eee-4ba8-a90f-d24d431b84b8.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=179&id=u396f1ecc&margin=%5Bobject%20Object%5D&name=image.png&originHeight=358&originWidth=2828&originalType=binary&ratio=1&rotation=0&showTitle=false&size=125382&status=done&style=none&taskId=u943cefb7-15be-433d-9d8d-7053979fb06&title=&width=1414)

![image.png](/static/images/yuque/1657334108331-4c0eff80-de17-40aa-accb-803890125765.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=55&id=ubfdfa4e5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=110&originWidth=1180&originalType=binary&ratio=1&rotation=0&showTitle=false&size=34048&status=done&style=none&taskId=ud9b67e56-3520-4d14-af3b-91726863006&title=&width=590)

**内联脚本名是anonymous，能看到报错源文件名， 不能映射到源文件，但是在微前端场景，能够知道报错的这段js来自于哪个子应用**
<a name="k8jD5"></a>
### eval
<a name="Apahm"></a>
#### 无source map
![image.png](/static/images/yuque/1657334268324-231c6f0d-a84e-4b1f-8f4a-e0b7f8cf2cce.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=187&id=ua5322ef5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=374&originWidth=2814&originalType=binary&ratio=1&rotation=0&showTitle=false&size=112241&status=done&style=none&taskId=u0b62b544-7399-49bc-ae0d-c26da3944ec&title=&width=1407)

![image.png](/static/images/yuque/1657334279827-152e132f-332c-4aa1-8d24-7493cd01a0cd.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=54&id=ub99dda52&margin=%5Bobject%20Object%5D&name=image.png&originHeight=108&originWidth=1150&originalType=binary&ratio=1&rotation=0&showTitle=false&size=28877&status=done&style=none&taskId=uc55b52b4-ff5b-4f47-86bf-cdc52a1f7f4&title=&width=575)

**会看到代码是eval执行， 不能够看出是哪个js文件的报错，不能映射到源文件**

<a name="m0TzL"></a>
#### 有source map
![image.png](/static/images/yuque/1657334440640-71dc9596-bbd4-47dc-b631-eb32ab01b0b6.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=141&id=u7edf79ad&margin=%5Bobject%20Object%5D&name=image.png&originHeight=282&originWidth=1996&originalType=binary&ratio=1&rotation=0&showTitle=false&size=114761&status=done&style=none&taskId=udd32e1db-c4ce-41d8-9ebe-7413530ca59&title=&width=998)

![image.png](/static/images/yuque/1657334428358-063b9393-fa8c-486b-9737-666586adf21d.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=187&id=u97848d0b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=374&originWidth=2786&originalType=binary&ratio=1&rotation=0&showTitle=false&size=112465&status=done&style=none&taskId=udf4b2979-4cde-4d6f-97aa-40aba93376d&title=&width=1393)

![image.png](/static/images/yuque/1657334459348-7c300769-3cf0-4835-9995-abcd36c065ae.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=116&id=uec9b18d8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=232&originWidth=1076&originalType=binary&ratio=1&rotation=0&showTitle=false&size=38693&status=done&style=none&taskId=u24a5c23a-5938-44f4-bf1b-938028ab043&title=&width=538)

**会看到代码是通过eval执行， 能够看出是哪个js文件的报错，能映射到源文件，但是在微前端场景，不能够知道报错的这段js来自于哪个子应用**

<a name="ySGdc"></a>
#### 有source url
![image.png](/static/images/yuque/1657334647615-32f64771-4093-4dd3-a35b-34f9ab831f81.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=135&id=u67ec029d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=270&originWidth=2006&originalType=binary&ratio=1&rotation=0&showTitle=false&size=114354&status=done&style=none&taskId=ue3c07688-556f-4e8b-9a91-d25300672c1&title=&width=1003)

![image.png](/static/images/yuque/1657334631420-e86408cb-052b-40fd-8bd2-83e605fde869.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=191&id=u17931d2c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=382&originWidth=2846&originalType=binary&ratio=1&rotation=0&showTitle=false&size=134270&status=done&style=none&taskId=ubf669d15-abd9-4e0e-9626-3f5bd6c0975&title=&width=1423)

![image.png](/static/images/yuque/1657334665393-59e82069-bfbf-4101-a535-910651646631.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=55&id=u6aef460e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=110&originWidth=1180&originalType=binary&ratio=1&rotation=0&showTitle=false&size=31129&status=done&style=none&taskId=u0e1db618-4a64-41f9-a7d0-84147487dac&title=&width=590)
**会看到代码是通过eval执行， 能够看出是哪个js文件的报错，不能映射到源文件，但是在微前端场景，能够知道报错的这段js来自于哪个子应用**
<a name="vbYDP"></a>
### new Function
<a name="wORRP"></a>
#### 无source map
![image.png](/static/images/yuque/1657334863624-25f86f7d-0ed3-49ee-ac54-46c50a5379c5.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=163&id=uec8b67b9&margin=%5Bobject%20Object%5D&name=image.png&originHeight=326&originWidth=2828&originalType=binary&ratio=1&rotation=0&showTitle=false&size=98902&status=done&style=none&taskId=ufd8f48e1-ae34-4c33-8354-28bc663f5a1&title=&width=1414)

![image.png](/static/images/yuque/1657334879937-3762d0fc-3a86-4688-9e26-38cd90ad78d9.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=86&id=u0cd785e9&margin=%5Bobject%20Object%5D&name=image.png&originHeight=172&originWidth=1140&originalType=binary&ratio=1&rotation=0&showTitle=false&size=36716&status=done&style=none&taskId=u15a3cea1-30bb-4bb0-9ffb-69ea9ce5c4b&title=&width=570)

**会看到代码是eval执行， 不能够看出是哪个js文件的报错，不能映射到源文件**
<a name="s8Aux"></a>
#### 有source map
![image.png](/static/images/yuque/1657334440640-71dc9596-bbd4-47dc-b631-eb32ab01b0b6.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=141&id=cQ0sa&margin=%5Bobject%20Object%5D&name=image.png&originHeight=282&originWidth=1996&originalType=binary&ratio=1&rotation=0&showTitle=false&size=114761&status=done&style=none&taskId=udd32e1db-c4ce-41d8-9ebe-7413530ca59&title=&width=998)

![image.png](/static/images/yuque/1657334938466-c49f8bb6-6cfc-40fe-b015-925b5b50ea5a.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=166&id=u5766a01e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=332&originWidth=2816&originalType=binary&ratio=1&rotation=0&showTitle=false&size=98493&status=done&style=none&taskId=u16d5bbda-163e-4797-83e7-cf65024cbb3&title=&width=1408)

![image.png](/static/images/yuque/1657334952137-801bd408-7f37-427a-80a0-c58a2cc580e9.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=117&id=u565e1d42&margin=%5Bobject%20Object%5D&name=image.png&originHeight=234&originWidth=1142&originalType=binary&ratio=1&rotation=0&showTitle=false&size=54972&status=done&style=none&taskId=u5733075b-9374-4908-992b-6a4b49ad87b&title=&width=571)

**会看到代码是通过eval执行， 不能够看出是哪个js文件的报错，不能映射到源文件**
<a name="Q5Gqf"></a>
#### 有source url
![image.png](/static/images/yuque/1657334647615-32f64771-4093-4dd3-a35b-34f9ab831f81.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=135&id=gIFCU&margin=%5Bobject%20Object%5D&name=image.png&originHeight=270&originWidth=2006&originalType=binary&ratio=1&rotation=0&showTitle=false&size=114354&status=done&style=none&taskId=ue3c07688-556f-4e8b-9a91-d25300672c1&title=&width=1003)

![image.png](/static/images/yuque/1657334982605-b7058feb-77f3-4e1e-841d-1fe47302116a.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=175&id=uda63c9d0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=350&originWidth=2844&originalType=binary&ratio=1&rotation=0&showTitle=false&size=126334&status=done&style=none&taskId=u807b3de6-7d23-4d5b-8724-50510179e85&title=&width=1422)

![image.png](/static/images/yuque/1657334998187-7e168359-8aac-440e-aba2-f160914e5254.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=109&id=u4ddae74c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=218&originWidth=1156&originalType=binary&ratio=1&rotation=0&showTitle=false&size=58988&status=done&style=none&taskId=u041a2f88-132e-41d1-9e2e-6d4e24ffad1&title=&width=578)
**会看到代码是通过eval执行， 能够看出是哪个js文件的报错，不能映射到源文件，但是在微前端场景，能够知道报错的这段js来自于哪个子应用**
<a name="SC6Du"></a>
## 错误监听
在微前端的场景下，比如micrpApp是通过new Function or 内联script来执行子应用js代码，那么怎么区分错误来源是哪个子应用，有两种三种思路

- 通过Object.defineProperty + Proxy的方式改写Error类
- 使用try catch包裹代码块、重写xhr、fetch、promise、addEventListen等方法，然后对callback进行try catch
- 添加sourceURL，通过sourceURL来执行js文件名与子应用名称

最终选择添加sourceURL方式，原因是Object.defineProperty + Proxy的方式改写Error类，只能影响到代码内主动throw 的Error，对于语法错误等js引擎执行过程中抛出的错误是影响不到的；而使用try catch的方式改动量更大，且更容易出bug下，相对来说选择sourceURL方式成本更低，改动更小

<a name="w4VL7"></a>
### 无sourceURL
addEventlisten error  no sourceURL
![image.png](/static/images/yuque/1657156955589-3fdc4f3d-0a9b-4c95-8680-f299fcb55e81.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=398&id=DB3i8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=796&originWidth=2780&originalType=binary&ratio=1&rotation=0&showTitle=false&size=322713&status=done&style=none&taskId=u45e244eb-96fd-42f8-b11f-3c72c4f33fc&title=&width=1390)

**filename来自url，不知道错误来源于哪个js文件，及哪个子应用**
<a name="PeySU"></a>
### 有sourceURL
addEventlisten error  sourceURL
![image.png](/static/images/yuque/1657156840059-055369e7-245f-4e29-945f-a3952b4c38fa.png#clientId=ubaf41a10-9057-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=365&id=u14c6c69a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=730&originWidth=2822&originalType=binary&ratio=1&rotation=0&showTitle=false&size=291814&status=done&style=none&taskId=uc167943c-b082-4837-a2c4-94b0400e72a&title=&width=1411)

**filename来自原本的js文件，准备知道错误来源于哪个js文件，及哪个子应用**
<a name="eTCyZ"></a>
## 总结
<img width="769" alt="image" src="https://user-images.githubusercontent.com/20950813/178097626-f5be88c7-16b8-4d6d-bd8d-f73ab9bb58ff.png" />

在微前端场景，通过添加sourceURL可以区分错误来源是哪个子应用，通过添加sourceMappingURL便于排查错误

参考链接
[eval](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/eval)
[note-about-source-maps](https://webpack.js.org/plugins/terser-webpack-plugin/#note-about-source-maps)
[chrome-development-tool-vm-file-from-javascript](https://stackoverflow.com/questions/17367560/chrome-development-tool-vm-file-from-javascript)
[Support //# sourceURL= and //# sourceMappingURL= in v8's parser](https://bugs.chromium.org/p/v8/issues/detail?id=2948)
[Introduction to JavaScript Source Maps](https://developer.chrome.com/blog/sourcemaps/#toc-sourceurl)
[Source Map Revision 3 Proposal](https://sourcemaps.info/spec.html)
[Source map for a dynamically created function](https://stackoverflow.com/questions/49463047/source-map-for-a-dynamically-created-function)
[Bug: Source maps don't work with hot reload](https://github.com/parcel-bundler/parcel/issues/643#issuecomment-1113905985)
[Webpack devtool source map](http://cheng.logdown.com/posts/2016/03/25/679045)
[Source Maps](https://survivejs.com/webpack/building/source-maps/)

