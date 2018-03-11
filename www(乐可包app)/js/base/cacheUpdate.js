define('base/cacheUpdate', [
    'base/cache',
    'base/data',
    'base/message',
    'base/dialog',
    'base/mobile'
], function (Cache, Data, Message, Dialog, Mobile) {

    /*
        菜品数据、店铺数据更新规则：
        是否有数据
        没有数据，传版本号0过去，获取数据写入本地，重写更新时间
        有数据，看是否过期
        没有过期，不请求，过期则带版本号请求，数据为空，重写更新时间，数据不为空，获取最新数据写入本地，重写更新时间
    */
    // 过期时间
    var expires = {
        menu: 60 * 1000 * 30,           // 菜品数据过期时间
        file: 60 * 1000 * 5             // 文件数据过期时间
    };
    // 获取apk||app从哪来
    var url = 'lss';

    return {

        /**
         * 获取版本号
         * @param  {string} version 名为string的缓存
         * @return {number || string}         返回0或者缓存的数据
         */
        getVersion: function (version) {
            var versionCache = Cache.get(version);
            var newVersion = 0;
           
            if (versionCache) {
                newVersion = versionCache;
            }
            
            return newVersion;
        },

        /**
         * 更新菜品信息和门店信息
         * @param  {number} type 更新类型（1：强制更新，2：自动更新）
         * @return {}      无返回
         */
        updateDataInfo: function (type) {
            var menuVersion =  this.getVersion('menuVersion'),
                shopVersion = this.getVersion('shopVersion');

             //alert('更新数据菜品缓存--------'+menuVersion);
             //alert('更新数据店铺缓存--------'+shopVersion);
            // alert(menuVersion);
            // alert(shopVersion);

            if (type == 2) {
                //alert(menuVersion+'-----'+shopVersion);
                console.log(menuVersion+'-----'+shopVersion);
                // 没有数据
                if ( menuVersion == 0 || shopVersion == 0) {
                    //如果这两个其中一个为0 ，就让他都为0，这样就解决了一次缓存有数据一次缓存没数据的问题
                    //menuVersion = 0;
                    //shopVersion = 0;
                    //alert('进入到这里来8888');
                    this.requestData(menuVersion, shopVersion);
                } else {
                    //alert('进入到这里来');
                    // 获取门店更新时间，菜品更新时间，本地时间
                    var shopExpiresDate = Cache.get('shopExpiresDate');
                    var menuExpiresDate = Cache.get('menuExpiresDate');
                    var localTime = new Date().getTime();

                    // 菜品或门店有一个过期则请求接口获取最新数据
                    if ( ((localTime - shopExpiresDate) > expires.menu) || ((localTime - menuExpiresDate) > expires.menu) ) {
                        //alert('菜品或门店有一个过期则请求接口获取最新数据');
                        this.requestData(menuVersion, shopVersion);
                    }
                }
            } else {
                this.requestData(menuVersion, shopVersion);
            }
        },

        /**
         * 请求菜品数据，门店数据
         * @param  {string} menuVersion 菜品版本号
         * @param  {string} shopVersion 店铺版本号
         * @return {}             无返回
         */
        requestData: function (menuVersion, shopVersion) {
            //alert('请求菜品数据，门店数据--'+menuVersion);
            var that = this;
            Data.setAjax('getData', {
                'versionMenu': menuVersion,
                'versionShop': shopVersion
            }, '#layer', '#msg', {200: ''}, function(respnoseText) {
                //alert('进入到了请求');
                if (respnoseText.data) {
                     //alert('请求里面有数据');
                    var shopData = respnoseText.data.shop;
                    var menuData = respnoseText.data.menu;
                    //alert("是否有菜品数据--"+menuData);
                    // alert(shopData);
                    // alert(menuData);

                    if (shopData) {
                        //alert('缓存店铺');
                        // 缓存门店版本号
                        Cache.set('shopVersion', shopData.shopVersion);
                        // 缓存城市
                        Cache.set('city', shopData.cityInfo);

                        // 缓存门店
                        Cache.set('lunch_shop', shopData.shopLunchInfo);

                        // 写入门店更新时间
                        Cache.set('shopExpiresDate', new Date().getTime());
                    }

                    if (menuData) {
                        //alert('缓存菜品');
                        // 缓存菜品版本号
                        Cache.set('menuVersion', menuData.menuVersion);


                        //alert("是否有缓存--"+menuData.lunchInfo);
                        // 缓存菜品
                        Cache.set('menuInfo', menuData.lunchInfo);

                        // 写入菜品更新时间
                        Cache.set('menuExpiresDate', new Date().getTime());

                        // 更新本地缓存中的点菜数据
                        //that.updateDishesData('allmenu', 'menuInfo');
                        that.updateDishesData('lunch_allmenu', 'menuInfo');

                    }
                } else {
                     //alert('请求里面没有数据');
                    // 写入门店更新时间
                    Cache.set('shopExpiresDate', new Date().getTime());
                    // 写入菜品更新时间
                    Cache.set('menuExpiresDate', new Date().getTime());
                }
            }, 1, false);
        },

        /**
         * 更新本地缓存中的点菜记录
         * @param  {string} dishes 点菜记录类型（allmenu, lunch_allmenu）
         * @param  {string} data   基础数据类型（menuInfo, lunch_menuInfo）
         * @return {}        无返回
         */
        updateDishesData: function(dishes, data) {
            //alert('更新本地缓存中的点菜数据');
            // 获取所有菜品点菜记录
            var allMenuData = Cache.get(dishes);
            if (allMenuData) {
                var menuInfo = Cache.get(data);

                for (var menu in allMenuData) {
                    var menuType = allMenuData[menu].type;

                    // 新菜品中没有此菜品
                    if (!menuInfo[menuType][menu]) {
                        delete allMenuData[menu];
                        continue;
                    }

                    
                    // 菜品
                    
                        var baseMenu = menuInfo[menuType][menu].base,
                            menuIsHalf = baseMenu.menu_is_half == 1 ? 1 : 2;

                        // 价钱，半份, 口味是否相同
                        if (
                            Number(baseMenu.menu_price) != allMenuData[menu].dishesPrice ||
                            menuIsHalf != allMenuData[menu].half ||
                            JSON.stringify(menuInfo[menuType][menu].menu_flavor) != JSON.stringify(allMenuData[menu].flavor)
                        ) {
                            delete allMenuData[menu];
                            continue;
                        }
                    
                }

                // 重写点菜记录缓存
                Cache.set(dishes, allMenuData);
            }
        },

        /**
         * 清空点菜缓存
         * @param  {string} name 清除指定的点菜缓存（allmenu, lunch_allmenu）
         * @return {}      无返回
         */
        clearMenuData: function(name) {
            var allMenuData = Cache.get(name);

            if (allMenuData) {
                for (var menu in allMenuData) {

                    // 清除点菜缓存
                    if (allMenuData[menu].count > 0) {
                        allMenuData[menu].count = 0;
                        allMenuData[menu].price = 0;

                        // 清除点菜下的已点口味缓存
                        if (allMenuData[menu].flavorObj && allMenuData[menu].flavor) {
                            for (var flavor in allMenuData[menu].flavorObj) {
                                if (allMenuData[menu].flavorObj[flavor].count > 0) {
                                    allMenuData[menu].flavorObj[flavor].count = 0;
                                    allMenuData[menu].flavorObj[flavor].price = 0;
                                }
                            }
                        }
                    }
                }

                // 重新设置缓存
                Cache.set(name, allMenuData);
            }
        },


        /**
         * 更新软件
         * @param  {string} softVersion 软件版本
         * @param  {number} type        更新类型（1：手动更新，2：自动更新）
         * @return {}无返回    user/soft.php   接收参数：version_info_app       如果与当前版本一致 返回20 data为空  如果与当前版本不一致   返回 20   data为下载地址
         */
        updateUserSoft: function (softVersion, type) {
            var fileExpiresDate = Cache.get('fileExpiresDate');
            var localTime = new Date().getTime();

            if ((localTime - fileExpiresDate) > expires.file || type == 1) {
                Data.setAjax('userSoft', {
                    'version_info_app': softVersion,
                    'cid': Cache.get('getCID')
                }, '#layer', '#msg', {20: ''}, function(respnoseText) {
                    //alert('第一次');
                    var data = respnoseText.data;
                    //alert(data);
                    if (respnoseText.code == 20) {
                        if (data) {

                            // pc端不提示更新软件
                            if ($.app.isClient == false) {
                                if (type == 1) {
                                    Message.show('#msg', '暂无新版本!', 2000);
                                } else {
                                    Cache.set('fileExpiresDate', new Date().getTime());
                                }
                                return;
                            } else {
                                if ($.app.isIDevice) {
                                    if (type == 1) {
                                        Message.show('#msg', '暂无新版本!', 2000);
                                    } else {
                                        Cache.set('fileExpiresDate', new Date().getTime());
                                    }
                                    return;
                                }

                            }

                            // 强制更新软件
                            /*if (type == 2) {
                                $.dialog = Dialog({
                                    type: 1,
                                    close: false,
                                    btn: ['更新'],
                                    content:
                                    '<p class="detail-title">请您更新到最新版本</p>' +
                                    '<p class="detail">更新内容：</p>' +
                                    '<p class="detail">1.账户更名为我的账户;</p>' +
                                    '<p class="detail">2.优化用户操作体验;</p>' +
                                    '<p class="detail">3.功能细节优化;</p>' +
                                    '<p class="detail">4.订单详情中增加送餐时间选择功能;</p>' +
                                    '<p class="detail">为了您拥有的更好的体验，更多的功能，请及时更新！</p>',
                                    closeFn: function() {
                                        Cache.set('fileExpiresDate', new Date().getTime());
                                        Mobile.downloadUrl(data);
                                    }
                                });
                            } else {*/
                            if (type == 1 || type == 2) {
                                //alert('ddd');
                                $.dialog = Dialog({
                                    type: 2,
                                    close: false,
                                    btn: ['取消', '更新'],
                                    content:
                                        '检测到最新版本'+
                                        '<div class="detail-block"><p class="detail">更新内容：</p>' +
                                        '<p class="detail">1.页面优化;</p>' +
                                        '<p class="detail">2.功能优化;</p>' +
                                        '<p class="detail">为了您拥有的更好的体验，更多的功能，请及时更新！</p></div>',
                                    cancelFn: function() {
                                        Cache.set('fileExpiresDate', new Date().getTime());
                                    },
                                    closeFn: function() {
                                        if (type == 2) {
                                            Cache.set('fileExpiresDate', new Date().getTime());
                                        }
                                        Mobile.downloadUrl(data);
                                    }
                                });
                            }
                                
                            

                            // 更新文件版本
                            /*function updateFileVersion() {
                                if (data.file && data.file.versionFile) {
                                    Cache.set('fileVersion', parseInt(data.file.versionFile));
                                    Cache.set('fileExpiresDate', new Date().getTime());

                                    // 刷新页面更新文件
                                    if (data.file.versionFile != 0) {
                                        window.location.reload();
                                    }
                                } else {
                                    Cache.set('fileExpiresDate', new Date().getTime());
                                }
                            }*/
                        } else {

                            // 没有任何更新（如果是手动检查更新，提示无新版本）
                            if (type == 1) {
                                Message.show('#msg', '暂无新版本!', 2000);
                            }
                            Cache.set('fileExpiresDate', new Date().getTime());
                        }
                    } else {
                        Message.show('#msg', respnoseText.message, 2000);
                    }
                }, 2);
            }
        },

        /**
         * 更新软件
         * @param  {string} softVersion 软件版本
         * @param  {number} type        更新类型（1：手动更新，2：自动更新）
         * @return {}             无返回
         */
        updateSoft: function(softVersion, type) {
            var fileVersion = this.getVersion('fileVersion'),
                pageVersion = this.getVersion('pageVersion'),
                uuid = this.getVersion('uuid');
                // 获取apk||app从哪来
                Mobile.getUserForm(function(result) {
                    //alert('result:'+result);
                    var resulturl = result.trim().substring(0,3);
                    if(resulturl == 'lss'){
                       url = result.trim().replace(/lss/, "lsp");
                    }else{
                        url = result.trim();
                    }
                    //alert(url);
                    

                });                
                // alert("更新软件");
                // alert("第一个"+fileVersion);
                // alert("第二个"+pageVersion);
                // alert("第三个"+uuid);
            if (type == 2) {
                // 没有数据
                if ( fileVersion == 0) {
                    this.updateSoftRequest(softVersion, fileVersion, pageVersion, uuid, type);
                } else {
                    var fileExpiresDate = Cache.get('fileExpiresDate');
                    var localTime = new Date().getTime();

                    if ( (localTime - fileExpiresDate) > expires.file ) {
                        this.updateSoftRequest(softVersion, fileVersion, pageVersion, uuid, type);
                    }
                }
            } else {
                this.updateSoftRequest(softVersion, fileVersion, pageVersion, uuid, type);
            }
        },

        /**
         * 请求更新软件版本
         * @param  {string} softVersion 软件版本
         * @param  {string} fileVersion 文件版本
         * @param  {string} uuid        设备的标示符
         * @param  {number} type        更新类型（1：手动更新，2：自动更新）
         * @return {}             无返回
         */
        updateSoftRequest: function(softVersion, fileVersion, pageVersion, uuid, type) {
            Data.setAjax('softVersion', {
                'versionSoft': softVersion,
                'versionFile': fileVersion,
                'versionPage': pageVersion,
                'UUID': uuid
            }, '#layer', '#msg', {200: ''}, function(respnoseText) {
                //alert('第一次');
                var data = respnoseText.data;

                if (data) {

                    // 缓存uuid
                    if (data.UUID) {
                        Cache.set('uuid', data.UUID);
                    }

                    // 没有软件新版本（如果是手动检查新版本就提示暂无新版本，否则就更新文件）
                    if (!data.soft) {
                        if (type == 1) {
                            Message.show('#msg', '暂无新版本!', 2000);
                        } else {
                            updateFileVersion();
                        }
                    } else {

                        // 有软件版本并且软件和客户端获取的版本不一样（就更新软件）
                        if (data.soft.versionSoft && data.soft.versionSoft != softVersion) {

                            // pc端不提示更新软件
                            if ($.app.isClient == false) {
                                if (type == 1) {
                                    Message.show('#msg', '暂无新版本!', 2000);
                                } else {
                                    updateFileVersion();
                                }
                                return;
                            } else {
                                    //var is_fromappsto = true;
                                    if ((parseFloat(data.soft.versionSoft) < parseFloat(softVersion)) || $.app.isIDevice) {
                                            //is_fromappsto
                                            //alert(is_fromappsto);
                                            if (type == 1) {
                                                Message.show('#msg', '暂无新版本!', 2000);
                                            } else {
                                                updateFileVersion();
                                            }
                                            return;
                                    }

                            }

                            
                            

                            // 强制更新软件
                            if (data.soft.update === 1 && type == 2) {
                                $.dialog = Dialog({
                                    type: 1,
                                    close: false,
                                    btn: ['更新'],
                                    content:
                                    '<p class="detail-title">请您更新到最新版本：' + data.soft.versionSoft + '</p>' +
                                    '<p class="detail">更新内容：</p>' +
                                    '<p class="detail">1.账户更名为我的账户;</p>' +
                                    '<p class="detail">2.优化用户操作体验;</p>' +
                                    '<p class="detail">3.功能细节优化;</p>' +
                                    '<p class="detail">4.订单详情中增加送餐时间选择功能;</p>' +
                                    '<p class="detail">为了您拥有的更好的体验，更多的功能，请及时更新！</p>',
                                    closeFn: function() {
                                        Mobile.downloadUrl('http://' + window.location.hostname + '/' + url + '.app');
                                    }
                                });
                            } else {
                                $.dialog = Dialog({
                                    type: 2,
                                    btn: ['取消', '更新'],
                                    content:
                                        '检测到最新版本：' + data.soft.versionSoft+
                                        '<div class="detail-block"><p class="detail">更新内容：</p>' +
                                        '<p class="detail">1.账户更名为我的账户;</p>' +
                                        '<p class="detail">2.优化操作体验;</p>' +
                                        '<p class="detail">3.功能细节优化;</p>' +
                                        '<p class="detail">4.订单详情中增加送餐时间选择功能;</p>' +
                                        '<p class="detail">为了您拥有的更好的体验，更多的功能，请及时更新！</p></div>',
                                    cancelFn: function() {
                                        updateFileVersion();
                                    },
                                    closeFn: function() {
                                        Mobile.downloadUrl('http://' + window.location.hostname + '/' + url + '.app');
                                    }
                                });
                            }
                        }
                    }

                    // 更新文件版本
                    function updateFileVersion() {
                        if (data.file && data.file.versionFile) {
                            Cache.set('fileVersion', parseInt(data.file.versionFile));
                            Cache.set('fileExpiresDate', new Date().getTime());

                            // 刷新页面更新文件
                            if (data.file.versionFile != 0) {
                                window.location.reload();
                            }
                        } else {
                            Cache.set('fileExpiresDate', new Date().getTime());
                        }
                    }
                } else {

                    // 没有任何更新（如果是手动检查更新，提示无新版本）
                    if (type == 1) {
                        Message.show('#msg', '暂无新版本!', 2000);
                    }
                    Cache.set('fileExpiresDate', new Date().getTime());
                }
            }, 1);
        },

        /**
         * 定位首页
         * @param  {string} softVersion 软件版本
         * @return {}             无返回
         */
        determineHomePage: function(softVersion) {

            if (softVersion == 0) {
                require(['base/page'], function(Page) {
                     Page.open('homeCard', 1);
                });
            }


            /*var fileVersion = this.getVersion('fileVersion'),
                pageVersion = this.getVersion('pageVersion'),
                uuid = this.getVersion('uuid');
            //  alert("弹出"+location.href+"...1:"+fileVersion+"2:"+pageVersion+"3:"+uuid);
            if (pageVersion == 0) {
                this.updatePageRequest(softVersion, fileVersion, pageVersion, uuid);
            } else {
                var pageExpiresDate = Cache.get('pageExpiresDate');
                var localTime = new Date().getTime();

                if ( (localTime - pageExpiresDate) > expires.file ) {
                    this.updatePageRequest(softVersion, fileVersion, pageVersion, uuid);
                } else {
                    require(['base/page'], function(Page) {
                        Page.open('homeCard', 1);
                    });
                }
            }*/
        },

        /**
         * 请求更新封面版本
         * @param  {string} softVersion 软件版本
         * @param  {string} fileVersion 文件版本
         * @param  {string} pageVersion 页面版本
         * @param  {string} uuid        设备的标示符
         * @return {}                   无返回
         */
        updatePageRequest: function(softVersion, fileVersion, pageVersion, uuid) {
            Data.setAjax('softVersion', {
                'versionSoft': softVersion,
                'versionFile': fileVersion,
                'versionPage': pageVersion,
                'UUID': uuid
            }, '#layer', '#msg', {200: ''}, function(respnoseText) {
                //alert('第二次');
                var data = respnoseText.data;
                require(['base/page'], function(Page) {
                    if (data.page && data.page.versionPage) {
                        Cache.set('pageVersion', data.page.versionPage);
                        Cache.set('pageExpiresDate', new Date().getTime());

                        if (data.page.versionPage != pageVersion) {
                            //修改为home，之前为index（引导页）
                            Page.open('homeCard', 1);
                        } else {
                            Page.open('homeCard', 1);
                        }
                    } else {
                        Cache.set('pageExpiresDate', new Date().getTime());
                        Page.open('homeCard', 1);
                    }
                });
            }, 1);
        }

    };

});