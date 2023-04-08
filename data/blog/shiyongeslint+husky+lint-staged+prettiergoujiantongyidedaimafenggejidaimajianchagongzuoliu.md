---
  title: 使用eslint+husky+lint-staged+prettier构建统一的代码风格及代码检查工作流
  date: 2018-11-10T14:04:23Z
  lastmod: 2018-11-11T14:01:35Z
  summary: 
  tags: ["开发工具", "eslint", "husky", "lint-staged", "代码检查"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

#### 当我们团队比较大，且人数比较多的时候，因为同事之间不同的代码风格及编辑器，会导致项目内的代码，无法形成统一的风格，不利于阅读，也更容易造成bug；为保持统一的代码风格及减少书写上的bug，所以抽时间，去整理通过什么样的工具和方式去实现团队统一的代码风格及代码检查工作流；

#### 一、引入husky，在我们commit之前做eslint的检查，注意这是对lint命令内所有的文件做eslint检查
husky是一个git 钩子插件，提供了pre-commit pre-push等封装好了的钩子，我们可以在这些钩子触发的时候执行某些命令或者操作

使用方式 
```
yarn add husky --dev | npm install husky --save-dev

// 第一种方式直接写在package.json内
{
  "husky": {
    "hooks": {
      "pre-commit": "yarn lint",
      "...": "..."
    }
  }
}

// 第二种方式直接在根目录下建立.huskyrc, .huskyrc.json or .huskyrc.js等文件，如果使用这种方式husky的版本需要大于1.0.0

// .huskyrc
{
  "hooks": {
    "pre-commit": "yarn lint"
  }
}
```

#### 二、husky只是提供了提交时的钩子，然而有时候我们处理的项目并不是新项目，这个时候，可能只想对本次提交的代码，做代码检查，而不是对现有目录内所有的文件做检查，所以我们需要引入lint-staged这个插件，lint-staged插件提供了对本次提交的各种文件检查的检查方式，如js，css，saas等；

使用方式
```
yarn add lint-staged --dev | npm install lint-staged --save-dev

// 第一种方式直接写在package.json内
"husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "linters": { // linters 被匹配的项及匹配之后需要执行的命令
      "*.{js,vue}": [ // 允许按命令执行多项命令
        "eslint --fix", // 也可以直接时script内的命令，如yarn lint，这里需要注意的时当执行script内的命令时，检查的就是script命令内的所有文件了
        "git add"
      ],
     "*.css": "stylelint",
     "*.scss": "stylelint --syntax=scss"
    },
    "ignore": []
  },

// 第二种方式可以在根目录下建立lintstagedrc or lint-staged.config.js 文件
{
  "linters": {
      "*.{js,vue}": [
        "eslint --fix",
        "git add"
      ]
    },
    "ignore": []
}

```

#### 三、引入prettier插件格式化代码，当我们做完了前面两步之后，还不能保证团队内的代码是一样的，只是保证了团队内的代码检查是符合同一份eslint规则的，如果要让代码不论在哪个同时的编辑器内打开是一样的，则需要继续引入prettier插件

这里说下eslint与prettier之间的区别，二者的侧重点不同，前者是代码规范检查，如是否可以使用var，尾逗号，函数括号前面是否留空格，便于团队保持比较统一的代码风格；而prettier则是代码格式化插件，可以根据一定的规则对我们的js、css、less、jsx、vue等文件进行格式化，保证团队输出的代码是统一的；所以二者除了小部分规则有交集之外，二者是可以在我们的开发种相辅相成的；

引入方式
```
// 第一种方式直接安装prettier插件
yarn add prettier --dev | npm install prettier --save-dev

在根目录下建立.prettierrc配置文件
{
  "tabWidth": 4,
  "semi": false,
  "singleQuote": true,
  "parser": "flow", // 默认格式化js的方式
  "printWidth": 100,
}

在package.json内配合husky、lint-staged使用
"husky": {
        "hooks": {
            "pre-commit": "lint-staged",
            "post-commit": "git update-index --again"
        }
    },
    "lint-staged": {
        "linters": {
            "*.js": ["prettier --parser flow --write", "eslint --fix", "git add"], // 格式化js文件
            "*.vue": ["prettier --parser vue --write", "eslint --fix", "git add"], // 格式化vue文件
            "*.json": ["prettier --parser json --write", "git add"] // 格式化json文件
        },
        "ignore": ["dist/**/*.js"] // 忽略掉dist目录下的文件
    },

还可以使用单独的命令
"pt": "prettier --debug-check {src,test}/**/*.js",
"pt:vue": "prettier --parser vue --debug-check {src,test}/**/*.vue",
"pt:fix": "prettier --write {src,test}/**/*.js",
"pt:fixvue": "prettier --parser vue --write {src,test}/**/*.vue"

注意这里的parser有好几种，我在配置的时候，好像不能根据文件自动识别，然后进行格式化，如parser方式为flow时，无法格式化vue文件，所以vue文件需要用parser引擎指定为vue

// 第二种方式则是使用eslint-plugin-prettier 具体的配置方式参考prettier提供的文档

```

### 总结

团队的代码规范化只有当我们真正碰到的时候，才会去认真对待及找寻方法进行解决，所以趁此机会记录一下，并让我们在以后开始任何新项目or接手任何项目的时候，能够时刻把代码规范化这些能过提升我们工作效率及减少bug的方式加入进去；


参考链接：
https://prettier.io/docs/en/install.html
https://github.com/okonet/lint-staged
https://github.com/typicode/husky
