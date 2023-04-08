---
  title: 微信小程序中调用百度地图相关api
  date: 2019-07-05T14:57:31Z
  lastmod: 2019-11-17T01:55:55Z
  summary: 
  tags: ["原生JS", "微信小程序", "百度地图"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/weixin.jpeg']
  bibliography: references-data.bib
---

```js
class BMapWX {

    /**
     * 百度地图微信小程序API类
     *
     * @constructor
     */
    constructor(param) {
        this.ak = param["ak"];
    }

    /**
     * 使用微信接口进行定位
     *
     * @param {string} type 坐标类型
     * @param {Function} success 成功执行
     * @param {Function} fail 失败执行
     * @param {Function} complete 完成后执行
     */
    getWXLocation(type, success, fail, complete) {
        type = type || 'gcj02',
        success = success || function () {};
        fail = fail || function () {};
        complete = complete || function () {};
        wx.getLocation({
            type: type,
            success: success,
            fail: fail,
            complete:complete
        });
    }

    /**
     * POI周边检索
     *
     * @param {Object} param 检索配置
     * 参数对象结构可以参考
     * http://lbsyun.baidu.com/index.php?title=webapi/guide/webservice-placeapi
     */
    search(param) {
        var that = this;
        param = param || {};
        let searchparam = {
            query: param["query"] || '生活服务$美食&酒店',
            scope: param["scope"] || 1,
            filter: param["filter"] || '',
            coord_type: param["coord_type"] || 2,
            page_size: param["page_size"] || 10,
            page_num: param["page_num"] || 0,
            output: param["output"] || 'json',
            ak: that.ak,
            sn: param["sn"] || '',
            timestamp: param["timestamp"] || '',
            radius: param["radius"] || 2000,
            ret_coordtype: 'gcj02ll'
        };
        let otherparam = {
            iconPath: param["iconPath"],
            iconTapPath: param["iconTapPath"],
            width: param["width"],
            height: param["height"],
            alpha: param["alpha"] || 1,
            success: param["success"] || function () {},
            fail: param["fail"] || function () {}
        };
        let type = 'gcj02';
        let locationsuccess = function (result) {
            searchparam["location"] = result["latitude"] + ',' + result["longitude"];
            wx.request({
                url: 'https://api.map.baidu.com/place/v2/search',
                data: searchparam,
                header: {
                    "content-type": "application/json"
                },
                method: 'GET',
                success(data) {
                    let res = data["data"];
                    if (res["status"] === 0) {
                        let poiArr = res["results"];
                        // outputRes 包含两个对象，
                        // originalData为百度接口返回的原始数据
                        // wxMarkerData为小程序规范的marker格式
                        let outputRes = {};
                        outputRes["originalData"] = res;
                        outputRes["wxMarkerData"] = [];
                        for (let i = 0; i < poiArr.length; i++) {
                            outputRes["wxMarkerData"][i] = {
                                id: i,
                                latitude: poiArr[i]["location"]["lat"],
                                longitude: poiArr[i]["location"]["lng"],
                                title: poiArr[i]["name"],
                                iconPath: otherparam["iconPath"],
                                iconTapPath: otherparam["iconTapPath"],
                                address: poiArr[i]["address"],
                                telephone: poiArr[i]["telephone"],
                                alpha: otherparam["alpha"],
                                width: otherparam["width"],
                                height: otherparam["height"]
                            }
                        }
                        otherparam.success(outputRes);
                    } else {
                        otherparam.fail({
                            errMsg: res["message"],
                            statusCode: res["status"]
                        });
                    }
                },
                fail(data) {
                    otherparam.fail(data);
                }
            });
        }
        let locationfail = function (result) {
            otherparam.fail(result);
        };
        let locationcomplete = function (result) {
        };
        if (!param["location"]) {
            that.getWXLocation(type, locationsuccess, locationfail, locationcomplete);
        } else {
            let longitude = param.location.split(',')[1];
            let latitude = param.location.split(',')[0];
            let errMsg = 'input location';
            let res = {
                errMsg: errMsg,
                latitude: latitude,
                longitude: longitude
            };
            locationsuccess(res);
        }
    }

    /**
     * sug模糊检索
     *
     * @param {Object} param 检索配置
     * 参数对象结构可以参考
     * http://lbsyun.baidu.com/index.php?title=webapi/place-suggestion-api
     */
    suggestion(param) {
        var that = this;
        param = param || {};
        let suggestionparam = {
            query: param["query"] || '',
            region: param["region"] || '全国',
            city_limit: param["city_limit"] || false,
            output: param["output"] || 'json',
            ak: that.ak,
            sn: param["sn"] || '',
            timestamp: param["timestamp"] || '',
            ret_coordtype: 'gcj02ll'
        };
        let otherparam = {
            success: param["success"] || function () {},
            fail: param["fail"] || function () {}
        };
        wx.request({
            url: 'https://api.map.baidu.com/place/v2/suggestion',
            data: suggestionparam,
            header: {
                "content-type": "application/json"
            },
            method: 'GET',
            success(data) {
                let res = data["data"];
                if (res["status"] === 0) {
                    otherparam.success(res);
                } else {
                    otherparam.fail({
                        errMsg: res["message"],
                        statusCode: res["status"]
                    });
                }
            },
            fail(data) {
                otherparam.fail(data);
            }
        });
    }

    /**
     * rgc检索（坐标->地点描述）
     *
     * @param {Object} param 检索配置
     * 参数对象结构可以参考
     * http://lbsyun.baidu.com/index.php?title=webapi/guide/webservice-geocoding
     */
    regeocoding(param) {
        var that = this;
        param = param || {};
        let regeocodingparam = {
            coordtype: param["coordtype"] || 'gcj02ll',
            pois: param["pois"] || 0,
            output: param["output"] || 'json',
            ak: that.ak,
            sn: param["sn"] || '',
            timestamp: param["timestamp"] || '',
            ret_coordtype: 'gcj02ll'
        };
        let otherparam = {
            iconPath: param["iconPath"],
            iconTapPath: param["iconTapPath"],
            width: param["width"],
            height: param["height"],
            alpha: param["alpha"] || 1,
            success: param["success"] || function () {},
            fail: param["fail"] || function () {}
        };
        let type = 'gcj02';
        let locationsuccess = function (result) {
            regeocodingparam["location"] = result["latitude"] + ',' + result["longitude"];
            wx.request({
                url: 'https://api.map.baidu.com/geocoder/v2/',
                data: regeocodingparam,
                header: {
                    "content-type": "application/json"
                },
                method: 'GET',
                success(data) {
                    let res = data["data"];
                    if (res["status"] === 0) {
                        let poiObj = res["result"];
                        // outputRes 包含两个对象，
                        // originalData为百度接口返回的原始数据
                        // wxMarkerData为小程序规范的marker格式
                        let outputRes = {};
                        outputRes["originalData"] = res;
                        outputRes["wxMarkerData"] = [];
                        outputRes["wxMarkerData"][0] = {
                            id: 0,
                            latitude: result["latitude"],
                            longitude: result["longitude"],
                            address: poiObj["formatted_address"],
                            iconPath: otherparam["iconPath"],
                            iconTapPath: otherparam["iconTapPath"],
                            desc: poiObj["sematic_description"],
                            business: poiObj["business"],
                            alpha: otherparam["alpha"],
                            width: otherparam["width"],
                            height: otherparam["height"]
                        }
                        otherparam.success(outputRes);
                    } else {
                        otherparam.fail({
                            errMsg: res["message"],
                            statusCode: res["status"]
                        });
                    }
                },
                fail(data) {
                    otherparam.fail(data);
                }
            });
        };
        let locationfail = function (result) {
            otherparam.fail(result);
        }
        let locationcomplete = function (result) {
        };
        if (!param["location"]) {
            that.getWXLocation(type, locationsuccess, locationfail, locationcomplete);
        } else {
            let longitude = param.location.split(',')[1];
            let latitude = param.location.split(',')[0];
            let errMsg = 'input location';
            let res = {
                errMsg: errMsg,
                latitude: latitude,
                longitude: longitude
            };
            locationsuccess(res);
        }
    }

    /**
     * 天气检索
     *
     * @param {Object} param 检索配置
     */
    weather(param) {
        var that = this;
        param = param || {};
        let weatherparam = {
            coord_type: param["coord_type"] || 'gcj02',
            output: param["output"] || 'json',
            ak: that.ak,
            sn: param["sn"] || '',
            timestamp: param["timestamp"] || ''
        };
        let otherparam = {
            success: param["success"] || function () {},
            fail: param["fail"] || function () {}
        };
        let type = 'gcj02';
        let locationsuccess = function (result) {
            weatherparam["location"] = result["longitude"] + ',' + result["latitude"];
            wx.request({
                url: 'https://api.map.baidu.com/telematics/v3/weather',
                data: weatherparam,
                header: {
                    "content-type": "application/json"
                },
                method: 'GET',
                success(data) {
                    let res = data["data"];
                    if (res["error"] === 0 && res["status"] === 'success') {
                        let weatherArr = res["results"];
                        // outputRes 包含两个对象，
                        // originalData为百度接口返回的原始数据
                        // wxMarkerData为小程序规范的marker格式
                        let outputRes = {};
                        outputRes["originalData"] = res;
                        outputRes["currentWeather"] = [];
                        outputRes["currentWeather"][0] = {
                            currentCity: weatherArr[0]["currentCity"],
                            pm25: weatherArr[0]["pm25"],
                            date: weatherArr[0]["weather_data"][0]["date"],
                            temperature: weatherArr[0]["weather_data"][0]["temperature"],
                            weatherDesc: weatherArr[0]["weather_data"][0]["weather"],
                            wind: weatherArr[0]["weather_data"][0]["wind"]
                        };
                        otherparam.success(outputRes);
                    } else {
                        otherparam.fail({
                            errMsg: res["message"],
                            statusCode: res["status"]
                        });
                    }
                },
                fail(data) {
                    otherparam.fail(data);
                }
            });
        }
        let locationfail = function (result) {
            otherparam.fail(result);
        }
        let locationcomplete = function (result) {
        }
        if (!param["location"]) {
            that.getWXLocation(type, locationsuccess, locationfail, locationcomplete);
        } else {
            let longitude = param.location.split(',')[0];
            let latitude = param.location.split(',')[1];
            let errMsg = 'input location';
            let res = {
                errMsg: errMsg,
                latitude: latitude,
                longitude: longitude
            };
            locationsuccess(res);
        }
    }

   /*
   * 静态地图
   *
   * @param {Object} param 检索配置
   **/
    getStaticImage(param) {
        var that = this;
        param = param || {};
        let staticimageparam = {
          ak: that.ak,
          width: param["width"] || 400,
          height: param["height"] || 300,
          center: param["center"] || '北京', // 地址或者经纬度
          scale: param["scale"] || 1, // 是否为高清图 返回图片大小会根据此标志调整。取值范围为1或2。 1表示返回的图片大小为size= width *height; 2表示返回图片为(width*2)*(height *2)，且zoom加1  注：如果zoom为最大级别，则返回图片为（width*2）*（height*2），zoom不变。
          zoom: param["zoom"] || 11, //高清图范围[3, 18]；0低清图范围[3,19]
          copyright: param["copyright"] || 1, // 0表示log+文字描述样式，1表示纯文字描述样式
          markers: param["markers"] || null, // 标注，可通过经纬度或地址/地名描述；多个标注之间用竖线分隔
          markerStyles: param["markerStyles"] || null,
          labels: param["labels"] || null,
          labelStyles: param["labelStyles"] || null,
        };
        return "http://api.map.baidu.com/staticimage/v2?" + "ak=" + staticimageparam["ak"] + "&width=" + staticimageparam["width"] + "&height=" + staticimageparam["height"] + "&center=" + staticimageparam["center"] + "&zoom=" + staticimageparam["zoom"] + "&scale=" + staticimageparam["scale"] + "&copyright=" + staticimageparam["copyright"] + "&markerStyles=" + staticimageparam["markerStyles"] + "&markers=" + staticimageparam["markers"];
    }
}

// module.exports.BMapWX = BMapWX;
export default BMapWX
```

```js
staticMapImage() {
            if (!this.BmapWx) {
                this.BmapWx = new BMapWX({
                    ak: bdMapKey.dev_key
                })
            }
            const { longitude = '', latitude = '' } = this.houseDetail
            const { windowWidth = 0 } = this.getSysInfo()
            const url = this.BmapWx.getStaticImage({
                scale: 2,
                width: windowWidth > 512 ? 512 : windowWidth,
                height: 160,
                center: `${longitude}, ${latitude}`,
                zoom: '12',
                markers: `${longitude}, ${latitude}`,
                markerStyles: '-1,http://api.map.baidu.com/images/marker_red.png'
            })
            return url
        },
```

```js
searchMinInMap(index = 0) {
            this.actNav = +index
            if (!this.mapCenter.lng) return
            const dpr = getPixeRatio()
            const localPos = {
                iconPath: 'https://img.mypaas.com.cn/prod/39ec6ea2-260b-1072-1220-0373926f804e.png',
                id: 9999999,
                width: 15 * dpr,
                height: 15 * dpr,
                longitude: this.mapCenter.lng,
                latitude: this.mapCenter.lat
            }
            this.BmapWx.search({
                query: this.nav[index],
                width: 15 * dpr,
                height: 15 * dpr,
                location: `${this.mapCenter.lat},${this.mapCenter.lng}`,
                page_size: 10,
                radius: 800,
                fail: err => {
                    console.log('error', err)
                },
                success: data => {
                    const { wxMarkerData } = data
                    const newWxMarkerData = wxMarkerData.map(item => {
                        item.iconPath = this.mapIconArr[index]
                        item.callout = {
                            content: `${item.title}`,
                            color: '#333',
                            fontSize: '13px',
                            borderRadius: '17px',
                            bgColor: '#fff',
                            padding: '8px 12px',
                            textAlign: 'center',
                            display: 'BYCLICK'
                        }
                        return item
                    })
                    newWxMarkerData.unshift(localPos)
                    this.newWxMarkerData = newWxMarkerData
                }
            })
        },
```
