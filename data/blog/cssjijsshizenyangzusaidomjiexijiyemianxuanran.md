---
  title: css及js是怎样阻塞dom解析及页面渲染
  date: 2021-05-30T14:52:35Z
  lastmod: 2021-05-31T10:49:43Z
  summary: 
  tags: ["浏览器"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

**link标签会阻塞dom的解析与页面渲染吗？**
**内联script标签会阻塞dom的解析与页面渲染吗？**
**外链script标签会阻塞dom的解析与页面渲染吗？**

下面的例子都是在chrome上、然后网络设置为fast 3g进行的分析 

**一、link标签不会阻塞dom解析、但是会阻塞页面渲染**

```
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .app {
            background-color: red;
        }
    </style>
    <link rel="stylesheet" href="./index.css">
    <link rel="stylesheet" href="./reset.css">
</head>
<body>
    <div class="app">start</div>
    <script src="./index.js"></script>    
</body>
```

![link标签不会阻塞dom解析](https://user-images.githubusercontent.com/20950813/120108643-b2917900-c198-11eb-851a-8a9c6745fdd2.gif)

从视频中可以看出link href='./index.css' 后面的link标签及script标签都有被继续解析出来，而不是等待加载index.css这个标签加载完之后才加载的，所以这里可以得出link标签不会阻塞dom解析，但是会阻塞页面渲染，原因是页面渲染依赖css样式，需要css样式与dom tree结合进行layout，所以肯定会阻塞页面渲染

**二、link标签会阻塞script标签内js代码的执行**

```
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .app {
            background-color: red;
        }
    </style>
    <link rel="stylesheet" href="./index.css">
    <link rel="stylesheet" href="./reset.css">
</head>
<body>
    <div class="app">start</div>
    <script>
        console.log('111', document.querySelector('.app'))
    </script>
    <script src="./index.js"></script>    
</body>
```

![link标签会阻塞script内js的执行](https://user-images.githubusercontent.com/20950813/120108657-c5a44900-c198-11eb-8cbb-4b7aa67486a5.gif)
在执行准备执行script标签内的js代码时，因为不确定是否会修改样式，所以会等待script标签前面的style都加载完成，所以这种场景下link标签会阻塞script标签的执行，最终阻塞页面渲染

**三、内联、外链script标签即会阻塞dom解析，又会阻塞页面渲染**

```
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script>
        let result1 = 0
        const max = 2000000000
        for (let i = 0; i < max; i++) {
            result1 += 1
        }
        console.log('result1', result1)
    </script>
    <style>
        .app {
            background-color: red;
        }
    </style>
    <link rel="stylesheet" href="./index.css">
    <link rel="stylesheet" href="./reset.css">
</head>
<body>
    <div class="app">start</div>
    <script src="./index.js"></script>    
</body>
```

![1](https://user-images.githubusercontent.com/20950813/120181035-18384080-c23f-11eb-81fe-f5712b41e27d.gif)

```
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="./longtime.js"></script>
    <style>
        .app {
            background-color: red;
        }
    </style>
    <link rel="stylesheet" href="./index.css">
    <link rel="stylesheet" href="./reset.css">
</head>
<body>
    <div class="app">start</div>
    <script src="./index.js"></script>    
</body>
```

![2](https://user-images.githubusercontent.com/20950813/120181335-7e24c800-c23f-11eb-9d33-1242945a11c5.gif)

**四、script src方式加载的js代码，会触发pain也就是页面渲染，前提条件是**
1、script标签在body中
2、script标签之前的link标签都已加载完成

```
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        .app {
            background-color: red;
        }
    </style>
    <link rel="stylesheet" href="./index.css">
    <link rel="stylesheet" href="./reset.css">
</head>
<body>
    <div class="app">start</div> 
    <script src="./larger.js"></script>
</body>
```

![3](https://user-images.githubusercontent.com/20950813/120181602-dfe53200-c23f-11eb-99d0-956e012ac3e7.gif)

从上面的几种情况来看，页面的渲染，必须等待所有的css加载完才会渲染，但是不一定要等待所有的js加载完才会渲染

外链CSS文件阻塞了，会阻塞 DOM 树的合成吗？会阻塞页面的显示吗？

下载的css文件阻塞了，会不会阻塞dom树的合成以及页面的渲染需要分情况
1、如果html页面中没有script脚本，则不会阻塞dom树的合成，但是会阻塞页面的渲染，因为页面渲染需要dom tree以及styleSheets
2、如果html页面中，外链link标签后面是内联的script脚本，则不会阻塞link标签到script标签之间的dom解析，但是当解析到script标签之后会阻塞dom继续解析，原因是script标签需要等待css文件加载完成，才会继续执行script标签，执行完script标签内的js之后，才会继续解析dom，因为script标签不是外链script脚本，所以css加载完之后不会触发页面渲染，所以这种场景下下载的css文件文件会在执行到script标签之后阻塞dom渲染，会一直阻塞页面的渲染，除非遇到后面有script外链的脚本或者所有的内联script脚本执行完毕
3、如果html页面中，外链link标签后面是外链的script脚本，则不会阻塞link标签到script标签之间的dom解析，但是当解析到script标签之后会阻塞dom标签的解析，原因是script标签要等待css文件加载完成，这时候如果css文件先与外链js文件加载完成，则会触发一次页面渲染，然后等待js加载完成，执行js后继续解析dom，并最终再次渲染页面

##### 总结：为了详细的了解上面的过程，我们需要知道chrome的架构，知道具体是哪部分在做渲染相关的内容，然后去详细了从输入url到最终页面渲染中间做了哪些事情
