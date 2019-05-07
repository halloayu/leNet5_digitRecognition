# -*-coding:UTF-8-*-
# @File  :hd_recognize.py
# @Author:ZengYu
# @Date  :2019/4/24
# @software:PyCharm

import tensorflow as tf
import handlers.mnist_cnn as mnist_interence
import handlers.mnist_train as mnist_train
import matplotlib.pyplot as plt

def hd_recognize():
    res = [100] #初始化res
    # 占位符，输入的格式
    x = tf.placeholder(tf.float32, shape=[1,
                                          mnist_interence.IMAGE_SIZE,
                                          mnist_interence.IMAGE_SIZE,
                                          mnist_interence.NUM_CHANNEL], name='x-input')
    # 直接通过调用封装好的函数来计算前向传播的结果，测试时不关注过拟合问题，所以正则化输入为None
    y=mnist_interence.interence(x,None,None)

    # 使用tf.argmax(y, 1)就可以得到输入样例的预测类别
    result=tf.argmax(y,1)
    # 通过变量重命名的方式来加载模型
    variable_averages=tf.train.ExponentialMovingAverage(mnist_train.MOVING_AVERAGE_DECAY)
    variable_to_restore=variable_averages.variables_to_restore()
    # 所有滑动平均的值组成的字典，处在/ExponentialMovingAverage下的值
    # 为了方便加载时重命名滑动平均量，tf.train.ExponentialMovingAverage类提供了variables_to_store函数来生成tf.train.Saver类所需要的变量
    saver=tf.train.Saver(variable_to_restore)

    with tf.Session() as sess:
        # tf.train.get_checkpoint_state函数会通过checkpoint文件自动找到目录中最新模型的文件名
        ckpt = tf.train.get_checkpoint_state("handlers//model") #注意项目的路径问题

        if ckpt and ckpt.model_checkpoint_path:
            # 加载模型
            saver.restore(sess, ckpt.model_checkpoint_path)
            image_raw_data=tf.gfile.GFile('./static/images/target.png','rb').read()
            image_data=tf.image.decode_png(image_raw_data)
            float_image = tf.image.convert_image_dtype(image_data, dtype=tf.float32)

            '''将一个或多个图像从RGB转换为灰度. 
              输出与images具有相同DType和等级的张量.输出的最后一个维度的大小为1,包含像素的灰度值.
           '''
            gray_image = tf.image.rgb_to_grayscale(float_image)
            #显示灰度化的图片
            '''i_data = sess.run(tf.image.rgb_to_grayscale(float_image))
            # 这里必须加 cmap='gray' ,否则尽管原图像是灰度图，但是显示的是伪彩色图像（如果不加的话）
            plt.imshow(i_data[:,:,0], cmap='gray')
            plt.title('gray_image')
            plt.show()'''

            #tf.reshape((28,28))调整维度
            reshaped_image = tf.reshape(gray_image, [1,mnist_interence.IMAGE_SIZE,mnist_interence.IMAGE_SIZE,mnist_interence.NUM_CHANNEL])
            nparray_image = reshaped_image.eval(session=sess)

            # 运行图
            res = sess.run(result, feed_dict={x: nparray_image})

            res_y = sess.run(y, feed_dict={x: nparray_image})

    # 重置默认图
    tf.reset_default_graph()
    # 返回识别结果
    return res[0]
