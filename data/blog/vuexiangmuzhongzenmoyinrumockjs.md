---
  title: vue项目中怎么引入mockjs
  date: 2018-01-24T12:54:17Z
  lastmod: 2018-02-28T08:26:14Z
  summary: 
  tags: ["前端框架"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

引入mockjs的目的是，提高我们的开发效率，不需要等待后端接口给出之后，才能够进行开发调试；

mockjs两个最大的特点：
     1. 够拦截ajax请求，保证我们能够快速开发，只需要在后端给出接口的时候，把接口替换就ok了；
     2. 足够多的方法产生随机的不同类型的数据；

### 1. 安装
```
npm install --save mockjs
```
### 2. 定义请求接口
```
如loss-order.js
// 这里的fetch是封装的基于axios的ajax请求
import fetch from 'utils/fetch';
import CONFIG from '@/assets/js/config';

export function getLossOrderList (queryData) {
    const data = Object.assign({}, CONFIG.ajaxData, queryData);
    return fetch.getAjax('/loss_order/loss_order_One/lossOrderList', data);
};
```
### 3. 利用mockjs定义返回的接口数据
    1. 第一种方法，利用mockjs的Random方法来构造函数
    2. 第二种方法，利用Mock.mock并加@来构造数据

```
第一种方式
import { paramURL } from '@/utils';
import Mock from 'mockjs';

const Random = Mock.Random;

export default {
    getLossOrderList: (config) => {
        const param = paramURL(config.url);
        let result = {};
        result.key = ['订单号', '销售平台', 'SKU', '产品品牌', '所属仓库', '订单类型', '平台订单号', '物流方式\跟踪号', '出货状态', '完成状态', '金额', '北京付款时间'];
        const value = [];
        const count = 100;
        const start = (Number(param.offset) - 1) * Number(param.limit);
        const end = Number(param.offset) * Number(param.limit);
        // 第一种造数据的方式，引入Random来进行造数据
       for (let i = 0; i < count; i++) {
            value.push({
                orderId: Random.increment(),
                orderNo: 'CO' + Random.now('day', 'yyyyMMdd') + 'LZD',
                salesPlat: Random.first(),
                sku: Random.float(0, 100000000000, 2),
                skuId: Random.increment(),
                productBrand: Random.cword('零一二三四五六七八九十', 3),
                warehouse: Random.cword('光明清溪', 2),
                warehouseId: '172',
                orderType: '普通',
                platOrderNo: Random.integer(0),
                logistics: Random.cword('零一二三四五六七八九十', 5),
                sailStatus: '未出货',
                complateStatus: '备货中',
                price: Random.float(0, 100, 4) + 'USD',
                payTime: Random.now('second')
            })
        }

        // 第二种方式直接使用Mock.mock并加@来构造数据
        for (let i = 0; i < count; i++) {
            value.push(Mock.mock({
                orderId: '@increment',
                orderNo: 'CO' + '@now("day", "yyyyMMdd")' + 'LZD',
                salesPlat: '@first',
                sku: '@float(0, 100000, 2, 4)',
                skuId: '@increment()',
                productBrand: "@cword('零一二三四五六七八九十', 3)",
                warehouse: '@cword("光明清溪", 2)',
                warehouseId: '172',
                orderType: '普通',
                platOrderNo: '@integer(0)',
                logistics: '@cword("零一二三四五六七八九十", 5)',
                sailStatus: '未出货',
                complateStatus: '备货中',
                price: '@float(0, 100, 2, 4)' + 'USD',
                payTime: '@now("second")'
            }))
        }

        result.value = value.slice(start, end);
        result.pagingData = {
            limit: +param.limit,
            offset: +param.offset,
            total: count
        }
        return result;
    }
}
```

### 4. 利用mock定义响应接口
```
import Mock from 'mockjs';
import lossOrderAPI from './loss-order';

Mock.setup({
    // 指定被拦截的 Ajax 请求的响应时间，单位是毫秒
    timeout: '350-600'
});

// 亏损订单接口
Mock.mock(/\/loss_order\/loss_order_One\/lossOrderList/, 'get', lossOrderAPI.getLossOrderList);
export default Mock;
```

参考链接：https://github.com/nuysoft/Mock/wiki
