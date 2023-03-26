---
  title: 正则及常用正则表达式
  date: 2018-01-24T12:54:44Z
  lastmod: 2018-03-01T03:19:38Z
  summary: 
  tags: ["原生JS"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### 常用的表单正则验证
```
var myRegExp = {
    // 检查字符串是否为合法QQ号码
    isQQ: function(str) {
        // 1 首位不能是0  ^[1-9]
        // 2 必须是 [5, 11] 位的数字  \d{4, 9}
        var reg = /^[1-9][0-9]{4,9}$/gim;
        if (reg.test(str)) {
            console.log('QQ号码格式输入正确');
            return true;
        } else {
            console.log('请输入正确格式的QQ号码');
            return false;
        }
    },
    // 检查字符串是否为合法手机号码
    isPhone: function(str) {
        var reg = /^(0|86|17951)?(13[0-9]|15[012356789]|18[0-9]|14[57]|17[678])[0-9]{8}$/;
        if (reg.test(str)) {
            console.log('手机号码格式输入正确');
            return true;
        } else {
            console.log('请输入正确格式的手机号码');
            return false;
        }
    },
    // 检查字符串是否为合法Email地址
    isEmail: function(str) {
        var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
        // var reg = /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
        if (reg.test(str)) {
            console.log('Email格式输入正确');
            return true;
        } else {
            console.log('请输入正确格式的Email');
            return false;
        }
    },
    // 检查字符串是否是数字
    isNumber: function(str) {
        var reg = /^\d+$/;
        if (reg.test(str)) {
            console.log(str + '是数字');
            return true;
        } else {
            console.log(str + '不是数字');
            return false;
        }
    },
    // 去掉前后空格
    trim: function(str) {
        var reg = /^\s+|\s+$/g;
        return str.replace(reg, '');
    },
    // 检查字符串是否存在中文
    isChinese: function(str) {
        var reg = /[\u4e00-\u9fa5]/gm;
        if (reg.test(str)) {
            console.log(str + ' 中存在中文');
            return true;
        } else {
            console.log(str + ' 中不存在中文');
            return false;
        }
    },
    // 检查字符串是否为合法邮政编码
    isPostcode: function(str) {
        // 起始数字不能为0，然后是5个数字  [1-9]\d{5}
        var reg = /^[1-9]\d{5}$/g;
        // var reg = /^[1-9]\d{5}(?!\d)$/;
        if (reg.test(str)) {
            console.log(str + ' 是合法的邮编格式');
            return true;
        } else {
            console.log(str + ' 是不合法的邮编格式');
            return false;
        }
    },
    // 检查字符串是否为合法身份证号码
    isIDcard: function(str) {
        var reg = /^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/;
        if (reg.test(str)) {
            console.log(str + ' 是合法的身份证号码');
            return true;
        } else {
            console.log(str + ' 是不合法的身份证号码');
            return false;
        }
    },
    // 检查字符串是否为合法URL
    isURL: function(str) {
        var reg = /^https?:\/\/(([a-zA-Z0-9_-])+(\.)?)*(:\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$/i;
        if (reg.test(str)) {
            console.log(str + ' 是合法的URL');
            return true;
        } else {
            console.log(str + ' 是不合法的URL');
            return false;
        }
    },
    // 检查字符串是否为合法日期格式 yyyy-mm-dd
    isDate: function(str) {
        var reg = /^[1-2][0-9][0-9][0-9]-[0-1]{0,1}[0-9]-[0-3]{0,1}[0-9]$/;
        if (reg.test(str)) {
            console.log(str + ' 是合法的日期格式');
            return true;
        } else {
            console.log(str + ' 是不合法的日期格式，yyyy-mm-dd');
            return false;
        }
    },
    // 检查字符串是否为合法IP地址
    isIP: function(str) {
        // 1.1.1.1  四段  [0 , 255]
        // 第一段不能为0
        // 每个段不能以0开头
        //
        // 本机IP: 58.50.120.18 湖北省荆州市 电信
        var reg = /^([1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}$/gi;
        if (reg.test(str)) {
            console.log(str + ' 是合法的IP地址');
            return true;
        } else {
            console.log(str + ' 是不合法的IP地址');
            return false;
        }
    }
}
```

### 常用的数字正则验证

```
数字：^[0-9]*$
n位的数字：^\d{n}$
至少n位的数字：^\d{n,}$
m-n位的数字：^\d{m,n}$
零和非零开头的数字：^(0|[1-9][0-9]*)$
非零开头的最多带两位小数的数字：^([1-9][0-9]*)+(.[0-9]{1,2})?$
带1-2位小数的正数或负数：^(\-)?\d+(\.\d{1,2})?$
正数、负数、和小数：^(\-|\+)?\d+(\.\d+)?$
有两位小数的正实数：^[0-9]+(.[0-9]{2})?$
有1~3位小数的正实数：^[0-9]+(.[0-9]{1,3})?$
非零的正整数：^[1-9]\d*$ 或 ^([1-9][0-9]*){1,3}$ 或 ^\+?[1-9][0-9]*$
非零的负整数：^\-[1-9][]0-9"*$ 或 ^-[1-9]\d*$
非负整数：^\d+$ 或 ^[1-9]\d*|0$
非正整数：^-[1-9]\d*|0$ 或 ^((-\d+)|(0+))$
非负浮点数：^\d+(\.\d+)?$ 或 ^[1-9]\d*\.\d*|0\.\d*[1-9]\d*|0?\.0+|0$
非正浮点数：^((-\d+(\.\d+)?)|(0+(\.0+)?))$ 或 ^(-([1-9]\d*\.\d*|0\.\d*[1-9]\d*))|0?\.0+|0$
正浮点数：^[1-9]\d*\.\d*|0\.\d*[1-9]\d*$ 或 ^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$
负浮点数：^-([1-9]\d*\.\d*|0\.\d*[1-9]\d*)$ 或 ^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$
浮点数：^(-?\d+)(\.\d+)?$ 或 ^-?([1-9]\d*\.\d*|0\.\d*[1-9]\d*|0?\.0+|0)$
```

### 常用的字符串正则验证 

```
汉字：^[\u4e00-\u9fa5]{0,}$
英文和数字：^[A-Za-z0-9]+$ 或 ^[A-Za-z0-9]{4,40}$
长度为3-20的所有字符：^.{3,20}$
由26个英文字母组成的字符串：^[A-Za-z]+$
由26个大写英文字母组成的字符串：^[A-Z]+$
由26个小写英文字母组成的字符串：^[a-z]+$
由数字和26个英文字母组成的字符串：^[A-Za-z0-9]+$
由数字、26个英文字母或者下划线组成的字符串：^\w+$ 或 ^\w{3,20}$
中文、英文、数字包括下划线：^[\u4E00-\u9FA5A-Za-z0-9_]+$
可以输入含有^%&',;=?$\"等字符：[^%&',;=?$\x22]+
禁止输入含有~的字符：[^~\x22]+
```
