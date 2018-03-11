define('page/systemSet', [
    'base/page',
    'base/dialog',
    'base/message',
    'base/cache',
    'base/mobile',
    'base/cacheUpdate',
    'base/data',
    'base/util'
], function (Page, Dialog, Message, Cache, Mobile, Update, Data, Util) {


    var SystemSetPage = function () {
        this.back = 'userinfo';
    };
    // 我的设置页面
    SystemSetPage.prototype = new Page('systemSet');

    SystemSetPage.prototype.bindPageEvents = function () {
         // 判断微信访问
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        $('title').text('我的设置');
        if (isWeixin || isAli) {
             $('header').addClass('hide');
             $('.myset-nav').addClass('top10')
        }else{
             $('header').removeClass('hide');
        }  



        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

        var softVersion = null;

        
        // 如果来源自lsp_appsto(苹果商店)则不显示软件版本;
        if($.app.isClient){
            // 不是苹果
            if($.app.isIDevice == false){
                $('#newVersion').removeClass('hide');
            }
        }


        // 获取最新软件版本号，并写入
        Mobile.getSoftVersion(function(result) {
            softVersion = result;
            $('#versionContent').text(result);
        });

        // 更新软件
        $('#newVersion').unbind('click').bind('click', function() {
            if ($.app.isClient) {
                Update.updateUserSoft(softVersion, 1);
            } else {
                Update.updateUserSoft(0, 1);
            }
        });

        // 帮助
        $('#j-help').unbind('click').bind('click', function() {
            alert('暂时没有帮助页面');
            //Page.open('help');
        });

        // 清除缓存
        $('#cacheClear').unbind('click').bind('click', function() {
            $.dialog = Dialog({
                type: 2,
                content: '您确定要清除缓存吗？清除后系统会重新从服务器获取最新数据！',
                closeFn: function() {
                    Cache.del('all', ['is_look_booking','getCID', 'is_look_takeout', 'is_look_integral', 'article_praise', 'uarticle_praise', 'uuid', 'pageVersion', 'onlyVouchers', 'onlyLogin','invoiceName','openid'], function() {
                        Message.show('#msg', '缓存清除成功', 3000, function() {
                            //alert('dd');
                            Page.open('homeCard');
                            //$.dialog.close($.dialog.id);
                            
                            // 通过请求PHP获取到cid
                            //Util.cidList();
                        });
                    });
                }
            });
        });

        // 退出登录
        $('#exit').unbind('click').bind('click', function() {
            Data.setAjax('logout', {'cid': Cache.get('getCID')}, '#layer', '#msg', {200104: ''}, function(respnoseText) {
                if (respnoseText.code == 200104) {
                    Cache.del('all', ['is_look_booking','getCID', 'is_look_takeout', 'is_look_integral', 'article_praise', 'uarticle_praise', 'uuid', 'pageVersion', 'onlyVouchers', 'onlyLogin']);
                    Message.show('#msg', respnoseText.message, 2000, function () {
                        $.removeCookie('user_mobile');
                        $.removeCookie('user_id');
                        $.removeCookie('login_time');
                        Page.open('homeCard');
                    });
                } else {
                    Message.show('#msg', respnoseText.message, 2000);
                }
            }, 2);
        });

    };

    return SystemSetPage;
});

