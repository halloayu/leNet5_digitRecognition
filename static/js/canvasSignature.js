;(function ($) {
    //默认参数及其介绍
    var defaults = {
        fillStyle: 'transparent',	//生成图片背景色，默认为透明
        lineWidth: 10,	//笔画粗细（尺寸），默认为10像素粗细
        compress: 0.8,
        strokeStyle: '#000',	//笔画颜色，默认为黑色
    };

    /* 电子签名实现 */
    var _drawCount = 0;
    var _drawSign = false;
    var _context = '';
    var _canvas = '';
    var _isPC = true;
    var _drawPath = [];
    var _drawLine = [];
    //判定是移动端还是PC端
    if (!!("ontouchend" in document)) _isPC = false;

    function _setCanvasInit(ele, param) {
        _canvas = ele;
        _context = _canvas.getContext('2d');
        _drawCount = 0;

        _context.fillStyle = param.fillStyle;
        _context.lineWidth = param.lineWidth;
        _context.strokeStyle = param.strokeStyle;
        _context.compress = param.compress;
    }

    //初始化签名框
    $.fn.canvasSignature = function (options) {
        var params = $.extend(defaults, options);

        //初始化
        _setCanvasInit($(this).get(0), params);

        if (!_isPC) { //移动端
            _canvas.addEventListener('touchstart', function (e) {
                var touch = e.touches[0];
                _context.beginPath();
                _context.lineCap="round";
                _context.moveTo(touch.pageX - $(_canvas).offset().left, touch.pageY - $(_canvas).offset().top - $('body').offset().top);
                _context.lineTo(touch.pageX - $(_canvas).offset().left + 4, touch.pageY - $(_canvas).offset().top - $('body').offset().top);
                _context.stroke();
                _drawSign = true;
                _drawCount++;
                // console.log(touch.pageX - $(_canvas).offset().left,touch.pageY - $(_canvas).offset().top - $('body').offset().top);
            }, false);
            _canvas.addEventListener('touchmove', function (e) {
                if (_drawSign) {
                    var touch = e.touches[0];
                    _context.lineTo(touch.pageX - $(_canvas).offset().left, touch.pageY - $(_canvas).offset().top - $('body').offset().top);
                    _context.stroke();
                    // console.log(touch.pageX - $(_canvas).offset().left, touch.pageY - $(_canvas).offset().top - $('body').offset().top);
                }
            }, false);
            _canvas.addEventListener('touchend', function (e) {
                if (_drawSign) {
                    _drawSign = false;
                    _context.closePath();
                }
            }, false);
        } else { //PC端
            _canvas.onmousedown = function (e) {
                var e = e || window.event;
                _context.beginPath();
                _context.lineCap="round";
                _context.moveTo(e.pageX - $(_canvas).offset().left, e.pageY - $(_canvas).offset().top);
                _context.stroke();
                _drawSign = true;
                _drawCount++;
                if (Math.random() <= _context.compress) {
                    _drawPath.push(parseInt(e.pageX - $(_canvas).offset().left), parseInt(e.pageY - $(_canvas).offset().top));
                }
            }
            _canvas.onmousemove = function (e) {
                if (_drawSign) {
                    var e = e || window.event;
                    _context.lineTo(e.pageX - $(_canvas).offset().left, e.pageY - $(_canvas).offset().top);
                    _context.stroke();
                    if (Math.random() <= _context.compress) {
                        _drawPath.push(parseInt(e.pageX - $(_canvas).offset().left), parseInt(e.pageY - $(_canvas).offset().top));
                    }
                }
            }
            _canvas.onmouseout = function (e) {
                if (_drawSign) {
                    _drawSign = false;
                    _context.closePath();
                    _drawPath.push(-1, 0);
                }
            }
            _canvas.onmouseup = function (e) {
                if (_drawSign) {
                    _drawSign = false;
                    _context.closePath();
                    _drawPath.push(-1, 0);
                }
            }
        }

        return this;

    };

    //清除签名
    $.fn.clearSignature = function () {
        _drawCount = 0;
        _context.clearRect(0, 0, _canvas.width, _canvas.height);
        _drawPath = [];

        return this;
    };

    //获取签名
    $.fn.getPath = function () {
        var path_data = _drawPath.concat();
        var last_array = path_data.slice(path_data.length - 2);
        // 兼容有些时候获取不到onmouseup事件
        if (last_array[0] === -1 && last_array[0] === 0) {
            path_data.push(-1, -1);
        } else {
            path_data.push(-1, 0, -1, -1);
        }

        return path_data;
    };

    //生成图片
    $.fn.createSignature = function (pictureType) {
        //生成图片格式base64包括：jpg、png格式
        var _image = '';

        switch (pictureType) {
            case 'jpg':
                _image = _canvas.toDataURL("image/jpeg");
                break;
            case 'png':
                _image = _canvas.toDataURL("image/png");
                break;
            default:
                _image = _canvas.toDataURL();
                break;
        }

        return _image;
    };

})(jQuery);