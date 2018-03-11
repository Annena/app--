define('page/feedback', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/scrollbar',
    'base/dialog',
    'base/util',
    'base/message'
], function (Page, Data, Pattern, Cache, Bar, Dialog, Util, Message) {

    
    var FeedbackPage = function () {
        this.back = 'userinfo';
    };
    // 意见反馈页面
    FeedbackPage.prototype = new Page('feedback');

    FeedbackPage.prototype.bindPageEvents = function () {
         // 判断微信访问
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        $('title').text('意见反馈');
        if (isWeixin || isAli) {
             $('header').addClass('hide');
             $('#feedback-content').addClass('top10')
        }else{
             $('header').removeClass('hide');
        }

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/

        /*var returnUrl = Util.getQueryString('return') || (Cache.get('history').split('='))[1];
        if (returnUrl) {
            this.back = returnUrl;
        }*/

        var Feedback = {

            scroll: null,

            // 初始化
            initialize: function() {

                if ($.cookie('user_mobile')) {
                    //alert('tttt');
                    this.getFeedback();
                } else {
                    $('#not-login-show').addClass('hide');
                }

                this.scroll = Bar('#feedback-content');
                this.bindEvents();
            },

            getFeedback: function() {
                //alert('ddd');
                Data.setAjax('feedbackList', {
                    'feedback_type': 1,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: ''}, function(respnoseText) {
                    var data = respnoseText.data;
                    if (respnoseText.code == 20) {
                        if (data) {
                            $('#comment-detail').html(Feedback.processComment(data));
                            Feedback.scroll.refresh();
                        }
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            },

            // 处理评论
            processComment: function(data) {

                var comment = '';
                if (data != '') {
                    $('#comments-info').removeClass('hide');
                    for (var i in data) {
                        /*if (data[i].re_id != 0) {
                            comment += this.addComment(1, data[i].id, data[i].add_time, data[i].admin+'回复', data[i].content);
                        } else {
                            comment += this.addComment(2, data[i].id, data[i].add_time, '我', data[i].content);
                        }*/
                        comment += this.addComment(2, data[i].feedback_id, data[i].add_time, '我', data[i].content);
                    }
                } else {
                    $('#comments-info').addClass('hide');
                }
                Feedback.scroll.refresh();
                return comment;
            },

            // 添加评论
            addComment: function(type, id, time, name, content) {
                //alert('ttt');
                if (time != '刚刚') {
                    time = Util.getLocalTimeDate(time);
                }
                /*return  '<li id="'+id+'">'+
                            '<div class="comment-border">'+
                                '<div class="comment-img"><img src="img/base/photo.png"></div>'+
                                '<div class="comment-title'+(type == 1 ? ' comment-reply-title' : '')+'">'+name+'<span>'+time+'</span></div>'+
                            '</div>'+
                            '<div class="comment-txt">'+content+'</div>'+
                            '<div class="comment-del" data-type="delete">删除</div>'+
                        '</li>';*/
                return '<li id="'+id+'">'+
                            '<div class="comment-border">'+
                                '<div class="comment-img"><img src="../img/base/photo.png"></div>'+
                                '<div class="comment-title">'+name+'<span>'+time+'</span></div>'+
                            '</div>'+
                            '<div class="comment-txt">'+content+'</div>'+
                            '<div class="comment-del" data-type="delete">删除</div>'+
                        '</li>';
            },

            bindEvents: function() {

                // 意见反馈
                $('#feedback-btn').unbind('click').bind('click', function() {
                    $('#feedBack-info').blur();

                    if (Feedback.dataCheck()) {
                        // 未登录必须填写联系方式
                        if (!$.cookie("user_mobile")) {
                            if (!Pattern.dataTest('#feedBack-info', '#msg', { 'empty': '不能为空'})) {
                                return;
                            }
                        }

                        // 联系方式
                        var feedbackPhone = $('#feedback-phone').val();
                        // 反馈内容
                        var content = $('#feedBack-info').val();
                        
                        Data.setAjax('feedbackPost', {
                            'feedback_type': 1,
                            'contact': feedbackPhone,
                            'content': content,
                            'cid': Cache.get('getCID')
                        }, '#layer', '#msg', {20: ''}, function(respnoseText) {
                            if (respnoseText.code == 200106) {
                                Message.show('#msg', respnoseText.message, 2000, function () {
                                    if ($('#comments-info').is(':hidden')) {
                                        $('#comments-info').removeClass('hide');
                                    }
                                    //alert('ddd');
                                    $('#comment-detail').prepend(Feedback.addComment(2, respnoseText.data, '刚刚', '我', content));
                                    Feedback.scroll.refresh();
                                
                                    $('#feedback-phone, #feedBack-info').val('');
                                });
                            } else {
                                Message.show('#msg', respnoseText.message, 2000);
                            }
                        }, 2);
                    }
                });

                $('#comment-detail').delegate('li', 'click', function(event) {
                    var self = this,
                    feedbackId = $(self).attr('id'),
                    type = $(event.target).attr('data-type');

                    // 删除评论
                    if (type == 'delete') {
                        $.dialog = Dialog({
                            type: 2,
                            content: '您确定要删除此反馈吗?',
                            btn: ['取消', '确定'],
                            closeFn: function() {
                                Data.setAjax('feedbackDel', {
                                    'feedback_id': feedbackId,
                                    'cid': Cache.get('getCID')
                                }, '#layer', '#msg', {20: ''}, function(respnoseText) {
                                    if (respnoseText.code == 200205) {
                                        Message.show('#msg', respnoseText.message, 2000, function () {
                                            $(self).remove();
                                            //如果删除评论以后，没有评论了，就把“反馈信息”这个条隐藏
                                            if($('#comment-detail').find('li').size() == 0){
                                                $('#comments-info').addClass('hide');
                                            }
                                            Feedback.scroll.refresh();
                                        });
                                    } else {
                                        Message.show('#msg', respnoseText.message, 2000);
                                    }
                                }, 2);
                            }
                        });
                    }
                });
            },

            // 校验数据
            dataCheck: function() {
                if ( Pattern.dataTest('#feedBack-info', '#msg', { 'empty': '不能为空'})) {
                    return true;
                }
                return false;
            }

        };

        Feedback.initialize();
    };

    return FeedbackPage;

});
