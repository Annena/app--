define('page/affiliate', [
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
    Affiliate.prototype = new Page('affiliate');

    Affiliate.prototype.bindPageEvents = function() {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
        // 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        /*var page = Util.getQueryString('page');
        this.back = page;*/

        $('title').text('商户购买');

        // 是否是微信

        var isWeixin = Util.isWeixin();

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
                        //获取电话
                        var phone = $('#affiliate-phone').val();
                        //获取商户名称
                        var area = $('#affiliate-area').val();
                        //获取备注
                        var info = $('#affiliate-info').val();
                        //店面数量
                        var num = $('#affiliate-num').val();
                        //所在区域
                        var region = $('#affiliate-region').val();
                        //联系人职位
                        var position = $('#affiliate-position').val();

                        var content = '(商户购买)';
                        if (name != '') {
                            content += '姓名：' + name + ';';
                        }
                        if (phone != '') {
                            content += '联系方式：' + phone + ';';
                        }
                        if (area != '') {
                            content += '商户名称：' + area + ';';
                        }
                        if (info != '') {
                            content += '品牌介绍及需求说明：' + info + ';';
                        }
                        if (num != '') {
                            content += '店面数量：' + num + ';';
                        }
                        if (region != '') {
                            content += '所在区域：' + region + ';';
                        }
                        if (position != '') {
                            content += '联系人职位：' + position + ';';
                        }

                        /*var uuid;   //如果缓存没有就构建，有就传值
                        if(Cache.get('uuid') == null){
                            uuid = Math.floor(new Date().getTime()/1000) + Num;
                        }else{
                            uuid = Cache.get('uuid');
                        }*/

                        Data.setAjax('feedbackPost', {
                            'feedback_type': 2,
                            'contact': phone,
                            'content': content,
                            'cid': Cache.get('getCID')
                        }, '#layer', '#msg', { 200106: '' }, function(respnoseText) {
                            if (respnoseText.code == 200106 || respnoseText.code == 430108) {
                                Message.show('#msg', respnoseText.message, 2000, function() {
                                    $('#affiliate-name').val('');
                                    $('#affiliate-phone').val('');
                                    $('#affiliate-area').val('');
                                    $('#affiliate-info').val('');
                                    $('#affiliate-num').val('');
                                    $('#affiliate-region').val('');
                                    $('#affiliate-position').val('');
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