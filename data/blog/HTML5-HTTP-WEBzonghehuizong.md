---
  title: HTML5、HTTP、WEB综合汇总
  date: 2018-02-28T07:19:18Z
  lastmod: 2018-02-28T07:25:37Z
  summary: 
  tags: ["HTML5"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

## HTML5
1. **html5有哪些新特性、移除了那些元素？**
    1. HTML5 现在已经不是 SGML 的子集，主要是关于图像，位置，存储，多任务等功能的增加
          1. 绘画 canvas
          2. 用于媒介回放的 video 和 audio 元素
          3. 本地离线存储 localStorage 长期存储数据，浏览器关闭后数据不丢失
          4. sessionStorage 的数据在浏览器关闭后自动删除
          5. 语意化更好的内容元素，比如article、footer、header、nav、section
          6. 表单控件，calendar、date、time、email、url、search
          7. 新的技术webworker, websocket, Geolocation
    2. 移除的元素：
          1. 纯表现的元素：basefont，big，center，font, s，strike，tt，u`
          2. 对可用性产生负面影响的元素：frame，frameset，noframes
    3. 支持HTML5新标签：
          1. IE8/IE7/IE6支持通过document.createElement方法产生的标签
          2. 可以利用这一特性让这些浏览器支持HTML5新标签
          3. 浏览器支持新标签后，还需要添加标签默认的样式
          4. 当然也可以直接使用成熟的框架、比如html5shim

2. **Canvas和SVG有什么区别？**
    1. svg绘制出来的每一个图形的元素都是独立的DOM节点，能够方便的绑定事件或用来修改。canvas输出的是一整幅画布
    2. svg输出的图形是矢量图形，后期可以修改参数来自由放大缩小，不会是真和锯齿。而canvas输出标量画布，就像一张图片一样，放大会失真或者锯齿

## web综合
1. **什么是web语义化,有什么好处**
    1. web语义化是指通过HTML标记表示页面包含的信息，包含了HTML标签的语义化和css命名的语义化。 
         1. HTML标签的语义化是指：通过使用包含语义的标签（如h1-h6）恰当地表示文档结构,如header标签标示页面的头部，section标签标签页面上的一个快or组件，article标签用于跟文章有关的独立块标签，aside侧边栏标签，progress标签来表示进度条
         2. css命名的语义化是指：为html标签添加有意义的class，id补充未表达的语义，如Microformat通过添加符合规则的class描述信息 
    2. 为什么需要语义化：
         1. 去掉样式后页面呈现清晰的结构
         2. 盲人使用读屏器更好地阅读
         3. 搜索引擎更好地理解页面，有利于收录
         4. 便团队项目的可持续运作及维护

2. **从浏览器地址栏输入url到显示页面的步骤(以HTTP为例)**
    1. 在浏览器地址栏输入URL
    2. 浏览器查看缓存，如果请求资源在缓存中并且新鲜，跳转到转码步骤
           1. 如果资源未缓存，发起新请求
           2. 如果已缓存，检验是否足够新鲜，足够新鲜直接提供给客户端，否则与服务器进行验证。
                  1. 检验新鲜通常有两个HTTP头进行控制Expires和Cache-Control：
                          1. HTTP1.0提供Expires，值为一个绝对时间表示缓存新鲜日期
                          2. HTTP1.1增加了Cache-Control: max-age=,值为以秒为单位的最大新鲜时间
    3. 浏览器解析URL获取协议，主机，端口，path
    4. 浏览器组装一个HTTP（GET）请求报文
    5. 浏览器获取主机ip地址，过程如下：
           1. 浏览器缓存
           2. 本机缓存
           3. hosts文件
           4. 路由器缓存
           5. ISP DNS缓存
           6. DNS递归查询（可能存在负载均衡导致每次IP不一样）
    6. 打开一个socket与目标IP地址，端口建立TCP链接，三次握手如下：
           1. 客户端发送一个TCP的SYN=1，Seq=X的包到服务器端口
           2. 服务器发回SYN=1， ACK=X+1， Seq=Y的响应包
           3. 客户端发送ACK=Y+1， Seq=Z
    7. TCP链接建立后发送HTTP请求
    8. 服务器接受请求并解析，将请求转发到服务程序，如虚拟主机使用HTTP Host头部判断请求的服务程序
    9. 服务器检查HTTP请求头是否包含缓存验证信息如果验证缓存新鲜，返回304等对应状态码
    10. 处理程序读取完整请求并准备HTTP响应，可能需要查询数据库等操作
    11. 服务器将响应报文通过TCP连接发送回浏览器
    12. 浏览器接收HTTP响应，然后根据情况选择关闭TCP连接或者保留重用，关闭TCP连接的四次握手如下：
           1. 主动方发送Fin=1， Ack=Z， Seq= X报文
           2. 被动方发送ACK=X+1， Seq=Z报文
           3. 被动方发送Fin=1， ACK=X， Seq=Y报文
           4. 主动方发送ACK=Y， Seq=X报文
     13. 浏览器检查响应状态吗：是否为1XX，3XX， 4XX， 5XX，这些情况处理与2XX不同
     14. 如果资源可缓存，进行缓存
     15. 对响应进行解码（例如gzip压缩）
     16. 根据资源类型决定如何处理（假设资源为HTML文档）
     17. 解析HTML文档，构件DOM树，下载资源，构造CSSOM树，执行js脚本，这些操作没有严格的先后顺序，以下分别解释
           1. 构建DOM树：
                  1. Tokenizing：根据HTML规范将字符流解析为标记
                  2. Lexing：词法分析将标记转换为对象并定义属性和规则
                  3. DOM construction：根据HTML标记关系将对象组成DOM树
解析过程中遇到图片、样式表、js文件，启动下载
           2. 构建CSSOM树：
                  1. Tokenizing：字符流转换为标记流
                  2. Node：根据标记创建节点
                  3. CSSOM：节点创建CSSOM树
           3. 根据DOM树和CSSOM树构建渲染树:
                  1. 从DOM树的根节点遍历所有可见节点，不可见节点包括：1）script,meta这样本身不可见的标签。2)被css隐藏的节点，如display: none
                  2. 对每一个可见节点，找到恰当的CSSOM规则并应用
                  3. 发布可视节点的内容和计算样式
           4. js解析如下：
                  1. 浏览器创建Document对象并解析HTML，将解析到的元素和文本节点添加到文档中，此时document.readystate为loading，HTML解析器遇到没有async和defer的script时，将他们添加到文档中，然后执行行内或外部脚本。这些脚本会同步执行，并且在脚本下载和执行时解析器会暂停。这样就可以用document.write()把文本插入到输入流中。同步脚本经常简单定义函数和注册事件处理程序，他们可以遍历和操作script和他们之前的文档内容，当解析器遇到设置了async属性的script时，开始下载脚本并继续解析文档。脚本会在它下载完成后尽快执行，但是解析器不会停下来等它下载。异步脚本禁止使用document.write()，它们可以访问自己script和之前的文档元素
                   2. 当文档完成解析，document.readState变成interactive，所有defer脚本会按照在文档出现的顺序执行，延迟脚本能访问完整文档树，禁止使用document.write()
                   3. 浏览器在Document对象上触发DOMContentLoaded事件此时文档完全解析完成，浏览器可能还在等待如图片等内容加载，等这些内容完成载入并且所有异步脚本完成载入和执行，document.readState变为complete,window触发load事件
显示页面（HTML解析过程中会逐步显示页面）

3. **提高web网站性能**
    1. content方面
           1. 减少HTTP请求：合并文件、CSS精灵、inline Image
           2. 减少DNS查询：DNS查询完成之前浏览器不能从这个主机下载任何任何文件。方法：DNS缓存、将资源分布到恰当数量的主机名，平衡并行下载和DNS查询
           3. 避免重定向：多余的中间访问
           4. 使Ajax可缓存
           5. 非必须组件延迟加载
           6. 未来所需组件预加载
           7. 减少DOM元素数量
           8. 将资源放到不同的域下：浏览器同时从一个域下载资源的数目有限，增加域可以提高并行下载量
           9. 减少iframe数量，甚至禁用iframe标签，iframe会阻塞主页面的Onload事件搜索引擎的检索程序无法解读这种页面，不利于SEO，iframe和主页面共享连接池，而浏览器对相同域的连接有限制，所以会影响页面的并行加载使用iframe之前需要考虑这两个缺点。如果需要使用iframe，最好是通过javascript
动态给iframe添加src属性值，这样可以绕开以上两个问题
           10. 不要404

    2. Server方面
           1. 使用CDN
           2. 添加Expires或者Cache-Control响应头
           3. 对组件使用Gzip压缩
           4. 配置ETag
           5. Flush Buffer Early
           6. Ajax使用GET进行请求
           7. 避免空src的img标签

     3. Cookie方面
           1. 减小cookie大小
           2. 引入资源的域名不要包含cookie

     4. css方面
           1. 将样式表放到页面顶部
           2. 不使用CSS表达式
           3. 不使用@import
           4. 不使用IE的Filter
           5. 使用CSS3代码代替JS动画（尽可能避免重绘重排以及回流）

      5. Javascript方面
           1. 将脚本放到页面底部
           2. 将javascript和css从外部引入
           3. 压缩javascript和css
           4. 删除不需要的脚本
           5. 减少DOM访问
           6. 合理设计事件监听器
           7. 用innerHTML代替DOM操作，减少DOM操作次数，优化javascript性能
           8. 当需要设置的样式很多时设置className而不是直接操作style
           9. 少用全局变量、缓存DOM节点查找的结果。减少IO读取操作

      6. 图片方面
           1. 优化图片：根据实际颜色需要选择色深、压缩
           2. 优化css精灵
           3. 不要在HTML中拉伸图片
           4. 保证favicon.ico小并且可缓存
           5. 禁止使用gif图片实现loading效果（降低CPU消耗，提升渲染性能）

4. HTML5的离线储存怎么使用，工作原理能不能解释一下？
    1. 在用户没有与因特网连接时，可以正常访问站点或应用，在用户与因特网连接时，更新用户机器上的缓存文件

    2. 原理：HTML5的离线存储是基于一个新建的.appcache文件的缓存机制(不是存储技术)，通过这个文件上的解析清单离线存储资源，这些资源就会像cookie一样被存储了下来。之后当网络在处于离线状态下时，浏览器会通过被离线存储的数据进行页面展示

    3. 如何使用：
         1. 页面头部像下面一样加入一个manifest的属性；
         2. 在cache.manifest文件的编写离线存储的资源
         3. 在离线状态时，操作window.applicationCache进行需求实现

    4. 浏览器是怎么对HTML5的离线储存资源进行管理和加载的呢？在线的情况下，浏览器发现html头部有manifest属性，它会请求manifest文件，如果是第一次访问app，那么浏览器就会根据manifest文件的内容下载相应的资源并且进行离线存储。如果已经访问过app并且资源已经离线存储了，那么浏览器就会使用离线的资源加载页面，然后浏览器会对比新的manifest文件与旧的manifest文件，如果文件没有发生改变，就不做任何操作，如果文件改变了，那么就会重新下载文件中的资源并进行离线存储。离线的情况下，浏览器就直接使用离线存储的资源。
```
CACHE MANIFEST
#v0.11
CACHE:
js/app.js
css/style.css
NETWORK:
resourse/logo.png
FALLBACK:
/ /offline.html
```

## HTTP
1. **HTTP状态码及其含义**
    1. 1XX：信息状态码
        1. 100 Continue：客户端应当继续发送请求。这个临时相应是用来通知客户端它的部分请求已经被服务器接收，且仍未被拒绝。客户端应当继续发送请求的剩余部分，或者如果请求已经完成，忽略这个响应。服务器必须在请求万仇向客户端发送一个最终响应
        2. 101 Switching Protocols：服务器已经理解力客户端的请求，并将通过Upgrade消息头通知客户端采用不同的协议来完成这个请求。在发送完这个响应最后的空行后，服务器将会切换到Upgrade消息头中定义的那些协议。
    2. 2XX：成功状态码
        1. 200 OK：请求成功，请求所希望的响应头或数据体将随此响应返回
        2. 201 Created：
        3. 202 Accepted：
        4. 203 Non-Authoritative Information：
        5. 204 No Content： 服务器成功处理了请求，但不需要返回任何实体内容，并且希望返回更新了的元信息
        6. 205 Reset Content：
        7. 206 Partial Content：
    3. 3XX：重定向
        1. 300 Multiple Choices：
        2. 301 Moved Permanently：被请求的资源已永久移动到新位置，并且将来任何对此资源的引用都应该使用本响应返回的若干个 URI 之一。（永久重定向）
        3. 302 Found：请求的资源现在临时从不同的 URI 响应请求。由于这样的重定向是临时的，客户端应当继续向原有地址发送以后的请求。（临时重定向）
        4. 303 See Other：
        5. 304 Not Modified：如果客户端发送了一个带条件的 GET 请求且该请求已被允许，而文档的内容（自上次访问以来或者根据请求的条件）并没有改变，则服务器应当返回这个状态码；（使用缓存内容）
        6. 305 Use Proxy：
        7. 306 （unused）：
        8. 307 Temporary Redirect：
    4. 4XX：客户端错误
        1. 400 Bad Request:1、语义有误，当前请求无法被服务器理解。除非进行修改，否则客户端不应该重复提交这个请求。 　　2、请求参数有误。（错误请求）
        2. 401 Unauthorized:当前请求需要用户验证（权限校验）
        3. 402 Payment Required:
        4. 403 Forbidden:服务器已经理解请求，但是拒绝执行它；（禁止访问）
        5. 404 Not Found:请求失败，请求所希望得到的资源未被在服务器上发现；（服务器上没有找到对应的资源）但在资源以前存在而现在不存在的情况下，有时用来替代404 代码。如果资源已永久删除，应当使用 301 指定资源的新位置。
        6. 405 Method Not Allowed:
        7. 406 Not Acceptable:
        8. 407 Proxy Authentication Required:
        9. 408 Request Timeout:
        10. 409 Conflict:
        11. 410 Gone:被请求的资源在服务器上已经不再可用，而且没有任何已知的转发地址
        12. 411 Length Required:
        13. 412 Precondition Failed:
        14. 413 Request Entity Too Large:
        15. 414 Request-URI Too Long:
        16. 415 Unsupported Media Type:
        17. 416 Requested Range Not Satisfiable:
        18. 417 Expectation Failed:
    5. 5XX: 服务器错误
500 Internal Server Error:服务器遇到了一个未曾预料的状况，导致了它无法完成对请求的处理。一般来说，这个问题都会在服务器的程序码出错时出现。（服务异常）
501 Not Implemented:服务器不支持当前请求所需要的某个功能。当服务器无法识别请求的方法，并且无法支持其对任何资源的请求。
502 Bad Gateway:由于临时的服务器维护或者过载，服务器当前无法处理请求。这个状况是临时的，并且将在一段时间以后恢复。
503 Service Unavailable:
504 Gateway Timeout:
505 HTTP Version Not Supported:
