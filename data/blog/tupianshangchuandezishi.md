---
  title: 图片上传的姿势
  date: 2018-07-05T11:31:15Z
  lastmod: 2018-11-25T09:32:00Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

图片上传及图片压缩上传，这是我们日常开发中必不可少的功能，将图片转换为可识别的blob链接主要依赖于URl.createObjectURL方法；将图片转换为base64格式主要依赖于FileRender方法；将图片压缩依赖于canvas的drawImage方法

将图片文件对象转换为可识别的url，使用URL对象的createObjectURL静态方法，该方法返回一个返回一个DOMString ，包含一个唯一的blob链接（该链接协议为以blob:，后跟唯一标识浏览器中的对象的掩码）

从CanIUse上看pc端兼容ie10+，火狐、chrome、safari基本都支持

![image](https://user-images.githubusercontent.com/20950813/48977191-eaec0400-f0d0-11e8-8c13-eb3423f76752.png)

从CanIUse上看移动端兼容安卓4.0+，ios6.1+，其它大部分都是最新的版本才支持

![image](https://user-images.githubusercontent.com/20950813/48977195-fb9c7a00-f0d0-11e8-840f-f8bec651ae20.png)

```
function onchange (e) {
  const 
  const url = window.URL.createObjectURL(e.target.files[0]) || 
  window.webkitURL.createObjectURL(e.target.files[0])

  img.src =  url
}
```

将图片文件对象转换为base64，使用window对象下的FileReader方法，然后通过readAsDataURL方法读取指定blob中的内容，最后监听onload事件，在onload事件内获取到base64图片；

从CanIUse上看pc端兼容ie10+，火狐、chrome、safari基本都支持

![image](https://user-images.githubusercontent.com/20950813/48977339-5df67a00-f0d3-11e8-8a0e-892ec190af46.png)

从CanIUse上看移动端兼容安卓3.0+，ios6.0+，其它大部分都是最新的版本才支持

![image](https://user-images.githubusercontent.com/20950813/48977347-7b2b4880-f0d3-11e8-8c6e-e8a6af1b5f74.png)

```
function onchange (e) {
  const fileReader = window.FileReader()
  fileReader.onload = function (res) {
    
     img.src = res.target.result
  }
  fileReader.readAsDataURL(e.target.files[0])
}
```

利用canvas对图片进行压缩，压缩的原理就是缩放图片的尺寸及降低图片的质量来完成压缩

// drawImage的语法，共9个参数，img一定要是dom对象or虚拟的image实例，不能是url，sx, sy分别指画布的左上角坐标， sWidth, sHeight指图片在canvas上的宽高；dx, dy, dWidth, dHeight这4个坐标是针对图片元素的，表示图片在canvas画布上显示的大小和位置。sx,sy表示图片上sx,sy这个坐标作为左上角，然后往右下角的swidth,sheight尺寸范围图片作为最终在canvas上显示的图片内容。
cxt.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)

// toDataURL，toBlob，mimeType表示canvas导出来的base64图片的类型，默认是png格式，也即是默认值是'image/png'，我们也可以指定为jpg格式'image/jpeg'或者webp等格式。file对象中的file.type就是文件的mimeType类型，在转换时候正好可以直接拿来用（如果有file对象）。
qualityArgument表示导出的图片质量，只要导出为jpg和webp格式的时候此参数才有效果，默认值是0.92，是一个比较合理的图片质量输出参数，通常情况下，我们无需再设定。

canvas.toDataURL(mimeType, qualityArgument)
canvas.toBlob(callback, mimeType, qualityArgument)

```
function compressImage (src) {
    const canvas = document.getElementById('uploadImage')
    const cxt = canvas.getContext('2d')
    const img = new Image()
    img.src = src
    img.onload = () => {
         // 固定画布尺寸，也就是固定来输出图片的尺寸
         canvas.witdh = 750
         canvas.height = 562.5
         cxt.drawImage(img, 0, 0, 750, 562.5)
         // toDataURL返回一个base64链接
         const newUrl = canvas.toDataURL('image/jpeg', 0.6)
         
         // 或者可以使用toBlob方法返回一个二进制blob对象传到后台
         canvas.toBlob((blob) => {
             // 上传的逻辑，blob对象对img的src是无法识别的
         }, 'image/jpeg', 0.6)
    }

    img.onerror = () => {}
} 
```

所以从上面来看，如果我们使用的是vue等框架，那么则不需要考虑太多的兼容性，URL方式FileReader方法都是可选的，不过在实际生产中FileReader的兼容性更好


一个完整的图片上传实例
```
<template>
    <div>
        <div >
            <p>表单上传</p>
            <!-- enctype有三个值application/x-www-form-urlencoded（默认值），multipart/form-data， text/plain -->
            <form action="/api/broker/customer/upload-image?token=fomozg1498552329&orgCode=yajuleadmin_test" method="post" enctype="multipart/form-data">
                <input type="file" name="file">
                <input type="submit" value="上传" accept="image/jpeg, image/png">
            </form>
        </div>
        <div>
            <p>formData上传</p>
            <input type="file" name="file" @change="changeFile">
        </div>
        <div>
            <p>base64上传</p>
            <input type="file" name="file" @change="changeFile2">
        </div>
        <div>
            <img style="width: 200px; height: 200px" :src="imgSrc" alt="" />
        </div>
        <div>
            <canvas id="uploadImg"></canvas>
        </div>
    </div>
</template>

<script>
    import http from 'broker-http';
    import axios from 'axios'

    export default {
        props: {},
        data() {
            return {
                imgSrc: ''
            }
        },
        computed: {},
        watch: {},
        methods: {
            uploadImg(params) {
                // return http.apiPost('/api/broker/customer/upload-image', params)
                // return $app.http.post('/api/broker/customer/upload-image', params)
                return axios.post('/api/broker/customer/upload-image', params)
            },
            changeFile(e) {
                console.log(e);
                const file = e.target.files[0];
                // URL.createObjectURL() 静态方法会创建一个 DOMString，其中包含一个表示参数中给出的对象的URL。兼容ie10+
                // const url = window.URL.createObjectURL(file);

                

                const form = new FormData();
                form.append('token', 'fomozg1498552329');
                form.append('orgCode', 'yajuleadmin_test');
                form.append('from', 'paas_app');

                form.append('file', file);
                form.append('file', 'file');
                

                this.uploadImg(form).then((res) => {
                    console.log(res);
                })
                // this.imgSrc = url;
            },
            changeFile2(e) {
                const file = e.target.files[0];

                const fileReader = new window.FileReader();
                fileReader.onload = (e) => {
                    // 转base64
                    this.imgSrc = e.target.result;

                    const form = new FormData();
                    form.append('token', 'fomozg1498552329');
                    form.append('orgCode', 'yajuleadmin_test');
                    form.append('from', 'paas_app');

                    form.append('file', e.target.result);
                    form.append('file', 'file');
                    
                    this.createCanvas(e.target.result);
                    // this.uploadImg(form).then((res) => {
                    //     console.log(res);
                    // })
                }
                fileReader.readAsDataURL(file)

                
            },
            createCanvas(src) {
                var canvas = document.getElementById("uploadImg");
                var cxt = canvas.getContext('2d');
                canvas.width = 640;
                canvas.height = 400;
                var img = new Image();
                img.src = src;
                img.onload = function() {
                    // var w=img.width;
                    // var h=img.height;
                    // canvas.width= w;
                    // canvas.height=h;
                    // 将图像绘制于Canvas画布当中,
                    cxt.drawImage(img, 0, 0,640,400); // 表示将图片从画布得左上方0，0得位置画起，宽为640高为400，如果不写这来给你个参数，则使用图片本身得宽高
                    //canvas.toDataURL(type, encoderOptions);type图片格式，默认为 image/png。encoderOptions在指定图片格式为 image/jpeg 或 image/webp的情况下，可以从 0 到 1 的区间内选择图片的质量。如果超出取值范围，将会使用默认值 0.92。其他参数会被忽略;该方法返回的是一个包含data URI的字符串，该字符串可直接作为图片路径地址填入<img />标签的src属性当中
                    // $(".showPic").show().attr('src', canvas.toDataURL("image/jpeg", 0.9));
                    console.log(canvas.toDataURL("image/jpeg", 0.9));
                    // this.uploadImg({}).then((res) => {
                    //     console.log(res);
                    // })
                    // axios({
                    //     url: "/front/uploadByBase64.do",
                    //     type: "POST",
                    //     data: {
                    //         "imgStr": canvas.toDataURL("image/jpeg", 0.9).split(',')[1]
                    //     },
                    //     success: function(data) {
                    //         console.log(data);
                    //         $(".showPic").show().attr('data-url',"/"+ data.url);
                    //     }
                    // });
                }
              
                img.onload = () => {
                      const originWidth = img.width
                      const originHeight = img.height
                      let resultWidth = INIT_WIDTH
                      let resultHeight = INIT_HEIGHT
                      // 按比例缩放图片尺寸
                      if (originWidth > resultWidth || originHeight > resultHeight) {
                          if (originWidth > resultWidth && originHeight > resultHeight) {
                              const scal = Math.max(originWidth / resultWidth, originHeight / resultHeight)
                              resultWidth = originWidth / scal
                              resultHeight = originHeight / scal
                          } else if (originWidth > resultWidth) {
                              const scal = originWidth / resultWidth
                              resultHeight = originHeight / scal
                          } else if (originHeight > resultHeight) {
                              const scal = originHeight / resultHeight
                              resultWidth = originWidth / scal
                          }
                     } else {
                         resultWidth = originWidth
                         resultHeight = originHeight
                     }
                     console.log({originWidth, originHeight, resultWidth, resultHeight})
                     canvas.width = resultWidth
                     canvas.height = resultHeight
                     cxt.drawImage(img, 0, 0, resultWidth, resultHeight)
                   }
               }
        },
        beforeCreate() {},
        created() {}
    }
</script>

```

参考链接
https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader
https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
https://www.zhangxinxu.com/wordpress/2017/07/html5-canvas-image-compress-upload/

