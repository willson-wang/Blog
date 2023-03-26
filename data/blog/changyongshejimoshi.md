---
  title: 常用设计模式
  date: 2018-02-28T13:16:42Z
  lastmod: 2018-02-28T13:18:37Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 单例模式
单例模式故名思议只允许实例化一次的对象类；常用于提供命名空间、模块化开发、及提供私有方法与属性
```
1. 提供命名空间及模块化开发
var WMS = {
    util: {
        util_random: function (){
            return Math.random();
        }
    },
    Tool: {
        tool1_getEle: function (id){
            return document.getElementById(id)
        }
    },
    Ajax: {
        get: function (){

        },
        post: function (){

        }
    }
}

2. 提供私有变量及方法（主要是利用自执行函数来完成）
//还可以用来设置静态变量
var Conf = (function (){
    var conf = {
        MAX_NUM: 500,
        MIN_NUM: 1,
        length: 10
    }

    var getConfValue = function (attr){
        return conf[attr] ? conf[attr] : null;
    }

    return {
        get: getConfValue
    }
})();

//取值
var minNnm = Conf.get("MIN_NUM");

// 惰性单例
var lazySingle = (
      var _instance = null;
      
      var fn = function () {
          var name = null;
          return {
              getName: function () {
                   return name;
              },
              setName: function (name) {
                   name = name;
              }
         }
     }

     return function () {
           if (!_instance) {
               _instance = fn();
           }
           return _instance
     }

)(); 

lazySingle().setName('jack');
lazySingle().getName();
```

### 工厂模式
工厂模式故名思议就是由一个工厂对象来创建某一种产品对象类的实例
```
var Basketball = function () {   
}

Basketball.prototype = {
      getName: function () {
            return this.name;
      },
      setName: function (name) {
            this.name = name;
      }
}

var Football = function () {   
}

Football.prototype = {
      getName: function () {
            return this.name;
      },
      setName: function (name) {
            this.name = name;
      }
}

var Tennis = function () {   
}

Tennis.prototype = {
      getName: function () {
            return this.name;
      },
      setName: function (name) {
            this.name = name;
      }
}
// 工厂类
var Factory = function (name) {
      switch (name) {
          case 'NBA':
              return new Basketball();
          case 'wordcup':
              return new Football();
          case 'FrenchOpen':
              return new Tennis();
      }
} 

var footnall = Factory('wordcup');
footnall.getName();
```

### 观察者模式
观察者模式，也称发布-订阅者模式，主要目的是用于解决主体对象与观察者之间的功能解耦，一帮用于不同组件间的通讯，核心方法包括三个，注册方法，发布方法，注销方法,还有一个消息容器
```
var Observer = (function (){
    var _message = {};
    return {
        regist: function (type,fn){ //注册方法
            if(typeof _message[type] === 'undefined'){ //如果没有改类型，则在容器内添加一个数组
                _message[type] = [fn];
            }else {
                _message[type].push(fn); //如果已经注册了该消息类型，那么把回调推送到消息队列中
            }
        },
        fire: function (type,args){//发布方法
            if(!_message[type])return;
            var events = {
                type: type,
                args: args || {},
            };
            for(var i=0; i<_message[type].length; i++){
                _message[type][i].call(this,events);
            }

        },
        remove: function (type,fn){//删除方法
            if(_message[type] instanceof Array){
                var i = _message[type].length - 1;
                for(;i>=0;i--){
                    _message[type][i] === fn && _message[type].splice(i,1)
                }
            }
        }
    }
})();

//注意一定要先订阅，才能在发布的时候收到消息，因为只有先注册，把注册的回调push到容器中，那么在发布的时候才能利用call方法来调已经注册在容器中的方法，并且把内容传入到回调函数中
Observer.regist("test",function (e){
    console.log(e.args);
});

Observer.fire("test",{age: 18, name: "jack"});

// 举个例子
//消息的展示
(function (){
    var addMsgItem = function (e){
        var text = e.args.text,
        msg = document.getElementById("msg"),
        li = document.createElement("li"),
        span = document.createElement("span");

        span.innerHTML = "X";
        li.innerHTML = text;
        span.onclick = function (){
            msg.removeChild(li);
            Observer.fire("removeCommentMsg",{
                num: -1
            });
        }

        li.appendChild(span);
        msg.appendChild(li);
    }

    Observer.regist("addCommentMsg",addMsgItem);
})();

//头部消息数量的变化
(function (){
    var numEle = document.getElementById("msgNum");
    numEle.innerHTML = document.getElementById("msg").children.length;
    var changeNum = function (e){
        var num = e.args.num;
            console.log(parseInt(numEle.innerHTML));
            numEle.innerHTML = parseInt(numEle.innerHTML) + num;
    }

    Observer.regist("addCommentMsg",changeNum);
    Observer.regist("removeCommentMsg",changeNum);
})();

//发布评论
(function (){
    var btn = document.getElementById("btn"),
        textarea = document.getElementById("text");
    btn.onclick = function (){
        if(!textarea.value)return;
        Observer.fire("addCommentMsg",{
            num: 1,
            text: textarea.value
        })
        textarea.value = "";
    }
})();
```

### 外观模式
外观模式，就是对一些底层的，有兼容性的方法做一层封装，便于统一调用
```
var addEvent = function (ele,type,fn){
    if(ele.addEventListener){
        ele.addEventListener(type,fn,false);
    }else if(ele.attachEvent){
        ele.attachEvent("on"+type,fn);
    }else {
        ele["on"+type] = fn;
    }
}

//单例模式加外观模式定义一个小型方法库
var util = {
    addEvent: function (ele,type,fn){
        if(ele.addEventListener){
            ele.addEventListener(type,fn,false);
        }else if(ele.attachEvent){
            ele.attachEvent("on"+type,fn);
        }else {
            ele["on"+type] = fn;
        }
    },
    getEvent: function (e){
        return e || window.event;
    },
    getTarget: function (e){
        var e = this.getEvent(e);
        return e.target || e.srcElement;
    },
    preventDefault: function (e){
        var e = this.getEvent(e);
        if(e.preventDefault) {
            e.preventDefault();
        }else {
            e.returnValue = false;
        }
    },
    stopPropogation: function (e){
        var e = this.getEvent(e);
        if(e.stopPropagation){
            e.stopPropagation();
        }else {
            e.cancelBubble = true;
        }
    }

}
var oBtn = document.getElementById("btn");
var test = function (e){
    var e = util.getEvent(e),
        target = util.getTarget(e);

    util.preventDefault(e);
    util.stopPropogation(e);
    console.log("test");
}
util.addEvent(oBtn,"click",test);
```

### 装饰者模式
装饰者模式就是在不改变原来对象的基础上，通过对其进行包装拓展（添加新的属性or方法）以满足更复杂的业务需求的方式
```
var decorator = function (id,fn){
    var oBtn = document.getElementById(id);
    if(typeof oBtn.onclick === "function"){
        var oldFn = oBtn.onclick;//获取之前绑定在click事件上的回调函数
        oBtn.onclick = function (){
            oldFn();
            fn();
        }
    }else {
        oBtn.onclick = fn;
    }
}
```

### 状态模式
状态模式，即当一个对象的内部状态发生改变时，会导致器行为的改变，一般用于多个if,else分支，及抽象多个公共部分的情况
```
var showResult2 = (function (){
    var myStatus = {
        status0: function (){
            console.log("statu0");
        },
        status2: function (){
            console.log("statu2");
        },
        status3: function (){
            console.log("statu3");
        },
        status4: function (){
            console.log("statu4");
        },
        status5: function (){
            console.log("statu5");
        },
    }

    var show = function (result){
        myStatus["status" + result] && myStatus["status" + result]();
    }
    return {
        show: show
    }
})();

showResult2.show(3);
```

