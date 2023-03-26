---
  title: 为什么git clone ssh地址输入密码总是失败
  date: 2022-02-22T04:17:15Z
  lastmod: 2022-02-22T04:18:02Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

# 目录

- [背景](背景)
- [ssh与https的区别](ssh与https的区别)
- [ssh原理与运用](ssh原理与运用)
- [总结](总结)



### 背景

公司自研了脚手架，用于项目的快速创建，基于架构设计，模版与脚手架是分离的，模版物料库放置在一个单独的`gitlab`仓库，而脚手架内通过`git clone`的方式将物料库中的模版clone下来，生产最终的模版项目



为了避免让小伙伴通过脚手架创建模版的时候输入用户名与密码，所以clone选择的是ssh链接地址，而不是https地址，默认公司每个小伙伴电脑上都配置了ssh key，理想是丰满的，现实是骨感的，总是有一些小伙伴，是没有配置ssh key的，所以就不得不重新考虑git clone的方式，解决思路是，先判断是否配置了ssh key，如果没有配置，再让小伙伴输用户密码



判断是否配置ssh key的方式

```shell
ssh -T git@对应的gitlab地址
```

如果有配置则会返回welcome xxx;



如果没有设置，则会出现无法确认host主机的真实性，只知道它的公钥指纹，问你还想继续连接吗？这样的提示，我们选择确认之后，则会提示输入密码，然后我们输入gitlab密码，残酷的是密码是对的，但是没法登录成功


<img width="635" alt="image-20220222102442165" src="https://user-images.githubusercontent.com/20950813/155062094-8f5602c2-5a85-4a6d-a95e-0d64ca487b9a.png" />


一开始一直以为是自己密码记错了，然后试一下https链接来clone，是会出现输入用户名，然后在输入密码的过程，最终输入账号密码之后成功clone了下来



问题来了，git clone ssh链接，没有提示输入用户名的这一个步骤，只有输入密码的步骤，而https链接是有输入用户名步骤的，为什么会有这样的差异，于是找了下相关的资料



### SSH与HTTPS的区别

git可以使用四种主要的协议来传输内容: 本地协议（Local），HTTP 协议，SSH（Secure Shell）协议及 git 协议。其中，本地协议由于目前大都是进行远程开发和共享代码所以一般不常用，而git协议由于缺乏授权机制且较难架设所以也不常用



最常用的便是SSH和HTTP(S)协议。git关联远程仓库可以使用HTTP协议或者SSH协议。



#### HTTPS优缺点

- 优点1: HTTPS 更简单，只需要输入用户名与密码就可以进行代码的clone、push、pull
- 优点2: 不需要为多个不同的git服务，配置不同的ssh key
- 优点3: HTTPS使用的是443端口，基本上任何互联网的防火墙中都是开放这个端口号的
- 缺点: 使用http/https除了速度慢以外，还有个最大的麻烦是每次推送都必须输入口令. 但是现在操作系统或者其他git工具都提供了 `keychain` 的功能，可以把你的账户密码记录在系统里，例如OSX 的 Keychain 或者 Windows 的凭证管理器



#### SSH的优缺点

- 优点1: 架设 Git 服务器时常用 SSH 协议作为传输协议。 因为大多数环境下已经支持通过 SSH 访问 

- 缺点1: SSH服务端一般使用22端口，企业防火墙可能没有打开这个端口。
- 缺点2: 必须先配置ssk key才能正常的进行clone、push、pull
- 缺点3: SSH 协议的缺点在于你不能通过他实现匿名访问。 即便只要读取数据，使用者也要有通过 SSH 访问你的主机的权限，这使得 SSH 协议不利于开源的项目。 如果你只在公司网络使用，SSH 协议可能是你唯一要用到的协议。 如果你要同时提供匿名只读访问和 SSH 协议，那么你除了为自己推送架设 SSH 服务以外，还得架设一个可以让其他人访问的服务。



### SSH原理与运用



**什么是SSH?**

SSH是一种网络协议，用于计算机之间的加密登录



**基本用法**

SSH主要用于远程登录。假定你要以用户名user，登录远程主机host，只要一条简单命令就可以了

```shell
$ ssh user@host
```



**中间人攻击**



SSH之所以能够保证安全，原因在于它采用了公钥加密



整个过程是这样的：（1）远程主机收到用户的登录请求，把自己的公钥发给用户。（2）用户使用这个公钥，将登录密码加密后，发送回来。（3）远程主机用自己的私钥，解密登录密码，如果密码正确，就同意用户登录。

这个过程本身是安全的，但是实施的时候存在一个风险：如果有人截获了登录请求，然后冒充远程主机，将伪造的公钥发给用户，那么用户很难辨别真伪。因为不像https协议，SSH协议的公钥是没有证书中心（CA）公证的，也就是说，都是自己签发的。

可以设想，如果攻击者插在用户与远程主机之间（比如在公共的wifi区域），用伪造的公钥，获取用户的登录密码。再用这个密码登录远程主机，那么SSH的安全机制就荡然无存了。这种风险就是著名的["中间人攻击"](https://en.wikipedia.org/wiki/Man-in-the-middle_attack)（Man-in-the-middle attack）。

SSH协议是如何应对的呢？



**口令登录**

如果你是第一次登录对方主机，系统会出现下面的提示：

<img width="580" alt="image-20220218224444742" src="https://user-images.githubusercontent.com/20950813/155062161-c8f69eda-a491-40a2-8d16-fb8c65d64284.png" />

当我们选择yes，并输入正确的密码之后就登录成功了

当远程主机的公钥被接受以后，它就会被保存在文件$HOME/.ssh/known_hosts之中。下次再连接这台主机，系统就会认出它的公钥已经保存在本地了，从而跳过警告部分，直接提示输入密码。

每个SSH用户都有自己的known_hosts文件，此外系统也有一个这样的文件，通常是～/.ssh/known_hosts，保存一些对所有用户都可信赖的远程主机的公钥。



**公钥登录**

使用密码登录，每次都必须输入密码，很麻烦。好在SSH还提供了公钥登录，可以省去输入密码的步骤。

所谓"公钥登录"，原理很简单，就是用户将自己的公钥储存在远程主机上。登录的时候，远程主机会向用户发送一段随机字符串，用户用自己的私钥加密后，再发回来。远程主机用事先储存的公钥进行解密，如果成功，就证明用户是可信的，直接允许登录shell，不再要求密码。



直接用ssh-keygen生成



```shell
ssh-keygen
```



运行上面的命令以后，系统会出现一系列提示，可以一路回车。其中有一个问题是，要不要对私钥设置口令（passphrase），如果担心私钥的安全，这里可以设置一个。

运行结束以后，在$HOME/.ssh/目录下，会新生成两个文件：id_rsa.pub和id_rsa。前者是你的公钥，后者是你的私钥。



更多内容参考[SSH原理与运用（一）：远程登录](http://www.ruanyifeng.com/blog/2011/12/ssh_remote_login.html)



**github或者gitlab的场景怎样来配置私钥与公钥**



1、生成秘钥

`ssh-keygen -t rsa -f ~/.ssh/id_rsa_github -C "xxx@163.com" `生成上传`github`文件名为`id_rsa_github`与`id_rsa_github_pub`的私钥与公钥

`ssh-keygen -t rsa -C "xxx@xxx.com"` 生成上传`gitlab`默认的`id_rsa`与`id_rsa_pub`的私钥与公钥



2、在ssh文件夹下配置config文件,注意mac电脑上不能有后面的//注释，不然报错



```
# default                                    

Host git.xxx.com.cn   // gitlab的域名

HostName git.xxx.com.cn 

User xxx // 登录名

IdentityFile ~/.ssh/id_rsa  // 对应的私钥文件

# two                                      

Host github.com // github的域名

HostName github.com // github的域名

User xxx

IdentityFile ~/.ssh/id_rsa_github
```



3、将id_rsa_pub内的公钥放置到gitlab的ssh内，id_rsa_github内的公钥放置到github的ssh内



4、测试ssh链接

```
ssh -T git@github.com // 判断github的ssh链接是否成功

ssh -T git@git.xxx.cn // 判断gitlab的ssh链接是否成功

如果成功会提示welcome to gitlab/github xxx
```



5、设置全局的gitlab邮箱与用户名，git config --list查看当前项目的git配置信息

```
git config global user.email 'xxx@xxx.com'

git config global user.name 'xxx'
```



6、在需要通过github上传的项目内设置局部的邮箱与用户名,注意不需要去取消全局的，直接在本地项目内设置即可，则会覆盖全局的邮箱和用户名配置

```
git config user.name 'xxx'

git config user.email 'xxx@xxx.com'
```



现在就可以使用ssh方式操作多个不同的git服务器了



在回过来来看最开始的问题，`ssh -T git@xxx.com`为什么不用输入密码，原因是`ssh -T git@xxx.com` 这里的git就是用户名，所以我们只需要输入密码，为什么这里不能使用我们自己的用户名，而是一定要使用git用户名，先看github文档内找到这样的描述，文档里面描述我们总是要使用git作为user


<img width="1159" alt="image-20220222110509657" src="https://user-images.githubusercontent.com/20950813/155062211-c1308e8f-4463-46d4-ba26-18816ae3a54c.png" />


为什么git clone ssh链接不用输入用户名，同理一样，ssh地址都是`git@xxx.com:yd/activity.git`，这里的用户名还是git;

所以通过ssh 这种方式clone一定要先配置了ssh key才能过通过验证，将仓库内容clone下来



在来看，为什么git服务器，要求总是使用git用户来操作，而不允许通过注册的用户名与密码来进行操作，只找到一个相关的回答[[Why does git using ssh use git as a username](https://stackoverflow.com/questions/47664768/why-does-git-using-ssh-use-git-as-a-username)]([Why does git using ssh use git as a username](https://stackoverflow.com/questions/47664768/why-does-git-using-ssh-use-git-as-a-username))

这里面的内容概括起来就是

- git服务只是选择ssh方式来作为内容传输的协议
- ssh用户检验的方式契合git服务想要的方式
- 对于用户是不需要与git服务器进行交互式操作的，所以我们没必要登录git服务器
- 我们只需要通过git校验，然后通过ssh的方式将git服务器上的内容下载下来就可以



所以我们使用ssh方式与git服务器进行交互的时候，使用统一的git用户就可以，而不需要使用自己注册的用户名与密码



### 总结

追求简单，推荐使用HTTPS方式，只需要输入账号密码即可

有命令行习惯的开发，推荐SSH KEY方式，只需要第一次花点时间配置一下，后续就不用考虑账号登录的问题



参考链接

[SSH原理与运用（一）：远程登录](http://www.ruanyifeng.com/blog/2011/12/ssh_remote_login.html)

[Should You Use HTTPS or SSH For Git?](https://www.cloudsavvyit.com/14822/should-you-use-https-or-ssh-for-git/)
