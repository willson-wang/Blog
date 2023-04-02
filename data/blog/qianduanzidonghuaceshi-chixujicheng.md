---
  title: 前端自动化测试&持续集成
  date: 2019-08-11T05:06:33Z
  lastmod: 2019-08-11T07:47:26Z
  summary: 
  tags: ["Test"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/travis.png']
  bibliography: references-data.bib
---

### 什么是持续集成

Travis CI 提供的是持续集成服务（Continuous Integration，简称 CI）。它绑定 Github 上面的项目，只要有新的代码，就会自动抓取。然后，提供一个运行环境，执行测试，完成构建，还能部署到服务器。

持续集成指的是只要代码有变更，就自动运行构建和测试，反馈运行结果。确保符合预期以后，再将新代码"集成"到主干。

持续集成的好处在于，每次代码的小幅变更，就能看到运行结果，从而不断累积小的变更，而不是在开发周期结束时，一下子合并一大块代码。

### 使用准备

Travis CI目前只支持github，不支持其它代码托管服务，所以只有是github项目才可以使用Travis CI

前往https://travis-ci.org绑定github账号

选择要使用Travis CI的项目，如下图所示

![image](https://user-images.githubusercontent.com/20950813/62831187-d2674e00-bc4d-11e9-9471-8692c132bc35.png)

### travis配置项.travis.yml

Travis 要求项目的根目录下面，必须有一个.travis.yml文件。这是配置文件，指定了 Travis 的行为。该文件必须保存在 Github 仓库里面，一旦代码仓库有新的 Commit，Travis 就会去找这个文件，执行里面的命令。

```
language: node_js  #指定默认运行环境
node_js:  #指定node版本，还可以通过.nvmrc来指定node版本
  - '12'
  - '10'
  - '8'
sudo: true #是否开启管理员权限
cache: #缓存配置项
  directories:
  - node_modules
before_install: #install执行之前
- npm i
script: #执行scripts脚本
- npm run build
after_success: #执行scripts脚本成功之后
- npm run coveralls
```

### 运行流程

Travis 的运行流程很简单，任何项目都会经过两个阶段。

```
1. install 阶段：安装依赖
2. script 阶段：运行脚本
```

install字段用来指定安装脚本、
script字段用来指定构建或测试脚本

可以指定运行脚本，也可以直接指定命令

```
install: ./install-dependencies.sh

install:
  - command1
  - command2
```

围绕这两个阶段有七个钩子函数

```
before_install：install 阶段之前执行
before_script：script 阶段之前执行
after_failure：script 阶段失败时执行
after_success：script 阶段成功时执行
before_deploy：deploy 步骤之前执行
after_deploy：deploy 步骤之后执行
after_script：script 阶段之后执行
```

完整的生命周期为

```
before_install：install 阶段之前执行
install
before_script：script 阶段之前执行
script
after_success：script 阶段成功时执行 || after_failure：script 阶段失败时执行
before_deploy：deploy 步骤之前执行
after_deploy：deploy 步骤之后执行
after_script：script 阶段之后执行
```

### 以发布一个npm包为例

在一个包发布之前，我们一般需要先进行测试，测试通过之后，在进行打包构建，生成支持不同端的文件，构建成功之后，在通过npm publish发布出去，如上述步骤，如果我们通过手工操作的话，可以把这些命令最后也可以合并到一个，但是每次我们改动之后，需要重新发包，则要重新执行整个命令，而我们接入travis ci之后，只要我们push代码到github仓库，则travis ci检测到更新之后，会按照.travis.yml来执行我们指定的任务，具体步骤如下所示

初始文件目录如下所示
```
.
├── src   # source code
└── packages.json
```

1.添加单元测试文件

```
yarn add mocha chia --dev
.
├── src   # source code
├── test  # unit test
└── packages.json
```

2.packages.json的scripts内定义test命令

```
"scripts": {
    "test": "mocha"
}
```

3.引入coveralls增加代码测试覆盖率报告, packages.json的scripts内定义coveralls命令

```
yarn add nyc coveralls --dev

"scripts": {
    // 执行测试命令，--reporter=text-lcov自定报告输出的个数，最后将报告上传到coveralls
    "coveralls": "nyc npm test && nyc report --reporter=text-lcov | coveralls"
}

```

4.绑定coveralls账号及跟目录下添加.coveralls.yml配置文件

进入https://coveralls.io/ 绑定github账号，打开需要上传coveralls报告的项目，开启之后，进入details查看项目对应的repo_token及service_name，如下图所示

![image](https://user-images.githubusercontent.com/20950813/62831204-03e01980-bc4e-11e9-9a46-5726b7a0a306.png)

项目根目录下创建.coveralls.yml配置文件，内容就包含service_name及repo_token，因为repo_token属 于个人隐私信息，所以我们不能把.coveralls.yml上传到github上，在.gitignore中增加.coveralls.yml；repo_token我们有两种方式配置，第一种通过本地的travis encrypt COVERALLS_TOKE=repo_token生成加密串，然后在配置到.travis.yml配置文件中，另一种方式则是通过travis-ci后台设置环境变量

上一步完成之后，不论是在本地测试还是通过travis ci来进行测试，都是可以将正确的测试报告上传到coveralls了

```
.
├── src   # source code
├── test  # unit test
├── .coveralls.yml  # coveralls setting
└── packages.json
```

5.本地安装travis，以便通过命令行来生成or添加.travis.yml配置文件内的配置项（非必须）

```
这里以mac os为例

sudo gem install travis
```

mac os在安装travis的时候，可能不会成功，原因是mac本身自带ruby，但是ruby版本过低的话，安装就会失败，所以需要先升级一下ruby

```
brew install ruby
```

升级完ruby之后，如果还失败，则可能是环境变量未配置的原因，然后在对应的配置文件内配置环境变量即可，如我使用zsh，那么则直接在~/.zshrc内添加下ruby及gem的path

```
export PATH="/usr/local/opt/ruby/bin:$PATH"
export LDFLAGS="-L/usr/local/opt/ruby/lib"
export CPPFLAGS="-I/usr/local/opt/ruby/include"
export PKG_CONFIG_PATH="/usr/local/opt/ruby/lib/pkgconfig"
export PATH="/usr/local/lib/ruby/gems/2.6.0/bin":$PATH
```

travis安装成功之后，在命令行检查下travis的版本

```
travis -v
```

根目录下创建.travis.yml文件,比如我们只需要测试，构建，不需要部署到服务器or发布npm包，如下所示

```
language: node_js
node_js:
- '12'
- '10'
- '8'
sudo: true
cache:
  directories:
  - node_modules
before_install:
- npm i
script:
- npm run build
after_success:
- npm run coveralls #构建完成之后执行coveralls命令
```

上面这个还少了coveralls的repo_token，所以我们利用本地的travis来生成加密串

```
travis encrypt COVERALLS_TOKE=repo_token的值
```

把travis生成加密串配置到.travis.yml env global下

```
language: node_js
node_js:
- '12'
- '10'
- '8'
sudo: true
cache:
  directories:
  - node_modules
before_install:
- npm i
script:
- npm run build
after_success:
- npm run coveralls
env:
  global:
    # coveralls的repo_token的加密token串
    secure: ibEqQUpC2mJzTvM2DWzXeL5Rh0hLs1HmCY83Pgpia7l40BK3MKR6TB574CRmCj7TXQ/wIqldQFe3+/iRrtawl/unvji59pCcBVJN2C0K9QpRcYj74DFPfsgbb6Z5YW/RzZPgm8NhKaTwAa/bZ8HMgNcatOFKnRlOpmXz92K4PkgFJMY0Z4eH4y8eOtH3Yc+HRezHvEYoQoqoWrwcWyXk6OVdQSrXeHi8nEsVF3pX4zu/gl66P02k4/bvDzVSnpN0Mt6myDwB/sMQlTGLDCW1dauNVzVQi/nXrnF1Ti7
      20+grpTTFln1CgNRyeUUhaG3OLy7ciUmTHxwSNHTkNHzUII4+fn3MvHWb/5CtasaqFo2f0hX1oJ8gsDWFCqTZgnYKMKjcdN4k1U1DqeRA1LKXyZt0wyZrQe/aMKWE7DQRRswEjrOBiD4n629z3EZXqsB9
      nUHFE45x4IowAeMSJ1G0YddBF9ikRwP5ufuxDweHxrPZf0nKqGmfpEysYONPLA4JAemkM8VlY5yiUNe/l+2UypdrXXu6Mf0OWToEq8cw+u2CtngLsdI+CjNUGeQJ55+NH0AqovUMHUDhED18Nnnj0LjZpmuf5mbKcljqpSyii/85PSGlZKY+erNUB+leQAp45DHniBASGQ2ccGFZsLBuI5rK3EE102tgJtY6cj9OH54=
```

到这里为止，当我们每次修改代码，push之后，travis则会自动去帮我们进行测试，并将测试报告上传到coveralls上；

6.项目中添加徽标

我们可以在我们的README.md中加入travis ci及coveralls的徽标，如下图所示

![image](https://user-images.githubusercontent.com/20950813/62831211-2114e800-bc4e-11e9-8120-36f29659cb15.png)

获取徽标的方式有两种

第一种方式travis ci or coveralls后台获取，如下图所示

![image](https://user-images.githubusercontent.com/20950813/62831213-2b36e680-bc4e-11e9-8ebe-e28c6a0efa48.png)

![image](https://user-images.githubusercontent.com/20950813/62831218-37bb3f00-bc4e-11e9-9c79-44ce3ba47991.png)

第二种方式，在https://shields.io/ 站点内获取，如下图所示

![image](https://user-images.githubusercontent.com/20950813/62831228-57eafe00-bc4e-11e9-99dc-25dc043bbc15.png)

![image](https://user-images.githubusercontent.com/20950813/62831231-69340a80-bc4e-11e9-9fcc-2bc860517f16.png)


7.通过travis ci自动帮助我们发布npm包

例如我们约定每次打一个新的tag时，则表示需要发布一个新的npm版本，首先在我们的package.json内添加一个发布命令

```
"scripts": {
    // 使用yarn release表示我们需要发布一个新的npm版本
    "release": "npm test && git commit -am $npm_package_version && git tag $npm_package_version && git push && git push --tags",
},
```

然后在.travis.yml内添加自动发布npm包的命令，如下所示

```
deploy:
  provider: npm #发布npm包
  email: wangkangsen168@163.com  #接收信息邮件
  on:
    tags: true # 是个根据tag来进行发布
  skip_cleanup: true
```

此时我们还缺少一个npm的凭证，所以我们需要登录自己的npm账号，然后在设置token那一栏创建一个新的token，好让travis ci帮助我们自动发包

通过travis命令行对npm token进行加密

```
travis encrypt npm_token --add deploy.api_key

deploy:
  provider: npm
  email: wangkangsen168@163.com
  on:
    tags: true
  skip_cleanup: true
  api_key:
    secure: Pd1hhWae/fzKe+zir6U/f8VAjXI5iSOQAoKpdxthaUghhO+zD8uTmdiZkC7i4tbU27ZPRmMScgAWjfgOt25L1lF45UUJECbfh9J0gjsu+2z7qgsFdsIyol+w7zCI1JRZGRVho7rIhpnstgpPfQ2uvhbFfRhDUWllRBydsB4aqumxL65tFno51j0cYkrcAzsAcBPoUZFItbDSZFRjHI+we/DcmUOP24e7etJS1gSpf6Y1ZiBpAUFy5QwF8mJ7F50TnnJEqBeoNyMliFVlDMLN0uYRNwpquyMsih+UhX7xCfllBUS3/ppzumGxXFrNJwyfEfSKEAcZk57+KA1yZ2jycwwdLUUA7EcpmVdEzWp04D+4Uejmm+AT4aWi7eOJKKn8ZRHdhkvFWqMd9miU7yTkbzp+QWmyGeTYY/U8N259NF//tON51rbpcu5A45ElWrKRmVRGkmdgkbQlO+FX+MUYZ8pRVo2DVTKEJfgP1USu73bGgBYo5Rij750tsPY3e0PWLEkgmJ4A/NElnM8Gq9C8b2nFA/5H9Jd9JYaubL8ONrmBms93lAw1x515C7LAF2mWUz9CF+ARgnhuFce/zSmmQi8i7AizkHdQQzANYaX872xJB/lyxtAl7myKn64iSP6GpvgGSSUGvP/0pC+dV21cPTcjD9YooHLOYVAVd75pM3A=
```

配置完成之后，我们如果需要发新的版本包，修改完成之后，只需要执行yarn release则会自动发布npm包

一个完整的.travis.yml
```
language: node_js
node_js:
- '12'
- '10'
- '8'
sudo: true
cache:
  directories:
  - node_modules
before_install:
- npm i
script:
- npm run build
after_success:
- npm run coveralls
deploy:
  provider: npm
  email: wangkangsen168@163.com
  on:
    tags: true
  skip_cleanup: true
  api_key:
    secure: Pd1hhWae/fzKe+zir6U/f8VAjXI5iSOQAoKpdxthaUghhO+zD8uTmdiZkC7i4tbU27ZPRmMScgAWjfgOt25L1lF45UUJECbfh9J0gjsu+2z7qgsFdsIyol+w7zCI1JRZGRVho7rIhpnstgpPfQ2uvhbFfRhDUWllRBydsB4aqumxL65tFno51j0cYkrcAzsAcBPoUZFItbDSZFRjHI+we/DcmUOP24e7etJS1gSpf6Y1ZiBpAUFy5QwF8mJ7F50TnnJEqBeoNyMliFVlDMLN0uYRNwpquyMsih+UhX7xCfllBUS3/ppzumGxXFrNJwyfEfSKEAcZk57+KA1yZ2jycwwdLUUA7EcpmVdEzWp04D+4Uejmm+AT4aWi7eOJKKn8ZRHdhkvFWqMd9miU7yTkbzp+QWmyGeTYY/U8N259NF//tON51rbpcu5A45ElWrKRmVRGkmdgkbQlO+FX+MUYZ8pRVo2DVTKEJfgP1USu73bGgBYo5Rij750tsPY3e0PWLEkgmJ4A/NElnM8Gq9C8b2nFA/5H9Jd9JYaubL8ONrmBms93lAw1x515C7LAF2mWUz9CF+ARgnhuFce/zSmmQi8i7AizkHdQQzANYaX872xJB/lyxtAl7myKn64iSP6GpvgGSSUGvP/0pC+dV21cPTcjD9YooHLOYVAVd75pM3A=
env:
  global:
    secure: ibEqQUpC2mJzTvM2DWzXeL5Rh0hLs1HmCY83Pgpia7l40BK3MKR6TB574CRmCj7TXQ/wIqldQFe3+/iRrtawl/unvji59pCcBVJN2C0K9QpRcYj74DFPfsgbb6Z5YW/RzZPgm8NhKaTwAa/bZ8HMgNcatOFKnRlOpmXz92K4PkgFJMY0Z4eH4y8eOtH3Yc+HRezHvEYoQoqoWrwcWyXk6OVdQSrXeHi8nEsVF3pX4zu/gl66P02k4/bvDzVSnpN0Mt6myDwB/sMQlTGLDCW1dauNVzVQi/nXrnF1Ti7
      20+grpTTFln1CgNRyeUUhaG3OLy7ciUmTHxwSNHTkNHzUII4+fn3MvHWb/5CtasaqFo2f0hX1oJ8gsDWFCqTZgnYKMKjcdN4k1U1DqeRA1LKXyZt0wyZrQe/aMKWE7DQRRswEjrOBiD4n629z3EZXqsB9
      nUHFE45x4IowAeMSJ1G0YddBF9ikRwP5ufuxDweHxrPZf0nKqGmfpEysYONPLA4JAemkM8VlY5yiUNe/l+2UypdrXXu6Mf0OWToEq8cw+u2CtngLsdI+CjNUGeQJ55+NH0AqovUMHUDhED18Nnnj0LjZpmuf5mbKcljqpSyii/85PSGlZKY+erNUB+leQAp45DHniBASGQ2ccGFZsLBuI5rK3EE102tgJtY6cj9OH54=
```

# 总结

在项目中集成Travis CI及coveralls的时候，主要卡在了travis包的安装上，因为travis是一个ruby包，依赖相应的ruby环境，所以对我们不懂这一快的会有点麻烦，不过我们只要善于利用github的issues就能够很好的解决问题；Travis CI绝不止我上面提到的这一点点东西，上面只能算入门，如果后续还有其它功能需要集成，查文档即可；其实整个过程不算复杂，就是稍微繁琐，但是只要善于查文档是能解决大部分问题的。 

### 实例链接

https://github.com/willson-wang/china-regions

### 参考链接
https://docs.travis-ci.com/
https://docs.travis-ci.com/user/deployment/npm/
http://www.ruanyifeng.com/blog/2017/12/travis_ci_tutorial.html
https://github.com/travis-ci/travis.rb/issues/646
https://github.com/travis-ci/travis.rb/issues/558
https://github.com/nickmerwin/node-coveralls
https://cnodejs.org/topic/558df089ebf9c92d17e73358
https://github.com/istanbuljs/nyc
https://istanbul.js.org/docs/advanced/alternative-reporters/

