---
  title: 函数式编程在开发中的实践
  date: 2019-04-11T12:04:20Z
  lastmod: 2019-07-23T13:52:52Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

 一个程序员能够用常规的基础函数武装自己，更重要的是知道如何使用它们，要比那些苦思冥想的人高效的多
常用的基础及高阶函数，数组：forEach、map、filter、reduce；函数：debounce、compose、curry、partial
纯函数、引用透明、不可变数据

### 场景一：根据某个状态值筛选列表

```
const list = [
    {
        type: 1,
        flag: true
    },
    {
        type: 2,
        flag: false
    },
    {
        type: 3,
        flag: true
    }
]

// 获取全部列表
function getList(filter = () => true) {
    return list.filter(filter)
}

// 提取返回布尔值的函数
function bool (flag) {
    return function () {
        return !!flag
    }
}

// 改写获取全部列表方法
function getList1(filter = bool(true)) {
    return list.filter(filter)
}

// 获取一个or多个类型的列表
getList(function (item) {
    return item.type === 1
})

getList(function (item) {
    return item.type === 2
})

getList(function (item) {
    return item.type === 3
})

// 提取item.type
function pick(data, type) {
    return data[type]
}

// 使用pick改写
getList(function(item) {
    return pick(item, 'type') === 1
})

getList(function(item) {
    return pick(item, 'type') === 2
})

getList(function(item) {
    return pick(item, 'type') === 3
})

// 能不能先定义获取type属性的方法pickType,这里需要引入柯里化的概念，及对多元参数改成一元参数的调用方式
// 柯里化实现的关键就是记录参数的个数，当参数个数大于等于函数参数时直接调用函数并返回结果；当累计参数小于函数参数个数时，继续返回函数
function curry(fn, arr = []) {
    return function (...args) {
        return (function (arg) {
            return arg.length === fn.length ? fn(...arg) : curry(fn, arg)
        })([...arr, ...args])
    }
}

function _curryN(length, combined = [], fn) {
    return function (...args) {
        combined = combined.concat(args)
        return combined.length >= length ? fn(...combined) : _curryN(length, combined, fn)
    }
}

function curryN(length, fn) {
    return _curryN(length, [], fn)
}

// 偏函数，注意跟柯里化的区别
function partical(fn, ...arg) {
    return function (...newArgs) {
        return fn.apply(this, arg.concat(newArgs))
    }
}

// 定义pickType方法，这里有个问题，参数是从左至右的，而我们的type又是第二个参数，所以需要反转一下参数
// const pickType = curry(pick)('type')
function reverseArgs (...args) {
    return args.reverse()
}

// 明显这时候有了reveserArgs还是不行，还需要一个工具来组合一下,方法从左至右执行
function compose(...fns) {
    return function (...args) {
        return fns.reduce(function (prev, fn) {
            return fn(...[].concat(prev))
        }, args)
    }
}

// 定义组合函数
const reversePick = compose(reverseArgs, pick)

// 对组合函数reversePick进行柯里化
// @TODO当使用curry时，无法正确读取compose之后fn.length
// 使用curryN之后，当不能重复使用pickType，否则combined.length远远大于fn.length
const pickType = partical(reversePick, 'type')

// 此时获取不同type的列表
const res1 = getList(function (item) {
    return pickType(item) === 1
})

const res2 = getList(function (item) {
    return pickType(item) === 2
})

const res3 = getList(function (item) {
    return pickType(item) === 3
})


// 继续提取filer函数
// 因为filer传入的参数是3个而我们只需两个，所以我们需要定义一个截取参数的公共方法
function sliceArgs(num, ...args) {
    return args.slice(0, num)
}

const sliceArgs2 = partical(sliceArgs, '2')

const reversePick2 = compose(sliceArgs2, reverseArgs, pick)

const pickType2 = partical(reversePick2, 'type')

// 提取一个全等方法
function isEqual(x, y) {
    return x === y
}

const isType1 = partical(isEqual, 1)
const isType2 = partical(isEqual, 2)
const isType3 = partical(isEqual, 3)

const res4 = getList(function (item) {
    return isType1(pickType(item))
})
const res5 = getList(function (item) {
    return isType2(pickType(item))
})
const res6 = getList(function (item) {
    return isType3(pickType(item))
})

// 上面重复写了三个函数，所以利用compose消除重复函数
const res7 = getList(compose(pickType2, isType1))
const res8 = getList(compose(pickType2, isType2))
const res9 = getList(compose(pickType2, isType3))

// 上面都只判断一个type值，如果想判断or &&呢
function or(...fns) {
    return function (...args) {
        return fns.some(function (fn) {
            return fn(...args)
        })
    }
}

function and(...fns) {
    return function (...args) {
        return fns.every(function (fn) {
            return fn(...args)
        })
    }
}

const res10 = getList(compose(pickType2, or(isType1, isType2)))

// 获取否定类型
function not(fn) {
    return function (...args) {
        return !fn(...args)
    }
}

const res11 = getList(compose(pickType2, not(isType1)))

// 获取指定状态的列表
const isFlagTrue = partical(isEqual, true)
const isFlagFalse = partical(isEqual, false)

// 获取对应状态
const pickFlag = partical(reversePick2, 'flag')

const res12 = getList(compose(pickFlag, isFlagTrue))
const res13 = getList(compose(pickFlag, isFlagFalse))

// 获取指定状态，指定类型的列表
const res14 = getList(and(compose(pickFlag, isFlagTrue), compose(pickType2, isType1)))
const res15 = getList(and(compose(pickFlag, isFlagTrue), compose(pickType2, or(isType1, isType3))))
```

### 场景二:  ajax请求添加loading、alert等各种交互效果

```
async function loading(promise) {
    try {
        if (!isDesignTime) {
            this.$vux.loading.show({
                text: ' ',
                position: 'absolute',
                transition: 'none'
            });
        }
        const res = await promise;
        return res;
    } finally {
        this.$vux.loading.hide();
    }
}
async function alert(promise) {
    try {
        const res = await promise;
        return res;
    } catch (e) {
        if (e.message == 'Network Error') {
            e.message = '网络不稳定，请检查网络连接情况'
        }
        this.$vux.toast.show({
            width: '10em',
            text: e.message,
            type: 'cancel',
            position: 'center'
        })
        throw e;
    }
}
async function echo(promise) {
    const res = await promise;
    this.$vux.toast.show({
        text: _.get(res, 'msg') || '保存成功',
        position: 'center'
    })
    return res;
}

function flow(funcs) {
    const length = funcs ? funcs.length : 0
    let index = length
    while (index--) {
        if (typeof funcs[index] != 'function') {
            throw new TypeError('Expected a function')
        }
    }
    return function (...args) {
        let index = 0
        let result = length ? funcs[index].apply(this, args) : args[0]
        while(++index < length) {
            result = funcs[index].apply(this, result)
        }
        return result
    }
}

function flowRight(funcs) {
    return flow(funcs.reverse())
}

function compose(...fns) {
    return function (...args) {
        return fns.reverse().reduce((crr, fn, index) => {
            return index === 0 ? fn.apply(this, args) : fn(crr)
        }, args)
    }
}

const id = function (actionName) {
    return function (dispatch, ...o) {
        return dispatch(actionName, ...o)
    }
};
const help = plugins => (actionName, lmdPlugins = []) =>
compose(...lmdPlugins, ...plugins, id(actionName));

export default {
    loadingAndAlert: help([alert, loading]),
    alert: help([alert]),
    loadingAlertEcho: help([echo, alert, loading]),
    loadingAlert: help([alert, loading]),
    getClientId
}

...mapActions('user', {
            getBrokerAuth: 'getBrokerAuth',
            getBrokerInfo: h.loadingAndAlert('getBrokerInfo'),
            brokerAudit: h.loadingAlertEcho('brokerAudit')
        }),

this.getBrokerInfo()
```

### 场景三：根据接口的值，渲染数据
```
var app = (tags) => {
    let url = `http://api.flickr.com/services/feeds/photos_public.gne?tags=${tags}&format=json&jsoncallback=?`;
    $.getJSON(url, (data) => {
        let urls = data.items.map((item) => item.media.m)
        let images = urls.map(url => $('<img  />', {src:url}) );
            $(document.body).html(images);
        })
}
app("cats");

// 第一步抽离解析数据的过程
function responseToImages(data) {
    let urls = data.items.map((item) => item.media.m)
    let images = urls.map(url => $('<img  />', {src:url}) );
    return images
}

var app1 = (tags) => {
    let url = `http://api.flickr.com/services/feeds/photos_public.gne?tags=${tags}&format=json&jsoncallback=?`;
    $.getJSON(url, (data) => {
            const images = responseToImages(data)
            $(document.body).html(images);
        })
}
app1("cats");

// 第二步在抽离解析数据的过程
function responseToUrls(data) {
    return data.items.map((item) => item.media.m)
}

function responseUrlsToImages(urls) {
    return urls.map(url => $('<img  />', {src:url}) );
}

function responseToImages1(data) {
    return responseUrlsToImages(responseToUrls(data))
}

var app2 = (tags) => {
    let url = `http://api.flickr.com/services/feeds/photos_public.gne?tags=${tags}&format=json&jsoncallback=?`;
    $.getJSON(url, (data) => {
            const images = responseToImages1(data)
            $(document.body).html(images);
        })
}
app2("cats");

// 第三步使用高阶函数组合，来简化代码
function compose(...fns) {
    return (data) => {
        return fns.reverse().reduce((crr, fn) => {
            return fn(crr)
        }, data)
    }
}

const responseToImages2 = compose(responseUrlsToImages, responseToUrls)

var app3 = (tags) => {
    let url = `http://api.flickr.com/services/feeds/photos_public.gne?tags=${tags}&format=json&jsoncallback=?`;
    $.getJSON(url, (data) => {
            const images = responseToImages2(data)
            $(document.body).html(images);
        })
}
app3("cats");

//第四部抽离异步方法内的dom操作
var app4 = (tags) => {
    return new Promise((resolve) => {
        let url = `http://api.flickr.com/services/feeds/photos_public.gne?tags=${tags}&format=json&jsoncallback=?`;
    $.getJSON(url, (data) => {
            const images = responseToImages2(data)
            resolve(images)
        })
    })
}
app4("cats").then((images) => {
    $(document.body).html(images);
});

// 第五部，终极函数式，但是不推荐
const getJSON = curry((callback, url) => {
    $.getJSON(url, callback)
})

const setHtml = curry((parent, html) => {
    $(parent).html(html)
})

const createImg = (url) => {
    return $('<img  />', {src: url})
}

const url = (tages) => {
    return 'http://api.flickr.com/services/feeds/photos_public.gne?tags=' +
tages + '&format=json&jsoncallback=?';
}

const urls = (data) => {
    return data.items.map((item) => item.media.m)
}

const resToImage = (urls) => {
    return urls.map(createImg)
}
const renderData = compose(setHtml('body'), resToImage, urls)
const getJSONCallBack = getJSON((data) => renderData(data))
const app5 = compose(getJSONCallBack, url)
app5('cats')
```

### 场景四：对数组内的每个元素进行处理
```
let items = ['a', 'b', 'c'];
let upperCaseItems = () => {
    let arr = [];
    for (let i=0, ii= items.length; i<ii; i++) {
        let item = items[i];
        arr.push(item.toUpperCase());
    }
    items = arr;
}
upperCaseItems()

// 使用map函数进行处理
const upperCaseItems1 = (items) => {
    return items.map((item) => item.toUpperCase())
}
const result = upperCaseItems1(items)
```

### 场景五：从localstorage内取值，并赋值

```
function showStudent(id, elementId) {
    // 这里假如是同步查询
    var student = localStorage.getItem(id)
    if(student !== null) {
        // 读取外部的 elementId
        document.querySelector(`${elementId}`).innerHTML = `${student.id},${student.name},${student.lastname}`
    } else {
        throw new Error('not found')
    }
}
showStudent('9527', 'box')

const findStudent = (id) => {
    const student = localStorage.getItem(id)
    if (!student) {
        throw new Error('not found')
    }
    return student
}
const setStudent = (student) => {`${student.id},${student.name},${student.lastname}`}
const getParent = (elementId) => {document.querySelector(`${elementId}`)}
const setInnerHtml = curry((parent, text) => {
    parent.innerHTML = txt
})

const showStudent2 = compose(setInnerHtml(getParent('#box')), setStudent, findStudent)
showStudent2('9527')
```

总结：自己在用函数式编程的思维写代码的时候，发现函数式开发的关键就是，单一功能函数，组合，柯里化，通过这些来组成高阶函数，完成某项功能。

参考连接：
https://yanhaijing.com/javascript/2018/03/01/functional-programming-practice/
