define('page/takeaway', [
	'base/page',
	'base/scrollbar',
	'base/data',
	'base/util',
	'base/cache',
	'base/message',
	'base/mobile',
	'base/dialog'
], function (Page, Bar, Data, Util, Cache, Message, Mobile, Dialog) {

    //alert(cardId);
	var takeaway = function () {
		//alert(cardId);
		this.back = 'merchantHome&card_id='+ Util.getQueryString('card_id');
	}
	
	// 外卖自提页面
	takeaway.prototype = new Page('takeaway');

	takeaway.prototype.util = function () {

		// 订单属性： order_property	堂食1 外卖2 打包3 商城配送4


        // 判断如果url链接里面有cid就从url里面取，否则就是用缓存里面的
        var cid = Cache.get('getCID');
        if (Util.getQueryString('cid') != undefined) {
            cid = Util.getQueryString('cid');
            Cache.set('getCID', cid);
        }

        var is_ajax = 0;// 是否请求了获取店铺接口
        var is_frequency = 0;// 次数，微信请求不到的次数，如果请求两次还请求不到就展示没有定位的列表

		// 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
		var page = Util.getQueryString('page');
		var cardId = Util.getQueryString('card_id');

		var shop_id_2 = '';// 外卖只有一个店的shopid
		var open_time_2 = '';
		var close_time_2 = '';
		var dinner_time_type_2 = 0;
		var dinner_time_offset_2 = 0;
		var minimum_pack_2 = 0;
		var minimum_store_2 = 0;
		var minimum_takeout_2 = 0;

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()

        var shopcardname = Cache.get('shop-cardname');
        if (isWeixin) {
			shopcardname = decodeURIComponent(Util.getQueryString('cardname'));
			if (shopcardname == 'undefined' || shopcardname == null) {
				shopcardname = Cache.get('shop-cardname');
			}
        } else {
			// 读取商铺名缓存
			if (shopcardname == null) {
				shopcardname = decodeURIComponent(Util.getQueryString('cardname'));
				Cache.set('shop-cardname', shopcardname);
			}
		}
		$('#shoplist-shopname').text('外卖/自提');
		$('title').text('外卖/自提');

		/*is_shop_order		是否支持餐厅堂食：1是 0否
		is_shop_takeout		是否支持外卖送餐：1是 0否
		is_shop_pack		是否支持门店自取：1是 0否
		is_store_order		是否支持商城现取：1是 0否
		is_store_takeout	是否支持商城配送：1是 0否
		is_store_pack		是否支持商城打包：1是 0否*/
		var company_config = Cache.get('company_config');

		var self = this;

		var ShopChoicePage = {

			listScroll: null,

			init: function () {
				var _self = this;
				if (page != undefined) {
					// 页面返回地址
					self.back = page+'&card_id='+ cardId;
				}

				// 判断是否支持外卖送餐
				if (company_config.is_shop_takeout == 0) {
					$('#default_addresss,#up_addresss').addClass('hide');
					$('#no_up_take').removeClass('hide');
				} else {
					$('#default_addresss').removeClass('hide');
					$('#no_up_take').addClass('hide');
				}
				// 判断是否支持门店自取
				if (company_config.is_shop_pack == 0) {
					$('#shopListMain').addClass('hide');
					$('#no_shop').removeClass('hide');
				} else {
					$('#shopListMain').removeClass('hide');
					$('#no_shop').addClass('hide');
				}

				//是否是客户端 并且 非微信
				if($.app.isClient && !isWeixin && !isAli){
					$('header').removeClass('hide');
					//请求客户端获取到用户位置的经纬度
					Mobile.getlnglat(function(result){
						//alert(JSON.parse(result)['lontitude']);
                        //alert(JSON.parse(result)['latitude']);
                        if(result != 0){
							_self.shopChoiceById(cardId, JSON.parse(result)['lontitude'], JSON.parse(result)['latitude'], 0);
                        } else {
							Message.show('#msg', 'GPS定位失败！请检查是否打开了GPS！', 2000, function () {
								// 跳回商户页面
								Page.open('merchantHome&card_id='+ Util.getQueryString('card_id'));
							});
                        }
					});
				} else {
					//116.5168413680   39.9234408213  金泰国益大厦
					//_self.shopChoiceById(cardId, '', '', 1);
					// 判断微信访问
					var is_flush = Cache.get('is_wx_flush');
					if (is_flush != 1) {
						window.location.reload();
						Cache.set('is_wx_flush', 1);
					}else{
						_self.weixinVisit();
					}
				}


				// 点击事件
				this.shopChoiceBind();
				this.listScroll = Bar($('#shopListScroll')[0], true);
			},

			// 根据商家id获取商家所有门店
			shopChoiceById: function (data, addr_lng, addr_lat, type) {
				var _self = this;
                var type_ajax = 2;
                if (isWeixin) {
					type_ajax = 4;
                }
                is_ajax = 1;
				Data.setAjax('companyShop_takeout', {
					'card_id': data,
					'cid': cid,
					'addr_lng': addr_lng,
					'addr_lat': addr_lat
				}, '#layer', '#msg', {20: ''}, function (respnoseText) {
					if (respnoseText.code == 20) {
						shopcardname = respnoseText.data.card_name;
						if (respnoseText.data == '') {
							// 所有门店信息的显示
							_self.displayData(respnoseText.data.user_addr, type, 2, '', respnoseText.data);
							_self.displayData(respnoseText.data.user_addr, type, 3, '', respnoseText.data);
						} else {
							// 所有门店信息的显示
							_self.displayData(respnoseText.data.user_addr, type, 2, respnoseText.data.shop_list.shop_takeout, respnoseText.data);
							_self.displayData(respnoseText.data.user_addr, type, 3, respnoseText.data.shop_list.shop_pack, respnoseText.data);
						}
					} else {
						shopcardname = '乐卡包';
						Message.show('#msg', respnoseText.message, 2000);
					}
				}, type_ajax);
			},

			// 所有门店信息显示到页面
			displayData: function (user_addr, type, order_property, data, data_main) {
				var content = '';

				var num = 0;// 如果 如果 order_property ==2外卖门店只有一个就显示地址，多个就显示门店 ==2外卖门店只有一个就显示地址，多个就显示门店

				var openTime = '';
				var openTimeM = '';				
				var closeTime = '';
				var closeTimeM = '';
				for (var i in data) {
					if (order_property == 2) {
						shop_id_2 = data[i].shop_id;
						open_time_2 = data[i].open_time;
						close_time_2 = data[i].close_time;
						dinner_time_type_2 = data[i].dinner_time_type;
						dinner_time_offset_2 = data[i].dinner_time_offset;
						minimum_pack_2 = data[i].minimum_pack;
						minimum_store_2 = data[i].minimum_store;
						minimum_takeout_2 = data[i].minimum_takeout;
					}
					num++;
					var con = '';
					var img_t = '<img src="../../img/base/take_sj.png">';
					openTime = data[i].open_time.substr(0, 2)
					closeTime = data[i].close_time.substr(0, 2)	
					if(openTime <= '06'){
						openTimeM = '早上'
					}else if(openTime >= '07' && openTime <= '12'){
						openTimeM = '上午'
					}else if(openTime >= '13' && openTime <= '18'){
						openTimeM = '下午'
					}else if(openTime >= '18' && openTime <= '23'){
						openTimeM = '晚上'
					}

					if(closeTime <= '06'){
						closeTimeM = '早上'
					}else if(closeTime >= '07' && closeTime <= '12'){
						closeTimeM = '上午'
					}else if(closeTime >= '13' && closeTime <= '18'){
						closeTimeM = '下午'
					}else if(closeTime >= '18' && closeTime <= '23'){
						closeTimeM = '晚上'
					}
					if(closeTime < openTime){
						closeTimeM = "次日"
					}					
					// 0是客户端
					if (type == 0) {
						if (data[i].addr_lat == '' && data[i].addr_lng == '') {
							con = img_t+openTimeM+data[i].open_time.substr(0, 5)+'-'+closeTimeM+data[i].close_time.substr(0, 5);
						} else {
							var distance = 0;
							if (data[i].distance < 0.1) {
								distance = '<0.1';
							} else {
								distance = data[i].distance.toFixed(1);
							}
							con = '<span class="distanceLeft">'+img_t+openTimeM+data[i].open_time.substr(0, 5)+'-'+closeTimeM+data[i].close_time.substr(0, 5)+'</span>'+
				                '<span class="distance">距离<b>'+distance+'</b>km</span>';
				        }
					} else {
						con = img_t+openTimeM+data[i].open_time.substr(0, 5)+'-'+closeTimeM+data[i].close_time.substr(0, 5);
					}

					content += '<div class="shoplist-list-floor" data-type="shopChoice" d_shop_id="'+data[i].d_shop_id+'" shop-id="'+data[i].shop_id+'" shop-name="'+data[i].shop_name+'" open_time="'+data[i].open_time+'" close_time="'+data[i].close_time+'" dinner_time_type="'+data[i].dinner_time_type+'" dinner_time_offset="'+data[i].dinner_time_offset+'" minimum_pack="'+data[i].minimum_pack+'" minimum_store="'+data[i].minimum_store+'" minimum_takeout="'+data[i].minimum_takeout+'">'+
				                    '<div class="shoplist-pitch">'+
				                        '<div class="shoplist-list">'+
				                            '<div class="shoplist-border">'+
				                                '<div class="shoplist-left">'+
				                                    '<div class="shoplist-list-title">'+data[i].shop_name+'<span class="shoplist-youjiantou"><span>'+'</div>'+
				                                    '<div class="shoplist-status-tell"><img src="../../img/base/take_dh.png"><a data-type="tel" href="tel:'+ data[i].shop_tel +'">'+data[i].shop_tel+'</a></div>'+
				                                    '<div class="shoplist-status-tell ma_bo"><div class="shoplist-addr-title"><img src="../../img/base/take_dzz.png"></div><div class="shoplist-addr-content">'+data[i].shop_province+data[i].shop_city+data[i].shop_area+data[i].shop_addr+'</div></div>'+
				                                '</div>'+
				                            '</div>'+
				                            '<span class="hide" data-type="shop_type_info">'+data[i].shop_type_info+'</span>'+
				                            '<div class="shoplist-status">'+
				                            	'<div class="shoplist-status-txt">'+
				                            		con+
				                            	'</div>'+
				                            '</div>'+
				                        '</div>'+
				                    '</div>'+
				                '</div>';
				}

				if (order_property == 3) {
					// 添加到页面中
					$('#shopListMain').html(content);
				} else if ($.cookie("user_mobile")) {
					if (user_addr != undefined) {
						Cache.set('user_addr', user_addr);
					} else {
						Cache.del('user_addr');
					}
				}

				if (data_main == '' || data == '' || data == undefined) {
					if (order_property == 2) {
						$('#default_addresss,#up_addresss').addClass('hide');
						$('#no_up_take').removeClass('hide');
					} else {
						$('#shopListMain').addClass('hide');
						$('#no_shop').removeClass('hide');
					}
				} else if (num != 1 && order_property == 2) {
					$('#up_take').addClass('hide');
					$('#up_shop').removeClass('hide');
					$('#up_shopListMain').html(content);
				} else if (num == 1 && order_property == 2) {
					// var data = [{'user_name': '','user_tel': '1382597415', 'user_addr': 'sfjdskfj'}, {'user_name': '张三','user_tel': '1382597415', 'user_addr': 'sfjdskfj'}];
					// Cache.set("mod_data", data)
					var Data = Cache.get('mod_data');
					// 没有默认地址就隐藏，有则显示
					if(Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
						if(!Data) {
							$('#default_address').addClass('hide');
							$('#ad_address').removeClass('hide');
							return;
						} else {
							var userData = Data[0];
							$('#default_address').removeClass('hide');
							// 没有姓名则隐藏，并将手机号往前移动样式
							if (userData.user_name == '') {
								$('#user_name').addClass('hide');
								$('#user_tel').removeClass('add_def_phone').addClass('add_def_name');
							} else {
								$('#user_name').text(userData.user_name);
							}
							$('#user_tel').text(userData.user_tel);
							$('#user_addr').text(userData.user_addr);
						}
					} else {
						if (user_addr == '') {
							$('#default_address').addClass('hide');
							$('#ad_address').removeClass('hide');
						} else {
							Cache.set('user_addr', user_addr);
							$('#default_address').removeClass('hide');
							// 没有姓名则隐藏，并将手机号往前移动样式
							if (user_addr.user_name == '') {
								$('#user_name').addClass('hide');
								$('#user_tel').removeClass('add_def_phone').addClass('add_def_name');
							} else {
								$('#user_name').text(user_addr.user_name);
							}
							$('#user_tel').text(user_addr.user_tel);
							$('#user_addr').text(user_addr.user_addr);
						}
					}

				}

				// 刷新滚动
				this.listScroll.refresh();
			},

	        // 判断微信访问
	        weixinVisit: function () {
	        	var _self = this;
	            if (isWeixin || isAli) {
	                $('#download').removeClass('hide');
					$('header').addClass('hide');
					//  $('.shoplist-title').addClass('hide');

	                //$('#shopChoice-frame header').addClass('hide');

	                //$('#dishes-content').css('top', '0');
	                
	                //document.getElementById('shopListScroll').style.cssText = 'top:108px !important';
	                //document.getElementById('shopChoice-header').style.cssText = 'top:45px !important';

	                $('#shopChoice-header').addClass('top35')
                    $('#shopListScroll').addClass('top98')
					$('.shoplist-nav').addClass('top45')
	                $('.pg-shopChoice div[data-id="scroller"]').css('padding-bottom','100px');
                	// 分享按钮隐藏
                	$('#shopChoice-share').addClass('hide');

	                $('#download').unbind('click').bind('click', function () {
	                    window.location=phpDownload;
	                });

	                if (isWeixin) {
				        // 得到签名数据
				        Data.setAjax('companyShare', {
				            'card_id': cardId,
				            'url': location.href.split('#')[0],
				            'cid': cid
				        }, '#layer', '#msg', {20: ''}, function (respnoseText) {
				            if (respnoseText.code == 20) {
				                var data = respnoseText.data;
				                //alert(data.signature+'-----1');
				                //setTimeout(function () {
				                	_self.wxContent(data);
				                //}, 500);
				            } else {
				                Message.show('#msg', respnoseText.message, 2000);
				                //_self.shopChoiceById(cardId, '', '', 1);
				            }
				        }, 3);
			    	} else {
			    		_self.shopChoiceById(cardId, '', '', 1);
			    	}
			    	
	                //$('title').text('京城特色美食推荐');
	            } else {
	                $('#download').addClass('hide');
					$('header').removeClass('hide');
                	$('#shopChoice-share').removeClass('hide');
	                //$('#shopChoice-frame header').removeClass('hide');
	                _self.shopChoiceById(cardId, '', '', 1, 2);
	            }
	        },

	        // 微信分享内容设置
	        wxContent: function (data) {
	        	var _self = this;
                // 微信引入JS文件，通过config接口注入权限验证配置

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

                // 微信自定义分享内容和分享结果
                wx.ready(function () {	// 通过ready接口处理成功验证

                	// 标题
                	var cardname = shopcardname;
				  	var shareData = {
						title: '京城特色美食推荐',
					    desc: cardname+'店铺列表',
					    link: window.location.protocol + '//' + window.location.hostname + '/html/index.html?shopChoice&card_id='+cardId+'&cardname='+cardname+'&page=merchantHome&cid='+cid+'&user_id='+Util.getQueryString('user_id'),
					    imgUrl: window.location.protocol + '//' + window.location.hostname + '/img/business/' + cardId + '/logo.jpg',
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

				  	// 获取地理位置
					wx.getLocation({
						type: 'wgs84',// 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
				      	success: function (res) {
				      		// res.longitude    res.latitude
				        	//alert('用户授权-----'+res.latitude+'-----'+res.longitude);
				        	var resLoLa = Util.gcj_encrypt(parseFloat(res.latitude), parseFloat(res.longitude));
				        	//console.log(res.latitude +'-----'+ res.longitude);
				        	_self.shopChoiceById(cardId, resLoLa.lon, resLoLa.lat, 0);
				      	},
				      	cancel: function (res) {
				        	//alert('用户拒绝授权获取地理位置');
				        	_self.shopChoiceById(cardId, '', '', 1);
				      	},error: function (res) {
			                //alert(50);
		            	}
				    });
                });
                wx.error(function (res) {// 通过error接口处理失败验证
				 	//alert(res.errMsg+"---??????????");
				 	_self.shopChoiceById(cardId, '', '', 1);
				});

				if (is_frequency == 2 && is_ajax == 0) {
					_self.shopChoiceById(cardId, '', '', 1);
				} else {
	                setTimeout(function () {
	                    if (is_ajax == 0) {
	                    	is_frequency = is_frequency + 1;
	                        _self.wxContent(data);
	                    }
	                }, 2000);
            	}
	        },

			// 点击事件
			shopChoiceBind: function () {
				var _self = this;
				// 点击自提门店
				$('#shopListMain').delegate('div[data-type="shopChoice"]', 'click', function() {
					var self = this,
						shopId = $(this).attr('shop-id'),
						shopName = $(this).attr('shop-name'),
						type = $(event.target).attr('data-type'),
						shop_type_info = $(this).find('span[data-type="shop_type_info"]').text(),
						open_time = $(this).attr('open_time'),
						close_time = $(this).attr('close_time'),
						dinner_time_type = $(this).attr('dinner_time_type'),
						dinner_time_offset = $(this).attr('dinner_time_offset'),
						minimum_pack = $(this).attr('minimum_pack'),
						minimum_store = $(this).attr('minimum_store'),
						minimum_takeout = $(this).attr('minimum_takeout');
					if (type == 'tel') {
						////alert('ddd');
					} else {
						Cache.set('shop_type_info', shop_type_info);
						Cache.set('order_property_temporary', 3);

						// 存储就餐时间、起送金额需要的参数
						var business_time = {
							'open_time': open_time,
							'close_time': close_time,
							'dinner_time_type': dinner_time_type,
							'dinner_time_offset': dinner_time_offset,
							'minimum_pack': minimum_pack,
							'minimum_store': minimum_store,
							'minimum_takeout': minimum_takeout
						}
						Cache.set('business_time', business_time);

						////alert('ttt');
						Page.open('dishes&card_id='+cardId+'&shop_id='+shopId+'&shop_name='+shopName+'&page=takeaway&order_property=3');
					}
				});

				// 点击外卖门店
				$('#up_shopListMain').delegate('div[data-type="shopChoice"]', 'click', function() {
					var self = this,
						shopId = $(this).attr('shop-id'),
						d_shop_id = $(this).attr('d_shop_id'),
						shopName = $(this).attr('shop-name'),
						type = $(event.target).attr('data-type'),
						shop_type_info = $(this).find('span[data-type="shop_type_info"]').text(),
						open_time = $(this).attr('open_time'),
						close_time = $(this).attr('close_time'),
						dinner_time_type = $(this).attr('dinner_time_type'),
						dinner_time_offset = $(this).attr('dinner_time_offset'),
						minimum_pack = $(this).attr('minimum_pack'),
						minimum_store = $(this).attr('minimum_store'),
						minimum_takeout = $(this).attr('minimum_takeout');
					if (type == 'tel') {
						////alert('ddd');
					} else {
						Cache.set('shop_type_info', shop_type_info);
						Cache.set('order_property_temporary', 2);

						// 存储就餐时间、起送金额需要的参数
						var business_time = {
							'open_time': open_time,
							'close_time': close_time,
							'dinner_time_type': dinner_time_type,
							'dinner_time_offset': dinner_time_offset,
							'minimum_pack': minimum_pack,
							'minimum_store': minimum_store,
							'minimum_takeout': minimum_takeout
						}
						Cache.set('business_time', business_time);
						////alert('ttt');
						Page.open('dishes&card_id='+cardId+'&shop_id='+shopId+'&shop_name='+shopName+'&page=takeaway&order_property=2');
					}
				});

				// 点击外卖地址
				$('#default_address').unbind('click').bind('click', function () {
					Cache.set('order_property_temporary', 2);
					// 存储就餐时间、起送金额需要的参数
					var business_time = {
						'open_time': open_time_2,
						'close_time': close_time_2,
						'dinner_time_type': dinner_time_type_2,
						'dinner_time_offset': dinner_time_offset_2,
						'minimum_pack': minimum_pack_2,
						'minimum_store': minimum_store_2,
						'minimum_takeout': minimum_takeout_2
					}
					Cache.set('business_time', business_time);
					Page.open('dishes&card_id='+cardId+'&shop_id='+shop_id_2+'&shop_name=&page=takeaway&order_property=2');
				});

		        // 分享点餐页面
		        $('#shopChoice-share').unbind('click').bind('click', function () {
		            $.dialog = Dialog({
		                type: 3,
		                dom: '#share-dialog',
		                success: function() {
		                    // 分享到微信好友
		                    $('#j-share-to-wx').unbind('click').bind('click', function() {
		                        $.dialog.close($.dialog.id);
		                        Mobile.choiceShare('0', '0', 'wx48c0ba158b071fb7', cardId, shopcardname);
		                    });

		                    // 分享到微信朋友圈
		                    $('#j-share-to-wx-circle').unbind('click').bind('click', function() {
		                        $.dialog.close($.dialog.id);
		                        Mobile.choiceShare('0', '1', 'wx48c0ba158b071fb7', cardId, shopcardname);
		                    });

		                    // 分享给qq好友
		                    $('#j-share-to-qq').unbind('click').bind('click', function() {
		                        $.dialog.close($.dialog.id);
		                        Mobile.choiceShare('1', '0', '', cardId, shopcardname);
		                    });
		                }
		            });
		        });

		        // 点击默认地址
		        $('#default_addresss').unbind('click').bind('click', function () {
		        	// 跳转点菜
		        });

		        // 点击修改地址
		        $('#up_addresss').unbind('click').bind('click', function () {
		        	Page.open('address&card_id='+cardId+'&page=takeaway');
		        });
		        // 点击添加地址
		        $('#ad_address').unbind('click').bind('click', function () {
		        	Page.open('modifAddress&card_id='+cardId+'&page=takeaway&returnWhere=1');
		        });
			}
		}
		ShopChoicePage.init();
	}

	takeaway.prototype.bindPageEvents = function () {
        var self = this;
        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID')) {
                Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
                    // 获取到的cid放到缓存中
                    Cache.set('getCID', respnoseText.data);
                    self.util();
                }, 1);
            } else {
                self.util();
            }
        } else {
            self.util();
        }
	}

	return takeaway;


});