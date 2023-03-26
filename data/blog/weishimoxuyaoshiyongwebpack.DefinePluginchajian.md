---
  title: 为什么需要使用webpack.DefinePlugin插件
  date: 2021-01-03T10:55:26Z
  lastmod: 2021-01-03T10:56:56Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 一直有一个疑问，我们在使用webpack构建前端静态资源的时候，我们既然已经设置了node的环境变量NODE_ENV，为什么webpack打包的时候还需要去使用webpack.DefinePlugin这个插件再去定义'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),或者其它的环境变量，如下所示

```
{
    // packages.json 在scripts内设置了环境变量NODE_ENV
    "scripts": {
        "build": "NODE_ENV=production&& webpack --config ./webpack.config.js"
    },
}

module.exports = {
    mode: 'none', // development | production
    entry: {
        app: './app.js',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].[chunkhash].js',
        publicPath: './'
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
}
```

带着这个疑问，我总结了下，我们平台开发中常用的设置node环境变量的方式及使用到环境变量的场景

方式一：通过scripts脚本设置

```
{
    // packages.json 在scripts内设置了环境变量NODE_ENV
    "scripts": {
        "build": "NODE_ENV=production YK_ENV=TEST TARO_ENV=h5 webpack --config ./webpack.config.js"
    },
}
```

方式二：webpack.production.js内添加添加NODE_ENV的值
```
process.env.NODE_ENV === 'production'
```

方式三： 直接设置全局的NODE_ENV环境变量
```
set NODE_ENV = 'production'
```

然后有不用的地方使用环境变量，这两个地方有什么区别？

场景一：webpack.config.js内

```
module.exports = function(merge) {
    if (process.env.NODE_ENV === 'development') {
        return merge({}, config, require('./dev'))
    }
    return merge({}, config, require('./prod'))
}
```

场景二：我们的项目入口文件app.js内
```
if (process.env.NODE_ENV !== 'production') {
    console.log('debug')
}

if (process.env.TARO_ENV === 'h5') {
    require('@/utils/webp')
    require('@/utils/debug')
}
```

带着这些疑问,开一个新的demo去验证下

```
// webpack.config.js
module.exports = {
    mode: 'none', // development | production
    entry: {
        app: './app.js',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].[chunkhash].js',
        publicPath: './'
    },
    plugins: [
        new HtmlWebpackPlugin(),
    ]
}
console.log('process.env.TARO_ENV', process.env.TARO_ENV)
console.log('process.env.NODE_ENV', process.env.NODE_ENV)
```

```
// app.js

console.log('process.env', process.env)
console.log('process.env.NODE_ENV', process.env.NODE_ENV)
console.log('process.env.TARO_ENV', process.env.TARO_ENV)
```

```
{
    "scripts": {
        "build": "webpack --config ./webpack.config.js"
    },
}
```

浏览器输出结果如下图所示

![image](https://user-images.githubusercontent.com/20950813/103476858-46326980-4df4-11eb-920e-4a9b61e9b8a7.png)

然后我们将webpack.config.js内的mode值改为production，构建之后浏览器输出如下图所示

![image](https://user-images.githubusercontent.com/20950813/103476870-4e8aa480-4df4-11eb-8cc5-caf01a8c90d2.png)

<b>所以从这里我们可以知道，webpack自动会根据mode值，自定调用new webpack.DefinePlugin插件一次，定义process.env.NODE_ENV变量，值为mode对应的值</b>

node端webpack.config.js内的输出，如下图所示

![image](https://user-images.githubusercontent.com/20950813/103476879-5ea28400-4df4-11eb-94ef-798457e618d7.png)

<b>这时候因为没有设置环境变量TARO_ENV与NODE_ENV，所以二者的值都是undefined</b>

修改package.json内的scripts命令,设置环境变量

```
{
    "scripts": {
        "build": "NODE_ENV=production TARO_ENV=h5 webpack --config ./webpack.config.js"
    },
}
```

node端webpack.config.js内的输出，如下图所示

![image](https://user-images.githubusercontent.com/20950813/103476887-71b55400-4df4-11eb-91aa-af0b013fa7cc.png)

浏览器端输出结果为

![image](https://user-images.githubusercontent.com/20950813/103476895-81cd3380-4df4-11eb-90a7-c223744a5fbb.png)

所以从这里我们知道，node环境的环境变量需要手动设置才会有值，浏览器端的环境变量与node端的环境变量没有关系

在webpack.config.js内添加new webpack.DefinePlugin插件，如下所示

```
module.exports = {
    ...
    plugins: [
        new HtmlWebpackPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            'process.env.TARO_ENV': JSON.stringify(process.env.TARO_ENV),
            'process.env': JSON.stringify({a: 1, b: 2})
        })
    ]
}
```

浏览器端输出结果为

![image](https://user-images.githubusercontent.com/20950813/103476900-8db8f580-4df4-11eb-9a06-db8ff1375293.png)

所以我们知道浏览器端的环境变量，由new webpack.DefinePlugin插件在webpack构建的时候进行替换

修改app.js

```
// 添加如下代码
if (process.env.NODE_ENV === 'production') {
    console.log('当前是production环境')
} else {
    console.log('当前是非production环境')
}

if (process.env.TARO_ENV === 'h5') {
    console.log('当前是h5环境')
} else {
    console.log('当前是非h5环境')
}
```

浏览器端输出

![image](https://user-images.githubusercontent.com/20950813/103476926-b80ab300-4df4-11eb-86fa-50fd62ec69f2.png)

none模式下的构建结果

![image](https://user-images.githubusercontent.com/20950813/103476933-c6f16580-4df4-11eb-8187-9f821df00683.png)

production模式下的构建结果

![image](https://user-images.githubusercontent.com/20950813/103476938-d2449100-4df4-11eb-88ee-6f61d86f66e9.png)

production模式下去掉了false内的代码

### 对构建时使用环境变量的理解

首先我们先得知道前端打包的时候，webpack配置文件内为什么需要用到环境变量

原因是：我们前端构建的资源是需要区分不同环境的（比如开发环境、测试环境、预发布环境、生成环境等），我们可以通过一个node的环境变量，来决定使用哪一份配置，而NODE_ENV只是行业内默认的区分当前环境的变量名

```
module.exports = function(merge) {
    if (process.env.NODE_ENV === 'development') {
        return merge({}, config, require('./dev'))
    }
    return merge({}, config, require('./prod'))
}
```

然后我们还得知道，我们具体的js代码内为什么也需要用到环境变量

原因是：我们可以根据环境变量，来决定运行哪块代码，可以增加不同环境的区分，同时可以去掉无用的代码

```
// app.js
if (process.env.NODE_ENV !== 'production') {
    console.log('debug')
}
```

那webpack.config.js与app.js内使用的process.env.NODE_ENV这个变量到底有什么区别

通过上面的例子，我们已经知道，因为webpack是运行在node端的，那么process.env.NODE_ENV那肯定就是通过设置node的NODE_ENV这个环境变量即可；所以运行在node端的所有的js文件内访问process.env.NODE_ENV这个环境变量都是，需要我们手动去设置了NODE_ENV才会有值；如果我们没设置则不会有值

而我们的app.js最终是需要运行在浏览器端，如果我们直接通过webpack构建之后，然后在浏览器运行，会发现process.env.NODE_ENV为none|production|development,这是因为我使用的是webpack4.x，会根据我们的mode参数，webpack内部会调用webpack.DefinePlugin插件定义process.env.NODE_ENV这个变量；process.env.NODE_ENV的最终值就是我们mode定义的值，如果我们换一个环境变量名TARO_ENV,怎会发现值为undefined

然后我们又通过webpack.DefinePlugin插件定义一下TARO_ENV变量，然后重新通过webpack打包，最浏览器端运行，最终发现TARO_ENV有值了

那么也就是说，我们具体业务代码js内使用的process.env.NODE_ENV or process.env.TARO_ENV这些变量，是需要通过webpack.DefinePlugin插件定义了才会被替换成定义时的值，否则浏览器端运行的时候会为undefined；也就是无论是已process.env.NODE_ENV还是已NODE_ENV变量的方式定义值，都需要通过webpack.DefinePlugin插件定义才会有值，至于具体是叫process.env.NODE_ENV还是叫NODE_ENV语义化定义即可；

最后我们在webpack.config.js内通过webpack.DefinePlugin()插件定义变量时，又不想写死，所以就又通过了node的环境变量来输入值

```
// 由写死
new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.YK_ENV': JSON.stringify('PRO'),
    'process.env.TARO_ENV': JSON.stringify('h5')
})

// 变成node环境变量传入值
new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.YK_ENV': JSON.stringify(process.env.YK_ENV),
    'process.env.TARO_ENV': JSON.stringify(process.env.TARO_ENV),
})
```

### cross-env的作用是什么

我们在实际开发中，一般不会将NODE_ENV这个环境变量直接设置成全局的环境变量，如果设置成全局的环境变量，则每次打包构建的时候去注意当前的NODE_ENV的值，所以我们更多的还是结合package.json内的scripts一起使用，如果所示

```
{
    "scripts": {
        // mac下设置一个环境变量
        "build1": "NODE_ENV=production&& node index.js --token qq124344433",
        // mac下设置多个环境变量
        "build": "NODE_ENV=production YK_ENV=TEST TARO_ENV=h5 webpack --config ./webpack.config.js"
    },
}

{
    "scripts": {
        // windows下设置环境变量
        "build": "set NODE_ENV=production&& npm run clean && webpack",
        "clean": "rimraf ./build && mkdirp build",
    }
}
```

实际开发的时候就会发现windows与mac下，在scripts命令行内设置node环境变量的方式是有区别的，那么这时候我们需要有一个可以帮助我们抹平平台差异设置环境变量的一个库，那cross-env就是一个这样的库，我们直接通过cross-env来帮助我们跨平台设置node环境变量，如下图所示

```
{
  "scripts": {
    // 设置当个环境变量
    "build": "cross-env NODE_ENV=production webpack --config build/webpack.config.js",
    // 设置多个环境变量
    "build1": "cross-env FIRST_ENV=one SECOND_ENV=two node ./my-program"
  }
}
```

参考链接：
[process_process_env](http://nodejs.cn/api/process.html#process_process_env)
[DefinePlugin](https://webpack.js.org/plugins/define-plugin/)
[Node环境变量设置](https://yi-jy.com/2018/08/08/node-env/)
[cross-env](https://github.com/kentcdodds/cross-env)
