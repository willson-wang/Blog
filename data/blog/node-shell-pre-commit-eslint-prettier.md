---
  title: node shell pre-commit eslint prettier
  date: 2018-11-28T10:30:26Z
  lastmod: 2018-12-08T11:21:50Z
  summary: 
  tags: ["node"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

#### 很多事情有因才有果，因为工作项目的关系，我们的目录结构大致如下
```
project
    package.json
    node_modules/
    packages/
         component1
               .git
               src
               package.json
         component1
               .git
               src
               package.json
```

真正的代码都在component这一层，且每一个为独立的git仓库，所有的依赖都安装在最外层的node_modules目录下；当我们需要使用到git的pre-commit等钩子时，存在三个问题，第一个就是不能使用成熟的githooks插件如husky等，第二个就是所有的依赖都安装在最外层，内层component1这层是不允许装依赖的；第三个问题就是就算自己写了pre-commit等钩子，团队其它成员怎么用；

最开始因为git的hooks都是shell脚本，而自己对shell脚本不怎么熟，但是知道可以使用node来写shell脚本，所以直接写的是node的方案；

#### 在写node脚本的过程中碰到几个问题；

#### 1 node内怎么去执行命令，如npm run start、git diff、eslint .等

通过查找资料我们可以知道node内提供来一个child_process模块，而这个模块提供来一些异步以及通过去执行command的方法；如child_process.exec(command[, options][, callback])、child_process.spawn(command[, args][, options])、child_process.execSync(command[, options])、child_process.spawnSync(command[, args][, options])方法等，具体的使用方法查找node文档即可，不过主要有两点就是这几个可执行命令的方法都是基于spawn的封装；第二点就是exec可以直接执行命令，如exec('git log') 而spawn方法则是需要使用参数的形式spawn('git', ['log'])


#### 2 怎样去获取提交到暂存区的文件

通过git diff命令可以获取到暂存区的文件，如获取js文件git diff --cached --name-only --diff-filter=ACM -- '*.js'

通过execSync or exec命令来获取到暂存区的文件，execSync('git diff --cached --name-only --diff-filter=ACM -- '*.js'').toString().trim().split('\n') 注意execSync与exec的返回值取的的地方不一样；execSync方法返回值一般是buffer or 字符串这里使用toString()方法将buffer转换成字符串，然后在转换成包含各个文件名的数组

#### 3 怎么去处理Eslint的返回信息

如果使用的是execSync方法来执行eslint命令，需要用try catch的方式在catch内捕捉错误，一开始没有使用try catch方法，而是直接使用返回值，想要用返回值来判断，但是这样导致报 comman failed的错误，而我把这个命令直接放在bash内执行的时候，又是正常的；这就是我没有使用try catch来捕捉的结果

```
// 使用try catch来捕捉eslint返回的信息，而不是直接使用返回值
try {
	execSync(`${PRETTIER_PATH} --parser ${filetype.includes('js') ? 'flow' : 'vue'} --write ${files[i]}`)
        execSync(`${ESLINT_PATH} ${files[i]}`, {cwd})
  } catch (error) {
	PASS = false
	console.log('error', error.stdout.toString())
  }

// 不是直接使用返回值，这样会直接报comman failed
const result = execSync(`${ESLINT_PATH} ${files[i]}`, {cwd})
```

![image](https://user-images.githubusercontent.com/20950813/49328796-2d21b380-f5b1-11e8-98ab-e91eda79fddb.png)

#### 4 因为使用prettier来格式化代码，而格式化的时候无法自动识别文件并使用不同的引擎来格式化代码，所以分开获取了js文件与vue文件

#### 5 node子进程内通过precess.exit()来终端进程，而shell脚本内，通过返回值0跟1来区分脚本是成功还是失败；0是成功，1是失败；

#### 6 通过node的读写文件功能，让其它同时也能够方便使用

#### 最终如下所示

```
#!/usr/bin/env node

const execSync = require('child_process').execSync
const path = require('path')

const ESLINT_PATH = path.normalize("./node_modules/.bin/eslint")
const PRETTIER_PATH = path.normalize("./node_modules/.bin/prettier")

console.log('检查是否安装eslint')
try {
	execSync(ESLINT_PATH)
}catch(e) {
	console.log('未安装eslint', e.stdout.toString(), e.stderr.toString())
	process.exit(1)
}

const STAGE_FILES_JS_COMMAND="git diff --cached --name-only --diff-filter=ACM -- '*.js'"
const STAGE_FILES_VUE_COMMAND="git diff --cached --name-only --diff-filter=ACM -- '*.vue'"

const STAGE_FILES_JS = execSync(STAGE_FILES_JS_COMMAND).toString().trim().split('\n')
const STAGE_FILES_VUE = execSync(STAGE_FILES_VUE_COMMAND).toString().trim().split('\n')

console.log('STAGE_FILES_JS', STAGE_FILES_JS, STAGE_FILES_VUE)
let promises = null
const cwd = process.cwd() || process.env.PWD;

function checkFile (files, filetype) {
	if (files.length) {
	
		let PASS = true
	
		for (let i = 0; i < files.length; i++) {
			try {
				execSync(`${PRETTIER_PATH} --parser ${filetype.includes('js') ? 'flow' : 'vue'} --write ${files[i]}`)
				execSync(`${ESLINT_PATH} ${files[i]}`, {cwd})
			} catch (error) {
				PASS = false
				console.log('error', error.stdout.toString())
			}
		}
	
		if (!PASS) {
			console.log(`eslint ${filetype}未通过`)
			process.exit(1)
		} else {
			console.log(`eslint ${filetype}通过`)
		}
	
	} else {
		console.log(`暂存区没有需要检查的${filetype}文件`)
	}
}

checkFile(STAGE_FILES_JS, 'js')
checkFile(STAGE_FILES_VUE, 'vue')

process.exit(0)

```


```
yarn createHooks => "createHooks": "node createHooks.js create"

console.log('create hooks', process.argv)
const fs = require('fs')

const type = process.argv[2]

const packagesList = ['./packages/test/', './packages/git-hooks/']

const templateUrl = './hooks/pre-commit'

function createHooks() {
    console.log('createHooks')
    for (let i = 0; i < packagesList.length; i += 1) {
        if (!fs.existsSync(`${packagesList[i]}.git/`)) {
            break
        }
        if (!fs.existsSync(`${packagesList[i]}.git/hooks/`)) {
            break
        }
        if (!fs.existsSync(`${packagesList[i]}.git/hooks/pre-commit`)) {
            const preCommit = fs.readFileSync(templateUrl)

            fs.writeFileSync(`${packagesList[i]}.git/hooks/pre-commit`, preCommit, {
                encoding: 'utf8',
                mode: 0o777,
            })
        }
    }
}

function deleteHooks() {

}

function deleteAllHooks() {

}

console.log('type', type)

switch (type) {
case 'create':
    createHooks()
    break
case 'delet':
    deleteHooks()
    break
case 'deletAll':
    deleteAllHooks()
    break
default:
    createHooks()
}


```
