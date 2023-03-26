---
  title: docker快速上手指南
  date: 2020-01-16T02:18:00Z
  lastmod: 2020-01-17T14:03:15Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 一、几个概念

#### 镜像( Image )：可以理解为一个只读的文件包，其中包含了虚拟环境运行最原始文件系统的内容,在 Docker 容器启动的过程中，它以只读的方式被用于创建容器的运行环境。

镜像命名：username/repository:tag

username： 主要用于识别上传镜像的不同用户，与 GitHub 中的用户空间类似。没有 username 这个部分的镜像，表示镜像是由 Docker 官方所维护和提供
repository：主要用于识别进行的内容，形成对镜像的表意描述。
tag：主要用户表示镜像的版本，方便区分进行内容的不同细节,Docker 会采用 latest 作为缺省 tag

#### 容器 ( Container )：在容器技术中，容器就是用来隔离虚拟环境的基础设施，而在 Docker 里，它也被引申为隔离出来的虚拟环境

如果把镜像理解为编程中的类，那么容器就可以理解为类的实例。镜像内存放的是不可变化的东西，当以它们为基础的容器启动后，容器内也就成为了一个“活”的空间。

用更官方的定义，Docker 的容器应该有三项内容组成：

- 一个 Docker 镜像
- 一个程序运行环境
- 一个指令集合

#### 网络 ( Network )在 Docker 中，实现了强大的网络功能，我们不但能够十分轻松的对每个容器的网络进行配置，还能在容器间建立虚拟网络，将数个容器包裹其中，同时与其他网络环境隔离。

#### 数据卷 ( Volume )用于进行数据共享或持久化的文件或目录

#### Docker Engine: 由docker官方开发并维护的实现容器化的工具，其内在是由多个独立软件所组成的软件包。在这些程序中，最核心的就是 docker daemon 和 docker CLI 这俩了

##### docker daemon 和 docker CLI

Docker 所能提供的容器管理、应用编排、镜像分发等功能，都集中在了 docker daemon 中，在 docker daemon 管理容器等相关资源的同时，它也向外暴露了一套 RESTful API，我们能够通过这套接口对 docker daemon 进行操作

![image](https://user-images.githubusercontent.com/20950813/72487336-ada08380-3848-11ea-8d0c-85d84cf6cec7.png)

docker CLI 这个控制台程序。用来与docker daemon进行交互的cli工具

![image](https://user-images.githubusercontent.com/20950813/72487347-b42efb00-3848-11ea-8ef4-6fefd7932628.png)

### 二、具体操作

<h4>查看docker 版本</h4>

```
docker version
```

![image](https://user-images.githubusercontent.com/20950813/72487388-cd37ac00-3848-11ea-8cbe-3a8a49af5310.png)

<h4>查看docker引擎信息</h4>

```
docker info
```

![image](https://user-images.githubusercontent.com/20950813/72487409-df194f00-3848-11ea-8025-fd7416480526.png)

<h4>配置国内镜像</h4>

```
https://registry.docker-cn.com/
```

在 Daemon 面板里，我们可以直接配置对 docker daemon 的运行配置进行调整。默认情况下，在 Daemon 面板里只有 Insecure registries 和 Registry mirrors 两个配置，分别用来定义未认证镜像仓库地址和镜像源地址。

我们可以点击切换按钮切换到 Advanced 模式，在这个模式下，我们可以直接编辑 docker daemon 的 daemon.json 配置文件，实现更具体、完整的配置 docker daemon 的目的。

```
{
    "registry-mirrors": [
        "https://registry.docker-cn.com"
    ]
}
```

重新执行docker info查看是否更改成功

<h4>从镜像仓库拉去镜像</h4>

docker pull username/repository:tag

```
docker pull nginx
docker pull openresty/openresty:1.13.6.2-alpine
```

![image](https://user-images.githubusercontent.com/20950813/72487463-0e2fc080-3849-11ea-8102-2558b07d5594.png)

![image](https://user-images.githubusercontent.com/20950813/72487472-1556ce80-3849-11ea-8bb5-09dbe2d20773.png)

<h4>搜索镜像</h4>

```
docker search nginx
```

![image](https://user-images.githubusercontent.com/20950813/72487430-f6f0d300-3848-11ea-981e-7af1e8493cf4.png)

<h4>获取某个镜像的详细信息</h4>

```
docker inspect nginx
```

![image](https://user-images.githubusercontent.com/20950813/72487554-5b139700-3849-11ea-95b8-0fd8f3200f6f.png)

<h4>读取本地镜像数</h4>

```
docker images
```

![image](https://user-images.githubusercontent.com/20950813/72487539-4b944e00-3849-11ea-9433-4f24d62bb12d.png)

<h4>删除镜像</h4>

docker rmi 命令也支持同时删除多个镜像，只需要通过空格传递多个镜像 ID 或镜像名即可。

删除镜像的过程其实是删除镜像内的镜像层，在删除镜像命令打印的结果里，我们可以看到被删除的镜像层以及它们的 ID。当然，如果存在两个镜像共用一个镜像层的情况，你也不需要担心 Docker 会删除被共享的那部分镜像层，只有当镜像层只被当前被删除的镜像所引用时，Docker 才会将它们从硬盘空间中移除。

```
docker rmi nginx:latest
```
![image](https://user-images.githubusercontent.com/20950813/72487565-69fa4980-3849-11ea-9fed-7b85bbe3db59.png)

<h4>创建容器</h4>

docker create 镜像名 创建容器

```
docker create nginx:1.12
```

执行 docker create 后，Docker 会根据我们所给出的镜像创建容器，在控制台中会打印出 Docker 为容器所分配的容器 ID，此时容器是处于 Created 状态的。

之后我们对容器的操作可以通过这个容器 ID 或者它的缩略形式进行，但用容器 ID 操作容器就和用镜像 ID 操作镜像一样烦闷，所以我们更习惯于使用容器名来操作容器。

要使用容器名操作容器，就先得给容器命名，在创建容器时，我们可以通过 --name 这个选项来配置容器名。

```
docker create --name nginx nginx:1.12
```

<h4>启动容器</h4>

docker start 容器名or容器id

```
docker start nginx
```

docker run --name xxx -d nginx:1.12 快速创建并启动容器

```
docker run --name nginx -d nginx:1.12
```

![image](https://user-images.githubusercontent.com/20950813/72487686-c8bfc300-3849-11ea-8e36-e11eb42872ac.png)

<h6>指定端口映射</h6>

为什么要端口映射？
​
在启动容器时，如果不配置宿主机器与虚拟机的端口映射，外部程序是无法访问虚拟机的，因为没有端口。

docker run  -p  ip:hostPort:containerPort

or

docker run  -P

hostPort宿主机的端口
containerPort容器端口

```
docker run -d -p 80:80 --name nginx nginx
```

可以通过docker port 容器名or容器id 查看某个容器当前映射的端口

![image](https://user-images.githubusercontent.com/20950813/72488045-cb6ee800-384a-11ea-8d86-85f510ef2345.png)

这里需要注意的一点是，通常来说我们启动容器会期望它运行在“后台”，而 docker run 在启动容器时，会采用“前台”运行这种方式，这时候我们的控制台就会衔接到容器上，不能再进行其他操作了。我们可以通过 -d 或 --detach 这个选项告诉 Docker 在启动后将程序与控制台分离，使其进入“后台”运行。

这时候我们可以通过浏览器访问localhost or curl http://localhost 如果能够看到nginx的启动页面，就说明我们的容器是启动ok了的

如果看到404，如果可以通过后面的docker exec 命名进入对应的容器内

然后通过cat /etc/nginx/nginx.conf 查看是否有index及root选项等等

还可以通过curl http:localhost:端口号 or wget http:localhost:端口号 来查看容器内的nginx是否正常启动

![image](https://user-images.githubusercontent.com/20950813/72487731-e8ef8200-3849-11ea-8e49-12c764c09b17.png)

<h4>管理容器</h4>

通过 docker ps 这个命令，我们可以罗列出 Docker 中的容器。

```
docker ps 
docker ps -a
```

![image](https://user-images.githubusercontent.com/20950813/72487711-dd03c000-3849-11ea-9899-33f756063857.png)

默认情况下，docker ps 列出的容器是处于运行中的容器，如果要列出所有状态的容器，需要增加 -a 或 --all 选项。

在 docker ps 的结果中，我们可以看到几项关于容器的信息。其中 CONTAINER ID、IMAGE、CREATED、NAMES 大家都比较容易理解，分别表示容器 ID，容器所基于的镜像，容器的创建时间和容器的名称。

结果中的 COMMAND 表示的是容器中主程序 ( 也就是与容器生命周期所绑定进程所关联的程序 ) 的启动命令，这条命令是在镜像内定义的，而容器的启动其实质就是启动这条命令。关于 COMMAND 的更多知识，我们在之后的 Docker 镜像制作中会更详细的解读。

结果中的 STATUS 表示容器所处的状态，其值和我们之前所谈到的状态有所区别，主要是因为这里还记录了其他的一些信息。在这里，常见的状态表示有三种：

Created 此时容器已创建，但还没有被启动过。
Up [ Time ] 这时候容器处于正在运行状态，而这里的 Time 表示容器从开始运行到查看时的时间。
Exited ([ Code ]) [ Time ] 容器已经结束运行，这里的 Code 表示容器结束运行时，主程序返回的程序退出码，而 Time 则表示容器结束到查看时的时间。

<h4>停止和删除容器</h4>


docker stop 容器名or容器id

```
docker stop nginx
```

![image](https://user-images.githubusercontent.com/20950813/72487753-f86ecb00-3849-11ea-805d-9d7e5be234f7.png)

容器停止后，其维持的文件系统沙盒环境还是存在的，内部被修改的内容也都会保留，我们可以通过 docker start 命令将这个容器再次启动。
当我们需要完全删除容器时，可以通过 docker rm 命令将容器进行删除。

```
docker rm nginx
```

正在运行中的容器默认情况下是不能被删除的，我们可以通过增加 -f 或 --force 选项来让 docker rm 强制停止并删除容器，不过这种做法并不妥当。

```
docker rm -f nginx
```

为什么需要随手删除容器

1. 在 Docker 中，打包镜像的成本是非常低的，其速度也快得惊人，所以如果我们要为程序准备一些环境或者配置，完全可以直接将它们打包至新的镜像中，下次直接使用这个新的镜像创建容器即可。

2. 容器中应用程序所产生的一些文件数据，是非常重要的，如果这些数据随着容器的删除而丢失，其损失是非常巨大的。对于这类由应用程序所产生的数据，并且需要保证它们不会随着容器的删除而消失的，我们可以使用 Docker 中的数据卷来单独存放。由于数据卷是独立于容器存在的，所以其能保证数据不会随着容器的删除而丢失。

可以通过一张图来看docker容器的生命周期

![image](https://user-images.githubusercontent.com/20950813/72488609-61efd900-384c-11ea-95ed-53939a23be2f.png)

<h4>进入容器</h4>

docker exec 容器名or容器id 

```
docker exec nginx

docker exec nginx more /etc/hostname

docker exec -it nginx bash //使用bash来执行命令 
```

注意,如果提示如下错误

```
OCI runtime exec failed: exec failed: container_linux.go:346: starting container process caused "exec: \"bash\": executable file not found in $PATH": unknown
```

需要排查两点

1. 容器名称or id是否输入正确
2. nginx是否安装的是alpine版本，该版本是没有装bash工具的

所以我们需要换成自带的shell

```
docker exec -it nginx /bin/sh
```

![image](https://user-images.githubusercontent.com/20950813/72488010-b8f4ae80-384a-11ea-8138-3810664b03d0.png)

<h4>退出容器</h4>

```
exit or control + d
```

<h4>通过Dockerfile创建镜像</h4>

Dockerfile 是 Docker 中用于定义镜像自动化构建流程的配置文件，在 Dockerfile 中，包含了构建镜像过程中需要执行的命令和其他操作。通过 Dockerfile 我们可以更加清晰、明确的给定 Docker 镜像的制作过程，而由于其仅是简单、小体积的文件，在网络等其他介质中传递的速度极快，能够更快的帮助我们实现容器迁移和集群部署。

相对于之前我们介绍的提交容器修改，再进行镜像迁移的方式相比，使用 Dockerfile 进行这项工作有很多优势，我总结了几项尤为突出的。

- Dockerfile 的体积远小于镜像包，更容易进行快速迁移和部署。
- 环境构建流程记录了 Dockerfile 中，能够直观的看到镜像构建的顺序和逻辑。
- 使用 Dockerfile 来构建镜像能够更轻松的实现自动部署等自动化流程。
- 在修改环境搭建细节时，修改 Dockerfile 文件要比从新提交镜像来的轻松、简单

<h4>常用 Dockerfile 指令</h4>

FROM 选择基础镜像并命名容器的名称，在 Dockerfile 中可以多次出现 FROM 指令，当 FROM 第二次或者之后出现时，表示在此刻构建时，要将当前指出镜像的内容合并到此刻构建镜像的内容里。这对于我们直接合并两个镜像的功能很有帮助。

```
FROM <image> [AS <name>]
FROM <image>[:<tag>] [AS <name>]
FROM <image>[@<digest>] [AS <name>]
```

RUN  RUN 指令就是用于向控制台发送命令的指令，RUN 指令是支持 \ 换行的，如果单行的长度过长，建议对内容进行切割，方便阅读

```
RUN <command>
RUN ["executable", "param1", "param2"]
```

ENTRYPOINT 和 CMD 基于镜像启动的容器，在容器启动时会根据镜像所定义的一条命令来启动容器中进程号为 1 的进程。而这个命令的定义，就是通过 Dockerfile 中的 ENTRYPOINT 和 CMD 实现的。

ENTRYPOINT 指令和 CMD 指令的用法近似，都是给出需要执行的命令，并且它们都可以为空，或者说是不在 Dockerfile 里指出。

当 ENTRYPOINT 与 CMD 同时给出时，CMD 中的内容会作为 ENTRYPOINT 定义命令的参数，最终执行容器启动的还是 ENTRYPOINT 中给出的命令。

```
ENTRYPOINT ["executable", "param1", "param2"]
ENTRYPOINT command param1 param2

CMD ["executable","param1","param2"]
CMD ["param1","param2"]
CMD command param1 param2
```

EXPOSE 指令就可以为镜像指定要暴露的端口

```
EXPOSE <port> [<port>/<protocol>...]
```

VOLUME 在 VOLUME 指令中定义的目录，在基于新镜像创建容器时，会自动建立为数据卷，不需要我们再单独使用 -v 选项来配置了。

```
VOLUME ["/data"]
```


COPY 和 ADD 在制作新的镜像的时候，我们可能需要将一些软件配置、程序代码、执行脚本等直接导入到镜像内的文件系统里，使用 COPY 或 ADD 指令能够帮助我们直接从宿主机的文件系统里拷贝内容到镜像里的文件系统中。

```
COPY [--chown=<user>:<group>] <src>... <dest>
ADD [--chown=<user>:<group>] <src>... <dest>

COPY [--chown=<user>:<group>] ["<src>",... "<dest>"]
ADD [--chown=<user>:<group>] ["<src>",... "<dest>"]
```

对比 COPY 与 ADD，两者的区别主要在于 ADD 能够支持使用网络端的 URL 地址作为 src 源，并且在源文件被识别为压缩包时，自动进行解压，而 COPY 没有这两个能力。

虽然看上去 COPY 能力稍弱，但对于那些不希望源文件被解压或没有网络请求的场景，COPY 指令是个不错的选择

<h4>构建镜像</h4>

docker build ./webapp // docker build 可以接收一个参数，需要特别注意的是，这个参数为一个目录路径 ( 本地路径或 URL 路径 )，而并非 Dockerfile 文件的路径。在 docker build 里，这个我们给出的目录会作为构建的环境目录，我们很多的操作都是基于这个目录进行的

在默认情况下，docker build 也会从这个目录下寻找名为 Dockerfile 的文件，将它作为 Dockerfile 内容的来源。如果我们的 Dockerfile 文件路径不在这个目录下，或者有另外的文件名，我们可以通过 -f 选项单独给出 Dockerfile 文件的路径。

```
docker build -t webapp:latest -f ./webapp/a.Dockerfile ./webapp
```

当然，在构建时我们最好总是携带上 -t 选项，用它来指定新生成镜像的名称。

```
docker build -t webapp:latest ./webapp
```

![image](https://user-images.githubusercontent.com/20950813/72487941-8480f280-384a-11ea-92ec-74b015f92258.png)

在 Dockerfile 里，我们可以用 ARG 指令来建立一个参数变量，我们可以在构建时通过构建指令传入这个参数变量
```
ARG TOMCAT_MAJOR

RUN wget -O tomcat.tar.gz "https://www.apache.org/dyn/closer.cgi?action=download&filename=tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz"

```

```
docker build --build-arg TOMCAT_MAJOR=8
```

环境变量也是用来定义参数的东西，与 ARG 指令相类似，环境变量的定义是通过 ENV 这个指令来完成的

```
ENV TOMCAT_MAJOR 8
ENV TOMCAT_VERSION 8.0.53

RUN wget -O tomcat.tar.gz "https://www.apache.org/dyn/closer.cgi?action=download&filename=tomcat/tomcat-$TOMCAT_MAJOR/v$TOMCAT_VERSION/bin/apache-tomcat-$TOMCAT_VERSION.tar.gz"

```

环境变量的使用方法与参数变量一样，也都是能够直接替换指令参数中的内容。

与参数变量只能影响构建过程不同，环境变量不仅能够影响构建，还能够影响基于此镜像创建的容器。环境变量设置的实质，其实就是定义操作系统环境变量，所以在运行的容器里，一样拥有这些变量，而容器中运行的程序也能够得到这些变量的值。

另一个不同点是，环境变量的值不是在构建指令中传入的，而是在 Dockerfile 中编写的，所以如果我们要修改环境变量的值，我们需要到 Dockerfile 修改。不过即使这样，只要我们将 ENV 定义放在 Dockerfile 前部容易查找的地方，其依然可以很快的帮助我们切换镜像环境中的一些内容。

由于环境变量在容器运行时依然有效，所以运行容器时我们还可以对其进行覆盖，在创建容器时使用 -e 或是 --env 选项，可以对环境变量的值进行修改或定义新的环境变量。

```
docker run -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:5.7
```

另外需要说明一点，通过 ENV 指令和 ARG 指令所定义的参数，在使用时都是采用 $ + NAME 这种形式来占位的，所以它们之间的定义就存在冲突的可能性。对于这种场景，大家只需要记住，ENV 指令所定义的变量，永远会覆盖 ARG 所定义的变量，即使它们定时的顺序是相反的。


```
RUN apt-get update; \
    apt-get install -y --no-install-recommends $fetchDeps; \
    rm -rf /var/lib/apt/lists/*;

RUN apt-get update
RUN apt-get install -y --no-install-recommends $fetchDeps
RUN rm -rf /var/lib/apt/lists/*
```

事实上，下面两种写法对于搭建的环境来说是没有太大区别的。那为什么我们更多见的是第一种形式而非第二种呢？这就要从镜像构建的过程说起了。

看似连续的镜像构建过程，其实是由多个小段组成。每当一条能够形成对文件系统改动的指令在被执行前，Docker 先会基于上条命令的结果启动一个容器，在容器中运行这条指令的内容，之后将结果打包成一个镜像层，如此反复，最终形成镜像。
所以说，我们之前谈到镜像是由多个镜像层叠加而得，而这些镜像层其实就是在我们 Dockerfile 中每条指令所生成的。
了解了这个原理，大家就很容易理解为什么绝大多数镜像会将命令合并到一条指令中，因为这种做法不但减少了镜像层的数量，也减少了镜像构建过程中反复创建容器的次数，提高了镜像构建的速度。

构建缓存

由于镜像是多个指令所创建的镜像层组合而得，那么如果我们判断新编译的镜像层与已经存在的镜像层未发生变化，那么我们完全可以直接利用之前构建的结果，而不需要再执行这条构建指令，这就是镜像构建缓存的原理。

那么 Docker 是如何判断镜像层与之前的镜像间不存在变化的呢？这主要参考两个维度，第一是所基于的镜像层是否一样，第二是用于生成镜像层的指令的内容是否一样。


基于这个原则，我们在条件允许的前提下，更建议将不容易发生变化的搭建过程放到 Dockerfile 的前部，充分利用构建缓存提高镜像构建的速度。另外，指令的合并也不宜过度，而是将易变和不易变的过程拆分，分别放到不同的指令里。


在另外一些时候，我们可能不希望 Docker 在构建镜像时使用构建缓存，这时我们可以通过 --no-cache 选项来禁用它。

```
docker build --no-cache ./webapp
```

<h4>借助Docker Compose帮助我们构建镜像、容器并启动容器</h4>

docker desk自带Docker Compose

```
docker-compose version
```

Docker Compose 的配置文件也有一个缺省的文件名，也就是 docker-compose.yml

简单配置如下所示

```
version: '3'
services:
  app:
    build: .
    image: app
    container_name: app
    ports:
      - 9007:9007
```

构建镜像与容器并启动容器

```
docker-compose up -d --build
docker-compose -f ./compose/docker-compose.yml -p myapp up -d
```
可以通过选项 -f 来修改识别的 Docker Compose 配置文件，通过 -p 选项来定义项目名

```
docker-compose down
```

docker-compose down 命令用于停止所有的容器，并将它们删除，同时消除网络等配置内容，也就是几乎将这个 Docker Compose 项目的所有影响从 Docker 中清除


<h4>多阶构建</h4>

由于 Docker 采用轻量级容器的设计，每个容器一般只运行一个软件，而目前绝大多数应用系统都绝不是一个软件所能组成的，所以就设计到多阶构建，后面构建的任务可以拿到前面镜像的内容

如下一个Dockerfile内有多个FROM参数

```
FROM node:11.13.0 AS builder_web

WORKDIR /webapp

ADD ./ /webapp

RUN yarn --frozen-lockfile --check-files && \
  yarn build

FROM nginx:1.17.2-alpine

COPY --from=builder_web /webapp/dist /webapp/dist
COPY --from=builder_web /webapp/nginx.conf /etc/nginx/conf.d/default.conf
```

![image](https://user-images.githubusercontent.com/20950813/72488240-5d76f080-384b-11ea-9704-26e6bce0eed4.png)

注意多阶段构建有多少个FROM就会产生多少个images

![image](https://user-images.githubusercontent.com/20950813/72488187-315b6f80-384b-11ea-83bd-bf71979e6204.png)

我们只需要通过我们需要的镜像去创建容器

![image](https://user-images.githubusercontent.com/20950813/72488214-4a642080-384b-11ea-8b0e-84f1e559b68b.png)

<h4>常见错误</h4>

docker: Error response from daemon: pull access denied for 46d63952da42, repository does not exist or may require 'docker login': denied: requested access to the resource is denied.

其实就是镜像有问题，导致依赖镜像的容器无法正常启动，一般是nginx配置错误

### 三、实际例子

react、vue都是一样的，如果我们使用的是history模式，那么我们需要后端，或者服务器的配置，这里已vue+nginx为利

1. 使用@vue/cli来创建vue项目vue create demo6

2. 在项目内配置nginx文件

```
server {
    listen 9000;
    server_name localhost;
    access_log /var/log/nginx/host.access.log  main; 
    error_log /var/log/nginx/error.log  error;

    root /app/dist;
    index index.html index.htm index.shtml;

    location / {
        try_files $uri /index.html; // 一定要加这个，不然history模式下页面会404,这句话的意思就是当url匹配不上的时候就尝试给我直接返回index.html，这样就由前端路由接管，页面可以正常访问
    }
}
```

3. 项目内配置Dockerfile

```
FROM node:latest AS builder_web

WORKDIR /app

ARG IMAGE_TAG
ENV IMAGE_TAG=$IMAGE_TAG

ADD ./ /app

RUN yarn --frozen-lockfile --check-files && \
  yarn build

FROM nginx:1.17.2-alpine

COPY --from=builder_web /app/dist /app/dist
COPY --from=builder_web /app/nginx.conf /etc/nginx/conf.d/default.conf
```

4. 然后创建镜像

```
docker build -t vue-webapp:latest ./demo6 or docker build -t vue-webapp:latest ./ 看当前所在目录
docker images 查看镜像是否构建成功
```

![image](https://user-images.githubusercontent.com/20950813/72617584-3cf68580-3974-11ea-8b02-95fd793c0a85.png)

5. 创建容器并运行容器

```
docker run -d -p 9001:9000 --name vue-webapp vue-webapp:latest
```
![image](https://user-images.githubusercontent.com/20950813/72617604-4b44a180-3974-11ea-9f78-b15b8d226e85.png)

6. 浏览器上访问

![image](https://user-images.githubusercontent.com/20950813/72617632-5c8dae00-3974-11ea-9c62-e5138cb35cfd.png)

其实只要在服务器上同样的操作就是正常的部署上线了

### 四、总结

docker是devOps理念中重要的工具，能够大大的提高开发与运维之间的合作效率，同时也能够给前端带来更多的选择；这里仅仅是一个入门，后续还需要根据场景继续去深入

参考链接
https://www.cnblogs.com/sparkdev/p/8508435.html
https://hub.docker.com/
https://docs.docker.com/engine/reference/commandline/build/
https://juejin.im/book/5b7ba116e51d4556f30b476c
