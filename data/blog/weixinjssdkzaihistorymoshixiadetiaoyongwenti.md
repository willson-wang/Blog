---
  title: 微信jssdk在history模式下的调用问题
  date: 2019-05-05T10:15:22Z
  lastmod: 2020-04-17T08:54:19Z
  summary: 
  tags: ["原生JS", "微信", "jssdk"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

## 基础使用
根据微信jssdk文档得到如下信息

1、 同一个url仅需调用一次，但是安卓的单页应用，每次页面切换的时候url都会改变，所以安卓需要每次重新调用

所以这里需要根据平台进行判断,ios下只需要调用一次，成功之后则不需要调用；安卓每次都要调用

2、 config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。

```js
wx.ready(function(){
  	// 常用需要在ready触发之后进行的api
  	1. updateAppMessageShareData 分享朋友
  	2. updateTimelineShareData 分享朋友圈
  	3. onMenuShareTimeline 分享朋友圈 即将废弃
  	4. onMenuShareAppMessage  分享朋友 即将废弃
  	5. getLocation

  	// 常用不需要在ready触发之后进行的api
  	1. chooseImage
  	2. previewImage
  	3. uploadImage
  	4. downloadImage
  	5. getLocalImgData
  	6. openLocation
});

```

因为config是一步的，所以我们我需要在ready或error内进行相应的操作

3、 config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。

```js
wx.error(function(res){
	// error与ready执行的顺序不固定
})
```

所以我们在error被调用之后，需要进行对应的操作，好让我们制定此次config失败

4、 根据是否需要在ready之后触发进行不同处理

```js
wx.ready(function(res){
	// 不论config成功还是失败ready方法都会被执行
})
```

所以这里我们不能使用单个变量判断此次config是成功还是失败


按照职责单一原则，我们定义的调用jssdk的方法如下所示

```js
let wxJsdk = require('./wxapi').default

const act_type = `${window.location.origin}/`

const defaultApiList = ['checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'getLocation', 'openLocation', 'chooseImage', 'uploadImage']

// 用于判断此次config是否成功
const hasConfiged = []

// 调用config，并判断成功还是失败
async function configByPath(path, jsApiList, os) {
    // ios下只需要执行一次config即可
    const againConfig = hasConfiged.length && hasConfiged.length < 2 && os.ios

    if (!path || againConfig) return

    hasConfiged.length = 0

    let SIGN_PATH = encodeURIComponent(path.substring(1))

    const query = qs.parse(window.location.search.substr(1))
    const token = brokerToken || query.token
    const res = await http.get('/api/xxx/wxapi&act=jsapi', {
        params: {
            path: SIGN_PATH,
            token,
            act_type
        }
    })
    const { appId, timestamp, nonceStr, signature, url } = res
    wxJsdk.config({
        debug: !!query.debug,
        appId,
        timestamp,
        nonceStr,
        signature,
        jsApiList
    })

    await new Promise((resolve, reject) => {
        wxJsdk.ready(result => {
            hasConfiged.push('ready')
            resolve(result)
        })
        wxJsdk.error(error => {
            hasConfiged.push('error')
            customLog('wx_config_error', {
                SIGN_PATH,
                err_msg: error.errMsg,
                api_url: url,
                current_url: window.location.href,
                current_search: window.location.search.slice(1)
            })
            reject(error)
        })
    })
}

export async function getWxConfig(jsApiList = []) {
    const { os = {} } = getDeviceInfo() || {}
    const env = await runningEnv()
    let newApiList = [...jsApiList]
    if (os.ios) {
        jsApiList.push('openLocation')
        newApiList = Array.from(new Set([...defaultApiList, ...jsApiList]))
    }

    let wxLocation = window.location
    let PATH = wxLocation.pathname + wxLocation.search
    if (os.ios || env.isMiniWebView) {
        PATH = getEnterLocation()
    }
    console.warn('jssdk getWxConfig', { PATH, os, wxLocation, newApiList, togglePath })
    // 只考虑了history模式，没有考虑hash，模式；安卓下当前页面的url
    try {
        await configByPath(PATH, newApiList, os)
    } catch (error) {
        console.warn('getWxConfig error', error)
    }
    return wxJsdk
}


export default getWxConfig
```

## 踩坑问题

### url上有特殊字符如@符号等

安卓可以正常调起jssdk,但是ios不行

原因：这里特殊处理@符的原因，当我们直接通过带@符的链接访问时，如https://my-test.com.cn/?tenant_code=hzzhongxadmin@cdkqqf1407307954，浏览器会转换成https://my-test.com.cn/?tenant_code=hzzhongxadmin%40cdkqqf1407307954，因为@属于特殊字符；但是我们通过location.search取值的时候又是包含的@，而不是转义后的%40；这就导致我们通过/api/site/wxapi接口传递的SIGN_PATH是hzzhongxadmin%40cdkqqf1407307954，然后接口在结一次码，最终配置的链接就成了https://my-test.com.cn/?tenant_code=hzzhongxadmin@cdkqqf1407307954带@符号的，而此时实际上链接已经被浏览器转换成了https://my-test.com.cn/?tenant_code=hzzhongxadmin%40cdkqqf1407307954不带@符号的，所以微信jssdk会报invalid signature错误；

解决方法：就是判断如果是直接通过包含@符号的链接访问，就需要对最终传到接口的SIGN_PATH内的@符进行两次encode，这样接口解码一次就ok了

```js
if (os.ios && path.indexOf('@') > -1) {
    const temp = path.split('@')
    SIGN_PATH = `${encodeURIComponent(temp[0].substring(1))}${encodeURIComponent(encodeURIComponent('@'))}${encodeURIComponent(temp[1])}`
} else {
    SIGN_PATH = encodeURIComponent(path.substring(1))
}
```

### url内的query参数有json对象，且json对象内有不止一对key

安卓不可以正常调起jssdk，ios可以正常调起

原因：也是编码与解码的问题
解决方案：特殊处理json对象内逗号

### ios跳转到一个外链之后，通过返回键返回

安卓下正常，ios下调不起jssdk

原因：ios下通过返回键返回没有重新刷新页面及执行js代码；导致入口url变成了返回到的这个页面，而不是最开始的url
解决：通过pageshow事件，监听页面是否返回，如果是的话，重新更新入口url

```js
function pageShowHandle (e) {
    console.log('e', e.persisted, window.performance.navigation.type)
    if (e.persisted && (window.performance && window.performance.navigation.type == 2)) {
        setEnterLocation()
        hasConfiged.length = 0
    }
}

function listenPageShow () {
    const { os = {} } = getDeviceInfo() || {}
    if (!(os.ios && isWechat)) return
    // @TODO 解决ios下通过location.href跳转的链接，通过返回键返回不重新加载页面bug
    window.removeEventListener('pageshow', pageShowHandle)
    window.addEventListener('pageshow', pageShowHandle, false)
}
```

### 微信jssdk,error与ready方法都执行，并且执行顺序不确定

原因：wx.config是异步的，在调用config之后ready方法都会执行，而error会在错误的时候被调用，且执行顺序不固定
解决：不能勇敢一个变量来判断是成功还是失败，可以通过一个数据来判断，通过在ready及error方法内都push一次值，然后通过数组长度即可判断此次config是成功还是失败

```js
wxJsdk.config({
    debug: !!query.debug,
    appId,
    timestamp,
    nonceStr,
    signature,
    jsApiList
})

await new Promise((resolve, reject) => {
    wxJsdk.ready(result => {
        hasConfiged.push('ready')
        resolve(result)
    })
    wxJsdk.error(error => {
        hasConfiged.push('error')
        reject(error)
    })
})
```

### 公众号开放平台配置js安全域名

如果有其它的公众号被授权管理在开发平台，需要在开发平台配置js安全域名；另外配置安全域名的时候最好配置根域名，这样所有子域名都可以使用

![image](https://user-images.githubusercontent.com/20950813/79550059-6dac9f00-80ca-11ea-9264-eefb28fdca5d.png)

### ios下单页应用url保持不变

原因：ios下单页应用url保持不变，安卓单页应用url切换时变化
解决方法：ios下成功一次之后就可以不在调用，安卓每次重新获取配置参数并调用config

### 签名url与当前url不一致，导致config失败，这在调试过程中90%

这个需要判断环境，然后在根据签名接口传入的path与接口拿去签名的最终返回的path及入口location、当前location这个四个值去比较判断，只有一致时，config才会成功

## 项目内封装
最终代码如下所示

```js

let wxJsdk = require('./wxapi').default

const act_type = `${window.location.origin}/`

const defaultApiList = ['checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'getLocation', 'openLocation', 'chooseImage', 'uploadImage']

const hasConfiged = []

function pageShowHandle (e) {
    console.log('e', e.persisted, window.performance.navigation.type)
    if (e.persisted && (window.performance && window.performance.navigation.type == 2)) {
        setEnterLocation()
        hasConfiged.length = 0
    }
}

function listenPageShow () {
    const { os = {} } = getDeviceInfo() || {}
    if (!(os.ios && isWechat)) return
    // @TODO 解决ios下通过location.href跳转的链接，通过返回键返回不重新加载页面bug
    window.removeEventListener('pageshow', pageShowHandle)
    window.addEventListener('pageshow', pageShowHandle, false)
}

try {
    listenPageShow()
} catch (error) {
    console.log('error listenPageShow', error)
}

async function configByPath(path, jsApiList, os) {
    // ios下只需要执行一次config即可
    const againConfig = hasConfiged.length && hasConfiged.length < 2 && os.ios

    if (!path || againConfig) return

    hasConfiged.length = 0

    let SIGN_PATH = ''

    if (os.ios && path.indexOf('@') > -1) {
        const temp = path.split('@')
        SIGN_PATH = `${encodeURIComponent(temp[0].substring(1))}${encodeURIComponent(encodeURIComponent('@'))}${encodeURIComponent(temp[1])}`
    } else {
        SIGN_PATH = encodeURIComponent(path.substring(1))
    }
    const query = qs.parse(window.location.search.substr(1))
    const token = brokerToken || query.token
    const res = await http.get('/api/xxx/wxapi&act=jsapi', {
        params: {
            path: SIGN_PATH,
            token,
            act_type
        }
    })
    const { appId, timestamp, nonceStr, signature, url } = res
    wxJsdk.config({
        debug: !!query.debug,
        appId,
        timestamp,
        nonceStr,
        signature,
        jsApiList
    })

    await new Promise((resolve, reject) => {
        wxJsdk.ready(result => {
            hasConfiged.push('ready')
            resolve(result)
        })
        wxJsdk.error(error => {
            hasConfiged.push('error')
            customLog('wx_config_error', {
                SIGN_PATH,
                err_msg: error.errMsg,
                api_url: url,
                current_url: window.location.href,
                current_search: window.location.search.slice(1)
            })
            reject(error)
        })
    })
}


export async function getWxConfig(jsApiList = []) {
    const { os = {} } = getDeviceInfo() || {}
    const env = await runningEnv()
    let newApiList = [...jsApiList]
    if (os.ios) {
        jsApiList.push('openLocation')
        newApiList = Array.from(new Set([...defaultApiList, ...jsApiList]))
    }

    let wxLocation = window.location
    let PATH = wxLocation.pathname + wxLocation.search
    if (os.ios || env.isMiniWebView) {
        PATH = getEnterLocation()
    }
    console.warn('jssdk getWxConfig', { PATH, os, wxLocation, newApiList, togglePath })
    // 只考虑了history模式，没有考虑hash，模式；安卓下当前页面的url
    try {
        await configByPath(PATH, newApiList, os)
    } catch (error) {
        console.warn('getWxConfig error', error)
    }
    return wxJsdk
}


export default getWxConfig

export async function initShare(shareConfig) {
    const apis = ['checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ']
    const { os = {} } = getDeviceInfo() || {}
    if (os.ios) {
        apis.push('openLocation')
    }
    try {
        const wxconf = await getWxConfig(apis)
        const config = {
            title: '',
            desc: '',
            link: '',
            imgUrl: '',
            success() {
                console.log('success')
            },
            fail(e) {
                console.log('fail', e)
            },
            cancel() {
                console.log('cancel')
            },
            ...shareConfig
        }
        wxconf.onMenuShareTimeline(config)
        wxconf.onMenuShareAppMessage(config)
        wxconf.onMenuShareQQ(config)
    } catch (e) {
        console.log(e)
    }
}

export async function getCurrentLocation() {
    return new Promise(async (resolve, reject) => {
        try {
            const wx = await getWxConfig(['getLocation'])
            wx.getLocation({
                type: 'wgs84', // wgs84: gps坐标、 gcj02: 火星坐标
                success: resolve,
                error: reject,
            })
        } catch (e) {
            resolve(defaultCoords)
        }
    })
}

export async function uploadImage() {
    const wx = await getWxConfig(['chooseImage', 'uploadImage'])

    const imageArr = []
    wx.chooseImage({
        count: that.maximum, // 微信允许最大9张
        sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: async res => {
            if (res) {
                const { localIds } = res
                const serverIdArr = []
                for (let i = 0; i < localIds.length; i += 1) {
                    // 只能一张传完，才能传下一张，不能使用promise.all
                    try {
                        const temp = await that.wxUploadImage(localIds[i])
                        serverIdArr.push(temp.serverId)
                    } catch (error) {
                        console.error('error', error)
                    }
                }
                if (!serverIdArr.length) return
                showLoading({
                    title: ' ',
                    position: 'absolute',
                    transition: 'none'
                })
                const uploadUrl = that.isRegistComponent ? '/api/site/upload-wx-file-without-login' : '/api/broker/index/upload-wx-file'
                http.get(uploadUrl, {})
            }
        },
        fail: err => {
            console.warn(err)
        }
    })
}

export async function openLocation() {
    const wx = await getWxConfig(['openLocation'])
    wx.openLocation({
        latitude, // 要去的纬度-地址
        longitude, // 要去的经度-地址
        name: this.houseDetail.lp_name,
        address: this.houseDetail.lp_name,
        scale: 15
    })
}

```

微信jssdk难点还是在调试上面，常见的问题有签名失败、url不匹配、js安全域名未配置、config配置成功，但是实际分享失败、url上的对象参数等问题，所以碰到问题，找准方向，耐心调试即可；

参考文档

https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html
https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/Official_Accounts/js_sdk_instructions.html
https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/how_to_apply.html
