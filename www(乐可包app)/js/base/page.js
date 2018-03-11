define('base/page', [
    'base/message',
    'base/cache',
    'base/mobile',
    'base/dialog',
    'base/cacheUpdate',
    'base/util',
    'base/data',
    'lib/session'
], function(Message, Cache, Mobile, Dialog, Update, Util, Data, session) {

    var localPage = null, // 当前打开的页面
        prevPage = null, // 前一页面
        cachePage = []; // 缓存打开过的页面

    var judge_return = 0; // 判断返回（只在微信使用），0 无，1 正常点击和页面左上角点击，2 苹果微信内点击左上角返回按钮
    var isWeixin = Util.isWeixin(); // 是否是微信内
    var isAlipay = Util.isAlipay(); // 是否在支付宝内
    var judge_url = location.href; // 当前页面url
    var newChoice = $.session.get('newChoice');
    var Page = function(name) {
        this.name = name;
        this.page = localPage;
    };

    Page.open = function(name, type, backForm, is_judge) {
        //alert(name);
        //alert(is_judge)
        if (is_judge == undefined) {
            judge_return = 1;
        } else {
            judge_return = 3;
        }
        judge_url = location.href;

        // 如果是在微信里面需要在url上加上版本号，以便更新
        if (isWeixin && name.indexOf('&t=') == -1) {
            name = name + '&t=' + Cache.get('versionNumber');
        }

        // 检测网络
        if (Mobile.checkConnection()) {
            $.dialog = Dialog({
                type: 1,
                close: false,
                btn: ['确定'],
                content: '暂无网络，请连接网络',
                closeFn: function() {
                    //退出app（只支持安卓http://www.mamicode.com/info-detail-861464.html）
                    navigator.app.exitApp();
                }
            });

            return;
        }
        //alert(name);
        var newName = name;
        //alert(name);
        // 分解name为页面对应模板名称
        if (name.indexOf('=') != -1) {
            name = (name.split('&'))[0];
        }
        //alert(name);
        if (name.indexOf(',') != -1) {
            name = name.split(',')[0];
        }
        // 微信二次分享之后可能会在跳转页面后面加一个等号，不知道怎么出来的这个等号，所以去掉
        if (name.indexOf('=') != -1) {
            name = (name.split('='))[0];
        }

        // 判断如果是openid.html不做操作
        if (location.href.indexOf('openid.html') != -1) {
            return;
        }


        // 判断name的页面是否存在
        var ndTemplate = $('#' + name + '-template');
        // 页面不存在跳转到首页
        if (!ndTemplate.length) {
            console.error(name + '-template is not found');
            ///下面写着home的地方，原来写着index（引导页）
            name = 'homeCard';
            newName = 'homeCard';
        }
        //alert(name);
        // 当前打开的页面和要打开的页面相同
        if ($.app.localPage == name) {
            // console.log('当前页面'+$.app.localPage, '要去的页面'+name);
            return;
        }

        // 加载相应的js模块
        require(['page/' + name], function(PageClass) {

            // 去掉上一个页面的指定事件或js
            if (localPage) {
                prevPage = localPage.name;
                localPage.unload();
            }

            // 实例化当前页面
            localPage = new PageClass();

            // console.log(localPage);
            //alert('dddddd');
            // 改变url, 设置url缓存
            localPage.pushHistory(newName);
            //alert('tt');
            Cache.set('history', newName);
            //alert('ddd');
            // 初始化
            localPage.initialize(backForm);
            //alert(localPage.back);
            // 更新软件版本
            if (!type) {
                if ($.app.isClient) {
                    Mobile.getSoftVersion(function(result) {
                        Update.updateUserSoft(result, 2);
                    });
                } else {
                    Update.updateUserSoft(0, 2);
                }
            }

            // 刷新重载页面，判断当前日期是否是更新日期，不是的话就进行刷新重载页面
            //setTimeout(function () {
            // 获取缓存中存储的更新日期
            /*var time = Cache.get('updateTime');
            var currentTime = Util.getCurrentDate();
            var time1 = new Date(time);
            var time2 = new Date(currentTime);
            if (time1.getTime() != time2.getTime()) {
                // 请求接口，获取到文件版本号，如果php返回的和存储在html的不一致，就重载并记录更新时间否则只记录更新时间
                Data.setAjax('userIndex', {
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: ''}, function (respnoseText) {
                    var time = Util.getCurrentDate();
                    if (respnoseText.code == 20) {
                        if (Cache.get('versionNumber') == undefined || Cache.get('versionNumber') != respnoseText.data) {
                            window.location.reload();
                            Cache.set('updateTime', time);
                            Cache.set('versionNumber', respnoseText.data);
                        } else {
                            Cache.set('updateTime', time);
                        }
                    } else {
                        Cache.set('updateTime', time);
                    }
                }, 2);
            }*/
            // 上面是一天一更新，下面这个是一小时一更新
            // 获取缓存中的时间戳
            var time = Cache.get('updateTime');
            if (time == undefined || time == '') {
                time = 0;
            }
            // 获取当前时间戳
            var currentTime = Util.dateTotTime(Util.getLocalTime(new Date()));
            // 对比的时间戳 = 缓存时间戳 + 一小时（3600秒）
            var time1 = time + 3600;
            // 如果当前的时间戳大于对比的时间戳，一小时到了更新
            if (currentTime > time1) {
                // 请求接口，获取到文件版本号，如果php返回的和缓存的不一致，就重载并记录更新时间否则只记录更新时间
                Data.setAjax('userIndex', {
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    // 获取当前时间戳
                    var time2 = Util.dateTotTime(Util.getLocalTime(new Date()));
                    if (respnoseText.code == 20) {
                        if (Cache.get('versionNumber') == undefined || Cache.get('versionNumber') != respnoseText.data) {
                            // 如果是在微信里面需要在url上加上版本号，以便更新
                            if (isWeixin) {
                                // alert('更新了19---'+window.location.href+'&t='+respnoseText.data)
                                if (window.location.href.indexOf('&t=') == -1) {
                                    window.location.replace(window.location.href + '&t=' + respnoseText.data);
                                } else {
                                    window.location.replace(window.location.href.split('&t=')[0] + '&t=' + respnoseText.data);
                                }
                            } else {
                                // alert(8)
                                window.location.reload();
                            }
                            Cache.set('updateTime', time2);
                            Cache.set('versionNumber', respnoseText.data);
                        } else {
                            Cache.set('updateTime', time2);
                        }
                    } else {
                        Cache.set('updateTime', time2);
                    }
                }, 2);
            }
            //}, 5000);
        });
    };

    if (isWeixin || isAlipay) { // 这里是处理苹果手机，在微信里面打开网页，点击左上角微信的返回按钮，进行相应的跳转
        /* window.onstatechange = function(event) {
             var state = History.getState();
             var st_t = Cache.get('judge_return');
             $('title').text('乐卡包-让品牌真正连接顾客');
             //alert(judge_return+'====='+judge_url+'==='+localPage.back);
             // judge_return 判断返回（只在微信使用），0 无，1 正常点击和页面左上角点击，2 苹果微信内点击左上角返回按钮
             //alert(judge_return+'----'+judge_url+'========='+location.href)
             if ((judge_url.split('?')[1].split('&')[0] == 'merchantHome' || judge_url.split('?')[1].split('&')[0] == 'merchantHome=') && judge_return != 3) {
                 $('title').text('乐卡包-让品牌真正连接顾客');
                 //window.location.reload();
                 //Page.open(judge_url.split('?')[1], 2, 'left');
             } else if (judge_return == 2 || st_t == 2) {
                 Cache.set('judge_return', 1);
                 judge_return = 2;
                 Page.open(localPage.back, 2, 'left', 1);
             } else if (judge_return == 3) {
                 judge_return = 2;
                 judge_url = location.href;
             }

             if (judge_return == 1) {
                 judge_return = 2;
             }
         };*/
        var bool = false;
        setTimeout(function() {
            bool = true;
        }, 500);

        window.addEventListener("popstate", function(e) {
            if (bool) {
                // console.log('点击微信返回按钮');
                // alert("我监听到了浏览器的返回按钮事件啦");//根据自己的需求实现自己的功能  
                $('title').text('乐卡包-让品牌真正连接顾客');
                // console.log('当前页面',localPage.name);
                // alert(localPage.name)
                if (localPage.name !== 'merchantHome' && localPage.name !== 'searchBusiness' && localPage.name !== 'homeCard') {
                    Page.back();
                }
            }
        }, false);
    }

    // 页面返回
    Page.back = function() {


        // 关闭弹出层
        if ($.fn.dialog && $.dialog && $.dialog.id) {

            if ($.dialog.config.close == true) {

                if ($.dialog.config.layerFn) {
                    $.dialog.config.layerFn();
                }

                if ($.dialog.config.type != 4) {
                    $.dialog.close($.dialog.id);
                }

            }

            return;
        }

        //alert(localPage.back);
        //localPage当前打开的页面，默认为null
        if (localPage && localPage.back) {
            Page.open(localPage.back, 2, 'left');
        } else {

            // 对于打开的新连接有效   对历史的倒退
            History.back();

            // url改变监听（hisroty.js方法）
            window.onstatechange = function(event) {
                var state = History.getState();
                //alert(state+'---'+state.data.url);
                if ((state && state.data.url) && (localPage !== null && localPage.back == '')) {
                    Page.open(state.data.url, 2, 'left');
                }
            }
        }
    };

    Page.prototype = {

        // 初始化
        initialize: function(backForm) {
            //alert('ttttt');
            $.app.localPage = this.name;
            var that = this;
            // cachePage中没有值说明页面没有打开过，则获取HTML所有内容进行显示在页面，否则就打开缓存的页面
            if (!cachePage[this.name] ||
                (cachePage[this.name] && this.name == 'articlelist' && Cache.get('is_refresh_articlelist')) ||
                (cachePage[this.name] && this.name == 'orderlist' && Cache.get('is_refresh_orderlist'))
            ) {

                // 删除已有的页面和相应页面缓存
                if ($('#' + this.name + '-frame').length > 0) {
                    // console.log(this.name + '删除之');
                    $('#' + this.name + '-frame').remove();
                    delete cachePage[this.name];
                }
                //alert('dddd');
                // 获取header  clone() 方法生成被选元素的副本，包含子节点、文本和属性。相当于克隆复制
                //this.ndHeader = $.app.ndHeader.clone();

                // 获取bottom
                //this.ndBottom = $.app.ndBottom.clone();

                // 获取指定模板（HTML）内容
                var ndTemplate = $('#' + this.name + '-template');
                this.ndTemplate = $('<div/>').html(ndTemplate.html());
                this.content = this.ndTemplate.find('.frame');

                // 获取header的填充部分
                //this.getContainer();
                //alert('nnn');
                // 获取模板各个内容
                this.parseMarkup();
                // 填充页面中的内容
                this.fillMarkup(backForm);
            } else {
                //alert('bb');
                this.openCachePage(backForm);
            }



            // 所以rel的点击事件，主要是因为苹果客户端不知道怎么回事在core.js那个绑定事件里面不起作用，所以写这个点击事件
            $('#foot [name="footClick"]').unbind('click').bind('click', function() {
                //alert($(this).attr('id'));
            });


            // openid构造方法
            Util.openid_structure();

        },

        // 获取header的填充部分
        /*getContainer: function () {
            //this.ndTitleContainer = this.ndHeader.find('.page-title');
            //this.ndExtraContainer = this.ndHeader.find('.page-extra');
        },*/

        // 获取模板各个内容
        parseMarkup: function() {
            //this.title = this.ndTemplate.find('.pg-title');
            //this.extra = this.ndTemplate.find('.extra');

            this.title = this.ndTemplate.find('.logo');

            this.content = this.ndTemplate.find('.frame');
        },

        // 填充页面中的内容
        fillMarkup: function(backForm) {
            //alert('rrr');
            var that = this;

            // 填充标题
            //if (this.title.length) {
            //this.ndTitleContainer.html(this.title.html());
            //$('title').text('乐卡包-' + this.title.html());
            $('title').text('乐卡包-让品牌真正连接顾客');
            /*} else {
                $('title').text('乐卡包');
            }*/

            // 填充额外的header
            /*if (this.extra.length) {
                this.ndExtraContainer.html(this.extra.html());
            } else {
                this.ndExtraContainer.html('');
            }*/

            var position_t = prevPage == undefined || prevPage == null ? 'center' : 'right';

            // 填充页面内容
            if (this.content) {

                this.slide_in(
                    this.content,
                    backForm ? backForm : position_t,
                    '.frame',
                    prevPage,
                    this.name,
                    function() {

                        // 当前页面左上角返回
                        $('div[class="back-icon-wrap"]', '#' + that.name + '-frame').click(function() {
                            //alert(that.name);
                            Page.back();
                        });

                        // 绑定页面事件
                        that.bindPageEvents();
                    }
                );
            }
        },

        // 打开已缓存的页面
        openCachePage: function(backForm) {
            var that = this;
            this.slide_in(
                $(cachePage[this.name]),
                backForm ? backForm : window.Router.get_position(prevPage, this.name),
                '.frame',
                prevPage,
                this.name,
                function() {

                    // 填充标题
                    var title = $(cachePage[that.name]).find('.logo').text();
                    if (title) {
                        $('title').text('乐卡包-' + title);
                    } else {
                        $('title').text('乐卡包');
                    }


                    // 页面局部更新
                    if (typeof that.bindPageRefreshEvents == 'function') {
                        that.bindPageRefreshEvents();
                    }
                }
            );
        },

        // 绑定页面class
        bindPageClass: function(frame) {
            // 去掉上个页面的scope selector
            var classNames = frame.attr('class');
            classNames = classNames ? classNames.split(' ') : [];
            for (var i = 0; i < classNames.length; i++) {
                if (!classNames[i] || classNames[i].indexOf('pg-') === 0) {
                    classNames.splice(i, 1);
                }
            };

            // 加上当前页面的scope selector
            classNames.push('pg-' + this.name.toLowerCase());
            frame.attr({
                'id': this.name + '-frame',
                'class': classNames.join(' ')
            });
        },

        // 绑定页面事件
        bindPageEvents: function() {
            console.warn('bindPageEvents should be implemented in child class');
        },

        // 添加页面状态到历史中
        pushHistory: function(url) {
            //pushState是将指定的URL添加到浏览器历史里  实现无刷新跳转页面
            History.pushState({ url: url }, url, '?' + url);
        },

        // 页面滑动
        slide_in: function(new_frame, from, targetStr, prev_page, local_page, cb) {
            //alert('bbb');
            var that = this,
                old_frame, allFrame = $('.frame');

            if (from == 'center') {
                old_frame = $(targetStr);
            } else {
                old_frame = $('#' + prev_page + '-frame');
            }

            // console.log($('#'+prev_page+'-frame')[0]);
            // console.log($('#'+local_page+'-frame')[0]);

            // 没有找到元素
            if (!old_frame.length) {
                return;
            }

            // 多个元素取最后一个
            // console.log('所有frame:' + allFrame.length);
            if (allFrame.length > 1) {
                var i = 0;
                for (; i < allFrame.length; i++) {
                    var frameId = $(allFrame[i]).attr('id').split('-')[0];

                    // 用不到的页面放在最后
                    if (frameId != prev_page) {
                        // console.log(frameId+'页面需调整到最后');
                        $(allFrame[i]).attr('style', 'left: ' + ($.app.body_width * 2) + 'px; display: none;');
                    }
                }
            }

            // 把需要动画的页面显示出来
            if ($('#' + prev_page + '-frame').length > 0) {
                $('#' + prev_page + '-frame').show();
            }
            if ($('#' + local_page + '-frame').length > 0) {
                $('#' + local_page + '-frame').show();
            }

            // 没有初始化的页面初始化样式
            if (!cachePage[local_page]) {
                this.bindPageClass(new_frame);
                new_frame.append('<div class="app_layer hide"></div>');
            }

            if (from == 'center') {
                //alert('rrr');
                // after() 方法在被选元素后插入指定的内容
                old_frame.after(new_frame);
                old_frame.remove();
                if (cb) cb();
                if ($.inArray(that.name, $.app.noCachePage) == -1) {
                    cachePage[that.name] = new_frame[0];
                }
            } else if (from == 'right' || from == 'left') {
                //alert('ttt');
                var start = $.app.body_width * (from == 'right' ? 1 : -1);

                // 设置新页面的left,将新页面添加到旧页面后面
                new_frame.css({ 'left': start });
                old_frame.after(new_frame);

                // 移动页面
                old_frame.imove(from, 'old', -start, 0, 300);

                new_frame.imove(from, 'new', -start, 0, 300, function() {
                    // 回调函数
                    if (cb) cb();

                    // 缓存当前页面
                    if ($.inArray(that.name, $.app.noCachePage) == -1) {
                        cachePage[that.name] = new_frame[0];
                    }
                }, function() {
                    // 前一页面不缓存删除之，避免页面太多造成混乱
                    if ($.inArray(prev_page, $.app.noCachePage) > -1) {
                        // console.log(prev_page+'页面存在,但是不能缓存它，需要删除它');
                        $('#' + prev_page + '-frame').remove();
                    }
                });
                //alert('bbb');
            }
        },

        // 离开页面执行
        unload: function() {}
    };

    return Page;
});