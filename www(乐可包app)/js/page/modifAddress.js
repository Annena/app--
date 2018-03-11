define('page/modifAddress', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/message',
    'base/util',
    'base/dialog'
], function (Page, Data, Pattern, Cache, Message, Util, Dialog){

	var modifAddress = function () {
		//this.back = 'takeaway&card_id='+Util.getQueryString('card_id');
	};

	// 修改地址
	modifAddress.prototype = new Page('modifAddress');

	modifAddress.prototype.util = function () {
		var returnWhere = Util.getQueryString('returnWhere');
		if(returnWhere == 1){
			this.back = 'takeaway&card_id='+Util.getQueryString('card_id'); //从外卖/自提按钮进修改地址跳转
		}else if(returnWhere == 2){
			this.back = 'address&card_id='+Util.getQueryString('card_id');	//从订单支付进修改地址跳转
		}
        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay();

		// 判断微信访问
		weixinVisit();

        // 判断微信访问
        function weixinVisit () {
			var _self = this;
            if (isWeixin || isAli) {
                $('#download').removeClass('hide');
				$('header').addClass('hide');
                $('#shopListScroll').addClass('top84')
                //document.getElementById('login-header').style.cssText = 'top:45px !important';
                $('#shopChoice-header').addClass('top35')
				$('#shopListScroll').addClass('top45')

                $('#download').unbind('click').bind('click', function () {
                    window.location=phpDownload;
                });
            } else {
                $('#download').addClass('hide');
				$('header').removeClass('hide');
            }
        }

		// 获取到URL里面page的值，那是上一个页面的名称，之后赋值给返回，即可返回到上一页面
        var page = Util.getQueryString('page');
		var cardId = Util.getQueryString('card_id');
		var update = Util.getQueryString('update');// update==1 说明是修改过来的
		var modData = Cache.get('mod_data'); //未登录的信息
		var modId = Cache.get('addrId');  //地址的ID
		var payorderAddr = Cache.get('payorder-addr');
		
		if (update == 1) {
			// 显示修改数据
			$('#shoplist-ress,title').html("修改地址")
			if(Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
				for(var i in modData) {
					if(modData[i].record_id == modId) {
						$('#mod_name').val(modData[i].user_name);
						$('#mod_phone').val(modData[i].user_tel);
						$('#mod_address').val(modData[i].user_addr);
					}
				}
			} else {
				addrDate();
			}
			
			// 显示删除按钮
			$('#modif_del').removeClass('hide');
		} else {
			$('#shoplist-ress,title').html("新增地址")
		}

		// 显示修改数据
		function addrDate () {
			Data.setAjax('info_addr', {
				'card_id': cardId,
				'cid': Cache.get('getCID'),
				'record_id': modId, 
			}, '#layer', '#msg', {20: ''}, function (respnoseText) {
				if (respnoseText.code == 20) {
					// 地址数据呈现
					modif_data(respnoseText.data);
				} 
			}, 2);
		}

		function modif_data (data) {
			$('#mod_name').val(data.user_name);
			$('#mod_phone').val(data.user_tel);
			$('#mod_address').val(data.user_addr);

			Cache.del('modId');
		}
		//未登录状态删除
		function delete_mod() {
			var newArr = [];
			for(var i in modData) {
				if(modData.length == 1) {
					Cache.del('mod_data');
					return;
				}
				if(modData[i].record_id != modId) {
					newArr.unshift(modData[i]);
					Cache.set('mod_data', newArr);
				}
			}
		}
        // 点击删除按钮
        $('#modif_del').unbind('click').bind('click', function () {
			// 弹出层让用户是否确认删除
            $.dialog = Dialog({
                type: 2,
                close: false,
                content: '您确定要删除当前地址吗！',
                closeFn: function() {
                	//未登录状态
                	if(Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
                		delete_mod();
                		Message.show('#msg', '地址删除成功', 3000, function() {
                		    Page.open('address&card_id='+cardId);
                		});
                	} else {
						Data.setAjax('delete_addr', {
							'cid': Cache.get('getCID'),
							'card_id': cardId,
							'record_id': modId
						}, '#layer', '#msg', {20: ''}, function (respnoseText) {
							if (respnoseText.code == '20') {
								Cache.del('user_addr');
		                        Message.show('#msg', '地址删除成功', 3000, function() {
		                            Page.open('address&card_id='+cardId);
		                        });
							} else {
		                        Message.show('#msg', respnoseText.message, 2000);
		                    }
						}, 2);
                	}
                }
            });
        });

        // 点击保存并使用
        $('#save_use').unbind('click').bind('click', function () {
			modifOperation();
        });


		// 保存并使用
		function modifOperation () {
			// 获取到联系人、地址
			var mod_name = $('#mod_name').val();
			var mod_phone = $('#mod_phone').val();
			var mod_address = $('#mod_address').val();

			if (dataCheck()) {
				//未登录状态
				if(Cache.get('isLogin') == false || !$.cookie("user_mobile")) {
					var DataValue = {'record_id':new Date().getTime(),'user_name': mod_name, 'user_tel': mod_phone, 'user_addr': mod_address};
					var arr = [];
					// 如果是修改 改变缓存数据
					if(update == 1) {
						delete_mod();
					}
					if(Cache.get('mod_data')) {
						arr = Cache.get('mod_data');
					}
					arr.unshift(DataValue);
					Cache.set('mod_data', arr);
					Message.show('#msg', '保存成功', 2000, function () {
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
						
					});
				}
				// 请求保存接口(登录状态)
				else {
					var url = update ? "update_addr" : "save_addr";
					Data.setAjax(url, {
						'user_name': mod_name,
						'user_tel': mod_phone,
						'user_addr': mod_address,
						'cid': Cache.get('getCID'),
						'card_id': cardId,
						'record_id': modId
					}, '#layer', '#msg', {20: ''}, function (respnoseText) {
						if (respnoseText.code == '20') {
							Message.show('#msg', respnoseText.message, 2000, function () {
								// 跳转到支付页面
								if(payorderAddr) {
									var userAddr = {'user_name': mod_name, 'user_tel': mod_phone, 'user_addr': mod_address};
									Cache.set("user_addr",userAddr);
									Page.open(payorderAddr);
									Cache.del("payorder-addr");
									return;
								}
								// 跳转到外卖自提
								Page.open('takeaway&card_id='+cardId);
							});
						} else {
	                        Message.show('#msg', respnoseText.message, 2000);
	                    }
					}, 2);
				}

			}
		}

        // 校验数据
        function dataCheck() {
            if (Pattern.dataTest('#mod_phone', '#msg', {'empty': '不能为空','Num': '格式错误'})
				) {
                return true;
            }
            return false;
        }
	};

	modifAddress.prototype.bindPageEvents = function () {
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
	};

	return modifAddress;

});

