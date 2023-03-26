---
  title: input布尔属性的赋值问题
  date: 2019-05-21T09:28:48Z
  lastmod: 2019-05-21T10:08:40Z
  summary: 
  tags: ["HTML5"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

###  记录一下布尔属性的赋值问题

```
基于angularjs开发
//通过接口返回的isReadonly属性来设置是否可读，但实际效果不论data.isReadonly是true还是false都是只读

<input type="text" name="username" readonly="data.isReadonly" />
```

#### 当把readonly属性删除的时候，就变成可写了，奇怪，为什么readonly属性设置false会无效呢？

#### 然后试了下checked属性及disabled属性，发现也是一样的效果，即checked="true"、checked=""、checked="false"、checked都是被选中；disabled="true"、disabled=""、disabled="false"、disabled都是被禁用；将checked、disabled的值设置为‘’及false居然不生效

```
<div>
  <input type="number"  />
  <!-- 这三种方式都是只读 -->
  <input type="number" readonly />
  <input type="number" readonly="" />
  <input type="number" readonly="true" />
  <input type="number" readonly="false" />
</div>
<div>
  <input type="radio" name="gender" value="man" checked=""/>man
  <input type="radio" name="gender" value="women" />women
</div>
<div>
  <input type="checkbox" name="sport" value="badminton"  />badminton
  <input type="checkbox" name="sport" value="football" checked disabled />football
  <input type="checkbox" name="sport" value="basketball" checked="" disabled="" />basketball
  <input type="checkbox" name="sport" value="swiming" checked="true" disabled="true" />swiming
  <input type="checkbox" name="sport" value="tennis" checked="false" disabled="false" />tennis
</div>
```

#### 最后查找资料知道这是布尔属性的特性决定的；

#### 布尔属性：元素上存在布尔属性表示真值，缺少属性表示false值,布尔属性不允许使用值“true”和“false”。也就是说布尔属性是否生效跟属性的value值无关；

![image](https://user-images.githubusercontent.com/20950813/58087559-5d0e5300-7bf3-11e9-9ad5-ce8ec2ce9882.png)


#### 所以如果要想最开始的布尔属性生效，我们需要如下写法，即采用框架提供的指令来书写
```
<input type="text" name="username" ng-readonly="data.isReadonly" />
```

#### 那么框架内部对布尔属性是怎么处理的呢？以jquery跟vue为例

#### jquery
```
设置布尔属性：$('input').attr('readonly', true)
取消布尔属性：$('input').attr('readonly', false)

attr: function( elem, name, value ) {
	var ret, hooks,
		nType = elem.nodeType;

	// Fallback to prop when attributes are not supported
	if ( typeof elem.getAttribute === "undefined" ) {
		return jQuery.prop( elem, name, value );
	}

	// 兼容布尔属性
	if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
		hooks = jQuery.attrHooks[ name.toLowerCase() ] ||
			( jQuery.expr.match.bool.test( name ) ? boolHook : undefined );
	}

	if ( value !== undefined ) {
		if ( value === null ) {
			jQuery.removeAttr( elem, name );
			return;
		}

		// 如果是布尔属性，则走hooks内的方法
		if ( hooks && "set" in hooks &&
			( ret = hooks.set( elem, value, name ) ) !== undefined ) {
			return ret;
		}

		elem.setAttribute( name, value + "" );
		return value;
	}

	if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
		return ret;
	}

	ret = jQuery.find.attr( elem, name );

	// Non-existent attributes return null, we normalize to undefined
	return ret == null ? undefined : ret;
}

// Hooks for boolean attributes，可以通过attr('readonly', false)来关闭布尔属性
var boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// 即$('input').attr('readonly', false)去掉只读
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
}
```

#### vue
```
function setAttr (el: Element, key: string, value: any) {
  debugger
  if (el.tagName.indexOf('-') > -1) {
    baseSetAttr(el, key, value)
  } else if (isBooleanAttr(key)) {
    // 判断isBooleanAttr方法是否是布尔属性
    // set attribute for blank value
    // e.g. <option disabled>Select one</option>
    // 通过isFalsyAttrValue方法判断值是否是false与null，如果isFalsyAttrValue返回为true则表示传入的值
   //是false or null，则删除当前布尔属性，否则设置当前的属性值为el.setAttribute(key, value)
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key)
    } else {
      // technically allowfullscreen is a boolean attribute for <iframe>,
      // but Flash expects a value of "true" when used on <embed> tag
      value = key === 'allowfullscreen' && el.tagName === 'EMBED'
        ? 'true'
        : key
      el.setAttribute(key, value)
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true')
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key))
    } else {
      el.setAttributeNS(xlinkNS, key, value)
    }
  } else {
    baseSetAttr(el, key, value)
  }
}

export const isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
)

export const isFalsyAttrValue = (val: any): boolean => {
  return val == null || val === false
}
```

#### 通过vue及jquery的处理方式不难看出其它框架，都是对布尔属性做了特殊处理；

#### 总结：
1. 布尔属性是否生效跟属性的value值无关；只跟是否存在该属性有关；
```
即<input readonly>, 
<input readonly=''>, 
<input readonly="readonly">，
<input readonly=false>，
<input readonly=true>都是一样的效果
```
2. input标签上常用的布尔属性有required、readonly、multiple、autofocus、checked、disabled

参考链接：
https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attribute
