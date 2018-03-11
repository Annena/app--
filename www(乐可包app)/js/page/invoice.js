define('page/invoice', [
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
    var orderListType = Util.getQueryString('orderListType');
    var order_property = Util.getQueryString('order_property');
    var invoiceName = {};
    var Invoice = function () {
        this.back = 'orderDetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property
    };
    var shop_id = '';
    var invoiceData = Cache.get('invoiceData');
    var invoiceSp_url = '';
    if(invoiceData == null && invoiceData == '' && invoiceData == undefined){
        Page.open('orderDetails&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type='+orderListType+'&order_property='+order_property)
    }
    var isWeixin = Util.isWeixin();
    var isAli    = Util.isAlipay();
    var gmf_mc =   '';                  //抬头
    var gmf_nsrsbh =  '';            //税号
    var email =  '';                     //邮箱
    var invoiceMoney = ''; //开票金额
    var add_time = '';
    // 扫描支付未支付订单支付页面
    Invoice.prototype = new Page('invoice');

    Invoice.prototype.util = function () {
        var _self = this;
        // 读取商铺名称缓存
        // var shopcardname = Cache.get('shop-cardname');
        // // 显示顶部商户名称
        //$('#weizhifu-shopname').text(shopcardname);
        $('title').text('开具发票');
        var invoice = {
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
                shop_id = Util.getQueryString('shop_id');
                add_time = Util.getQueryString('add_time');

                var timer, windowInnerHeight;
                function eventCheck(e) {
                    if (e) { //blur,focus事件触发的
                        if (e.type == 'click') {//如果是点击事件启动计时器监控是否点击了键盘上的隐藏键盘按钮，没有点击这个按钮的事件可用，keydown中也获取不到keyCode值
                            setTimeout(function () {//由于键盘弹出是有动画效果的，要获取完全弹出的窗口高度，使用了计时器
                                windowInnerHeight = window.innerHeight;//获取弹出android软键盘后的窗口高度
                                timer = setInterval(function () { eventCheck(); }, 100);
                            }, 500);
                        } else {
                            clearInterval(timer);
                        }
                    } else { //计时器执行的，需要判断窗口可视高度，如果改变说明android键盘隐藏了
                        if (window.innerHeight > windowInnerHeight) {
                            clearInterval(timer);
                            setTimeout(function () {
                                if ($.app.isAndroid) {
                                    var height = 0;
                                    var storein = $('#invoiceScroll').offset().top;

                                    if (storein < 0) {
                                        height = -storein + 85;
                                    } else if (storein == 0 || storein < 85) {
                                        height = 85;
                                    }
                                }
                                scroll.refresh();
                            }, 500);
                        }
                    }
                }

                 $('#gmf_mc').click(eventCheck).blur(eventCheck);
                 $('#gmf_nsrsbh').click(eventCheck).blur(eventCheck);
                 $('#email').click(eventCheck).blur(eventCheck);

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
                    $('#invoiceScroll').addClass('top45')
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
                var _self = this;
                // 商户页logo
                $('#orderDetailsLogin').attr('src','../../img/business/'+cardId+'/logo.jpg');
                // 商户名称
                $('#shopName').text(invoiceData.card_name);
                //下单时间
                if(invoiceData.pay_info.f_shop_name != null){
                    $('#addTime').text(invoiceData.pay_info.f_shop_name);
                }else{
                    $('#addTime').text(invoiceData.pay_info.shop_name);
                }


                var idPro = '';
                for (var i in invoiceData.order) {
                    idPro = i;
                    break;
                }
                Cache.set('shop_type_info', invoiceData.order[idPro].order_type_info);
                shop_type_info = invoiceData.order[idPro].order_type_info;
                // shop_type_info 0 桌台模式  1叫号 2台卡
                // 桌台类型 桌台名称
                var table_type = '',
                    table_name = '',
                    table_number = '';
                if (invoiceData.table_type == undefined) {
                    table_type = '';
                } else {
                    table_type = invoiceData.table_type+' ';
                }
                shop_id = invoiceData.shop_id;
                if (shop_type_info == 1) {
                    table_number = '桌台号';
                    table_name = invoiceData.table_name;
                } else if (shop_type_info == 2) {
                    table_number = '取餐号';
                    table_name = invoiceData.table_name;
                    table_type = '';
                    // 如果返回生成中，就把这几个字大小修改成跟桌台号一样
                    if (table_name == '生成中') {
                        //$('#tableNumber').removeClass('table-i-left').addClass('float-left');
                        //$('#tableTypeName').removeClass('table-i-right').addClass('table-i-red');
                    }
                } else {
                    table_number = '台卡号';
                    table_name = invoiceData.table_name;
                    table_type = '';
                }
                if(invoiceData.table_type == '无桌台'){
                    $('#tableNumber').text('单号');
                    $('#tableTypeName').text(table_name);
                }else{
                    $('#tableNumber').text(table_number+'：');
                    $('#tableTypeName').text(table_type+table_name);
                }

                var order_type_text = '';
                var order_type_img = '';
                if (order_property == 1) {
                    order_type_text = '餐厅堂食';
                    order_type_img = '1';
                } else if (order_property == 2) {
                    order_type_text = '外卖送餐';
                    order_type_img = '2';
                } else if (order_property == 3) {
                    order_type_text = '门店自取';
                    order_type_img = '3';
                } else if (order_property == 4) {
                    order_type_text = '商城配送';
                    order_type_img = '4';
                }
                $('#order_type_text').text(order_type_text);   

                // 消费金额
                $('#consume').text(invoiceData.consumes); 
                // 会员价优惠
                $('#memberDiscount').text(parseFloat(invoiceData.pay_info.sub_user).toFixed(2));
                // 会员折扣
                $('#subUserDiscount').text(parseFloat(invoiceData.pay_info.sub_user_discount).toFixed(2));
                // 抵用劵
                $('#voucher').text(parseFloat(invoiceData.pay_info.voucher).toFixed(2));
                // 乐币
                $('#stored').text(parseFloat(invoiceData.pay_info.stored).toFixed(2));
                // 微信
                $('#wxpay').text(parseFloat(invoiceData.pay_info.wxpay).toFixed(2));
                // 支付宝
                $('#alipay').text(parseFloat(invoiceData.pay_info.alipay).toFixed(2));
                //自定义支付
                $('#otherMoney').text(invoiceData.pay_info.other);
                //银行卡支付
                $('#cardMoney').text(invoiceData.pay_info.card);
                //现金支付
                $('#cashMoney').text(invoiceData.pay_info.cash);
                //开票金额
                invoiceMoney = parseFloat(Util.accAdd(Util.accAdd(Util.accAdd(invoiceData.pay_info.cash,invoiceData.pay_info.card),invoiceData.pay_info.wxpay),invoiceData.pay_info.alipay));
                invoiceMoney = Util.accSubtr(Util.accSubtr(invoiceMoney,invoiceData.pay_info.re_alipay),invoiceData.pay_info.re_wxpay);
                $('#invoiceMoney').text(parseFloat(invoiceMoney).toFixed(2));
                //获取缓存的发票抬头，税号，邮箱
                invoiceName = Cache.get('invoiceName');
                if(invoiceName != null && invoiceName != '' && invoiceName != undefined){
                    $('#gmf_mc').val(invoiceName.gmf_mc);
                    $('#gmf_nsrsbh').val(invoiceName.gmf_nsrsbh);
                    $('#email').val(invoiceName.email);
                }
                //each结账详情，。如果是0.隐藏
                $('#moneyDetails p').find('i').each(function(){
                    var money = $(this).text();
                    if(money == 0){
                       $(this).parent('p').remove(); 
                    }
                });
                //点击事件
                _self.bindClick();
            },
            bindClick:function (){
                var _self = this;
                //点击结账详情
                $('#downnn').unbind('click').bind('click',function(){
                    $(this).toggleClass('down');
                    $('#moneyDetails').toggleClass("hide");
                    _self.scroll.refresh();
                });
                if(invoiceMoney == 0){
                    $('#subBtn').css('background','#dfdfdf');
                    $('#subBtn').attr('id','lalal');
                }
                //点击确认开票
                $('#subBtn').unbind('click').bind('click',function(){
                    gmf_mc = $('#gmf_mc').val();                     //抬头
                    gmf_nsrsbh = $('#gmf_nsrsbh').val();             //税号
                    email = $('#email').val();                       //邮箱                    
                    //判断必填项
                    if(gmf_mc == ''){
                        Message.show('#msg', '请输入正确的发票抬头', 2000);
                        return;
                    }
                    if(gmf_nsrsbh == '' || gmf_nsrsbh.length > 20 || gmf_nsrsbh.length < 15){
                        Message.show('#msg', '请输入正确的税号', 2000);
                        return;
                    }
                    if(_self.isEmail(email) == false){
                        Message.show('#msg', '请输入正确的邮箱', 2000);
                        return;
                    }
                    $.dialog = Dialog({
                        type: 3,
                        close: false,
                        dom: '#dg',
                        success:function(){
                            $('#dg-invoiceMoney').text(parseFloat(invoiceMoney).toFixed(2));
                            $('#dg-gmf_mc').text(gmf_mc);
                            $('#dg-gmf_nsrsbh').text(gmf_nsrsbh);
                            $('#dg-email').text(email);
                        }
                    });
                });
                //点击确认
                $('#subInvoice').unbind('click').bind('click',function(){
                    $.dialog.close($.dialog.id);
                    _self.submitInvoice();
                });
            },
            submitInvoice:function (){
                var _self = this
                Data.setAjax('electronic_invoice', {
                    'card_id': cardId,
                    'cid': Cache.get('getCID'),
                    'pay_id':PayId,
                    'gmf_mc':gmf_mc,
                    'gmf_nsrsbh':gmf_nsrsbh,
                    'email':email,
                    'shop_id':shop_id,
                    'user_id':$.cookie('user_id')
                }, '#layer', '#msg', {20: ''}, function (respnoseText) {
                    if (respnoseText.code == 20) {
                        var data = respnoseText.data;
                        invoiceName = {};
                        invoiceName.gmf_mc = gmf_mc;
                        invoiceName.gmf_nsrsbh = gmf_nsrsbh;
                        invoiceName.email = email;
                        invoiceName.pdf_url = data.pdf_url;
                        invoiceSp_url = data.sp_url;
                        Cache.set('invoiceName',invoiceName); 
                        Cache.set('invoiceSp_url',invoiceSp_url); 
                        Page.open('invoiceover&card_id='+cardId+'&pay_id='+PayId+'&otherName=pay_id&add_time='+add_time+'&page=orderlist&order_list_type=1&order_property='+order_property)
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },
            //邮箱验证
            isEmail:function (text){
                var reg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,4}$/
                return reg.test(text);
            },
            //判断税号15-20位的数字或者字母
            isParagraph:function (text){
                var reg = /^[0-9a-zA-Z]{15,20}$/;
                return reg.test(text);
            },
            
        };
        invoice.init();
    };
    Invoice.prototype.bindPageEvents = function () {
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

    return Invoice;
});