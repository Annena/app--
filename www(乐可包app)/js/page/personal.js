define('page/personal', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/scrollbar',
    'base/dialog',
    'base/util',
    'base/message',
    'lib/lcalendar'
], function(Page, Data, Pattern, Cache, Bar, Dialog, Util, Message, Lcalendar) {

    var Personal = function() {
        this.back = 'userinfo';
    };
    // 个人信息页面
    Personal.prototype = new Page('personal');

    Personal.prototype.bindPageEvents = function() {

        var user_id = $.cookie('user_id');
        var user_sex = ''; //性别
        var year_time = '';
        var month_time = '';
        var day_time = '';
        var personal_data = {}; // 个人信息数据
         // 判断微信访问
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        $('title').text('个人信息');
        if (isWeixin || isAli) {
            $('header').addClass('hide');
            $('.cooperative-nav').addClass('top10');
        } else {
            $('header').removeClass('hide');
        }

        //缓存信息，如果作出修改，则请求接口，否则不请求
        var cache_user_name = '',
            cache_user_sex = '',
            cache_user_birthday = '';

        var Personal = {
            scroll: null,
            // 初始化
            initialize: function() {
                // 请求个人信息接口
                this.personalData();
                // 绑定点击事件
                this.bindPersonal();
                this.loaded();
                this.xingzuo();
            },
            loaded: function() {
                var _self = this;
                user_sex_scroll = new iScroll($('#user_sex_dig')[0], {
                    vScroll: true,
                    hScroll: false,
                    momentum: true,
                    snap: 'li',
                    vScrollbar: false,
                    bounce: true,
                    onScrollEnd: function() {
                        user_sex = _self.getContent("#user_sex_dig");
                    },
                    onRefresh: function() {
                        user_sex = _self.getContent("#user_sex_dig");
                    },
                });
            },
            //下单日期插件
            getContent: function(ele) {
                var $content = $(ele).find('div');
                var _height = $(ele).find('li').height();
                var tran = $content.css('transform');
                var topArray = [];
                topArray = tran.split(',');
                var top = Math.floor(parseFloat(topArray[5]));
                var num = top / _height - 1;
                $(ele + " li").eq(-num).addClass('current').siblings('li').removeClass();
                return $(ele + " li").eq(-num).text();
            },
            // 请求个人信息接口
            personalData: function() {
                var self = this;
                Data.setAjax('userInfo', {
                    'cid': Cache.get('getCID'),
                    'user_id': user_id
                }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                    if (respnoseText.code == 20) {
                        personal_data = respnoseText.data;
                        // 展示数据
                        self.personalList(respnoseText.data);
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },
            xingzuo: function(m, d) {
                return "魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯".substr(m * 2 - (d < "102223444433".charAt(m - 1) - -19) * 2, 2);
            },
            // 展示数据
            personalList: function(data) {
                var _self = this;
                cache_user_name = data.user_name;
                cache_user_sex = data.user_sex;
                cache_user_birthday = data.user_birthday;
                //user_id :用户id
                // 头像 user_image:头像地址
                // 账户 user_mobile：用户手机号
                $('#user_mobile').val(data.user_mobile);
                // 昵称 user_name:用户昵称
                $('#user_name').val(data.user_name);
                // 性别 user_sex：用户性别 1：男，2：女，3：保密
                if (data.user_sex != 0) {
                    if (data.user_sex == 1) {
                        $('#user_sex').val('男');
                    } else if (data.user_sex == 2) {
                        $('#user_sex').val('女');
                    } else if (data.user_sex == 3) {
                        $('#user_sex').val('保密');
                    }
                }
                // 生日 user_birth day：生日
                if (data.user_birthday != 0) {
                    $('#user_birthday').val(data.user_birthday);
                    $('#user_birthday').next('div').remove();
                    $('#user_constellation_li').removeClass('hide');
                } else {
                    var calendar = new lCalendar();
                    calendar.init({
                        'trigger': '#user_birthday',
                        'type': 'date'
                    });
                    $('#user_constellation_li').addClass('hide');
                }

                var bir_timee = data.user_birthday;
                var tempArre = bir_timee.split("-");
                var mouthe = tempArre[1];
                var daye = tempArre[2];
                $('#user_constellation').val(_self.xingzuo(mouthe, daye) + '座');
            },

            // 绑定点击事件
            bindPersonal: function() {
                var _self = this;
                $('#user_sex').parent('li').unbind('click').bind('click', function() {
                    $.dialog = Dialog({
                        type: 3,
                        dom: '#user_sex_div',
                        close: false,
                        success: function() {
                            user_sex_scroll.refresh();
                            $('#sex_close').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                            });
                            $('#sex_sub').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                $('#user_sex').val(user_sex);
                                $('#user_sex').attr('sex_val');
                            });
                        }
                    });

                });
                $('#user_mobile').parent('li').unbind('click').bind('click', function() {
                    Message.show('#msg', '账号不支持修改噢！', 2000);
                });
                $('#user_birthday').bind("input propertychange", function() {
                    var bir_time = $('#user_birthday').val();
                    var tempArr = bir_time.split("-");
                    var mouth = tempArr[1];
                    var day = tempArr[2];
                    $('#user_constellation').val(_self.xingzuo(mouth, day) + '座');
                });

                $('#user_name').parent('li').unbind('click').bind('click', function() {
                    $('#user_name').focus();
                });
                // 保存按钮的点击事件
                $('#personalSubmit').unbind('click').bind('click', function() {
                    //user_id :用户id

                    // 头像 user_image:头像地址
                    // 昵称 user_name:用户昵称
                    var user_name = $('#user_name').val();
                    if (user_name.length > 20) {
                        Message.show('#msg', '昵称请小于20个字', 2000);
                        return false
                    }
                    // 性别 user_sex：用户性别 1：男，2：女，3：保密
                    var user_sex = $('#user_sex').val();
                    if (user_sex == '男') {
                        user_sex = 1;
                    } else if (user_sex == '女') {
                        user_sex = 2;
                    } else if (user_sex == '保密') {
                        user_sex = 3;
                    } else {
                        user_sex = 0;
                    }
                    // 生日 user_birthday：生日
                    var user_birthday = $('#user_birthday').val();
                    // 星座 user_constellation：星座
                    var user_constellation = $('#user_constellation').val();

                    // if (user_birthday != cache_user_birthday || user_name != cache_user_name || user_sex != cache_user_sex) {
                        // 请求修改个人信息
                        Data.setAjax('userUpdateInfo', {
                            'cid': Cache.get('getCID'),
                            'user_id': user_id,
                            'user_image': '',
                            'user_name': user_name,
                            'user_sex': user_sex,
                            'user_birthday': user_birthday,
                            'user_constellation': user_constellation
                        }, '#layer', '#msg', { 20: '' }, function(respnoseText) {
                            if (respnoseText.code == 20) {
                                Message.show('#msg', '保存成功', 2000);
                            } else {
                                Message.show('#msg', respnoseText.message, 2000);
                            }
                        }, 2);
                    /*} else {
                        Page.open('userinfo');
                    }*/
                });
            }
        };
        Personal.initialize();
    };
    return Personal;
});