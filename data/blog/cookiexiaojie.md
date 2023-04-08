---
  title: cookie小结
  date: 2018-06-08T14:43:36Z
  lastmod: 2018-08-24T01:46:25Z
  summary: 
  tags: ["原生JS", "cookie"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

最近在项目开发中碰到跨域cookie与跨webview的接口携带cookie问题，于是总结一下cookie及前端的角度去看待cookie

为什么会有cookie，及客户端发起请求的时候，浏览器为什么会主动帮助我们在请求头里面添加cookie？

HTTP Cookie（也叫Web Cookie或浏览器Cookie）是服务器发送到用户浏览器并保存在本地的一小块数据，它会在浏览器下次向同一服务器再发起请求时被携带并发送到服务器上。通常，它用于告知服务端两个请求是否来自同一浏览器，如保持用户的登录状态。Cookie使基于无状态的HTTP协议记录稳定的状态信息成为了可能；这页就是为什么会有cookie及浏览器为什么会主动在请求头里面添加cookie;

1. cookie一般用于存储小量数据与后端存储验证id之类的值如sesion_id等；主要由以下几个参数构成

| 参数 | 是否必填   | 作用                                                                                     | 默认值                               |
| ---   | ----           | ----                                                                                      | ----                                   |
| name | 是            |   key值（string）                                                                | -                                        |
| value | 是            |   value (string)                                                                     | -                                        | 
|domain | 否         | 例如 'example.com'， '.example.com' (包括所有子域名), 'subdomain.example.com'  设置cookie访问的域 | 默认为当前文档位置的路径的域名部分 (string或null) |
|path    | 否           | 例如 '/', '/mydir'  区分cookie作用路径                                 |  默认为当前文档位置的目录。(string or null)| 
|exprires or max-age |  否  | cookie有效期                                                         | -                                       |
| HttpOnly | 否      | 是否只允许http接口访问cookie                                           | false                                 |
| secure |  否        | 是否只允许https接口访问cookie                                         | false                                  |

2. 什么是会话cookie，什么是持久性cookie

两者通过是否设置expires or max-age的值来判断，如果没有设置则是会话cookie，即只存在当前浏览器打开的时间内，如果浏览器关闭则默认会话结束，会话cookie会被浏览器清除；而永久cookie则是根据设置的值来确定是否过期，如果过期则删除；

这里有个小问题需要注意的是mac电脑上，关闭浏览器之后打开，发现cookie没有被清掉是，因为我们点击浏览器的x按钮mac电脑只是关闭了当前的浏览器窗口，并没有推出浏览器，这里需要使用`command + q`退出之后再打开就会发现会话cookie被清除了；windows下不会有这个问题

 
3. cookie参数的详解

     1. expires设置cookie的有效时间，日期必须是GMT的日期格式，可以通过new Date().toUTCSting() or new Date().toGMTSting()来获取；expires="Sun, 10 Jun 2018 08:27:03 GMT"表示在这个日期内有效，超过该日期则失效，浏览器会主动清除； 如果设置的时候日期格式不正确or没有设置该字段，则取默认值1969-12-31T23:59:59.000Z；此时该cookie就是一个会话cookie；如果设置的时候是一个失效GMT的日期则设置不会成功，因为浏览器会清楚失效的cookie；

    2. max-age也是设置cookie的有效日期，只不过expires是http1.0协议中的字段，max-age是http1.1协议中的字段；max-age的值有三种，正值/负值/零；正值表示cookie在创建的时间+max-age的值内有效；负值表示该cookie是会话cookie；零用于删除cookie；需要注意的是，如果在设置cookie的时候，max-age设置的值为0 or 负值则该cookie不会被创建；如果已有该cookie如果max-age设置为0 or 负数则该cookie会被删除；当expires与max-age同时存在时，以max-age设置的时间为准；max-age是以秒来计算，如设置过期时间为一个月document.cookie = 'test=1111; max-age=2592000(30*24*60*60)'

    3. HttpOnly是否允许js去访问该cookie；默认情况设置cookie是不会带上该字段， 即允许js操作该cookie；该作用是只允许服务端来操作该cookie，不允许客户端来操作该cookie；这样限制的目的是保证客户信息的安全，避免被xss攻击时通过一段script脚本内的document.cookie来获取用户信息相关的cookie;最后需要注意的是该字段是只有服务端设置cookie的时候才会生效，客户端通过js设置该字段时是无效的；

    4. secure用来设置cookie只有在安全的协议传输时才会被带上，如https等；默认情况下设置cookie时，是不会被带上的；一般不会设置该字段，应该这样可以保证在http or https的请求中该cookie都能够被带上；还有我们可以通过js来直接设置该字段；

    5. domain 和 path, domain是域名，path是路径，这两者决定了cookie能被哪些url访问；domain的默认值为设置当前cookie的网页的域名；path的默认值为设置当前cookie的网页所在的目录；如domain=www.baidu.com,path=/;若请求的URL(URL 可以是js/html/img/css资源请求，但不包括 XHR 请求)的域名是“baidu.com”或其子域如“api.baidu.com”、“dev.api.baidu.com”，且 URL 的路径是“/ ”或子路径“/home”、“/home/login”，则浏览器会自动将此 cookie 添加到该请求的 cookie 头部中；需要注意的是不包括xhr的原因是当跨域请求是，就算domain path都满足，浏览器也不会将相应的cookie带上，这时则需要前后端配合才能够跨域携带cookie；还有需要注意的是domain是可以设置为页面本身的域名（本域），或页面本身域名的父域，但不能是公共后缀 public suffix。举例说明下：如果页面域名为 www.baidu.com, domain可以设置为“www.baidu.com”，也可以设置为“baidu.com”，但不能设置为“.com”或“com”。

4. cookie的设置

```
基础设置
document.cookie = 'type=js'; ===  document.cookie =  'type=js;domain=localhost(当前域名);path=/;expires= 1969-12-31T23:59:59.000Z;';

设置带失效时间的cookie
document.cookie = 'type=js; max-age=60*60;'
document.cookie = 'type=js; expires="Sun, 10 Jun 2018 09:02:01 GMT"'

设置domain与path的cookie
document.cookie = 'type=js; max-age=60*60;domain=www.baidu.com; path=/' 需要注意不能在自己网页的js中设置cookie的domain为其它域名的domain

设置安全协议连接才允许访问的cookie
document.cookie = 'type=js; max-age=60*60; domain=www.baidu.com; path=/; secure' 
```

5. cookie的读取

   直接通过document.cookie来读取cookie，不过这个是根据该页面的所在文件的目录，获取该域下domain及path相同及父目录下的的没有设置HttpOnly的所有cookie；例如有两个cookie，document.cookie = 'type1=js; path=/;'，document.cookie = 'type2=js; path=/page;'在根目录对应的页面内执行document.cookie只能够获取到type1这个cookie，不能获取/page下的cookie；而在/page目录下的页面通过document.cookie则可以获取到type2和type1这两个cookie；允许读取父目录下的cookie；同理domain也是一样的，子可以读取父，但是父不能读取子；


6. cookie的修改

    cookie的修改就是直接覆盖，获取之后，修改其它可配置的字段；


7. cookie的删除

    cookie的删除，会话cookie除外，可以通过max-age设置成0 or 负值；or将expires的值设置成一个过期的 时间；这里需要注意，如果设置expires值的时候，如果不是一个GMT时间，则浏览器不会立马删除该cookie，会把该cookie变成会话cookie；如果设置是一个过期的GMT时间才会立马删除；另外通过expires设置的cookie可以通过max-age为负数or0来删除；而设置max-age的cookie则不能通过设置expires的值来删除，因为max-age的优先级比expires高

```
// 删除当前页面也就是path下的所有cookie的方法
function deletCookies(path = '/') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=" + path;
    }
}

function deletCookies(path = '/') {
    const cookies = document.cookie.split(";");
    cookies.forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=" + path); 
    });
}

// 删除所有目录下的cookie,需要注意的是这个方法需要在最子的目录页面上执行

function deletAllCookies() {
    const paths = ['/', '/page', 'basic'];
    
    for (let i = 0; i < paths.length; i++) {
        deletCookies(paths[i]);
    }
}

```

8. 怎么解决跨域xhr携带cookie;

    默认情况下，在发生跨域时，cookie 作为一种 credential 信息是不会被传送到服务端的。必须要进行额外设置才可以。原因是在CORS标准中做了规定，默认情况下，浏览器在发送跨域请求时，不能发送任何认证信息（credentials）如"cookies"和"HTTP authentication schemes"。除非xhr.withCredentials为true（xhr对象有一个属性叫withCredentials，默认值为false）。

    所以根本原因是cookies也是一种认证信息，在跨域请求中，client端必须手动设置xhr.withCredentials=true，且服务端也必须允许request能携带认证信息（即response header中包含Access-Control-Allow-Credentials:true），这样浏览器才会自动将cookie加在request header中。

    另外，要特别注意一点，一旦跨域request能够携带认证信息，服务端一定不能将Access-Control-Allow-Origin设置为*，而必须设置为请求页面的域名。

    如使用axios来进行请求数据时，需要设置该属性如下所示
```
axios.defaults.withCredentials = true;
```

9. cookie渐渐被淘汰的原因

    1. 存储空间小；
    2. 由于服务器指定Cookie后，浏览器的每次请求都会携带Cookie数据，会带来额外的性能开销（尤其是在移动环境下）


参考链接
https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies
https://segmentfault.com/a/1190000004556040
