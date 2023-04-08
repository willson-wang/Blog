---
  title: 本地调试微信jssdk
  date: 2020-03-20T14:43:52Z
  lastmod: 2020-03-20T15:15:05Z
  summary: 
  tags: ["原生JS", "微信", "jssdk", "charles"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/js4.jpeg']
  bibliography: references-data.bib
---

因为微信jssdk的使用是需要绑定js安全域名，所以我们在普通的本地环境是无法正常调试微信jssdk的，只能上传代码到我们的测试or生产环境去进行调试；但是这样一来一去花费的时间跟精力瞬间就成倍增加长了，所以我们肯定要想办法提高我们的开发效率；主要有两个思路

思路一：配置测试环境or生产环境的域名访问本地项目

思路二：使用charles等抓包工具将测试or生产环境直接代理到本地，访问本地代码

## 配置测试环境or生产环境的域名访问本地项目

1、配置host，将测试or生产的域名指向本地的127.0.0.1

```shell
127.0.0.1 webapp.test.com
```

然后我们直接在本地访问 webapp.test.com:本地项目的具体端口号，如果能够正常访问到本地项目则配置成功

2、如果本地项目端口不是80端口而是其它端口，则需要使用nginx等工具将80端口转发到我们本地项目的实际端口，如果是80端口则直接忽略这一步

```shell
// mac 下查看某个端口是否被占用
lsof -i:80

// 杀掉某个进程,pid在查看进程的时候可以看到
kill pid
```

转发80端口的目的是因为jssdk配置的安全域名仅支持80（http）和443（https）两个端口

```js
server {
    listen 80;
    server_name webapp.test.com;
    location / {
        proxy_pass http://127.0.0.1:5000/;
    }
}
```

注意修改完端口之后需要sudo nginx -s reload重启一下nginx

然后我们在本地访问直接访问webapp.test.com，如果能够访问到本地项目则端口转发成功

3、我们在pc端的浏览器是无法调试的，所以我们需要在手机上进行调试，我们直接在手机微信上访问webapp.test.com要么直接访问到了测试环境，要么因为确实路径访问不成功；因为这时候的dns解析出来的地址还是测试环境的地址，要想手机上webapp.test.com访问的是本地环境，那么我们需要借助charles等抓包工具；

让我们在手机上通过webapp.test.com可以正常的访问到本地环境之后，就可以本地调试微信jssdk了

主要手机必须跟电脑连在用一个内网上

常见问题：

- 提示invalid url domain，表示当前页面所在域名与使用的appid没有绑定，去微信微信公众号后台确认是否配置了该安全域名

- invalid signature签名错误，这个90%以上的场景都是获取签名参数传入的url不匹配，这里需要根据ios与安卓、小程序webview等不同的环境去进行区分

- permission denied 表示当前的jssdk方法没有权限使用，需要去微信微信公众号后台检查权限是否开启

- ios中直接访问本地配置的webapp.test.com域名可能出现一致访问的是测试环境的https:webapp.test.com的情况，原因是dns缓存，但是目前使用几种ios上清除dsn缓存的方法，入开启飞行模式然后在关闭，手动修改无线网络链接中的dns解析地址，还原网络设置都没有清除dns缓存，这个后续抽时间在试下，因为目前微信7.0版本之后安卓是不能抓包小程序了，所以我们需要用ios来抓包调试小程序webview

- chrome浏览器上访问webapp.test.com时chrome强制转换成了https:webapp.test.com，这是需要进入chrome://net-internals/#hsts

输入webapp.test.com域名，如果有值则会进行强制转换

![image](https://user-images.githubusercontent.com/20950813/77176677-61e7b000-6aff-11ea-9174-4619d51aea3b.png)

需要在下面这个位置输入域名删除，这样我们就可以通过http访问该站点了

![image](https://user-images.githubusercontent.com/20950813/77176572-4086c400-6aff-11ea-8785-dfa2a037a685.png)

补充host的一点知识：

hosts —— the static table lookup for host name（主机名查询静态表）

hosts文件是一个用于储存计算机网络中各节点信息的计算机文件。这个文件负责将主机名映射到相应的IP地址。hosts文件通常用于补充或取代网络中DNS的功能。和DNS不同的是，计算机的用户可以直接对hosts文件进行控制。

Hosts是一个没有扩展名的系统文件，其作用就是将一些常用的网址域名与其对应的IP地址建立一个关联“数据库”，当用户在浏览器中输入一个需要登录的网址时，系统会首先自动从Hosts文件中寻找对应的IP地址，一旦找到，系统会立即打开对应网页，如果没有找到，则系统会再将网址提交DNS域名解析服务器进行IP地址的解析。

优先级 ： dns缓存 > hosts > dns服务

hosts在各个系统中所在的文件夹：

Windows 系统hosts位于 C:\Windows\System32\drivers\etc\hostsAndroid
Mac（苹果电脑）系统hosts位于 /etc/hosts

## 使用charles等抓包工具将测试or生产环境的代码代理到本地

可以参考[移动端抓包及调试](https://github.com/willson-wang/Blog/issues/35)

## 参考链接
https://osxdaily.com/2015/03/31/clear-dns-cache-ios/
https://www.jianshu.com/p/302571f2dae0
https://juejin.im/post/5c71f8eef265da2db5423bc3

