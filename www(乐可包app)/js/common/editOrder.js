define('common/editOrder', [
    'base/cacheUpdate',
    'base/cache',
    'base/page'
], function (Update, Cache, Page) {

    return {

        /**
         * 编辑订单初始化
         * @param  {object} data 订单数据
         * @param  {string} name 编辑点菜缓存的名称（allmenu, lunch_allmenu）
         * @return {}      无返回
         */
        initialize: function(data, name, page) {
            localStorage.setItem('Pro', "editorder");
            // 清空点菜记录
            Update.clearMenuData(name);

            var orderInfo = data.all_menu,                  // 当前订单的菜品
                allMenuData = Cache.get(name),              // 缓存的所有点菜数据
                //menuInfo = Cache.get(name == 'allmenu' ? 'menuInfo' : 'lunch_menuInfo');           // 缓存的所有菜品数据
                menuInfo = Cache.get('menuInfo');
                
            // 创建点菜数据
            if (!allMenuData) {
                allMenuData = {};
            }

            // 更新点菜缓存 香锅allmenu
            //if (name == 'allmenu') {
                this.updateDishesCache(orderInfo, menuInfo, allMenuData);
            /*} else {
                this.updateLunchDishesCache(orderInfo, menuInfo, allMenuData);
            }*/

            // 重新写入缓存
            Cache.set(name, allMenuData);

            // 再次获取最新数据，进行点菜缓存清理
            Update.updateDataInfo(1);

            // 为跳去点菜页做准备工作
            this.readyToDishesPage(data, name, page);
        },

        /**
         * 清除香锅已点菜品缓存，订单信息点菜数据更新到已点菜品缓存
         * @param  {object} orderInfo   订单菜品
         * @param  {object} menuInfo    菜品基本数据
         * @param  {object} allMenuData 空的点菜数据存储容器
         * @return {}             无返回
         */
        updateDishesCache: function(orderInfo, menuInfo, allMenuData) {
            for (var type in orderInfo) {
                for (var menu in orderInfo[type]) {

                    // 获取当前菜品的最新信息
                    var menuName = menuInfo[type][menu];
                    if (!menuName) {
                        continue;
                    }

                    // 获取当前菜品在点菜中的缓存记录
                    var dishes = allMenuData[menu],

                    // 获取当前菜品的最新信息，口味等
                        baseMenu = menuName.base,
                        menuFlavor = menuName.menu_flavor,

                    // 菜品的支持性(1支持，0,2不支持)
                        menuIsHalf = baseMenu.menu_is_half == 1 ? 1 : 2,
                        menuIsShop = baseMenu.menu_is_shop == 1 ? 1 : 2,
                        menuIsSend = baseMenu.menu_is_send == 1 ? 1 : 2,
                        menuIsbooking = baseMenu.menu_is_booking == 1 ? 1 : 2;

                    // 点菜缓存中不存在此菜品创建一条
                    if (!dishes) {
                        dishes = {};
                        dishes.id = menu;
                        dishes.type = type;
                        dishes.name = baseMenu.menu_name;
                        dishes.count = 0;
                        dishes.price = 0;
                        dishes.flavor = menuFlavor;
                        dishes.dishesPrice = Number(baseMenu.menu_price);
                        dishes.half = menuIsHalf;
                        dishes.is_shop = menuIsShop;
                        dishes.is_send = menuIsSend;
                        dishes.is_booking = menuIsbooking;
                        dishes.flavorObj = {};
                    } else {
                        // 此菜品的最新数据和缓存中此菜品数据不一样，删除缓存中点菜数据
                        if (
                            Number(baseMenu.menu_price) != allMenuData[menu].dishesPrice ||
                            menuIsHalf != allMenuData[menu].half ||
                            menuIsShop != allMenuData[menu].is_shop ||
                            menuIsSend != allMenuData[menu].is_send ||
                            menuIsbooking != allMenuData[menu].is_booking ||
                            JSON.stringify(menuFlavor) != JSON.stringify(allMenuData[menu].flavor)
                        ) {
                            delete allMenuData[menu];
                            continue;
                        }
                    }

                    allMenuData[menu] = dishes;

                    // 无点菜口味
                    if (orderInfo[type][menu].base) {
                        allMenuData[menu].count = Number(orderInfo[type][menu].base.menu_count);
                        allMenuData[menu].price = Number(orderInfo[type][menu].base.menu_price) * Number(orderInfo[type][menu].base.menu_count);

                        // 不等于1就不能点半份
                        if (allMenuData[menu].half != 1 && (allMenuData[menu].count % 1 == 0.5 )) {
                            delete allMenuData[menu];
                            continue;
                        }
                    } else {
                        // 有点菜口味
                        var count = 0, price = 0;
                        for (var k in orderInfo[type][menu]) {

                            var has = false;

                            // 此菜品口味在最新菜品中是否有
                            for (var i in allMenuData[menu].flavor) {
                                if (k == allMenuData[menu].flavor[i]) {
                                    has = true;
                                }
                            }

                            // 此菜品口味在最新菜品中没有，跳过此点菜口味
                            if (has == false) {
                                continue;
                            }

                            // 点菜没有此口味，并且最新菜品有口味，并且最新菜品中此口味
                            if (!allMenuData[menu].flavorObj[k] && allMenuData[menu].flavor && (has == true)) {
                                allMenuData[menu].flavorObj[k] = {};
                                allMenuData[menu].flavorObj[k].id = allMenuData[menu].id;
                                allMenuData[menu].flavorObj[k].type = allMenuData[menu].type;
                                allMenuData[menu].flavorObj[k].name = allMenuData[menu].name;
                                allMenuData[menu].flavorObj[k].count = 0;
                                allMenuData[menu].flavorObj[k].price = 0;
                                allMenuData[menu].flavorObj[k].flavor = k;
                                allMenuData[menu].flavorObj[k].dishesPrice = allMenuData[menu].dishesPrice;
                                allMenuData[menu].flavorObj[k].half = allMenuData[menu].half;
                                allMenuData[menu].flavorObj[k].is_shop = allMenuData[menu].is_shop;
                                allMenuData[menu].flavorObj[k].is_send = allMenuData[menu].is_send;
                                allMenuData[menu].flavorObj[k].is_booking = allMenuData[menu].is_booking;
                            }

                            allMenuData[menu].flavorObj[k].count = Number(orderInfo[type][menu][k].menu_count);
                            allMenuData[menu].flavorObj[k].price = Number(orderInfo[type][menu][k].menu_price) * Number(orderInfo[type][menu][k].menu_count);

                            // 不等于1就不能点半份
                            if (allMenuData[menu].flavorObj[k].half != 1
                                && (allMenuData[menu].flavorObj[k].count % 1 == 0.5 )) {
                                delete allMenuData[menu].flavorObj[k];
                                continue;
                            }

                            count += Number(allMenuData[menu].flavorObj[k].count);
                            price += Number(allMenuData[menu].flavorObj[k].price);
                        }
                        allMenuData[menu].count = count;
                        allMenuData[menu].price = price;
                    }

                }
            }
        },

        /**
         * 清除便当已点菜品缓存，订单信息点菜数据更新到已点菜品缓存
         * @param  {object} orderInfo   订单菜品
         * @param  {object} menuInfo    菜品基本数据
         * @param  {object} allMenuData 空的点菜数据存储容器
         * @return {}             无返回
         */
        /*updateLunchDishesCache: function(orderInfo, menuInfo, allMenuData) {
            for (var type in orderInfo) {
                for (var menu in orderInfo[type]) {

                    // 获取当前菜品的最新信息
                    var menuName = menuInfo[type][menu];
                    if (!menuName) {
                        continue;
                    }

                    // 获取当前菜品在点菜中的缓存记录
                    var dishes = allMenuData[menu],

                    // 获取当前菜品的最新信息，口味等
                        baseMenu = menuName.base,
                        menuFlavor = menuName.menu_flavor,

                    // 菜品的支持性(1支持，0,2不支持)
                        menuIsHalf = baseMenu.menu_is_half == 1 ? 1 : 2;

                    // 点菜缓存中不存在此菜品创建一条
                    if (!dishes) {
                        dishes = {};
                        dishes.id = menu;
                        dishes.type = type;
                        dishes.name = baseMenu.menu_name;
                        dishes.count = 0;
                        dishes.price = 0;
                        dishes.flavor = menuFlavor;
                        dishes.dishesPrice = Number(baseMenu.menu_price);
                        dishes.half = menuIsHalf;
                        dishes.flavorObj = {};
                    } else {
                        // 此菜品的最新数据和缓存中此菜品数据不一样，删除缓存中点菜数据
                        if (
                            Number(baseMenu.menu_price) != allMenuData[menu].dishesPrice ||
                            menuIsHalf != allMenuData[menu].half ||
                            JSON.stringify(menuFlavor) != JSON.stringify(allMenuData[menu].flavor)
                        ) {
                            delete allMenuData[menu];
                            continue;
                        }
                    }

                    allMenuData[menu] = dishes;

                    // 无点菜口味
                    if (orderInfo[type][menu].base) {
                        allMenuData[menu].count = Number(orderInfo[type][menu].base.menu_count);
                        allMenuData[menu].price = Number(orderInfo[type][menu].base.menu_price) * Number(orderInfo[type][menu].base.menu_count);

                        // 不等于1就不能点半份
                        if (allMenuData[menu].half != 1 && (allMenuData[menu].count % 1 == 0.5 )) {
                            delete allMenuData[menu];
                            continue;
                        }
                    } else {
                        // 有点菜口味
                        var count = 0, price = 0;
                        for (var k in orderInfo[type][menu]) {

                            var has = false;

                            // 此菜品口味在最新菜品中是否有
                            for (var i in allMenuData[menu].flavor) {
                                if (k == allMenuData[menu].flavor[i]) {
                                    has = true;
                                }
                            }

                            // 此菜品口味在最新菜品中没有，跳过此点菜口味
                            if (has == false) {
                                continue;
                            }

                            // 点菜没有此口味，并且最新菜品有口味，并且最新菜品中此口味
                            if (!allMenuData[menu].flavorObj[k] && allMenuData[menu].flavor && (has == true)) {
                                allMenuData[menu].flavorObj[k] = {};
                                allMenuData[menu].flavorObj[k].id = allMenuData[menu].id;
                                allMenuData[menu].flavorObj[k].type = allMenuData[menu].type;
                                allMenuData[menu].flavorObj[k].name = allMenuData[menu].name;
                                allMenuData[menu].flavorObj[k].count = 0;
                                allMenuData[menu].flavorObj[k].price = 0;
                                allMenuData[menu].flavorObj[k].flavor = k;
                                allMenuData[menu].flavorObj[k].dishesPrice = allMenuData[menu].dishesPrice;
                                allMenuData[menu].flavorObj[k].half = allMenuData[menu].half;
                            }

                            allMenuData[menu].flavorObj[k].count = Number(orderInfo[type][menu][k].menu_count);
                            allMenuData[menu].flavorObj[k].price = Number(orderInfo[type][menu][k].menu_price) * Number(orderInfo[type][menu][k].menu_count);

                            // 不等于1就不能点半份
                            if (allMenuData[menu].flavorObj[k].half != 1
                                && (allMenuData[menu].flavorObj[k].count % 1 == 0.5 )) {
                                delete allMenuData[menu].flavorObj[k];
                                continue;
                            }

                            count += Number(allMenuData[menu].flavorObj[k].count);
                            price += Number(allMenuData[menu].flavorObj[k].price);
                        }
                        allMenuData[menu].count = count;
                        allMenuData[menu].price = price;
                    }

                }
            }
        },*/

        /**
         * 跳去点菜页面前的准备
         * @param  {object} data 订单数据
         * @param  {string} name 缓存名称
         * @return {}      无返回
         */
        readyToDishesPage: function(data, name, page) {

            // 香锅
            //if (data.order_type != '7') {
                Cache.set('order_id', data.order_id);
                Cache.set('shop_no', data.shop_no);
                Cache.set('order_type', data.order_type);
            // 便当
            /*} else {
                Cache.set('lunch_order_id', data.order_id);
            }*/

            // 根据不同类型写入不同缓存
            if (data.order_type == '1') {
                Cache.set('tab_id', data.tab_name);
            } else if (data.order_type == '2') {
                var location = {
                    id: data.addr_id,
                    city: data.city,
                    ambitus: data.ambitus,
                    addr: data.addr,
                    shop: data.shop_no,
                    contact: data.contact,
                    tel: data.tel
                };
                Cache.set('location', location);
            } else if (data.order_type == '3') {
                Cache.set('person', data.person_num);
            } /*else {
                var location = {
                    id: data.addr_id,
                    city: data.city,
                    ambitus: data.ambitus,
                    addr: data.addr,
                    shop: data.shop_no,
                    contact: data.contact,
                    tel: data.tel
                };
                Cache.set('lunch_address', location);
            }*/

            // 设置编辑订单返回页面（order:订单详情，payorder:订单支付）
            Cache.set('edit_order_return_page', page);

            // 打开点菜页面
            //Page.open(name == 'allmenu' ? 'dishes' : 'lunchbox');
            Page.open('dishes');
        }

    };

});