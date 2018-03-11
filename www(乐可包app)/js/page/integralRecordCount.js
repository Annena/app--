define('page/integralRecordCount', [ /*名称是对应的js文件名*/
    'base/page',
    'base/scrollbar',
    'base/data',
    'base/load',
    'base/util',
    'base/cache',
    'base/message'
], function (Page, Bar, Data, Load, Util, Cache, Message) {

    var Template = function () {
        this.back = 'IntegralCenterlist&card_id=' + Util.getQueryString('card_id') +'&page=integralRecordCount';/* 左上角返回的页面地址 */
    };
    // 模板页面
    Template.prototype = new Page('integralRecordCount');/*名称是对应的js文件名*/

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
                Cache.del('integralRecordData');
                // 判断微信、支付宝访问
                this.visit();
                // 请求接口初始化积分数据
                // this.initData();

                // 请求接口初始化列表数据
                //this.initlistData();

                //绑定点击事件
                this.bindClick();

                //积分中心标题
                $('#integralRecord-title').text('积分记录');
                $('title').text('积分记录');

            },

            // 判断、支付宝
            visit: function () {

                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');
                    $('#download').css('position','relative');
                    $('#download').css('z-index','2');

                    $('header').addClass('hide');
                    // $('.integralRecordContent #IntegralScroll').css('margin-top','40px');
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
                //消费点评点击事件            $('').
                $('#IntegralScroll').on('click','li p[data-type="Det"]',function () {
                    if($(this).find('span').text() != ''){
                        var pay_id = $(this).parent().parent().find('div[data-type="pay_id"]').text();
                        Page.open('orderDetails&card_id=' + cardId +'&thisCard_id=' + cardId + '&pay_id='+ pay_id + '&otherName=pay_id8'+'&page=integralRecordCount'+'&order_list_type=1&order_property=1');
                    }
                });
            }
        };
        //积分记录

        var content = '#integralRecordList';


        var data = {
            'card_id': cardId,  // 会员卡id
            'type': 4,
            'cid': Cache.get('getCID')
        };



        function VouchersListObj (content, data) {
            var Vouchers = function() {};

            Vouchers.prototype = new Load(content, {
                url: 'accountUserRecord',
                data: data
            });

            //获取到所有积分并展示出来
            Vouchers.prototype.eachData = function(data) {
                if(data.ct.count <= 0){
                    $('.defaultBearsBox').removeClass('hide');
                }
                var content = '';
                var journalTypeName ='';
                var shopName = '';

                for (var i in data) {
                    if (i == 'ct') {
                        continue;
                    }
                    var journal_num=data[i].journal_num;   //储值类型

                    var fontColorRedClass="fontColorRed";//积分样式
                    // journal_money 金额   journal_type_name类型 shop_nameq名称

                    if(data[i].journal_type.toString().substring(0,1) ==1 || data[i].journal_type.toString().substring(0,1) == 3){
                        journal_num="+"+journal_num;
                        fontColorRedClass="fontColorRed";
                    }else{
                        journal_num="-"+journal_num;
                        fontColorRedClass="fontColorGreen";
                    }

                    //判断多商户
                    // if(data[i].journal_type.toString().substring(0,1) ==2 || data[i].journal_type.toString().substring(0,1) ==4){
                        
                    //     if(data[i].journal_class.substr(0,2) != 'cc'){
                    //         shopName = (data[i].shop_name.length > 14 ? data[i].shop_name.substr(0,14)+'...':data[i].shop_name) + '<span id="Det"> >> </span>';
                    //     }else{
                    //         shopName = (data[i].journal_note.length > 14 ? data[i].journal_note.substr(0,14)+'...':data[i].journal_note) + '<span id="Det"> >> </span>';
                    //     }
                        
                    // }else {
                    //     shopName = data[i].shop_name;
                    // }
                    if(data[i].journal_type.toString().substring(0,1) ==1 || data[i].journal_type.toString().substring(0,1) ==3){
                        if(data[i].journal_note == 's_member'){
                            journalTypeName = '获得积分';
                            shopName = '系统导入';
                        }else if(data[i].pay_id != ''){
                            journalTypeName = (data[i].journal_class == 'pay' ? '账户消费' : '订单点评');
                            shopName = (data[i].shop_name.length > 14 ? data[i].shop_name.substr(0,14)+'...':data[i].shop_name) + '<span id="Det"> >> </span>';
                        }else if(data[i].stored_name != undefined && data[i].stored_name != ''){
                            journalTypeName = '账户储值';
                            shopName = data[i].stored_name;
                        }else{
                            journalTypeName = '新用户领卡';
                            shopName = '新用户领卡赠'+parseInt(data[i].journal_num) +'积分';
                        }
                    }else{
                        journalTypeName = data[i].journal_type_name;
                        shopName = parseInt(data[i].journal_num) +'积分兑换'+data[i].journal_money+'乐币';
                    }

                    if(shopName.indexOf('</span>') == -1 && shopName.length >= 15){
                        shopName = shopName.substr(0,14)+'...';
                    }
                     


                    content += 
                        '<li class="storeCenterListTeam clearfix">'+
                            '<div class="integralRecord-list-left">'+
                                '<div class="integralRecord-list-left hide" data-type="pay_id">'+data[i].pay_id+'</div>'+
                                '<div class="integralRecord-list-left-top"><span class="typeName">'+journalTypeName+'</span>'+'<span class="TimeData">'+Util.getLocalTimeDate(data[i].add_time)+'</span></div>'+                       
                                '<div><p class="shopName" data-type="Det">'+ shopName +'</p></div>'+
                            '</div>'+
                            '<div class="integralRecord-list-right">'+
                                '<p class="'+fontColorRedClass+'">'+parseInt(journal_num)+'</p>'+
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