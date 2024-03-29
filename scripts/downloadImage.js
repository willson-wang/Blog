/* eslint-disable */
const url = 'https://cdn.nlark.com/yuque/0/2022/png/22209851/1667274524829-83f970d4-64e3-4a54-b196-c5f330f736bd.png';

const download = require('image-downloader');
const fs = require('fs-extra')
const debug = require('debug')('scripts:downloadImage')
const path = require('path');

const publicPath = path.join(__dirname, '../public')

debug('publicPath %s', publicPath);


// process.exit(1)
const options = {
  dest: path.join(__dirname, '../public/static/images/yuque'), // will be saved to /path/to/dest/image.jpg
  headers: {
    "User-Agent": "my-app"
  }
};


function getImageUrls(body) {
    // 仅处理语雀图片
    const images = body.matchAll(/(https?.*?yuque.*?(\.png|\.jpg))/g)
    const imgs = body.matchAll(/<img.*?src=['"](https?.*?yuque.*?(\.png|\.jpg))['"].*?>/g)
    let result = []
    for (let item of images) {
        result.push(item[1])
    }
    for (let item of imgs) {
        result.push(item[1])
    }
    return result
}

const body = "<a name=\"QqaCH\"></a>\r\n## 问题1 trouble with your network connection\r\n针对 `yarn` 1.x版本在CI场景安装依赖的过程中出现 `There appears to be trouble with your network connection. Retrying... `这样的提示，如下图所示<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667274524829-83f970d4-64e3-4a54-b196-c5f330f736bd.png#averageHue=%232b2625&clientId=udf69fe1d-cdb5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=193&id=GIjR6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=386&originWidth=1442&originalType=binary&ratio=1&rotation=0&showTitle=false&size=109398&status=done&style=none&taskId=ue0bf37b6-bdc2-4c84-bcd4-599d6c53ba5&title=&width=721)\r\n\r\n最终导致安装过程无限拉长，或者导致安装失败\r\n\r\n针对这个问题，应该怎么去排查与解决\r\n\r\n首先导致这个问题的原因是yarn 在install的时候，无法正确获取到tarball对应的tgz包，如下图所示<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667282841907-c6a9c3dd-73f7-4ba0-9f58-a5fba598bf98.png#averageHue=%23fcf4f3&clientId=udf69fe1d-cdb5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=234&id=ua0876371&margin=%5Bobject%20Object%5D&name=image.png&originHeight=468&originWidth=1860&originalType=binary&ratio=1&rotation=0&showTitle=false&size=216301&status=done&style=none&taskId=ua770f7eb-3e4e-4950-a9ef-45b3f274aa5&title=&width=930)\r\n\r\n无法正确获取到tgz包的原因则是网络问题，因为我们是从npm官方源或者yarn源上获取的这些tgz包，而这些源都是国外服务\r\n\r\n<a name=\"g7K0E\"></a>\r\n### 获取安装超时包\r\n\r\n**第一步：在yarn install命令上添加--verbose命令行参数，目的是打印install整个过程中日志**\r\n```typescript\r\n// 添加上--verbose参数\r\nyarn --ignore-optional --frozen-lockfile --check-files --verbose\r\n```\r\n\r\n具体日志如下图所示，可以看到详细的请求日志<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667283318076-51791e97-eb9a-4696-a0e3-28f69b402285.png#averageHue=%23e1e0e0&clientId=udf69fe1d-cdb5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=593&id=u5e12fb48&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1186&originWidth=2960&originalType=binary&ratio=1&rotation=0&showTitle=false&size=912811&status=done&style=none&taskId=u06f0c919-c590-42c7-aa48-b3e11c25b7b&title=&width=1480)\r\n\r\n**第二步：查看添加参数之后的日志**\r\n\r\ngitlab流水看日志<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667283466712-d5bcb288-26fc-434a-aedc-486c10c945db.png#averageHue=%23525151&clientId=udf69fe1d-cdb5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=520&id=u2092d01a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1040&originWidth=2366&originalType=binary&ratio=1&rotation=0&showTitle=false&size=520433&status=done&style=none&taskId=u74d646c2-92bb-41de-91bb-2a25f2fa047&title=&width=1183)\r\n\r\n\r\n**第三步：使用下面的函数，获取下载的tgz包**<br />为什么要这一步，原因是就是加上`--verbose`，`yarn`输出的详细日志也只会有`There appears to be trouble with your network connection. Retrying...` 这样的打印，是看不出哪个包超时加载的,所以需要我们手动获取一下tgz包来判断是哪些包超时加载了\r\n\r\ngitlab 流水日志查看超时包\r\n```typescript\r\nfunction logPkg(txt) {\r\n  const map = new Map()\r\n  const result = txt.matchAll(/http.*?\\.tgz/g);\r\n  for (let item of result) {\r\n    const pkg = decodeURIComponent(item[0])\r\n    if (map.has(pkg)){\r\n      map.get(pkg).push(pkg)\r\n      console.log(`当前npm包${pkg}属于超时安装`, map.get(pkg));\r\n    } else {\r\n      map.set(pkg, [pkg])\r\n    }\r\n  }\r\n}\r\n\r\n// 获取到全部日志的内容，并传入logPkg\r\nlogPkg(document.getElementsByTagName('pre')[0].innerHTML)\r\n```\r\n\r\n如果有超时安装的包，控制台会直接打印出对应的包<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667284084790-42ac0fe1-e26e-4b81-b721-9379db280e39.png#averageHue=%23faf3f2&clientId=udf69fe1d-cdb5-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=44&id=ua15daa0f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=88&originWidth=1848&originalType=binary&ratio=1&rotation=0&showTitle=false&size=48256&status=done&style=none&taskId=u36e7293e-90c1-43be-87b4-1634d8fcdc3&title=&width=924)\r\n\r\n<a name=\"Ozdmq\"></a>\r\n### 解决方法\r\n使用淘宝源\r\n\r\n<a name=\"Cux3B\"></a>\r\n## 问题2 卡在building fresh packages.... \r\n针对 `yarn` 1.x版本在CI场景安装依赖的过程中出现 `building fresh packages... `这样的提示，如下图所示<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667379577451-68fca078-1594-47ba-aee1-fb8063318b82.png#averageHue=%234b4949&clientId=udded659f-2899-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=367&id=u0c206042&margin=%5Bobject%20Object%5D&name=image.png&originHeight=734&originWidth=1318&originalType=binary&ratio=1&rotation=0&showTitle=false&size=425105&status=done&style=none&taskId=u139a880a-e7a1-4f9d-941d-03ab002bf31&title=&width=659)\r\n\r\n最终导致install失败，或者install时间过长\r\n\r\n如果在CI场景如果无法查看全部日志，可以通过grep过滤输出，如下所示\r\n```\r\nyarn install --verbose |grep -v 'Copying' |grep -v 'Creating'\r\nOR\r\nyarn install --verbose |grep -v 'Copying\\|Creating'\r\n```\r\n\r\n针对这个问题，应该怎么去排查与解决\r\n\r\n首先导致这个问题的原因是yarn在将tgz包拉取到全局缓存目录，并将全局缓存目录内的包 copy到当前项目目录的node_modules之后，会执行npm包内的install、postinstall等钩子，而有些npm包是会利用install、postinstall钩子做一些下载文件的操作，比如node-sass，如下图所示\r\n\r\n定义了install与postinstall钩子<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667379844086-3721e1a8-834c-452b-abfb-6269de55d95a.png#averageHue=%232a2423&clientId=udded659f-2899-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=221&id=u19014430&margin=%5Bobject%20Object%5D&name=image.png&originHeight=442&originWidth=1576&originalType=binary&ratio=1&rotation=0&showTitle=false&size=117652&status=done&style=none&taskId=ub556daf5-24fa-4d18-a58b-47b308bfc35&title=&width=788)\r\n\r\n定义默认的文件获取路径，为github地址<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667379901195-b33b68f3-18e6-427b-a67e-2aa511310519.png#averageHue=%23201f1f&clientId=udded659f-2899-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=246&id=u86e63fb5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=492&originWidth=1446&originalType=binary&ratio=1&rotation=0&showTitle=false&size=119459&status=done&style=none&taskId=u328bd9f6-7382-41a1-ade3-82c1a036092&title=&width=723)\r\n\r\n执行下载文件的操作<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667379887362-6a86680f-0562-490a-b8dc-f61d3fad3d83.png#averageHue=%2320201f&clientId=udded659f-2899-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=678&id=u98b98ea6&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1356&originWidth=1682&originalType=binary&ratio=1&rotation=0&showTitle=false&size=268615&status=done&style=none&taskId=u772a6513-c20d-496c-ae55-c0a6df7e07f&title=&width=841)\r\n\r\n这些包内的默认的下载地址都是国外的服务器地址，由于网络的问题，很容易导致超时，最终导致install失败\r\n\r\n<a name=\"khnWL\"></a>\r\n### 获取安装超时的文件\r\n怎么知道项目内的哪些包在install等钩子内去下载依赖，可以按照下面的操作进行\r\n\r\n**在yarn install命令上添加--verbose命令行参数，目的是打印install整个过程中日志**\r\n```typescript\r\n// 添加上--verbose参数\r\nyarn --ignore-optional --frozen-lockfile --check-files --verbose\r\n```\r\n\r\n具体日志如下图所示，可以看到详细的请求日志<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667380166360-009f1c9b-0c30-4e0a-bd08-026fd2a2d9c7.png#averageHue=%232c2928&clientId=udded659f-2899-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=474&id=u0d875113&margin=%5Bobject%20Object%5D&name=image.png&originHeight=948&originWidth=2098&originalType=binary&ratio=1&rotation=0&showTitle=false&size=255927&status=done&style=none&taskId=ud48d08e0-a02e-4707-9466-1e84902e55c&title=&width=1049)\r\n\r\n从日志可以看到下载超时的文件\r\n\r\n<a name=\"CdT1t\"></a>\r\n### 解决方法\r\n设置针对上述问题，有通用的解决方法，就是允许通过专门的字段指定下载地址，比如node-sass这个包，可以通过`sass_binary_site`指定文件下载路径，常用的需要指定文件下载路径的包，如下所示\r\n\r\n方式1: 设置.npmrc\r\n```typescript\r\nsass_binary_site=https://npmmirror.com/mirrors/node-sass\r\nsentrycli_cdnurl=https://npmmirror.com/mirrors/sentry-cli\r\nelectron_mirror=https://npmmirror.com/mirrors/electron\r\nchromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver\r\noperadriver_cdnurl=https://npmmirror.com/mirrors/operadriver\r\nselenium_cdnurl=https://npmmirror.com/mirrors/selenium\r\npuppeteer_download_host=https://npmmirror.com/mirrors\r\ngrpc-node-binary-host-mirror=https://npmmirror.com/mirrors\r\n```\r\n\r\n方式2: 通过npm config set设置\r\n```typescript\r\nnpm config set sass_binary_site https://npmmirror.com/mirrors/node-sass\r\nnpm config set sentrycli_cdnurl https://npmmirror.com/mirrors/sentry-cli\r\nnpm config set electron_mirror https://npmmirror.com/mirrors/electron\r\nnpm config set chromedriver_cdnurl https://npmmirror.com/mirrors/chromedriver\r\nnpm config set operadriver_cdnurl https://npmmirror.com/mirrors/operadriver\r\nnpm config set selenium_cdnurl https://npmmirror.com/mirrors/selenium\r\nnpm config set puppeteer_download_host https://npmmirror.com/mirrors\r\nnpm config set grpc-node-binary-host-mirror https://npmmirror.com/mirrors\r\n```\r\n\r\n<a name=\"o0qd4\"></a>\r\n## FAQ\r\n<a name=\"mqfM4\"></a>\r\n### 为什么安装项目依赖之前已经设置了源，为什么实际安装的时候，还有包不是从设置的源安装\r\n```typescript\r\n\"set_registry\": \"npm config set registry https://registry.npmmirror.com/\"\r\n```\r\n\r\n原因是：yarn 1.x设计上的缺陷，为了保证复用缓存与方便提升依赖，生成的yarn.lock内是直接包含了registry的，如下图所示<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/22209851/1667284786148-0324dc0b-9546-4b50-a186-f5491a755a11.png#averageHue=%232b2726&clientId=udded659f-2899-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=519&id=u3a097d06&margin=%5Bobject%20Object%5D&name=image.png&originHeight=1038&originWidth=2030&originalType=binary&ratio=1&rotation=0&showTitle=false&size=240342&status=done&style=none&taskId=u09c37221-b23f-4d5e-ac83-f7560ef051b&title=&width=1015)<br />而yarn在install的时候，如果有yarn.lock，那么则会直接使用yarn.lock内的链接来直接安装<br />比如jsonwebtoken这个包，虽然设置了指定的源，但是yarn.lock内获取tgz的地址是[https://registry.npmjs.org/](https://registry.npmjs.org/)，**所以这个包就还会从npm官方源安装，而不是从指定源安装**\r\n\r\n怎么从根上避免这个问题，可以查看下一篇，自定义Node镜像\r\nn<img width=\"769\" alt=\"image\" src=\"https://user-images.githubusercontent.com/20950813/178097626-f5be88c7-16b8-4d6d-bd8d-f73ab9bb58ff.png\"\r\n\r\n<img width=\"769\" alt=\"image\" src=\"https://cdn.nlark.com/yuque/0/2022/png/22209851/1667284786148-0324dc0b-9546-4b50-a186-sdadfsdf.png\"";



function downLoadImage(body) {
    // 匹配图片获取图片链接
    const yuqueImages = getImageUrls(body)

    debug('yuqueImages %O', yuqueImages);
    // 将图片转换成buffer
    const promiseArr = yuqueImages.map((imageUrl) => {
        return new Promise((resolve) => {
            const baseName = path.basename(imageUrl)
            if (fs.pathExistsSync(`${publicPath}/static/images/yuque/${baseName}`)) {
                debug(`${imageUrl}图片已生成`);
                resolve({
                    newUrl: `/static/images/yuque/${baseName}`,
                    oldUrl: imageUrl
                })
                return
            }
            download.image({
                ...options,
                url: imageUrl
            })
            .then(({ filename }) => {
                debug('Saved to %s', filename); // saved to /path/to/dest/image.jpg
                resolve({
                    newUrl: filename.replace(publicPath, ''),
                    oldUrl: imageUrl
                })
            })
            .catch((err) => {
                console.log('download err', err);
                resolve({
                    newUrl: '',
                    oldUrl: imageUrl
                })
            });
        })
    })

    return Promise.all(promiseArr).then((res) => {
        return res
    })
}



// downLoadImage(body)

module.exports = downLoadImage




