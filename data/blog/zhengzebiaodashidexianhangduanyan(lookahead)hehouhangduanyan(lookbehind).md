---
  title: 正则表达式的先行断言(lookahead)和后行断言(lookbehind)
  date: 2019-04-23T12:44:05Z
  lastmod: 2023-03-26T09:38:37Z
  summary: 
  tags: ["原生JS", "先行断言", "后行断言", "js正则"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

## 关于正则的先行断言(lookahead)和后行断言(lookbehind)总共分为4种，如下所示
1. 零宽正向先行断言`p(?=pattern)`
2. 零宽负向先行断言`p(?!pattern)`
3. 零宽正向后行断言`(?<=pattern)p`
4. 零宽负向后行断言`(?<!pattern)p`

关于正向(positive)和负向(negative)：正向就表示匹配括号中的表达式，负向表示不匹配
关于先行(lookahead)和后行(lookbehind)：先行匹配后面，后行匹配前面，专业术语，正则引擎在扫描字符的时候，从左往右扫描，匹配扫描指针未扫描过的字符，先于指针，故称先行；匹配指针已扫描过的字符，后于指针到达该字符，故称后行，即产生回溯；

es5 就支持了先行断言，es2018 才支持后行断言


### 零宽正向先行断言`p(?=pattern)`
如正则为`p(?=r)`，匹配字符串为'xproxjs xpodsk'，那边能够匹配上pr中的p，匹配不上po中的p;换一种方式理解即，p只有在r前面才匹配，必须写成`/p(?=r)/`，例如只匹配百分号之前的数字，要写成`/\d+(?=%)/`

![image](https://user-images.githubusercontent.com/20950813/56581791-54ccf300-6608-11e9-92f5-e7a758b054e6.png)

![image](https://user-images.githubusercontent.com/20950813/56627439-5fbf6c00-6678-11e9-93b0-3576f5659dbd.png)


### 零宽负向先行断言`p(?=pattern)`
如正则为`p(?!r)`，匹配字符串为'xproxjs xpodsk'，那边能够匹配上po中的p，匹配不上pr中的p;换一种方式理解即，p只有不在r前面才匹配，必须写成`/p(?!r)/`，例如不匹配百分号之前的数字，要写成`/\d+(?!%)/`

![image](https://user-images.githubusercontent.com/20950813/56581842-76c67580-6608-11e9-9116-602f32826b22.png)

![image](https://user-images.githubusercontent.com/20950813/56627514-b9c03180-6678-11e9-87f3-d539c8897a04.png)

### 零宽正向后行断言`(?<=pattern)p`
如正则为`(?!x)p`，匹配字符串为'xproxjs ypodsk'，那边能够匹配上xp中的p，匹配不上yp中的p;换一种方式理解即，p只有在r后面才匹配，必须写成`/(?<=r)p/`，例如只匹配百分号之后的数字，要写成`/\(?<=%)d+/`

![image](https://user-images.githubusercontent.com/20950813/56582591-349e3380-660a-11e9-88f4-4ccefcbed53f.png)

![image](https://user-images.githubusercontent.com/20950813/56627645-4e2a9400-6679-11e9-80a1-6a8f738a4bcb.png)


### 零宽负向后行断言`(?<!pattern)p`
如正则为`(?!x)p`，匹配字符串为'xproxjs ypodsk'，那边能够匹配上yp中的p，匹配不上xp中的p;换一种方式理解即，p只有不在r后面才匹配，必须写成`/(?<!r)p/`，例如不匹配百分号之后的数字，要写成`/\(?<!%)d+/`

![image](https://user-images.githubusercontent.com/20950813/56582680-62837800-660a-11e9-858f-41d389693d05.png)

![image](https://user-images.githubusercontent.com/20950813/56628378-238e0a80-667c-11e9-9b7a-3f854c6db457.png)


## 应用

### 关于charles中使用rewrite来将测试环境or开发环境的静态资源代理到本地，而接口则不处理，这个时候就需要用到负向先行断言，将api部分排除掉；

![image](https://user-images.githubusercontent.com/20950813/56582965-108f2200-660b-11e9-8599-665fb108eea4.png)

![image](https://user-images.githubusercontent.com/20950813/56582973-171d9980-660b-11e9-82b6-78fb6c5235cf.png)

### 所以我们使用负向先行断言，排除掉所有的api请求，这样就可以直接在本地，调试与开发测试|生产环境的功能

![image](https://user-images.githubusercontent.com/20950813/56583179-94490e80-660b-11e9-9915-7c4e9a9cffff.png)

![image](https://user-images.githubusercontent.com/20950813/56583234-b0e54680-660b-11e9-8451-2ae89f912ada.png)

### 匹配url后面的路径

![image](https://user-images.githubusercontent.com/20950813/56629245-54237380-667f-11e9-8bcd-f3930f224c3e.png)

```
'<img id = "23" style="width:999x;" /><img id = "23" style="width:999x;" />'.replace(
  /(?<=(<img[\s\S]*width:\s*))[^("\/);]*/gm,
  '100%'
)
"<img id = "23" style="width:100%;" /><img id = "23" style="width:100%;" />"
```

## 参考链接
http://es6.ruanyifeng.com/#docs/regex#%E5%90%8E%E8%A1%8C%E6%96%AD%E8%A8%80
https://blog.51cto.com/cnn237111/749047

