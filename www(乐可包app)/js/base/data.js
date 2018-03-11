define('base/data', [
    'base/message',
    'base/config',
    'base/mobile',
    'base/dialog',
    'base/cache'
], function (Message, Config, Mobile, Dialog, Cache) {

    var time = new Date().getTime();
    /*
        url: ajax 请求地址
        data：post请求时传递给后台的参数
        dialog: 页面提示层
        successAry: 页面请求成功的标志数组
        successFn: 请求成功后执行的函数
        type:
                请求前 请求成功 请求失败
            0:  显示   显示     显示
            1:  显示   不显示   显示
            2:  不显示 不显示   显示

            3:  请求接口时显示loading，但接口成功不关闭loading
            4:  请求接口时不显示loading，但接口成功关闭loading
    */
    function setAjax(url, data, loading, prompt, successAry, successFn, type, async, is_ajax) {

        //console.log(Mobile.checkConnection());
        //Message.show(prompt,'dd',2000);
        //if ($.app.isClient == true) {
            // 检测网络
            if ( checkConnectionPro() ) {
                $.dialog = Dialog({
                    type: 1,
                    close: false,
                    btn: ['确定'],
                    content: '暂无网络，请连接网络',
                    closeFn: function() {
                        navigator.app.exitApp();
                    }
                });
                return;
            }
        //}
        //alert('ttt');
        if (type == 2 || type == 3) {
            $('#layer').removeClass('hide');
            Message.show(loading, '<img src="../img/base/loadingnew.gif"><br>正在加载</div>', false);
        } else {
            if (type != 4) {
                $('#layer').addClass('hide');
            }
        }
        //alert('ddd');

        if (async == false) {
            async = async;
        } else {
            async = true;
        }

        // 获取到cookie里面的cid和URL里面的商户英文名称
        var CID = Cache.get('getCID');

        var page = {};
        var dataAjax = data;
        
        if (!CID) {
            $.ajax({
                type: "POST",
                url: Config.api('userCid'),
                data: '',
                async: async,
                ifModified: true,
                xhrFields:{withCredentials:true},
                cache: false,
                timeout: 20000,
                error: function() {
                    Message.show(prompt, '请求服务器失败，请重试！', 3000);
                },
                success: function(respnoseText) {
                    CID = respnoseText.data;
                    Cache.set('getCID', CID);
                    page = {
                        'cid': CID
                    };
                    dataAjax = $.extend({}, data, page);
                    ajax_result();

                }
            });
        } else {
            ajax_result();
        }

        function ajax_result() {
            $.ajax({
                type: (is_ajax ? is_ajax : "POST"),
                url: Config.api(url),
                data: dataAjax,
                async: async,
                ifModified: true,
                xhrFields:{withCredentials:true},
                cache: false,
                timeout: 20000,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    Message.show(loading, '', 0, function() {
                        Message.show(prompt, '请求服务器失败，请重试！', 3000);
                        console.log('stop');
                        return;
                    });
                },
                success: function(respnoseText) {
                    //alert(respnoseText.code);
                    if (respnoseText.code == 400101) {// 您当前未登录，请登录
                        Cache.set('isLogin',false);

                        // 指定域名 清除cookie
                        $.removeCookie('login_time', {path:'/',domain:'.lekabao.net'});   //登录时间
                        $.removeCookie('user_id', {path:'/',domain:'.lekabao.net'});      //用户id
                        $.removeCookie('user_mobile', {path:'/',domain:'.lekabao.net'});  //用户手机号
                        $.removeCookie('user_name', {path:'/',domain:'.lekabao.net'});    //用户昵称
                        $.removeCookie('a_login_time', {path:'/',domain:'.lekabao.net'});
                        $.removeCookie('a_user_id', {path:'/',domain:'.lekabao.net'});
                        $.removeCookie('a_user_mobile', {path:'/',domain:'.lekabao.net'});
                        $.removeCookie('a_user_name', {path:'/',domain:'.lekabao.net'});

                        //alert('ddd');
                        Message.show(prompt, '', 2000, function() {
                            require(['base/click','base/util'], function (Click, Util) {

                                var scanCodeType = Util.getQueryString('type');
                                var scanType = Util.getQueryString('scanType');
                                var isWeixin = Util.isWeixin();
                                //alert(location.href.split('?')[1]);
                                if (scanCodeType == 0 && scanType == 4 && isWeixin == true) {
                                    Click.isLogin(true, location.href.split('?')[1], 400101, 1);
                                } else {
                                    Click.isLogin(true, location.href.split('?')[1], 400101);
                                }
                            });
                            return;
                        });
                    }


                    if (respnoseText.code == 400) {
                        Message.show(loading, '', 0, function() {
                            if (url != 'getNewRedEnvelope') {
                                require(['base/page'], function (Page) {
                                    Page.open('login');
                                });
                            }
                        });
                    } else {
                        for (var i in successAry) {
                            if (i == respnoseText.code) {
                                if (type == 0) {
                                    Message.show(loading, '', 0, function() {
                                        var message = (successAry[i] != '') ? successAry[i] : respnoseText.message;
                                        Message.show(prompt, message, (respnoseText.code == 1604 || respnoseText.code.code == 1602) ? 0 : 2000, function() {
                                            successFn(respnoseText);
                                        });
                                    });
                                } else {
                                    if (type == 3) {
                                        successFn(respnoseText);
                                    } else {
                                        Message.show(loading, '', 0, function() {
                                            Message.show(prompt, '', 0, function() {
                                                successFn(respnoseText);
                                            });
                                        });
                                    }
                                }
                                return;
                            } else {
                                if (type == 3) {
                                    successFn(respnoseText);
                                } else {
                                    //alert('dd');
                                    Message.show(loading, '', 0, function() {
                                        Message.show(prompt, '', 0, function() {
                                            successFn(respnoseText);
                                        });
                                    });
                                }
                                return;
                            }
                        }

                        /*Message.show(loading, '', 0, function() {

                            // 估清菜品特殊提示
                            if (respnoseText.code == 1607) {
                                Message.show(prompt, respnoseText.message + respnoseText.data, 3000);
                                return;
                            }

                            Message.show(prompt, respnoseText.message, 3000);
                            return;
                        });*/
                    }
                }
            });
        }
    }

    // 网络检测
    function checkConnectionPro() {
        //alert(navigator.network.connection.type);
        if (navigator.network) {
            var networkState = navigator.network.connection.type;
            var states = {};
            states[Connection.UNKNOWN]  = 'Unknown connection';
            states[Connection.ETHERNET] = 'Ethernet connection';
            states[Connection.WIFI]     = 'WiFi connection';
            states[Connection.CELL_2G]  = 'Cell 2G connection';
            states[Connection.CELL_3G]  = 'Cell 3G connection';
            states[Connection.CELL_4G]  = 'Cell 4G connection';
            states[Connection.NONE]     = 'No network connection';

            if (networkState == Connection.NONE) {
                return true;
            } else {
                return false;
            }
        }
    }

    function setCallback(url, data, loading, prompt, successAry, successFn, type, async) {
        //if ($.app.isClient == true) {
            // 检测网络
            if ( checkConnectionPro() ) {
                $.dialog = Dialog({
                    type: 1,
                    close: false,
                    btn: ['确定'],
                    content: '暂无网络，请连接网络',
                    closeFn: function() {
                        navigator.app.exitApp();
                    }
                });

                return;
            }
        //}

        if (type == 0 || type == 1) {
            Message.show(loading, '<img src="../img/base/loadingnew.gif"><br>正在加载</div>', false);
        }

        if (async == false) {
            async = async;
        } else {
            async = true;
        }

        $.ajax({
            type: "POST",
            url: url,
            data: data,
            async: async,
            ifModified: true,
            xhrFields:{withCredentials:true},
            cache: false,
            timeout: 20000,
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                Message.show(loading, '', 0, function() {
                    Message.show(prompt, '请求服务器失败，请重试！', 3000);
                    console.log('stop');
                    return;
                });
            },
            success: function(respnoseText) {
                for (var i in successAry) {
                    if (i == respnoseText.code) {
                        if (type == 0) {
                            Message.show(loading, '', 0, function() {
                                var message = (successAry[i] != '') ? successAry[i] : respnoseText.message;
                                Message.show(prompt, message, (respnoseText.code == 1604 || respnoseText.code.code == 1602) ? 0 : 2000, function() {
                                    successFn(respnoseText);
                                });
                            });
                        } else {
                            Message.show(loading, '', 0, function() {
                                Message.show(prompt, '', 0, function() {
                                    successFn(respnoseText);
                                });
                            });
                        }
                        return;
                    } else {
                        //alert('dd');
                        Message.show(prompt, '', 0, function() {
                            successFn(respnoseText);
                        });
                        return;
                    }
                }

                /*Message.show(loading, '', 0, function() {

                    // 估清菜品特殊提示
                    if (respnoseText.code == 1607) {
                        Message.show(prompt, respnoseText.message + respnoseText.data, 3000);
                        return;
                    }

                    Message.show(prompt, respnoseText.message, 3000);
                    return;
                });*/
            }
        });
    }

    function loadingData(url, data, loading, successAry, successFn, type, fail) {
        //if ($.app.isClient == true) {
            // 检测网络
            if ( checkConnectionPro() ) {
                $.dialog = Dialog({
                    type: 1,
                    close: false,
                    btn: ['确定'],
                    content: '暂无网络，请连接网络',
                    closeFn: function() {
                        navigator.app.exitApp();
                    }
                });

                return;
            }
        //}

        if (type == 'refresh') {
            $(loading).text('亲，正在加载中');
        } else {
            // 正在加载就停止加载
            if ($(loading).is(':visible')) {
                return;
            }
            Message.loading(loading, '亲，正在加载中', false);
        }

        setTimeout(function() {
            $.ajax({
                type: "POST",
                url: Config.api(url),
                data: data,
                async: false,
                ifModified: true,
                xhrFields:{withCredentials:true},
                cache: false,
                timeout: 20000,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    if (type == 'refresh') {
                        $(loading).text('加载失败，请重试');
                        if (fail) {
                            fail();
                        }
                    } else {
                        Message.loading(loading, '加载失败，请重试', 3000);
                    }
                },
                success: function(respnoseText) {
                    for (var i=0; i<successAry.length; i++) {
                        if (successAry[i] == respnoseText.code) {
                            if (type == 'refresh') {
                                successFn(respnoseText);
                            } else {
                                Message.loading(loading, '操作成功', 500, function() {
                                    successFn(respnoseText);
                                });
                            }
                            return;
                        } else {
                            //alert('dd');
                            Message.show(loading, '', 0, function() {
                                successFn(respnoseText);
                            });
                            return;
                        }
                    }

                    if (type == 'refresh') {
                        $(loading).text(respnoseText.message);
                    } else {
                        Message.loading(loading, respnoseText.message, 3000);
                    }
                }
            });
        }, type == 'refresh' ? 0 : 1000);
    }

    // 获取分享成功积分
    function getShareIntegral(value) {
        $.post(Config.api('integralAdd'),
            {
                'integral_type': 'share',
                'integral_num': 1,
                'integral_about': value
            }
        );
    }

    return {
        setAjax: setAjax,
        setCallback: setCallback,
        loadingData: loadingData,
        getShareIntegral: getShareIntegral,
        checkConnectionPro: checkConnectionPro
    };
});