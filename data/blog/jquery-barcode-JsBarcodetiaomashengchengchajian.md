---
  title: jquery-barcode/JsBarcode条码生成插件
  date: 2018-03-01T07:59:37Z
  lastmod: 2018-03-01T08:01:34Z
  summary: 
  tags: ["jQuery"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

### jquery-barcode生成的条码插件
![image](https://user-images.githubusercontent.com/20950813/36833000-efcdab72-1d68-11e8-91cf-d6511d376eb6.png)

```
// code种类code11、code39、code93、code128、ean8、ean13、std25、int25、msi、datamatrix
$("#bcTarget").barcode("156130510575933", "code128",{
 barWidth: 2,        //单条条码宽度（即最小条码宽度）
 barHeight: 50,     //单体条码高度
 addQuietZone: false,  //是否添加空白区（内边距）
 moduleSize: 5,
 showHRI: true, //是否显示底部条码描述
 marginHRI: 5, //底部条码的margin-top
 bgColor: "#FFF", //设置条码的背景颜色(包括底部的描述在内)
 color: "#000",//设置条码的字体颜色(包括底部的描述在内)
 fontSize: 10, 
 output: "css",  //渲染方式 css/bmp/svg/canvas
 posX: 10, //没什么用
 posY: 20 //没什么用
});
```


### JsBarcode生成的条码插件
![jsbarcode](https://user-images.githubusercontent.com/20950813/36833023-02d4ee56-1d69-11e8-8299-0b53b054be29.png)

```
$canvas = $("<canvas></canvas>");
$canvas.JsBarcode("PD170622000001", { //注意这个插件只支持img，canvas,svg这三种标签生成条形码
        format: "CODE128", //选择条码生成的类型，这里选code128表示一般商用
        lineColor: "#000", //条形码颜色
        width: 2, // 条码间距
        height: 40, // 条码高度
        text: "PD170622000001",
        fontSize: 14, 
        displayValue: true, //是否显示条码下面的值
        font: "Arail",
        textAlign: "left",
        textPosition: "bottom",
        textMargin: 2,
//      background: #ccc,
        margin: 0,
        fontOptions: "bold",
        valid: function (){ //生成之后的回调
        	console.log(111111);
        }
    });
$canvas.appendTo($("#box"));
```

需要注意的是生成的条码得保证打印的时候不失真，不漏指针，保证扫描枪能够正常扫描，根据在项目中的使用，目前最好的方式是jquery-barcode生成bmp格式的条码是不会出现失真及漏针的情况！

