define('page/address', [
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
	var address = function () {
		//alert(cardId);
		var payorderAddr = Cache.get('payorder-addr');
		if(payorderAddr) {
			this.back = payorderAddr;
		} else {
			this.back = 'takeaway&card_id='+ Util.getQueryString('card_id');
		}
		
	}
	
	// 外卖自提页面
	address.prototype = new Page('address');

	address.prototype.util = function () {

        // 判断如果url链接里面有cid就从url里面取，否则就是用缓存里面的
        var cid = Cache.get('getCID');

		// 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
		var page = Util.getQueryString('page');
		var cardId = Util.getQueryString('card_id');
		var modData = Cache.get('mod_data');
		var modId = Cache.get('addrId');
		var payorderAddr = Cache.get('payorder-addr');
		// order_property 堂食1 外卖2 打包3 商城配送4
		var orderPro = Cache.get('order_property_temporary');

		$('title').text('切换地址');

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()
		var self = this;

		var addressPage = {

			listScroll: null,

			init: function () {
				// 判断微信访问
				this.weixinVisit();
				// 显示地址数据
				if(Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
					var self = this;
					var data = Cache.get('mod_data');
					self.addressList(data);
				} else {
					this.addressDate();
				}
				// 点击事件
				this.addressBind();
				this.listScroll = Bar($('#shopListScroll')[0], true);
				if(orderPro == 2) {
					$('#ta_tite_left').text("外卖送餐");
				} else if(orderPro == 3) {
					$('#ta_tite_left').text("门店自取");
				} else if (orderPro == 4) {
					$('#ta_tite_left').text("商城配送");
				}
			},

	        // 判断微信访问
	        weixinVisit: function () {
	        	var _self = this;
	            if (isWeixin || isAli) {
	                $('#download').removeClass('hide');
					$('header').addClass('hide');
	                //$('#shopChoice-frame header').addClass('hide');

	                //$('#dishes-content').css('top', '0');
	                
	                //document.getElementById('shopListScroll').style.cssText = 'top:108px !important';
	                //document.getElementById('shopChoice-header').style.cssText = 'top:45px !important';

	                $('#shopChoice-header').addClass('top35')
					$('#shopListScroll').addClass('top98')

					$('.pg-shopChoice div[data-id="scroller"]').css('padding-bottom','100px');
					// 分享按钮隐藏
					$('#shopChoice-share').addClass('hide');
					$('.shoplist-nav').addClass('top45')
	                $('#download').unbind('click').bind('click', function () {
	                    window.location=phpDownload;
	                });
	            } else {
	                $('#download').addClass('hide');

					$('#shopChoice-share').removeClass('hide');
					$('header').removeClass('hide');
	                //$('#shopChoice-frame header').removeClass('hide');
	            }
	        },

	        // 显示地址数据
	        addressDate: function () {
	        	var self = this;
				Data.setAjax('address_list', {
					'card_id': cardId,
					'cid': cid,
				}, '#layer', '#msg', {20: ''}, function (respnoseText) {
					if (respnoseText.code == 20) {
						// 地址数据呈现
						self.addressList(respnoseText.data);
					} else {
						Message.show('#msg', respnoseText.message, 2000);
					}
				}, 2);
	        },

	        // 地址数据呈现
	        addressList: function (data) {
	        	var content = '';

	        	for (var i in data) {
	        		// 门店自取不显示地址
	        		var user_addr = (orderPro == 3) ? "" : data[i].user_addr;
	        		content += '<div class="add_def_ress"  data-type="update">'+
		                            '<div class="add_def_img"  data-attrId=' + data[i].record_id + ' data-resImg>'+
		                                '<img src="../../img/base/take_xg.png">'+
		                            '</div>'+
		                            '<div class="add_def">'+
		                            	(data[i].user_name == "" ? 
										'<span class="add_def_name" data-type="tel">' + data[i].user_tel + '</span>'
		                            	: 
										'<span class="add_def_name" data-type="name">' + data[i].user_name +'</span>'+
		                                '<span class="add_def_phone" data-type="tel">' + data[i].user_tel + '</span>')+
		                            '</div>'+
		                            '<div class="add_def_re">' + user_addr + '</div>'+
		                        '</div>';
	        	}

	        	$('#address_data').html(content);
	        },

			// 点击事件
			addressBind: function () {
				var _self = this;

				// 点击每个地址
				$('#address_data').delegate('div[data-type="update"]', 'click', function() {
					var addrId = $(this).find('div[data-resImg]').attr('data-attrId');
					// 获取到联系人、地址
					var mod_name = $(this).find('span[data-type="name"]').text();
					var mod_phone =  $(this).find('span[data-type="tel"]').text();
					var mod_address =  $(this).find('.add_def_re').text();

					//未登录状态
					if(Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
						var userAddr = {'user_name': mod_name, 'user_tel': mod_phone, 'user_addr': mod_address};
						Cache.set("user_addr",userAddr);
						// 跳转到支付页面
						if(payorderAddr) {
							Page.open(payorderAddr);
							Cache.del("payorder-addr");
							return;
						}
						// 跳转到外卖自提
						Page.open('takeaway&card_id='+cardId);
							
					} else {
						Data.setAjax('default_addr', {
							'card_id': cardId,
							'cid': cid,
							'record_id': addrId 
						}, '#layer', '#msg', {20: ''}, function (respnoseText) {
							if (respnoseText.code == 20) {
									if(payorderAddr) {
										var userAddr = {'user_name': mod_name, 'user_tel': mod_phone, 'user_addr': mod_address};
										Cache.set("user_addr",userAddr);
										Cache.del("payorder-addr");
										Page.open(payorderAddr);
										return;
									}
									// 跳转到外卖自提
									Page.open('takeaway&card_id='+cardId);

							}
						}, 2);
					}

				});
				// 点击地址的每个图片
				$('#address_data').delegate('div[data-resImg]', 'click', function(event) {
					event.stopPropagation()
					var addrId = $(this).attr('data-attrId');
					Cache.set('addrId', addrId)
					Page.open('modifAddress&card_id='+cardId+'&page=address&update=1&returnWhere=2');
				});

				// 点击取消，跳回外卖自提页面
		        $('#address_exit').unbind('click').bind('click', function () {
		        	var payorderAddr = Cache.get('payorder-addr');
					if(payorderAddr) {
						Page.open(payorderAddr)
					}else{
		        		Page.open('takeaway&card_id='+cardId);
					}
		        });
		        // 点击添加地址
		        $('#ad_address').unbind('click').bind('click', function () {
		        	Page.open('modifAddress&card_id='+cardId+'&page=address&returnWhere=2');
		        });
			}
		}
		addressPage.init();
	}


	address.prototype.bindPageEvents = function () {
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

	return address;


});