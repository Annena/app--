define('page/integralExchangelist', [ /*名称是对应的js文件名*/
    'base/page',
    'base/scrollbar',
    'base/data',
    'base/load',
    'base/util',
    'base/cache',
    'base/message'
], function (Page, Bar, Data, Load, Util, Cache, Message) {

    var Template = function () {
        this.back = 'IntegralCenterlist&card_id=' + Util.getQueryString('card_id');/* 左上角返回的页面地址 */
    };
    // 模板页面
    Template.prototype = new Page('integralExchangelist');/*名称是对应的js文件名*/

    Template.prototype.util = function () {

        // getQueryString 获取到URL里面page的值
        var page = Util.getQueryString('page');
        var cardId = Util.getQueryString('card_id');
        /*if (cardId == undefined) {
            this.back = page;
        } else {
            this.back = page + '&card_id=' + cardId;
        }*/

        // 是否是微信 是否是支付宝
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        // 来源(微信、支付宝、app)
        var trade_type = Util.isWhat();

        var integralData = Cache.get("integralData");//积分累计获取兑换乐币信息


        var Details = {

            init: function () {
                // 判断微信、支付宝访问
                this.visit();
                // 页面初始化
                this.initData();
                // 绑定点击事件
                this.bindClick();
            },

            // 判断、支付宝
            visit: function () {
                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');
                    $('header').addClass('hide');
                    $('#integralExchangelistScroll').addClass('top45');
                    //$('#integralExchange_details').css('padding-top',"60px");

                    $('#download').unbind('click').bind('click', function () {
                        window.location=phpDownload;
                    });
                } else {
                    $('#download').addClass('hide');
                }
            },

            // 请求接口初始化数据
            initData: function () {
                //页面初始化
                var isUserMobile=$.cookie("user_mobile");//判断用户是否登录
                if(isUserMobile){
                    $("#integralResidualIntegral").removeClass("hide");
                    $("#integralExchange-currencyBtn").removeClass("hide");
                    //我的积分账户积分
                    
                    var integralSurplus=integralData.integral_amounm - integralData.integral_consume;//剩余积分
                    $("#integralExchangevaluenmoney").html(parseFloat(integralSurplus));// 剩余积分

                    // 积分余额 - （积分余额 % 积分比例）
                    var integral_use= integralSurplus - (integralSurplus % integralData.integral_exchange_num);// 用多少积分
                    var lecoin_use = integral_use / integralData.integral_exchange_num * integralData.stored_exchange_num;
                    $("#IntegralValue").val(integral_use);
                    $('#exchangecurrencyValue').text(lecoin_use);

                    // 兑换规则显示
                    $("#integralExchangeNum").html(integralData.integral_exchange_num);//用多少积分
                    $("#storedExchangeValue").html(integralData.stored_exchange_num);//可兑换乐币数
                    
                    $("#IntegralValueProportion").html("(只能使用"+integralData.integral_exchange_num+"的倍数兑换)");//可兑换乐币数
                }else{
                    $("#integralResidualIntegral").addClass("hide");
                    $("#integralExchange-currencyBtn").addClass("hide");
                }
            },

            // 积分兑换数据
            initInterExchange: function (IntegralValue , stored_exchange_num) {

                var self = this;
                // 接口名base/config.js配置的

                Data.setAjax('accountIntegralExchange', {
                    'integral_exchange_num':IntegralValue,
                    'stored_exchange_num':stored_exchange_num,
                    'card_id':cardId,
                    'cid': Cache.get('getCID')
                } , '#layer', '#msg', {20: '',200216: '',430209: ''}, function (respnoseText) {
                    if (respnoseText.code == 20) {
                        Message.show('#msg', "兑换成功", 2000, function () {
                            Page.open('IntegralCenterlist&card_id=' + cardId);
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },

            // 绑定点击事件
            bindClick: function () {
                $('#integralExchange-currencyBtn').unbind('click').bind('click', function () {
                    var IntegralValue=parseInt($("#IntegralValue").val());
                    // 可兑换乐币 = 输入的积分 / 兑换规则的积分 * 兑换规则的乐币
                    var lecoin_use = parseInt(IntegralValue / integralData.integral_exchange_num * integralData.stored_exchange_num);

                    if(IntegralValue && IntegralValue >= integralData.integral_exchange_num && lecoin_use%1 === 0){
                        Details.initInterExchange(IntegralValue , lecoin_use);
                    } else {
                        Message.show('#msg', "请按比例输入要兑换的积分", 2000);
                    }
                });

                // 输入积分事件
                $('#IntegralValue').unbind('input').bind('input', function () {
                    // 校验数字
                    Util.checkNum('#IntegralValue', 0);

                    var num = $(this).val();
                    var integralSurplus=integralData.integral_amounm - integralData.integral_consume;//剩余积分
                    if (parseFloat(num) > parseFloat(integralSurplus)) {
                        num = integralSurplus;
                        $('#IntegralValue').val(num);
                    }
                    // 可兑换乐币 = 输入的积分 / 兑换规则的积分 * 兑换规则的乐币
                    var lecoin_use = parseInt(num / integralData.integral_exchange_num * integralData.stored_exchange_num);
                    
                    if(num && num >= integralData.integral_exchange_num && lecoin_use%1 === 0){
                        $('#exchangecurrencyValue').text(lecoin_use);
                    }else{
                        $('#exchangecurrencyValue').text(0);
                    }
                });
            }
        }

        Details.init();

    };

    Template.prototype.bindPageEvents = function () {
        var self = this;

        self.util();
    };

    return Template;
});