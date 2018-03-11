define('base/core', [
    'base/page',
    'base/cache',
    'base/mobile',
    'base/cacheUpdate',
    'base/click',
    'base/util',
    'base/data'
], function(Page, Cache, Mobile, Update, Click, Util, Data) {

    var PageInit = function() {

        $(function() {
            //移动端触屏滑动事件
            /*touchstart:       //手指放到屏幕上时触发
            touchmove:          //手指在屏幕上滑动式触发
            touchend:           //手指离开屏幕时触发
            touchcancel:        //系统取消touch事件的时候触发，这个好像比较少用*/

            //PC端滑动效果
            /*mousedown         //当按下鼠标按钮时触发
            mousemove           //当鼠标指针在元素内移动时触发
            mouseup             //当松开鼠标按钮时触发*/

            //判断设备是否支持touch事件
            var hasTouch = 'ontouchstart' in window,
                START_EV = hasTouch ? 'touchstart' : 'mousedown',
                MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
                END_EV = hasTouch ? 'touchend' : 'mouseup',
                CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
                // 判断是不是android设备
                isAndroid = (/android/gi).test(navigator.userAgent),
                // 判断是不是苹果设备
                isIDevice = (/iphone|ipad|ipod|ios/gi).test(navigator.userAgent),
                //判断浏览器内核
                vendor = Util.getVendor(),
                //toLowerCase()把字符串转换为小写
                cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',
                // 是否支持3D
                has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
                trnOpen = 'translate' + (has3d ? '3d(' : '('),
                trnClose = has3d ? ',0)' : ')',
                // 是否支持css3的transition属性
                isTransition = Util.supportCss3('Transition');

            //console.log(isAndroid);
            //console.log(isIDevice);
            // 不缓存的页面
            var noCachePage = [
                'userinfo','franchise', 'personal', 'searchBusiness', 'homeCard', 'orderDetails', 'merchantHome', 'orderlist', 'dishes', 'shopChoice', 'shopList', 'payQuick', 'cardList', 'messageDetails', 'vouchersList', 'storedValue', 'forgetPwd', 'nomemberlogin', 'nomemberpay', 'takeaway', 'modifAddress', 'address', 'enjoymember','shopChoiceNew','feedbackadd','IntegralCenterlist','integralExchangelist','storedValueRecordList',


                'login', 'register', 'resetPwd', 'modifyInfo', 'modifyPhoneNumber', 'modifyAddress', 'feedback', 'systemSet',
                'group', 'groupShare', 'groupMember',
                'article', 'userRelease',
                'order', 'payorder', 'dishes', 'lunchbox', 'lunchAddress', 'notloginmenu',
                'userAccount', 'mealselect', 'location', 'comments', 'recharge', 'integral', 'invoiceover', 'invoice', 'invoicedetails','integralRecordCount'
            ];

            // 滑动页面
            var slidePage = ['userAccount', 'orderlist', 'mealselect', 'articlelist'];

            // 应用信息
            $.app = {
                isClient: false, // 是不是客户端
                body_height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight), // 页面高度
                body_width: document.body.scrollWidth, // 页面宽度
                //ndHeader: $('<div/>').html($('#header-template').html()).find('[data-role=header]'),
                // 获取到header
                ndBottom: $('<div/>').html($('#bottom-template').html()).find('[data-role=bottom]'),
                //HEADER: ['index'],                              // 不显示header的页面
                hasTouch: hasTouch,
                START_EV: START_EV,
                MOVE_EV: MOVE_EV,
                END_EV: END_EV,
                CANCEL_EV: CANCEL_EV,
                isAndroid: isAndroid, // 是不是Android设备
                isIDevice: isIDevice, // 是不是苹果设备
                isShowMenu: false, // 是否显示菜单
                localPage: null, // 当前打开的页面
                noCachePage: noCachePage, // 不缓存的页面
                isWeixin: Util.isWeixin(), // 是不是使用微信打开
                isSlide: false // 页面是否在切换
            };

            // pc端重新设置宽度
            if ($.app.hasTouch == false) {

                // app内容最小宽度320px
                $.app.width = (parseInt($.app.body_height * 0.55) < 320) ? 320 : parseInt($.app.body_height * 0.55);

                // 设置内容容器的宽度和高度
                $('#j-page-container').css({
                    'width': $.app.body_width + 'px',
                    'height': $.app.body_height + 'px'
                });

                // 设置内容块的宽度和left
                $('#j-content').css({
                    'width': $.app.width,
                    'left': parseInt(($.app.body_width - $.app.width) / 2)
                });

                $.app.body_width = $.app.width;
            }

            var adaptive = $.app.body_width / 23.4375;

            //alert(adaptive);
            $('html').attr('style', 'font-size:' + adaptive + 'px;');

            // 页面返回定位
            window.page_position = {};

            // 页面返回方向
            window.Router = {

                // 获取页面定位
                get_position: function(oldPage, newPage) {
                    // 初次进入为center
                    if (oldPage == undefined) {
                        return 'center';
                    }

                    var pageObj = window.page_position[oldPage];
                    if (pageObj) {
                        for (var i in pageObj) {
                            for (var j in pageObj[i]) {
                                if (pageObj[i][j] == newPage) {
                                    return i;
                                }
                            }
                        }
                    }

                    return 'right';
                }
            };

            var tojump = false,
                ondown = function(e) {
                    // console.log($.app.START_EV);
                    tojump = true;
                },
                onmove = function() {
                    // console.log($.app.MOVE_EV);
                    // if (tojump) {
                    //     tojump = false;
                    // }
                },
                onup = function() {
                    // console.log($.app.END_EV);
                    if (tojump) {
                        tojump = false;

                        // 菜单没显示
                        if ($.app.isShowMenu == false) {
                            var rel = $(this).attr('rel');
                            if (rel.indexOf('true') == 0) {
                                Click.isLogin(true, rel.substr(5));
                            } else {
                                Page.open(rel);
                            }
                        }
                    }
                };

            // 添加事件
            // $(document).on($.app.START_EV, '[rel]', ondown)
            //            .on($.app.END_EV, '[rel]', onup)
            //            .on($.app.CANCEL_EV, '[rel]', onup);


            // 给一般元素绑定事件
            $(document).on('click', '[rel]', function() {
                //alert('tttt');
                // console.log('监听封装click事件: ' + $.app.isSlide);
                // 页面正在滑动不能使用返回
                if ($.app.isSlide == true) {
                    return;
                }

                if ($.app.isShowMenu == false) {
                    //查找页面标签中的“rel”属性的值,进行跳转
                    var rel = $(this).attr('rel');
                    // console.log(rel);

                    if ($(this).hasClass('help')) {
                        Cache.set('help_page_return', rel.split(',')[1]);
                        Page.open(rel.split(',')[0]);
                    } else {
                        //alert(rel);
                        if (!$.cookie("user_mobile") && rel.indexOf('true') != -1) {
                            Click.isLogin(true, rel.split(',')[0]);
                        } else {
                            // 如果登录之后，要跳转的页面还有true就把true去除掉显示出来
                            if (rel.indexOf('true') != -1) {
                                Page.open(rel.split(',')[0]);
                            } else {
                                Page.open(rel);
                            }
                        }
                    }

                }
            });

            // 页面正在切换点击事件无效
            $(document).on('click', function() {
                // console.log('监听click事件: ' + $.app.isSlide);
                // 页面正在滑动不能使用返回
                if ($.app.isSlide == true) {
                    // console.log('我要停止');
                    return;
                }
            });

            document.addEventListener($.app.MOVE_EV, onmove, false);

            // 给菜单绑定事件
            /*$(document).on('click', '[data-type="nav"]', function() {

                // console.log('监听菜单click事件: ' + $.app.isSlide);

                // 页面正在滑动不能使用返回
                if ($.app.isSlide == true) {
                    return;
                }
                //menu菜单 关闭
                //var menu = new Menu($('#' + $.app.localPage + '-frame'));
                //menu.closeMenu();

                var rel = $(this).attr('rel');
                if (rel.indexOf('true') == 0) {
                    Click.isLogin(true, rel.substr(5));
                } else {
                    Page.open(rel);
                }
            });*/

            function get_trans_pos(elem, from, type) {

                // var matrix = getComputedStyle(elem, null)[vendor + 'Transform'].replace(/[^0-9-.,]/g, '').split(',');
                var matrix = $(elem).css(vendor + 'Transform').replace(/[^0-9-.,]/g, '').split(',');
                return {
                    'x': matrix[4] * 1 || 0,
                    'y': matrix[5] * 1 || 0
                };

            }

            // 添加imove方法   $.fn.extend函数用于为jQuery扩展一个或多个实例属性和方法(主要用于扩展方法)。下面这个可以使用$('属性标签名').imove(参数)调用
            $.fn.extend({
                'imove': function(from, type, stopX, stopY, duration, callback, removeCallback) {
                    var that = this,
                        elem = that[0];
                    //是否支持css3的transition属性
                    if (isTransition) {

                        $.app.isSlide = true;

                        var orig_pos = get_trans_pos(elem, from, type);

                        // console.log(vendor);

                        elem.style[vendor + 'TransitionProperty'] = cssVendor + 'transform';
                        elem.style[vendor + 'TransitionDuration'] = duration + 'ms';
                        elem.style[vendor + 'Transform'] = trnOpen +
                            (orig_pos.x + stopX) + 'px,' +
                            (orig_pos.y + stopY) + 'px' + trnClose;
                        elem.style[vendor + 'TransformOrigin'] = '0px 0px';

                        if (type == 'new' && typeof callback == 'function') {
                            // console.log('执行事件');

                            // 单页先删除页面与执行事件一起执行
                            if ($.inArray($.app.localPage, slidePage) == -1) {
                                setTimeout(removeCallback, duration);
                                setTimeout(callback, duration);
                            } else {
                                // 多页滑动先执行事件再删除页面
                                callback();
                                setTimeout(removeCallback, duration);
                            }

                            setTimeout(function() {
                                $.app.isSlide = false;
                            }, duration);

                        }

                    } else {
                        var orig_left = parseFloat(that.css('left')) || 0;
                        var orig_top = parseFloat(that.css('top')) || 0;

                        that.animate({
                            left: orig_left + stopX,
                            top: orig_top + stopY
                        }, {
                            duration: 0,
                            complete: callback
                        });
                    }

                    return that;
                }
            });

            //console.log(window);

            if ($.app.hasTouch) {

                // phonegap加载完成，设备已经准备好
                document.addEventListener("deviceready", onDeviceReady, false);

                openPage();
            } else {
                openPage();
            }

            // PhoneGap加载完毕
            function onDeviceReady() {
                //alert(555)
                // 因为手机浏览器不能请求ios客户端，所以以此来判断是手机客户端还是手机浏览器
                Mobile.getSoftVersion(function(result) {
                    //alert(1)
                    $.app.isClient = true;
                });


                //    alert($.app.isAndroid);

                if ($.app.isAndroid) {
                    document.addEventListener("backbutton", eventBackButton, false);
                    document.addEventListener("menubutton", menuToggle, false);
                }
            }

            // android 硬件返回键
            function eventBackButton() {

                // 页面正在滑动不能使用返回       判断页面是否在切换，默认为false
                if ($.app.isSlide == true) {
                    return;
                }

                //回滚监听
                var state = History.getState();
                // alert(state.data.url.split('&')[0]);
                if (
                    state.data.url.split('&')[0] == 'searchBusiness' ||
                    state.data.url.split('&')[0] == 'homeCard' ||
                    Cache.get('history').split('&')[0] == 'searchBusiness' ||
                    Cache.get('history').split('&')[0] == 'homeCard'
                ) {
                    //判断是否显示菜单，默认false
                    if ($.app.isShowMenu) {
                        Page.back();
                    } else {
                        navigator.notification.confirm('确认退出乐卡包？', showConfirm, '系统提示', '确定,取消');
                    }
                } else {
                    Page.back();
                }
            }

            // android菜单切换
            function menuToggle() {
                /*var menu = new Menu($('#' + $.app.localPage + '-frame'));

                if ($.app.isShowMenu) {
                    menu.closeMenu();
                } else {
                    menu.openMenu();
                }*/
            }

            function showConfirm(button) {
                if (button == 1) {
                    navigator.app.exitApp();
                }
            }

            // 检测js报错
            window.onerror = function(errorMessage, scriptURI, lineNumber, columnNumber, errorObj) {
                // alert("错误信息：", errorMessage);
                // alert("出错文件：", scriptURI);
                // alert("出错行号：", lineNumber);
                // alert("出错列号：", columnNumber);
                // alert("错误详情：", errorObj);
                Data.setAjax('companyShare', {
                    'url': location.href,
                    'disOrder': Cache.get('disOrder'),
                    'errorMessage': "错误信息："+errorMessage,
                    'scriptURI': "出错文件："+scriptURI,
                    'lineNumber': "出错行号："+lineNumber,
                    'columnNumber': "出错列号："+columnNumber,
                    'errorObj': "错误详情："+errorObj
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {

                }, 2);
            };

            // 打开初始页面
            function openPage() {
                var lo = location.href.split('?')[1];
                Cache.set('judge_return', 2);
                // alert(2)
                //测试弹出什么页面
                //alert("弹出这个页面的"+lo);
                // 第一次打开页面，相当于更新一次，存储当前更新日期
                // var time = Util.dateTotTime(Util.getLocalTime(new Date()));
                //alert('dd');
                // Cache.set('updateTime', time);
                if (lo) {
                    // 对于ios app首次打开后面跟的随机数
                    //如果（v=）不存在于字符串（lo）中就等于-1，不等于-1就表示他存在
                    //indexOf查找指定字符串值首次在字符串中的位置

                    //下面所有写着home的地方，原来写着index（引导页）
                    if (lo.indexOf('v=') != -1) {
                        lo = 'homeCard';
                    }
                } else {
                    lo = 'homeCard';
                }

                // 对于android app页面打开的html后面跟的随机数处理
                if (!isNaN(Number(lo))) {
                    lo = 'homeCard';
                }

                if (lo == 'homeCard') {
                    Update.determineHomePage(0);
                } else {
                    Page.open(lo, 1);
                }


            }

        });
    };

    return PageInit;

});