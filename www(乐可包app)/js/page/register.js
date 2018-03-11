define('page/register', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/message',
    'base/cache',
    'base/util',
    'base/mobile',
    'base/dialog',
    'base/scrollbar'
], function (Page, Data, Pattern, Message, Cache, Util, Mobile, Dialog, Bar) {

    var Reginster = function () {
        this.back = 'login';
    };

    // 注册页面
    Reginster.prototype = new Page('register');

    Reginster.prototype.util = function () {
        var page = Util.getQueryString('page');
        var is_member = Util.getQueryString('is_member');
        var is_type = Util.getQueryString('is_type'); // is_type == 1 加菜过来的
        if (page == 'nomemberlogin') {
            // 如果是未登录下单
            if (is_member == 1 || is_member == 2) {
                this.back = page+'&is_member='+is_member;
            } else if (is_type == 1) {
                this.back = page+'&is_login=0&is_type='+is_type;
            } else {
                this.back = page;
            }
        }
        $('title').text('注册');
        if(page == 'homeCard') {
            this.back = "homeCard&YesNologin=1&noLogin=0"
        } else if(page == "merchantHome") {
            this.back = "merchantHome&card_id=" + Cache.get("card_id") + "&page=searchBusiness"
        }

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();

        // 判断微信访问
        weixinVisit();

        // 判断微信访问
        function weixinVisit () {
            var _self = this;
            if (isWeixin || isAli) {
                $('#downloadr').removeClass('hide');
                $('header').addClass('hide');
                //document.getElementById('register-header').style.cssText = 'top:45px !important';
                $('#register-header').addClass('top35')
                $('.register-nav').addClass('top10')
                $('#download').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
            } else {
                $('#download').addClass('hide');
                $('header').removeClass('hide');
            }
        }

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
        //需要登录内容才可见的页面

        //获取到从哪个页面跳转到的登录
        var loginReturn = Cache.get('loginReturn');

        if (Util.isWeixin()) {
            $('#register-content').css('top', 0);
        }

        var registerScroll = null;
        loaded();

        // 加载
        function loaded() {
            if (registerScroll != null) {
                registerScroll.destroy();
            }
            registerScroll = Bar($('#register-content')[0], false);
        }
        Util.countdown(-1, '#get-sms');
        // 获取验证码
        $('#get-sms').unbind('click').bind('click', function() {
            if ( Pattern.dataTest('#register-phone', '#msg', { 'empty': '不能为空', 'mobileNumber': '请输入正确的手机号'}) ) {
                Data.setAjax('sms', {
                    'sms_type': '1',//短信验证码类型：1注册短信 2密码修改
                    'user_mobile': $('#register-phone').val(),
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200103: ''}, function(respnoseText) {
                    if (respnoseText.code == 200103) {
                        Message.show('#msg', respnoseText.message, 2000, function() {
                            Util.countdown(60, '#get-sms');
                        });
                    } else if (respnoseText.code == 200220) {
                        num = 1;
                        $.dialog = Dialog({
                            type: 1,
                            close: false,
                            btn: ['登录'],
                            content: respnoseText.data,
                            closeFn: function() {
                                if (page == 'nomemberlogin') {
                                    // 如果是未登录下单
                                    if (is_member == 1 || is_member == 2) {
                                        Page.open('nomemberlogin&is_member='+is_member);
                                    } else if (is_type == 1) {
                                        Page.open('nomemberlogin&is_login=0&is_type='+is_type);
                                    } else {
                                        Page.open('nomemberlogin');
                                    }
                                } else {
                                    Page.open('login');
                                }
                            }
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            }
        });

        var num = 0;// 来回登陆点击回车键会请求多次
        // 点击键盘上回车键
        $(window).keydown(function (event) {
            if (event.keyCode == 13) {
                $('#register-pass').blur();
                if (num == 0) {
                    loginOperation();
                }
            }
        });

        // 注册用户
        $('#register-btn').unbind('click').bind('click', function() {
            loginOperation();
        });

        // 点击去登陆
        $('#login').unbind('click').bind('click', function() {
            if (page == 'nomemberlogin') {
                // 如果是未登录下单
                if (is_member == 1 || is_member == 2) {
                    Page.open('nomemberlogin&is_member='+is_member);
                } else {
                    Page.open('nomemberlogin');
                }
            } else {
                Page.open('login');
            }
        });

        // jquery mobile  vmousedown vmouseout
        $('#register-btn').bind('vmousedown', function () {
            $(this).css("background","#DD3737");
        }).bind('vmouseout', function () {
            $(this).css("background","#FB5555");
        });

        // 注册操作
        function loginOperation () {
            if (dataCheck()) {

                var password = $('#register-pass').val(),
                    smsVerification = $('#sms-verification').val(),
                    ndLoginName = $('#register-phone').val();

                Data.setAjax('register', {
                    'user_mobile': ndLoginName,
                    'user_pass': password,
                    'sms_code': smsVerification,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200101: ''}, function(respnoseText) {
                    if (respnoseText.code == 200220) {
                        num = 1;
                        $.dialog = Dialog({
                            type: 1,
                            close: false,
                            btn: ['登录'],
                            content: respnoseText.data,
                            closeFn: function() {
                                Page.open('login');
                            }
                        });
                    } else if (respnoseText.code == 200101) {// 注册后直接登陆
                        num = 1;
                        Message.show('#msg', '注册成功', 2000, function() {
                            // 请求登陆接口
                            Data.setAjax('login', {
                                'user_mobile': ndLoginName,
                                'user_pass': password,
                                'cid': Cache.get('getCID')
                            }, '#layer', '#msg', {200102: '',430102: '',42: ''}, function (respnoseText) {
                                if (respnoseText.code == '200102') {
                                    if (page == 'nomemberlogin') {
                                        Page.open(loginReturn);
                                        Cache.del('loginReturn');
                                    } else {
                                        if (page == 'homeCard') {
                                            Page.open(page+'&YesNologin=0');
                                        } else {
                                            if (loginReturn) {
                                                Page.open(loginReturn);
                                                Cache.del('loginReturn');
                                            } else {
                                                Page.open('userinfo');
                                            }
                                        }
                                    }
                                } else {
                                    //alert('dd');
                                    Message.show('#msg', respnoseText.message, 2000);
                                }
                            }, 2);
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);

            }
        }
        
        // 点击密码登录跳转登录页面
        /*$('#login').unbind('click').bind('click', function() {
            Page.open('login');
        });*/

        function dataCheck() {
            if ( Pattern.dataTest('#register-phone', '#msg', { 'empty': '手机号不能为空', 'mobileNumber': '请输入正确的手机号'})
                //&& Pattern.dataTest('#sms-verification', '#msg', { 'empty': '不能为空', 'number': '必须为数字', 'smsVerification': '效验失败'})
                && Pattern.dataTest('#register-pass', '#msg', { 'empty': '不能为空' , 'pass': '应为数字字母6-16位'})
            ) {
                return true;
            }

            return false;
        }

    };

    Reginster.prototype.bindPageEvents = function () {
        var self = this;
        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID')) {
                Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
                    // 获取到的cid放到缓存中
                    Cache.set('getCID', respnoseText.data);
                    self.util();
                }, 1);
            } else {
                self.util();
            }
        } else {
            self.util();
        }
    };

    return Reginster;

});