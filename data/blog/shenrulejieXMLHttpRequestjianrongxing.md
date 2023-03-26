---
  title: 深入了解XMLHttpRequest兼容性
  date: 2020-02-19T14:56:27Z
  lastmod: 2020-02-29T09:19:21Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

XMLHttpRequest ie9+

XMLHttpRequest ie9中不支持CORS

XDomainRequest 兼容ie9中XMLHttpRequest不支持CORS的场景；但是XDomainRequest也有以下限制

- 只支持 GET 和 POST mehtod
- XDomainRequest 不支持带 cookie
- XDomainRequest 不能设置 responseType, 通信双方需要约定数据格式
- XDomainRequest 的响应没有 response status code

所以现在如果场景不需要支持到ie9，那么使用XMLHttpRequest完全足够；像axios最新版本目前兼容性就是从ie10+起

如果要兼容到ie9，且有跨域那么就需要借助XDomainRequest来实现了；

另外fetch的polyfill就是通过XMLHttpRequest对象来实现的；

whatwg-fetch目前作为fetch的常用polyfill库，最新版本兼容性ie10+起

然后我们看下axios兼容ie9的版本,如0.18.0，只保留关键代码

```
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();
    var loadEvent = 'onreadystatechange';
    var xDomain = false;

    // For IE 8/9 CORS support
    // Only supports POST and GET calls and doesn't returns the response headers.
    // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.
    if (process.env.NODE_ENV !== 'test' &&
        typeof window !== 'undefined' &&
        window.XDomainRequest && !('withCredentials' in request) &&
        !isURLSameOrigin(config.url)) {
      // 借助XDomainRequest对象来实现跨域GET|POST请求
      request = new window.XDomainRequest();
      loadEvent = 'onload'; // 监听的load
      xDomain = true;
      // 需要定义onprogress、ontimeout监听函数，避免ie下过快的终止请求
      request.onprogress = function handleProgress() {};
      request.ontimeout = function handleTimeout() {};
    }

    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request[loadEvent] = function handleLoad() {
      if (!request || (request.readyState !== 4 && !xDomain)) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        // IE sends 1223 instead of 204 (https://github.com/axios/axios/issues/201)
        status: request.status === 1223 ? 204 : request.status,
        statusText: request.status === 1223 ? 'No Content' : request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add withCredentials to request if needed
    if (config.withCredentials) {
      request.withCredentials = true;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    if (requestData === undefined) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};
```

在看下wathwg-fetch的0.11.1源码，只保留关键代码

```
self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      
      // 都没有去使用 XDomainRequest进行跨域请求兼容
      var xhr = new XMLHttpRequest()

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
```

### 总结：

1. XMLHttpRequest的兼容性ie9+，但是ie9下不支持CORS

2. axios兼容ie9与不兼容ie9的区别就在是否通过XDomainRequest来支持ie9中的CORS

3. wathwg-fetch是fetch的polyfill库，源码内也是通过XMLHttpRequest来进行模拟

4. XDomainRequest为了确保安全构建，采用了多种方法。安全协议源必须匹配请求的URL。（http到http，https到https）。如果不匹配，请求会报“拒绝访问”的错误。被请求的URL的服务器必须带有 设置为（“*”）或包含了请求方的Access-Control-Allow-Origin的头部

5. 如果多个XDomainRequests同时被发送，一些请求可能会丢失，为避免这种情况，xdr.send()的调用应被包裹在setTimeout方法中

参考链接
https://developer.mozilla.org/zh-CN/docs/Web/API/XDomainRequest
https://github.com/github/fetch
https://github.com/github/fetch/issues/326
https://github.com/github/fetch/issues/214
https://github.com/axios/axios
https://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
