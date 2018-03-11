define('base/message', function () {

    return {

        layer: $('#app_layer'),

        // 显示一条消息
        show: function(dom, description, time, fn) {
            var that = this;

            // 有弹出层时使用当前页面的遮蔽层，没有则使用全局的遮蔽层
            if ($.fn.dialog == true) {
                this.ndAppLayer = $('.app_layer', '#' + $.app.localPage + '-frame');
            } else {
                this.ndAppLayer = this.layer;
            }

            // 如果显示则关闭它
            // if (this.ndAppLayer.is(':visible')) {
            //     that.close();
            // }

            this.ndAppLayer.removeClass('hide');

            // 显示提示消息
            if (dom == '#msg') {

                if ($('#msg').length > 0) {
                    $('#msg').remove();
                }

                $('#j-content').append('<div id="msg" class="msg">'+description+'</div>');

                var left = 0, right = 0, width = $.app.body_width - $(dom).width();
                if (width == 10) {
                    left = right = parseInt($.app.body_width / 8);
                } else {
                    left = width / 2;
                }

                $(dom).css({
                    'margin-left': left,
                    'margin-right': right
                });
            } else {
                $(dom).show();
            }

            if (time !== false) {
                $(dom).fadeOut(time, function() {

                    if (dom == '#msg') {
                        $(this).remove();
                    }

                    if (!$.fn.dialog) {
                        that.close();
                    }

                    if (fn) {
                        fn();
                    }
                });
            }
        },

        // loading
        loading: function(dom, description, time, fn) {
            var that = this;

            if (this.ndAppLayer.is(':visible')){
                that.close();
            }

            $(dom).html(description).show();

            if (time !== false) {
                $(dom).fadeOut(time, function() {
                    $(this).html('');
                    that.close();

                    if (fn) {
                        fn();
                    }
                });
            }
        },

        // 关闭遮蔽层
        close: function() {
            this.ndAppLayer.addClass('hide');
        }
    }

});
