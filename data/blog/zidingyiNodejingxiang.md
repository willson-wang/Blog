---
  title: 自定义Node镜像
  date: 2022-12-16T14:35:31Z
  lastmod: 2022-12-16T14:37:18Z
  summary: 
  tags: ["包管理工具", "docker", "Node镜像", "npm", "yarn"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/nodejs.png']
  bibliography: references-data.bib
---

<a name="fHow6"></a>
# 背景
最近一段时间公司陆续有业务组，反馈云服务器上构建的时候，npm依赖拉取不下来，导致项目部署不成功，于是发现主要是两个问题导致(公司目前主流还是使用`yarn` 1.x 版本)

- 项目`yarn.lock`内还使用了`npm`官方源or `yarn`官方源安装的包
- 部分`npm`包，在`install`相关钩子执行的时候，会去下载一些二进制文件，而这些二进制文件往往是国外的地址

所以为了彻底解决`yarn install`的时候，能够不受这些因素的影响，决定提供`node`基础镜像，在镜像里面替换`yarn.lock`内的链接，且添加对应的`.npmrc`，保证项目不受外国网络限制，能够正常`install`
<a name="H5Jee"></a>
# 制作镜像
基于公司的应用场景，决定提供两类基础镜像

- `alpine`镜像
- 非`alpine`镜像

两类镜像，各提供三个版本

- 12.x.x
- 14.x.x
- 16.x.x
<a name="UdvMU"></a>
## .npmrc
`yarn`、`pnpm`、`npm`等包管理工具，读取配置的优先级是，命令行参数 > 配置文件参数
而`yarn`、`pnpm`这些后于`npm`的包管理工具，默认都会读取`.npmrc`文件，所以为了考虑将来可能切换包管理工具，使用`.npmrc`来保存配置，而不是使用`.yarnrc`

`yarn`读取配置文件的顺序如下所示

- 项目目录下的`.npmrc`
- 用户目录下的`.npmrc`
- 项目目录下的`.yarnrc`
- 用于目录下的`.yarnrc`

如果存在多个配置文件，则会进行合并
```bash
Checking for configuration file "/Users/xxx/node-performance/.npmrc".
Checking for configuration file "/Users/xiaoming/.npmrc".
Found configuration file "/Users/xiaoming/.npmrc".
Checking for configuration file "/usr/local/etc/npmrc".
Checking for configuration file "/Users/xxx/node-performance/.npmrc".
Checking for configuration file "/Users/xxx/.npmrc".
Checking for configuration file "/Users/xiaoming/Documents/.npmrc".
Checking for configuration file "/Users/xiaoming/.npmrc".
Found configuration file "/Users/xiaoming/.npmrc".Checking for configuration file "/Users/.npmrc".
Checking for configuration file "/Users/xxx/node-performance/.yarnrc".
Checking for configuration file "/Users/xiaoming/.yarnrc".
Found configuration file "/Users/xiaoming/.yarnrc".
Checking for configuration file "/usr/local/etc/yarnrc".Checking for configuration file "/Users/xxx/node-performance/.yarnrc".
Checking for configuration file "/Users/xxx/.yarnrc".
Checking for configuration file "/Users/xiaoming/Documents/.yarnrc".
Checking for configuration file "/Users/xiaoming/.yarnrc".
Found configuration file "/Users/xiaoming/.yarnrc".
Checking for configuration file "/Users/.yarnrc"
```

而`.npmrc`内两类内置两类参数

- 源地址
- 一些`npm`包下载第三方文件时，允许使用指定下载地址的参数

最终的`.npmrc`如下所示
```
// 常用变量
sass_binary_site=https://npmmirror.com/mirrors/node-sass
sentrycli_cdnurl=https://npmmirror.com/mirrors/sentry-cli
electron_mirror=https://npmmirror.com/mirrors/electron
chromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver
operadriver_cdnurl=https://npmmirror.com/mirrors/operadriver
selenium_cdnurl=https://npmmirror.com/mirrors/selenium
puppeteer_download_host=https://npmmirror.com/mirrors
grpc-node-binary-host-mirror=https://npmmirror.com/mirrors

// 指定源
registry=https://registry.npmmirror.com
```
<a name="jfssT"></a>
## 替换yarn.lock
```javascript
const fs = require('fs');

function createReg(regsitry: string) {
  return new RegExp(`http(s)?://${regsitry}`, 'g');
}

export default function changeYarnLockRegistry(registry: string, yarnLockFile: string) {
  if (registry.slice(-1) === '/') {
    registry = registry.slice(0, -1);
  }
  console.log('当前替换的源为: ', registry);
  const replaceMap = new Map([
    [/\/download\/@.*\//g, '/-/'],
    [/\/download\//g, '/-/'],
    [/\/-\/-\/download/g, '/download/-/download'],
    [/\/-\/download\/download/g, '/download/-/download'],
    [createReg('registry.npmjs.org'), registry],
    [createReg('registry.yarnpkg.com'), registry],
    [createReg('r.cnpmjs.org'), registry],
    [createReg('registry.npm.taobao.org'), registry],
    [createReg('registry.nlark.com'), registry],
    [createReg('registry.npmmirror.com'), registry],
    [createReg('registry.enpmjs.org'), registry],
  ]);

  let content = fs.readFileSync(yarnLockFile, 'utf8');

  for (const [key, value] of replaceMap) {
    content = content.replace(key, value);
  }

  fs.writeFileSync(yarnLockFile, content, 'utf8');
}
```

使用上面的方法，对`yarn.lock`内的源地址进行替换，替换成执行的源地址，这样就能100%保证`yarn.lock`内的源地址
<a name="NeASz"></a>
## 简版镜像(alpine)
当`.npmrc`与`yarn.lock`替换方法准备好之后，后面就是镜像的制作了
制作镜像
```dockerfile
FROM node:12.22.11-alpine

# 修正时区
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && apk update \
	  && apk add -U tzdata && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# 将当前目录下的.npmrc拷贝到镜像的根目录，确保构建工具能够正确读取配置
COPY ./.npmrc /root/.npmrc

# 添加一个参数，确保能够知道镜像是否使用的是最新镜像
ARG NODE_VERSION

# 这里在设置一次的目的是保证，在postInstall这些钩子里面，执行js脚本的时候，在脚本里面通过npm install包的时候，能够使用指定的源，而不是yarn官方源去下载
RUN npm config set registry https://registry.npmmirror.com/ \
    && yarn config set registry https://registry.npmmirror.com/ \
    && npm install -g pnpm@6.32.3 @yunke/yinstall@0.0.1-beta.8 \
    && pnpm config set store-dir /root/.pnpm-store \
    && yinstall cover \
    && npm config set yk_node_version $YK_NODE_VERSION
```

`yinstall`内包含`yarn.lock`替换逻辑
<a name="yyUoW"></a>
## 完整版镜像
完整版镜像与简版镜像制作的区别，就只有时区的设置不同，其它都是一样的
```dockerfile
FROM node:12.22.11

RUN sed -i 's#http://security.debian.org/debian-security#http://mirrors.aliyun.com/debian-security#g' /etc/apt/sources.list && \
    sed -i 's#http://deb.debian.org#http://mirrors.aliyun.com#g' /etc/apt/sources.list && \
    apt-get clean && \
    apt-get update && \
    apt-get install -y tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

ARG YK_NODE_VERSION

COPY ./.npmrc /root/.npmrc

RUN npm config set registry registry https://registry.npmmirror.com/ \
    && yarn config set registry registry https://registry.npmmirror.com/ \
    && npm install -g pnpm@6.32.3 @yunke/yinstall@0.0.1-beta.8 \
    && pnpm config set store-dir /root/.pnpm-store \
    && yinstall cover \
    && npm config set yk_node_version $YK_NODE_VERSION
```
<a name="oKwTg"></a>
# 总结
`yarn` 1.x的版本，源地址是保存在`yarn.lock`内的，所以当有`yarn.lock`存在时，只能去修改`yarn.lock`内的源地址才有效，直接设置`registry`参数是无效的，这个问题，在后续的`pnpm`、`npm`、`yarn 2.x`中都得到了解决，只需要设置`registry`就可以控制`npm`包的下载地址，但是对于一些`npm`包内下载第三方包，目前还是只能通过指定对应的变量来控制下载地址

