define('page/storedValueRecordList', [ /*名称是对应的js文件名*/
    'base/page',
    'base/scrollbar',
    'base/data',
    'base/load',
    'base/util',
    'base/cache',
    'base/message'
], function (Page, Bar, Data, Load, Util, Cache, Message) {

    var Template = function () {
        this.back = 'storedValue&card_id=' + Util.getQueryString('card_id') +'&page=merchantHome';/* 左上角返回的页面地址 */
    };
    // 模板页面
    Template.prototype = new Page('storedValueRecordList');/*名称是对应的js文件名*/

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

        //当前页面的页数
        var integralCenterNowPage=1;
        // 初始化
        var Details = {

            scroll: null,

            init: function () {
                Cache.del('storedValueRecordData');
                // 判断微信、支付宝访问
                this.visit();
                // 请求接口初始化积分数据
                // this.initData();

                // 请求接口初始化列表数据
                //this.initlistData();

                //绑定点击事件
                this.bindClick();

                //积分中心标题
                $('#storeValueRecord-title').text('储值记录');
                $('title').text('储值记录');

            },

            // 判断、支付宝
            visit: function () {

                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');
                    $('#download').css('position','relative');
                    $('#download').css('z-index','2');

                    $('header').addClass('hide');
                    $('.storeValueRecordContent #storeValueRecordList').css('top','40px');
                    //$('#IntegralCenter_details').css('padding-top',"60px");

                    $('#download').unbind('click').bind('click', function () {
                        window.location=phpDownload;
                    });
                } else {
                    $('#download').addClass('hide');
                }
            },
            // 绑定点击事件
            bindClick: function () {
                //储值详情点击事件            $('').
                $('#IntegralScroll').on('click','li p[data-type="Det"]',function () {
                    if($(this).find('span').text() != ''){
                        var pay_id = $(this).parent().parent().find('div[data-type="pay_id"]').text();
                        var journal_class = $(this).parent().parent().find('div[data-type="journal_class"]').text();
                        if (journal_class == '') {
                            journal_class = cardId;
                        }
                        Page.open('orderDetails&card_id=' + journal_class +'&thisCard_id=' + cardId + '&pay_id='+ pay_id + '&otherName=pay_id'+'&page=storedValueRecordList'+'&order_list_type=1&order_property=1');
                    }
                });
            }
        };
        //储值记录

        var content = '#storeValueRecordList';


        var data = {
            'card_id': cardId,  // 会员卡id
            'type': 2,
            'cid': Cache.get('getCID')
        };



        function VouchersListObj (content, data) {
            var Vouchers = function() {};

            Vouchers.prototype = new Load(content, {
                url: 'accountUserRecord',
                data: data
            });

            //获取到所有储值记录并展示出来
            Vouchers.prototype.eachData = function(data) {
                var content = '';
                var shopName = '';
                var label_content = '';
                if(data.ct.count <= 0){
                    $('#storeRecord-null').removeClass('hide');
                }
                for (var i in data) {
                    if (i == 'ct') {
                        continue;
                    }
                    var journal_num=data[i].journal_money;   //储值类型

                    var fontColorRedClass="fontColorRed";//储值样式
                    // journal_money 金额   journal_type_name类型 shop_nameq名称

                    if(data[i].journal_type.toString().substring(0,1) == 1 || data[i].journal_type.toString().substring(0,1) == 3){
                        journal_num="+"+journal_num;
                        fontColorRedClass="fontColorRed";
                    }else{
                        journal_num="-"+journal_num;
                        fontColorRedClass="fontColorGreen";
                    }
                    
                    //判断多商户
                    if(data[i].journal_type.toString().substring(0,1) == 2 || data[i].journal_type.toString().substring(0,1) == 4){
                        if (data[i].pay_id == '' || data[i].shop_id == 'ssssssssssss') {
                            label_content = '';
                        } else {
                            label_content = '<span id="Det"> >> </span>';
                        }
                        if(data[i].journal_class.substr(0,2) != 'cc'){
                            shopName = (data[i].shop_name.length > 14 ? data[i].shop_name.substr(0,14)+'...':data[i].shop_name) + label_content;
                        }else{
                            shopName = (data[i].journal_note.length > 14 ? data[i].journal_note.substr(0,14)+'...':data[i].journal_note) + label_content;
                        }
                    }else{
                        if(data[i].journal_note == 's_member'){
                            shopName = '系统导入';
                        } else if(data[i].stored_name != undefined && data[i].stored_name != ''){
                            shopName = data[i].stored_name;
                        } else if (data[i].journal_note == '积分兑换') {
                            shopName = parseInt(data[i].journal_num) +'积分兑换'+data[i].journal_money + '乐币';
                        } else {
                            shopName = '储'+data[i].journal_money + '返' + parseInt(data[i].journal_num) +'积分';
                        }
                        if(data[i].journal_type_name == '退换储值' || data[i].journal_type_name == '扣除储值'){
                            shopName = '';
                        }
                        if(shopName.length >= 15){
                            shopName = shopName.substr(0,14)+'...';
                        }
                    }
                   


                    content += '<li class="storeCenterListTeam clearfix">'+
                                    '<div class="storeRecord-list-left">'+
                                        '<div class="storeRecord-list-left hide" data-type="pay_id">'+data[i].pay_id+'</div>'+
                                        '<div class="storeRecord-list-left hide" data-type="journal_class">'+data[i].journal_class+'</div>'+
                                        '<div class="storeRecord-list-left-top"><span class="typeName">'+data[i].journal_type_name+'</span>'+'<span class="TimeData">'+Util.getLocalTimeDate(data[i].add_time)+'</span></div>'+
                                        '<div><p class="shopName" data-type="Det">'+ shopName +'</p></div>'+
                                    '</div>'+
                                    '<div class="storeRecord-list-right">'+
                                        '<p class="'+fontColorRedClass+'">'+journal_num+'</p>'+
                                    '</div>'+
                                '</li>';
                }
                return content;
            };

            Vouchers.prototype.viewContent = function(dom) {
            };

            return new Vouchers();
        }

        if ($.cookie("user_mobile")) {
            VouchersListObj(content, data).getlistData();
        }

        Details.init();
    };
    Template.prototype.bindPageEvents = function () {
        var self = this;
        self.util();
    };

    return Template;
});