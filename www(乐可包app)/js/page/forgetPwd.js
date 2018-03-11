define('page/forgetPwd', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/message',
    'base/cache',
    'base/util'
], function (Page, Data, Pattern, Message, Cache, Util) {

    var ForgetPwd = function () {
        this.back = 'login';
    };
    // 忘记密码页面
    ForgetPwd.prototype = new Page('forgetPwd');

    ForgetPwd.prototype.util = function () {

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

        $('title').text('忘记密码');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        //获取到从哪个页面跳转到的登录
        var loginReturn = Cache.get('loginReturn');

        // 判断微信访问
        weixinVisit();

        // 判断微信访问
        function weixinVisit () {
            var _self = this;
            if (isWeixin || isAli) {
                $('#downloadt').removeClass('hide');
                $('header').addClass('hide');
                //document.getElementById('forgetPwdMain').style.cssText = 'top:50px !important';
                //document.getElementById('forgetPwd-header').style.cssText = 'top:45px !important';
                $('#forgetPwd-header').addClass('top35')
                $('.register-nav').addClass('top10')
                $('#download').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
            } else {
                $('#download').addClass('hide');
                $('header').removeClass('hide');
            }
        }


        /*修改密码参数user_mobile
        user_pass：数字大小写字母6-16位
        sms_code：6位数字*/

        // 获取验证码
        $('#get-sms').unbind('click').bind('click', function() {
            if ( Pattern.dataTest('#login-name', '#msg', { 'empty': '不能为空', 'mobileNumber': '请输入正确的手机号'}) ) {
                Data.setAjax('sms', {
                    'sms_type': '2',//短信验证码类型：1注册短信 2密码修改
                    'user_mobile': $('#login-name').val(),
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200103: ''}, function(respnoseText) {
                    if (respnoseText.code == 200103) {
                        Message.show('#msg', respnoseText.message, 2000, function () {
                            Util.countdown(60, '#get-sms');
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
                $('#new-password').blur();
                if (num == 0) {
                    loginOperation();
                }
            }
        });

        // 重置密码
        $('#resetpwd-btn').unbind('click').bind('click', function() {
            loginOperation();
        });

        // jquery mobile  vmousedown vmouseout
        $('#resetpwd-btn').bind('vmousedown', function () {
            $(this).css("background","#DD3737");
        }).bind('vmouseout', function () {
            $(this).css("background","#FB5555");
        });

        // 重置密码操作
        function loginOperation () {
            if (dataCheck()) {
                Data.setAjax('userChange', {
                    'user_mobile': $('#login-name').val(),
                    'user_pass': $('#new-password').val(),
                    'sms_code': $('#sms-verification').val(),
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200105: ''}, function(respnoseText) {
                    if (respnoseText.code == 200105) {
                        num == 1;
                        Message.show('#msg', respnoseText.message, 2000, function () {
                            // 请求登陆接口
                            Data.setAjax('login', {
                                'user_mobile': $('#login-name').val(),
                                'user_pass': $('#new-password').val(),
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

        function dataCheck() {
            if ( Pattern.dataTest('#login-name', '#msg', { 'empty': '手机号不能为空', 'mobileNumber': '请输入正确的手机号'})
                && Pattern.dataTest('#sms-verification', '#msg', { 'empty': '不能为空'})
                && Pattern.dataTest('#new-password', '#msg', { 'empty': '不能为空', 'pass': '应为数字字母6-16位'})
            ) {
                return true;
            }

            return false;
        }

    };

    ForgetPwd.prototype.bindPageEvents = function () {
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

    return ForgetPwd;
});
