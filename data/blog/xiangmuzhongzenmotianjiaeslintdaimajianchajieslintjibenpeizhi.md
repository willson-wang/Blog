---
  title: 项目中怎么添加eslint代码检查及eslint基本配置
  date: 2017-12-11T09:32:30Z
  lastmod: 2017-12-11T09:40:31Z
  summary: 
  tags: ["开发工具", "eslint"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

前端开发到目前为止，已经是多团队，跨项目开发，那么在各个团队及各个项目来回切换的时候，怎么去提高我们的开发效率，显然规范化能够帮助我们解决这个问题，那么到目前为止eslint是一个很棒的js代码规范化选择，我们可以根据官方的规则来进行定制，也可以根据一些成型的规则来引入如standard等；每个团队可以根据自己公司的要求来进行选择，下面是如何在项目中引入eslint的步骤。

**eslint安装有两种方式**

1. 使用全局安装  npm install -g eslint
2. 项目文件内安装  npm install --save-dev eslint


**eslint使用方式，不配置package.json**

1. 初始化eslintrc.js文件，全局直接在项目目录内使用eslint --init
2. 项目内安装git 内使用./node_modules/.bin/eslint --init；cmd内使用 .\node_modules\.bin\eslint --init
3. 配置eslintrc.js文件，这里我们使用standard配置文件，然后在上面做些许修改
4. eslint进行代码检查，git上使用./node_modules/.bin/eslint 需要被检查的.js文件

**eslint使用方式，进行package.json设置**

1. 在scripts对象内配置lint命令"lint": "eslint --ext .js,.vue src"
2. 运行npm run lint即可对src目录下所有.js与.vue后缀的文件进行检查

**eslint修复错误代码**

1. 运行代码./node_modules/.bin/eslint --fix src or ./node_modules/.bin/eslint --fix src/utils/index.js
2. 在scripts内配置命令"fix": "eslint --fix src" or "fix": "eslint --ext .js,.vue --fix src" or "fix": "eslint --fix src/utils/index.js"

**参考链接**
https://github.com/eslint/eslint
https://github.com/standard/standard
http://eslint.cn/docs/rules/
