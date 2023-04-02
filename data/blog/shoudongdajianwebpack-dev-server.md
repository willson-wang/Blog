---
  title: 手动搭建webpack-dev-server
  date: 2020-01-28T09:07:41Z
  lastmod: 2020-02-01T09:04:05Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/webpack5.jpeg']
  bibliography: references-data.bib
---

Hot Module Replacement (HMR) exchanges, adds, or removes modules while an application is running, without a full reload. This can significantly speed up development in a few ways:

Retain application state which is lost during a full reload.
Save valuable development time by only updating what's changed.
Instantly update the browser when modifications are made to CSS/JS in the source code, which is almost comparable to changing styles directly in the browser's dev tools.

<h3>浏览器是怎么知道webpack重新编译了代码？</h3>

因为webpack-hot-middleware通过sse将重新编译产生的hash值及变化的模块信息推送到了客户端

<h3>浏览器又是怎样拿到webpack编译的代码？</h3>

webpack-hot-middleware提供了sse的客户端、当接收到服务端发送来的消息时，会通过process-update内调用module.hot.check方法及module.hot.apply方法促使客户端下载更新的模块及hot-update.json

<h3>浏览器拿到webpack编译的代码之后又是怎么执行的及触发依赖回调?</h3>

webpack.HotModuleReplacementPlugin提供了一系列check、update、apply方法，帮助我们去执行代码及触发回调

<h3>webpack-dev-middleware扮演什么角色？</h3>

通过源码分析，我们可以知道webpack-dev-middleware帮我们做了如下事情

1. 注册了done、run、invalid、watchRun几个钩子，在钩子内做一些打印or校验的功能

2. 手动执行了webpack.watch帮助我们进行监控webpack重新编译

3. 使用memory-fs读写文件

4. 返回一个middleware方法，该方法包含close、invalid等关闭与校验的方法

总结起来就是帮助我们监控了文件变化

<h3>webpack-hot-middleware又是扮演什么角色？</h3>

使用Server-Sent Events（以下简称 SSE）技术与客户端推送消息

客户端的逻辑放在clinet.js内

服务端的逻辑放在middleware.js内

把更改的模块、hash值传递到客户端

通过process-update内调用module.hot.check方法及module.hot.apply方法促使客户端下载更新的模块及hot-update.json

总结起来就是把webpack变化了的模块及重新包生产的hash值传到客户端（也就是浏览器端）
，最终替换模块及执行回调

<h3>webpack.HotModuleReplacementPlugin插件的作用又是什么？</h3>

提供module.hot属性，包含一系列下载模块，更新模块，执行回调的方法

<h3>webpack-dev-server与webpack-dev-middleware、webpack-hot-middleware有什么异同?</h3>

webpack-dev-server是一个完整的即提供了node服务又提供了热更新功能包

webpack-dev-middleware主要提供了监控webpack编译的功能及使用memory-fs读写文件

webpack-hot-middleware主要提供Server-Sent Events（以下简称 SSE）技术用于热更新

### webpack-dev-middleware源码分析，只保留关键代码

```
index.js

module.exports = function wdm(compiler, opts) {

  // 初始化监听一些钩子
  const context = createContext(compiler, options);

  // start watching
  context.watching = compiler.watch(options.watchOptions, (err) => {
      if (err) {
        context.log.error(err.stack || err);
        if (err.details) {
          context.log.error(err.details);
        }
      }
  });

  // 是否通过磁盘读写
  if (options.writeToDisk) {
    toDisk(context);
  }

  // 设置读写文件通过memory-fs
  setFs(context, compiler);

  const temp = middleware(context)

  // 返回一个middleware函数，包含close、context等静态属性与方法
  const tempObj = Object.assign(temp, {
    close(callback) {
      // eslint-disable-next-line no-param-reassign
      callback = callback || noop;

      if (context.watching) {
        context.watching.close(callback);
      } else {
        callback();
      }
    },

    context,

    fileSystem: context.fs,
  });
  return tempObj
};

content.js

module.exports = function ctx(compiler, options) {
  const context = {
    state: false,
    webpackStats: null,
    callbacks: [],
    options,
    compiler,
    watching: null,
    forceRebuild: false,
  };

  context.rebuild = rebuild;
  // 注册插件的钩子函数，主要作用就是打印消息
  context.compiler.hooks.invalid.tap('WebpackDevMiddleware', invalid);
  context.compiler.hooks.run.tap('WebpackDevMiddleware', invalid);
  context.compiler.hooks.done.tap('WebpackDevMiddleware', done);
  context.compiler.hooks.watchRun.tap(
    'WebpackDevMiddleware',
    (comp, callback) => {
      invalid(callback);
    }
  );

  return context;
};
```

### webpack-hot-middleware源码分析,只留关键代码

```
middleware.js 提供sse的服务端代码

function webpackHotMiddleware(compiler, opts) {
  
  // 通过createEventStream方法创建eventStream对象，该对象上包含publish向客户端发布消息的方法
  var eventStream = createEventStream(opts.heartbeat);
  
  // 插件注册钩子，兼容webpack的写法
  if (compiler.hooks) {
    compiler.hooks.invalid.tap('webpack-hot-middleware', onInvalid);
    compiler.hooks.done.tap('webpack-hot-middleware', onDone);
  } else {
    compiler.plugin('invalid', onInvalid);
    compiler.plugin('done', onDone);
  }
  function onInvalid() {
    // 发送 action: 'building'
    eventStream.publish({ action: 'building' });
  }
  function onDone(statsResult) {
    // 还是调用eventStream.publish向客户端发送消息
    publishStats('built', latestStats, eventStream, opts.log);
  }
  var middleware = function(req, res, next) {
    if (closed) return next();
    if (!pathMatch(req.url, opts.path)) return next();
    eventStream.handler(req, res);
    if (latestStats) {
      // Explicitly not passing in `log` fn as we don't want to log again on
      // the server
      publishStats('sync', latestStats, eventStream);
    }
  };
  middleware.publish = function(payload) {
    if (closed) return;
    eventStream.publish(payload);
  };
  middleware.close = function() {
    if (closed) return;
    // Can't remove compiler plugins, so we just set a flag and noop if closed
    // https://github.com/webpack/tapable/issues/32#issuecomment-350644466
    closed = true;
    eventStream.close();
    eventStream = null;
  };
  return middleware;
}

function createEventStream(heartbeat) {
  var clientId = 0;
  var clients = {};
  // 提取公共方法
  function everyClient(fn) {
    Object.keys(clients).forEach(function(id) {
      fn(clients[id]);
    });
  }
  // 心跳检测判断sse是否正常连接
  var interval = setInterval(function heartbeatTick() {
    everyClient(function(client) {
      client.write('data: \uD83D\uDC93\n\n');
    });
  }, heartbeat).unref();
  return {
    close: function() {
      // 关闭服务端sse连接
      clearInterval(interval);
      everyClient(function(client) {
        if (!client.finished) client.end();
      });
      clients = {};
    },
    handler: function(req, res) {
      // sse必要的header设置
      var headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        // While behind nginx, event stream should not be buffered:
        // http://nginx.org/docs/http/ngx_http_proxy_module.html#proxy_buffering
        'X-Accel-Buffering': 'no',
      };

      var isHttp1 = !(parseInt(req.httpVersion) >= 2);
      if (isHttp1) {
        req.socket.setKeepAlive(true);
        Object.assign(headers, {
          Connection: 'keep-alive',
        });
      }

      res.writeHead(200, headers);
      res.write('\n');
      var id = clientId++;
      // 保存当前连接的response
      clients[id] = res;
      req.on('close', function() {
        if (!res.finished) res.end();
        delete clients[id];
      });
    },
    publish: function(payload) {
      everyClient(function(client) {
        // 通过当前保存的response向客户端发送消息，这里是hash值、修改的模块名等
        client.write('data: ' + JSON.stringify(payload) + '\n\n');
      });
    },
  };
}

function publishStats(action, statsResult, eventStream, log) {

  var bundles = extractBundles(stats);
  bundles.forEach(function(stats) {
    var name = stats.name || '';

    eventStream.publish({
      name: name,
      action: action,
      time: stats.time,
      hash: stats.hash,
      warnings: stats.warnings || [],
      errors: stats.errors || [],
      modules: buildModuleMap(stats.modules),
    });
  });
}

client.js 提供客户端发起sse的文件

// 判断EventSource是否存在，EventSource对象是发起sse的对象
if (typeof window === 'undefined') {
  // do nothing
} else if (typeof window.EventSource === 'undefined') {
  console.warn(
    "webpack-hot-middleware's client requires EventSource to work. " +
      'You should include a polyfill if you want to support this browser: ' +
      'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events#Tools'
  );
} else {
  if (options.autoConnect) {
    connect();
  }
}

function EventSourceWrapper() {
  var source;
  var lastActivity = new Date();
  var listeners = [];
  // 初始化发起一个sse连接
  init();

  // 心跳检测，如果连接时间超过超时时间则断开重新连接
  var timer = setInterval(function() {
    if (new Date() - lastActivity > options.timeout) {
      handleDisconnect();
    }
  }, options.timeout / 2);
  
  // 初始化EventSource对象，并监听开启、错误、收到消息事件
  function init() {
    source = new window.EventSource(options.path);
    source.onopen = handleOnline;
    source.onerror = handleDisconnect;
    source.onmessage = handleMessage;
  }

  function handleOnline() {
    if (options.log) console.log('[HMR] connected');
    lastActivity = new Date();
  }

  function handleMessage(event) {
    lastActivity = new Date();
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](event);
    }
  }

  function handleDisconnect() {
    clearInterval(timer);
    source.close();
    setTimeout(init, options.timeout);
  }
  
  // 添加一个处理接收消息时的回调
  return {
    addMessageListener: function(fn) {
      listeners.push(fn);
    },
  };
}

function getEventSourceWrapper() {
  if (!window.__whmEventSourceWrapper) {
    window.__whmEventSourceWrapper = {};
  }
  if (!window.__whmEventSourceWrapper[options.path]) {
    // cache the wrapper for other entries loaded on
    // the same page with the same options.path
    window.__whmEventSourceWrapper[options.path] = EventSourceWrapper();
  }
  return window.__whmEventSourceWrapper[options.path];
}

function connect() {
  // 发起一个连接，并通过addMessageListener方法添加处理message的回调
  getEventSourceWrapper().addMessageListener(handleMessage);

  function handleMessage(event) {
    if (event.data == '\uD83D\uDC93') {
      return;
    }
    try {
      // 实际解析消息的方法
      processMessage(JSON.parse(event.data));
    } catch (ex) {
      if (options.warn) {
        console.warn('Invalid HMR message: ' + event.data + '\n' + ex);
      }
    }
  }
}

// 引入跟webpack交互的模块
var processUpdate = require('./process-update');

var customHandler;
var subscribeAllHandler;
function processMessage(obj) {
  switch (obj.action) {
    case 'building':
      if (options.log) {
        console.log(
          '[HMR] bundle ' +
            (obj.name ? "'" + obj.name + "' " : '') +
            'rebuilding'
        );
      }
      break;
    case 'built':
      if (options.log) {
        console.log(
          '[HMR] bundle ' +
            (obj.name ? "'" + obj.name + "' " : '') +
            'rebuilt in ' +
            obj.time +
            'ms'
        );
      }
    // fall through
    case 'sync':
      if (obj.name && options.name && obj.name !== options.name) {
        return;
      }
      var applyUpdate = true;
      if (applyUpdate) {
        // 与webpack交互的方法
        processUpdate(obj.hash, obj.modules, options);
      }
      break;
    default:
      if (customHandler) {
        customHandler(obj);
      }
  }

  if (subscribeAllHandler) {
    subscribeAllHandler(obj);
  }
}

process-update.js

var lastHash;
var failureStatuses = { abort: 1, fail: 1 };
// 支持module.hot.apply传入的参数
var applyOptions = {
  ignoreUnaccepted: true,
  ignoreDeclined: true,
  ignoreErrored: true,
  onUnaccepted: function(data) {
    console.warn(
      'Ignored an update to unaccepted module ' + data.chain.join(' -> ')
    );
  },
  onDeclined: function(data) {
    console.warn(
      'Ignored an update to declined module ' + data.chain.join(' -> ')
    );
  },
  onErrored: function(data) {
    console.error(data.error);
    console.warn(
      'Ignored an error while updating module ' +
        data.moduleId +
        ' (' +
        data.type +
        ')'
    );
  },
};

function upToDate(hash) {
  if (hash) lastHash = hash;
  return lastHash == __webpack_hash__;
}

module.exports = function(hash, moduleMap, options) {
  var reload = options.reload;
  // 是否需要触发热更新
  if (!upToDate(hash) && module.hot.status() == 'idle') {
    if (options.log) console.log('[HMR] Checking for updates on the server...');
    check();
  }

  function check() {
    // 传入需要更改的模块updatedModules
    var cb = function(err, updatedModules) {
      if (err) return handleError(err);
      
      // 如果没有即我们没有改动文件，直接再一次保存
      if (!updatedModules) {
        if (options.warn) {
          console.warn('[HMR] Cannot find update (Full reload needed)');
          console.warn('[HMR] (Probably because of restarting the server)');
        }
        performReload();
        return null;
      }

      var applyCallback = function(applyErr, renewedModules) {
        if (applyErr) return handleError(applyErr);

        if (!upToDate()) check();

        logUpdates(updatedModules, renewedModules);
      };
      // 调用module.hot.apply方法，执行变更的模块代码及accept注册的回调函数
      var applyResult = module.hot.apply(applyOptions, applyCallback);
      // webpack 2 promise
      if (applyResult && applyResult.then) {
        // HotModuleReplacement.runtime.js refers to the result as `outdatedModules`
        applyResult.then(function(outdatedModules) {
          applyCallback(null, outdatedModules);
        });
        applyResult.catch(applyCallback);
      }
    };
    // 调用module.hot.check检测需要更改的模块，并下载变更了的模块与当前的hash值hash.hot-update.json、hash.hot-update.js，module.hot是HotModuleReplacementPlugin插件提供的属性及方法
    var result = module.hot.check(false, cb);
    // webpack 2 promise
    if (result && result.then) {
      result.then(function(updatedModules) {
        cb(null, updatedModules);
      });
      result.catch(cb);
    }
  }
  // 浏览器端打印热更新相关的消息
  function logUpdates(updatedModules, renewedModules) {
    var unacceptedModules = updatedModules.filter(function(moduleId) {
      return renewedModules && renewedModules.indexOf(moduleId) < 0;
    });

    if (unacceptedModules.length > 0) {
      if (options.warn) {
        unacceptedModules.forEach(function(moduleId) {
          console.warn('[HMR]  - ' + (moduleMap[moduleId] || moduleId));
        });
      }
      performReload();
      return;
    }

    if (options.log) {
      if (!renewedModules || renewedModules.length === 0) {
        console.log('[HMR] Nothing hot updated.');
      } else {
        console.log('[HMR] Updated modules:');
        renewedModules.forEach(function(moduleId) {
          console.log('[HMR]  - ' + (moduleMap[moduleId] || moduleId));
        });
      }

      if (upToDate()) {
        console.log('[HMR] App is up to date.');
      }
    }
  }

  function handleError(err) {
    if (module.hot.status() in failureStatuses) {
      if (options.warn) {
        console.warn('[HMR] Cannot check for update (Full reload needed)');
        console.warn('[HMR] ' + (err.stack || err.message));
      }
      performReload();
      return;
    }
    if (options.warn) {
      console.warn('[HMR] Update check failed: ' + (err.stack || err.message));
    }
  }
  // 是否需要重新刷新整个页面
  function performReload() {
    if (reload) {
      if (options.warn) console.warn('[HMR] Reloading page');
      window.location.reload();
    }
  }
};

```

### webpakc-dev-server源码，只保留关键代码

```
class Server {
    // 更改webpack配置，如添加websoket的客户端代码、webpack热更新的代码等
    updateCompiler(this.compiler, this.options);

    // new express
    this.setupApp();

    // 调用webpack-dev-middleware，监听webpack编译文件
    this.setupDevMiddleware();

    // 创建服务
    this.createServer();

    setupApp() {
        this.app = new express();
    }

    setupDevMiddleware() {
        // middleware for serving webpack bundle
        this.middleware = webpackDevMiddleware(
        this.compiler,
        Object.assign({}, this.options, { logLevel: this.log.options.level })
        );
    }

    createServer() {
        this.listeningApp = http.createServer(this.app);
    }

    // 启动服务并监听对应的端口
    listen(port, hostname, fn) {
        return this.listeningApp.listen(port, hostname, (err) => {
            // 创建socket服务、具体的socket通信就不展开了
            this.createSocketServer();
        });
    }
}

addEntries.js

function addEntries(config, options, server) {
  if (options.inline !== false) {

    const app = server || {
      address() {
        return { port: options.port };
      },
    };

    // 拼接socket的入口文件路径，实现与服务端的socket通信
    const clientEntry = `${require.resolve(
      '../../client/'
    )}?${domain}${sockHost}${sockPath}${sockPort}`;

    // 获取webpack处理热更新文件的代码
    if (options.hotOnly) {
      hotEntry = require.resolve('webpack/hot/only-dev-server');
    } else if (options.hot) {
      hotEntry = require.resolve('webpack/hot/dev-server');
    }

    // eslint-disable-next-line no-shadow
    [].concat(config).forEach((config) => {
      
      // 将clientEntry添加到entry入口
      const additionalEntries = checkInject(
        options.injectClient,
        config,
        webTarget
      )
        ? [clientEntry]
        : [];

      // 将hotEntry添加到entry入口
      if (hotEntry && checkInject(options.injectHot, config, true)) {
        additionalEntries.push(hotEntry);
      }

      // 将additionalEntries添加实际的webpack entry
      config.entry = prependEntry(config.entry || './src', additionalEntries);

      if (options.hot || options.hotOnly) {
        config.plugins = config.plugins || [];
        // 如果用户没有手动使用HotModuleReplacementPlugin插件，则自动注入
        if (
          !config.plugins.find(
            (plugin) => plugin.constructor.name === 'HotModuleReplacementPlugin'
          )
        ) {
          config.plugins.push(new webpack.HotModuleReplacementPlugin());
        }
      }
    });
  }
}

./bin/webpack-dev-server

function startDevServer(config, options) {
  let compiler;

  compiler = webpack(config);

  // 创建一个Server实例
  server = new Server(compiler, options, log);
  serverData.server = server;
  
  // 调用server的listen方法，启动app并监听对应的端口
  server.listen(options.port, options.host, (err) => {
      if (err) {
        throw err;
      }
  });
}
```

### webpakc-dev-server的例子

只需要将hot || hotOnly属性设置为true即可，其它任何东西都不需要设置

```
webpack.config.js

module.exports = {
    mode: 'development',
    entry: [
        './src/app.js'
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: './index.html'
        })
    ],
    devServer: {
        contentBase: './dist',
        hot: true
    }
}
```


### webpack-dev-middleware + webpack-hot-middleware的例子

```
webpack.config.js

module.exports = {
    mode: 'development',
    entry: [
        'webpack-hot-middleware/client',
        './src/app.js'
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            inject: true,
            template: './index.html'
        })
    ]
}

server.js

const middleware = require('webpack-dev-middleware')
const hotMiddleware = require('webpack-hot-middleware')
const express = require('express')

const compiler = webpack(config)

const app = express()

app.use(middleware(compiler, {
    publicPath: config.output.publicPath,
    stats: {
        modules: false,
        children: false,
        chunks: true,
        chunkModules: false,
        colors: true
    }
}))

app.use(hotMiddleware(compiler))

app.listen(3001, function (err) {
    console.log('listen 3001')
})
```

总结：不论是webpack-dev-server还是webpack-dev-middleware + webpack-hot-middleware的组合，都是利用webpack.wacth来编译文件及检测webpack文件变化，然后给浏览器注入webpack热更新的js代码，以及与服务端通信的客户端代码来最终实现代码的热更新，形式在变，但是思路不变

具体例子可参考[webpack-tiny-server](https://github.com/willson-wang/webpack-tiny-server)

参考链接：

https://www.ruanyifeng.com/blog/2017/05/server-sent_events.html
https://github.com/webpack/webpack/blob/v4.41.4/hot/only-dev-server.js
