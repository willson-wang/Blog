---
  title: 记录一次php、apache、mysql、composer、wampserver安装过程
  date: 2018-03-17T08:15:26Z
  lastmod: 2018-03-17T08:16:55Z
  summary: 
  tags: ["PHP"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

因为公司项目需求，然后在github上面找了一个headless cms directus，在安装directus的时候需要php、mysql、apache这三样东西，于是上网找了资料进行安装，遂把安装过程中出现的一些问题它记录下来；操作系统是windows。


## apache安装

1. 下载  下载地址http://httpd.apache.org/docs/current/platform/windows.html#down

![image](https://user-images.githubusercontent.com/20950813/37552827-4f6d9e44-29f7-11e8-9e8c-59cb04c43cf8.png)

点击去之后选择操作系统的位数，32还是64，然后点击下载；

2. 按照这个教程进行安装 https://www.cnblogs.com/Ai-heng/p/7289241.html
```
启动命令
httpd –k start 

停止命令
httpd –k stop
```

3. 设置环境变量的目的是，让我们可以在cmd or git bash内直接运行某个服务or软件，而不需要每次都到对应文件的根目录or bin目录下去执行命令；

## php的安装

1. 下载  下载地址http://php.net/downloads.php

![image](https://user-images.githubusercontent.com/20950813/37552912-b22035c8-29f8-11e8-9507-557eddc39bc6.png)

点击windows download进入里面选择操作系统对应位数的版本，然后点击下载

2. 按照这个教程进行安装 https://www.cnblogs.com/Ai-heng/p/7289241.html

## mysql的安装

1. 下载  下载地址https://dev.mysql.com/downloads/mysql/

![image](https://user-images.githubusercontent.com/20950813/37552933-4ab58996-29f9-11e8-8179-c18a576baef3.png)

操作系统对应位数的版本，然后点击下载

2. 按照这个教程进行安装http://blog.csdn.net/luomingjun12315/article/details/50863781

```
启动mysql服务
net start mysql  

退出mysql命令
mysql > \q

暂停mysql服务
net stop mysql  
```

## composer安装

1. 下载  下载地址https://getcomposer.org/download/

![image](https://user-images.githubusercontent.com/20950813/37552981-10f62aac-29fa-11e8-98bc-d61700d1b20a.png)

2. 按照这个教程进行安装http://blog.csdn.net/csdn_dengfan/article/details/54912039

## wampserver安装
wampserver是一个集成了php、apache、mysql的工具，能够帮助我们快速搭建php开发环境；

1. 下载 按照此教程进行下载https://www.cnblogs.com/Sabre/p/6728818.html

2. 按照这个教程进行安装http://blog.csdn.net/wuguandi/article/details/53561253

3. 安装完成之后，就可以直接在该目录的www目录下进行开了

4. 修改www根目录及配置多目录访问
```
1. 修改wampserver的安装目录，在打开里面的“script”文件夹，用记事本打开里面的config.inc.php
// 注意，windows下表示路径的“\”在这里必须改为“/”）
// $wwwDir = $c_installDir.'/www';  => $wwwDir = 'F:/directus-build'   新的根目录

2. 修改wamp目录下Apach目录下面的httpd.conf文件
# DocumentRoot "${INSTALL_DIR}/www"
# <Directory "${INSTALL_DIR}/www/">

替换成需要的新目录

DocumentRoot "F:/directus-build/"
<Directory "F:/directus-build/">

3. 修改wamp目录下Apach目录下面的httpd-vhosts.conf文件
// 替换DocumentRoot与Directory 后面的路径
<VirtualHost *:80>
  ServerName localhost
  ServerAlias localhost
  DocumentRoot "F:/directus-build/"
  <Directory "F:/directus-build/">
    Options +Indexes +Includes +FollowSymLinks +MultiViews
    AllowOverride All
    Require local
  </Directory>
</VirtualHost>


到此为止就可以通过localhost访问新的www根目录了

4. 配置多站点，只需要在httpd-vhosts.conf文件内添加新的host

<VirtualHost *:80>
  ServerName www.abc.com
  ServerAlias www.abc.com
  DocumentRoot "F:/php-demo/"
  <Directory "F:/php-demo/">
    Options +Indexes +Includes +FollowSymLinks +MultiViews
    AllowOverride All
    Require local
  </Directory>
</VirtualHost>

5. 修改本机的hosts文件C:\Windows\System32\drivers\etc
// 添加如下内容，以此类推，然后我们就可以通过www.abc.com来访问F:/php-demo/目录下的内容了
127.0.0.1 localhost
127.0.0.1 www.abc.com
```

5. wampserver内的phpMyAdmin的初始登录名为root，密码为空

6. wampserver内mysql默认开启严格模式，可以直接使用设置选项禁用or自己修改my.ini文件，取消严格模式参考链接：https://www.cnblogs.com/lujs/p/6288806.html，设置严格模式   参考链接：http://blog.csdn.net/fdipzone/article/details/50616247

7. wampserver开启rewrite_module重写功能启用.htaccess文件，参考链接：http://blog.csdn.net/sgly2005/article/details/50718538

后端这条路上还是任重而道远啊！

