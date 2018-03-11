define('base/pattern', ['base/message'], function (Message) {

    // 正则表达式
    var Pattern = {
        empty: '',
        number: /^[0-9]\d*(\.(\d){1,2})?$/,
        chinese: /[\u4e00-\u9fa5]/,
        phoneNumber: /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/,
        mobileNumber: /^1[0-9]{10}$/,///^1[3,4,5,7,8]{1}[0-9]{1}[0-9]{8}$/
        email: /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,4}$/,
        id: /\d{15}|\d{18}/,
        //RegExp 对象用于规定在文本中检索的内容。
        containSpecial: RegExp(/[(\ )(\~)(\!)(\@)(\#)(\$)(\%)(\^)(\&)(\*)(\()(\))(\-)(\_)(\+)(\=)(\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/)(\<)(\>)(\?)(\)]+/),
        pass: /^[A-Za-z0-9]{6,16}$/,
        Num: /^\d{0,24}$/
    };

    // 验证正则表达式
    var Validate = {

        // 空验证
        isEmpty: function(text) {
            if (text == Pattern.empty) {
                return true;
            }
        },

        // 数字验证
        isNumber: function(text) {
            if (!Pattern.number.test(text)) {
                return true;
            }
        },

        // 汉字验证
        isChinese: function(text) {
            if (!Pattern.chinese.test(text)) {
                return true;
            }
        },

        // 电话验证
        isPhoneNumber: function(text) {
            if (!Pattern.phoneNumber.test(text)) {
                return true;
            }
        },

        // 手机验证
        isMobileNumber: function(text) {
            if(!Pattern.mobileNumber.test(text)) {
                return true;
            }
        },

        // 邮箱验证
        isEmail: function(text) {
            if (!Pattern.email.test(text)) {
                return true;
            }
        },

        // 身份证验证
        isId: function(text) {
            if (!Pattern.id.test(text)) {
                return true;
            }
        },

        // 特殊字符验证 test() 方法检索字符串中的指定值
        isContainSpecial : function (text) {
            if (!Pattern.containSpecial.test(text)) {
                return true;
            }
        },

        // 长度验证
        isPassLength : function (text) {
            if (text.length > 6 && text.length < 16) {
                return true;
            }
        },

        // 短信验证码长度验证
        isSmsVerification: function (text) {
            if (text.length == 6) {
                return true;
            }
        },

        // 密码验证 （字母或数字6-16位）
        ispass: function (text) {
            if (!Pattern.pass.test(text)) {
                return true;
            }
        },
        isNum: function (text) {
            if (!Pattern.Num.test(text)) {
                return true;
            }
        }

    };

    /* 校验数据 */
    function dataTest(dom, prompt, options) {
        var text = $(dom).val();
        var description = $(dom).attr('data-description');
        if ( $(dom).attr('data-required') == 'true' || ($(dom).attr('data-required') != 'true' && text != '') ) {
            if (options.empty && Validate.isEmpty(text)) {
                Message.show(prompt, description + options.empty, 3000);
                return false;
            } else if (options.id && Validate.isId(text)) {
                Message.show(prompt, description + options.id, 3000);
                return false;
            } else if (options.mobileNumber && Validate.isMobileNumber(text)) {
                Message.show(prompt, description + options.mobileNumber, 3000);
                return false;
            } else if (options.phoneNumber && Validate.isPhoneNumber(text)) {
                Message.show(prompt, description + options.phoneNumber, 3000);
                return false;
            } else if (options.number && Validate.isNumber(text)) {
                Message.show(prompt, description + options.number, 3000);
                return false;
            } else if (options.containSpecial && Validate.isContainSpecial(text)) {
                Message.show(prompt, description + options.containSpecial, 3000);
                return false;
            } else if (options.passLength && Validate.isPassLength(text)){
                Message.show(prompt, description + options.passLength, 3000);
                return false;
            } else if (options.smsVerification && Validate.isSmsVerification(text)){
                Message.show(prompt, description + options.smsVerification, 3000);
                return false;
            } else if (options.pass && Validate.ispass(text)){
                Message.show(prompt, description + options.pass, 3000);
                return false;
            } else if(options.Num && Validate.isNum(text)) {
                Message.show(prompt, description + options.Num, 3000);
                return false;
            }

        }
        return true;
    }

    return {
       dataTest: dataTest
    };

});