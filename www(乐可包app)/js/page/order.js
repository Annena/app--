define('page/order', [
    'base/page',
    'base/dialog',
    'base/message',
    'base/cache',
    'base/data',
    'base/pattern',
    'base/config',
    'base/mobile',
    'base/cacheUpdate',
    'base/util',
    'base/scrollbar',
    'common/editOrder',
    'base/pattern'
], function (Page, Dialog, Message, Cache, Data, Pattern, Config, mobile, Update, Util, Bar, Edit, Pattern) {

    var Order = function () {
        this.back = '';
    };
    
    // 下单输入桌台页面
// 订单的状态要有，例如已暂存状态，还有订单二次支付界面显示的不同要显示订单已经支付的金额
    Order.prototype = new Page('order');

    Order.prototype.bindPageEvents = function () {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

        var parentPage = this;

        var pageOrderId = null;             // 订单号

        var url, orderId, page, type, extraPay = '';
        //当前打开的页面URL缓存（history）是否包含'order='
        if (Cache.get('history').indexOf('order=') == 0) {
            // 解析url,判断返回
            url = Cache.get('history').split('&'),
            orderId = url[0].split('=')[1],
            page = url[1].split('=')[1],
            type = url[2].split('=')[1];

            if (url[3]) {
                extraPay = url[3].split('=')[1];
            }
            //pageOrderId订单号
            pageOrderId = Util.getQueryString('order') || orderId;
        } else {
            // 解析url,判断返回
            url = Cache.get('history').split('&'),
            orderId = url[1].split('=')[1],
            page = url[2].split('=')[1],
            type = url[3].split('=')[1];

            if (url[4]) {
                extraPay = url[4].split('=')[1];
            }
            //pageOrderId订单号
            pageOrderId = Util.getQueryString('order_id') || orderId;
        }

        page = Util.getQueryString('page') || page;
        type = Util.getQueryString('type') || type;
        extraPay = Util.getQueryString('orderpay') || extraPay;

        // 页面返回地址
        parentPage.back = page + '&type=' + type;

        var OrderPage = {

            scroll: null,


            init: function () {
                // 获取订单信息
                this.getOrderInfo(pageOrderId);
                // 绑定点击事件
                this.OrderPageBind();
                // 滚动页面
                this.scroll = Bar($('#orderMain')[0],false);
                // 滚动刷新
                this.scroll.refresh();
            },

            // 获取订单信息
            getOrderInfo: function (orderId) {
                Data.setAjax('orderDetail', {
                    'order_id': orderId,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200: ''}, function(respnoseText) {

                    // 获取到订单的一些信息 并写入页面
                    var data = respnoseText.data;

                    // 滚动刷新
                    this.scroll.refresh();
                }, 1);
            },

            // 绑定点击事件
            OrderPageBind: function () {
                var self = this;

                // 点击提交订单
                $('#ordertijiao').unbind('click').bind('click', function () {
                    self.inputTable();
                });

                // 编辑订单点击事件
                $('#editOrder').unbind('click').bind('click', function () {
                    self.editOrderDishes();
                });

            },

            // 输入桌台（弹出层）
            inputTable: function () {
                var self = this;

                $.dialog = Dialog({
                    type: 3,
                    dom: '#submit-order-dialog',
                    success: function() {

                        // 点击提交按钮（输入桌台）
                        $('#inputtable').unbind('click').bind('click', function () {
                            self.OrderSubmit();
                        });

                        // 点击二维码（桌台）
                        $('#scanningBtn').unbind('click').bind('click', function () {
                            self.scanningDate();
                        });

                        // 点击输入框X号清除内容
                        $('#inputDel').unbind('click').bind('click', function () {
                            $('#changeInput').val('');
                        });

                    }
                });
            },

            // 扫描二维码请求接口
            scanningDate: function () {
                Mobile.scanner('将二维码放入框内', 1, function(result) {

                    this.OrderSubmit();

                });             
            },

            // 提交订单
            OrderSubmit: function () {
                var self = this;
                // 提交订单
                Data.setAjax('saveOrder', data, '#layer', '#msg', {200: '订单提交成功', 1602: '', 1604: ''}, function(respnoseText) {

                    if (respnoseText.status == 200) {

                        // 订单状态发生变化，刷新订单列表
                        Cache.set('is_refresh_orderlist', true);

                        // 订单提交成功后，缓存中存在当前订单信息，就删除订单信息  香锅
                        if (Cache.get('order_id') && Cache.get('order_id') == pageOrderId) {
                            Cache.del('order_id');
                            Update.clearMenuData('allmenu');
                        }

                        Page.open('payorder&order_id=' + pageOrderId);
                    }

                    // 更新菜品数据并跳去点菜页(菜品版本不对)
                    if (respnoseText.status == 1602) {
                        $.dialog = Dialog({
                            type: 1,
                            content: '菜品数据有新版本，更新后请核对您的已点菜品',
                            btn: ['更新'],
                            close: false,
                            closeFn: function() {
                                self.editOrderDishes();
                            }
                        });
                    }

                    // 菜品数据异常（菜品有优惠）
                    if (respnoseText.status == 1604) {
                        $.dialog = Dialog({
                            type: 1,
                            content: '菜品数据异常，请返回修改您的已点菜品',
                            btn: ['确定'],
                            close: false,
                            closeFn: function() {
                                self.editOrderDishes();
                            }
                        });
                    }

                }, 0);
            },

            // 编辑订单
            editOrderDishes: function () {
                // 获取订单详情 接口orderDetail 参数订单id
                Data.setAjax('orderDetail', {
                    'order_id': pageOrderId,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {200: ''}, function(respnoseText) {

                    Edit.initialize(respnoseText.data,'allmenu', 'order');

                }, 1);
            }
        }
        // 更新基础数据（1强制更新，2自动更新）
        Update.updateDataInfo(2);
        OrderPage.init();
    }

    Order.prototype.unload = function () {

    }

    return Order;
});