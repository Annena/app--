define('page/cooperative', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/scrollbar',
    'base/dialog',
    'base/util',
    'base/message'
], function(Page, Data, Pattern, Cache, Bar, Dialog, Util, Message) {

    var cooperative = function() {
        this.back = 'userinfo';
    };
    // 商户申请使用页面
    cooperative.prototype = new Page('cooperative');

    cooperative.prototype.bindPageEvents = function() {

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
        $('title').text('合作伙伴申请');

        var cooperativePage = {
            scroll: null,
            // 初始化
            initialize: function() {
                if (isWeixin) {
                    $('#cooperative_disp').addClass('hide');
                    $('#cooperative_main').css('top', '0px');
                } else {
                    $('#cooperative_disp').removeClass('hide');
                    $('#cooperative_main').css('top', '50px');
                }
                this.scroll = Bar('#cooperativeScroll');
                cooperativePage.scroll.refresh();
                this.bindEvents();
            },

            bindEvents: function() {
                // 意见反馈 点击提交按钮的时候
                $('#cooperative-btn').unbind('click').bind('click', function() {
                    //$('#cooperative-info').blur();

                    if (cooperativePage.dataCheck()) {
                        /*var Num=""; //生成六位随机数
                        for(var i=0;i<6;i++){ 
                            Num += Math.floor(Math.random()*10);
                        }*/
                        //获取姓名
                        var name = $('#cooperative-name').val();
                        //获取电话
                        var phone = $('#cooperative-phone').val();
                        //获取备注
                        var info = $('#cooperative-info').val();
                        //所在区域
                        var region = $('#cooperative-region').val();
                        //合作区域
                        var hzregion = $('#cooperative-hzregion').val();

                        var content = '(合作伙伴申请)';
                        if (name != '') {
                            content += '姓名：' + name + ';';
                        }
                        if (phone != '') {
                            content += '联系方式：' + phone + ';';
                        }
                        if (region != '') {
                            content += '所在区域：' + region + ';';
                        }
                        if (hzregion != '') {
                            content += '合作区域：' + hzregion + ';';
                        }
                        if (info != '') {
                            content += '个人/合作伙伴简介：' + info + ';';
                        }


                        /*var uuid;   //如果缓存没有就构建，有就传值
                        if(Cache.get('uuid') == null){
                            uuid = Math.floor(new Date().getTime()/1000) + Num;
                        }else{
                            uuid = Cache.get('uuid');
                        }*/

                        Data.setAjax('feedbackPost', {
                            'feedback_type': 3,
                            'contact': phone,
                            'content': content,
                            'cid': Cache.get('getCID')
                        }, '#layer', '#msg', { 200106: '' }, function(respnoseText) {
                            if (respnoseText.code == 200106 || respnoseText.code == 430108) {
                                Message.show('#msg', respnoseText.message, 2000, function() {
                                    $('#cooperative-name').val('');
                                    $('#cooperative-phone').val('');
                                    $('#cooperative-hzregion').val('');
                                    $('#cooperative-region').val('');
                                    $('#cooperative-info').val('');
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
                if ($('#cooperative-phone').val() == '') {
                    Message.show('#msg', '联系方式不能为空', 3000);
                    return false;
                }

                /*if ( Pattern.dataTest('#cooperative-phone', '#msg', { 'empty': '不能为空'}) ) {
                    return true;
                }*/
                return true;
            }

        };

        cooperativePage.initialize();
    };

    return cooperative;

});