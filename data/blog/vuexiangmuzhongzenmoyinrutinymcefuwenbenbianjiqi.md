---
  title: vue项目中怎么引入tinymce富文本编辑器
  date: 2018-01-24T12:53:45Z
  lastmod: 2018-02-28T08:43:22Z
  summary: 
  tags: ["前端框架", "vue"]
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

因为项目内需要用到富文本编辑器，于是在找了很多富文本编辑器之后，最终找到tinymce更符合我们项目的富文本编辑器；

1. 安装引入
```
npm install --save tinymce
```

2. 创建基于tinymce的组件（便于复用）
```
<template>
    <div class="tinymce-container editor-container">
        <textarea class='tinymce-textarea' :id="tinymceId" ></textarea>
    </div>
</template>

<script>
    // 引入tinymce及需要的plugins
    import tinymce from 'tinymce/tinymce';
    import 'tinymce/themes/modern/theme';
    import 'tinymce/plugins/advlist';
    import 'tinymce/plugins/autolink';
    import 'tinymce/plugins/lists';
    import 'tinymce/plugins/link';
    import 'tinymce/plugins/image';
    import 'tinymce/plugins/charmap';
    import 'tinymce/plugins/print';
    import 'tinymce/plugins/preview';
    import 'tinymce/plugins/anchor';
    import 'tinymce/plugins/textcolor';
    import 'tinymce/plugins/searchreplace';
    import 'tinymce/plugins/visualblocks';
    import 'tinymce/plugins/code';
    import 'tinymce/plugins/fullscreen';
    import 'tinymce/plugins/insertdatetime';
    import 'tinymce/plugins/media';
    import 'tinymce/plugins/table';
    import 'tinymce/plugins/contextmenu';
    import 'tinymce/plugins/paste';
    import 'tinymce/plugins/help';
    // file-loader的作用是更改资源引入路径的loader，如打包后index.html内的图片引入路径是相对于index.html的相对路径而不是原图片的路径，url-loader是将图片进行编码，减少http请求，将图片生成一个dataURl；注意url-loader有一个参数limit，当图片的大小小于limit的时候使用url-loader进行处理转换成dataURL，当大于limit时使用file-loader进行处理，name表示输出的文件名规则，如果不加path参数，则会以hash文件名输出如（0dcbbaa7013869e351f.png），加上[path]表示输出文件的相对路径与当前文件相对路径相同，加上[name].[ext]则表示输出文件的名字和扩展名与当前相同，context，file-loader处理文件的上下文环境
    // require.context方法的作用就是通过正则匹配来引入相应的文件模块，require.context(directory, useSubdirectories, regExp)有三个参数，第一个directory要检索的目录，第二个useSubdirectories是否检索子目录，第三个regExp匹配文件的正则表达式
    require.context('!file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins', true, /.*/);
    require.context('!file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/langs', true, /.*/);
    export default {
        name: 'tinymce',
        props: {
            tinymceId: {
                type: String,
                default: 'tinymce' + +new Date()
            },
            value: {
                type: String,
                default: ''
            },
            // 文本编辑器工具栏
            toolbar: {
                type: Array,
                default () {
                    return [
                        'newdocument | undo redo | searchreplace print preview code cut copy paste | alignleft aligncenter alignright alignjustify numlist bullist indent outdent subscript superscript removeformat | fullscreen',
                        'h1 p charmap | fontselect fontsizeselect styleselect | forecolor backcolor bold italic underline strikethrough blockquote | image media table tabledelete emoticons anchor link unlink | formats insertdatetime insertfile help'
                    ];
                }
            },
            // 菜单栏
            menubar: {
                type: String,
                default: ''
            },
            height: {
                type: Number,
                default: 400
            },
            // 插件栏，方便我们去调用一个内置的功能，如打印等
            plugins: {
                type: Array,
                default () {
                    return ['advlist autolink lists link image charmap print preview anchor textcolor', 'searchreplace visualblocks code fullscreen', 'insertdatetime media table contextmenu paste code help'];
                }
            }
        },
        data () {
            return {
                hasChange: false,
                hasInit: false
            };
        },
        watch: {
            value (val) {
                if (!this.hasChange && this.hasInit) {
                    this.$nextTick(() => {
                        // 设置编辑器的值
                        window.tinymce.get(this.tinymceId).setContent(val);
                    });
                }
            }
        },
        mounted () {
            const _this = this;
            // tinymce.documentBaseURL = ''
            tinymce.init({
                selector: `#${this.tinymceId}`,
                height: this.height,
                language: 'zh_CN',
                mobile: { // 在移动端显示时的配置
                    theme: 'mobile',
                    plugins: [ 'autosave', 'lists', 'autolink' ],
                    toolbar: [ 'undo', 'bold', 'italic', 'styleselect' ]
                },
                skin: 'lightblue',
                font_formats: '微软雅黑=微软雅黑;宋体=宋体;新宋体=新宋体;黑体=黑体;仿宋=仿宋;楷体=楷体;隶书=隶书;幼圆=幼圆;Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats',
                fontsize_formats: '8px 10px 12px 14px 16px 18px 20px 22px 24px 26px 28px 32px 36px',
                resize: 'true false', // 水平垂直方向上进行拉伸
                preview_styles: 'font-size color',
                body_class: 'panel-body',
                branding: false, // 禁用tinymce插件的商标
                color_picker_callback: function (callbacks, value) { // 允许提供自己的颜色选择器
                    callbacks('#FF00FF');
                },
                object_resizing: false,
                toolbar: this.toolbar,
                menubar: this.menubar,
                plugins: this.plugins, // 加载插件，默认是不加载任何插件
                end_container_on_empty_block: true,
                powerpaste_word_import: 'clean',
                code_dialog_height: 450,
                code_dialog_width: 1000,
                advlist_bullet_styles: 'square',
                advlist_number_styles: 'default',
                block_formats: 'Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;',
                imagetools_cors_hosts: ['wpimg.wallstcn.com', 'wallstreetcn.com'],
                imagetools_toolbar: 'watermark',
                default_link_target: '_blank',
                link_title: false,
                // 实例化完成之后的钩子函数
                init_instance_callback: editor => {
                    if (_this.value) {
                        // 设置默认值
                        editor.setContent(_this.value);
                    }
                    _this.hasInit = true;
                    // 监听事件，动态赋值
                    editor.on('NodeChange Change KeyUp', () => {
                        this.hasChange = true;
                        this.$emit('input', editor.getContent({ format: 'raw' }));
                    });
                },
                // setup允许在编辑器实例化之前进行自定义配置
                setup (editor) {
                    editor.addButton('h1', {
                        title: 'h1', // tooltip text seen on mouseover
                        text: 'h1',
                        type: 'splitbutton',
                        onclick () {
                            editor.execCommand('mceToggleFormat', false, 'h1');
                        },
                        onPostRender () {
                            const btn = this;
                            editor.on('init', () => {
                                editor.formatter.formatChanged('h1', state => {
                                    btn.active(state);
                                });
                            });
                        },
                        menu: [
                            {
                                text: 'h2',
                                onclick () {
                                    editor.execCommand('mceToggleFormat', false, 'h2');
                                }
                            },
                            {
                                text: 'h3',
                                onclick () {
                                    editor.execCommand('mceToggleFormat', false, 'h3');
                                }
                            },
                            {
                                text: 'h4',
                                onclick () {
                                    editor.execCommand('mceToggleFormat', false, 'h4');
                                }
                            },
                            {
                                text: 'h5',
                                onclick () {
                                    editor.execCommand('mceToggleFormat', false, 'h5');
                                }
                            },
                            {
                                text: 'h6',
                                onclick () {
                                    editor.execCommand('mceToggleFormat', false, 'h6');
                                }
                            }
                        ]
                    });
                    editor.addButton('F', {
                        title: 'F', // tooltip text seen on mouseover
                        text: 'F',
                        type: 'listbox',
                        onselect: function (e) {
                            editor.insertContent(this.value());
                        },
                        values: [
                            { text: 'H1', value: 'h1' },
                            { text: 'H2', value: 'h1' },
                            { text: 'H3', value: 'h1' },
                            { text: 'H4', value: 'h1' },
                            { text: 'H5', value: 'h1' },
                            { text: 'H6', value: 'h1' }
                        ],
                        onclick () {
                            editor.execCommand('mceToggleFormat', false, this.value());
                        },
                        onPostRender () {
                            const btn = this;
                            editor.on('init', () => {
                                editor.formatter.formatChanged('F', state => {
                                    btn.active(state);
                                });
                            });
                        }
                    });
                    editor.addButton('h2', {
                        title: '小标题', // tooltip text seen on mouseover
                        text: '小标题',
                        onclick () {
                            editor.execCommand('mceToggleFormat', false, 'h2');
                        },
                        onPostRender () {
                            const btn = this;
                            editor.on('init', () => {
                                editor.formatter.formatChanged('h2', state => {
                                    btn.active(state);
                                });
                            });
                        }
                    });
                    editor.addButton('p', {
                        title: '正文',
                        text: '正文',
                        onclick () {
                            editor.execCommand('mceToggleFormat', false, 'p');
                        },
                        onPostRender () {
                            const btn = this;
                            editor.on('init', () => {
                                editor.formatter.formatChanged('p', state => {
                                    btn.active(state);
                                });
                            });
                        }
                    });
                }
            });
        },
        destroyed () {
            tinymce.get(this.tinymceId).destroy();
        }
    };
</script>

<style lang="less" scoped>
    .tinymce-container {
        position: relative
    }
    .tinymce-textarea {
        visibility: hidden;
        z-index: -1;
    }
</style>
```

3. 其它组件内使用tinymce组件
```
<tinymce v-model="myContent1" tinymce-id="tinymce1" ></tinymce>
import Tinymce from '@/components/tinymce';
```
最终效果图
![image](https://user-images.githubusercontent.com/20950813/36778012-757e33fe-1ca6-11e8-9e33-ee5c1461407a.png)


参考链接：https://github.com/tinymce/tinymce
