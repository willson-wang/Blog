---
  title: Vue中引入sentry收集前端错误日记
  date: 2019-06-06T01:47:17Z
  lastmod: 2019-06-12T15:39:51Z
  summary: 
  tags: ["前端框架", "vue", "sentry"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/sentry.png']
  bibliography: references-data.bib
---

记录一下自己在项目中使用sentry来进行前端错误日记的收集过程；

1、项目中引入sentry，我们是通过引入sentry提供的sdk来进行错误日志的收集；而sdk有旧的版本，就是raven.js及新的版本@sentry/browser，二者使用上的区别并不大，我采用的是最新的sdk

旧的sdk
```
import Vue from 'vue'
import Raven from 'raven-js'
import RavenVue from 'raven-js/plugins/vue'

// 增加sentry日志
function sentryInit() {
    Raven
        .config('http://d1fe5a42681d42cfa3729e93d8293fee@xxxxxx/48')
        .addPlugin(RavenVue, Vue)
        .install()
}

export default sentryInit
```

最新的sdk
```
import Vue from 'vue'
import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'

function sentryInit() {
    console.log('sentryInit')
    Sentry.init({
        dsn: 'http://d1fe5a42681d42cfa3729e93d8293fee@xxxxx/48',
        integrations: [new Integrations.Vue({
            Vue, attachProps: true
        })],
        beforeSend: function (event) {
            // sentry错误日志发送前、发送拦截器，在这可以做些特殊处理
            if (event.user) {
                delete event.user.email;
            }
            console.log('beforeSend', event);
            return event;
        },
        environment: 'dev'
    })
}

```

上面的只是基础设置，当我们需要更好的收集及分类错误信息的时候，需要通过sentry提供的方法来添加一些额外的信息，如tag、user、level、breadcrumb、extra等

两种方式添加，第一种方式在Sentry.configureScope方法内配置
```
Sentry.configureScope((scope) => {
        // 设置用户信息
        scope.setUser({'email': 'john.doe@example.com'});
        // 设置tag
        scope.setTag('page_locale', 'de-at');
        // 设置错误级别
        scope.setLevel('warning');
    });
```

第二种方式，使用sentry上的方法来添加

```
// 设置用户信息
Sentry.setUser({name: 'jack', age: '18', phone: 13510228172});
// 设置tag
Sentry.setTag('local', '1111');
Sentry.setTag('orgCode', 'asj898989');
// 设置breadcrumb
Sentry.addBreadcrumb({
    category: 'auth',
    message: 'Authenticated user ' + 'aaa@168.com',
    level: log.Level.INFO,
    Type: 'error'
});
// 添加额外的信息
Sentry.setExtra('character_name', 'Mighty Fighter');
```

看下各个信息在后台显示的位置
用户信息

![image](https://user-images.githubusercontent.com/20950813/59365042-72961900-8d6a-11e9-9446-064b03da6d1b.png)

tag

![image](https://user-images.githubusercontent.com/20950813/59365083-85105280-8d6a-11e9-95fe-552cabd898d1.png)

level

![image](https://user-images.githubusercontent.com/20950813/59365110-92c5d800-8d6a-11e9-94a4-355fcc1e3588.png)

修改日期

![image](https://user-images.githubusercontent.com/20950813/59365270-dd475480-8d6a-11e9-8fd4-36128cc44d4d.png)


extra

![image](https://user-images.githubusercontent.com/20950813/59365321-f3edab80-8d6a-11e9-8317-11b33817945c.png)

environment

![image](https://user-images.githubusercontent.com/20950813/59365353-036cf480-8d6b-11e9-9b3e-4998f3c0166a.png)


这里不需要主动通过Senrty.captureException(error)去收集错误日志，因为sentry的vue集成，已经在代码内做了一层封装，我们可以看下@sentry/integrations/vue.js

```
version: 5.4.0

Vue.prototype.setupOnce = function (_, getCurrentHub) {
    // tslint:disable:no-unsafe-any
    var _this = this;
    if (!this._Vue || !this._Vue.config) {
        console.error('VueIntegration is missing a Vue instance');
        return;
    }
    // 如果外面设置了全局的errorHandler方法，则先用一个变量保存起来
    var oldOnError = this._Vue.config.errorHandler;
    // 添加errorHandler方法
    this._Vue.config.errorHandler = function (error, vm, info) {
        var metadata = {};
        if (utils_1.isPlainObject(vm)) {
            metadata.componentName = _this._formatComponentName(vm);
            if (_this._attachProps) {
                metadata.propsData = vm.$options.propsData;
            }
        }
        if (info !== void 0) {
            metadata.lifecycleHook = info;
        }
        if (getCurrentHub().getIntegration(Vue)) {
            getCurrentHub().withScope(function (scope) {
                Object.keys(metadata).forEach(function (key) {
                    scope.setExtra(key, metadata[key]);
                });
                // 发送错误日志
                getCurrentHub().captureException(error);
            });
        }
        // 执行外面设置的errorHandler方法
        if (typeof oldOnError === 'function') {
            oldOnError.call(_this._Vue, error, vm, info);
        }
    };
};
```

这里需要注意的是，如果代码内，我们使用了try catch处理，那么vue全局的errorHandler的方法是捕捉不到错误的，所以我们需要主动通过captureException去收集发送异常信息；

```
test () {
    try {
        this.getError();
    } catch (error) {
        console.log('error', error);
        // 需要主动捕捉错误
        Senrty.captureException(error)
    }
}
```

因为我们在代码中需要使用try catch，而我们也需要收集一些try catch内的错误，所以在封装一下log方法，方便调用
```
import * as Sentry from '@sentry/browser';

const log = {}

/**
 * 写普通日志
 * @param {String} title
 * @param {String} level
 */
log.writeNormalLog = function writeNormalLog(title = '', level = 'info') {
    Sentry.captureMessage(title, {
        level
    })
}

/**
 * 写异常日志
 * @param {String} err
 * @param {String} level
 */
log.writeErrorLog = function writeExLog({ err, phone, orgCode, level = 'error' }) {
    Sentry.setUserContext({
        phone,
        orgCode
    })
    Sentry.captureException(err, {
        level,
    })
}

log.Level = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
}

export default log
```

这监听本地环境是没有什么问题的，可以清除的看到错误信息所在的位置；但是在生产环境是不行的，看不到具体报错所在的位置，所以需要借助souremap；这里上传sourcemap文件到sentry服务器有两种方式，第一种是使用sentry-cli，第二种是使用webpack

第一步设置版本号
```
Sentry.init({
  release: "my-project-name@2.3.12"
})
```

第二步，上传sentry服务器

使用webpack上传
```
$ npm install --save-dev @sentry/webpack-plugin
$ yarn add --dev @sentry/webpack-plugin

const SentryWebpackPlugin = require('@sentry/webpack-plugin');

module.exports = {
  output: {
      path: path.join(__dirname, 'dist'),
      filename: "[name].js",
      sourceMapFilename: "[name].js.map"
    }
  // other configuration
  plugins: [
    new SentryWebpackPlugin({
      include: '.',
      ignoreFile: '.sentrycliignore',
      ignore: ['node_modules', 'webpack.config.js'],
      configFile: 'sentry.properties'
    })
  ]
};

```

或者使用sentry-cli上传
```
export SENTRY_AUTH_TOKEN=token
export SENTRY_ORG=my-org
VERSION=$(sentry-cli releases propose-version)

# Create a release
sentry-cli releases new -p project1 -p project2 $VERSION

# Associate commits with the release
sentry-cli releases set-commits --auto $VERSION
```

参考连接：
https://docs.sentry.io/workflow/releases/?platform=browsernpm
https://docs.sentry.io/platforms/javascript/

