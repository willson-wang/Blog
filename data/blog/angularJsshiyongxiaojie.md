---
  title: angularJs使用小结
  date: 2018-03-05T06:06:14Z
  lastmod: 2018-07-11T01:51:16Z
  summary: 
  tags: ["前端框架", "angularJs"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

1. angularJs内使用laydate日期插件

```
directives.directive("myLaydate", ['$timeout', function($timeout) {
            return {
                require: "?ngModel",
                restrict: "A",
                scope: {
                    ngModel: "=",
                    maxDate: "@",
                    minDate: "@"
                },
                link: function(scope, ele, attrs, ngModel) {
                    var date = null,
                        config = {};
                    //					console.log(scope.$parent.startTime);
                    var timer = null;
                    $timeout.cancel(timer);
                    timer = $timeout(function() {
                        //初始化参数
                        config = {
                            elem: "#" + attrs.id,
                            format: attrs.format != undefined && attrs.format != "" ? attrs.format : "YYYY-MM-DD hh:mm:ss",
                            max: attrs.hasOwnProperty("maxDate") ? attrs.maxDate : laydate.now(+5),
                            min: attrs.hasOwnProperty("minDate") ? attrs.minDate : laydate.now(-5),
                            istime: true,
                            istoday: false,
                            choose: function(data) {
                                scope.$apply(setViewValue);
                            },
                            clear: function() {
                                ngModel.$setViewValue("");
                            }

                        };
                        //console.log(ngModel);  //这个ngModel是一个控制器，但不是ctrl1，我猜是angular自定义针对这个指令的控制器
                        //初始化日期实例
                        date = laydate(config);

                        //监听日期最大值
                        if (attrs.hasOwnProperty("maxDate")) {
                            attrs.$observe("maxDate", function(val) {
                                config.max = val;
                            });
                        }

                        //监听日期最小值
                        if (attrs.hasOwnProperty("minDate")) {
                            attrs.$observe("minDate", function(val) {
                                config.min = val;
                            });
                        }

                        //模型值同步到视图上
                        ngModel.$render = function() {
                            ele.val(ngModel.$viewValue || '');
                        }

                        //监听元素上的事件
                        ele.on("blur keyup change", function() {
                            scope.$apply(setViewValue);
                        });

                        //更新模型上的视图值
                        function setViewValue() {
                            var val = ele.val();
                            ngModel.$setViewValue(val);
                        }

                        setViewValue();

                    }, 0);

                }
            }
        }]);
```

2. angularJs内使用指令定义分页器

```
directives.directive("independentpage", ['httpService', function(httpService) {
            return {
                restrict: "E",
                templateUrl: "independentPage",
                scope: {
                    // pagedata: "=pageData",
                    // haspage: "=hasPage",
                    pagedata: "=",
                    haspage: "=",
                    config: "@",
                    carrierid: "=",
                    carrierval: "="
                },
                link: function(scope, ele, attrs) {
                    scope.$watch("pagedata", function(newData, oldData) {
                        if (!newData) return;
                        if (newData.offset != 1) return;
                        finish(newData);
                    });
                    //获取总条数
                    var finish = function(data) {
                        //console.log(scope.pagedata);
                        if (!scope.config) return;
                        scope.pagedata = angular.fromJson(data);
                        scope.haspage = angular.fromJson(scope.haspage);
                        scope.config = angular.fromJson(scope.config);

                        scope.total = scope.pagedata.total;
                        //获取当前页
                        scope.offset = parseInt(scope.pagedata.offset);

                        //获取跳转页面的当前页
                        scope.selectOffset = scope.pagedata.offset;

                        //获取当前页面需要展示的条数
                        scope.limit = scope.pagedata.limit;

                        //计算需要分页数量
                        scope.pages = Math.ceil(scope.total / scope.limit);

                        //控制分页现实的条数
                        scope.newPages = scope.pages > 5 ? 5 : scope.pages;

                        //设置一个现实页码空数组
                        scope.pageList = [];

                        //添加显示的数据
                        scope.current_math = "" + scope.limit || "20";
                        scope.select_math = [{
                            id: 1,
                            value: '20'
                        }, {
                            id: 2,
                            value: '50'
                        }, {
                            id: 3,
                            value: '100'
                        }, {
                            id: 4,
                            value: '1000'
                        }];

                        //循环添加页码

                        if (!scope.haspage) {
                            //保证无分页时，有显示第一页页码
                            scope.pageList = [1];
                        } else {
                            for (var i = 0; i < scope.newPages; i++) {
                                scope.pageList.push(i + 1);
                            }
                        }

                        //点击分页按钮获取当前分页数值
                        scope.selectPage = function(page) {
                            if (page == "" || isNaN(page)) return;
                            var _page = parseInt(page),
                                newpageList = [];

                            if (_page < 1 || _page > scope.pages) return;
                            if (_page == 1 || _page == 2) {
                                for (var i = 0; i < scope.newPages; i++) {
                                    newpageList.push(i + 1);
                                }
                                scope.pageList = newpageList;
                            };
                            if (_page > 2) {
                                //重新进行分页
                                if (_page == scope.pages - 1) {
                                    for (var i = (_page - 4); i < ((_page + 2) > scope.pages ? scope.pages : (_page + 2)); i++) {
                                        if (i >= 0) {
                                            newpageList.push(i + 1);
                                        }

                                    }
                                } else if (_page == scope.pages) {
                                    for (var i = (_page - 5); i < ((_page + 2) > scope.pages ? scope.pages : (_page + 2)); i++) {
                                        if (i >= 0) {
                                            newpageList.push(i + 1);
                                        }

                                    }
                                } else {
                                    for (var i = (_page - 3); i < ((_page + 2) > scope.pages ? scope.pages : (_page + 2)); i++) {
                                        newpageList.push(i + 1);
                                    }
                                }
                                scope.pageList = newpageList;
                            }
                            scope.offset = _page;
                            scope.isActivePage(_page);
                            scope.selectOffset = _page;

                            scope.config.dataObj.offset = scope.offset;
                            scope.config.dataObj.limit = scope.limit;
                            //console.log(scope.config);
                            httpService.getDatas(scope.config.url, scope.config.dataObj, scope.getCommonListSucc);

                        };


                        //设置当前选中页样式
                        scope.isActivePage = function(page) {
                            return scope.offset == page;
                        };
                        //上一页
                        scope.Previous = function() {
                            scope.selectPage(scope.offset - 1);
                        };
                        //下一页
                        scope.Next = function() {
                            scope.selectPage(scope.offset + 1);
                        };

                        //首页
                        scope.firstPage = function() {
                            if (scope.offset == 1) {
                                return;
                            } else {
                                scope.selectPage(1);
                            }

                        }

                        //尾页
                        scope.lastPage = function() {
                            if (scope.offset == scope.pages) {
                                return;
                            } else {
                                scope.selectPage(scope.pages);
                            }

                        }

                        //分页请求成功回调
                        scope.getCommonListSucc = function(data) {
                            //console.log(data);
                            if (data.api_name == "customer/getCustomerList") {

                                scope.$parent.customerLists = data.list;
                                scope.pagedata = data.paging_data;
                                console.log(scope.carrierid);
                                scope.carrierid = [];
                                scope.carrierval = [];
                                console.log(scope.carrierid);
                                console.log(scope);
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "productinfo/getProductInfoList") {

                                if (scope.$parent.productLists) {
                                    scope.$parent.productLists = data.list;
                                } else {
                                    scope.$parent.childLists = data.list;
                                }
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "locationinfo/getLocationList") {
                                scope.$parent.kuweiLists = data.list;
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "Zonegroup/getZoneGroupList") {
                                scope.$parent.areaLists = data.list;
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "Zoneinfo/getZoneInfoList") {
                                scope.$parent.hsLists = data.list;
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "Locationgroupone/getLocationGroupOneList") {
                                scope.$parent.lOneLists = data.list;
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "Locationgrouptwo/getLocationGroupTwoList") {
                                scope.$parent.lTwoLists = data.list;
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "asntrace/getAsntraceList") {
                                scope.$parent.traceLists = data.list;
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            } else if (data.api_name == "Inventory/getCheckTaskList") {
                                scope.$parent.getInventoryTaskListSucc(data);
                            } else if (data.api_name == "Stocktranslog/getlotList") {
                                scope.$parent.getTraceBatchListSucc(data);
                            } else if (data.api_name == "Shipmentorder/inventoryDetection") {
                                scope.$parent.stockCheckList = data.list;
                                scope.pagedata = data.paging_data;
                                scope.haspage = data.has_paging;
                            }
                        }

                        //改变显示数据条数时请求
                        scope.pageMathChange = function() {
                            //console.log(scope.config);
                            scope.config.dataObj.offset = 1;
                            scope.config.dataObj.limit = scope.current_math;
                            httpService.getDatas(scope.config.url, scope.config.dataObj, scope.getCommonListSucc);
                        }

                    }


                }
            }
        }]);
```

3. angularJs指令内定义全选与单选

```
//全选
        directives.directive("allCheck", function() {
            return {
                restrict: "A",
                scope: {
                    scanList: "="
                },
                link: function(scope, ele, attrs) {
                    //全选
                    $(ele).on("click", function(event) {
                        var e = window.event || event;
                        e && e.stopPropagation ? e.stopPropagation() : window.event.cancelbubble = true;
                        var status = $(this).prop("checked");
                        console.log(status);
                        var tds = $(ele).parents(".com-table").find(".check-item");
                        scope.$parent.initPutawayList.length = 0;
                        tds.each(function(i, check) { //第一个参数为元素结合的下标，第二个参数为元素本身（原生dom对象）
                            $(check).prop("checked", status);
                            if (status) {
                                scope.$parent.initPutawayList.push($(this).attr('id'));
                            } else {
                                scope.$parent.initPutawayList.length = 0;
                            }

                        });

                    });

                    scope.$watch("scanList", function(newValue, oldValue) {
                        console.log(newValue, oldValue);
                        if (typeof(newValue) == "undefined") return;
                        $(ele).length ? $(ele).prop("checked", false) : "";
                        //清空数据操作
                        scope.$parent.initPutawayList.length = 0;
                    });

                }
            }
        });

        //单选
        directives.directive("itemCheck", function() {
            return {
                restrict: "A",
                scope: {},
                link: function(scope, ele, attrs) {
                    //单选
                    $(ele).on("click", function(event) {
                        var e = window.event || event;
                        e && e.stopPropagation ? e.stopPropagation() : window.event.cancelbubble = true;
                        var status = $(this).prop("checked"),
                            tds = $(ele).parents(".com-table").find(".check-item"),
                            ths = $(ele).parents(".com-table").find(".check-all"),
                            isAll = true;
                        console.log(status);
                        if (status) {
                            tds.each(function(i, check) {
                                if (!$(check).prop("checked")) {
                                    isAll = false;
                                    return false;
                                }
                                return true;
                            });
                        }

                        $(ths).prop("checked", status && isAll);

                        scope.$parent.initPutawayList.length = 0;
                        tds.each(function(i, check) {
                            if ($(check).prop("checked")) {
                                scope.$parent.initPutawayList.push($(check).attr('id'));
                            }
                        });
                    });
                }
            }
        });
```

4. angularJs指令内定义右键菜单

```
directives.directive("contentmenu", function() {
            return {
                restrict: "EA",
                scope: {
                    contextMenuParent: "@",
                    contextMenuChild: "@",
                    cancel_order: "&closeMyOrder",
                    close_order: "&cancelMyOrder",
                    shipment_order: "&shipmentMyOrder",
                    distribution_order: "&distributionMyOrder",
                    cancel_allocation_order: "&cancelMyAllocationOrder",
                    create_wave_plan: "&createMyWavePlan",
                    picking_order: "&pickingMyOrder",
                    cancel_picking_order: "&cancelPickingMyOrder",
                    distribution_lin: "&distributionMyOrder",
                    cancel_allocation_lin: "&cancelMyAllocationOrder",
                    picking_lin: "&pickingMyOrder",
                    cancel_picking_lin: "&cancelPickingMyOrder",
                },
                replace: true,
                templateUrl: "contentmenu_tpl",
                link: function(scope, ele, attrs) {
                    scope.isParentShow = true;
                    scope.contextMenuParent = [];
                    scope.contextMenuChild = [];
                    var contentShow = function(e) {
                        var e = e || window.event,
                            x = e.pageX,
                            y = e.pageY;

                        //判断菜单出现在右边的位置
                        var clientx = $(window).width(),
                            eleWidth = $(ele).outerWidth();
                        if (clientx - x < eleWidth) {
                            //17是为了避免水平滚动条的出现
                            ele.css({
                                "left": x - eleWidth - 17 + "px",
                                "top": y + "px"
                            }).addClass("content-active");
                        } else {
                            ele.css({
                                "left": x + "px",
                                "top": y + "px"
                            }).addClass("content-active");
                        }
                        //执行当前行上的点击事件
                        // $(e.target).parent().click();

                        if ($(this).attr("id") === "parent_table") {
                            scope.$apply(function() {
                                scope.isParentShow = true;
                                scope.contextMenuParent = angular.fromJson(scope.contextMenuParent);
                            });

                        } else if ($(this).attr("id") === "child_table") {
                            scope.$apply(function() {
                                scope.isParentShow = false;
                                scope.contextMenuChild = angular.fromJson(scope.contextMenuChild);
                            });

                        }


                        console.log(scope);
                        return false;
                    }
                    $("#parent_table").on("contextmenu", contentShow);
                    $("#child_table").on("contextmenu", contentShow);

                    $(document).on("contextmenu", function() {
                        scope.isParentShow = true;
                        return false;
                    })

                    $(document).on("click", function() {
                        ele.removeClass("content-active");
                    });

                    ele.on("click", function(e) {
                        var e = e || window.event,
                            funcname = e.target.getAttribute("fun");
                        scope.$apply(function() {
                            scope.$parent.initStatus = true;
                            console.log(scope);
                            funcname && scope[funcname]();
                            //scope.$parent.cancelOrder();  //指令内部调用控制器内函数的第一种方式
                            // scope.cancelOrder(); //di二种方式
                            // scope.cancelMyOrder(); //第三种方式
                        });


                    });
                }
            }
        });
```

5. angularJs指令内实现按住不放进行持续进行某个操作

```
directives.directive('sureSingleReview', function() {
            return {
                restrict: "A",
                link: function(scope, ele, attrs) {

                    //用定时器模拟多线程，一个读取sku的线程，一个复核调用打印的线程  
                    var testArr = [],
                        timer1 = null,
                        timer2 = null,
                        flag1 = true,
                        flag2 = true,
                        num = 0;
                    ele.on("keypress", function(event) {
                        console.log(event.target);
                        if (event.keyCode == 13) {
                            $(this).focus();
                            $(this).select();
                            $(this).prop("disabled", true);
                            testArr.push($(this).val());
                            flag1 = false;
                            flag2 = false;
                            num++;
                            if (num == 1) {
                                test1();
                                test2();
                            }

                        }
                    });

                    var test1 = function() {
                        clearTimeout(timer1);
                        timer1 = setTimeout(function test3() {
                            if (flag1) return;
                            $(ele).prop("disabled", false);
                            $(ele).focus();
                            timer1 = setTimeout(test3, 200);
                        }, 200);
                    }

                    var test2 = function() {
                        clearTimeout(timer2);
                        timer2 = setTimeout(function test4() {
                            if (flag2) return;
                            if (testArr.length && $("#" + attrs.ele).val()) {
                                var currentSku = testArr.shift();
                                scope.fnSureReview(currentSku);
                                scope.$digest();
                            } else {
                                flag1 = true;
                                flag2 = true;
                                num = 0;
                                $(ele).prop("disabled", false);
                                // $(ele).focus();
                                $("#active-tip").find(".cfbtn").eq(0).focus();
                                testArr.length = 0;
                            }
                            timer2 = setTimeout(test4, 400);
                        }, 400);
                    }

                }
            }
        })
```

6. angularJs内创建iframe打印

```
directives.directive("createIframe", function() {
            return {
                restrict: "EA",
                controller: ['$scope', function($scope) {
                    this.createIframe = function(url, auto, type) { // 区分打印类型
                            $("#mainIframe0").length && $("#mainIframe0").remove();
                            var iframe = document.createElement("iframe");
                            iframe.name = "mainIframe0";
                            iframe.id = "mainIframe0";
                            iframe.className = "mainIframe";
                            iframe.src = url;

                            if (iframe.attachEvent) {

                                $(".iframe-wrap-show").css("display", "block");
                                if (type) {
                                    $(".iframe-wrap-show").css("opacity", "0");
                                }
                                iframe.attachEvent("onload", function() {
                                    $(".iframe-wrap-show .next").removeClass("print_disabeld");
                                    $(".iframe-wrap-show .prev").removeClass("print_disabeld");
                                    $(".iframe-wrap-show .start_print").removeClass("print_disabeld");
                                    $(".iframe-wrap-show .close_print").removeClass("print_disabeld");
                                    var oIframe = window.frames["mainIframe0"];
                                    oIframe.focus();
                                    if (auto) {
                                        oIframe.printlabel();
                                    }

                                });
                            } else {
                                iframe.onload = function() {
                                    $(".iframe-wrap-show").css("display", "block");
                                    if (type) {
                                        $(".iframe-wrap-show").css("opacity", "0");
                                    }
                                    $(".iframe-wrap-show .next").removeClass("print_disabeld");
                                    $(".iframe-wrap-show .prev").removeClass("print_disabeld");
                                    $(".iframe-wrap-show .start_print").removeClass("print_disabeld");
                                    $(".iframe-wrap-show .close_print").removeClass("print_disabeld");
                                    var oIframe = window.frames["mainIframe0"];
                                    oIframe.focus();
                                    if (auto) {
                                        oIframe.printlabel();
                                    }

                                };
                            }
                            $(".iframe-wrap-show .iframe-content").prepend(iframe);
                        },
                        this.createIframeSingle = function(url, classname) {
                            $("#dataIframe").length && $("#dataIframe").remove();
                            var iframe = document.createElement("iframe");
                            iframe.name = "dataIframe";
                            iframe.id = "dataIframe";
                            iframe.className = "dataIframe";
                            iframe.src = url;

                            if (iframe.attachEvent) {
                                iframe.attachEvent("onload", function() {
                                    var oIframe = window.frames["dataIframe"];
                                    oIframe.focus();

                                });
                            } else {
                                iframe.onload = function() {
                                    var oIframe = window.frames["dataIframe"];
                                    oIframe.focus();

                                };
                            }

                            $("." + classname).prepend(iframe);
                        }
                }],
                controllerAs: "createIframeCtrl"
            }
        });

directives.directive("printFile", ['DialogService', 'TranslateService', function(DialogService, TranslateService) {
            return {
                restrict: "EA",
                require: "^createIframe",
                scope: {
                    orderNo: "=",
                    soNo: "=",
                    secondExportClose: "&"
                },
                link: function(scope, ele, attrs, createIframeCtrl) {
                    //console.log(scope.soNo);

                    ele.on("click", function() {
                        if (attrs.isFirst === "1") {
                            //打印
                            if ($(this).hasClass("btn-bg")) return;
                            if (!scope.$parent.canPrint) return;
                            var str = TranslateService.t_lang('send_order_hint');
                            DialogService.InfoMd(str, function() {
                                $(".delivery-mask").css("display", "block");
                                $(".print-file-wrap").css("display", "block");
                                $(".print-file-btns").attr("num", "1");
                                var url = layout_config.viewUrl + "outstock/deliveryorder/printViewInvoice?order_no=" + scope.orderNo + "&isfirst=1";
                                createIframeCtrl.createIframeSingle(url, "print-file-wrap");
                            });

                        } else if (attrs.isFirst === "2") {
                            //补打印
                            if ($(this).hasClass("btn-bg")) return;
                            if (typeof(scope.soNo) == "undefined" || !scope.soNo) return;
                            $(".delivery-mask").css("display", "block");
                            $(".print-file-wrap").css("display", "block");
                            $(".print-file-btns").attr("num", "2");
                            // SL170419000010
                            var url = layout_config.viewUrl + "outstock/deliveryorder/printViewInvoice?order_no=" + scope.soNo + "&isfirst=2";
                            createIframeCtrl.createIframeSingle(url, "print-file-wrap");
                            scope.$apply(function() {
                                scope.secondExportClose();
                            });
                        }
                    });

                }
            }

        }]);
```

7. angularJs内封装http服务

```
services.service("httpService", ['$http', 'TranslateService', 'BackLogin', function($http, TranslateService, BackLogin) {
            return {
                getDatas: function(url, obj1, succCallBack, errorCallBack) {
                    return $http({
                        method: "GET",
                        url: url,
                        params: obj1 || {}
                    }).success(function(data) {
                        succCallBack && succCallBack(data);
                    }).error(function(data) {
                        errorCallBack && errorCallBack(data);
                    })
                },
                postDatas: function(url, obj1, succCallBack, errorCallBack) {
                    return $http({
                        method: "POST",
                        url: url,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        transformRequest: function(obj) {
                            var str = [];
                            for (var p in obj) {
                                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                            }
                            return str.join("&");
                        },
                        data: obj1 || {}
                    }).success(function(data) {
                        succCallBack && succCallBack(data);
                    }).error(function(data) {
                        errorCallBack && errorCallBack(data);
                    })
                }

            }
        }]);
```

8. angularJs服务中定义loading

```
services.factory('myLoading', ["$rootScope", "BackLogin", function($rootScope, BackLogin) {
            var count = 0;
            return {
                request: function(config) {
                    $rootScope.loading = true;
                    return config;
                },
                response: function(response) {
                    $rootScope.loading = false;
                    return response;
                },
                responseError: function(rejection) {
                    console.log(rejection);
                    if (!rejection.data.status) {
                        count++;
                        $rootScope.loading = false;
                        if (count > 1) return;
                        console.log($("#backLoginEle"));
                        if ($("#backLoginEle").length) return; //只弹出专门的退出登录弹窗
                        BackLogin.locationLogin(rejection.data);
                    }
                    return rejection;
                }
            };

        }]);
```

9. angularJs内定义EventBus

```
services.service("EventBus", function() {
            var eventMap = {};
            return {
                on: function(eventType, handler) {
                    if (!eventMap[eventType]) {
                        eventMap[eventType] = [];
                    }
                    eventMap[eventType].push(handler);
                },
                off: function() {
                    for (var i = 0; i < eventMap[eventType].length; i++) {
                        if (eventMap[eventType][i] === handler) {
                            eventMap[eventType].splice(i, 1);
                            break;
                        }
                    }
                },
                fire: function(event) {
                    var eventType = event.type;
                    if (eventMap && eventMap[eventType]) {
                        for (var i = 0; i < eventMap[eventType].length; i++) {
                            eventMap[eventType][i](event);
                        }
                    }
                }
            }
        });
```

angular的数据绑定采用什么机制，简要的说下实现的原理；
  双向数据绑定   实现原理是通过脏值检测机制  angular内部对每一个变量都会绑定一个$wacth方法，并且把这些方法push到一个$watch数组中，当触发事件or请求数据等时会触发angular进入脏值
  检测，angular内部会调用$digest方法，会去对$wacth的变量进行遍历，当一定时间范围内所有变量oldvalue与newvalue相等时，就会去更新视图停止此次轮循，实现模型与视图的双向数据绑定，另外同一轮脏值检测遍历
  的次数不会超过10次，超过时会抛出异常；

3.angular中控制器与控制器之间进行通信的方式有哪些，举出你常用的方式，并简述下优缺点；
  1.广播方式 向上广播$emit,向下广播$bordcast,接受广播使用$on,注意的时向上广播可以在某一层时停止，而向下广播不能再某层停止，当scope数比较深时，不建议使用广播的方式来进行通信；
  2.服务方式 利用服务来实现在各个控制器中的通信，建议使用这种方式，快速，方便；
  3.继承方式 控制器与控制器之间的作用域scope会形成scope树，父子级间可以通过继承的方式来进行通信；

4.angular应用中常用的路由库有哪些，各自的区别是什么；
  1.angular自带的ngRouter路由模块，主要缺点不支持视图之间的嵌套
  2.angular ui-router 支持多层视图之间的嵌套，提供了一些路由之间跳转的方法等

5.angular自定义指令内scope继承的方式有几种，分别列出来并简述，这几种的区别；
  共3种方式
  1.scope不定义or值为false,表示指令内部的作用域就是当前控制器内的作用域，可以在指令内部直接使用；
  2.scope值为true时，表示继承自当前控制器的作用域，可以在指令内部访问控制器内部的变量，但是在控制器内不能访问指令的变量；
  3.scope值为一个对象时，表示一个独立的作用域与当前控制器所在的作用域无继承关系，与外部控制器进行数据交互有三种绑定策略
         1.@ 单项绑定
         2.= 双向绑定
         3.& 方法绑定

6.ng-if跟ng-show/hide的区别有哪些？ ng-repeat迭代数组的时候，如果数组中有相同值，会有什么问题，如何解决？ ng-click中写的表达式，能使用JS原生对象上的方法，比如Math.max之类的吗？为什么？
  ng-if跟ng-show/hide的区别有哪些  ng-if是通过创建与删除dom的方式来控制元素的显示与隐藏，另外ng-if会创建独立的作用域，ng-show/hide是通过display来进行控制元素的显示与隐藏，且不会创建独立作用域；
   ng-repeat迭代数组的时候，如果数组中有相同值，会抛出异常，这是angular它会根据一个唯一表示符来保证ng-repeat生成的每个元素都市唯一的，解决方法是在后面加一个track by $index
  ng-click中写的表达式不能使用js原生的方法，原因是angular表达式只能识别angular保证的方法，如果需要在表达式中使用js原生方法，需要在控制器or过滤器中进行包装之后才能使用；
  
