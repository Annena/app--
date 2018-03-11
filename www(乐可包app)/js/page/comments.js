    define('page/comments', [
    'base/page',
    'base/pattern',
    'base/message',
    'base/cache',
    'base/util',
    'base/data',
    'base/scrollbar',
    'base/dialog'
], function(Page, Pattern, Message, Cache, Util, Data, Bar, Dialog) {

    var PayId,
        cardId,
        page,
        orderListType;

    var Comments = function() {
        this.back = Cache.get('url_comment');
    };
    // 添加订单点评页面
    Comments.prototype = new Page('comments');

    Comments.prototype.bindPageEvents = function() {

        // 如果缓冲中没有cid，就调用方法请求接口获取cid
        /*if (!Cache.get('getCID')) {
            //alert('dd');
            // 通过请求PHP获取到cid
            Util.cidList();
        }*/
        
        var self = this;

        PayId = Util.getQueryString('pay_id');
        page = Util.getQueryString('page');
        cardId = Util.getQueryString('card_id');
        orderListType = Util.getQueryString('order_list_type') == undefined ? 1 : Util.getQueryString('order_list_type');
        this.back = Cache.get('url_comment');
        
        $('title').text('订单点评');

        var imgData = {},
            imgDatatwo = {},
            index = 0,
            max = 9,
            imageLength = 0,
            bodyWidth = $('body').width(),
            bpdyHeight = $('body').height(),
            liWidth = Math.floor((bodyWidth - 30 - 12 - 8) / 4);


        var imgDateList = {}; // 图片数据存储
        var imgDateNUm = 0;   // 图片数据key

        //图片方向角 added by lzk  
        var Orientation = null;

        // 是否是微信
        var isWeixin = Util.isWeixin();
        var isAli    = Util.isAlipay()
        var Comment = {

            scroll: null,

            inin: function() {
                // 判断微信访问
                this.weixinVisit();

                // 设置新增按钮高度
                $('#img-list').find('li').css({
                    //width: liWidth,
                    height: liWidth+10
                });
                // 设置新增按钮高度
                $('#img-list').find('li img').css({
                    width: liWidth+10,
                    height: liWidth+10
                });
                var width = liWidth+10;
                $('#img-list').find('li').css('line-height', width+'px');

                var imageStyle = 'style="width:'+width+'px;height:'+width+
                                        'px;'+
                                        'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                $('#add-client-img').html('<div data-type="img" '+imageStyle+'><input type="file" id="release-img" class="" accept="image/*"/></div>');
                $('#add-mobile-img').html('<div data-type="img" '+imageStyle+'></div>');



                // 获取到屏幕宽度，赋值给页面
                $('#comments-content').width($.app.body_width);
                this.addStarSelect('service', '服务质量');
                this.addStarSelect('quality', '餐品质量');
                this.addComment();

                // 判断是不是客户端
                if ($.app.isClient && $.app.isAndroid) {// && $.app.isAndroid
                    $('#add-mobile-img').removeClass('hide');
                    //$('#add-client-img').addClass('hide');
                    $('#add-client-img').remove();
                } else {
                    $('#add-mobile-img').remove();
                    //$('#add-mobile-img').addClass('hide');
                    $('#add-client-img').removeClass('hide');
                }

                this.bindEvents();


                this.scroll = Bar('#comments-content');
                Comment.scroll.refresh();
                //this.load();
            },

            // 判断微信访问
            weixinVisit: function () {
                var self = this;
                if (isWeixin || isAli) {
                    $('#download').removeClass('hide');
                    $('header').addClass('hide');
                    $('.pg-comments div[data-id="scroller"]').css('padding-bottom','130px');
                    //document.getElementById('comments-content').style.cssText = 'top:67px !important';
                    //document.getElementById('comments-header').style.cssText = 'top:45px !important';

                    $('#comments-header').addClass('top35')
                    $('.comment-nav').addClass('top10')
                    $('#download').unbind('click').bind('click', function () {
                        window.location=phpDownload;
                    });
                } else {
                    $('#download').addClass('hide');
                    $('header').removeClass('hide');
                }
            },

            // 添加星星选择
            addStarSelect: function(type, label) {
                $('#'+type+'-select').mobiscroll().image({
                    theme: 'android-holo light',
                    accent: ' ',
                    lang: 'zh',
                    display: 'bottom',
                    mode: 'scroller',
                    labels: ['选择' + label],
                    height: 50,
                    fixedWidth: 200
                });

                $('#'+type+'-select').val(3);

                $('#'+type+'').unbind('tap').bind('tap', function() {
                    $('#comment-info').blur();
                    $('#'+type+'-select').mobiscroll('show');
                    return false;
                });

                $('#'+type+'-select_dummy').hide();

                $('#'+type+'-select').change(function() {
                    var val = $('#'+type+'-select_dummy').val();
                    $('#'+type+'').attr('class', 'star star' + val);
                });
            },

            // 添加点评
            addComment: function() {
                $('#comments-btn').unbind('tap').bind('tap', function() {

                    var service = $('#service-select_dummy').val() || 0,// 点评1
                        quality = $('#quality-select_dummy').val() || 0,// 点评2
                        commentInfo = $('#comment-info').val();

                    if (service == 0 && quality == 0 && commentInfo == '') {
                        Message.show('#msg', '请填写或选择评价信息', 3000);
                        return;
                    }

                    /*if ($('#comment-info').val() == '') {
                        Message.show('#msg', '评论内容不能为空！', 3000);
                        return;
                    }*/

                    // if (service == 0 || quality == 0 || commentInfo == '') {
                    //     Message.show('#msg', '请填写或选择评价信息', 3000);
                    //     return;
                    // }

                    if ($('#comment-info').val().length > 140) {
                        Message.show('#msg', '点评意见不能大于140个字', 3000);
                        return;
                    }

                    Data.setAjax('commentPost', {
                        'card_id': cardId,
                        'star_1': service,  // 评价1
                        'star_2': quality,  // 评价2
                        'pay_id': PayId,
                        'content': commentInfo,
                        'cid': Cache.get('getCID'),
                        'uarticle_images': (JSON.stringify(imgData) == '{}') ? '' : imgData
                    }, '#layer', '#msg', {200206: ''}, function(respnoseText) {

                        //Cache.set('is_refresh_orderlist', true);
                        if (respnoseText.code == 200206) {
                            Message.show('#msg', respnoseText.message, 2000, function () {
                                Page.open(self.back);
                            });
                        } else {
                            Message.show('#msg', respnoseText.message, 2000);
                        }
                    }, 2);
                });
            },

            // 加载条
            /*load: function() {
                if (this.scroll != null) {
                    this.scroll.destroy();
                }
                this.scroll = new iScroll($('#comments-content')[0], {
                    scrollbarClass: 'myScrollbar',
                    bounce: false,
                    hideScrollbar: true,
                    onBeforeScrollStart: function (e) {
                    }
                });
            }*/

            // 绑定事件
            bindEvents: function() {
                // 手机添加图片
                this.mobileAddimg();
                // 电脑添加图片
                this.clientAddimg();
                // 发表内容
                //this.release();
                // 编辑图片 是否删除s
                this.editImage();
            },

            // 手机添加照片
            mobileAddimg: function() {
                /*$("#add-mobile-img").click(function() {

                    var style = 'style="width:'+liWidth+'px;height:'+liWidth+'px;"';
                    var imageStyle = 'style="width:'+liWidth+
                                            'px;height:'+liWidth+
                                            'px;'+
                                            'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user"><div data-type="img" '+imageStyle+'></div><div class="image_layer hide"></div><div class="image_layer_span hide">x</div></li>');

                    $('##albumcamera').removeClass('hide');
                    $.dialog = Dialog({
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
                    });
                });*/

                $("#add-mobile-img").click(function() {

                    var style = 'style="width:'+liWidth+'px;height:'+liWidth+'px;"';
                    /*var imageStyle = 'style="width:'+liWidth+
                                            'px;height:'+liWidth+
                                            'px;'+
                                            'background:url(../img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user"><div data-type="img" '+imageStyle+'></div><div class="image_layer hide"></div><div class="image_layer_span hide">x</div></li>');*/
                    var imageStyle = 'style="height:'+liWidth+'px;'+
                                            'background:url(../img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                    $('#add-mobile-img').before('<li id="release_img_'+index+'"'+style+' data-type="user" class="img_add"><div data-type="img" '+imageStyle+'></div></li>');


                    //alert(navigator.camera);

                    Comment.selectMode(navigator.camera.PictureSourceType.SAVEDPHOTOALBUM);
                });
            },

            // 选择模式
            selectMode: function(mode) {
                navigator.camera.getPicture(function(imageData) {
                    var num = 0; // 是否有相同图片 0 否 1 是
                    // 判断是否有相同图片
                    for(var i in imgDateList) {
                        if (imgDateList[i] == imageData) {
                            Message.show('#msg', '请选择不同图片上传！', 2000);
                            num = 1;
                            break;
                        }
                    }

                    if (num == 0) {
                        imgDateList[imgDateNUm] = imageData;
                        imgDateNUm++;
                        Comment.drawImage('data:image/jpeg;base64,'+imageData);
                    } else {
                        $('#release_img_' +index).remove();
                    }
                }, function(message) {
                    $('#release_img_' +index).remove();
                }, {
                    quality: 50,
                    destinationType: navigator.camera.DestinationType.DATA_URL,     // 返回数据类型
                    sourceType: mode,                   // 选择类型
                    correctOrientation: true            // 设置图片显示为正确的方向（不会出现ios手机或android手机图片旋转）
                });
                Comment.scroll.refresh();
            },

            // 电脑添加照片
            clientAddimg: function() {
                var self = this;
                $('#release-img').change(function(event) {

                    var files = event.target.files[0];

                    //图片方向角 added by lzk  
                    self.Orientation = null;

                    // 没有选择任何图片
                    if (files === undefined) {
                        return;
                    }

                    if (/image\/\w+/.test(files.type)) {
                        if (typeof FileReader == 'undefined') {
                            //console.log('不支持FileReader');
                        } else {
                            //console.log('支持FileReader');


                            //获取照片方向角属性，用户旋转控制
                            EXIF.getData(files, function() {
                               // alert(EXIF.pretty(this));
                                EXIF.getAllTags(this);
                                //alert(EXIF.getTag(this, 'Orientation'));
                                self.Orientation = EXIF.getTag(this, 'Orientation');
                                //return;
                            });


                            var fileReader = new FileReader();

                            //console.log(fileReader);

                            fileReader.readAsDataURL(files);

                            fileReader.onload = function () {
                                //console.log('---');
                                
                                var num = 0; // 是否有相同图片 0 否 1 是
                                // 判断是否有相同图片
                                for(var i in imgDateList) {
                                    if (imgDateList[i] == this.result) {
                                        Message.show('#msg', '请选择不同图片上传！', 2000);
                                        num = 1;
                                        break;
                                    }
                                }

                                if (num == 0) {
                                    imgDateList[imgDateNUm] = this.result;
                                    imgDateNUm++;
                                    var style = 'style="height:'+liWidth+'px;"';
                                    var imageStyle = 'style="width:'+liWidth+
                                                            'px;height:'+liWidth+
                                                            'px;'+
                                                            'background:url(/img/base/loading.gif) no-repeat '+(liWidth/3)+'px;"';
                                    $('#add-client-img').before('<li id="release_img_'+index+'"'+style+' data-type="user" class="img_add"><div data-type="img" '+imageStyle+'></div></li>');
                                    Comment.drawImage(this.result);
                                }
                            };

                            fileReader.onabort = function() {
                                //console.log('abort');
                            };
                            fileReader.onerror = function() {
                                //console.log('error');
                            };
                            fileReader.onloadstart = function() {
                                //console.log('loadstart');
                            };
                            fileReader.onprogress = function() {
                                //console.log('progress');
                            };
                            fileReader.onloadend = function() {
                                //console.log('loadend');
                            };
                        }
                    } else {
                        //console.log('请上传图片');
                        Message.show('#msg', '请上传图片！', 2000);
                    }
                    Comment.scroll.refresh();
                });
            },

            // 压缩图片
            drawImage: function(url) {

                imageLength++;

                // 最多只能添加9个图片
                if (imageLength == 9) {
                    $('#add-mobile-img').hide();
                    $('#add-client-img').hide();
                }
                
                // 如果有图片就隐藏，上传图片四个字
                if (imageLength > 0) {
                    $('#uploadPic').addClass('hide');
                } else {
                    $('#uploadPic').removeClass('hide');
                }

                var img = new Image();
                img.src = url;

                img.onload = function() {

                    Comment.imageDraw(img, 500, 'w', function(big) {

                        // $('#img').attr('src', big);

                        var imgBig = new Image();
                        imgBig.src = big;
                        imgBig.onload = function() {
                            Comment.imageDraw(imgBig, 100, 's', function(small) {
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

                                    Comment.setImageData(big, small, -left, -top, newWidth, newHeight);
                                };

                            });
                        };

                    },1);
                };
                Comment.scroll.refresh();
            },

            imageDraw: function(img, size, type, fn, numstt) {
                var self = this;

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
                    //console.log('支持');
                } catch (e) {
                    //console.log('不支持');
                }

                // 创建canvas对象
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');

                // 设置图片宽高
                canvas.width = width;
                canvas.height = height;

                // pc端压缩图片
                context.drawImage(img, 0, 0, width, height);


                var big = null;

                //修复ios  
                if (navigator.userAgent.match(/iphone/i)) {
                    //console.log('iphone');
                    //alert('==='+self.Orientation);
                    //如果方向角不为1，都需要进行旋转 added by lzk
                    if(self.Orientation != "" && self.Orientation != 1 && self.Orientation != null && numstt == 1){
                        //alert('苹果旋转处理');
                        switch(self.Orientation){
                            case 6://需要顺时针（向右）90度旋转
                                //alert('需要顺时针（向右）90度旋转');
                                self.rotateImg(img,'left',canvas, width, height);
                                break;
                            case 8://需要逆时针（向左）90度旋转
                                //alert('需要逆时针（向左）90度旋转');
                                self.rotateImg(img,'right',canvas, width, height);
                                break;
                            case 3://需要180度旋转
                                //alert('需要180度旋转');
                                self.rotateImg(img,'right',canvas, width, height);//转两次
                                self.rotateImg(img,'right',canvas, width, height);
                                break;
                        }
                    }
                    /*if (numstt == 1) {
                        var mpImg = new MegaPixImage(img);
                        mpImg.render(canvas, {
                            maxWidth: width,
                            maxHeight: height,
                            quality: 0.8,
                            orientation: self.Orientation
                        });
                    }*/
                    big = canvas.toDataURL("image/jpeg", 0.8);
                }else if (navigator.userAgent.match(/Android/i)) {// 修复android
                    var encoder = new JPEGEncoder();
                    big = encoder.encode(context.getImageData(0, 0, width, height), 80);
                }else{
                    //alert('---'+self.Orientation);
                    if(self.Orientation != "" && self.Orientation != 1 && self.Orientation != null && numstt == 1){
                        //alert('电脑旋转处理');
                        switch(self.Orientation){
                            case 6://需要顺时针（向右）90度旋转
                                //alert('需要顺时针（向右）90度旋转');
                                self.rotateImg(img,'left',canvas, width, height);
                                break;
                            case 8://需要逆时针（向左）90度旋转
                                //alert('需要逆时针（向左）90度旋转');
                                self.rotateImg(img,'right',canvas, width, height);
                                break;
                            case 3://需要180度旋转
                                //alert('需要180度旋转');
                                self.rotateImg(img,'right',canvas, width, height);//转两次
                                self.rotateImg(img,'right',canvas, width, height);
                                break;
                        }
                    }
                      
                    big = canvas.toDataURL("image/jpeg", 0.8);
                }



                /*var big = canvas.toDataURL('image/jpeg', 0.8);

                // 解决ios4图片变形问题
                if (navigator.userAgent.match(/iphone/i) ) {
                    var mpImg = new MegaPixImage(img);
                    mpImg.render(canvas, { maxWidth: width, maxHeight: height, quality: 0.8});
                    big = canvas.toDataURL('image/jpeg', 0.8);
                }

                // 修复android（部分android手机不能压缩图片）
                if (navigator.userAgent.match(/Android/i) ) {
                    var encoder = new JPEGEncoder();
                    big = encoder.encode(context.getImageData(0, 0, width, height), 80 );
                }*/

                fn(big);
                Comment.scroll.refresh();
            },

            //对图片旋转处理 added by lzk  
            rotateImg: function(img, direction,canvas, width, height) {
                //alert(img);
                //最小与最大旋转方向，图片旋转4次后回到原方向
                var min_step = 0;
                var max_step = 3;
                //var img = document.getElementById(pid);
                if (img == null)return;
                //img的高度和宽度不能在img元素隐藏后获取，否则会出错
                /*var height = img.height;
                var width = img.width;*/
                //var step = img.getAttribute('step');
                var step = 2;
                if (step == null) {
                    step = min_step;
                }
                if (direction == 'right') {
                    step++;
                    //旋转到原位置，即超过最大值
                    step > max_step && (step = min_step);
                } else {
                    step--;
                    step < min_step && (step = max_step);
                }
                //img.setAttribute('step', step);
                /*var canvas = document.getElementById('pic_' + pid);
                if (canvas == null) {
                    img.style.display = 'none';
                    canvas = document.createElement('canvas');
                    canvas.setAttribute('id', 'pic_' + pid);
                    img.parentNode.appendChild(canvas);
                }  */
                //旋转角度以弧度值为参数
                var degree = step * 90 * Math.PI / 180;
                var ctx = canvas.getContext('2d');
                switch (step) {
                    case 0:
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        break;
                    case 1:
                        canvas.width = height;
                        canvas.height = width;
                        ctx.rotate(degree);
                        ctx.drawImage(img, 0, -height, width, height);
                        break;
                    case 2:
                        canvas.width = width;
                        canvas.height = height;
                        ctx.rotate(degree);
                        ctx.drawImage(img, -width, -height, width, height);
                        break;
                    case 3:
                        canvas.width = height;
                        canvas.height = width;
                        ctx.rotate(degree);
                        ctx.drawImage(img, -width, 0, width, height);
                        break;
                }
            },

            // 设置图片显示和上传数据
            setImageData: function(big, small, left, top, width, height) {
                setTimeout(function() {

                    // 加载完的图片替换原有图片
                    $('#release_img_'+index, '#img-list').css({
                        //width: liWidth + 2,
                        height: liWidth + 10,
                        border: 'none'
                    }).find('div[data-type="img"]').css({
                        width: liWidth + 10,
                        height: liWidth + 10,
                        background: 'url('+small+') ' + left + 'px ' + top + 'px',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: width + 'px ' + height + 'px cover'
                    }).end().find('div[class^=image_layer]').removeClass('hide');

                    imgData[index] = {
                        big: big.substring(23),
                        small: small.substring(23)
                    };


                    //imageLength++;
                    index++;

                    /*// 最多只能添加9个图片
                    if (imageLength == max) {
                        $('#add-mobile-img').hide();
                        $('#add-client-img').hide();
                    }
                    
                    // 如果有图片就隐藏，上传图片四个字
                    if (imageLength > 0) {
                        $('#uploadPic').addClass('hide');
                    } else {
                        $('#uploadPic').removeClass('hide');
                    }*/

                    //Cache.set('imgData',imgData);
                    // 设置还能上传几张照片
                    //$('#remain-upload').text(max-imageLength);
                    Comment.scroll.refresh();
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
                Comment.scroll.refresh();
                callback(small);
            },

            // 编辑图片
            editImage: function() {
                $('#img-list').on('click', 'li[data-type="user"]', function(event) {
                    var self = this;
                    var index = $(self).index();
                    var id = $(this).attr('id'),
                        imgID = id.split('release_img_')[1];


                    // 删除
                    /*$.dialog = Dialog({
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
                                // 还可上传几张图片
                                //$('#remain-upload').text(max-imageLength);
                            }
                        }
                    });*/

                    $('#exit-upper').html('');
                    $('#exit-lower').html('');

                    // 编辑
                    $.dialog = Dialog({
                        type: 3,
                        close: false,
                        dom: '#picedit',
                        success: function() {
                            // 计数，删除用的
                            var index_num = 0;
                            for (var i in imgData) {
                                var imageStyle = 'style="background:url(data:image/jpeg;base64,'+imgData[i].big+') no-repeat"';
                                $('#exit-upper').append('<div id="exit_img_'+i+'" class="swiper-slide" '+imageStyle+' data-type="exit-img"></div>');
                                $('#exit-lower').append('<div id="exit_img_'+i+'" class="swiper-slide" '+imageStyle+' data-type="exit-img"><div class="del_bnt" data-type="exit-del" data-id="exit_img_'+i+'" data-num="'+index_num+'"></div></div>');
                                index_num++;
                                //<div class="swiper-slide" style="background-image:url(../img/base/shop-bg03.png)"></div>big
                            }


                            $('#picedit').css({
                                width: '100%',
                                //height: $.app.body_height - 100,
                                background: '#fff'
                            });
                            var galleryTop = new Swiper('.gallery-top', {
                                nextButton: '.swiper-button-next',
                                prevButton: '.swiper-button-prev',
                                spaceBetween: 10,
                            });
                            var galleryThumbs = new Swiper('.gallery-thumbs', {
                                spaceBetween: 10,
                                centeredSlides: true,
                                slidesPerView: 'auto',
                                touchRatio: 0.2,
                                slideToClickedSlide: true
                            });
                            galleryTop.params.control = galleryThumbs;
                            galleryThumbs.params.control = galleryTop;
                            // 定位点击的那个
                            galleryTop.slideTo(index, 0, false);//切换默认slide，速度为0秒
                            galleryThumbs.slideTo(index, 0, false);//切换默认slide，速度为0秒

                            // 切换第一个的时候，有时候切换不过去
                            if (index == 0) {
                                galleryTop.setWrapperTranslate(0);
                                //$('#exit-lower').css({'transition-duration':'0ms','transform':'translate3d(0px, 0px, 0px)'});
                            }
                            // 点击删除
                            $('#exit-lower').unbind('click').on('click', 'div[data-type="exit-del"]', function() {
                                //alert($(this).attr('data-num'));
                                var exit_id = $(this).attr('data-id'),
                                    exit_imgID = exit_id.split('exit_img_')[1],
                                    indexNum = $(this).attr('data-num');

                                imgDatatwo[exit_imgID] = {
                                    exit_imgID: exit_imgID
                                };
                                // 删除当前
                                $('#exit-lower #'+exit_id+', #exit-upper #'+exit_id).remove();
                                // 移除当前
                                galleryTop.removeSlide(-1);
                                galleryThumbs.removeSlide(-1);
                            });


                            // 点击保存
                            $('#exit-Preser').unbind('click').bind('click', function () {
                                for (var i in imgData) {
                                    for (var j in imgDatatwo) {
                                        if (i == j) {
                                            delete imgDateList[i];// 删除图片存储数据
                                            delete imgData[i];
                                        }
                                    }
                                }
                                // 删除评论页面里面的
                                for (var k in imgDatatwo) {
                                    $('#img-list #release_img_'+k).remove();
                                    imageLength--;
                                }

                                if (imageLength < max) {
                                    if ($.app.isClient && $.app.isAndroid) {
                                        $('#add-mobile-img').show();
                                        $('#add-client-img').hide();
                                    } else {
                                        $('#add-mobile-img').hide();
                                        $('#add-client-img').show();
                                    }
                                }
                                // 如果有图片就隐藏，上传图片四个字
                                if (imageLength > 0) {
                                    $('#uploadPic').addClass('hide');
                                } else {
                                    $('#uploadPic').removeClass('hide');
                                }

                                $.dialog.close($.dialog.id);
                            });

                            // 点击取消
                            $('#exit-cacel').unbind('click').bind('click', function () {
                                // 清空他，否则在来删除就有问题了
                                imgDatatwo = {};
                                $.dialog.close($.dialog.id);
                            });
                        },
                        closeFn: function() {
                            //$('#release_img_' +index).remove();
                            $.dialog.close($.dialog.id);
                        },
                        layerFn: function() {
                            //$('#release_img_' +index).remove();
                            $.dialog.close($.dialog.id);
                        }
                    });

                });
            },

            // 发表内容
            release: function() {
                $('#release-btn').click(function() {
                    if (Pattern.dataTest('#release-content', '#msg', { 'empty': '不能为空'}) ) {
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
        // 微信打开
        if (Util.isWeixin()) {
            // 如果缓冲中没有cid，就调用方法请求接口获取cid
            if (!Cache.get('getCID')) {
                Data.setAjax('userCid', '', '#layer', '#msg', {20: ''}, function (respnoseText) {
                    // 获取到的cid放到缓存中
                    Cache.set('getCID', respnoseText.data);
                    Comment.inin();
                }, 1);
            } else {
                Comment.inin();
            }
        } else {
            Comment.inin();
        }
    };

    return Comments;
});