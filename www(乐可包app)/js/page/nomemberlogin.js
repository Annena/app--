define('page/nomemberlogin', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/message',
    'base/util',
    'base/scrollbar'
], function (Page, Data, Pattern, Cache, Message, Util, Bar){

    var LoginPage = function () {
        this.back = Cache.get('loginReturn');
    };

    // 登录页面
    LoginPage.prototype = new Page('nomemberlogin');

    LoginPage.prototype.util = function () {

        var listScroll = Bar($('#memberloginScroll')[0], true);

      
      

        // 判断微信访问
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        if(isAli){
            $('#memberPay').addClass('hide')
        }else if(isWeixin){
            $('#alipay').addClass('hide')
        }
        // 判断微信访问
        weixinVisit();
        function weixinVisit () {
            var _self = this;
            if (isWeixin || isAli) {
                $('#download').removeClass('hide');
                $('header').addClass('hide');
                //document.getElementById('memberloginScroll').style.cssText = 'top:45px !important';
                //document.getElementById('login-header').style.cssText = 'top:45px !important';

                $('#login-header').addClass('top35');
                $('.register-nav').addClass('top10');

                $('#download').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
            } else {
                $('#download').addClass('hide');
                $('header').removeClass('hide');
            }
        }

        // 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
        var cardId = Util.getQueryString('card_id');
        var payId = Util.getQueryString('pay_id');
        var is_member = Util.getQueryString('is_member'); // 有值说明是从点菜页面未登录下单过来的选择
        var is_login = Util.getQueryString('is_login');// 8 有订单、 无用户 、 已结账 、 未登录
        var is_type = Util.getQueryString('is_type'); // is_type == 1 加菜过来的

        // 根据判断显示不同的页面文字和图片
        if (is_member == 1) {
        
            $('#nomember_title,title').text('提交订单');
            $('#nomember_orderpay').text('非会员下单');
            $('#nomember_orderpay_ali').text('非会员下单');
            $('#member_orderpay').text('会员下单');
            $('#meng_orderpay').text('会员微信、储值、抵用券等方式支付享更多实惠');
            $('#nomember_image').attr('src', '../../img/base/wechatbuy.png');
            $('#nomember_image_ali').attr('src', '../../img/base/alipayLogo.png');
            $('#member_image').attr('src', '../../img/base/vipbuy.png');
            this.back = Cache.get('is_member_dishes');
        } else if (is_member == 2){
            
            $('#nomember_title,title').text('提交订单');
            $('#nomember_orderpay').text('非会员浏览结账单');
            $('#nomember_orderpay_ali').text('非会员浏览结账单');
            
            $('#member_orderpay').text('会员登录绑定订单');
            $('#meng_orderpay').text('领取消费返券');
            $('#meng_orderpay').css('color','#999999');
            $('#nomember_image').attr('src', '../../img/base/liulanicon.png');
            $('#nomember_image_ali').attr('src', '../../img/base/liulanicon.png');
            $('#member_image').attr('src', '../../img/base/vipll.png');
            // 判断
            if (cardId != undefined) {
                this.back = 'orderDetails'+location.href.split("nomemberlogin")[1];
                Cache.set('loginReturn', 'orderDetails'+location.href.split("nomemberlogin")[1]);
            } else {
                this.back = Cache.get('is_member_dishes');
            }
        } else {
           
            $('#nomember_title,title').text('在线支付');
            $('#nomember_orderpay').text('非会员微信支付');
            $('#member_orderpay').text('会员支付');
            $('#meng_orderpay').text('会员微信、储值、抵用券等方式支付享更多实惠');
            $('#nomember_image').attr('src', '../../img/base/wechatbuy.png');
            $('#member_image').attr('src', '../../img/base/vipbuy.png');

            // 判断
            if (cardId != undefined) {
                this.back = 'payorder'+location.href.split("nomemberlogin")[1];
                Cache.set('loginReturn', 'payorder'+location.href.split("nomemberlogin")[1]);
            }
        }

        var loginReturn = Cache.get('loginReturn');

        // 点击注册
        $('#register').unbind('click').bind('click', function () {
            // 如果是未登录下单带参数
            if (is_member == 1 || is_member == 2) {
                Page.open('register&page=nomemberlogin&is_member='+is_member);
            } else if (is_type == 1) {
                Page.open('register&page=nomemberlogin&is_login=0&is_type='+is_type);
            } else {
                Page.open('register&page=nomemberlogin');
            }
        });

        // 点击忘记密码
        $('#forgetPwd').unbind('click').bind('click', function () {
            // 如果是未登录下单带参数
            if (is_member == 1 || is_member == 2) {
                Page.open('forgetPwd&page=nomemberlogin&is_member='+is_member);
            } else if (is_type == 1) {
                Page.open('forgetPwd&page=nomemberlogin&is_login=0&is_type='+is_type);
            } else {
                Page.open('forgetPwd&page=nomemberlogin');
            }
        });

        var num = 0;// 来回登陆点击回车键会请求多次
        // 点击键盘上回车键
        $(window).keydown(function (event) {
            if (event.keyCode == 13) {
                $('#login-password').blur();
                if (num == 0) {
                    loginOperation();
                }
            }
        });

        // 点击登录
        $('#login-btn').unbind('click').bind('click', function () {
            loginOperation();
        });
        // 点击非会员支付
        $('#memberPay').unbind('click').bind('click', function () {
            // 如果是未登录下单就跳转支付页面
            if (is_member == 1 || is_member == 2) {
                Page.open(loginReturn);
            } else {
                Page.open(loginReturn);
            }
        });
        $('#alipay').unbind('click').bind('click', function () {
            // 如果是未登录下单就跳转支付页面
            if (is_member == 1 || is_member == 2) {
                Page.open(loginReturn);
            } else {
                Page.open(loginReturn);
            }
        });
        // 长按或单击样式
        /*$("#login-btn").mousedown(function(){
            $(this).css("background","#AE2020");
        });
        // 长按松开或单击松开样式
        $("#login-btn").mouseup(function(){
            $(this).css("background","#FB5555");
        });*/

        // jquery mobile  vmousedown vmouseout
        $('#login-btn').bind('vmousedown', function () {
            $(this).css("background","#DD3737");
        }).bind('vmouseout', function () {
            $(this).css("background","#FB5555");
        });

        /*// 鼠标悬浮样式
        $("#login-btn").mouseover(function(){
            $(this).css("background-color","#AE2020");
        });
        // 鼠标移开样式
        $("#login-btn").mouseout(function(){
            $(this).css("background-color","#FB5555");
        });*/

        // 登陆操作
        function loginOperation () {
            //获取到账户密码
            var ndUsername = $('#user-name').val(),
                ndloginPassword = $('#login-password').val();

            //手机号密码验证
            if (dataCheck()) {
                //alert(Cache.get('getCID'));
                //请求登录接口
                Data.setAjax('login', {
                    'user_mobile': ndUsername,
                    'user_pass': ndloginPassword,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200102: '',430102: '',42: ''}, function (respnoseText) {
                    if (respnoseText.code == '200102') {
                        num == 1;
                        // 判断未登录的情况
                        Cache.set('isLogin',true);
                        Message.show('#msg', respnoseText.message, 2000, function () {
                            if (is_type == 1 || is_member == 2 || is_login == 0) {
                                /*APP1
                                微信2
                                点菜宝3
                                收银台4*/
                                var trade_type = Util.isWhat()
                                // 扫描桌台二维码处理
                                Util.scanTableCode(cardId, payId, isWeixin, trade_type, is_type, '', '', '', 1);
                            } else {
                                Page.open(loginReturn);
                            }
                            Cache.del('loginReturn');
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);

            }
        }

        // 点击跳转到注册页面
        /*$('#register').unbind('click').bind('click', function () {
            Page.open('register');
        });*/

        // 校验数据
        function dataCheck() {
            if ( Pattern.dataTest('#user-name', '#msg', { 'empty': '不能为空', 'mobileNumber': '必须为手机号'})
                && Pattern.dataTest('#login-password', '#msg', { 'empty': '不能为空' , 'pass': '应为数字字母6-16位'})
            ) {
                return true;
            }
            return false;
        }
        listScroll.refresh();
    };

    LoginPage.prototype.bindPageEvents = function () {
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

    return LoginPage;

});

