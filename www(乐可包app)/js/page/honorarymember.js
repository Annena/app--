define('page/honorarymember', [
    'base/page',
    'base/dialog',
    'base/message',
    'base/cache',
    'base/mobile',
    'base/cacheUpdate',
    'base/data',
    'base/util'
], function (Page, Dialog, Message, Cache, Mobile, Update, Data, Util) {


    var HonorarymemberPage = function () {
        this.back = 'userinfo';
    };
    // 荣誉会员页面
    HonorarymemberPage.prototype = new Page('honorarymember');

    HonorarymemberPage.prototype.bindPageEvents = function () {
      // 判断微信访问
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        $('title').text('荣誉会员');
        if (isWeixin || isAli) {
             $('header').addClass('hide');
            
        }else{
             $('header').removeClass('hide');
        }  



    };

    return HonorarymemberPage;
});

