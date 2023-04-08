---
  title: npm && yarn常用命令
  date: 2019-11-24T07:11:31Z
  lastmod: 2023-03-25T04:08:35Z
  summary: 
  tags: ["包管理工具", "yarn", "npm"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/npm.png']
  bibliography: references-data.bib
---

## 创建package.json

| npm | yarn |
|--   |   ---    |
| npm init or npm init -y | yarn init or yarn init -y |

## 安装模块

|npm | yarn |
|--  | ---- |
| npm install lodash or npm i lodash or npm i lodash --save | yarn add lodash |
| npm install webpack --save-dev | yarn add webpack --dev |
| npm install webpack -D | yarn add webpack -D |
| npm i qs@6.0.0  | yarn add qs@6.0.0 |
| npm i react react-dom prop-types --save | yarn add react react-dom prop-types |
| npm i `@babel/{core,cli}` --save-dev  | yarn add `@babel/{core,cli}` --dev |
| npm i npm-checked -g | yarn global add npm-checked |

## 卸载模块

| npm | yarn  |
| --  | -- |
| npm uninstall webpack | yarn remove webpack |
| npm uninstall react react-dom prop-types | yarn remove react react-dom prop-types |
| npm uninstall `@babel/{core,cli}`  | yarn remove `@babel/{core,cli}` |

## 获取安装包信息

| npm | yarn  |
| --  | -- |
| npm view react | yarn info react |
| npm view react version | yarn info react version |
| npm view react versions | yarn info react versions |
| npm view react readme | yarn info react readme |

## 搜索安装包

| npm | yarn  |
| --  | -- |
| 


## 依赖枚举

| npm | yarn  |
| --  | -- |
| npm list or npm ls | yarn ls |
| npm list --depth=0 | yarn list --depth=0 |
|  | yarn list --depth=0 --pattern=md5 |
| | yarn list --depth=0 --pattern="md5|webpack" |
| npm ls -g --depth=0 |  |

## 查看最新依赖

| npm | yarn  |
| --  | -- |
| npm outdate | yarn outdated |
| npm outdate qs | yarn outdated qs |

## 更新依赖

| npm | yarn  |
| --  | -- |
| npm outdate | yarn outdated |
| npm update | yarn upgrade |
| npm update qs | yarn upgrade qs@6.9.1 |

注意yarn upgrade不会更新package.json内依赖的版本号，解决方法可参考[issues](https://github.com/yarnpkg/yarn/issues/2042)

## 本地软链接

| npm | yarn  |
| --  | -- |
| npm link && cd app && npm link xxx | yarn link && cd app && yarn link xxx |
|  | yarn unlink && cd app && yarn unlink xxx |


