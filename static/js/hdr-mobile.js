//建立对象
var canvas=document.getElementById('canvas');  //画布对象
var ctx=canvas.getContext('2d');
var canvas2=document.getElementById('canvas2'); //临时画布对象
var ctx2=canvas2.getContext('2d');
getViewPort();//画板尺寸自适应
var t=0;        //计算器
var lastX=0;    //前一个触摸点位置
var lastY=0;
var currectX=0; //当前一个触摸点位置
var currectY=0;
var rect=canvas.getBoundingClientRect();//获得canvas到视窗边框的距离
//===================建立websocket连接===============
window.onload=function(){
    document.getElementById('recog').disabled=true; //没有建立连接时识别按钮失效
    var host="ws://"+window.location.host+"/connect";
    var ws=new WebSocket(host);
    ws.onopen=function(){
        document.getElementById('recog').disabled=false; //没有建立连接时submit按钮有效
    }
    ws.onmessage=function(event){
        var msg=event.data;
        document.getElementById('hdr-result').innerHTML="识别结果为"+msg;
    }
    ws.onclose=function(){
        document.getElementById('recog').disabled=true;
        alert("服务器连接已断开！");
    }

    //======画布监听并绘制贝塞尔曲线========
    canvas.addEventListener('touchstart',function(event){
        //如果这个元素的位置内只有一个手指的话
        if (event.targetTouches.length==1){
            var touch=event.targetTouches[0];
            //手指所在的位置
            lastX=touch.clientX - rect.left;
            lastY=touch.clientY - rect.top;
            ctx.beginPath();    //开始绘制
            ctx.lineWidth=15;   //线宽15
            ctx.lineCap="round";//圆形结束帽
            //当手指移动时
            canvas.addEventListener('touchmove',function(event){
                event.preventDefault(); //阻止滚动
                t++;
                //当手指第一次移动后,不断更改上一个触摸点位置
                if (t>1){
                    lastX=currectX;
                    lastY=currectY;
                }
                var touch2=event.targetTouches[0];
                //当前手指所在的位置
                currectX=touch2.clientX - rect.left;
                currectY=touch2.clientY - rect.top;
                //计算中间点的坐标
                var mX=(lastX + currectX) / 2.0;
                var mY=(lastY + currectY) / 2.0;
                //当手指第一次移动时，画笔移动到起始点
                if (t==1){
                    ctx.moveTo(mX,mY);
                }
                //以前一个触摸点为控制点、中点为结束点，quadraticCurveTo函数绘制二次贝塞尔曲线
                else{
                    ctx.quadraticCurveTo(lastX,lastY,mX,mY);
                    ctx.stroke();
                }
            },false);
            canvas.addEventListener('touchend',function(event){
                t=0;//触摸结束时，把t计数器清零
            },false);
        }
    },false);
    //清除canvas按钮实现
    document.getElementById('clear').addEventListener('click',function(event){
        ctx.clearRect(0,0,canvas.width,canvas.height);          //清除画布
        document.getElementById('hdr-result').innerHTML="";   //清除上一次的识别结果
    });
    //识别按钮实现
    document.getElementById('recog').addEventListener('click',function(event){
         document.getElementById('hdr-result').innerHTML="识别中...";
        //通过getImageData(左上角x,左上角y,右下角x,右下角y)获得整个canvas数据
        var All_Data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
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
                imageData=ctx.getImageData(newX1, newY1-len, width, width);
                imageData=scaleImageData(imageData,28/width);
            }else{
                imageData=ctx.getImageData(newX1, 0, width, canvas.height);
                imageData=scaleImageData(imageData,28/width);
            }
        }else{
            var len=(height-width)/2.0;
            if(height<=canvas.width){
                imageData=ctx.getImageData(newX1-len, newY1, height, height);
                imageData=scaleImageData(imageData,28/height);
            }else{
                imageData=ctx.getImageData(0, newY1, canvas.width, height);
                imageData=scaleImageData(imageData,28/height);
            }
        }
        //截取区域放入临时canvas
        ctx2.putImageData(imageData,0,0);
        var newImgData=ctx2.getImageData(0,0,28,28).data;
        var json={"img":newImgData};
        var str=JSON.stringify(json);
        ws.send(str);//用websocket发送图片数据
        ctx2.clearRect(0,0,28,28);
    });
}
//画板尺寸自适应
function getViewPort(){
    var viewHeight=window.innerHeight || document.documentElement.clientHeight;
    var viewWidth=window.innerWidth || document.documentElement.clientWidth;
    document.body.style.width=viewWidth;
    canvas.width=viewWidth-34;
    canvas.height=viewHeight-101;
}

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