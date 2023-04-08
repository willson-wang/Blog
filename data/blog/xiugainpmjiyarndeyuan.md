---
  title: 修改npm及yarn的源
  date: 2019-07-16T03:21:57Z
  lastmod: 2022-10-06T17:50:17Z
  summary: 
  tags: ["开发工具", "npm", "yarn"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/yarn.png']
  bibliography: references-data.bib
---

## npm及yarn源的简单修改

### npm

设置单次包下载的源,以淘宝镜像为例

```shell
npm install package --registry https://registry.npm.taobao.org
```

设置全局镜像，以淘宝镜像为例

```shell
获取npm当前的源
npm config get registry

设置npm当前的源
npm config set registry https://registry.npm.taobao.org
```

### yarn 

设置单次包下载的源,以淘宝镜像为例

```shell
yarn add package --registry https://registry.npm.taobao.org
```

设置全局镜像，以淘宝镜像为例

```shell
获取yarn当前的源
yarn config get registry

设置yarn当前的源
yarn config set registry https://registry.npm.taobao.org
```

### 借助第三方工具实现快速切换npm及yarn源

npm借助nrm来实现

安装
```shell
yarn global add nrm || npm install -g nrm
```

列出可选的源,带 * 的是当前使用的源
```shell
nrm ls
```
![image](https://user-images.githubusercontent.com/20950813/61263472-8d213f00-a7bb-11e9-89ec-fec5e49564cf.png)


显示当前的源
```shell
nrm current
```

切换源

```shell
nrm use taobao
```

添加源

```shell
nrm add xxx https://registry-npm.xxx.com.cn/
```
![image](https://user-images.githubusercontent.com/20950813/61263484-9ad6c480-a7bb-11e9-8986-6ac3b5e19cdc.png)


删除源

```shell
nrm del xxx
```
![image](https://user-images.githubusercontent.com/20950813/61263498-a7f3b380-a7bb-11e9-8f15-423717b42aea.png)


测试响应时间

```shell
nrm test
```
![image](https://user-images.githubusercontent.com/20950813/61263541-dc676f80-a7bb-11e9-99f6-d1645831627c.png)

yarn借助yrm来实现
yrm是nrmfork出来的，使用方式与nrm保持一致
区别是使用yrm use 切换源时，会同时切换npm及yarn的源，而nrm则只会切换npm的源
另外nrm与yrm不能共存，先全局装了yrm,然后又全局装了nrm,导致yrm不能使用了


## 参考链接
https://github.com/Pana/nrm
https://github.com/i5ting/yrm
