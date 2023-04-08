---
  title: xhr的使用姿势
  date: 2018-07-06T09:33:09Z
  lastmod: 2018-07-06T14:04:44Z
  summary: 
  tags: ["原生JS", "xhr"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

之前在工作中的时候，使用axios，jquery等xhr工具的时候，总是有疑问；如jquery的post请求，当请求头的content-type为'application/x-www-form-urlencoded'时，data可以直接传对象，而不需要对对象进行JSON.stringify处理，当请求头的content-type为'application/json'时，data不可以直接传对象，而是需要JSON.stringify处理；使用axios的post方法时，content-type为'application/json'时，data可以直接传对象，而不需要qs.stringify等处理；当content-type为'application/x-www-form-urlencoded'时，data又需要qs.stringify等处理；于是抽时间来总结一下

### 首先jquery也好axios也好，其它的类库也好，原理都是使用xhr对象来进行ajax请求；

```
function request () {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        const params1 = "token=acc12356&url=post-form";

        const fileEle = document.getElementById('file');
        const params2 = new FormData();
        params2.append('token', 'acc12356');
        params2.append('url', 'post-form');
        params2.append('file', fileEle.files[0]);

        const params3 = JSON.stringify({token: 'acc12356', url: 'post-form'})

        xhr.open('POST', '/post-json', true);
        
        /*
          当设置请求头为'application/x-www-form-urlencoded'时，
            1. 当参数为params1，key value对的形式，也是表单默认的参数发送方式，后端能够正常拿到值
            2. 当参数为params2，form-data的形式，后端能够正常拿到值，但是content-type不会变成multipart/form-data;
            3. 当参数为params3，对象的形式，如果不对对象进行处理，则后端收到的是{ 'object Object': '' }，如果对对象先进行JSON.stringify则后端接收到的参数是把整个对象做为了一个key的对象{ '{"token":"acc12356","url":"post-form"}': '' }
          所以如果content-type为'application/x-www-form-urlencoded'，则我们最终传入send放到的参数会被转换成字符串，form-data除外，如果字符串是key value值对的形式则后端可以正常拿到，如果不是则会把整个字符串作为key，所以如果是表单的形式来提交，需要对参数转换成key value对
        **/ 

        /*
          当设置请求头为'application/json'时，
            1. 当参数为params1，key value对的形式，也是表单默认的参数发送方式，直接报错
            2. 当参数为params2，form-data的形式，直接报错
            3. 当参数为params3，对象的形式，如果不对对象进行处理，则后端收到的是{ 'object Object': '' }，如果对对象先进行JSON.stringify则后端接收到的参数是正常的对象{ token: 'acc12356', url: 'post-form' }
          所以如果content-type为'application/json'，则我们最终传入send放到的参数会被转换成字符串，form-data除外，如果字符串是json字符串的形式则后端可以正常拿到，如果不是则会直接报错
        **/ 
        xhr.setRequestHeader('content-type', 'application/json; charset=utf-8');

        xhr.onload = function(e) { 
          if(this.status == 200||this.status == 304){
            resolve(this.responseText);
          }
        };
        
        // 如果没有设置content-type，如传入的是一个字符串则content-type会被设为text/plain;charset=UTF-8
        // 如果没有设置content-type，如传入的是一个form-data则content-type会被设为multipart/form-data; boundary=----WebKitFormBoundarygbyZU9wiB2Uc300W
        // 如果没有设置content-type，如传入的是一个对象（会被转换为[object object]），如果传入的是一个JSON字符串则会被转换为JSON对象，但是content-type会被设置为text/plain;charset=UTF-8，但是后端拿不到参数
        xhr.send(params3);
      })
    }
```

这里需要注意的是，send方法可以传入的参数有几类；content-type与send传入的参数又有什么关系；

send传入的参数有ArrayBuffer，Blob，Document，DOMString，FormData，null共6类；我们只需要了解常用的DOMString，FormData类型；

content-type与send传入的参数关系是：当content-type为'application/x-www-form-urlencoded'，这是send的参数需要是key value对这样后端才能接收到参数；当content-type为'application/json'时send的参数需要时json字符串对象，这样后端才能在req.body内获取到参数；

至于jquery的post方法，当content-type为'application/x-www-form-urlencoded'时（jquery post默认的content-type），data可以直接传对象，而不需要对对象进行JSON.stringify处理，反之的原因是，当content-type为'application/x-www-form-urlencoded'时，send方法需要传入的是key value值对，而通过jquery源码是能够看到内部是对传入的参数data有做处理的，如果传入的data是一个对象，则会转化成key,value值对，如果传入的直接是字符串是不做处理的，所以为什么jquery的post方法content-type不同时，处理data的方式不同；

```
1. jquery post content-type: 'application/x-www-form-urlencoded'

 const postFormJq = function (data) {
      return new Promise((resolve) => {
        // 默认表单请求, 这里data不需要JSON.stringify的原因与postJsonJq的是一样的
        $.post('/post-form', data, (res) => {
          resolve(res);
        });
      })
    }


2. jquery post content-type: 'application/json'

const postJsonJq = function (data) {
      return new Promise((resolve) => {
        // 单个传参数的形式，不支持修改content-type，需要传对象的形式才支持
        // $.post('/post-json', data, (res) => {
        //   resolve(res);
        // });

        $.post({
          url: '/post-json',
          data: JSON.stringify(data), // jquery直接传对象会报错的原因，是jquery内部有一段代码处理，如传入的data不是字符串，则会被转换为key value字符串对，而application/json;是不接受这种参数的，所以报错
          contentType: 'application/json; charset=utf-8',
          success: (res) => {
            resolve(res);
          }
        })
      })
    }

3. jquery get query内取参数

const getListJq = function (params) {
      return new Promise((resolve) => {
        $.get('/get-list', params, (data) => {
          resolve(data);
        });
      })
    }

4. jquery get params内取参数

const getListParamsJq = function (params) {
      return new Promise((resolve) => {
        $.get('/get-list-params/1234563/akcnal',{}, (data) => {
          resolve(data);
        });
      })
    }

```

至于axios的post方法，当content-type为'application/json'时（axios默认的content-type），data可以直接传对象，而不需要qs.stringfily处理的原因是，当content-type为'application/json'时，send方法需要传入的参数是json字符串，而通过axios源码可以发现，axios内部是对传入的data参数做了JSON.stringify处理的，所以当传入的是对象时，会进行JSON.stringify处理，如果直接传入的是字符串是不做处理的，所以为什么axios的post方法content-type不同时，处理data的方式不同；

```
1. axios post application/x-www-form-urlencoded

const postForm = function (data) {
      // 因为axios默认的content-type：application/json，所以如果我们需要使用application/x-www-form-urlencoded表单的方式来发送数据给后端的话，有以下几种方式
      // 方法一使用URLSearchParams来编码参数,当axios判断参数是,注意这种方式，通过req.body无法获取
      // const params = new URLSearchParams();
      // for (let prop in data) {
      //   params.append(prop, data[prop]);
      // }
      // console.log('params', params);
      // return axios.post('/post-form', params);

      // 第二种方法使用qs模块的stringify方法对参数进行处理
      // console.log(Qs.stringify(data));
      // return axios.post('/post-form', Qs.stringify(data));

      // 第三种方式，设置content-type,不加Qs.stringfy处理后端拿到的数据是这样的{ '{"token":"acc12356","url":"post-form"}': '' }，加了Qs.stringfy处理{ token: 'acc12356', url: 'post-form' }；使用我们在使用的时候，只需要对参数做处理了，就不需要主动去添加content-type头了

      // axios post方法内只对传入的data数据进行了JSON.stringify,所以当我们直接传入data进去的时候，会被转换成json字符串对象，而这个时候content-type如果是application/json则后端能够正常获取到参数，如果为application/x-www-form-urlencoded则后端不能正常获取到参数；这也是为什么如果是表单提交，需要对data处理转换成key value对
      return axios.post('/post-form', Qs.stringfy(data), {
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      });
    }

2. axios post 'application/json' 

const postJson = function (data) {
      return axios.post('/post-json', data);
   }

3. axios post multipart/form-data; boundary=[xxx]
这里需要注意的是axios内当检测到传入的参数是form-data时会删除默认的content-type: application/json，这也我们在浏览器内会看到content-type: multipart/form-data; boundary=[xxx];而jquery是没有做这一步处理的

const postFormData = function (data) {
      return axios.post('/post-form-data', data);
    }

4. axios get query内取参数

const getList = function (params) {
      return axios.get('/get-list', {params});
    }

5. axios get params内取参数
  
    const getListParams = function (params) {
      return axios.get('/get-list-params/1234563/akcnal',);
    }

```

### app.js 

```
const fs = require('fs');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer'); 

const upload = multer(); // for parsing multipart/form-data
const app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded



app.use('/static', express.static('../front/static'));

app.get('/', (req, res) => {
  res.sendFile(path.resolve('../front/index.html'), {
    header: 'text/html'
  })
});

app.get('/get-list', (req, res) => {
  console.log(req.query);
  res.json({ url: 'post-form', code: 200, ...req.query })
})

app.get('/get-list-params/:id/:token', (req, res) => {
  console.log(req.params);
  res.json({ url: 'post-form', code: 200, ...req.params })
})

app.post('/post-form',upload.array(), (req, res) => {
  console.log(req.body);
  res.json({ url: 'post-form', code: 200 })
})

app.post('/post-form-data', upload.array(), (req, res) => {
  console.log(req, req.body);
  fs.rename(req.file.path, "upload/" + req.file.originalname, function(err) {
      if (err) {
          throw err;
      }
      console.log('上传成功!');
  })

  res.json({ url: 'post-form-data', code: 200 })
})

app.post('/post-json', (req, res) => {
  console.log(req.body);
  res.json({ url: 'post-json', code: 200 })
})

app.listen(8088, () => {
  console.log('启动成功');
});
```

```
<div>
    <button id="btn1">get请求</button>
    <button id="btn2">post请求application/x-www-form-urlencoded</button>
    <button id="btn3">post请求multipart/form-data</button>
    <button id="btn4">post请求application/application/json</button>
    <div>
      <input type="file" name="file" id="file">
    </div>
    <div>
      <button class="btn">get请求</button>
      <button class="btn">post请求application/x-www-form-urlencoded</button>
      <button class="btn">post请求multipart/form-data</button>
      <button class="btn">post请求application/application/json</button>  
      <button class="btn">post请求xhr</button> 
    </div>
  </div>
  <script src="/static/js/axios.js"></script>
  <script src="/static/js/qs.js"></script>
  <script src="/static/js/jquery.js"></script>
  <script>
    
    const buttons = document.getElementsByTagName('button');

    buttons[0].onclick = function () {
      getList({token: 'acc12356', url: 'get-list'}).then((res) => {
        console.log('buttons[0]', res);
      })
      getListParams({token: 'acc12356', url: 'get-list-params'}).then((res) => {
        console.log('buttons[0]', res);
      })
    }

    buttons[1].onclick = function () {
      postForm({token: 'acc12356', url: 'post-form'}).then((res) => {
        console.log('buttons[1]', res);
      })
    }

    buttons[2].onclick = function () {
      const fileEle = document.getElementById('file');
      console.log(fileEle, fileEle.files);
      const form = new FormData();
      form.append('file', 'file');
      form.append('file', fileEle.files[0]);
      form.append('token', 'acc12356');
      form.append('url', 'post-form-data');
      postFormData(form).then((res) => {
        console.log('buttons[2]', res);
      })
    }

    buttons[3].onclick = function () {
      postJson({token: 'acc12356', url: 'post-json'}).then((res) => {
        console.log('buttons[3]', res);
      })
    }

    const btns = document.getElementsByClassName('btn');

    btns[0].onclick = function () {
      getListJq({token: 'acc12356', url: 'get-list'}).then((res) => {
        console.log('btns[0]', res);
      })
      getListParamsJq({token: 'acc12356', url: 'get-list-params'}).then((res) => {
        console.log('btns[0]', res);
      })
    }

    btns[1].onclick = function () {
      postFormJq({token: 'acc12356', url: 'post-form'}).then((res) => {
        console.log('btns[1]', res);
      })
    }

    btns[2].onclick = function () {
      const fileEle = document.getElementById('file');
      console.log(fileEle, fileEle.files);
      const form = new FormData();
      form.append('file', 'file');
      form.append('file', fileEle.files[0]);
      form.append('token', 'acc12356');
      form.append('url', 'post-form-data');
      postFormDataJq(form).then((res) => {
        console.log('btns[2]', res);
      })
    }

    btns[3].onclick = function () {
      postJsonJq({token: 'acc12356', url: 'post-json'}).then((res) => {
        console.log('btns[3]', res);
      })
    }

    btns[4].onclick = function () {
      request().then((res) => {
        console.log('btns[4]', res);
      })
    }
  </script>
```

### get请求request参考图

![axios-get](https://user-images.githubusercontent.com/20950813/42371693-cbba47d4-8142-11e8-993d-e399bb6c069c.png)

### post请求content-type: application/json request参考图

![axios-post-applicationjson](https://user-images.githubusercontent.com/20950813/42371706-d4ebf6e0-8142-11e8-9e2f-b3d5a9901e92.png)

### post请求content-type: application/x-www-form-urlencoded request参考图

![axios-post-application-x-www-form-urlencoded](https://user-images.githubusercontent.com/20950813/42371769-049bfb60-8143-11e8-8af2-84ae15ed9a84.png)

### post请求content-type: application/form-data request参考图

![post-form-data](https://user-images.githubusercontent.com/20950813/42371780-07fdfb8c-8143-11e8-9969-aecdb41b1ccf.png)



参考链接：
https://segmentfault.com/a/1190000004322487
https://github.com/axios/axios/blob/master/lib/adapters/xhr.js

