define('base/dialog', function () {

    var Dialog = function(setting) {
        this.config = $.extend({}, this.config, setting);
        this.create();
    };

    Dialog.prototype.config = {
        type: 1,                            // 弹出层类型, 1: alert, 2: confirm, 3: other, 4
        close: true,                        // 是否点击弹出框以外的区域可以关闭弹出框
        title: '系统提示',                   // 标题
        content: '',                        // 内容
        dom: '',                            // 弹出框内容
        frame: '',                          // 所属页面
        success: function() {},             // 创建成功
        closeFn: function() {},             // 关闭回调函数
        cancelFn: function() {},            // 取消回调函数
        layerFn: function() {},             // 关闭遮蔽层回调函数
        btn: ['取消', '确定'],               // 按钮
        only_close_layer: false             // 只关闭弹出层
    };

    // 创建弹出框
    Dialog.prototype.create = function() {

        this.config.layer = $.app ? $('.app_layer', '#' + $.app.localPage + '-frame') : $('#app_layer');

        var config = this.config;

        this.id = new Date().getTime();

        var button;

        switch (config.type) {
            case 1:
                button = '<div class="dg__center__btn">'+ config.btn[0] +'</div>';
                break;
            case 2:
                button = '<div class="dg__left__btn">'+ config.btn[0] +'</div><div class="dg__right__btn">'+ config.btn[1] +'</div>';
                break;
            case 3:
                $(config.dom).removeClass('hide');
                break;
            case 4:
                $(config.dom).removeClass('hide');
                break;
        }

        if (config.type == 1 || config.type == 2) {
            this.html = $('<div class="dg" id="dg-' + this.id + '">'+
                '<div class="dg__title">' + config.title + '</div>' +
                '<div class="dg__content">'+ config.content +'</div>' +
                '<div class="btn_box btn__box' + config.type + '">' + button + '</div>' +
            '</div>');
        }

        // 显示遮蔽层
        $.fn.dialog = true;
        config.layer.removeClass('hide');

        // 确定框
        if (config.type == 1 || config.type == 2) {
            $('body').append(this.html);
            this.html.css('margin-top', -(this.html.height() / 2));
        }

        if (config.type == 3) {
            $(config.dom).attr('data-id', 'dg-'+ this.id).show();
        }

        this.bindEvents();
    };

    // 绑定事件
    Dialog.prototype.bindEvents = function() {
        var that = this;

        // console.log(this);

        // 创建成功
        if (this.config.success) {
            this.config.success();
        }

        switch (this.config.type) {
            case 1:
                this.closeBtn = this.html.find('.dg__center__btn');
                break;
            case 2:
                this.closeBtn = this.html.find('.dg__right__btn');
                this.cancelBtn = this.html.find('.dg__left__btn');
                break;
            case 3:
                this.closeBtn = $(this.config.dom).find('[data-type="close"]');
                break;
        }

        if (this.config.type != 4) {
            // console.log(this.closeBtn[0]);

            // 关闭
            setTimeout(function() {
                that.closeBtn.unbind('click').bind('click', function() {

                    // alert('关闭');
                    that.close(that.id);

                    if (that.config.closeFn) {
                        that.config.closeFn();
                    }

                });
            }, 300);
        }

        if (this.config.type == 2) {
            // 取消
            setTimeout(function() {
                that.cancelBtn.unbind('click').bind('click', function() {

                    // alert('取消');
                    that.close(that.id);

                    if (that.config.cancelFn) {
                        that.config.cancelFn();
                    }

                });
            }, 300);

        }

        // 点击空白区域关闭弹出层
        setTimeout(function() {
            that.config.layer.unbind('click').bind('click', function() {
                if (that.config.close == true) {

                    if (that.config.layerFn) {
                        that.config.layerFn();
                    }

                    if (that.config.type != 4) {
                        that.close(that.id);
                    }

                }
            });
        }, 500);

    };

    // 关闭
    Dialog.prototype.close = function(index) {

        var config = this.config;

        if (config.only_close_layer == false) {
            if (config.type == 1 || config.type == 2) {
                $('#dg-' + index).remove();
            } else if (config.type == 3) {
                $(this.config.dom).removeAttr('data-id').hide();
            }
        }

        // console.log($(config.layer)[0]);

        config.layer.addClass('hide').unbind();
        $.fn.dialog = false;
    }

    return function(setting) {
        return new Dialog(setting);
    }

});
