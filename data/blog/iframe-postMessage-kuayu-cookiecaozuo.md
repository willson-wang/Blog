---
  title: iframe postMessage 跨域 cookie操作
  date: 2018-12-12T14:58:42Z
  lastmod: 2018-12-12T15:16:53Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

iframe postMessage 跨域 cookie操作

有一个这样的场景，两个站点之间是通过嵌套的方式进行关联；A站点维护一套账号体系，B站点也维护一套账号体系；但是二者是打通的，即如果在B站点内的注册的账号一定会在B站点内有一个对应的关联账号；而我们这种方式即运行在app内，也可以运行在h5上；而app内是底层一些清除cookie的方法，所以当A账号退出登陆时，也会清除B站点域下的cookie；而h5上是通过A退出登陆时，会通知到我们后台A账号退出登陆了，这是我们后台会把A对应的B站点下的账号的cookie清掉；这样就可以保持二者的登录态是统一的；但是这里漏了一种场景，即A账号不是主动退出时；我们后端是没有收到A账号退出登陆的消息的，所以我们换个账号登录时，在B站点下就会存在串账号的问题，因为B站点下还有之前A账号对应的cookie；所以为了解决这个问题，一是排查A站点下为什么会无故退出；二是采取补偿措施，就是在A站点登录的时候，都会主动去清一次B站点下的cookie；

#### 第一次实践方式，直接在A站内调用清除B站点下cookie的接口；实际上接口是调用成功，但是cookie没有被清掉；原因是ajax接口是在A域下调用的，存在跨域问题，通过在A站点不能清除掉B站点下的cookie;

#### 第二种实践引入iframe，引入一个隐藏的B站点iframe，然后在iframe内直接操作B站点的cookie；另一种方式是通过postMessage来发送消息，然后在message监听回调内进行cookie操作；因为接口后端直接提供了接口，所以没有直接操作是否能直接删除cookie；直接使用的是调用后台提供的接口来清除cookie; 过程如下

#### 在使用postMessage方式之前先看下postMessage方法的兼容性

pc端

![image](https://user-images.githubusercontent.com/20950813/49878265-1b1dfb80-fe62-11e8-887f-6aec5691d86d.png)

移动端

![image](https://user-images.githubusercontent.com/20950813/49878304-34bf4300-fe62-11e8-8773-3480376f37ce.png)

#### 从can i use上看pc端兼容ie8+，移动端兼容ios4.0+、安卓2.1+，所以我们可以放心大胆的使用postMessage方法

#### 1 在A站点引入一个隐藏的iframe，因为postMessage是window对象上的方法，所以需要先通过contentWindow获取iframe内的window对象

```
// 创建iframe，并想iframe内发送消息
function createIframe () {
    const iframe = document.createElement('iframe')
    iframe.id="my_iframe"
    iframe.className = 'my-iframe'
    iframe.src = 'xxxx'
    iframe.onload = function () {
          // 这里需要注意两个地方，第一个参数是传递的参数，最好是字符串，如果是对象使用JSON.stringfiy处理一下，第二个参数表示可以接收到postMessage传递过去消息的域，如果不想指定就写上*，不过为了安全性，最好写上域
          iframe.contentWindow.postMessage('message',  'xxxx')
    }
    iframe.onerror = function () {}
    document.body.appendChild(iframe)
}

// 监听所有iframe内发送来的消息
function receiveIframeMessage () {
     window.addEventListener('message', function (event) {
           if (event.origin === 'xxx' && event.data === 'yyy') {
               removeIframe()
           }
     }, false)
}

// 删除创建的iframe
function removeIframe () {
    const iframe = document.getElementId('my_iframe')
    document.body.removeChild(iframe)
}
```

#### 2 B站点下设置监听message回调即可，并且在操作成功之后，在利用postMessage发送回去
```
window.addEventListener('message', function (event) {
           if (event.origin === 'xxx' && event.data === 'yyy') {
               clearCookie().then(() => {
                    window.parent.postMessage('cookie清除成功', '*')
               }).catch(() => {
                    window.parent.postMessage('cookie清除失败', '*')
               })
           }
}, false)
```

### 总结

在本地调试正常之后，构建到测试环境的时候，发现居然没有生效，A站成功发送来消息，但是B站点监听不到消息postMessage发送过来的消息，一开始以为代码写错了，以及是发送的时候域写错了，把域改成*还是收不到；后面又一以为设置监听的地方不对，试了几个地方都没找到原因，后面在想，本地都能调通，说明代码应该是没什么问题的，那就是接收的时候有问题，会不会是A站发送的时候，B站点内还没设置好监听呢？因为使用的vue，然后在mounted钩子内监听的，于是在A站点内发送消息的时候给个延迟，果然就收到了，所以这里修改了下，采用轮询的方式来发送消息，知道收到B站点反馈过来已经操作成功的消息就结束；

```
function createIframe () {
    const iframe = document.createElement('iframe')
    iframe.id="my_iframe"
    iframe.className = 'my-iframe'
    iframe.src = 'xxxx'
    var timer = null;
    var myPostMessage = function () {
        // 轮询的目的是，iframe内还没设置好监听，避免通信不成功
        timer = setTimeout(() => {
            var iframeEle = document.getElementById('my_iframe')
            iframeEle && iframe.contentWindow.postMessage('message', `xxxx`)
            if (iframeEle) {
                myPostMessage()
            }
        }, 500)
    }
    iframe.onload = function () {
        myPostMessage()
    }
    iframe.onerror = function () {
        console.log('iframe onerror')
    }
    document.body.appendChild(iframe)
}
```

跨域的行为分为3类
1. 获取网页存储信息，如cookie、localstorage，如iframe内的cookie及localstorage
2. 操作dom，如iframe内的dom
3. ajax操作，然后会有什么样的反应，能不能携带cookie，需要什么设置
上面这三种行为需要好好总结下

链接
https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage

