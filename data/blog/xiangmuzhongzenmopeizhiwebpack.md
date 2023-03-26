---
  title: 项目中怎么配置webpack
  date: 2017-12-11T11:55:50Z
  lastmod: 2017-12-11T11:55:50Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

记得刚开始使用webpack的时候，自己踩了些坑，最近恰好想在捋下webpack，所以就记录下来。
下面列一下一些碰到的疑问

1. **开发的时候webpack怎么不支持index.html页面的热更新**
    因为webpack-dev-server只处理与入口文件有依赖的资源，而我们在各个模块内一般都是引入js资源or css资源，img资源，字体资源，视频音频资源，所有热更新无法覆盖到项目目录下的所有文件，只有与入库文件有依赖关系的资源才会被监视，才会在修改的时候去进行热更新(启用了热更新的前提)
    解决方法是：引入html-withimg-loader，在rules内配置该loader，同时在入库文件内引入index.html即可实现index.html的热更新

2. **webpack打包的时候，html页面内img引入的图片路径没有做处理**
    这是webpack本身就不提供这个选项，解决方法有两个
    第一个方法，在js文件内引入改图片资源如import imgURL from './1.jpg'然后通过dom来进行操作
    第二个方法是使用html-withimg-loader这个loader，在rules内配置规则即可，需要注意的时这个loader
    只能处理img标签的src属性，不能处理video等标签的资源引入，所以video的标签资源的引入还需要动
    态设置

3. **output配置项内的path及publicPath有什么区别**
    path参数的含义是指定入口文件输出的路径(文件夹)，如path: resolve(__dirname, 'dist'), //__dirname webpack执行时的文件目录，这里就是跟目录，也就是输出到根目录下的dist文件夹,即改配置属性不会去影响资源属性的路径，记住一点path是webpack所有文件的输出的路径，必须是绝对路径，比如：output输出的js,url-loader解析的图片，HtmlWebpackPlugin生成的html文件，都会存放在以path为基础的目录下；
    publicPath参数的含义是指补全生成的index.html(href,script等引入的路径，但不包括img引入的图片路径)及各个css,文件内引入图片，音频等资源的路径，如publicPath:'http://127.0.0.1:8020/es6/myEs6/dist/',那么在打包的时候引入资源文件的路径就是publicPath + 开发的时候写的相对路径，如background-image: url('../../static/images/4.jpg');打包后的路径为background-image:url(http://127.0.0.1:8020/es6/myEs6/dist/static/images/4.74ca2aa.jpg);如果pablicPath不配置则默认为''字符串，则html及css内加载的图片资源路径就是开发时写的相对路径去掉.变成绝对路径，如果publicPath配置为./则,则css内图片路径会会去掉相对路径./or ../而html内引入的css及js文件则会生成./文件名，如果publicPath配置成/则css内即html内引入资源的路径都会是绝对路径background-image:url(/static/images/4.74ca2aa.jpg)即publicPath的作用就是为index.html及css文件内引入图片，音频等文件添加访问路径前缀(静态资源最终访问路径 = output.publicPath + 资源loader或插件等配置路径),如css内引用图片的路径为url('../images/4.jpg')，publicPath为/webpack/webpack-src/dist/那么最终输出的路径为/webpack/webpack-src/dist/static/images/4.415452jpg

4. **环境变量process.env.NODE_ENV怎么去获取到具体的值**
    我们在webpack内使用环境变量的作用是帮助我们进行区分开发环境、测试环境及正式环境，那么要在webpack的配置文件内哪到值需要设置两个地方
    第一处是
    `new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"development"' // 定义环境变量
            }
        })`

    第二处是
    "dev": `set NODE_ENV=development&&webpack-dev-server  --open `

5. **url-loader与file-loader是什么关系**
    url-loader的作用是处理css内orjs内引入的图片资源，当图片资源小于limit时，url会将图片转换为base64的图片进行输出，如果资源大于limit则不进行转换，将使用file-loader处理以图片的路径输出,此时可以指定图片输出的路径name: 'static/images/[name].[hash:7].[ext]'，注意这里的路径是基于output内的path开始的，最终输出的路径为path/static/images/[name].[hash:7].[ext]
    file-loader的作用是处理图片音频等资源并输出，url-loader的基础，注意的时可以直接配置outputPath,publicPath,useRelativePath等配置属性

6. **音频视频文件怎么引入**
    配置loader，然后使用require or import导入

7. **HtmlWebpackPlugin插件内的template属性与inject属性具体作用是什么**
    template: ‘index.html’ //需要参考的模板 注意前面可以带路径‘views/index.html’,注意这里是相当于根路径
    inject: 'body' // 向template或者templateContent中注入所有静态资源,true或者body：所有JavaScript资源插入到body元素的底部；head: 所有JavaScript资源插入到head元素中；false： 所有静态资源css和JavaScript都不会注入到模板文件中

8. **使用webpack-dev-server搭建本地服务器时，它的contentBase属性与publicPath属性有什么作用**
    contentBase: path.join(__dirname, 'dist') // 告诉webpack-dev-server，在 localhost:8080 下建立服务，服务的文件来自dist目录,这里需要注意的时webpack-dev-server默认生成的dist目录是在内存中，不是项目目录内的dist
    publicPath的作用output内的publicPath作用类似

9. **webpack内的chunk、hash、chunkhash分别是什么意思**
   chunk：表示一个文件，默认情况下webpack的输入是一个入口文件，输出也是一个文件，这个文件就是一个chunk，chunkId就是产出时给每个文件一个唯一标识id，chunkhash就是文件内容的md5值
   hash：计算所有 chunks 的 hash，及这一次构建过程的hash，适合 chunk 拆分不多的小项目，但所有资源全打上同一个 hash，无法完成持久化缓存的需求
   chunkhash： 每个文件生成时的chunkhash，即这一次构建的过程中每个文件生成的hash；JS 资源的 [chunkhash] 由 webpack 计算，Images/Fonts 的 [hash] 由 webpack/url-loader计算，css的hash由extract-text-webpack-plugin计算给出，注意生成hash值是一个编译的过程，所有在开发的时候不需要给输出文件配置hash值

10. **webpack内置的CommonsChunkPlugin有什么作用**
      抽出公共模块，这里我们的代码js代码一般分为三类，1.引入的第三方框架和库；2.自己写的公共代码；3.其它的单独js文件，我们需要将不经常变的第一类js文件or第二类js文件抽离到公共的一个js文件内，保证浏览器的长时间缓存，提高加载效率
      
11. **package.json内怎么去配置webpack命令**
     "build": "set NODE_ENV=production&&webpack --progress --hide-modules --color --config webpack.prod.conf.js",
    "dev": "set NODE_ENV=development&&webpack-dev-server  --open --inline --hot --compress --history-api-fallback --progress --color --config webpack.dev.conf.js"
     注意的是webpack启动时默认会去找跟目录下的webpack.config.js文件，而我们如果要让定制webpack.base.conf.js等配置文件生效，则需要在命令行处配置读取文件用--config来进行配置


参考链接
https://webpack.js.org/concepts/
https://doc.webpack-china.org/concepts/
