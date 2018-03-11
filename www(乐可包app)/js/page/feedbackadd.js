define('page/feedbackadd', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/scrollbar',
    'base/dialog',
    'base/util',
    'base/message'
], function(Page, Data, Pattern, Cache, Bar, Dialog, Util, Message) {

    var Affiliate = function() {
        this.back = 'userinfo';
    };
    // 商户申请使用页面
    Affiliate.prototype = new Page('feedbackadd');

    Affiliate.prototype.bindPageEvents = function() {
        $('title').text('我要加盟');
        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
        // 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        /*var page = Util.getQueryString('page');
        this.back = page;*/

        // 是否是微信

        var isWeixin = Util.isWeixin();

        var card_id = Util.getQueryString('card_id');

        var AffiliatePage = {
            scroll: null,
            // 初始化
            initialize: function() {
                if (isWeixin) {
                    $('#affiliate_disp').addClass('hide');
                    $('#affiliate_main').css('top', '0px');
                } else {
                    $('#affiliate_disp').removeClass('hide');
                    $('#affiliate_main').css('top', '50px');
                }
                this.scroll = Bar('#affiliateScroll');
                AffiliatePage.scroll.refresh();
                this.bindEvents();
            },

            bindEvents: function() {
                // 有无合适商铺的点击事件
                $("input:radio[name='has_sshop']").unbind('click').bind('click', function () {
                    if ($(this).is(':checked') && $(this).val() == '1') {
                        $('#affiliate-region').removeClass('hide');
                    } else {
                        $('#affiliate-region').addClass('hide');
                    }
                });

                // 意见反馈 点击提交按钮的时候
                $('#affiliate-btn').unbind('click').bind('click', function() {
                    //$('#affiliate-info').blur();

                    if (AffiliatePage.dataCheck()) {
                        /*var Num=""; //生成六位随机数
                        for(var i=0;i<6;i++){ 
                            Num += Math.floor(Math.random()*10);
                        }*/
                        //获取姓名
                        var name = $('#affiliate-name').val();
                        //获取职业
                        var career = $('#affiliate-career').val();
                         //获取年龄
                        var age = $('#affiliate-age').val();
                        //获取电话
                        var phone = $('#affiliate-phone').val();
                        // 投资预算
                        var investment = $('#franchise-area').val();
                        // 开店意向地
                        var position = $('#affiliate-position').val();

                        // 有无餐饮经验
                        var hasExp = $("input:radio[name='has_eepx']:checked").val();//$('.epx_radio[checked]').val(); 
                        // 是否有商铺
                        var hasShop = $("input:radio[name='has_sshop']:checked").val();//$('.shop_radio[checked]').val();
                        // 面积
                        var area = $('#affiliate-region').val();
                        var other = $('#affiliate-info').val();

                        Data.setAjax('feedback_add', {
                            'card_id': card_id,
                            'user_name': name,// 姓名
                            'profession': career,// 职业
                            'age': age,// 年龄
                            'contact': phone,// 联系方式
                            'budget_money': investment,// 投资预算
                            'user_addr': position,// 意向店铺地址
                            'has_experience': hasExp,// 有无经验  0：无，1：有
                            'has_shop': hasShop,// 有无店铺 0：无，1：有
                            'area': area,// 店铺面积
                            'content': other,// 反馈内容
                            'cid': Cache.get('getCID')
                        }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                            if (respnoseText.code == 20 || respnoseText.code == 430108) {
                                Message.show('#msg', respnoseText.message, 2000, function() {
                                    window.location.reload();
                                });
                            } else {
                                Message.show('#msg', respnoseText.message, 2000);
                            }
                        }, 2);
                    }
                });
            },

            // 校验数据
            dataCheck: function() {
                if ($('#affiliate-phone').val() == '') {
                    Message.show('#msg', '联系方式不能为空', 3000);
                    return false;
                }
                /*if ( Pattern.dataTest('#affiliate-phone', '#msg', { 'empty': '不能为空'}) ) {
                    return true;
                }*/
                return true;
            }

        };

        AffiliatePage.initialize();
    };

    return Affiliate;

});