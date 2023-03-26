---
  title: Promise/Generator/Async相关的异步操作
  date: 2018-06-04T01:58:01Z
  lastmod: 2018-06-04T15:23:03Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### Promise

Promise异步编程的一种解决方案，被纳入ES6的标准，两个特点，Promise对象的状态不受外界的影响，即只有异步操作的结果，可以决定当前是哪一种状态，任何其他操作都无法改变这个状态；一旦状态改变，就不会再变，任何时候都可以得到这个结果；

```

var timeout = function (time = 2000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('222');
        }, time)
    })
}

timeout().then((res) => {
    console.log(res);
})

// p1是一个 Promise，3 秒之后变为rejected。p2的状态在 1 秒之后改变，resolve方法返回的是p1。
// 由于p2返回的是另一个 Promise，导致p2自己的状态无效了，由p1的状态决定p2的状态。所以，后面的
// then语句都变成针对后者（p1）。又过了 2 秒，p1变为rejected，导致触发catch方法指定的回调函数。

const p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject(new Error('fail'))
    }, 3000)
});

const p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(p1);
    }, 1000)
})

p2.then((res) => {
    console.log('res', res);
}).catch((error) => {
    console.log('error', error);
});

// then方法返回的是一个新的Promise实例（注意，不是原来那个Promise实例）。因此可以采用链式写
// 法，即then方法后面再调用另一个then方法

//采用链式的then，可以指定一组按照次序调用的回调函数。这时，前一个回调函数，有可能返回的还是
// 一个Promise对象（即有异步操作），这时后一个回调函数，就会等待该Promise对象的状态发生变化，才
// 会被调用。

const p3 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p3');
    }, 2000)
})

const p4 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p4');
    }, 4100)
})

p3.then((res) => {
    console.log('res p3', res);
    // 注意这里可以return 任何值，可以是之前固定了状态的promise3,也可以是一个新的promise,也可以是
    // 一个常量，都会在后一个then中的回调函数中拿到，但是需要注意的是，如果返回的是一个新的
    // promise，则需要等待promise内的resolve or reject执行玩之后才能够执行then内的回调
    return p4; 
}).then((res) => {
    console.log('res p3 then2', res); // undefined,因为前一个then没有return值
})


// 如果 Promise 状态已经变成resolved，再抛出错误是无效的。同理如果状态变成reject，在resolve就无效
// 了，另外需要注意的是，promise内抛出错误与reject抛出错误是等效的

// Promise 对象的错误具有“冒泡”性质，会一直向后传递，直到被捕获为止。也就是说，错误总是会被下个
// catch语句捕获；跟传统的try/catch代码块不同的是，如果没有使用catch方法指定错误处理的回调函数，
// Promise 对象抛出的错误不会传递到外层代码，即不会有任何反应。
const p5 = new Promise((resolve, reject) => {
    resolve('p5');
    throw new Error('p5 faile');
});

p5.then((res) => {
    console.log('res p5', res);
}).catch((error) => {
    console.log('p5 error', error);
});

//Promise.prototype.finally() es8引入的语法，要考虑兼容性问题

const p6 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p6');
    }, 1000)
})


const p7 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('p7')
    }, 2000)
})

const p8 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p8')
    }, 4000)
})

// Promise.all方法传入的是一个数组promise,如果本身不是promise则会使用promise.resolve()被转化为
// promise对象,promise.all方法的返回值是包含每个promise结果的返回值数组，只有每一个promise都
// resolve才能够成功，如果有一个reject or error则会执行promise.all的catch方法；

// 如果作为参数的 Promise 实例，自己定义了catch方法，那么它一旦被rejected，并不会触发Promise.all()
// 的catch方法

// promise.all的方法常用于同时请求几个异步接口，但是每个异步接口之间又不互相依赖

const p9 = Promise.all([p6, p7, p8])

p9.then((res) => {
    console.log('res p9 all', res);
}).catch((error) => {
    console.log('error p9 all', error);
})


// pormise.race方法的使用与promise.all方=方法是一样的，区别市race方法是只要某个promise的状态先该
// 变了，那么race方法返回的promise的状态也会进行改变并与率先改变的primise状态保持一致

// promise.race方法常用于设置某个请求是否超时

const p10 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p10');
    }, 1000)
})


const p11 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('p11')
    }, 500)
})

const p12 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p12')
    }, 4000)
})

const p13 = Promise.race([p10, p11, p12])

p13.then((res) => {
    console.log('res p12 race', res);
}).catch((error) => {
    console.log('error p12 race', error);
})

const p14 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p14')
    }, 2000)
})

const p15 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('请求超时')
    }, 1500)
})

const p16 = Promise.race([p14, p15])

p16.then((res) => {
    console.log(res);
}).catch((err) => {
    console.log(err);
})

// promise.resolve()方法，将现有对象or原始值转化为promise对象or直接生成一个状态值为resolved的
// promise对象

// Promise.resolve('aaa') === new Promise((resolve) => {resolve('aaa')})

// 需要注意的是根据传入的参数来返回不同的值
// 1.传入的参数是promise对象，则promise.resolve方法不做任何修改原样返回

const p17 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('p17')
    }, 2000)
})

const p18 = Promise.resolve(p17);

p18.then((res) => {
    console.log(res);
})

// 2. 参数是一个thenable对象,Promise.resolve方法会将这个对象转为 Promise 对象，然后就立即执行
// thenable对象的then方法

let thenable = {
    then: function(resolve, reject) {
        resolve(42);
    }
};

let p19 = Promise.resolve(thenable);
    p19.then(function(value) {
        console.log(value);
});

// 3. 参数不是具有then方法的对象，或根本就不是对象,则Promise.resolve方法返回一个新的 Promise 对
//象，状态为resolved。由于对象or字符串不属于异步操作（判断方法是字符串对象不具有 then 方法），返
// 回 Promise 实例的状态从一生成就是resolved，所以回调函数会立即执行。Promise.resolve方法的参
// 数，会同时传给回调函数。

const p20 = Promise.resolve({
    name: 'jack',
    age: 20
})

p20.then((res) => {
    console.log(res);
})

// 4. 不带有任何参数，Promise.resolve方法允许调用时不带参数，直接返回一个resolved状态的 Promise 
// 对象，立即resolve的 Promise 对象，是在本轮“事件循环”（event loop）的结束时，而不是在下一轮“事件
// 循环”的开始时

const p21 = Promise.resolve();

p21.then((res) => {
    console.log(res, 'p21');
})

// promise.reject()方法返回一个新的promise对象，且该实例的状态为rejected,注意，Promise.reject()方法
// 的参数，会原封不动地作为reject的理由，变成后续方法的参数。这一点与Promise.resolve方法不一致

const info = {
    name: 'jack',
    age: 20
}
const p22 = Promise.reject(info);

p22.then((res) => {
    console.log(res);
}).catch((e) => {
    console.log(e === info, e); // true
})

// promise.try()

// 这种写法有一个缺点，就是如果f是同步函数，那么它会在本轮事件循环的末尾执行。
const f1 = () => console.log('now');
const p23 = Promise.resolve().then(f1);
console.log('next');

// 那么有没有一种方法，让同步函数同步执行，异步函数异步执行，并且让它们具有统一的 API 呢？回答是
// 可以的，并且还有两种写法。第一种写法是用async函数来写,async () => f()会吃掉f()抛出的错误。所以，
// 如果想捕获错误，要使用promise.catch方法。另一种写法是使用new promise
const f2 = () => console.log('now2');
(async () => f2())();
console.log('next2');

const f3 = () => console.log('now3');
(
    () => new Promise((resolve) => {
        resolve(f3())
    })
)()
console.log('next3');

// 使用promise.try()来处理函数f不管函数是同步函数还是异步操作，想用 Promise 来处理它。因为这样就可
// 以不管f是否包含异步操作，都用then方法指定下一步流程，用catch方法处理f抛出的错误

// const f4 = () => console.log('now4');
// Promise.try(f4).then((res) => {
//     console.log('try', res);
// }).catch((err) => {
//     console.log('try err', err);
// })
// console.log('next4');
```

### Gennerator

Generator 函数是一个普通函数，但是有两个特征。一是，function关键字与函数名之间有一个星号；二
// 是，函数体内部使用yield表达式，定义不同的内部状态（yield在英语里的意思就是“产出”；主要用来解决
// 以同步的编码方式来实现异步的过程

```

function *hello () {
    yield 'i';
    yield 'love'
    yield 'you'
    return 'ending' 
}

// Generator 函数的调用方法与普通函数一样，也是在函数名后面加上一对圆括号。不同的是，调用
// Generator 函数后，该函数并不执行，返回的也不是函数运行结果，而是一个指向内部状态的指针对象;下
// 一步，必须调用遍历器对象的next方法，使得指针移向下一个状态。也就是说，每次调用next方法，内部
// 指针就从函数头部或上一次停下来的地方开始执行，直到遇到下一个yield表达式（或return语句）为止。
// 换言之，Generator 函数是分段执行的，yield表达式是暂停执行的标记，而next方法可以恢复执行。

// next方法返回一个对象，它的value属性就是当前yield表达式的值hello，done属性的值false or true，表
// 示遍历还没有结束和遍历结束

// 总结一下，调用 Generator 函数，返回一个遍历器对象，代表 Generator 函数的内部指针。以后，每次调
// 用遍历器对象的next方法，就会返回一个有着value和done两个属性的对象。value属性表示当前的内部状
// 态的值，是yield表达式后面那个表达式的值；done属性是一个布尔值，表示是否遍历结束。

const h = hello(); // 返回的是一个指向内部状态的指针对象
console.log(h);
console.log(h.next()); // {value: "i", done: false}
console.log(h.next()); // {value: "love", done: false}
console.log(h.next()); // {value: "you", done: false}
console.log(h.next()); // {value: "ending", done: true}
console.log(h.next()); // {value: undefined, done: true}

const arr = [1, [[2, 3], 4], [5, 6]];

function *flat(a) {
    const length = a.length;
    for (let i = 0; i < length; i++) {
        const item = a[i];
        if (typeof item !== 'number') {
            yield *flat(item);
        }else {
            yield item;
        }
    }
}

// for...of循环可以自动遍历 Generator 函数时生成的Iterator对象，且此时不再需要调用next方法。

for (let f of flat(arr)) {
    console.log(f);
}

// generator函数处理异步请求

function request(url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(data = {
                name: 'jack',
                age: 18
            })
        }, 3000)
    })
    
}

function *gen() {
    var result = yield request('http://xxx.com');
    console.log('yield之后');
}

const g = gen();
const result = g.next();
console.log(result);

result.value.then((res) => {
    console.log('res', res);
}).then(() => {
    g.next(); // 需要在第一次调用next方法返回promise之后，在promise成功之后在继续调用next方法，可
// 以继续执行下一个yiled之前的代码
}).catch((err) => {
    console.log('err', err);
})
```

### Async

async 函数是什么？一句话，它就是 Generator 函数的语法糖;ES2017标准引入的；使用的时候需要注意，async函数返回的是一个promise；await后面不管跟什么表达式都会被转化为promise对象

```

function request(url) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(url);
        }, 2000)
    })
}

const gen = function *() {
    const f1 = yield request('http://xxxx.com/api/getCode');
    const f2 = yield request('http://xxxx.com/api/getInfo');
    console.log(f1);
    console.log(f2);
}

const g = gen();
const r1 = g.next()
r1.value.then((res) => {
    console.log('res', res);
    var r2 = g.next(res);
    r2.value.then((res2) => {
        console.log('res2', res2);
        g.next(res2);
    }) 
})

// 改成async的书写方式
async function aGen () {
    const f1 = await request('http://xxxx.com/api/getCode');
    const f2 = await request('http://xxxx.com/api/getInfo');
    console.log('aGen', f1);
    console.log('aGen', f2);
    return {name: 'jack'}
}

aGen().then((data) => {
    console.log(data);
});

// 比较async与gennerator
// 书写上async函数就是将 Generator 函数的星号（*）替换成async，将yield替换成await，仅此而已
// 1. Generator 函数的执行必须靠执行器，所以才有了co模块，而async函数自带执行器。也就是说，async
// 函数的执行，与普通函数一模一样，只要一行aGen(),完全不像 Generator 函数，需要调用next方法，或
// 者用co模块，才能真正执行，得到最后结果。

// 2. 更好的语义,async和await，比起星号和yield，语义更清楚了。async表示函数里有异步操作，await表
// 示紧跟在后面的表达式需要等待结果。

// 3. 更广的适用性,co模块约定，yield命令后面只能是 Thunk 函数或 Promise 对象，而async函数的await命
// 令后面，可以是 Promise 对象和原始类型的值（数值、字符串和布尔值，但这时等同于同步操作）

// 4. 返回值是 Promise,async函数完全可以看作多个异步操作，包装成的一个 Promise 对象，而await命令
// 就是内部then命令的语法糖

// 基本用法，获取有依赖关系的异步操作，因为async函数返回一个 Promise 对象，可以使用then方法添加
// 回调函数。当函数执行的时候，一旦遇到await就会先返回，等到异步操作完成，再接着执行函数体内后面
// 的语句

function getCode() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('84898');
        }, 1000)
    })
}

function getInfo(code) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                code,
                name: 'lose'
            })
        }, 3000)
    })
}

async function getUserInfo () {
    const code = await getCode();
    const result = await getInfo(code);
    console.log('result', result);
    return result;
}

getUserInfo().then((res) => {
    console.log('getUserInfo res', res);
}).catch((err) => {
    console.log('getUserInfo err', err);
})

// async函数返回的 Promise 对象，必须等到内部所有await命令后面的 Promise 对象执行完，才会发生状
// 态改变，除非遇到return语句或者抛出错误。也就是说，只有async函数内部的异步操作执行完，才会执行
// then方法指定的回调函数。

async function f1() {
    return await 123;  // await命令后面是一个 Promise 对象。如果不是，会被转成一个立即resolve的 Promise 对象。
}

f1().then((res) => {
    console.log('res', res);
})

// 只要一个await语句后面的 Promise 变为reject，那么整个async函数都会中断执行。
async function f2() {
    await Promise.reject('error f2');
    console.log('是否执行'); // 不执行了
    await Promise.resolve('succ f2');
}

f2().then((res) => {
    console.log('res f2', res);
}).catch((err) => {
    console.log('res error', err);
})

// 注意await后面的异步操作，是否有依赖关系，如果有则依次执行，没有则并发执行；
// 1. 有依赖关系，需要依次执行，比较耗时
function getVarilCode () {
    return new Promise((resolve) => {
        console.log('先获取手机验证码');
        setTimeout(() => {
            resolve('4678');
        }, 500)
    })
}

function getList () {
    return new Promise((resolve) => {
        console.log('获取用户信息列表');
        setTimeout(() => {
            resolve([
                {
                    book: 'js',
                    id: 1
                },
                {
                    book: 'php',
                    id: 2
                }
            ]);
        }, 1000)
    })
}


async function login(code) {
    const list = await getList(); // 注意这个await只能放在promise外面，不能放里面，因为awite只能放
// async关键字的函数内
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                name: 'kils',
                age: 20,
                sex: '男',
                list,
            });
        }, 2000)
    })
}

async function getAutoUserInfo () {
    const newDate = +new Date();
    const code = await getVarilCode(); // await表达式返回的是对应prmise对象，resolve or reject的值，因
// 为await表达式会把后面不是promise的对象转化为promise对象， 所以async函数返回的是一个promise对
// 象，而await表达式返回的是一个具体的值
    const result = await login(code);
    const test = await '123';
    const oldDate = +new Date();
    console.log('result', result, oldDate - newDate, test);
    return result;
}

getAutoUserInfo().then((res) => {
    console.log('getUserInfo res', res);
}).catch((err) => {
    console.log('getUserInfo err', err);
})

// 无依赖关系，可以并行执行，然后等待每个并行执行异步操作的结果

function f3() {
    return new Promise((resolve) => {
        console.log('并行执行 f3');
        setTimeout(() => {
            resolve('f3');
        }, 2000)
    })
}

function f4() {
    return new Promise((resolve) => {
        console.log('并行执行 f4');
        setTimeout(() => {
            resolve('f4');
        }, 2000)
    })
}

async function all() {
    const newDate = +new Date();
    const r1 = f3();
    const r2 = f4();
    const result1 = await r1;
    const result2 = await r2;
    console.log('all', +new Date() - newDate, result1, result2);
}

all();

// async函数实现的原因
function spawn(genF) {
    return new Promise((resolve, reject) => {
        // 获取generator函数
        const gen = genF();
        function step(nextF) {
            let next;
            try{
                next = nextF();
            }catch(e){
                return reject(e);
            }
            // 如果结束，则返回最后一次next.value
            if(next.done) {
                return resolve(next.value);
            }
            // 包装一下next.value，便于promise方式调用
            Promise.resolve(next.value).then((val) => {
                // 如果done不是true，则继续调用next方法
                step(() => {
                    return gen.next(val);
                });
            }, (e) => {
                // 如果报错则，reject错误
                step(() => {
                    return gen.throw(e);
                });
            })
        }
        // 执行第一次next方法
        step(() => {
            return gen.next(undefined);
        });
    })
}

function f5() {
    return new Promise((resolve) => {
        console.log('并行执行 f5');
        setTimeout(() => {
            resolve('f5');
        }, 2000)
    })
}

function f6() {
    return new Promise((resolve) => {
        console.log('并行执行 f6');
        setTimeout(() => {
            resolve('f6');
        }, 2000)
    })
}

function asyncCopy(args) {
    // 返回spawn函数调用的结果
    return spawn(function *() {
        const newDate = +new Date();
        const r1 = f5();
        const r2 = f6();
        const result1 = yield r1;
        const result2 = yield r2;
        console.log('asyncCopy all', +new Date() - newDate, result1, result2);
    })
}

asyncCopy();
```

### 常用的异步处理方式

按顺序调用异步操作，分别用Promise/Generator/Async来实现

```
const animations = [toTop, toRight, toBottom];

function toTop(ele) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('toTop');
        }, 1000)
    })
}

function toRight(ele) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('toRight');
        }, 2000)
    })
}

function toBottom(ele) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('toBottom');
        }, 2000)
    })
}

function animationsPromise (ele, animations) {
    let ret = null;

    let p = Promise.resolve();

    for(let anim of animations) {
        // 利用then函数必须要等道promise的状态发生改变之后才会继续后面的then操作
        p = p.then((val) => {
            console.log('val', val);
            ret = val;
            return anim(ele);
        })
    }
    console.log('p', p);
    return p.catch((e) => {}).then((res) => {
        console.log('last res', res);
        return res ? res : ret;
    })
}

// animationsPromise(null, animations).then((res) => {
//   console.log('res', res);
// }).catch((err) => {
//     console.log('err', err);
// });

function animationsGenerator(elem, animations) {
    function spawn(genF) {
        return new Promise((resolve, reject) => {
            // 获取generator函数
            const gen = genF();
            function step(nextF) {
                let next;
                try{
                    next = nextF();
                }catch(e){
                    return reject(e);
                }
                // 如果结束，则返回最后一次next.value
                if(next.done) {
                    return resolve(next.value);
                }
                // 包装一下next.value，便于promise方式调用
                Promise.resolve(next.value).then((val) => {
                    // 如果done不是true，则继续调用next方法
                    step(() => {
                        return gen.next(val);
                    });
                }, (e) => {
                    // 如果报错则，reject错误
                    step(() => {
                        return gen.throw(e);
                    });
                })
            }
            // 执行第一次next方法
            step(() => {
                return gen.next(undefined);
            });
        })
    }

    return spawn(function *() {
        let ret = null;
        
        try{
            for (let prop of animations) {
                ret = yield prop(elem)
            } 
        }catch(e) {

        }
        return ret;
    })
}

animationsGenerator(null, animations).then((res) => {
    console.log('animationsGenerator res', res);
}).catch((err) => {
    console.log('animationsGenerator err', err);
});

// 依次执行，并返回最后一次的结果
async function animationsAsync(elem, animations) {
    let ret = null;
    try {
        for(let anim of animations) {
            ret = await anim(elem);
        }
    } catch(e) {
        /* 忽略错误，继续执行 */
        console.log('e', e);
    }
    return ret;
}

// animationsAsync(null, animations).then((res) => {
//     console.log('animationsAsync res', res);
// }).catch((err) => {
//     console.log('animationsAsync err', err);
// });

```

顺序调用与并发调用的区别

```
function getUrl(url, time = 1000) {
return new Promise((resolve, reject) => {
    setTimeout(() => {
    resolve({
        code: 0,
        data: {
        time: +new Date(),
        url,
        list: [1, 2, 5]
        }
    });
    }, time)
})
}

function getCode() {
return getUrl('/api/getCode', 1000);
}

function getInfo() {
return getUrl('/api/getInfo', 2000);
}

// 链式调用处理顺序promise,该方法多个顺序promise调用是，书写不便
function fn() {
function recode(results, value){
    results.push(value);
    return results;
}

// bind方法，fun.bind(thisArg[, arg1[, arg2[, ...]]])，当绑定函数被调用时，这些参数将置于实参之前传递给
// 被绑定的方法。
const pushValue = recode.bind(null, []); // 

// return getCode().then(pushValue).then(getInfo).then(pushValue);
// const arr = [];
// return getCode().then((res) => {
//   arr.push(res);
// }).then(() => {
//   return getInfo();
// }).then((res) => {
//   arr.push(res);
//   return arr;
// })

const arr = [];
return getCode().then((res) => {
    arr.push(res);
}).then(getInfo).then((res) => {
    arr.push(res);
    return arr;
})
} 

// fn().then((res) => {
//   console.log('fn res', res);
// }).catch((err) => {
//   console.log('fn err', err); 
// })

// for循环，调用顺序promise

function fn1() {
function recode(results, value){
    results.push(value);
    return results;
}

const pushValue = recode.bind(null, []);

const task = [getCode, getInfo];

let p = Promise.resolve();

// 通过不断对promise进行处理，不断的覆盖 p 变量的值，以达到对p对象的累积处理效果。一定要先声明
// 一个p变量
for(let prop of task) {
    p = p.then(prop).then(pushValue);
}

return p;
}

// fn1().then((res) => {
//   console.log('fn1 res', res);
// }).catch((err) => {
//   console.log('fn1 err', err); 
// })

// 利用reduce方法来进行处理

function fn2() {
    function recode(results, value){
        results.push(value);
        return results;
    }

    const pushValue = recode.bind(null, []);

    const task = [getCode, getInfo];
    return task.reduce(function (promise, task) {
        return promise.then(task).then(pushValue);
    }, Promise.resolve());
}

// fn2().then((res) => {
// console.log('fn1 res', res);
// }).catch((err) => {
// console.log('fn1 err', err); 
// })

// 使用async来处理,顺序处理
async function fn3() {
    const tasks = [getCode, getInfo];
    let res;
    for (let task of tasks) {
        res = await task();
        console.log(res);
    }
    return res;
}

// fn3().then((res) => {
//     console.log('fn3 res', res);
// }).catch((err) => {
//     console.log('fn3 err', err);
// })

// 使用async来处理,并发处理,并发与顺序的区别是，并发是await promise的结果，顺序是await整个promise过程
async function fn4() {
    const newDate = +new Date();
    const tasksPromise = [getCode(), getInfo()];
    let res;
    for (let task of tasksPromise) {
        res = await task;
        console.log(res);
    }
    console.log(+new Date - newDate);
    return res;
}

fn4().then((res) => {
    console.log('fn4 res', res);
}).catch((err) => {
    console.log('fn4 err', err);
})
```
