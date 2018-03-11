define('page/interfaceTest', [
    'base/page',
    'base/data',
    'base/pattern',
    'base/cache',
    'base/scrollbar',
    'base/message',
    'base/dialog'
], function (Page, Data, Pattern, Cache, Bar, Message, Dialog){

	// 测试接口用的js
	 
	var InterfaceTest = function () {};

	InterfaceTest.prototype = new Page('interfaceTest');

	InterfaceTest.prototype.bindPageEvents = function () {
		var scroll = Bar('#interfaceTestScroll',true);
		scroll.refresh();
		// 卡包首页列表接口测试
		$('#login-btn').unbind('click').bind('click', function () {
				Data.setAjax('cardList', {
					'page': 1,
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {

				}, 1);
		});
		// 搜索商户接口
		$('#sousuo-btn').unbind('click').bind('click', function () {
				Data.setAjax('searchCard', {
					'keyword': $('#sousuo-name').val(),
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});
		// 热门搜索关键词读取接口
		$('#duqu-btn').unbind('click').bind('click', function () {
				Data.setAjax('searchHot', {
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 商户个人页接口
		$('#MerchantHome-btn').unbind('click').bind('click', function () {
				Data.setAjax('companyInfo', {
					'card_id': 'cc1fczgbkoyy',
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 商户所属店铺列表接口
		$('#MerchantShop-btn').unbind('click').bind('click', function () {
				Data.setAjax('companyShop', {
					'card_id': 'cc1fczgbkoyy',
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 商户消息读取接口
		$('#MerchantNews-btn').unbind('click').bind('click', function () {
				Data.setAjax('companyNews', {
					'card_id': 'cc1fczgbkoyy',
					'page': 1,
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 门店菜品信息读取接口
		$('#MerchantMenu-btn').unbind('click').bind('click', function () {
				Data.setAjax('companyMenu', {
					'card_id': 'cc1fczgbkoyy',
					'shop_id': 'ss1fg0nae1ea',
					'page': 1,
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 用户订单列表接口
		$('#orderList-btn').unbind('click').bind('click', function () {
				Data.setAjax('orderList', {
					'card_id': 'cc1fczgbkoyy',
					'page': 1,
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 支付页---读取账户及优惠信息接口
		$('#orderPay_info-btn').unbind('click').bind('click', function () {
				Data.setAjax('orderPay_info', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'shop_id': 'ss1fg0nae1ea',	// 门店id
					'table_id': 'st1fg0nad8nk',	// 桌台id
					'consume': '88.00',				// 订单消费金额
					'sum_menu_num': '1.0',			// 菜品个数，不是份数
					'menu': JSON.stringify([{"menu_id":"sm1fg0nact6m","menu_num":'1.0'}]),	// 菜品
					'order_note': null,				// 订单备注信息，可以为空
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 支付页-提交订单
		$('#orderSubmit-btn').unbind('click').bind('click', function () {
				Data.setAjax('orderSubmit', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'shop_id': 'ss1fg0nae1ea',	// 门店id
					'table_id': 'st1fg0nad8nk',				// 桌台id
					'consume': '88.00',				// 订单消费金额
					'order_note': '尽快',				// 订单备注信息

					'discount_rate': '100',			// 折扣额度
					'money': '88.00',				// 实收金额（折后金额）
					'stored': '88.00',				// 储值账户支付金额 
					'voucher_rid': null,				// 抵用劵账户支付金额 使用抵用券时，提交抵用券的record_id
					'cashier': '0.00',				// 收银台支付金额

					'sum_menu_num': '1.0',			// 菜品个数，不是份数
					'menu': JSON.stringify([{"menu_id":"sm1fg0nact6m","menu_num":'1.0'}]),	// 菜品
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 读取单个订单信息
		$('#orderInfo-btn').unbind('click').bind('click', function () {
				Data.setAjax('orderInfo', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'order_id': 'uo1ffzrrjc6h',	// 订单id
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 发表订单点评
		$('#commentPost-btn').unbind('click').bind('click', function () {
				Data.setAjax('commentPost', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'star_1': '3',	// 评价1
					'star_2': '3',	// 评价2
					'order_id': 'uo1ffzrrjc6h', // 订单号
					'content': '很不错',	// 点评内容
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 读取订单点评
		$('#commentList-btn').unbind('click').bind('click', function () {
				Data.setAjax('commentList', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'order_id': 'uo1ffzrrjc6h', // 订单号
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 删除订单点评
		$('#commentDel-btn').unbind('click').bind('click', function () {
				Data.setAjax('commentDel', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'comment_id': 'uc1fg012fewy', // 订单点评id
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 储值-读取用户账户余额接口
		$('#accountInfo-btn').unbind('click').bind('click', function () {
				Data.setAjax('accountInfo', {
					'card_id': 'cc1fczgbkoyy',
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 进行账户储值
		$('#accountRecharge-btn').unbind('click').bind('click', function () {
				Data.setAjax('accountRecharge', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'stored_code': '5269034855833458', // 储值码
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 用户有效抵用券读取
		$('#voucherList-btn').unbind('click').bind('click', function () {
				Data.setAjax('voucherList', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {20: '',420102: '',42: ''}, function (respnoseText) {
					//$('#tt').html(respnoseText.data);
					/*for(var i in respnoseText.data){
						alert(respnoseText.data[i].voucher_money);
					}*/
				}, 1);
		});

		// 用户无效抵用券读取
		$('#voucherListNO-btn').unbind('click').bind('click', function () {
				Data.setAjax('voucherList', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'is_del': 1,
					'page': 1,
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 领取会员卡
		$('#companyCard-btn').unbind('click').bind('click', function () {
				Data.setAjax('companyCard', {
					'card_id': 'cc1fczgbkoyy',	// 会员卡id
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});

		// 获取cid
		$('#userCid-btn').unbind('click').bind('click', function () {
				Data.setAjax('userCid', {
					'cid': 'ci12345asdfg'
				}, '#layer', '#msg', {200: '',420102: '',42: ''}, function (respnoseText) {
					$('#tt').html(respnoseText.data);
				}, 1);
		});



		var pictureSource;		//图片来源
		var destinationType;		//设置返回值的格式

		pictureSource=navigator.camera.PictureSourceType;
		destinationType=navigator.camera.DestinationType;

		// 捕获的照片
		$('#capturePhoto').unbind('click').bind('click', function () {
			navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
		});
		// 从照片库
		$('#getPhoto1').unbind('click').bind('click', function () {
			navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50, destinationType: destinationType.FILE_URI,sourceType: pictureSource.PHOTOLIBRARY });
		});
		// 采集操作成功完成后的回调函数
		function captureSuccess(mediaFiles) { 
			var i, len; 
			for (i = 0, len = mediaFiles.length; i < len; i += 1) { 
				//uploadFile(mediaFiles[i]); 
				alert(mediaFiles[i]);
			}      
		}
		// 采集操作出错后的回调函数
		function captureError(error) { 
			var msg = 'An error occurred during capture: ' + error.code; 
			navigator.notification.alert(msg, null, 'Uh oh!'); 
		}
		// 从相册
		$('#getPhoto2').unbind('click').bind('click', function () {
			//navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50, destinationType: destinationType.FILE_URI,sourceType: pictureSource.SAVEDPHOTOALBUM, });

			//navigator.device.capture.captureImage(captureSuccess, captureError, {limit: 2});
			//navigator.device.capture.captureVideo(captureSuccess, captureError, {limit: 2});
			navigator.camera.getPicture(
			    function(results) {
			        for (var i = 0; i < results.length; i++) {
			            console.log('Image URI: ' + results[i]);
			        }
			    }, function (error) {
			        console.log('Error: ' + error);
			    }, {
			        maximumImagesCount: 10,
			        width: 800,
			        quality: 50,
			        destinationType: destinationType.FILE_URI,
			        sourceType: pictureSource.SAVEDPHOTOALBUM
			    }
			);

			navigator.camera.getPicture(function(imageData) {
                    //R.drawImage('data:image/jpeg;base64,'+imageData);
                }, function(message) {
                    //$('#release_img_' +index).remove();
                }, {
                    quality: 50,
                    destinationType: navigator.camera.DestinationType.DATA_URL,     // 返回数据类型
                    sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,    // 选择类型
                    correctOrientation: true            // 设置图片显示为正确的方向（不会出现ios手机或android手机图片旋转）
            });
		});
		// 上传文件到服务器
		function uploadFile(mediaFile) {
			var ft = new FileTransfer(),
				path = mediaFile.fullPath, 
				name = mediaFile.name; 
		
			ft.upload(path,"http://my.domain.com/upload.php", 
				function(result) { 
					console.log('Upload success: ' + result.responseCode);
					console.log(result.bytesSent + ' bytes sent'); 
				}, 
				function(error) { 
					console.log('Error uploading file ' + path + ': ' + error.code); 
				}, 
				{ fileName: name });
		}
	   	// 当成功得到一张照片的URI后被调用
	   	function onPhotoURISuccess(imageURI) {
		
			// 取消注释以查看图片文件的URI
			// console.log(imageURI);
			// 获取图片句柄
			var largeImage = document.getElementById('largeImage');
			 
			// 取消隐藏的图像元素
			largeImage.style.display = 'block';
			//alert(imageURI);
			// 显示拍摄的照片
			// 使用内嵌CSS规则来缩放图片
			largeImage.src = 'blob:http://www.lekabao.net/'+imageURI.split("/")[imageURI.split("/").length-1].split('.')[0];
		}
	   	// 当有错误发生时触发此函数
	   	function onFail(mesage) {
			alert('Failed because: ' + message);
	   	}
		// 点击选择图片按钮后存取生成图片路径
		$("#menuPictt").change(function(){
			alert(this.files[0]);
            var objUrl = getObjectURL(this.files[0]) ;
            $('#menuPic').removeClass('hide');

                if (objUrl) {
                    $("#menuPic").attr("src", objUrl) ;
                    $('#menuPic').html('<img style="width:50px;height:50px;" src="'+objUrl+'">');
                }
        });

        //建立一個可存取到該file的url
        function getObjectURL(file) {
            var url = null ;
            if (window.createObjectURL!=undefined) { // basic
                url = window.createObjectURL(file) ;
            } else if (window.URL!=undefined) { // mozilla(firefox)
                url = window.URL.createObjectURL(file) ;
            } else if (window.webkitURL!=undefined) { // webkit or chrome
                url = window.webkitURL.createObjectURL(file) ;
            }
            return url ;
        }




        var imgData = {},
            index = 0,
            max = 9,
            imageLength = 0,
            bodyWidth = $('body').width(),
            liWidth = Math.floor((bodyWidth - 30 - 12 - 8) / 4);

        var R = {

            // 初始化
            initialize: function() {

                // 设置新增按钮高度
                $('#img-list').find('li, li img').css({
                    width: liWidth,
                    height: liWidth
                });

                // 判断是不是客户端
                if ($.app.isClient) {
                    $('#add-mobile-img').show().next('li').hide();
                } else {
                    $('#add-mobile-img').hide().next('li').show();
                }

                this.bindEvents();
            },

            // 绑定事件
            bindEvents: function() {
                this.mobileAddimg();
                this.clientAddimg();
                this.release();
                this.editImage();
            },

            // 手机添加照片
            mobileAddimg: function() {
                $("#add-mobile-img").click(function() {

                    var style = 'style="width:'+liWidth+'px;height:'+liWidth+'px;"';
                    var imageStyle = 'style="width:'+liWidth+
                                            'px;height:'+liWidth+
                                            'px;'+
                                            'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user"><div data-type="img" '+imageStyle+'></div><div class="image_layer hide"></div><div class="image_layer_span hide">x</div></li>');

                    $('##albumcamera').removeClass('hide');
                    /*$.dialog = Dialog({
                        type: 3,
                        dom: '#albumcamera',
                        success: function() {
                            // 拍照
                            $('#camera').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                R.selectMode(navigator.camera.PictureSourceType.CAMERA);
                            });

                            // 选取相册
                            $('#album').unbind('click').bind('click', function() {
                                $.dialog.close($.dialog.id);
                                R.selectMode(navigator.camera.PictureSourceType.PHOTOLIBRARY);
                            });
                        },
                        closeFn: function() {
                            $('#release_img_' +index).remove();
                        },
                        layerFn: function() {
                            $('#release_img_' +index).remove();
                        }
                    });*/

                });

  						// 拍照
                            $('#camera').unbind('click').bind('click', function() {
                                //$.dialog.close($.dialog.id);
                                R.selectMode(navigator.camera.PictureSourceType.CAMERA);
                            });

                            // 选取相册
                            $('#album').unbind('click').bind('click', function() {
                                //$.dialog.close($.dialog.id);
                                R.selectMode(navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
                            });
            },

            // 选择模式
            selectMode: function(mode) {
                navigator.camera.getPicture(function(imageData) {
                    R.drawImage('data:image/jpeg;base64,'+imageData);
                }, function(message) {
                	alert('ddd]');
                    $('#release_img_' +index).remove();
                }, {
                    quality: 50,
                    destinationType: navigator.camera.DestinationType.DATA_URL,     // 返回数据类型
                    sourceType: mode,                   // 选择类型
                    correctOrientation: true            // 设置图片显示为正确的方向（不会出现ios手机或android手机图片旋转）
                });
                scroll.refresh();
            },

            // 电脑添加照片
            clientAddimg: function() {

                $('#release-img').change(function(event) {

                    var files = event.target.files[0];

                    // 没有选择任何图片
                    if (files === undefined) {
                        return;
                    }

                    if (/image\/\w+/.test(files.type)) {
                        if (typeof FileReader == 'undefined') {
                            console.log('不支持FileReader');
                        } else {
                            console.log('支持FileReader');

                            var fileReader = new FileReader();

                            //console.log(fileReader);

                            fileReader.readAsDataURL(files);

                            fileReader.onload = function () {
                                //console.log(this.result);

                                var style = 'style="width:'+liWidth+'px;height:'+liWidth+'px;"';
                                var imageStyle = 'style="width:'+liWidth+
                                                        'px;height:'+liWidth+
                                                        'px;'+
                                                        'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                                $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user"><div data-type="img" '+imageStyle+'></div><div class="image_layer hide"></div><div class="image_layer_span hide">x</div></li>');

                                R.drawImage(this.result);
                            };

                            fileReader.onabort = function() {
                                console.log('abort');
                            };
                            fileReader.onerror = function() {
                                console.log('error');
                            };
                            fileReader.onloadstart = function() {
                                console.log('loadstart');
                            };
                            fileReader.onprogress = function() {
                                console.log('progress');
                            };
                            fileReader.onloadend = function() {
                                console.log('loadend');
                            };
                        }
                    } else {
                        console.log('请上传图片');
                    }
                    scroll.refresh();
                });

            },

            // 压缩图片
            drawImage: function(url) {

                var img = new Image();
                img.src = url;

                img.onload = function() {

                    R.imageDraw(img, 500, 'w', function(big) {

                        // $('#img').attr('src', big);

                        var imgBig = new Image();
                        imgBig.src = big;
                        imgBig.onload = function() {
                            R.imageDraw(imgBig, 100, 's', function(small) {
                                // $('#img1').attr('src', small);

                                var imgSmall = new Image();
                                imgSmall.src = small;
                                imgSmall.onload = function() {
                                    var width = imgSmall.width,
                                        height = imgSmall.height,
                                        left = 0,
                                        top = 0,
                                        size = 0,
                                        scale = parseFloat(width / height).toFixed(2),
                                        divWidth = liWidth + 2,
                                        newWidth = 0,
                                        newHeight = 0;

                                    // console.log(width, height);

                                    if (scale > 0) {
                                        size = height;
                                    } else {
                                        size = width;
                                    }

                                    // console.log(size, divWidth);

                                    var cha = size - divWidth;

                                    // console.log('比例'+scale);

                                    if (scale > 1) {
                                        // console.log('宽大');
                                        if (cha > 0) {
                                            newHeight = divWidth;
                                            newWidth = parseInt((height - cha) * scale);
                                        }
                                    } else if (scale < 1) {
                                        // console.log('宽小');
                                        if (cha > 0) {
                                            newWidth = divWidth;
                                            newHeight = parseInt( (height - cha) / scale);
                                        }
                                    } else {
                                        newWidth = divWidth;
                                        newHeight = divWidth;
                                    }

                                    // console.log(newWidth, newHeight);

                                    if (scale > 1) {
                                        left = parseInt((newWidth - divWidth) / 2);
                                    } else if (scale < 1) {
                                        top = parseInt((newHeight - divWidth) / 2);
                                    }

                                    // console.log(left, top);

                                    R.setImageData(big, small, -left, -top, newWidth, newHeight);
                                };

                            });
                        };

                    });
                };
                scroll.refresh();
            },

            imageDraw: function(img, size, type, fn) {
                // 生成比例
                var width = img.width,
                    height = img.height,
                    scale = width / height;

                //console.log(width, height, scale);

                if (type == 'h') {
                    // 设置图片最大尺寸
                    if (height > size) {
                        height = parseInt(size);
                        width = parseInt(height * scale);
                    }
                } else if (type == 'w') {
                    // 设置图片最大尺寸
                    if (width > size) {
                        width = parseInt(size);
                        height = parseInt(width / scale);
                    }
                } else if (type == 's') {
                    if (width > height) {
                        height = parseInt(size);
                        width = parseInt(height * scale);
                    } else {
                        width = parseInt(size);
                        height = parseInt(width / scale);
                    }
                }

                // 判断浏览器是否支持canvas
                try {
                    document.createElement("canvas").getContext("2d");
                    console.log('支持');
                } catch (e) {
                    console.log('不支持');
                }

                // 创建canvas对象
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');

                // 设置图片宽高
                canvas.width = width;
                canvas.height = height;

                // pc端压缩图片
                context.drawImage(img, 0, 0, width, height);
                var big = canvas.toDataURL('image/jpeg', 0.8);

                // 解决ios4图片变形问题
                if ( navigator.userAgent.match(/iphone/i) ) {
                    var mpImg = new MegaPixImage(img);
                    mpImg.render(canvas, { maxWidth: width, maxHeight: height, quality: 0.8});
                    big = canvas.toDataURL('image/jpeg', 0.8);
                }

                // 修复android（部分android手机不能压缩图片）
                if ( navigator.userAgent.match(/Android/i) ) {
                    var encoder = new JPEGEncoder();
                    big = encoder.encode(context.getImageData(0, 0, width, height), 80 );
                }
                scroll.refresh();
                fn(big);

            },

            // 设置图片显示和上传数据
            setImageData: function(big, small, left, top, width, height) {
                setTimeout(function() {

                    // 加载完的图片替换原有图片
                    $('#release_img_'+index, '#img-list').css({
                        width: liWidth + 2,
                        height: liWidth + 2,
                        border: 'none'
                    }).find('div[data-type="img"]').css({
                        width: liWidth + 2,
                        height: liWidth + 2,
                        background: 'url('+small+') ' + left + 'px ' + top + 'px',
                        backgroundSize: width + 'px ' + height + 'px'
                    }).end().find('div[class^=image_layer]').removeClass('hide');

                    imgData[index] = {
                        big: big.substring(23),
                        small: small.substring(23)
                    };

                    imageLength++;
                    index++;

                    // 最多只能添加9个图片
                    if (imageLength == max) {
                        $('#add-mobile-img').hide().next('li').hide();
                    }

                    // 设置还能上传几张照片
                    $('#remain-upload').text(max-imageLength);
                    scroll.refresh();
                }, 300);

            },

            // 剪切图片
            cutImage: function(img, callback) {
                // 生成比例
                var width = img.width,
                    height = img.height,
                    left = 0,
                    top = 0;

                //console.log(width, height);

                if (width > height) {
                    left = parseInt((width - height) / 2);
                } else {
                    top = parseInt((height - width) / 2);
                }

                //console.log(left, top);

                var t_ctx, t_canvas;
                    t_canvas = document.createElement('canvas');
                    t_ctx = t_canvas.getContext('2d');
                    t_canvas.width = 100;
                    t_canvas.height = 100;
                t_ctx.drawImage(img, left, top, 100, 100, 0, 0, 100, 100);
                var small = t_canvas.toDataURL('image/jpeg', 0.8);

                // android无法压缩
                if ( navigator.userAgent.match(/Android/i) ) {
                    var encoder = new JPEGEncoder();
                    small = encoder.encode(t_ctx.getImageData(0, 0, 100, 100), 80 );
                }

                $('#img2').attr('src', small);
                scroll.refresh();
                callback(small);
            },

            // 编辑图片
            editImage: function() {
                $('#img-list').delegate('li[data-type="user"]', 'click', function() {

                    var id = $(this).attr('id'),
                        imgID = id.split('release_img_')[1];

                    $.dialog = Dialog({
                        type: 2,
                        content: '您确定要删除此照片吗？',
                        closeFn: function() {
                            $('#' +id).remove();
                            if (imgData[imgID]) {
                                delete imgData[imgID];
                                imageLength--;
                                if (imageLength < max) {
                                    if ($.app.isClient) {
                                        $('#add-mobile-img').show().next('li').hide();
                                    } else {
                                        $('#add-mobile-img').hide().next('li').show();
                                    }
                                }
                                $('#remain-upload').text(max-imageLength);
                            }
                        }
                    });
                });
            },

            // 发表内容
            release: function() {
                $('#release-btn').click(function() {
                    if ( Pattern.dataTest('#release-content', '#msg', { 'empty': '不能为空'}) ) {
                        Data.setAjax('addUserArticle', {
                            'uarticle_content': $('#release-content').val(),
                            'uarticle_images': (JSON.stringify(imgData) == '{}') ? '' : JSON.stringify(imgData)
                        }, '#layer', '#msg', {200: ''}, function(respnoseText) {
                            Cache.set('is_refresh_articlelist', true);
                            Page.open('articlelist&type=user');
                        }, 0);
                    }
                });
            }

        };

        R.initialize();










		scroll.refresh();
	}

	return InterfaceTest;
});

