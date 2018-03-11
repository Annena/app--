(function ($) {

    // 默认设置
    var defaults = {
        inputClass: '',         // 输入框样式
        invalid: [],            // 无效的选择想
        rtl: false,             // 分组和元素的顺序
        showInput: true,        // 是否显示输入框
        group: false,           // 是否分组
        groupLabel: 'Groups',    // 分组标题
        height: 50
    };

    // 写一个mobiscroll的子插件
    $.mobiscroll.presetShort('select');

    // 子插件
    $.mobiscroll.presets.select = function (inst) {

        // console.log(inst);
        // console.log(inst.settings);

        var change,
            grIdx,
            gr,             // select选中的值对应选中的分组的索引
            group,          // select选中的值对应选中的分组
            input,          // select对应的input
            optIdx,
            option,         // select选中的值
            prev,           // select选中的值对应选中的分组的索引
            prevent,
            timer,
            w,
            orig = $.extend({}, inst.settings),

            // 用默认设置和子插件的默认设置合并
            s = $.extend(inst.settings, defaults, orig),

            // 布局
            layout = s.layout || (/top|bottom/.test(s.display) ? 'liquid' : ''),

            // 是否有布局
            isLiquid = layout == 'liquid',

            // 当前设置的select元素
            elm = $(this),

            // 当前select是否多选
            multiple = elm.prop('multiple'),

            // 设置select对应的输入框id
            id = this.id + '-input',

            // 重新设置select对应的label的for属性
            lbl = $('label[for="' + this.id + '"]').attr('for', id),

            // label名称
            label = s.label !== undefined ? s.label : (lbl.length ? lbl.text() : elm.attr('name')),

            // 当前项选中的样式
            selectedClass = 'dw-msel mbsc-ic mbsc-ic-checkmark',

            // 无效的项
            invalid = [],
            origValues = [],

            // 当期select下所有option的集合
            main = {},

            // 元素的只读属性
            roPre = s.readonly;

        // 设置可滚动的元素
        function genWheels() {
            var cont,
                wheel,
                wg = 0,
                values = [],
                keys = [],
                w = [[]];

            // console.log(s.group);

            // 有分组
            if (s.group) {

                // 获取分组的元素存起来
                $('optgroup', elm).each(function (i) {
                    values.push($(this).attr('label'));
                    keys.push(i);
                });

                wheel = {
                    values: values,
                    keys: keys,
                    label: s.groupLabel
                };

                // console.log(wheel);
                // console.log(isLiquid);

                if (isLiquid) {
                    w[0][wg] = wheel;
                } else {
                    w[wg] = [wheel];
                }

                cont = group;
                wg++;

            } else {
                cont = elm;
            }

            values = [];
            keys = [];

            // console.log(cont, wg);

            $('option', cont).each(function () {
                var v = $(this).attr('value');
                values.push($(this).text());
                keys.push(v);
                if ($(this).prop('disabled')) {
                    invalid.push(v);
                }
            });

            wheel = {
                values: values,
                keys: keys,
                label: label
            };

            // console.log(wheel);

            if (isLiquid) {
                w[0][wg] = wheel;
            } else {
                w[wg] = [wheel];
            }

            // console.log(w);
            return w;
        }

        // 获取select的值（多选，单选）,选中的分组
        function getOption() {
            // 获取select的值（多选，单选）
            option = multiple ? (elm.val() ? elm.val()[0] : $('option', elm).attr('value')) : elm.val();
            // console.log(option);

            // 支持分组，获取当前元素的父元素(optgroup)
            if (s.group) {
                group = elm.find('option[value="' + option + '"]').parent();
                // console.log(group[0]);
                gr = group.index();
                // console.log(gr);
                prev = gr;
            }
        }

        function setVal(v, fill, change) {
            var value = [];

            // 支持多选，输入框的值为选中值已特定字符分开的结果
            if (multiple) {
                var sel = [],
                    i = 0;

                for (i in inst._selectedValues) {
                    sel.push(main[i]);
                    value.push(i);
                }

                input.val(sel.join(', '));
            } else {
                // console.log(v);
                input.val(v).attr('data-value', option);
                value = fill ? inst.values[optIdx] : null;
            }

            if (fill) {
                elm.val(value);
                if (change) {
                    prevent = true;
                    elm.change();
                }
            }
        }

        function onTap(li) {
            // if (multiple && li.hasClass('dw-v') && li.closest('.dw').find('.dw-ul').index(li.closest('.dw-ul')) == optIdx) {
            //     var val = li.attr('data-val'),
            //         selected = li.hasClass('dw-msel');

            //     if (selected) {
            //         li.removeClass(selectedClass).removeAttr('aria-selected');
            //         delete inst._selectedValues[val];
            //     } else {
            //         li.addClass(selectedClass).attr('aria-selected', 'true');
            //         inst._selectedValues[val] = val;
            //     }

            //     if (inst.live) {
            //         // console.log(val);
            //         setVal(val, true, true);
            //     }

            //     return false;
            // }
        }

        // If groups is true and there are no groups fall back to no grouping
        // console.log(s);
        // console.log(s.group);
        // console.log(elm);
        // console.log(elm[0]);
        // console.log(!$('optgroup', elm).length);

        // 当前元素支持分组，但实际没有分组，s.group = false
        if (s.group && !$('optgroup', elm).length) {
            s.group = false;
        }

        if (!s.invalid.length) {
            s.invalid = invalid;
        }

        if (s.group) {
            grIdx = 0;
            optIdx = 1;
        } else {
            grIdx = -1;
            optIdx = 0;
        }

        // 获取当前option值，组合option对象
        $('option', elm).each(function () {
            // console.log(this);
            if (!$(this).attr('value')) {
                $(this).attr('value', $(this).text());
            }
            main[$(this).attr('value')] = $(this).text();
            // console.log(main);
        });

        // 获取当前选中的option
        getOption();

        // 删除input输入框
        // $('#' + id).remove();

        // 创建一个input输入框
        // input = $('<input type="text" id="' + id + '" class="' + s.inputClass + '" placeholder="' + (s.placeholder || '') + '" readonly />');
        input = $('input#' + id);

        // input是否显示
        // if (s.showInput) {
            // input.insertBefore(elm);
        // }

        // 绑定input与弹出框的关联
        inst.attachShow(input);

        // 获取元素的值放到inst._selectedValues
        var v = elm.val() || [],
            i = 0;

        for (i; i < v.length; i++) {
            inst._selectedValues[v[i]] = v[i];
        }

        // console.log(main);
        // console.log(option);
        // console.log(main[option]);
        // console.log(inst._selectedValues);

        // 这是选中的值
        // setVal(main[option]);

        elm.off('.dwsel').on('change.dwsel', function () {
            if (!prevent) {
                inst.setValue(multiple ? elm.val() || [] : [elm.val()], true);
            }
            prevent = false;
        }).addClass('dw-hsel').attr('tabindex', -1).closest('.ui-field-contain').trigger('create');

        // Extended methods
        // ---

        // 设置scroller的setValue方法
        if (!inst._setValue) {
            inst._setValue = inst.setValue;
        }

        // 设置可选择的值
        inst.setValue = function (d, fill, time, temp, change) {
            var i,
                value,
                v = $.isArray(d) ? d[0] : d;

            // console.log(d);
            // console.log(fill);
            // console.log(time);
            // console.log(temp);
            // console.log(change);

            option = v !== undefined ? v : $('option', elm).attr('value');

            if (multiple) {
                inst._selectedValues = {};
                for (i = 0; i < d.length; i++) {
                    inst._selectedValues[d[i]] = d[i];
                }
            }

            if (s.group) {
                group = elm.find('option[value="' + option + '"]').parent();
                gr = group.index();
                value = [gr, option];
            } else {
                value = [option];
            }

            inst._setValue(value, fill, time, temp, change);

            // Set input/select values
            if (fill) {
                var changed = multiple ? true : option !== elm.val();
                setVal(main[option], changed, change === undefined ? fill : change);
            }
        };

        inst.getValue = function (temp, group) {
            var val = temp ? inst.temp : inst.values;
            return s.group && group ? val : val[optIdx];
        };

        // ---

        // console.log(w);
        // console.log(layout);
        // console.log('当前元素是否支持多选：' + multiple);
        // console.log('当前元素：' + input[0]);

        return {
            width: 50,          // 宽度
            height: 50,
            wheels: w,          //
            layout: layout,
            headerText: false,  // 头部文本
            multiple: multiple, // 是否支持多选
            anchor: input,      // select对应的输入框
            formatResult: function (d) {
                return main[d[optIdx]];
            },

            // 解析值
            parseValue: function () {
                // console.log('parseValue');
                var v = elm.val() || [],
                    i = 0;

                // 支持多选，将多选的值放在inst._selectedValues
                if (multiple) {
                    inst._selectedValues = {};
                    for (i; i < v.length; i++) {
                        inst._selectedValues[v[i]] = v[i];
                    }
                }

                // 获取所有选项
                getOption();

                // 选中的值，选中值分组的索引 || 返回选中的值
                return s.group ? [gr, option] : [option];
            },

            // 弹出层出现之前
            onBeforeShow: function () {
                // console.log('beforeshow');
                if (multiple && s.counter) {
                    s.headerText = function () {
                        var length = 0;
                        $.each(inst._selectedValues, function () {
                            length++;
                        });
                        return length + ' ' + s.selectedText;
                    };
                }

                // 没有选项就重新获取
                if (option === undefined) {
                    getOption();
                }

                if (s.group) {
                    prev = gr;
                    inst.temp = [gr, option];
                }

                // 获取所有可滚动的元素
                s.wheels = genWheels();
            },
            onMarkupReady: function (dw) {
                // console.log('onMarkupReady');
                dw.addClass('dw-select');

                $('.dwwl' + grIdx, dw).on('mousedown touchstart', function () {
                    clearTimeout(timer);
                });

                if (multiple) {
                    dw.addClass('dwms');

                    $('.dwwl', dw).on('keydown', function (e) {
                        if (e.keyCode == 32) { // Space
                            e.preventDefault();
                            e.stopPropagation();
                            onTap($('.dw-sel', this));
                        }
                    }).eq(optIdx).addClass('dwwms').attr('aria-multiselectable', 'true');

                    origValues = $.extend({}, inst._selectedValues);
                }
            },

            // 联动
            validate: function (dw, i, time) {
                // console.log('validate');
                var j,
                    v,
                    t = $('.dw-ul', dw).eq(optIdx);

                if (i === undefined && multiple) {
                    v = inst._selectedValues;
                    j = 0;

                    $('.dwwl' + optIdx + ' .dw-li', dw).removeClass(selectedClass).removeAttr('aria-selected');

                    for (j in v) {
                        $('.dwwl' + optIdx + ' .dw-li[data-val="' + v[j] + '"]', dw).addClass(selectedClass).attr('aria-selected', 'true');
                    }
                }

                if (i === undefined || i === grIdx) {
                    gr = +inst.temp[grIdx];
                    if (gr !== prev) {
                        group = elm.find('optgroup').eq(gr);
                        option = group.find('option').eq(0).val();
                        option = option || elm.val();
                        s.wheels = genWheels();
                        if (s.group && !change) {
                            inst.temp = [gr, option];
                            s.readonly = [false, true];
                            clearTimeout(timer);
                            timer = setTimeout(function () {
                                change = true;
                                prev = gr;
                                inst.changeWheel([optIdx], undefined, true);
                                s.readonly = roPre;
                            }, time * 1000);
                            return false;
                        }
                    } else {
                        s.readonly = roPre;
                    }
                } else {
                    option = inst.temp[optIdx];
                }

                $.each(s.invalid, function (i, v) {
                    $('.dw-li[data-val="' + v + '"]', t).removeClass('dw-v');
                });

                change = false;
            },
            onClear: function (dw) {
                // console.log('clear');
                inst._selectedValues = {};
                input.val('');
                $('.dwwl' + optIdx + ' .dw-li', dw).removeClass(selectedClass).removeAttr('aria-selected');
            },
            onValueTap: onTap,
            onSelect: function (v) {
                // console.log('select');
                // console.log(v);
                setVal(v, true, true);
            },
            onCancel: function () {
                // console.log('cancel');
                if (!inst.live && multiple) {
                    inst._selectedValues = $.extend({}, origValues);
                }
            },
            onChange: function (v) {
                // console.log('change');
                if (inst.live && !multiple) {
                    input.val(v).attr('data-value', option);
                    prevent = true;
                    elm.val(inst.temp[optIdx]).change();
                }
            },
            onDestroy: function () {
                // console.log('destroy');
                // input.remove();
                elm.removeClass('dw-hsel').removeAttr('tabindex');
            }
        };
    };

})(jQuery);
