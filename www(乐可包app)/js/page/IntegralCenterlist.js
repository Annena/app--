define('page/IntegralCenterlist', [ /*名称是对应的js文件名*/
    'base/page',
    'base/scrollbar',
    'base/data',
    'base/load',
    'base/util',
    'base/cache',
    'base/message'
], function (Page, Bar, Data, Load, Util, Cache, Message) {

    var Template = function () {
        this.back = 'merchantHome&card_id=' + Util.getQueryString('card_id') ;/* 左上角返回的页面地址 */
    };
    // 模板页面
    Template.prototype = new Page('IntegralCenterlist');/*名称是对应的js文件名*/

    Template.prototype.util = function () {

        // getQueryString 获取到URL里面page的值
        var page = Util.getQueryString('page');
        var cardId = Util.getQueryString('card_id');
       /* if (cardId == undefined) {
            this.back = page;
        } else {
            this.back = page + '&card_id=' + cardId;
        }*/

        // 是否是微信 是否是支付宝
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        // 来源(微信、支付宝、app)
        var trade_type = Util.isWhat();

        //兑换规则数据
        var integralData = {};


        //当前页面的页数
        var integralCenterNowPage=1;

        var Details = {

            scroll: null,

            init: function () {
                // 滚动条
                this.scroll = Bar('#IntegralCenterScroll');

                Cache.del('integralData');
                // this.scroll = Bar('#getIntegralRuleScroll');
                // 判断微信、支付宝访问
                this.visit();
                // 请求接口初始化积分数据
                this.initData();




                // 请求接口初始化列表数据
                //this.initlistData();
                // 判断用户是否登录
                if (!$.cookie("user_mobile")) {
                    // 显示账户储值信息
                    // this.getStoredDetails();
                    // 显示未登录，隐藏账户信息
                    $('#not_login').removeClass('hide');
                    $('#IntegralCenter_details').addClass('hide');
                } else {
                    // 显示账户信息，隐藏未登录
                    $('#IntegralCenter_details').removeClass('hide');
                    $('#not_login').addClass('hide');
                }
                // 绑定点击事件
                this.bindClick();

                //积分中心标题
                $('#IntegralCenter-title').text('积分');
                $('title').text('积分');
                // this.scroll.refresh();
                this.scroll.refresh();

            },

            // 判断、支付宝
            visit: function () {

                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');

                    $('header').addClass('hide');
                    $('#IntegralCenterlistScroll').addClass('top45');
                    //$('#IntegralCenter_details').css('padding-top',"60px");

                    $('#download').unbind('click').bind('click', function () {
                        window.location=phpDownload;
                    });
                } else {
                    $('#download').addClass('hide');
                }
            },

            // 请求接口初始化积分数据
            initData: function () {
                var self = this;
                self.getIntegralRule();
                // 接口名base/config.js配置的
                Data.setAjax("accountIntegral", {
                    'card_id':cardId,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: '',200216: '',430209: ''}, function (respnoseText) {
                    $('#IntegralRecordcanningBtn').removeClass('hide');
                    if (respnoseText.code == 20 && respnoseText.data.integral_info != [] && respnoseText.data.integral_info != {}) {
                        // 数据渲染页面
                         integralData={
                            'stored_exchange_num':respnoseText.data.integral_info.stored_exchange_num,//兑换多少乐币.is_integral_exchange
                            'is_integral_exchange':respnoseText.data.integral_info.is_integral_exchange,//是否可以兑换
                            'integral_exchange_num':respnoseText.data.integral_info.integral_exchange_num,//多少积分
                            'integral_amounm':respnoseText.data.integral_info.integral_amount,//累计获取金额
                            'integral_consume':respnoseText.data.integral_info.integral_consume,//累计消费金额
                        };
                        Cache.set('integralData', integralData);
                        self.renderMsg(respnoseText.data.integral_info);
                        
                    //1、没有开启积分兑换功能
                    } else if (respnoseText.code == 20 && respnoseText.data.integral_info.is_integral_exchange == 0) {
                        //数据为空时展示   || 未登录时也这样显示
                        $('#getIntegralRule').addClass('active');
                        $('#getIntegralRule').removeClass('noactive');
                        $('#IntegralCenterExchange').addClass('hide');
                        $('#getIntegralRule').css({
                            'text-align': 'left',
                            'padding-left': '16px',
                            'background':'#dfdfdf'
                        });
                        // $('#IntegralCenterExchange').addClass('noactive');
                        // $('#IntegralCenterExchange').removeClass('active');
                        $('#integralExchange_details').addClass('hide');
                        $('.getIntegralRuleContent').removeClass('hide');
                        // $('#IntegralCenterExchange').attr('data-id','noClick');
                    } else if (respnoseText.code != 20) {
                        Message.show('#msg', respnoseText.message, 2000);
                        //数据为空时展示
                        $("#integralExchange_details").addClass("hide");
                    }
                }, 2);
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
                            window.location.reload();
                            // Page.open('IntegralCenterlist&card_id=' + cardId);
                        });
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },


            renderMsg: function (data){

                //累计获取的金额
                $("#IntegralCentervaluenmoney").html(data.integral_amount);

                //累计使用的积分
                $("#IntegralCentersalemoney").html(data.integral_consume);

                //剩余积分
                $("#IntegralCenterbalance").html(data.integral_amount - data.integral_consume);

                //用户是否登录
                var isUserMobile=$.cookie("user_mobile");//判断用户是否登录
                //2、是否显示积分兑换
                if(data.is_integral_exchange == 1){
                    // 开启了积分兑换
                    // 1、判断有兑换规则但是用户未登录
                    if(!$.cookie("user_mobile")){
                        $('#integralResidualIntegral').addClass('hide');
                        $('#integralExchange-currencyBtn').addClass('hide'); 
                        $('#interalExchangeInt').removeClass('hide');                         
                    }

                    var integralSurplus=integralData.integral_amounm - integralData.integral_consume;//剩余积分
                    $("#integralExchangevaluenmoney").html(parseFloat(integralSurplus));// 剩余积分
                    // 积分余额 - （积分余额 % 积分比例）
                    var integral_use= integralSurplus - (integralSurplus % integralData.integral_exchange_num);// 用多少积分
                    var lecoin_use = integral_use / integralData.integral_exchange_num * integralData.stored_exchange_num;
                    $("#IntegralValue").val(parseFloat(integral_use));//默认积分
                    $('#exchangecurrencyValue').text(lecoin_use);

                    // 兑换规则显示
                    $("#integralExchangeNum").html(integralData.integral_exchange_num);//用多少积分
                    $("#storedExchangeValue").html(integralData.stored_exchange_num);//可兑换乐币数
                    // 倍数是1的话不显示提示规则
                    if(integralData.integral_exchange_num != 1){
                       $("#IntegralValueProportion").html("(只能使用"+integralData.integral_exchange_num+"的倍数兑换)");//可兑换乐币数 
                    }

                 }else{
                    //数据为空时展示   || 未登录时也这样显示
                        $('#getIntegralRule').addClass('active');
                        $('#getIntegralRule').removeClass('noactive');
                        $('#IntegralCenterExchange').addClass('hide');
                        $('#getIntegralRule').css({
                            'text-align': 'left',
                            'padding-left': '16px',
                            'background':'#dfdfdf'
                        });

                        $('#integralExchange_details').addClass('hide');
                        $('.getIntegralRuleContent').removeClass('hide');
                 }  
                // }else if(data.is_integral_exchange == 0 && data.stored_exchange_num != 0 && data.integral_exchange_num != 0){
                //     // 没有开户积分兑换功能，但是有规则
                //     $('#integralResidualIntegral').addClass('hide');
                //     $('#integralExchange-currencyBtn').addClass('hide');
                //     // 兑换规则显示
                //     $("#integralExchangeNum").html(integralData.integral_exchange_num);//用多少积分
                //     $("#storedExchangeValue").html(integralData.stored_exchange_num);//可兑换乐币数
                // }else{
                //     //没有开启积分兑换功能，并且没有规则
                //     $("#integralExchange_details").addClass("hide");
                //     $('#getIntegralRule').addClass('active');
                //     $('#getIntegralRule').removeClass('noactive');
                //     $('#IntegralCenterExchange').addClass('noactive');
                //     $('#IntegralCenterExchange').removeClass('active');
                //     $('#integralExchange_details').addClass('hide');
                //     $('.getIntegralRuleContent').removeClass('hide');
                //     $('#IntegralCenterExchange').attr('data-id','noClick');
                // }
                this.scroll.refresh();
            },
            // 绑定点击事件
            bindClick: function () {
                //点击刷新按钮
                $('#newLoad').unbind('click').bind('click', function() {
                    window.location.reload();
                });
                // 未登录，点击页面登陆按钮
                $('#integral_login').unbind('click').bind('click', function() {
                    Cache.set('loginReturn', location.href.split('?')[1]);
                    Page.open('login&page=IntegralCenterlist');
                });
                // 未登录，点击页面注册按钮
                $('#integral_register').unbind('click').bind('click', function() {
                    Cache.set('loginReturn', location.href.split('?')[1]);
                    Page.open('register&page=IntegralCenterlist');
                });

                //判断table页
                //积分获取 
                 $('#getIntegralRule').unbind('click').bind('click', function () {
                    $(this).addClass('active');
                    $(this).removeClass('noactive');
                    $('#IntegralCenterExchange').addClass('noactive');
                    $('#IntegralCenterExchange').removeClass('active');
                    $('#integralExchange_details').addClass('hide');
                    $('.getIntegralRuleContent').removeClass('hide');
                });
                //积分兑换
                $('#IntegralCenterExchange').unbind('click').bind('click', function () {
                    if($(this).attr('data-id') == 'noClick'){
                        event.preventDefault();
                    }else{
                        $(this).addClass('active');
                        $(this).removeClass('noactive');
                        $('#getIntegralRule').addClass('noactive');
                        $('#getIntegralRule').removeClass('active');
                        $('#integralExchange_details').removeClass('hide');
                        $('.getIntegralRuleContent').addClass('hide');
                    }
                    

                });
                //积分记录点击事件
                $('#IntegralRecordCount').unbind('click').bind('click', function () {
                    Page.open('integralRecordCount&card_id=' + cardId + '&page = IntegralCenterlist');
                });
                
                //确定兑换事件
                $('#integralExchange-currencyBtn').unbind('click').bind('click', function () {
                    var msg = '';
                    var IntegralValue=parseInt($("#IntegralValue").val());
                    // 可兑换乐币 = 输入的积分 / 兑换规则的积分 * 兑换规则的乐币
                    var lecoin_use = parseInt(IntegralValue / integralData.integral_exchange_num * integralData.stored_exchange_num);

                    if(IntegralValue && IntegralValue >= integralData.integral_exchange_num && lecoin_use%1 === 0){
                        Details.initInterExchange(IntegralValue , lecoin_use);
                    } else {
                        msg = (IntegralValue>integralData.integral_exchange_num?"请按比例输入要兑换的积分":"满"+integralData.integral_exchange_num +"积分才可兑换哦");
                        Message.show('#msg', msg, 2000);
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

            },
            //积分获取规则数据
            getIntegralRule: function(){
                Data.setAjax('accountIntegralRule', {
                    'card_id':cardId,
                    'cid': Cache.get('getCID')
                } , '#layer', '#msg', {20: '',200216: '',430209: ''}, function (respnoseText) {
                    var data = respnoseText.data;
                    var content = '';
                   // if(data.length == 0){
                   //  $('.integral-icon').addClass('h_order-icon') //按钮变灰
                   //  $('#integralCenter').attr('data-id','noClick'); //按钮标记
                   //  $("#getIntegralRule-null").removeClass('hide');
                   // }
                    for(var i in data){
                        content += 
                        '<li class="getIntegralRuleListTeam clearfix">'+
                        '<div class="getIntegralRule-list-left">'+
                        '<div class="integralRuleRecord-list-left-top"><span class="typeName">'+data[i].title+'</span>'+'<span class="TimeData">'+Util.getLocalTimeDate(data[i].start_time) +'至'+Util.getLocalTimeDate(data[i].end_time)+'</span></div>'+                       
                        '<div><p class="shopName">'+data[i].content +'</p></div>'+
                        '</div>'+
                        '</li>';
                    }
                     $('#getIntegralRuleList ul').append(content);   
                }, 2);
            }
        };

        Details.init();
    };

    Template.prototype.bindPageEvents = function () {
        var self = this;

        self.util();
    };

    return Template;
});