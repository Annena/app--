define('page/searchBusiness', [
    'base/page',
    'base/scrollbar',
    'base/cache',
    'base/data',
    'base/util',
    'base/click',
    'base/message'
], function (Page, Bar, Cache, Data, Util, Click, Message){

	var SearchBusiness = function () {
	}
	// 首页搜索页面
	SearchBusiness.prototype = new Page('searchBusiness');

	SearchBusiness.prototype.util = function () {


			 // 是否是微信
	 	// var isClient = Util.isClient();
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();
        $('title').text('领卡');
		// console.log(!$.app.isClient&&!isWeixin&&!isAli)
		//是否是客户端 并且 非微信
		if(!$.app.isClient && !isWeixin && !isAli){
			$(".copywrite").removeClass('hide')
		}

        // 如果是微信和支付宝不显示下面的切换条
        if (isWeixin || isAli) {
            $('#foot').addClass('hide');
        } else {
            $('#foot').removeClass('hide');
        }


		var SearchBusinessPage = {

			cardScroll: null,
			hotScroll: null,

			init: function () {
				// 显示浏览历史记录
				//this.browseHistory();
				// 如果缓冲中没有cid，就调用方法请求接口获取cid
		        if (!Cache.get('getCID')) {
		            //alert('dd');
		            // 通过请求PHP获取到cid
		            this.getCid();
		        } else {
					// 显示热门搜索关键词
					this.searchHot();
				}
				// 绑定按钮的点击事件
				this.bindButtonClick();

				// 添加滑动
				this.cardScroll = Bar('#searchresultScroll');
				this.hotScroll = Bar('#searchnavScroll');

			},

			// 显示浏览历史记录
			/*browseHistory: function () {
				//历史记录的div
				var content = '';

				// 下面是把缓存中的历史记录取出来
				var bh = Cache.get('browseHistory');
				// 如果缓存中没有&符号说明就只有一个历史记录
				if (bh.indexOf('&') == -1) {
					content = '<div><li>西北莜面团</li></div>'
				} else {
					content = '<div>';
					// 获取到&符号分割的个数，说明有多少个历史记录
					var t = bh.split("&").length;
					// 循环显示出来
					for (var i = 0;i < t;i++) {
						content += '<li>'+bh.split("&")[i]+'</li>';
					}
					content += '</div>';
				}

				$('#main').html(content);
			},*/

			getCid: function () {
				var self = this;
				Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
            		// 获取到的cid放到缓存中
            		Cache.set('getCID', respnoseText.data);
            		self.searchHot();
        		}, 1);
			},

			// 显示热门搜索关键词
			searchHot: function () {
				var _self = this;
				// 将热门搜索显示出来，搜索结果隐藏
				$('#searchnav').removeClass('hide');
				$('#searchresultScroll').addClass('hide');

				// 请求热门搜索关键词获取接口
				Data.setAjax('searchHot', {
					'cid': Cache.get('getCID')
				}, '#layer', '#msg', {20: '', 200202: ''}, function (respnoseText) {
					if (respnoseText.code == 200202) {
						$('#searchnav').addClass('hide');
					} else if (respnoseText.code == 20) {
						// 显示数据
						_self.searchHotData(respnoseText.data);
					} else {
						Message.show('#msg', respnoseText.message, 2000);
					}
					// 热门搜索关键词点击
					_self.viewContent();
				}, 2);
			},

			// 热门搜索关键词数据显示
			searchHotData: function (data) {
				var content = '<ul>';
				// 颜色热度
				var cardheat = '';

				for (var i in data) {
					if (data[i].card_heat == 1) {
						var cardheatcolor = '';
					};

					if (data[i].card_heat == 2) {
						var cardheatcolor = 'hot-red-color';
					};

					if (data[i].card_heat == 3) {
						var cardheatcolor = 'hot-purple-color';
					};

					if (data[i].card_id == 4) {
						var cardheatcolor = 'hot-pink-color';
					};

					if (data[i].card_id == 5) {
						var cardheatcolor = 'hot-pink-color';
					};

					content += '<li class="'+cardheatcolor+'" data-id="'+data[i].card_id+'">'+data[i].card_name+'</li>';
				}

				content += '</ul>';

				// 热门搜索关键词添加到页面中
				$('#navDisplay').html(content);
				// 刷新滚动
				this.hotScroll.refresh();
			},

			// 绑定按钮的点击事件
			bindButtonClick: function () {
				var self = this;
				
				// 输入框输入值改变进行搜索
				$('#searchMerchants').unbind('input').bind('input', function () {
					if ($('#searchMerchants').val() == '') {
						self.searchHot();
					} else {
						self.searchDate($('#searchMerchants').val());
					}
				});

				// 点击搜索按钮进行搜索
				/*$('#searchBtn').unbind('click').bind('click', function () {
					self.searchDate($('#searchMerchants').val());
				});*/

				// 点击输入框X号清除内容点击事件
				$('#inputDel').unbind('click').bind('click', function () {
					$('#searchMerchants').val('');
				});
			},

			// 搜索请求接口
			searchDate: function (name) {
				var self = this;
				// 将搜索结果显示出来，热门搜索隐藏
				$('#searchresultScroll').removeClass('hide');
				$('#searchnav').addClass('hide');

				// 请求搜索接口
				Data.setAjax('searchCard', {
					'keyword': name,
					'cid': Cache.get('getCID')
				}, '#layer', '#msg', {20: ''}, function (respnoseText) {
					if (respnoseText.code == 20 || respnoseText.code == 200202) {
						// 将搜索结果清空
						$('#resultDisplay').html('');
						// 显示数据
						self.displayDate(respnoseText.data);
					} else {
						Message.show('#msg', respnoseText.message, 2000);
					}
					// 点击商家
					self.viewContent();
				}, 2);
			},

			// 数据的显示
			displayDate: function (data) {
				var content = '';

				for (var i in data) {
					for (var j in data[i]) {
						for (var t in data[i][j]) {

							content += '<nav class="shop" data-type="searchClick" data-id="'+data[i][j][t].card_id+'">'+
					                        '<div class="avatar">'+
					                            '<img src="../img/base/card-full.png" class="j-poi-pic avatar-img">'+
					                        '</div>'+
					                        '<div class="content">'+
					                            '<div>'+data[i][j][t].card_name+'</div>'+
					                            '<p>'+data[i][j][t].card_scope+'</p>'+
					                        '</div>'+
					                    '</nav>';
				        }
					}
				}

				// 搜索结果添加到页面中
				$('#resultDisplay').html(content);
				// 刷新滚动
				this.cardScroll.refresh();
				
			},

			// 点击商家
			viewContent: function () {
				// 点击搜索出来的卡 delegate（为指定的元素添加一个或多个事件）
				// 使用delegate事件可能造成了事件的累计，结果到商户页的时候提示错误Uncaught TypeError: Cannot read property 'zoomMin' of undefined，造成商户页空白，把delegate事件换成on事件就可以了
				$('#resultDisplay').find('nav').on('click', function () {
					var self = this,
						cardID = $(this).attr('data-id');
						//alert(cardID);
					Page.open('merchantHome&card_id='+cardID+'&page=searchBusiness');

				});

				// 点击热门搜索关键词 delegate（为指定的元素添加一个或多个事件）
				$('#navDisplay').delegate('ul li', 'click', function() {
					var self = this,
						cardID = $(this).attr('data-id');
					Page.open('merchantHome&card_id='+cardID+'&page=searchBusiness');

				});
			}

		};

		SearchBusinessPage.init();

	}

	SearchBusiness.prototype.bindPageEvents = function () {
        // 获取到屏幕宽度，赋值给页面
        $('#searchresultScroll').width($.app.body_width);
		this.util();
	}

	return SearchBusiness;

});