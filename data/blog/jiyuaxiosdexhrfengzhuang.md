---
  title: 基于axios的xhr封装
  date: 2018-07-10T11:29:33Z
  lastmod: 2018-07-10T11:29:44Z
  summary: 
  tags: ["原生JS", "axios", "xhr"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 常规封装

```
const http = axios.create({
	baseURL: 'https://some-domain.com/api/',
  	timeout: 1000,
  	headers: {'X-Custom-Header': 'foobar'}
})

http.interceptors.request.use((config) => {
	return config;
}, (error) => {
	return Promise.reject(error)
})

http.interceptors.response.use((response) => {
	if (response.code === 0) {
		return response.data;
	}

	return Promise.reject({
		msg: response.errMsg,
		code: response.code
	})
}, (err) => {
	return Promise.reject(err)
})


function get(url, opts = {params: {}}) {
	return new Promise((resolve, reject) => {
		// 这里直接做一些对url及传入params的处理
		http.get(url, opts).then((res) => {
			resolve(res);
		}).catch((err) => {
			// 这里可以统一处理提示错误的方式
			reject(err);
		})
	})
}

function post(url, data, opts) {
	return new Promise((resolve, reject) => {
		http.post(url, data, opts).then((res) => {
			resolve(res);
		}).catch((err) => {
			reject(err);
		})
	})
}
```

### 对参数及url处理及返回值处理的封装

```
let $httpResolve;
let apiDomain = '';

let $httpPromise = new Promise((resolve) => {
	$httpResolve = resolve;
})


if (axios) {
        // 这里可以换成任何基于axios封装的方法
	$httpResolve(axios);
}

function makeHttp(method, arg) {
	return $httpPromise
		.then(($http) => {
			return $http[method](...arg);
		})
		.then((res) => {
			if (res.data.retCode === '-1500004') {
				throw new Error('缺少参数');
			}
			return res;
		})
}

function get(...args) {
	const [url, ...rest] = args;
	return $httpPromise.then(() => {
		return makeHttp('get', [addBaseUrl(addBaseParam(url)), ...rest]);
	})
}

function post(...args) {
	const [url, ...rest] = args;
	return $httpPromise.then(() => {
		return makeHttp('post', [addBaseUrl(addBaseParam(url)), ...rest]);
	})
}


function request(...args) {
	const [url, ...rest] = args;
	return $httpPromise.then(() => {
		return makeHttp('request', [addBaseUrl(addBaseParam(url)), ...rest]);
	})
}

// 利用async函数，对返回值进行处理
const wrap = (fn) => {
	return async (...args) => {
		const res = await fn(...args);

		const { retCode, errMsg, data} = res.data;

		if (retCode === 0) {
			return data;
		}

		throw new BuildInHttpError(errMsg, retCode, res);
	}
}

function BuildInHttpError(message, retCode, data) {
	this.message = message;
  this.data = data;
  this.retCode = retCode;
}

function addBaseParam(url) {
	if(/^\/api\//.test(url)) {
		const param = {
			token: 'afsad66332',
			orgCode: 'kklhjsk'
		}
		return `${url}${url.indexOf('?') > 0 ? '&' : '?'}${Qs.stringify(param)}`
	}	
	return url;
}

function addBaseUrl(url) {
	if(/^\/api\//.test(url)) {
		return `${apiDomain}${url}`
	}
	return url;
}

export default {
	get,
	post,
	request,
	apiGet: wrap(get),
	apiPost: wrap(post),
	apiRequest: wrap(request)
}

```
