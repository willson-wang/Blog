---
  title: input元素限制输入中文内容时出现的截断问题
  date: 2019-05-07T12:00:22Z
  lastmod: 2019-11-17T02:00:45Z
  summary: 
  tags: ["原生JS", "input"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

## 背景

input输入框只允许输入中文字母数字，不允许输入其它字符

## 解决方案
### 第一种方案

使用input事件，在安卓是ok的，但是在ios及pc端mac及window下输入中文时，会直接输入字母而不是
想输入的中文，如下图所示

```js
<input type="text" id="name14" placeholder="只能输入汉字字母数字input" />

const regHanDataAz = /[^\da-zA-Z\u4e00-\u9fa5]/
const ele = document.getElementById('name14')
ele.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(regHanDataAz, '')
    }
})
```

![input](https://user-images.githubusercontent.com/20950813/57299407-0b4fce00-7107-11e9-9a5c-55d37b1bf4f4.gif)

### 第二种方案

使用keyup事件，在安卓是ok的，但是在ios及pc端mac及window下输入中文时，会直接输入字母而不是想输入的中文，如下图所示

```js
<input type="text" id="name14" placeholder="只能输入汉字字母数字keyup" />

const regHanDataAz = /[^\da-zA-Z\u4e00-\u9fa5]/
const ele = document.getElementById('name14')
ele.addEventListener('keyup', function(e) {
      e.target.value = e.target.value.replace(regHanDataAz, '')
    }
})
```
![input+keyup](https://user-images.githubusercontent.com/20950813/57299411-0be86480-7107-11e9-86bd-8541f433a3a7.gif)

### 第三种方案

使用input事件，及compositionstart、compositionend事件，在安卓、ios及pc端mac及window下都是ok的，如下图所示

```js
<input type="text" id="name14" placeholder="只能输入汉字字母数字input+compositionstart/end" />

const regHanDataAz = /[^\da-zA-Z\u4e00-\u9fa5]/
var lock = false
const ele = document.getElementById('name14')
ele.addEventListener('input', function(e) {
    if (!lock) {
      fn3(e)
    }
})
// input 事件会截断非直接输入，所以通过compositionstart及compositionend事件来排除非直接输入
// 影响，避免想输入汉字的时候，直接成字母了
ele.addEventListener('compositionstart', function () {
    lock = true;
})
ele.addEventListener('compositionend', function (e) {
    lock = false;
    fn3(e)
})

function fn3(e) {
  e.target.value = e.target.value.replace(regHanDataAz, '')
}
```
![input+compositionend](https://user-images.githubusercontent.com/20950813/57299410-0be86480-7107-11e9-9276-a23c51965e79.gif)

## 项目中实际使用例子

```js
<textarea class="check-reason" name="reason" placeholder="请输入说明内容（100字以内）" ng-model="remark" content="remark" filter-enter  maxlength="100"></textarea>

.directive('filterEnter', ['$compile', ($compile) => {
    return {
        restrict: "EA",
        scope: {
            content: '='
        },
        link(scope, ele, attr) {
            // 仅允许输入汉子字母数字
            const regHanDataAz = /[^\da-zA-Z\u4e00-\u9fa5]/g
            function validInput() {
                var lock = false
                ele[0] && ele[0].addEventListener('input', function(e) {
                    if (!lock) {
                        console.log('ccc');
                        validing(e)
                    }
                })
                // input 事件会截断非直接输入，所以通过compositionstart及compositionend事件来排除非直接输入
                // 影响，避免想输入汉字的时候，直接成字母了
                ele[0] && ele[0].addEventListener('compositionstart', function () {
                    lock = true;
                })
                ele[0] && ele[0].addEventListener('compositionend', function (e) {
                    lock = false;
                    validing(e)
                })

                function validing(e) {
                    e.target.value = e.target.value.replace(regHanDataAz, '')
                    scope.content = e.target.value
                    scope.$digest()
                }
            }
            // 通过notValid属性来开启是否允许输入特殊字符，默认开启
            !attr.notValid && validInput()
            const maxLength = attr.maxlength || 20
            const template = `<span  class="filter-count ${attr.className || ''}">{{(content && content.length) || 0}}/${maxLength}</span>`
            ele.parent().append($compile(template)(scope))
        }
    }
}]);
```

