;(function($) {

    var div = document.createElement('div').style,
        has3d = testProps(['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective']),
        hasFlex = testProps(['flex', 'msFlex', 'WebkitBoxDirection']),
        prefix = testPrefix(),
        pr = prefix.replace(/^\-/, '').replace(/\-$/, '').replace('moz', 'Moz'),
        extend = $.extend;


    // 判断浏览器是否有此属性
    function testProps(props) {

        var i;

        for (i in props) {
            if (div[props[i]] !== undefined) {
                return true;
            }
        }

        return false;

    }

    // 判断浏览器支持哪一种前缀
    function testPerfix() {
        var p,
            perfixs = ['Webkit', 'Moz', 'o', 'ms'];

        for (p in perfixs) {
            if (testProps[perfixs[p] + 'Transform']) {
                return '-' + perfixs[p].toLowerCase() + '-';
            }
        }

        return '';
    }

    function init(that, options) {
        return that.each(function () {
            if (!this.id) {
                this.id = 'mobiscroll' + (++id);
            }
            if (instances[this.id]) {
                instances[this.id].destroy();
            }
            new $.mobiscroll.classes[options.component || 'Scroller'](this, options);
        });
    }

    $.fn.select = function(method) {

        extend(this);

        return init(this, method, arguments);
    }

    $.select = $.select || {

        util: {
            prefix: prefix,
            jsPrefix: pr,
            has3d: has3d,
            hasFlex: hasFlex
        },

        classes: {}
    }

})(jQuery);