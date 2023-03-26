---
  title: vite原理与实践记录
  date: 2021-12-03T04:28:54Z
  lastmod: 2021-12-03T04:29:26Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

# 目录

- 背景
- 原理
- 问题
- 总结



## 背景

公司的项目基本都是基于webpack构建，而我们都会对webpack构建项目进行一些构建速度上的优化，比如缓存等，但是开了缓存之后，开发环境还是会存在慢的问题，主要有两方面

	- 首次启动慢
	- HMR慢



首次启动慢的原因是因为webpack是一种bundler方案，需要根据entry找到所有依赖模版，并输出最终的bundle.js；

hmr慢是因为babel-loader做语法转换耗时过长,且需要重新生产bundle.js



所以针对上面的问题，首先我们可能会想到怎么降低语法转化时间，比如使用esbuild-loader来替换babel-loader，但是这只能减少部分语法转换时间，还是不能解决首次启动慢的问题，所以要从根本上解决开发环境首次启动慢的问题还得换一种思路，也就是现在vite提供的bundless思路，启动的时候，只进行预构建第三方依赖，实际浏览器访问的时候，在通过本地服务器实时转换每个请求的文件，达到缩短首次启动时间的目的



## 原理

我们看下vite是样实现bundless的，以及vite为什么会那么快



下图是vite的内部核心流程图

![image](https://user-images.githubusercontent.com/20950813/144545228-43863bf5-0a75-4b55-820b-73bfe09ef1e3.png)



在listen启动之前会进行预构建，触发预构建的前提是，vite能够成功找到entry入口

两种场景会触发预构建

1. 启动listen之前会主动通过entry来扫描预构建的包，如果启动的时候找到预构建的包，则会打印如下所示

![image](https://user-images.githubusercontent.com/20950813/144545079-6e25c77e-bd89-434e-90fe-eadba54442e9.png)

2. 是在调用插件的resolveId钩子的时候，会再次触发预构建的逻辑，如下图所示

![image](https://user-images.githubusercontent.com/20950813/144545118-556b2f07-ce31-49ee-ba38-24aff6c5247d.png)

我们应该尽量在第一次listen之前触发预构建，原因是这时候服务还没启，不会出现浏览器访问页面之后长久等待的问题；如果我们不在第一次listen之前触发预构建，而是通过访问页面的时候，vite在中间件内调用插件resolveId钩子的时候再去触发预构建，如果预构建次数多，就会出现浏览器白屏过久的问题

而第一次触发预构建的条件就是entry有值，而entry的取值顺序是

- config.optimizeDeps.entries

- config.build.rollupOptions?.input

- root目录下所有的html文件，然后分析html文件内的script标签



所以vite快的原因

	- 启动的时候只做第三方模块的预构建，且使用esbuild来进行预构建，速度是毫秒级
	- 访问页面的时候，在处理路由对应的模块，同样使用esbuild来做转换，所以速度还是非常快



## 问题

项目改造过程中碰到的问题



1. `index.html` 必须要放在根目录



2. `index.html` 必须要主动通过 `script` 标签引入入口文件，或者通过参数传入入口 `entry`



3. `alias` 别名配置问题

   支持两种写法，推荐这种数组对象写法

   ```js
   resolve: {
       alias: [
         {
           find: /^@assets/,
           replacement: '/Users/xxx/Documents/f/react/tpl-test/tpl-h5-vite2/src/assets'
         },
         {
           find: /^@\//,
           replacement: '/Users/xxx/Documents/f/react/tpl-test/tpl-h5-vite2/src/'
         },
         {
           find: /^~/,
           replacement: ''
         }
       ]
     },
   ```

   注意点：

   - 不要设置@别名，这样会导致一些npm包加载错误，原因是很多npm包都是@开头

   - 要特殊处理下`～`不然，针对`'~antd/lib/style/color/colors.less' wasn't found.` 这种样式写法



4. `react`插件

   ```js
   import react from '@vitejs/plugin-react';
   
   export default {
   	plugins: [
   		process.env.NODE_ENV === 'development' && react(),
   	]
   }
   ```

   只需要在开发环境启动，生产环境启动会报错



5. `error: Could not read from file:/Users/xxx/Documents/f/react/tpl-test/tpl-h5-vite2/srcbabel/runtime/helpers/esm/extends `



​		`alias`配置错误导致的文件找不到，也就是因为我们设置了@别名导致的，需要将别名改成@/



6. `Internal server error: Invalid PostCSS Plugin found at: plugins[0]`



​		`postcss`版本问题，`postcss.config.js`内的`plugins`写法要去掉第二层包裹的数组



![image-20211203111739564](/Users/wangks/Library/Application Support/typora-user-images/image-20211203111739564.png)



7. `require.context`，`vite`内不支持这种写法，如果我们开发与生产都使用的是vite那么直接使用`import.meta.globEager`替换即可，但是如果生产还是需要使用`webpack`构建，推荐使用插件处理

   ```js
   const regContext = /require\.context\(.*\)/g;
   
   export default function requireContext() {
     return {
       name: 'rollup:requireContext',
       transform(source: string, importer: string) {
         if (importer.includes('node_modules')) {
           return;
         }
         if (!/.[j|t]sx?$/.test(importer)) {
           return;
         }
         if (!source.includes('require.context')) {
           return;
         }
         const requireContent = (source.match(regContext) || [])[0];
         const parames = (requireContent.match(/(?<=\().*(?=\))/g) || [])[0];
         const paramesArr = parames.split(',');
         const dir = (paramesArr[0].match(/(?<=['|"]).*(?=['|"])/g) || [])[0];
         const file = (paramesArr[2].match(/(?<=\/\.)(.*)(?=\\)/) || [])[0];
         const globReg = `import.meta.globEager("${dir}/**/${file}.[j|t]s");`;
   
         const str = `
           (function globalContext(...args) {
             const globFiles = ${globReg};
             const context = (key) => {
               return globFiles[key]
             }
   
             context.keys = function () {
               return Object.keys(globFiles)
             }
   
             return context
           })()
         `;
         const newSource = source.replace(regContext, str);
   
         return {
           code: newSource,
           map: null,
         };
       },
     };
   }
   ```

   

   插件作用的就是在插件内使用`import.meta.globEager`替换`require.context`，具体的覆盖场景还需要根据自己项目适配



8. `module.hot`相关的代码, 可以通过`define`来设置常量解决

   ```js
   define: {
   	'module.hot': null
   },
   ```

   需要注意的是，`vite`对于`define`参数，开发环境与生产环境处理方式是不一样的



9. `less`、`scss`的全局变量文件不需要手动导入，可以通过参数`css.preprocessorOptions`参数传入

   ```js
   css: {
       preprocessorOptions: {
         scss: {
           additionalData: '@import "/Users/xxx/Documents/f/react/tpl-test/tpl-h5-vite2/src/assets/styles/var2.scss";'
         },
         less: {
           additionalData: '@import "/Users/xxx/Documents/f/react/tpl-test/tpl-h5-vite2/src/assets/styles/var.less";@import "/Users/xxx/Documents/f/react/tpl-test/tpl-h5-vite2/src/assets/styles/1px.less";',
           javascriptEnabled: true
         }
       }
     },
   ```

   

10. `vite`的build模式下，index.html内一定要有`script src='/src/xxx.tsx'`入口js这一段，不然分析不了依赖



11. `Internal server error: '~antd/lib/style/color/colors.less' wasn't found.`

    模块查找问题，通过别名解决

    

12. `Internal server error: Inline JavaScript is not enabled. Is it set in your options?`

    将`lessLoaderOption`内的参数通过`css.preprocessorOptions`参数透传



13. `Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.`

    通过修改文件后缀名解决,将.js转换成.jsx



14. `global is not defined`

    在`head`标签内添加`global`全局变量解决

    ```html
    <script>window.global = window;</script>
    ```

    

15. `/login.shtml 404`

    可以通过`vite`插件解决特殊的`url`访问问题

    ```js
    function htmlTransform() {
    	return {
        name: 'vite:html-transform',
        configureServer(server: ViteDevServer) {
          // 返回一个在内部中间件安装后被调用的后置钩子
          return () => {
            server.middlewares.use(async(req: any, res: any, next: any) => {
              // 处理后台开发环境login.shtml的场景
              const url = req.url && cleanUrl(req.url);
              if ((url.endsWith('.html') || (url.endsWith('.shtml'))) && url !== '/index.html') {
                const html = await server.transformIndexHtml(url, index, req.originalUrl);
                return send(req, res, html);
              }
              next();
            });
          };
        },
      };
    }
    ```

    

16. `devServer proxy`问题

    `webpack-dev-server`使用的是`http-proxy-middleware`包，而`vite`的`devServer`使用的是`http-proxy`，二者部分参数及使用方式不一致，具体转换如下所示

    ```js
    const newProxy = Array.isArray(proxy) ? proxy.reduce((prev, item) => {
        const { target, changeOrigin, secure, cookieDomainRewrite, pathRewrite, context } = item;
        prev[context] = {
          target,
          changeOrigin,
          secure,
          cookieDomainRewrite,
        };
        if (pathRewrite) {
          const key = Object.keys(pathRewrite)[0];
    
          prev[context].rewrite = (path: string) => path.replace(new RegExp(key), pathRewrite[key]);
        }
        return prev;
      }, {}) : Object.keys(proxy).reduce((prev, key) => {
        const { target, changeOrigin, secure, cookieDomainRewrite, pathRewrite, onProxyRes } = (proxy as {[key: string]: any})[key];
        prev[key] = {
          target,
          changeOrigin,
          secure,
          cookieDomainRewrite,
        };
        if (pathRewrite) {
          const rewriteKey = Object.keys(pathRewrite)[0];
          prev[key].rewrite = (path: string) => path.replace(new RegExp(rewriteKey), pathRewrite[rewriteKey]);
        }
        if (onProxyRes) {
          prev[key].configure = function(proxy: any) {
            proxy.on('proxyRes', onProxyRes);
          };
        }
        return prev;
      }, {} as {[key: string]: any});
    ```

    

17.  `css module`样式文件不生效

    vite css module只支持xxx.module.[css|less|scss]严格写法，不支持xxx.modules.[css|less|scss] 这种松散写法

    

18. 启动速度慢，第三方依赖依次加载过多

    首次启动的时候如下所示

    ```js
    Pre-bundling dependencies:
    
    react/jsx-dev-runtime
    
    	new dependencies found: react-dom, react-router-dom, react-router-config, lodash, antd, antd/es/locale/zh_CN, updating...
    
    	new dependencies found: react, querystring, md5, react-router, updating...
    
    	new dependencies found: @yun/ed, @yun/ke-back-core, updating...
    ```

    这样导致首次启动很慢

    原因分析：

    ​	1. 第一次预构建没有识别到需要预构建的依赖

    ​	2. 浏览器访问的时候路由同步加载，导致对所有路由组件内的第三方npm包同时与构建，就有出现多次预构建

    解决方法：

    ​	1. 路由改异步加载

    ​	2. 确认第一次预构建为什么没有识别到react这些第三方依赖



## 总结

目前vite在开发启动速度上相对于webpack已经提高了n倍，从秒级提高了毫秒级，并且vite中有很多实现上的小优化值得借鉴，比如vite对配置文件的vite.config.[j|t]s文件的处理，不是使用传统的babel-register 或者 ts-node来加载，而是使用esbuild.build之后直接拿到文件内容，这样速度的提升是从1-2s提升到30ms左右，还有一些其它的小细节值得借鉴。


