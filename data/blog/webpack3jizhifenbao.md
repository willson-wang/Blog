---
  title: webpack3极致分包
  date: 2019-11-10T13:25:57Z
  lastmod: 2019-11-17T01:45:03Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/webpack3.jpeg']
  bibliography: references-data.bib
---

项目中目前使用的是webpack3.8.1版本，然后准备将webpack升级到4.x版本，在升级的过程中，碰到了分包的变化，所以先详细的记录下webpack3.x，然后在另外记录webpack4.x版本中关于分包的对比；

在理解分包之前，一定要先理解webpack中几个重要的概念；

<h3>怎样区分chunk、bundle及module</h3>

- module: 每个文件就是一个模块
- bundle: webpack最终输出的文件
- chunk: webpack内部处理过程中的代码块，一个chunk可以最终生成一个bundle，多个chunk也可以最终生成一个bundle

<h4>chunk分为三类</h4>

- Entry chunk - 入口chunk，怎样区分入口chunk内，即包含webpack runtime代码的，如下所示

```
entry: {
   a: './src/a.js',
   b: './src/b.js'
}

a,b都是entry chunk
```

- Initial chunk：不包含运行时代码的chunk则认为是initial chunk。initial chunk都是紧随在entry chunk加载之后加载,如webpack3中通过CommonsChunkPlugin抽离的chunk

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity // 模块必须被3个 入口chunk 共享，Infinity除了vendor的chunk其它的chunk不会被打进来
}),
```

- Normal chunk：异步加载or懒加载的模块(如通过require.ensure, or System.import or import()加载的模块)，就是普通chunk；

```
require.ensure(['./c'], function(c) {
        console.log('c', c)
}, function () {}, 'c')
```

注意Normal chunk与Initial chunk唯一的区别方式就是加载方式，所有通过懒加载or异步加载的都认为是Normal chunk，其它非entry chunk的都是Initial chunk

<h3>怎样区分hash、chunkhash、contenthash</h3>

- hash: 在 webpack 一次构建中会产生一个 compilation 对象，该 hash 值是对 compilation 内所有的内容计算而来的

- chunkhash: 每一个 chunk 都根据自身的内容计算而来

- contenthash: 根据每个文件自身内容计算而来

所以从描述来看，chunkhash应该作为我们持久化缓存用于生成文件名的参数

<h3>怎么看待分包这个问题</h3>

我们为什么要进行分包

分包的目的是做持久化缓存

怎样利用webpack做持久化缓存

通过给输出的js文件添加chunkhash，给css文件名添加contenthash

通过分包，把不容易变的抽离到一个chunk内，把公共代码抽到一个chunk内，最后在把webpack的runtime代码抽到一个chunk内，在通过HashedModuleIdsPlugin、NamedModulesPlugin、NamedChunksPlugin等插件来最大化保证chunkhash变化的文件数量

下面我们分包按照上面的思路，在webpack3中通过多入口实例来实现上述的分包效果

webpack3.x版本，我们需要借助CommonsChunkPlugin插件来实现，在进行具体的分包之前，先来详细了解CommonsChunkPlugin插件每个参数的含义，只有理解了每个参数的具体含义，才能够结合自己的项目进行具体的分包，要不然又是从网上copy一段配置项；

我们先看下有哪些参数
```
{
  name: string, // or
  names: string[]

  filename: string,

  minChunks: number|Infinity|function(module, count) => boolean,

  chunks: string[],

  children: boolean,

  deepChildren: boolean,

  async: boolean|string,

  minSize: number,
}
```

一共9个参数，除了filename及minSize我们来重点理解下其它7个参数具体是什么意思

以一个具体的例子为例,共8个js文件

```
a.js  作为入口文件

import './assets/a.css'
import { a } from './common'
import _ from 'lodash'
import react from 'react'
import reactDom from 'react-dom'

document.getElementById('btn1').addEventListener('click', function () {
    require.ensure([], function(require) {
        const c = require('./c')
        console.log('c', c)
    }, function () {}, 'c')

    
})

console.warn('a.js', a, _, react, reactDom)
```

```
b.js 作为入口文件
import './assets/b.css'
import { b } from './common'
import _ from 'lodash'
import react from 'react'
import reactDom from 'react-dom'

document.getElementById('btn2').addEventListener('click', function () {
    require.ensure([], function(require) {
        const d = require('./d')
        console.log('d', d)
    }, function () {}, 'd')
})

console.warn('b.js', b, _, react, reactDom)
```

```
c.js 在a.js中通过异步引入
import _ from 'lodash'

require.ensure([], function(require) {
    const f = require('./f')
    console.log('f', f)
}, function () {}, 'f')

require.ensure([], function(require) {
    const g = require('./g')
    console.log('g', g)
}, function () {}, 'g')

console.log('c qs', common2, _)
```

```
d.js 在b.js中通过异步引入
import qs from 'qs'
import { common2 } from './common2'

console.log('d qs', qs, common2)
```

```
f.js 在c.js中异步引入
import _ from 'lodash'
import { common2 } from './common2'
import qs from 'qs'

console.log('f', _, common2, qs)
```

```
g.js 在c.js中异步引入
import _ from 'lodash'
import { common2 } from './common2'
import qs from 'qs'

console.log('g', _, common2, qs)
```

```
common.js 在a.js及b.js引入
import './assets/common.css'

export const a = 'a00000'
export const b = 'b00000'
```

```
common2.js 在f.js、g.js中引入
export const common2 = 'common2'
```

我们先看name or names参数有什么作用

先看一张没有分包之前构建结果
![image](https://user-images.githubusercontent.com/20950813/68989421-944b7d00-0881-11ea-8d84-03644b3b6174.png)


```
new webpack.optimize.CommonsChunkPlugin({
      name: 'pageA'
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989424-9ca3b800-0881-11ea-8ef2-631a2409152f.png)

pageB.js包的大小明显减少，为什么？我们在继续看下

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'pageA',
            chunks: ['pageA', 'pageB'],
            minChunks: 2
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989433-c3fa8500-0881-11ea-8728-a64c25b11543.png)

二者打包结果一致

我们在看,把name改成names: ['pageA']

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['pageA'],
            chunks: ['pageA', 'pageB'],
            minChunks: 2
})
```

打包结果
![image](https://user-images.githubusercontent.com/20950813/68989443-f2786000-0881-11ea-9ed7-7a5355f57084.png)

同前两次分包结果还是一致

所以我们可以推断出

1. name or names用于指定将符合条件的模块提取指定name的chunk中，如果name为不存在的chunk则创建新chunk,如果name指定的chunk存在，则继续往chunk中添加被提取的模块内容

2. chunks用于指定，从哪些chunk中提取符合条件的模块

3. minChunks用于判断chunk中的模块是不是符合提取要求，如默认值为2，意思就是一个模块必须要在两个chunk都引用过，在这个例子中就是必须在a.js、b.js中引用过

我们在把name换个不存在的chunk名来验证我们的推断

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['test'],
            chunks: ['pageA', 'pageB'],
            minChunks: 2
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989478-73cff280-0882-11ea-853e-c2589ad4731a.png)

生成了一个新的test chunk所以验证了我们的name or names及chunks的作用

我们把minChunks换成函数，及在webpack CommonsChunkPlugin插件中输入targeChunk及affectedChunks

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['test'],
            chunks: ['pageA', 'pageB'],
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            }
})
```

输出结果

![image](https://user-images.githubusercontent.com/20950813/68989507-f2c52b00-0882-11ea-8872-350957f99678.png)

从上图可知，我们之前对minChunks的推断也是正确的，目标targeChunk为test，需要被提取的chunks为pageA、pageB，在两个chunk中都被引用的则count为2，只有一次的则count为1

从上面的步骤来看，我们发现一个问题c.js、d.js、f.js、g.js这些异步加载的chunk都没有公共模块被提取出来，也没有被认为是需要被提取的chunks，如果我们要提取c、d、f、g中的公共模块呢？

这时我们就需要用到children及deepChildren这两个参数

我们先将children设置为true，deepChildren设置为false

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['test'],
            chunks: ['pageA', 'pageB'],
            children: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            }
})
```

打包结果，报错

![image](https://user-images.githubusercontent.com/20950813/68989625-759ab580-0884-11ea-96ba-1b4d7914684f.png)

我们去掉chunks

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['test'],
            children: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            }
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989637-9fec7300-0884-11ea-8241-1c6bfca64e47.png)

test chunk没有生成、且没有被选中的chunks，所以自然不会生成test chunk

我们修改names将test改成pageA

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['pageA'],
            children: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            }
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989657-c1e5f580-0884-11ea-8a05-518d31e4184e.png)

目录targetChunk pageA，通过异步引入的c.js则是受影响的chunk，但是c.js内没有符合minChunks判断条件的模块，所以c.js中没有模块被提取到父chunk pageA中

从这里我们可以作出如下总结

1. 如果要提取子chunk，不能设置chunks参数
2. 如果要提取子chunk，name or names指定的chunk必须要是已存在的chunk，不能是不存在的chunk
3. children: true只提取了一级异步加载的子chunk

我们在看下另外一个参数deepChildren，将deepChildren设置为true，children设置为false

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['pageA'],
            children: false,
            deepChildren: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            }
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989716-6831fb00-0885-11ea-8070-7556288df174.png)


没有按预期处理，提取子chunk中的公共模块，跟children: false,deepChildren: false,是一样的打包效果

我们在把children，及deepChildren同时设置为true

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['pageA'],
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            }
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989729-9ca5b700-0885-11ea-8a5d-c472744212dc.png)

明显c、f、g.js都被选中，且符合条件的模块有qs及common2.js

所以我们可以得出结论

1. deepChildren单独设置无效，必须要与children一起设置为true才有效
2. deepChildren用于提取二级、三级等等，所有的子chunk

然后我们在来看一个问题，子chunk中关于模块count的计算方式，我这里直接给结论，具体的过程，有兴趣的可以自己去推导

先看一下父子chunk的关系，已本例为例

本例中的chunk关系为entry chunk(a.js) => 一级子chunk(c.js) => 二级子chunk(f.js、g.js)

1. 父chunk内已经引用过了的模块，子chunk内是不会被计算在内的，比如这个例子中因为a.js中引入过lodash，所以所有子chunk中lodash没有被计算进去；而父chunk没有引入过的模块，子chunk有引入才会被计算进去，如qs，a.js及c.js都没有引入，而f.js、g.js有引入，所以qs模块的count是2

2. 同级子chunk，才会被重复计算次数；如qs，因为被二级chunk f、g同时引入count就是2；如果在c.js内引入一次qs，那么结果则只会是一次了

调整c.js，引入qs依赖

```
import _ from 'lodash'
import qs from 'qs'

require.ensure([], function(require) {
    const f = require('./f')
    console.log('f', f)
}, function () {}, 'f')

require.ensure([], function(require) {
    const g = require('./g')
    console.log('g', g)
}, function () {}, 'g')

console.log('c qs', common2, _)

require.ensure([], function(require) {
    const f = require('./f')
    console.log('f', f)
}, function () {}, 'f')

require.ensure([], function(require) {
    const g = require('./g')
    console.log('g', g)
}, function () {}, 'g')

console.log('c qs', common2, _)
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68989911-ce1f8200-0887-11ea-8cf1-9039e93ea779.png)

结果符合我们的预期

现在我们已经知道了，怎么从指定的chunks中抽取公共的module，提取到指定的chunk，已经怎样把子chunk公共模块抽取到父chunk内；这些chunk都是同步chunk，而我现在想抽取异步chunk，该怎么办？

我们继续看async参数

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['pageA'],
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            },
            async: 'async-vendor'
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68990090-ea242300-0889-11ea-9a3d-9fa2c1604279.png)

生成了一个新的async-vendor chunk，这个chunk的内容是从pageA chunk下的所有子chunk中抽出来的公共模块

将async参数的值该为true
```
new webpack.optimize.CommonsChunkPlugin({
            names: ['pageA'],
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            },
            async: true
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68990133-59017c00-088a-11ea-91e0-7a5b50d8a201.png)

异步公共chunk文件名变了，所以我们可以知道async参数为字符串时，会作为异步chunk的文件名前缀

我们在去掉names参数

```
new webpack.optimize.CommonsChunkPlugin({
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                number++
                console.log('common count', number, module.resource, count)
                return count >= 2
            },
            async: 'async-vendor'
})
```

打包结果

![image](https://user-images.githubusercontent.com/20950813/68990176-ff4d8180-088a-11ea-8a20-c1db2f58e3a8.png)

当没有指定name or names时，针对的是所有的chunks中的异步chunk，所有我们可以得出结论

1. 指定async参数时，被提取的chunks为name or names指定的chunk or all 异步子chunk;
2. async参数为字符串时，该字符串会会作为chunk的name

通过了解了CommonsChunkPlugin插件每个参数的作用之后，我们正式来在项目中使用CommonsChunkPlugin来优化我们的项目

我们参照[基于 webpack 的持久化缓存方案](https://github.com/pigcan/blog/issues/9)来进行分包处理

<h4>两个思路</h4>

思路1: 针对异步chunk，提取出async-vendor及async-common两个异步公共chunk，然后针对入口chunk，提取非dll中的node_modules下的chunk，然后再是common chunk，最后runtime chunk

思路2: 把异步chunk中node_module目录下的模块提取到entry chunk中，只提取一个异步async-common chunk，然后针对入口chunk，提取非dll中的node_modules下的chunk，然后再是common chunk，最后runtime chunk

思路1

简单展示下配置项

```
entry: {
        app: [path.join(__dirname, 'src/app.js')],
        app_agency: [path.join(__dirname, 'src/app_agency.js')]
},
```

未分包之前，我们通过webpack-bundle-analyzer插件来查看各包的大小及依赖关系

![image](https://user-images.githubusercontent.com/20950813/68990892-9a4a5980-0893-11ea-97d2-16741bd6e5bc.png)


我们可以看出

1. 所有包的大小为86.21M（未压缩）
2. entry chunk都包含相同的依赖
3. 异步加载的chunk都包含node_module文件，且很多都是重复的模块

第一步

```
new webpack.optimize.CommonsChunkPlugin({
            async: 'asycn-vendor',
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                // console.log('async-vendor count', module.resource, count)
                return module.resource && (/node_modules/).test(module.resource) && count >= 2
            }
 }),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991410-97eafe00-0899-11ea-85f4-cd4dcad00000.png)

从图中我们可以看出

1. 所有包的大小为33.24M（未压缩），总文件大小减少了61%
2. 异步chunk中满足条件的模块都被提取到了async-vendor chunk中
3. 各个异步chunk中node_modules目录下的模块基本都被提取到了async-vendor chunk中

第二步，把异步chunk中公共的业务代码，提取到async-common chunk中

```
new webpack.optimize.CommonsChunkPlugin({
            async: 'asycn-common',
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                return count >= 2
            }
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991466-2b243380-089a-11ea-8585-b47a360bfacd.png)


从图中我们可以看出

1. 所有包的大小为27.3M（未压缩），总文件大小减少了68%
2. 提取了两个async-common chunk
3. 各个异步chunk文件大小又得到减少
4. 两个entry chunk中的module_modules下有很多重复的依赖

第三步，针的enrty chunk 提取rest-vendor，因为实际项目中结合了dll

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'rest-vendor',
            minChunks: function (module, count) {
                const flag = module.resource && (/node_modules/).test(module.resource) && !vendors.some(vendor => module.resource.includes(`p_qmyx/node_modules/${vendor}/`))
                return flag
            },
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991519-a259c780-089a-11ea-8dd3-af3b09654560.png)


从图中我们可以看出

1. 所有包的大小为18.94M（未压缩），总文件大小减少了77%
2. 提取了rest-vendor这个chunk，包含了entry chunk及async-vendor chunk中的node_modules模块

第四步，针的enrty chunk 提取common chunk

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'common',
            chunks: ['app', 'app_agency'],
            minChunks: 2
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991565-07152200-089b-11ea-971f-53b406b17e63.png)

1. 所有包的大小为18.8M（未压缩），总文件大小减少了78%
2. 提取了common这个chunk，包含了entry入口中的引入超过2次的模块
3. 因为满足条件的模块不多，所以，两个entry chunk文件大小减少不多

第五步，针对entry chunk提取runtime chunk

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'runtime'
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991593-50fe0800-089b-11ea-8b34-8425d02f503c.png)

1. 所有包的大小为18.8M（未压缩），总文件大小减少了78%
2. 提取了runtime这个chunk，包含了webpack的runtime code

思路2

第一步，把异步chunk中node_module下，且count>=2的模块提取到entry chunk中

```
new webpack.optimize.CommonsChunkPlugin({
            names: ['app', 'app_agency'],
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                number++
                console.log('async-vendor count', number, module.resource, count)
                return module.resource && (/node_modules/).test(module.resource) && count >= 2
            }
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68990872-50617380-0893-11ea-974d-d8bee842a30d.png)

从图中我们可以看出

1. 所有包的大小为33.24M（未压缩），总文件大小减少了61%
2. 异步chunk中满足条件的模块都被提取到了entry chunk中
3. 各个异步chunk中node_modules目录下的模块基本都被提取到了entry chunk中

第二步，把异步chunk中公共的业务代码，提取到async-common chunk中

```
new webpack.optimize.CommonsChunkPlugin({
            async: 'asycn-common',
            children: true,
            deepChildren: true,
            minChunks: function (module, count) {
                return count >= 2
            }
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68990951-3e340500-0894-11ea-8d66-c600f35b8e25.png)

从图中我们可以看出

1. 所有包的大小为27.3M（未压缩），总文件大小减少了68%
2. 提取了两个async-common chunk
3. 各个异步chunk文件大小又得到减少
4. 两个entry chunk中的module_modules下有很多重复的依赖

第三步，针的enrty chunk 提取rest-vendor，因为实际项目中结合了dll

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'rest-vendor',
            minChunks: function (module, count) {
                const flag = module.resource && (/node_modules/).test(module.resource) && !vendors.some(vendor => module.resource.includes(`p_qmyx/node_modules/${vendor}/`))
                return flag
            },
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991024-0ed1c800-0895-11ea-861b-d0485648598b.png)

从图中我们可以看出

1. 所有包的大小为18.41M（未压缩），总文件大小减少了78%
2. 提取了rest-vendor这个chunk，包含了entry入口中的node_modules模块，当然也可以限制count
3. 两个entry chunk文件大小减少很多

第四步，针的enrty chunk 提取common chunk

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'common',
            chunks: ['app', 'app_agency'],
            minChunks: 2
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991112-cb2b8e00-0895-11ea-9cf0-d80033d49871.png)

1. 所有包的大小为18.27M（未压缩），总文件大小减少了78%
2. 提取了common这个chunk，包含了entry入口中的引入超过2次的模块
3. 因为满足条件的模块不多，所以，两个entry chunk文件大小减少不多

第五步，针对entry chunk提取runtime chunk

```
new webpack.optimize.CommonsChunkPlugin({
            name: 'runtime'
}),
```

分析图

![image](https://user-images.githubusercontent.com/20950813/68991143-4db44d80-0896-11ea-91fe-dcf4ed2a4e3d.png)

1. 所有包的大小为18.27M（未压缩），总文件大小减少了78%
2. 提取了runtime这个chunk，包含了webpack的runtime code

<h4>然后我们通过chrome的performance来对比下两种思路下，首页js加载的时常，已三次为例</h4>

<h4>思路1</h4>

![image](https://user-images.githubusercontent.com/20950813/68991689-69baed80-089c-11ea-9847-51868f665c55.png)

![image](https://user-images.githubusercontent.com/20950813/68991690-6fb0ce80-089c-11ea-87aa-2701195f5901.png)

![image](https://user-images.githubusercontent.com/20950813/68991694-75a6af80-089c-11ea-9c10-674a68b65ec5.png)

<h4>思路2</h4>

![image](https://user-images.githubusercontent.com/20950813/68991700-7b9c9080-089c-11ea-8d77-88f95c436451.png)

![image](https://user-images.githubusercontent.com/20950813/68991712-8c4d0680-089c-11ea-876a-3408bb1525cd.png)

![image](https://user-images.githubusercontent.com/20950813/68991707-88b97f80-089c-11ea-890b-a402b42accb3.png)

从图片上可以看出两个思路其实没有特别大的差异，所以还是需要根据自己的项目来选择合适的分包策略；

<h4>总结</h4>

通过上述的步骤，我们清楚的知道CommonsChunkPlugin插件每个参数的作用，也学习了一个分包的参考思路，至于具体的项目中，我们只需要根据缓存策略，然后在根据自己具体的项目去决定是否需要分包，分几次包，最终实现最有利的分包。



