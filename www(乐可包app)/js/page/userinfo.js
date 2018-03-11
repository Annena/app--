define('page/userinfo', [
    'base/page',
    'base/scrollbar',
    'base/cache',
    'base/data',
    'base/util'
], function(Page, Bar, Cache, Data, Util) {


    var UserInfo = function() {
        this.back = 'home';
    };
    var scroll = null;
    // 我的页面
    UserInfo.prototype = new Page('userinfo');

    UserInfo.prototype.util = function() {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

        return {

            // 获取cookie写值
            writeValue: function() {
                //document.cookie="name=value;domain=lekabao.net";
                //alert(Util.getCookie("user_mobile"));
                //document.cookie="user_mobile='"+escape(value)+"';domain=.lekabao.net";
                //document.domain = 'lekabao.net';
                //alert(decodeURIComponent($.cookie("user_mobile")));
                // userPid = $.cookie("user_pid");     //用户pid身份证号
                var userName = $.cookie("user_mobile"), //用户手机号
                    nickName = $.cookie("user_name"); //用户昵称
                // 手机号 decodeURIComponent() 对编码后的 URI 进行解码
                $('#userinfo-user-name').text(userName == undefined ? '' : decodeURIComponent(userName));
                // 昵称
                $('#userinfo-nick-name').text(nickName == undefined ? '乐乐' : decodeURIComponent(nickName));
                //pid身份证号
                /*if (userPid != undefined) {
                    $('#userinfo-user-pid').text(decodeURIComponent(userPid)).parent('div').removeClass('hide');
                }*/
                scroll.refresh();
            },

            // 绑定事件
            bindEvents: function() {
                var that = this;
                // 点击头部部分，跳转到修改资料页面
                $('#modifyInfoUP').unbind('click').bind('click', function() {
                    Page.open('personal');
                });
            },

            // 判断是否登录
            isLogin: function() {
                if (!$.cookie("user_mobile")) {
                    $('[data-id="mycount"], [data-id="exit"]').hide();
                    $('[data-id="login-register"]').show();
                } else {
                    if (!$.cookie("nick_name")) {
                        $('[data-id="nick_name"]').text('亲');
                    } else {
                        $('[data-id="nick_name"]').text(decodeURIComponent($.cookie("nick_name")));
                    }

                    $('[data-id="user_mobile"]').text(decodeURIComponent($.cookie("user_mobile")));
                    $('[data-id="mycount"], [data-id="exit"]').show();
                    $('[data-id="login-register"]').hide();
                }
            }

        };
    };

    UserInfo.prototype.bindPageEvents = function() {
        // 给滚动的块添加一个高度，因为下面导航条是浮动在页面上面的
        //$('#userinfoScroll').css({'height':$('#userinfoScroll').height()+$('footer').height()+1});

        // 获取到屏幕宽度，赋值给页面
        $('#userinfoScroll').width($.app.body_width);

        var cardId = Util.getQueryString('card_id');
        if (cardId != undefined) {
            this.back = Util.getQueryString('page')+'&card_id='+cardId;
        }
        $('title').text('我的');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli = Util.isAlipay();

        // 如果是微信和支付宝不显示下面的切换条
        if (isWeixin || isAli) {
            $('#foot').addClass('hide');
            $('#userinfoScroll').css('margin-bottom', '0px');
        } else {
            $('#foot').removeClass('hide');
        }

        scroll = Bar('#userinfoScroll', true);
        scroll.refresh();
        this.util().writeValue();
        this.util().bindEvents();
    };

    UserInfo.prototype.bindPageRefreshEvents = function() {
        scroll.refresh();
        this.util().writeValue();
    };

    return UserInfo;

});