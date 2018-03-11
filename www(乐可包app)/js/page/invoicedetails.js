define('page/invoicedetails', [
    'base/page',
    'base/data',
    'base/cache',
    'base/scrollbar',
    'base/util',
    'base/load',
    'base/cache',
    'base/mobile',
    'base/message',
    'base/click',
    'base/dialog',
    'base/pattern',
], function (Page, Data, Cache, Bar, Util, Load, Cache, Mobile, Message, Click, Dialog,Pattern) {

    var cardId = Util.getQueryString('card_id');
    var PayId = Util.getQueryString('pay_id');
    var add_time = Util.getQueryString('add_time');
    var orderListType = Util.getQueryString('orderListType');
    var order_property = Util.getQueryString('order_property');
    var invoiceName = {}
    var Invoicedetails = function () {
        this.back = 'orderDetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property
    }
    var invoiceName = Cache.get('invoiceName');
    var invoiceSp_url = Cache.get('invoiceSp_url');
    var isWeixin = Util.isWeixin();
    var isAli    = Util.isAlipay();
    // 扫描支付未支付订单支付页面
    Invoicedetails.prototype = new Page('invoicedetails');

    Invoicedetails.prototype.util = function () {
        var _self = this;
        // 读取商铺名称缓存
        // var shopcardname = Cache.get('shop-cardname');
        // // 显示顶部商户名称
        // $('#weizhifu-shopname').text(shopcardname);
        $('title').text('发票详情');
        var invoicedetails = {
            scroll: null,
            init: function () {
                var self = this
                this.scroll = Bar('#invoiceScroll');
                // 是否是微信
                /*APP1
                微信2
                点菜宝3
                收银台4*/
                var sp_url = invoiceSp_url;
                $('#sp_url').attr('src',sp_url);
                // 判断微信访问
                this.weixinVisit();
                //赋值
                self.invoicedetails();
                this.scroll.refresh();
            },
            // 判断微信访问
            weixinVisit:function  () {
                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');
                    $('header').addClass('hide');

                    //document.getElementById('payQuick-header').style.cssText = 'top:45px !important';
                    //document.getElementById('invoiceScroll').style.cssText = 'top:215px !important';

                    $('#invoice-header').addClass('top35');
                    $('#invoiceScroll').addClass('top84');
                    $('.invoice-nav').addClass('top35');
                    $('#download').unbind('click').bind('click', function () {
                        window.location=phpDownload;
                    });
                } else {
                    $('#download').addClass('hide');
                    $('header').removeClass('hide');
                }
                this.scroll.refresh();
            },
        };
        invoicedetails.init();
    };
    Invoicedetails.prototype.bindPageEvents = function () {
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

    return Invoicedetails;
});