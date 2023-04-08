---
  title: yarn --frozen-lockfile install失败
  date: 2021-07-26T12:34:20Z
  lastmod: 2021-07-26T12:34:36Z
  summary: 
  tags: ["开发工具", "yarn", "install", "--frozen-lockfile"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/yarn.png']
  bibliography: references-data.bib
---

## 背景

公司目前端统一使用的包管理工具是yarn，项目都是结合gitlab-ci来构建与发布，为了在gitlab-cli内能过顺利的构建成功，统一在dockfile内install的时候添加`--frozen-lockfile`参数，如下所示

```
RUN npm config set registry https://registry.npm.taobao.org && \
  yarn --frozen-lockfile --check-files --ignore-optional
```

但是在某一位同学开发完，然后分支合并到test的时候构建失败了，错误信息如下

```
#14 0.794 yarn install v1.15.2
#14 0.879 [1/4] Resolving packages...
#14 1.849 error Your lockfile needs to be updated, but yarn was run with `--frozen-lockfile`.
#14 1.849 info Visit https://yarnpkg.com/en/docs/cli/install for documentation about this command.
#14 ERROR: executor failed running [/bin/sh -c npm config set registry https://registry.npm.taobao.org &&   yarn --frozen-lockfile --check-files --ignore-optional]: exit code: 1
------
 > [builder_web 5/7] RUN npm config set registry https://registry.npm.taobao.org && yarn --frozen-lockfile --check-files --ignore-optional:
------
Dockerfile:8
--------------------
   7 |     
   8 | >>> RUN npm config set registry https://registry.npm.taobao.org && \
   9 | >>>   yarn --frozen-lockfile --check-files --ignore-optional
  10 |     
--------------------
error: failed to solve: rpc error: code = Unknown desc = executor failed running [/bin/sh -c npm config set registry https://registry.npm.taobao.org &&   yarn --frozen-lockfile --check-files --ignore-optional]: exit code: 1
```

## 解决过程

最开始关注的报错是这一行信息

```
error: failed to solve: rpc error: code = Unknown
```

以为是淘宝镜像源的问题，最后换成npm源或者yarn源之后还是报这个错误，然后在回过头来看，发现最开始的报错在这一行

```
#14 1.849 error Your lockfile needs to be updated, but yarn was run with `--frozen-lockfile`.
```

最后去查了下--frozen-lockfile参数的作用，如下所示

>If you want to ensure yarn.lock is not updated, use --frozen-lockfile
>Don’t generate a yarn.lock lockfile and fail if an update is needed.

意思就是当我们确认安装依赖的时候我们的yarn.lock是没有变化的，可以使用`--frozen-lockfile`参数，使用`--frozen-lockfile`参数的时候不会生成yarn.lock文件，且如果yarn在检测yarn.lock是有变化的时候，则会install失败

我们再来看下关于yarn.lock的作用

>The yarn.lock file is utilized as follows:
If yarn.lock is present and is enough to satisfy all the dependencies listed in package.json, the exact versions recorded in yarn.lock are installed, and yarn.lock will be unchanged. Yarn will not check for newer versions.
If yarn.lock is absent, or is not enough to satisfy all the dependencies listed in package.json (for example, if you manually add a dependency to package.json), Yarn looks for the newest versions available that satisfy the constraints in package.json. The results are written to yarn.lock.

大概意思就是：如果 `yarn.lock` 存在并且足以满足 `package.json` 中列出的所有依赖项，则安装 yarn.lock 中记录的确切版本，且 `yarn.lock` 将保持不变。 Yarn不会检查更新的版本。
如果 `yarn.lock` 不存在，或者不足以满足 `package.json` 中列出的所有依赖项（例如，如果我们手动向 package.json 添加依赖项），则 Yarn 会查找满足 `package` 中约束的最新可用版本。 然后将结果写入yarn.lock。

所以结合起来就是yarn install的时候会判断当前项目是否存在yarn.lock文件，如果没有则install之后生成，如果有且有新的满足条件的依赖包，则安装新的满足条件的依赖包并更新yarn.lock文件；如果有且没有新的满足条件的依赖包则不安装新的依赖包且不更新yarn.lock文件；当我们install加上--frozen-lockfile参数的时候，就表示的yarn.lock内的依赖是不需要更新的，这就要求package.json内的依赖版本必须要与yarn.lock文件内的包依赖版本一致，如果不一致则会install失败，提示`error Your lockfile needs to be updated, but yarn was run with `--frozen-lockfile``

## 总结

1. 排查问题的时候一定要定位清楚，错误来源哪里
2. `error Your lockfile needs to be updated`错误原因就是我们install的时候使用了--frozen-lockfile参数且手动改了package.json（比如"react":"^16.8.0"在package.json内将react版本手动改成"^16.10.0"），最后没有更新yarn.lock文件导致的报错
3. 排查--frozen-lockfile的报错，我们可以在本地调试
	- 在本地切到构建失败对应的分支
	- 删除node_modules
	- 执行yarn --frozen-lockfile命令，看是否有直接提示相同报错
	- 如果有相同报错，重新执行yarn install
	- 看到yarn.lock文件有更新
	- 在删除node_modules
	- 再次执行yarn --frozen-lockfile命令，是否可以正确install

