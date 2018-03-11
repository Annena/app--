define('page/messageDetails', [
	'base/page',
	'base/scrollbar',
	'base/data',
	'base/util',
	'base/cache',
	'base/message',
	'base/image',
	'base/dialog',
	'base/mobile'
], function (Page, Bar, Data, Util, Cache, Message, LoadImage, Dialog, Mobile) {

	var MessageDetails = function () {
		this.back = 'merchantHome&card_id=' + Util.getQueryString('card_id');
	}
	// 消息详情页面
	MessageDetails.prototype = new Page('messageDetails');

	MessageDetails.prototype.bindPageEvents = function () {
		var newsId = Util.getQueryString('news_id');
		var page = Util.getQueryString('page');
		var cardId = Util.getQueryString('card_id');

		$('title').text('新闻详情');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()

		var cid = Cache.get('getCID');
		/*if (Util.getQueryString('cid') != undefined) {
			cid = Util.getQueryString('cid');
		}*/
		// 来源，微信、app、浏览器
		var source = 1;

		var Details = {
			scroll: null,
			article: '',

			init: function (getcid) {
				// 判断微信访问
				this.weixinVisit();
				if (isWeixin) {
					source = 1;
				} else if ($.app.isClient == true) {
					source = 2;
				} else {
					source = 3;
				}
				// 滚动
				this.scroll = Bar('#messageScroll');
	            // 文章访问量
	            this.artcileVisitCount('article', getcid);
				// 获取消息详情数据
				this.getMessageDetails(getcid);
				// 绑定点击事件
				this.messageBind(getcid);
				// 滚动刷新
				this.scroll.refresh();
			},

			// 判断微信访问
	        weixinVisit: function () {
	        	var self = this;
	            if (isWeixin || isAli) {
	            	$('#download').removeClass('hide');
					$('header').addClass('hide');
					// 分享按钮隐藏
					$('#message-share').addClass('hide');
					$('.newscontent-nav').addClass('top45')
	                //$('#messageDetails-frame header').addClass('hide');
	                //$('#messageScroll').css('top', '88px');
	                //document.getElementById('messageScroll').style.cssText = 'top:96px !important';
	                //document.getElementById('messageDetails-header').style.cssText = 'top:45px !important';

	                $('#messageDetails-header').addClass('top35')
                    $('#messageScroll').addClass('top84')
                    
	                $('#download').unbind('click').bind('click', function () {
	                    window.location=phpDownload;
	                });
	            } else {
	            	$('#download').addClass('hide');
					$('header').removeClass('hide');
	                $('#messageDetails-frame header').removeClass('hide');
	            }
	        },

	        // 记录文章访问量
	        artcileVisitCount: function (type, getcid) {
				Data.setAjax('companyWriteNum', {
					'card_id': cardId,
					'news_id': newsId,
					'page_type': type,
					'source': source,
					'cid': getcid
				}, '#layer', '#msg', {20: ''}, function (respnoseText) {
					var data = respnoseText.data;
					if (respnoseText.code == 20) {
					} else {
						Message.show('#msg', respnoseText.message, 2000);
					}
				}, 2);
	        },

			// 获取消息详情数据
			getMessageDetails: function (getcid) {
				var self = this;

				// 请求接口
				Data.setAjax('companyNews', {
					'card_id': cardId,
					'news_id': newsId,
					'cid': getcid
				}, '#layer', '#msg', {20: ''}, function (respnoseText) {
					var data = respnoseText.data;
					if (respnoseText.code == 20) {
						self.article = data;
						// 把获取到的信息填充到页面
						$('#newsTitle').text(data.news_title);
						$('#postTime').text(Util.getLocalDate(data.post_time));
						$('#isImage').text(data.is_image);
						$('#content').html(data.content);
						self.scroll.refresh();
						// 加载文章图片并刷新滚动条
                        $('#content').find('img').each(function() {
                            LoadImage($(this).attr('src'), $(this), function() {
                                self.scroll.refresh();
                            });
                        });
                        if (isWeixin) {
							//$('title').text(data.news_title);
					        // 得到签名数据
					        Data.setAjax('companyShare', {
					            'card_id': cardId,
					            'url': location.href,
					            'cid': getcid
					        }, '#layer', '#msg', {20: ''}, function (respnoseText) {
					            if (respnoseText.code == 20) {
					                var datat = respnoseText.data;
					                setTimeout(function () {
					                	self.wxContent(datat, data);
					                }, 500);
					            } else {
					                Message.show('#msg', respnoseText.message, 2000);
					            }
					        }, 2);
					        
                        }
					} else {
						Message.show('#msg', respnoseText.message, 2000);
					}
				}, 2);
			},

	        // 微信分享内容设置
	        wxContent: function (data, articleData) {
	        	var _self = this;
	        	var content = ($('#content').text()).substring(0, 40);
                // 微信引入JS文件，通过config接口注入权限验证配置
                //alert(1);
                /*debug: true, // 开启调试模式,调用的所有api的返回值会在客户端//alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                appId: '', // 必填，公众号的唯一标识
                timestamp: , // 必填，生成签名的时间戳
                nonceStr: '', // 必填，生成签名的随机串
                signature: '',// 必填，签名，见附录1
                jsApiList: [] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2

                微信js-sdk开发：http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html#.E6.A6.82.E8.BF.B0
                微信js-sdk-demo：http://203.195.235.76/jssdk/#menu-share*/
                //alert(location.href);
                wx.config({
                    debug: false,
                    appId: data.appId,
                    timestamp: data.timestamp,
                    nonceStr: data.nonceStr,
                    signature: data.signature,
                    jsApiList: [
	                    'checkJsApi',           // 判断当前客户端版本是否支持指定JS接口
	                    'onMenuShareTimeline',  // 获取“分享到朋友圈”
	                    'onMenuShareAppMessage',// 获取“分享给朋友”
	                    'onMenuShareQQ',        // 获取“分享到QQ”
	                    'onMenuShareWeibo',     // 获取“分享到腾讯微博”
	                    'onMenuShareQZone',     // 获取“分享到QQ空间”
	                    'scanQRCode',           // 扫描二维码
	                    'getLocation'           // 获取当前地理位置接口
                    ]
                });
		        //alert('1');
                // 微信自定义分享内容和分享结果
                wx.ready(function () {	// 通过ready接口处理成功验证
                	/*
                		title: '', // 分享标题
                		desc: '',  // 分享内容
                		link: '', // 分享链接
					 	imgUrl: '', // 分享图标
					    success: function () { 
					        // 用户确认分享后执行的回调函数
					    },
					    cancel: function () { 
					        // 用户取消分享后执行的回调函数
					    }
                	 */
				 	wx.checkJsApi({
				      jsApiList: [
				        'getNetworkType',
				        'previewImage'
				      ],
				      success: function (res) {
				        //alert(JSON.stringify(res)+'------------------');
				      }
				    });

        			var uid = $.cookie("user_id") ? $.cookie("user_id") : "";
        			var userMobile = $.cookie("user_mobile") ? $.cookie("user_mobile") : "";

                	//alert('ddd');
				  	var shareData = {
						title: articleData.news_title,
					    desc: content,
					    link: window.location.protocol + '//' + window.location.hostname + '/html/index.html?messageDetails&card_id='+cardId+'&news_id='+articleData.news_id+'&page=merchantHome&cid='+Cache.get('getCID')+'&user_id='+uid+'&user_mobile='+userMobile,
					    imgUrl: window.location.protocol + '//' + window.location.hostname + '/'+ 'img/business/'+cardId+'/news/'+articleData.news_id+'.jpg',
					    success: function (res) {
					      //alert('已分享');
					    },
					    cancel: function (res) {
					      //alert('已取消');
					    }
				  	};
				  	wx.onMenuShareAppMessage(shareData);	// 发送给朋友
				  	wx.onMenuShareTimeline(shareData);		// 分享到朋友圈
				  	//wx.onMenuShareQQ(shareData);			// 分享到手机QQ
				  	//wx.onMenuShareQZone(shareData);			// 分享到QQ空间
                });
                wx.error(function (res) {// 通过error接口处理失败验证
				 	//alert(res.errMsg+"??????????");
				});
	        },

			// 绑定点击事件
			messageBind: function (getcid) {
				var self = this;
                // 分享文章
                $('#message-share').unbind('click').bind('click', function () {
					var content = ($('#content').text()).substring(0, 40);
					if (content == '') {
						content = self.article.news_title;
					}
					//alert(content);
                    $.dialog = Dialog({
                        type: 3,
                        dom: '#share-dialog',
                        success: function() {

                            // 分享到微信好友
                            $('#j-share-to-wx').unbind('click').bind('click', function() {
								//alert('ddd');
                                $.dialog.close($.dialog.id);
                                // 文章访问量
                                self.artcileVisitCount('share_article_weixin', getcid);
                                Mobile.articleShare('0', '0', self.article, cardId, content);
                            });

                            // 分享到微信朋友圈
                            $('#j-share-to-wx-circle').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                // 文章访问量
                                self.artcileVisitCount('share_article_wxpyq', getcid);
                                Mobile.articleShare('0', '1', self.article, cardId, content);
                            });

                            // 分享给qq好友
                            $('#j-share-to-qq').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                // 文章访问量
                                self.artcileVisitCount('article', getcid);
                                Mobile.articleShare('1', '0', self.article, cardId, content);
                            });
                        }
                    });
                });
			}
		}

		// 微信打开
		if (isWeixin) {
			// 如果缓冲中没有cid，就调用方法请求接口获取cid
	        if (!Cache.get('getCID')) {
				Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
				    // 获取到的cid放到缓存中
				    Cache.set('getCID', respnoseText.data);
				    Details.init(respnoseText.data);
				}, 1);
			} else {
				Details.init(cid);
			}
		} else {
		    Details.init(cid);
		}

		
	}

	return MessageDetails;
});