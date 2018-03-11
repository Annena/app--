define('base/load', [
    'base/data',
    'base/util',
    'base/cache',
    'base/message'
], function (Data, Util, Cache, Message) {

    var listObj = function(content, option) {

        this.content = content;                     // 内容
        this.page = 1;                              // 页面
        this.loading = true;                        // 是否加载
        this.option = option;                       // 选项

        this.fastRefresh = 0;// 这个主要是应对用户快速上拉刷新导致数据重复的问题

        this.contentId = (this.content.split('#'))[1];

        this.myScroll = null;                       // 滚动条对象
        this.ndPullDown = null;                     // 下拉条
        this.pullDownOffset = null;                 // 下拉条高度
    };

    listObj.prototype = {

        //option: this.option,
        //oneAndtwo:1,//滑动的时候，会在没有正常抵用劵的时候返回200203，没有过期抵用劵的时候也会返回200203，所有用这个来标识，当是1的时候说明正常抵用劵没有了就加载过期抵用劵，然后过期抵用劵没有了，就不会再加载了

        // 获取数据
        getlistData: function() {
            var that = this;

            // 第一次请求绑定事件
            if (this.option.url.indexOf('ArticleList') == -1) {
                this.viewContent();
            }

            // 列表没有内容
            if ($(that.content).find('ul').length == 0) {
                //alert('dd');
                var page = {
                    'page': that.page
                };

                var data = $.extend({}, page, this.option.data);
                //alert('ddd');
                // 发送请求并处理结果
                Data.setAjax(that.option.url, data, '#layer', '#msg', {20: ''}, function(respnoseText) {
                    //alert(respnoseText.code);
                    if (respnoseText.code == 20) {
                        that.processData(respnoseText.data);
                    } else if (respnoseText.code == 420214) { // 未支付订单过来没有订单的状态
                        // 不显示未支付订单的那个标题
                        $('#noPayDisplay').addClass('hide');
                        $('#noPayContent').addClass('hide');
                        if (that.option.data.order_list_type != 3) {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    } else if (respnoseText.code == 200201) {
                        $(that.content).find('.defaultBearsBox').removeClass('hide');
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            }
        },

        // 处理订单数据
        processData: function(data) {
                var that = this;
                // 隐藏默认图标
                $(this.content).find('.defaultBearsBox').addClass('hide');

                // 显示下拉刷新
                $(this.content).find('[data-id="pullDown"]').removeClass('hide');

                // 遍历数据并写入
                var ul = '<ul id="' + this.contentId + '_1">' + this.eachData(data) + '</ul>';
                $(this.content).find('[data-id="pullDown"]').after(ul);




                // 查看列表内容
                /*if (this.option.url.indexOf('ArticleList') > 0) {
                    this.viewContent($('#' + this.contentId + '_1'));
                }*/
                this.page++;

                this.loaded($(this.content).find('div[data-id=pullDown]'), 0);

            // this.loaded($(this.content).find('div[data-id=pullDown]'));
                setTimeout(function() {
                    that.myScroll.refresh();
                }, 1000);
        },

        // 刷新数据
        refreshData: function(prompt) {
            var that = this;
            //alert('2');
            var page = {
                'page': 1
            };

            var data = $.extend({}, page, this.option.data);

            Data.loadingData(that.option.url, data, prompt, [20,420214], function(respnoseText) {

                if (respnoseText.code != 20) {
                    Message.show('#msg', respnoseText.message, 2000);
                }

                //console.log(respnoseText.data);

                /*if (respnoseText.data) {
                    $(that.content).find('.defaultBearsBox').addClass('hide');

                    if ($('#' + that.contentId + '_1').length > 0) {
                        $('#' + that.contentId + '_1').html(that.eachData(respnoseText.data));
                        if (that.option.url.indexOf('ArticleList') > 0) {
                            that.viewContent($('#' + that.contentId + '_1'));
                        }
                    } else {
                        var ul = '<ul id="' + that.contentId + '_1">' + that.eachData(respnoseText.data) + '</ul>';
                        $(that.content).find('[data-id="pullDown"]').after(ul);
                    }
                } else {
                    $(that.content).find('ul').remove();
                    $(that.content).find('.defaultBearsBox').removeClass('hide');
                }*/

                if(respnoseText.data){
                    // 重写列表第一块
                    $('#' + that.contentId + '_1').html(that.eachData(respnoseText.data));
                    if (that.option.url.indexOf('ArticleList') > 0) {
                        that.viewContent($('#' + that.contentId + '_1'));
                    }
                }else{
                    $(that.content).find('ul').remove();
                }
                setTimeout(function() {
                    that.myScroll.refresh();
                    //没有数据就显示“未下单”图标
                    if(!respnoseText.data){
                        $(that.content).find('.defaultBearsBox').removeClass('hide');
                    }
                }, 1000);
            }, 'refresh', function() {
                setTimeout(function() {
                    that.myScroll.refresh();
                }, 1000);
            });
        },

        // 加载数据
        loadData: function() {
            var that = this;

            //这个主要是应对用户快速上拉刷新导致数据重复的问题，如果当that.fastRefresh != that.page，那么就去请求接口显示数据，否则请求接口不显示数据
            if (that.fastRefresh != that.page) {
                that.fastRefresh = that.page;

            var page = {
                'page': that.page
            };

            var data = $.extend({}, page, this.option.data);

            Data.loadingData(that.option.url, data, this.option.loading || '#loading', [20, 420214], function(respnoseText) {
                var data = respnoseText.data;

                if (respnoseText.code != 20) {
                    if (that.page > 1) {
                        //Message.show('#msg', '已经到底了！', 2000);
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }

                /*if (respnoseText.code == 200203 || respnoseText.code == 200209) {
                    that.fastRefresh = 0;
                }*/



                // 没有内容停止加载
                if (data == '') {
                    that.loading = false;
                    return;
                }
                /*if (that.option.url == 'voucherList') {
                    //alert('ddd');
                    //alert(that.oneAndtwo);
                    if (that.oneAndtwo != 1) {
                        $(that.content).find('div[data-id="scroller"]').append('<ul id="' + that.contentId + 'Del_' + that.page + '">' + that.eachData(data,that.oneAndtwo) + '</ul>');
                    } else {
                        // 加载内容依次排序
                        $(that.content).find('div[data-id="scroller"]').append('<ul id="' + that.contentId + '_' + that.page + '">' + that.eachData(data,that.oneAndtwo) + '</ul>');
                    }
                } else {*/
                    //alert('bbb');
                    // 加载内容依次排序
                    $(that.content).find('div[data-id="scroller"]').append('<ul id="' + that.contentId + '_' + that.page + '">' + that.eachData(data) + '</ul>');
                //}
                if (that.option.url.indexOf('ArticleList') > 0) {
                    that.viewContent($('#' + that.contentId + '_' + that.page));
                }
                that.page++;

                // 刷新列表滚动条
                setTimeout(function() {
                    that.myScroll.refresh();
                }, 1000);

            }, 'loading');

            }
        },

        loaded: function(down, num) {
            var that = this;
            that.ndPullDown = down;
            that.pullDownOffset = that.ndPullDown[0].offsetHeight;

            that.myScroll = new iScroll($(that.content).find('div[data-id=wrapper]')[0], {
                scrollbarClass: 'myScrollbar',
                topOffset: that.pullDownOffset,
                hideScrollbar: false,
                onScrollMove: function() {

                    if (this.y > 5 && !that.ndPullDown.hasClass('flip')) {
                        //alert('bbb');
                        that.ndPullDown.addClass('flip');
                        that.ndPullDown.find('.pullDownLabel').text('松手开始更新...');
                        this.minScrollY = 0;
                    } else if (this.y < 5 && that.ndPullDown.hasClass('flip')) {
                        //alert('rrr');
                        that.ndPullDown.removeClass();
                        that.ndPullDown.find('.pullDownLabel').text('下拉刷新...');
                        this.minScrollY = -that.pullDownOffset;
                    }
                },
                onScrollEnd: function() {
                    //alert('bb');
                    // 刷新
                    if (that.ndPullDown.hasClass('flip')) {
                        //alert('eeee');
                        that.ndPullDown.addClass('load');
                        // 加上这句代码刷新就不会请求两次接口
                        that.ndPullDown.removeClass('flip');
                        that.refreshData(that.ndPullDown.find('.pullDownLabel'));
                    }

                    // 加载
                    if ( (Math.abs(this.maxScrollY) - Math.abs(this.y) < 1) && this.vScrollbar && that.loading == true) {
                        that.loadData();
                    }

                    // 定位到未读消息
                    if (num == 0) {
                        //alert($('#orderlistContent').find('li div[data-type="Unread"]')[0]);
                        num = 1;
                        if ($('#orderlistContent').find('li div[data-type="Unread"]')[0] != undefined) {
                            that.myScroll.scrollToElement($('#orderlistContent').find('li div[data-type="Unread"]').parent().parent().parent().parent()[0], 100);
                        }
                    }
                },
                onRefresh: function() {
                }
            });
        },

        eachData: function(data) {
        },

        viewContent: function() {
        }

    };

    return listObj;
});
