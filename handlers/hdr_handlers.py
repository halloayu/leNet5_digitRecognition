import tornado.web
import tornado.websocket
import numpy as np
import json
from handlers import hd_recognize
from PIL import Image

class ImgData():
    data=[]  #暂时存储图片数据

class desktopHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("hdr_desktop.html")

class desktopImgHandler(tornado.web.RequestHandler):
    def post(self):
        # 从JSON字符串读取图片数据
        message = self.get_body_argument("content")
        jsonObj = json.loads(message)
        data=[] #暂时存储图片数据（RGBA）
        for val in jsonObj["img"].values():
            data.append(val)
        if (ImgData.data != data):
            ImgData.data = data
            for i in range(28*28):
                if data[i*4+3]<=130:
                    data[i*4]=data[i*4+1]=data[i*4+2]=0   #书写轨迹为白色
                else:
                    data[i*4]=data[i*4+1]=data[i*4+2]=255 #其它区域为黑色
            # 删除透明度通道
            index=0
            count=0
            while index<len(data):
                if count==3: #每隔三个数，删除一个alpha值
                    del data[index]
                    count=0
                index+=1
                count+=1
            # 生成RGB格式的Image对象，保存target.png
            arr=np.asarray(data,dtype=np.uint8)
            arr=np.reshape(arr,(28,28,3))
            img=Image.fromarray(arr,"RGB")
            img.save("./static/images/target.png")
            result = hd_recognize.hd_recognize()# 调用识别函数
            resultLst = []
            resultLst.append(str(result))
            self.render("select_result.html", resultLst=resultLst)


class mobileHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("hdr_mobile.html")


class Connect(tornado.websocket.WebSocketHandler):
    def open(self):
        print("WebSocket Opened!")

    def on_message(self, message):
        # 从JSON字符串读取图片数据
        jsonObj=json.loads(message)
        data=[] #暂时存储图片数据（RGBA）
        for val in jsonObj["img"].values():
            data.append(val)
        for i in range(28*28):
            if data[i*4+3]<=130:
                data[i*4]=data[i*4+1]=data[i*4+2]=0   #书写轨迹为白色
            else:
                data[i*4]=data[i*4+1]=data[i*4+2]=255 #其它区域为黑色
        # 删除透明度通道
        index=0
        count=0
        while index<len(data):
            if count==3: #每隔三个数，删除一个alpha值
                del data[index]
                count=0
            index+=1
            count+=1
        # 生成RGB格式的Image对象，保存target.png
        arr=np.asarray(data,dtype=np.uint8)
        arr=np.reshape(arr,(28,28,3))
        img=Image.fromarray(arr,"RGB")
        img.save("./static/images/target.png")
        result = hd_recognize.hd_recognize()# 调用识别函数
        self.write_message(str(result))# 将结果返回网页

    def on_close(self):
        print("WebSocket Closed!")
