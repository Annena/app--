function Swipe(container, options) {

    // 严格模式
    "use strict";

    // 检测浏览器属性
    var browser = {

        // window.addEventListener || false
        addEventListener: !!window.addEventListener,

        // window 是否支持 touchstart
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,

        // 判断浏览器是否支持以下属性
        transitions: (function(temp) {
            var props = ['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];

            for ( var i in props ) {
                if (temp.style[ props[i] ] !== undefined) {
                    return true;
                }
            }

            return false;
        })(document.createElement('swipe'))
    };

    // console.log(browser);

    // 不存在内容直接return
    if (!container) return;

    // 元素的第一个子元素
    var element = container.children[0];

    // 所有滑动元素的子元素，子元素的位置，子元素的宽度
    var slides, slidePos, width;

    // 选项
    options = options || {};

    // 开始索引
    var index = parseInt(options.startSlide, 10) || 0;

    // 滑动速度
    var speed = options.speed || 300;

    var offloadFn = function(fn) {
        setTimeout(fn || function() {}, 0);
    };

    // 设置元素的宽度，及其子元素的宽度，left
    function setup() {

        // 当前元素要滑动元素的子元素
        slides = element.children;

        // create an array to store current positions of each slide
        // 创建一个数组来存储当前幻灯片的位置
        slidePos = new Array(slides.length);

        // 元素的最大宽度
        width = container.getBoundingClientRect().width || container.offsetWidth;

        // 设置元素的宽度
        element.style.width = (slides.length * width) + 'px';

        // stack elements
        var pos = slides.length;
        while (pos--) {

            var slide = slides[pos];

            // 设置子元素的宽度
            slide.style.width = width + 'px';
            slide.setAttribute('data-index', pos);

            if (browser.transitions) {
                // 设置元素的left
                slide.style.left = (pos * -width) + 'px';   // TODO
                // console.log('默认开始索引：' + index);
                // console.log('当前索引：' + pos);
                // console.log('子元素宽度' + width);
                move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
            }

        }

        // 元素不支持
        if (!browser.transitions) element.style.left = (index * -width) + 'px';

        // 设置元素可见
        container.style.visibility = 'visible';
    }

    function prev() {
        if (index) {
            slide(index-1);
        } else if (options.continuous) {
            slide(slides.length-1);
        }
    }

    function next() {
        if (index < slides.length - 1) {
            slide(index+1);
        } else if (options.continuous) {
            slide(0);
        }
    }

    function slide(to, slideSpeed) {

        // console.log(index, to);

        // do nothing if already on requested slide
        if (index == to) return;

        if (browser.transitions) {

            var diff = Math.abs(index-to) - 1;

            // 当前元素是移动方向，1：right, 2：left
            var direction = Math.abs(index-to) / (index-to);

            // console.log(diff, direction);

            // 只要diff大于0，要将每个元素移动
            while (diff--) {
                move((to > index ? to : index) - diff - 1, width * direction, 0);
            }

            // 移动元素
            move(index, width * direction, slideSpeed || speed);
            move(to, 0, slideSpeed || speed);

        } else {

            animate(index * -width, to * -width, slideSpeed || speed);

        }

        index = to;

        // 调用回调函数
        offloadFn(options.callback && options.callback(index, slides[index]));

    }

    // 移动元素
    function move(index, dist, speed) {
        // console.log(index, dist, speed);
        translate(index, dist, speed);
        slidePos[index] = dist;
        // console.log(slidePos);
    }

    // 元素滑动效果
    function translate(index, dist, speed) {

        var slide = slides[index];
        var style = slide && slide.style;

        // console.log(slide);
        // console.log(dist);
        // console.log(slide.style);

        if (!style) return;

        // 过度速度，多少时间之内干什么事
        style.webkitTransitionDuration =
        style.MozTransitionDuration =
        style.msTransitionDuration =
        style.OTransitionDuration =
        style.transitionDuration = speed + 'ms';

        // 转换效果，转换什么效果
        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform =
        style.MozTransform =
        style.OTransform = 'translateX(' + dist + 'px)';

    }

    // 动画
    function animate(from, to, speed) {

        // if not an animation, just reposition
        if (!speed) {
            element.style.left = to + 'px';
            return;
        }

        var start = +new Date;

        var timer = setInterval(function() {

            var timeElap = +new Date - start;

            if (timeElap > speed) {

                element.style.left = to + 'px';

                if (delay) begin();

                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

                clearInterval(timer);
                return;
            }

            element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

        }, 4);
    }

    // 设置自动滚动
    var delay = options.auto || 0;
    var interval;

    // 开始
    function begin() {
        interval = setTimeout(next, delay);
    }

    // 停止
    function stop() {
        delay = 0;
        clearTimeout(interval);
    }

    // 设置初始变量
    var start = {};
    var delta = {};
    var isScrolling;

    // 设置事件
    var events = {

        // addEventlistener
        handleEvent: function(event) {

            // console.log(event);

            switch (event.type) {
                case 'mousedown': this.start(event); break;
                case 'mousemove': this.move(event); break;
                case 'mouseup': offloadFn(this.end(event)); break;
                case 'touchstart': this.start(event); break;
                case 'touchmove': this.move(event); break;
                case 'touchend': offloadFn(this.end(event)); break;
                case 'webkitTransitionEnd':
                case 'msTransitionEnd':
                case 'oTransitionEnd':
                case 'otransitionend':
                case 'transitionend': offloadFn(this.transitionEnd(event)); break;
                case 'resize': offloadFn(setup.call()); break;
            }

            // 阻止事件冒泡
            if (options.stopPropagation) event.stopPropagation();
        },

        start: function(event) {

            if (event.type == 'mousedown') {
                start = {

                    // get initial touch coords
                    x: event.pageX,
                    y: event.pageY,

                    // store time to determine touch duration
                    time: + new Date

                };
            } else {
                var touches = event.touches[0];

                // measure start values
                start = {

                    // get initial touch coords
                    x: touches.pageX,
                    y: touches.pageY,

                    // store time to determine touch duration
                    time: + new Date

                };
            }

            // console.log('开始 x:' + start.x, '结束 y:' + start.y);

            // used for testing first move event
            isScrolling = undefined;

            // reset delta and end measurements
            delta = {};

            // attach touchmove and touchend listeners
            element.addEventListener('touchmove', this, false);
            element.addEventListener('touchend', this, false);

            element.addEventListener('mousemove', this, false);
            element.addEventListener('mouseup', this, false);
        },

        // 元素移动
        move: function(event) {

            if (event.type == 'mousemove') {
                delta = {
                    x: event.pageX - start.x,
                    y: event.pageY - start.y
                }
            } else {
                // ensure swiping with one touch and not pinching
                if ( event.touches.length > 1 || event.scale && event.scale !== 1) return

                // 如果元素禁用滑动，阻止事件的默认行为
                if (options.disableScroll) event.preventDefault();

                var touches = event.touches[0];

                // console.log('当前点的x:' + touches.pageX, '当前点的y:' + touches.pageY);

                // 计算移动的x,y
                delta = {
                    x: touches.pageX - start.x,
                    y: touches.pageY - start.y
                }
            }

            // console.log('当前点与开始的差距x:' + delta.x, '当前点与开始的差距y:' + delta.y);

            // 判断用户是不是垂直滚动
            if ( typeof isScrolling == 'undefined') {
                isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
            }

            // console.log(isScrolling);

            // 用户不是垂直滚动
            if (!isScrolling) {

                // 阻止事件的默认行为
                event.preventDefault();

                // console.log(index);

                // 停止滑动
                stop();

                var isDege = (!index && delta.x > 0 || index == slides.length - 1 && delta.x < 0);

                // increase resistance if first or last slidexc
                // 如果是第一张图片或者是最后一张图片增加阻力
                // console.log(Math.abs(delta.x) / width + 1);
                // delta.x = delta.x / ( isDege ? ( Math.abs(delta.x) / width + 1 ) : 1 );                                 // 为false,无阻力

                // console.log(delta);

                // 反弹
                if (isDege) {
                    return;
                }

                // 移动元素,当前元素的前一元素，当前元素，当前元素的后一元素
                translate(index-1, delta.x + slidePos[index-1], 0);
                translate(index, delta.x + slidePos[index], 0);
                translate(index+1, delta.x + slidePos[index+1], 0);

            }

        },

        // 元素移动结束
        end: function(event) {

            // (测量时间差距)measure duration
            var duration = +new Date - start.time;

            // console.log(duration);
            // console.log(Math.abs(delta.x));
            // console.log(Math.abs(delta.x) > width / 2);

            // determine if slide attempt triggers next/prev slide
            // 触发幻灯片的上一张，下一张
            var isValidSlide =
                Number(duration) < 250               // 如果幻灯片持续事件小于250ms
                && Math.abs(delta.x) > 20            // 如果滑动大于20px
                || Math.abs(delta.x) > width / 2;    // 或者滑动大于宽度的一半

            // 是否到边缘了
            var isPastBounds = (!index && delta.x > 0 || index == slides.length - 1 && delta.x < 0);

            // determine direction of swipe (true:right, false:left)
            // 确定滑动的方向
            var direction = delta.x < 0;

            // if not scrolling vertically
            if (!isScrolling) {

                // console.log(isValidSlide);
                // console.log(isPastBounds);
                // console.log(direction);

                if (isValidSlide && !isPastBounds) {

                    // 向右滑动
                    if (direction) {

                        move(index-1, -width, 0);
                        move(index, slidePos[index]-width, speed);
                        move(index+1, slidePos[index+1]-width, speed);
                        index += 1;

                    // 向左滑动
                    } else {

                        move(index+1, width, 0);
                        move(index, slidePos[index]+width, speed);
                        move(index-1, slidePos[index-1]+width, speed);
                        index += -1;

                    }

                    // 调用回调函数
                    options.callback && options.callback(index, slides[index]);

                } else {

                    move(index-1, -width, speed);
                    move(index, 0, speed);
                    move(index+1, width, speed);

                }

            }

            // 杀死touchmove和touchend事件侦听器，直到再次调用touchstart
            // kill touchmove and touchend event listeners until touchstart called again
            element.removeEventListener('touchmove', events, false);
            element.removeEventListener('touchend', events, false);

            element.removeEventListener('mousemove', events, false);
            element.removeEventListener('mouseout', events, false);

        },

        // 过渡结束
        transitionEnd: function(event) {
            if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
                if (delay) begin();
                options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
            }
        }

    }

    // 触发设置元素宽度
    setup();

    // 开始自动播放幻灯片
    // console.log(delay);
    if (delay) begin();

    // 添加时间监听
    if (browser.addEventListener) {

        // set touchstart event on element
        if (browser.touch) {
            element.addEventListener('touchstart', events, false);
        } else {
            element.addEventListener('mousedown', events, false);
        }

        if (browser.transitions) {
            element.addEventListener('webkitTransitionEnd', events, false);
            element.addEventListener('msTransitionEnd', events, false);
            element.addEventListener('oTransitionEnd', events, false);
            element.addEventListener('otransitionend', events, false);
            element.addEventListener('transitionend', events, false);
        }

        // set resize event on window
        window.addEventListener('resize', events, false);
    } else {
        window.onresize = function () { setup() }; // to play nice with old IE
    }

    // expose the Swipe API
    return {
        setup: function() {
            setup();
        },

        slide: function(to, speed) {
            slide(to, speed);
        },

        prev: function() {
            stop();
            prev();
        },

        next: function() {
            stop();
            next();
        },

        getPos: function() {
            return index;
        },

        kill: function() {
            stop();
            element.style.width = 'auto';
            element.style.left = 0;

            // reset slides
            var pos = slides.length;
            while(pos--) {

                var slide = slides[pos];
                slide.style.width = '100%';
                slide.style.left = 0;

                if (browser.transitions) translate(pos, 0, 0);

            }

            // removed event listeners
            if (browser.addEventListener) {

                // remove current event listeners
                element.removeEventListener('touchstart', events, false);
                element.removeEventListener('webkitTransitionEnd', events, false);
                element.removeEventListener('msTransitionEnd', events, false);
                element.removeEventListener('oTransitionEnd', events, false);
                element.removeEventListener('otransitionend', events, false);
                element.removeEventListener('transitionend', events, false);
                window.removeEventListener('resize', events, false);

            } else {
                window.onresize = null;
            }
        }
    }

}

if ( window.jQuery || window.Zepto ) {
    (function($) {
        $.fn.Swipe = function(params) {
            return this.each(function() {
                $(this).data('Swipe', new Swipe($(this)[0], params));
            });
        }
    })( window.jQuery || window.Zepto )
}
