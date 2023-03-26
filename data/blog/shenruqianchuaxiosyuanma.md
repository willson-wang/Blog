---
  title: 深入浅出axios源码
  date: 2019-05-23T14:12:29Z
  lastmod: 2023-03-26T09:27:28Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

## 目录：
一. 现有ajax请求库及方法的对比
二. axios常用的使用方式举例
三. axios源码分析
四. 通过了解axios源码之后，我们可以做哪些业务场景的优化
五. axios有哪些值得借鉴的地方
六. 总结

### 一、现有ajax请求库及方法的对比

![image](https://user-images.githubusercontent.com/20950813/58420552-27201180-80c0-11e9-81ff-ee7905ab53d9.png)


![image](https://user-images.githubusercontent.com/20950813/58420497-035ccb80-80c0-11e9-94a1-2a28cfdc8f50.png)

### 二、axios常用的使用方式举例

第一种方式，axios(config)
```
axios({
  method: 'post',
  url: '/user/12345',
  data: {
    firstName: 'Fred',
    lastName: 'Flintstone'
  }
});
```

第二种方式，axios(url[, config])，这时会默认为get请求
```
axios('/user/12345');
```

第三种方式，axios.get(url[, config])
```
axios.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  })
  .then(function () {
    // always executed
  });
```

第四种方式axios.post(url[,data[, config]])
```
axios.post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

第五种方式axios.request(config)
```
axios.request({
  method: 'get',
  url: 'http://bit.ly/2mTM3nY',
  responseType: 'stream'
})
  .then(function (response) {
    response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
  });
```

创建自定义实例，并添加拦截器
```
// 添加实例默认参数
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: {'X-Custom-Header': 'foobar'}
});

// 添加实例默认参数
instance.defaults.timeout = 2500;

// Add a request interceptor
axios.interceptors.request.use(function (config) {
    // Do something before request is sent
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

// Add a response interceptor
axios.interceptors.response.use(function (response) {
    // Do something with response data
    return response;
  }, function (error) {
    // Do something with response error
    return Promise.reject(error);
  });

axios.post('/user', {
    firstName: 'Fred',
    lastName: 'Flintstone'
  }, {
    headers: {
       // 指定本次请求的头信息
       Content-Type: 'application/x-www-form-urlencoded; charset=utf-8'
    }
})
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  });
```

#### 通过使用axios我们可能会有下面几个疑问？

1. 为什么axios可以直接调用，即axios({})
2. 拦截器是怎么实现的
3. 怎样实现跨平台兼容的，即兼容浏览器端与node端
4. 怎样去实现取消请求的
5. post请求默认是application/json，如果要发送表单请求改怎么做
6. 请求参数转换器及响应结果转换器做了哪些事？
7. 为什么可以防止XSRF

然后让我们带着疑问，去源码内一探究竟；

### 三、axios源码分析

在分析源码之前在回顾一下一些关于XMLHttpRequest的基础知识

#### request header

在发送Ajax请求（实质是一个HTTP请求）时，我们可能需要设置一些请求头部信息，比如content-type、connection、cookie、accept-xxx等。xhr提供了setRequestHeader来允许我们修改请求 header，然而我们一般最关注content-type这个请求头属性的值；

如果不主动设置content-type，那么content-type会根据xhr.send(data)中data参数的数据类型来content-type的默认值

- 如果data是 Document 类型，同时也是HTML Document类型，则content-type默认值为text/html;charset=UTF-8;否则为application/xml;charset=UTF-8；

- 如果data是 DOMString 类型，content-type默认值为text/plain;charset=UTF-8；

- 如果data是 FormData 类型，content-type默认值为multipart/form-data; boundary=[xxx]

- 如果data是其他类型，则不会设置content-type的默认值

另外关于request header需要注意的是

- 方法的第一个参数 header 大小写不敏感，即可以写成content-type，也可以写成Content-Type，甚至写成content-Type;

- setRequestHeader必须在open()方法之后，send()方法之前调用，否则会抛错；

- setRequestHeader可以调用多次，最终的值不会采用覆盖override的方式，而是采用追加append的方式。下面是一个示例代码

```
client.setRequestHeader('X-Test', 'one');
client.setRequestHeader('X-Test', 'two');
// 最终request header中"X-Test"为: one, two
```

#### xhr.responseType

responseType是xhr level 2新增的属性，用来指定xhr.response的数据类型


值 | xhr.response 数据类型 | 说明
-- | -- | --
"" | String字符串 | 默认值(在不设置responseType时)
"text" | String字符串
"document" | Document对象 | 希望返回 XML 格式数据时使用
"json" | javascript 对象 | 存在兼容性问题，IE10/IE11不支持
"blob" | Blob对象
"arrayBuffer" | ArrayBuffer对象

#### xhr.withCredentials与 CORS 什么关系

我们都知道，在发同域请求时，浏览器会将cookie自动加在request header中。而在发送跨域请求时，cookie并没有自动加在request header中。

造成这个问题的原因是：在CORS标准中做了规定，默认情况下，浏览器在发送跨域请求时，不能发送任何认证信息（credentials）如"cookies"和"HTTP authentication schemes"。除非xhr.withCredentials为true（xhr对象有一个属性叫withCredentials，默认值为false）。

所以根本原因是cookies也是一种认证信息，在跨域请求中，client端必须手动设置xhr.withCredentials=true，且server端也必须允许request能携带认证信息（即response header中包含Access-Control-Allow-Credentials:true），这样浏览器才会自动将cookie加在request header中。

#### axios源码目录，以最新的0.19.0-beta.1版本进行分析

```
adapters
	http.js
                 支持node平台发送http请求
	xhr.js
                 支持浏览器端发送ajax请求
cancel
	Cancel.js
                 取消原因的类
	CancelToken.js
                 发起取消请求的类
	isCancel.js
core
	Axios.js
		defaults及interceptors两个实例属性
		request、getUri、delete、get、post等原型方法
	createError.js
		创建Error实例，并返回经过enhanceError方法处理后的Error实例
	dispatchRequest.js
		调用combineURLs方法，返回拼接后的请求URL
		调用transformData方法，通过传入的transformRequest方法处理传入的Data及header
		扁平化头信息、通过merge方法合并config.headers.common、config.headers[config.method]、config.headers的头信息
		通过adapter发起ajax请求
	enhanceError.js
		对传入的Error实例上添加报错时，能够获取到的属性与方法
	interceptorManager.js
                拦截器构造函数、包含use、eject、forEach方法
	mergeConfig.js
                合并config
	settle.js
		校验返回状态码，// 如果没有validateStatus方法，获取validateStatus方法返回true，则resolve返回值，否则reject
	transformData.js
                转化数据
hlepers
	bind.js
	bindURL.js
	combineURLS.js
		返回拼接baseURL+relativeURL后的URL
	cookies.js
	deprecatedMethod.js
	isAbsoluteURL.js
	isURLSameOrigin.js
	normalizeHeaderName.js
		判断传入的header头属性是否规范，如Accept、Content-Type，如果不规范，则添加规范属性，删除不规范属性key
	parseHeaders.js
	spread.js
axios.js
	通过createInstance创建一个axios实例，并暴露出去
	在axios这个实例上添加了Axios、create、Cancel、CancelToken、all、spread方法
defaults.js
	默认参数
utils.js 

```

#### axios的运行简图

![image](https://user-images.githubusercontent.com/20950813/58484637-0aa1d900-8195-11e9-8fe7-89884050983d.png)


#### 从暴露出的axios的axios.js入口看起，在看axios.js之前需要先看下工具方法utils.js，因为axios.js内有用到这个extend、merge这几个工具方法

```
// 函数绑定上下文
function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

/**
 * 自定义forEach，允许遍历数组跟对象
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
*  合并对象，将obj2, obj3...后面对象内的属性和方法复制到obj1内，后面覆盖前面的值
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = merge(result[key], val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * 深复制对象，即避免复制对象的引用，如obj1={a: 'a'},obj2={b: {name: 'jack'}},当obj2的b属性复制给obj1的时候，避免复制b属性的引用
 */
function deepMerge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = deepMerge(result[key], val);
    } else if (typeof val === 'object') {
      result[key] = deepMerge({}, val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * 将b上的属性跟方法复制到a上来，如果传入了第三个参数，那边还需要对b的方法绑定上下文关系
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}
```

```
// 创建axios实例的方法
function createInstance(defaultConfig) {
  // 调用Axios构造函数创建实例
  var context = new Axios(defaultConfig);

  // 将Axios原型上的request方法，绑定上下文为context实例，并返回
  var instance = bind(Axios.prototype.request, context);

  // 将Axios原型上的方法，如get、post、delete等原型方法和属性拓展到上面的instance函数上，如果是
  // 函数则绑定上下文为context
  utils.extend(instance, Axios.prototype, context);

  // 将Axios实例属性copy到instance方法上，主要有两个，一个是defaults，一个是interceptors
  utils.extend(instance, context);

  // 最后在返回这个绑定了上下文关系的函数
  return instance;
}

// 传入默认的defaults参数，创建暴露出去的axios函数，默认配置项是defaults，我们可通过
// axios.defaults.xxx or instance.defaults.xxx来修改
var axios = createInstance(defaults);

// 将Axios构造函数暴露出去
axios.Axios = Axios;

// 暴露创建axios函数的create方法，便于创建自定义的axios函数
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// 暴露取消请求的相关函数
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
```
#### 小结一下，axios.js内主要做了哪些事情

1. 定义了一个创建函数的createInstance方法，该方法内去做了创建Axios实例，将Axios.prototype.request原型上的方法，绑定上下文，并返回request函数；将Axios.prototype原型上的方法，复制到request方法上，并且给方法绑定上下文；将实例属性复制到request方法上；并最终返回request这个方法；
2. 通过createInstance即默认的defaults创建了一个axios方法，并将axios方法暴露出去
3. 将取消请求相关的方法如CancelToken，添加到axios方法上，便于执行cancel操作


#### 再来看下初始化Axios实例时传入的默认参数defaults，都定义在defaults.js内

```
// 设置请求头'Content-Type'常量
var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

// 当headers头信息不为空，且header头信息内没有设置Content-Type，设置为传入的value
function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

// 根据当前运行的环境获取默认的适配器
function getDefaultAdapter() {
  var adapter;
  // Only Node.JS has a process variable that is of [[Class]] process
  if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  } else if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    // 规范化Accept及Content-Type两个参数，如把传入的content-type删掉，并替换成Content-Type
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
 
    // 如果传入的data是formData等类型，则直接返回，且会删除header头内的Content-Type属性，让浏览 
    // 器自动设置
    if (utils.isFormData(data)
    ) {
      return data;
    }

    // 如果传入的data参数是URLSearchParams类型，则将请求头设置为表单请求头，即我们post如果需要发送表单请求，如果不主动设置Content-Type则需要传入的data参数是URLSearchParams类型，一般使用qs.stringify(data)
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }

    // 如果传入的参数就是纯对象，则设置Content-Type为'application/json'，即之前说到的axios，post默 
    // 认json形式
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    // 将字符串转换为json
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

// 默认公共的接收格式为json数据
defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

// 'delete', 'get', 'head'默认的方法头信息为空
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

// 'post', 'put', 'patch'方法的头信息设置了一个'Content-Type': 'application/x-www-form-urlencoded'，
// 这里会有一个疑问，就是我这里都设置了表单头，为什么会是json请求内，因为在最终发送的时候，
// 做了一次头header信息合并，config.headers >> config.headers[config.method] >> config.headers.common

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});
```

#### 小结一下default.js内定义了哪些默认参数

1. adapter默认适配器
2. transformRequest默认请求数据转换器，处理Content-Type头信息/transformResponse响应数据转换器，返回json数据
3. 添加防xsrf攻击的请求头
4. 校验xhr返回状态码的validateStatus方法

#### 通过new Axios创建了Axios实例，那么看下Axios.js内做了些什么

```
/**
 * 定义Axiose构造函数，需要传入一个Config参数
 */
function Axios(instanceConfig) {
  // 添加defaults实例属性，存放config配置参数，所有我们可以通过axios.defaults.xxx = xxx来改变配置项
  this.defaults = instanceConfig;
  
  // 添加拦截器数组，即我们可以通过axios.interceptors.request.use(() => {}, () => {})添加拦截器
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * createInstance内绑定了上下文关系的原型request方法
 */
Axios.prototype.request = function request(config) {
  // 支持axios(‘url'[, config]) 的形式
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }
 
  // 合并单个请求时传入的config与创建Axios实例时的config
  config = mergeConfig(this.defaults, config);
  
  // 默认get方法
  config.method = config.method ? config.method.toLowerCase() : 'get';

  // 定义一个chain数组，连接拦截器中间件，两个值的目的是，对应promise.then()方法的两个回调
  var chain = [dispatchRequest, undefined];

  // 返回一个状态为fullfiled的promise
  var promise = Promise.resolve(config);

  // 遍历添加的请求拦截器数组，并压入到chain数组前面
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  // 遍历添加的响应拦截器数组，并压入到chain数组后面
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  // 到这里时，chain数组可能的值为[request[1].fulfilled, request[1].rejected, request[0].fulfilled, 
 // request[0].rejected, dispatchRequest, undefined, response[0].fulfilled, response[0].rejected, 
 // response[1].fulfilled, response[1].rejected]

 // 遍历chain数组，直到数组为空为止
 // 最终生成的promise链为：
 // Promise.resolve(config)
 //     .then(request[1].fulfilled, request[1].rejected)
 //     .then(request[0].fulfilled, request[0].rejected)
 //     .then(dispatchRequest, undefined)
 //     .then(response[0].fulfilled, response[0].rejected)
 //     .then(response[1].fulfilled, response[1].rejected)
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }
  返回最终的promise
  return promise;
};

// 更简单的实现
return chain.reduce((crr, promise) => {
      return crr.then(chain.shift(), chain.shift())
 }, Promise.resolve(config))

// 在Axios原型上定义'delete', 'get', 'head', 'options'方法，里面调用的还是request方法
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

// 在Axios原型上定义'post', 'put', 'patch'方法，里面调用的还是request方法
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});
```

#### 看一张示意图
![image](https://user-images.githubusercontent.com/20950813/58381464-eb1d7b80-7fef-11e9-9420-389c02c98a38.png)

#### 小结一下，Axios.js内主要做了哪些事情

1. 定义了Axios构造函数，并添加了defaults，及interceptors两个实例属性，interceptors实例属性是通过InterceptorManager构造器实例化而来；
2. Axios原型上定义了request方法，该方法内做了传入的config参数合并，及生成promise链，确保请求时的执行顺序为axios请求->请求拦截器->dispatchRequest->响应拦截器->请求结束；为什么能够保证顺序，这是由promise的特性决定的，每个then方法内返回的都是一个新的promise对象，且只有当前promise的状态由pedding变更为fulfilled or rejected才会执行到下一个then or catch方法内；所以我们在拦截器内是可以做同步or异步操作的，如果我们直接在请求拦截器内reject，则接口不会发起请求；
3. 在Axios原型上定义了'delete', 'get', 'head', 'options','post', 'put', 'patch'六个方法，允许传入不同的参数个数，也就是我们最开始提到的，为什么会有那么多种写法，里面都是调用的request方法；


#### 接着看一下生成拦截器实例的InterceptorManager构造函数，在InterceptorManager.js内

```
// 定义构造函数，添加handlers一个实例属性
function InterceptorManager() {
  this.handlers = [];
}

/**
 * 定义原型use方法，允许通过use方法来注册fulfilled及rejected回调函数，并返回一个number，同于注销添加的拦截器
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * 定义原型eject方法，允许注销之前定义的某个拦截器，传入的参数就是调用use注册时，返回的number
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * 遍历添加的拦截器数组，跳过注销了的拦截器，用在request方法内
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};
```

#### 小结一下，InterceptorManager.js内做了什么事情

1. 定义了InterceptorManager构造函数，并有一个实例属性handlers
2. 定义了原型方法use，允许通过use方法来注册拦截器，并返回一个number_id作为注册当前拦截器的id
3. 定义了原型方法eject，允许通过id注销某个注册了的拦截器；
4. 定义了原型方法forEach，遍历添加的拦截器数组，跳过注销了的拦截器，用在request方法内

#### 然后我们在回过头来看dispatchRequest方法，在dispatchRequest.js内

```
/**
 *  判断是否执行了cancel操作
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    // 调用的是CancelToken原型上的throwIfRequested方法，判断this.reason是否有值来终止请求
    config.cancelToken.throwIfRequested();
  }
}

/**
 * 根据 adapter发起一个请求
 */
module.exports = function dispatchRequest(config) {
  // 如果xhr请求之前执行了cancel方法，则直接取消当前请求
  throwIfCancellationRequested(config);

  // 支持baseUrl的配置，拼接成决定路径
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  }

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers，所以从这里可以看出header配置参数的优先级config.headers >> config.headers[config.method] >> config.headers.common
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );

  // 删除方法header及common header头属性
  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    // 如果cacel方法在xhr执行成功之后执行，则直接返回取消的原因
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};
```

#### 小结一下dispatchRequest.js内做了哪些事情

1. 请求之前通过throwIfCancellationRequested方法判断是否需要执行取消当前请求的操作
2. Transform request data，根据data传入的参数，来设置相应的Content-Type属性
3. 合并header头信息，并删除不需要用到的header属性
4. 使用adapter发起请求，成功回调内在通过throwIfCancellationRequested方法判断是否执行了取消cancel操作；Transform response data 返回json数据，并最终返回整个response；失败回掉内则根据isCancel是否取消了，来拼接失败返回的reason对象


#### dispatchRequest.js用到了adapter去发起请求，前面adapter属性会根据当前的运行环境去加载不同的适配器，我们已xhr.js为例

```
function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {

    // 如果传入的data是FormData类型，则删除Content-Type属性，让浏览器自行设置
    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; 
    }
    // new 一个能够发起ajax的XMLHttpRequest实例，XMLHttpRequest方法支持ie11+
    var request = new XMLHttpRequest();

    // 调用buildURL去拼接url上的query参数
    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

    // 设置请求超时时间
    request.timeout = config.timeout;

    // 监听state状态
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // 如果支持getAllResponseHeaders方法就使用getAllResponseHeaders方法解析header属性
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
     // 取接口返回值
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };
     
     // 根据validate方法来决定是执行resolve还是reject
      settle(resolve, reject, response);

      // 清掉本次request
      request = null;
    };

    // 监听请求取消onabort事件
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // 监听请求错误onerror事件
    request.onerror = function handleError() {
      // 通常浏览器会隐藏真正的错误只有在网络错误时才会触发错误事件
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // 监听请求超时ontimeout事件
    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // 标准浏览器下添加 xsrf header
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies');

      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // 通过setRequestHeader方法设置头信息
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        // 处理不需要Content-Type头属性的get等请求
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // 是否允许添加跨域cookie
    if (config.withCredentials) {
      request.withCredentials = true;
    }

    // 监听下载进度onDownloadProgress事件
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // 监听上传onUploadProgress 事件，注意下载事件是在xhr对象上，上传事件在xhr.upload对象上
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }
    
    // 是否开启了取消token操作
    if (config.cancelToken) {
      // 等待cancel方法执行，保证发出请求之后，可以通过abort方法终止本次请求
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }
    // 兼容get请求
    if (requestData === undefined) {
      requestData = null;
    }

    // 添加data参数
    request.send(requestData);
  });
};
```
#### 小结一下xhr.js内做的事情

1. 封装来一个xhrAdapter方法，该方法返回一个promise;
2. new XMLHttpRequest一个实例，进行ajax请求，注意这里已经没有去兼容ie11以下的版本了；
3. 监听了一些常用的事件，添加了xsrf header，放在xsrf攻击；
4. 通过withCredentials参数是否允许携带跨域cookie;
5. 通过config.cancelToken是否有值来判断是否开启来取消请求的功能，通过config.cancelToken也就是CancelToken的promise实例属性的then方法内执行abort操作


#### 最后让我们在看下axios内的取消请求是怎么实现的，源码在cancel目录下，主要看CancelToken.js
```
/**
 * 定义一个CancelToken构造函数，该构造函数会有promise，及reason两个属性，一个用于xhr发起前取消请求，一个用于xhr进行的时候取消操作
 */
function CancelToken(executor) {
  // 确保传入的参数一定是一个函数
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  // 创建一个promise，并把resolve方法赋值给一个变量
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  // 传入的回调函数执行的时候，传入cancel这个方法，取消实现的核心就是这个cancel函数，cancel函数什么时候执行，则什么时候取消
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }
    // 设置实例属性reason
    token.reason = new Cancel(message);
    // 将上面创建的promise状态，由pedding改为fulfilled,并可以将token.reason传给后面的then方法
    resolvePromise(token.reason);
  });
}

/**
 * 判断this.reason是否有值来判断是否执行来取消操作
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * 返回一个包含了CancelToken实例及执行函数cancel的对象，用于开启及执行取消操作
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  // 即我们通过CancelToken.source().token来开启取消操作
  // 通过CancelToken.source().cancel来执行取消操作
  return {
    token: token,
    cancel: cancel
  };
};
```

#### 小结一下取消实现的逻辑：
1. 取消需要创建一个CancelToken实例，实例化时传入的参数必须是一个函数，执行该函数的时候会传入一个cancel函数参数；
2. 在cancel函数参数内对reason赋值，并执行实例属性promise的resolve方法；所以执行cancel函数才是执行取消操作；
3. 取消请求一是通过判断this.reason是否有值来进行判断；另一个是在实例属性promise.then内执行abort操作

```
let cancel
axios({
    method:'get',
    url:'/api/test',
    params: {
        pageIndex: 1,
    },
    cancelToken: new CancelToken(function executor(c) {
        cancel = c
    })
})
.then(function (response) {
    console.log('response', response)
}).catch((err) => {
    console.log('err', err);
});
setTimeout(() => {
    cancel('Operation canceled by the xiaoming')
}, 0)
```

#### 到这里整个axios的内部实现基本已经阅读完毕，我们在回答下最开始的几个疑问

1. 为什么axios可以直接调用，即axios({})
因为在axios是一个通过createInstance方法创建的函数，axios实际上就是Axios.prototype.request.bind(new Axios)，所以axios可以直接调用

2. 拦截器是怎么实现的
通过chian数组去维护一个按顺序排列的函数数组，然后通过while循环，将数组元素，两两一组的方式，传入promise.then方法内分别作为fullfiled及rejected函数，最后返回一个promise对象

3. 怎样实现跨平台兼容的，即兼容浏览器端与node端
通过分别定义支持浏览器端的xhr.js与支持node端的http.js文件，然后通过但前运行的环境，加载对应的适配器

4. 怎样去实现取消请求的
通过`new CancelToken((c) => {cancel = c})`实例，并传入一个函数参数，并在这个函数参数执行的时候，传入一个cancel函数，把取消的触发器赋值给一个外部变量，通过执行这个外部变量，来达到取消请求的目的；

5. post请求默认是application/json，如果要发送表单请求该怎么做
两种方式，1.传入的data参数是URLSearchParams类型，即data参数经过qs.stringgify处理，第二种方式传入`headers: {Content-Type: 'application/x-www-form-urlencoded;charset=utf-8'}`，data参数经过qs.stringgify处理；注意config.headers >> config.headers[config.method] >> config.headers.common

```
  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );
```

6. 默认的请求转换器及响应转换器做了哪些事？
transformRequest：修正header内的Accept及Content-Type的属性名，然后根据data传入的数据，修改Content-Type属性值
transformResponse：JSON.parse(data)
注意这里的transformRequest及transformResponse是数组，我们可以通过axios.defaults.transformRequest = [function () {}]来覆盖，也可通过axios.defaults.transformRequest.push(() => {})来添加自定义转换器

7. 为什么可以防止CSRF
什么是CSRF，CSRF（Cross Site Request Forgery, 跨站域请求伪造）是一种网络的攻击方式，它在 2007 年曾被列为互联网 20 大安全隐患之一
axios就是让你的每个请求都带一个从cookie中拿到的key, 根据浏览器同源策略，假冒的网站是拿不到你cookie中得key的，这样，后台就可以轻松辨别出这个请求是否是用户在假冒网站上的误导输入，从而采取正确的策略；这种方法貌似也有局限性

```
var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;
if (xsrfValue) {
        // 设置头信息'X-XSRF-TOKEN': XSRF-TOKEN
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
```

### 四、通过了解axios源码之后，我们可以做哪些业务场景的优化

1. 页面切换时，取消上个页面发出的所有请求，减少无用请求；

```
// 第一步收集取消触发器
let allCancels = []
const CancelToken = axios.CancelToken;
axios.interceptors.request.use(config=>{
   // 每个请求都添加一个cancelToken，并把cancel函数维护到一个数组内
  config.cancelToken = new CancelToken((cancel) => {     
     allCancels.push(cancel);
  });
  return config;
});
axios.interceptors.response.use(res=>{
  // do something...
  },error=>{
   if (axios.isCancel(error)) {
   // 为了终结promise链 就是实际请求 不会走到.catch(rej=>{});这样就不会触发错误提示之类了。
        return new Promise(() => {});     
   }else{
       return Promise.reject(error)
    }});

第二步在路由守卫内触发，所有的cancel触发器
router.beforeEach((to, from, next) => {
  allCancels.forEach(e=>{
      e && e()
   });
   allCancels= [];
})
```

2. 取消重复请求

```
// 定义请求数组
const requestList = []
const CancelToken = axios.CancelToken
let sources = {}
axios.interceptors.request.use((config) => {
  //将请求地址及参数作为一个完整的请求
  const request = JSON.stringify(config.url) + JSON.stringify(config.data)
  config.cancelToken = new CancelToken((cancel) => {
    sources[request] = cancel
  })
  //判断请求是否已存在请求列表，避免重复请求，将当前请求添加进请求列表数组；
  if(requestList.includes(request)){
    sources[request]('取消重复请求')
  }else{
    requestList.push(request)
  }
  return config
}, function (error) {
  return Promise.reject(error)
})

axios.interceptors.response.use(function (response) {
  // 将当前请求中请求列表中删除
  const request = JSON.stringify(response.config.url) + JSON.stringify(response.config.data)
  requestList.splice(requestList.findIndex(item => item === request), 1)
  return response
}, function (error) {
  // 4.处理取消请求
  if (axios.isCancel(error)) {
    requestList.length = 0
    throw new axios.Cancel('cancel request')
  } else {
    console.error('网络请求失败', 1000)
  }
  return Promise.reject(error)
})
```

3. 减少不必要的二次封装

```
// 多来一层无用的promise封装
function get(url, params) {
    return new Promise((resolve, reject) => {
          axios.get(url, params).then((res) => {
                resolve(res)
          }).catch((e) => {
                reject(e)
          })
    })
}

function get(url, params) {
    return axios.get(url, params))
}
```

### 五、axios有哪些值得借鉴的地方

1. 模块的划分，简单明了，每个js文件又遵循功能单一原则；

2. 拦截器的实现，借助了中间件的思路，又巧妙的运用了数组的unshif、push、shift方法、promise的特性，维持了一个可顺序执行的chain队列

3. 用于发送请求功能的处理逻辑

axios没有将用于发送请求的dispatchRequest函数视为特殊函数。实际上，dispatchRequest函数被放置在chain队列的中间，以确保队列的处理一致性并提高代码的可读性。

4. 适配器的处理逻辑

在适配器的处理逻辑中，http和xhr模块（一个用于Node.js发送请求，另一个用于浏览器发送请求）不在dispatchRequest中直接用作其自己的模块，而是在默认情况下引入通过判断当前运行的环境来引入。因此，它不仅确保了两个模块之间的低耦合，而且为将来的用户留出了定制请求发送模块的空间。如我们需要添加微信小程序的适配器等；

5. 用于取消HTTP请求的处理逻辑

在取消HTTP请求的逻辑中，axios被设计为使用Promise作为触发器，将resove函数作为参数传递给外部。它不仅可以确保内部逻辑的一致性，还避免最大程度地侵入其他模块。


### 六、总结

通过细读axios的源码，我们能够学到axios的设计，并了解其模块封装和交互思想；但是看懂了，并不代表自己学会了，所以还是需要自己去多练习，多总结。

参考链接：
https://fetch.spec.whatwg.org/#fetch-method
https://segmentfault.com/a/1190000004322487
https://github.com/camsong/blog/issues/2
