//建立对象
var canvas=document.getElementById('sign');  //画布对象
var ctx1=canvas.getContext('2d');
var canvas2=document.getElementById('canvas2'); //临时画布对象
var ctx2=canvas2.getContext('2d');

$(function() {
    var compress = 0.7;
    //在线体验跳转
    $('#toDemo').click(function () {
        document.getElementById('demo').scrollIntoView();
    });

    var $writingList = $('#hwr-demo-writing').find('span');
    $writingList.click(function () {
        for (i = 0; i < $writingList.length; i++) {
            $writingList.eq(i).removeClass('active');
        }
        $(this).addClass('active');
    })
    var ctx = document.getElementById("sign");
    ctx.width = $('#sign')[0].offsetWidth;
    ctx.height = $('#sign')[0].offsetHeight;
    //初始化签名样式（这里仅支持一个签名，如需多个签名框需改写组件）
    $('#sign').canvasSignature({
        strokeStyle: 'blue',
        compress: compress
    });

    $("#clear-content").on("click", function () {
        $(".hwr-bar").html("");
        $('#sign').clearSignature();
    });

    function hdr(imgStr) {
        $.ajax({
            url: "/desktop",
            data: {
                content:imgStr,
                lang: $("select[name=language]").val(),
                model: $("#hwr-demo-writing").find('span.active')
                    .not('.disable').attr('_model')
            },
            method: 'post',
            success: function (data) {
                $("#hwr-tip").html(data);
            }
        });
    }

    // 结果选入
    $(".hwr-bar").on('click', '.result-select', function () {
        $(this).siblings().removeClass("red");
        $(this).addClass('red');
        var text = $(this).find('.v').text();
        $("#hwr-content").text($("#hwr-content").text() + text);
        $(".hwr-bar").html("");
        $('#sign').clearSignature();
        _hmt.push(['_trackEvent', '手写识别体验', 'click', '文字选中', 1]);
    });

    //  定时发送请求, 监控变量的变化
    var last_path_data = [];
    setInterval(function () {
        var path_data = $('#sign').getPath();
        if (path_data.length == last_path_data.length || path_data.length <= 4) {
            return false;
        } else {
            last_path_data = path_data;
            getImage(); //笔迹发生变化时
        }
    }, 1000);

    $("select[name=language]").on("change", function () {
        var selected = $(this).find('option:selected');
        var _model = selected.attr('_model');
        var _align = selected.attr('_align');
        // 书写方向
        if (_align == "right") {
            $("#hwr-content").css({
                "direction": "rtl",
                "unicode-bidi": "bidi-override"
            })
        } else {
            $("#hwr-content").css({
                "direction": "",
                "unicode-bidi": ""
            })
        }
        /*/ 分割支持的模式
        var _model_arr = _model.split(',');
        if ($.inArray('line', _model_arr) == -1) {
            $("#hwr-demo-writing").find("span[_model=line]").addClass('disable');
        } else {
            $("#hwr-demo-writing").find("span[_model=line]").removeClass('disable');
        }
        if ($.inArray('overlap', _model_arr) == -1) {
            $("#hwr-demo-writing").find("span[_model=overlap]").addClass('disable');
        } else {
            $("#hwr-demo-writing").find("span[_model=overlap]").removeClass('disable');
        }*/
        // 清空写字区域
        $('#sign').clearSignature();
    });
    $("select[name=color]").on("change", function () {
        var color = $(this).find('option:selected').val();
        if ($.inArray(color, ["red", "blue"]) > -1) {
            $('#sign').canvasSignature({
                strokeStyle: color,	//笔画颜色，默认为蓝色
                compress: compress
            });
            $('#sign').clearSignature();
            // 候选框选择
            $(".hwr-bar").html("");
        }
    });
    $("select[name=language]").trigger('change');

    function getImage(){
    //通过getImageData(左上角x,左上角y,右下角x,右下角y)获得整个canvas数据
        var All_Data=ctx1.getImageData(0,0,canvas.width,canvas.height).data;
        //初始化两个新的截取点
        var newX1=canvas.width,newY1=canvas.width,newX2=0,newY2=0;
        for(var i=0; i<canvas.width; i++){
        for(var j=0; j<canvas.height; j++){
            //每个坐标点存储为四个数（RGBA格式），取得第一个Red在数组中的位置
            var Red_position = (i + canvas.width * j) * 4;
            //如果那个坐标有色彩
            if (All_Data[Red_position] > 0 || All_Data[Red_position + 1] > 0 || All_Data[Red_position + 2] > 0 || All_Data[Red_position + 3] > 0) {
                newX1 = Math.min(i,newX1); //左上点坐标
                newY1 = Math.min(j,newY1);
                newX2 = Math.max(i,newX2); //右下点坐标
                newY2 = Math.max(j,newY2);
            }
        }}
        newX1-=20;newY1-=20;newX2+=20;newY2+=20;//加内边距
        //获得截取宽高，比较，然后缩放图片对象
        var width=newX2-newX1,height=newY2-newY1;
        var imageData;
                if(width>=height){
            var len=(width-height)/2.0;
            if (width<=canvas.height){
                imageData=ctx1.getImageData(newX1, newY1-len, width, width);
                imageData=scaleImageData(imageData,28/width);
            }else{
                imageData=ctx1.getImageData(newX1, 0, width, canvas.height);
                imageData=scaleImageData(imageData,28/width);
            }
        }else{
            var len=(height-width)/2.0;
            if(height<=canvas.width){
                imageData=ctx1.getImageData(newX1-len, newY1, height, height);
                imageData=scaleImageData(imageData,28/height);
            }else{
                imageData=ctx1.getImageData(0, newY1, canvas.width, height);
                imageData=scaleImageData(imageData,28/height);
            }
        }
        //截取区域放入临时canvas
        ctx2.putImageData(imageData,0,0);
        var newImgData=ctx2.getImageData(0,0,28,28).data;
        var json={"img":newImgData};
        var imgStr=JSON.stringify(json);
        hdr(imgStr);
        ctx2.clearRect(0,0,28,28);
    }
});
function scaleImageData(imageData, scale) {
    var scaled = ctx2.createImageData(imageData.width * scale, imageData.height * scale);
    for (var row = 0; row < imageData.height; row++) {
        for (var col = 0; col < imageData.width; col++) {
            var sourcePixel = [
                imageData.data[(row * imageData.width + col) * 4 + 0],
                imageData.data[(row * imageData.width + col) * 4 + 1],
                imageData.data[(row * imageData.width + col) * 4 + 2],
                imageData.data[(row * imageData.width + col) * 4 + 3]
            ];
            for (var y = 0; y < scale; y++) {
                var destRow = Math.floor(row * scale) + y;
                for (var x = 0; x < scale; x++) {
                    var destCol = Math.floor(col * scale) + x;
                    for (var i = 0; i < 4; i++) {
                        scaled.data[(destRow * scaled.width + destCol) * 4 + i] = sourcePixel[i];
                    }
                }
            }
        }
    }
    return scaled;
}


