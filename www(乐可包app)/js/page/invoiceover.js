define('page/invoiceover', [
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
    'base/pattern'
], function (Page, Data, Cache, Bar, Util, Load, Cache, Mobile, Message, Click, Dialog,Pattern) {

    var cardId = Util.getQueryString('card_id');
    var PayId = Util.getQueryString('pay_id');
    var add_time = Util.getQueryString('add_time');
    var orderListType = Util.getQueryString('orderListType');
    var order_property = Util.getQueryString('order_property');
    var invoiceName = Cache.get('invoiceName');
    var Invoiceover = function () {
        this.back = 'orderDetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property
    }
    var shop_id = '';
    var invoiceData = Cache.get('invoiceData');
    var invoiceSp_url = ''
    if(invoiceData == null && invoiceData == '' && invoiceData == undefined){
        Page.open('orderDetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property)
    }
    var isWeixin = Util.isWeixin();
    var isAli    = Util.isAlipay()
    var invoiceMoney = '' //开票金额
    // 扫描支付未支付订单支付页面
    Invoiceover.prototype = new Page('invoiceover');

    Invoiceover.prototype.util = function () {
        var _self = this;
        // 读取商铺名称缓存
        // var shopcardname = Cache.get('shop-cardname');
        // // 显示顶部商户名称
        // $('#weizhifu-shopname').text(shopcardname);
        $('title').text('开具发票');
        var invoiceover = {
            scroll: null,
            init: function () {
                var self = this;
                this.scroll = Bar('#invoiceScroll');
                // 是否是微信
                /*APP1
                微信2
                点菜宝3
                收银台4*/
                var trade_type = Util.isWhat();

                // 判断微信访问
                this.weixinVisit();
                //赋值
                this.invoiceDetails();

                var wid = $.app.body_width - $.app.body_width / 100 * 5 * 2;
                // 获取到屏幕宽度，赋值给页面
                $('#invoiceScroll').width(wid);
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
                    $('.invoice-nav').addClass('top10');
                    $('#download').unbind('click').bind('click', function () {
                        window.location=phpDownload;
                    });
                } else {
                    $('#download').addClass('hide');
                    $('header').removeClass('hide');
                }
                this.scroll.refresh();
            },
            invoiceDetails:function (){
                var _self = this
                $('#email').text(invoiceName.email)
                //点击事件
                _self.bindClick()
            },
            bindClick:function (){
                //返回订单详情
                $('#back_orderDetails').unbind('click').bind('click', function () {
                   Page.open('orderDetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type=1&order_property=3')
                })
                //点击查看发票详情
                $('#look').unbind('click').bind('click', function () {
                    Page.open('invoicedetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property)
                })
            },
        };
        invoiceover.init();
    };
    Invoiceover.prototype.bindPageEvents = function () {
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

    return Invoiceover;
});