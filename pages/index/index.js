var util = require('../../utils/util.js');

//index.js

//获取应用实例
const app = getApp();

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    imageUrl: "../../assets/placeHolderImg.png"
  },
  //事件处理函数
  chooseImages: function() {
    //回调函数里又有新的this对象，所以必须在外部保存this（即Page对象）引用
    let that = this;
    wx.chooseImage({
      count: 9,
      success: function(chooseRes) {
        //openId加生成唯一时间戳加图片索引作为图片的云路径前缀
        let openId = app.globalData.openId;            
        //获取要上传多少张图片
        let length = chooseRes.tempFilePaths.length;
        wx.showLoading({
          title: '上传中, 请稍后',
        }); 
        //一张一张开始上传
        that.uploadImages(openId, 0, chooseRes.tempFilePaths, length);
      },
      fail: function(res) {
        console.log("选择相片失败");
      }
    })
  },
  uploadImages: function (openId, index, images, length) {
    let that = this;
    //上传时间
    let time = new Date();
    let timeStamp = Date.parse(time).toString();
    wx.cloud.uploadFile({
      cloudPath: openId + timeStamp + index + '.png',
      filePath: images[index],
      success: function (res) {
        console.log("上传成功");
        //从上传结果中获取云端图片的路径url
        let imageUrl = res.fileID;
        that.setData({
          imageUrl: imageUrl
        });
        //上传者昵称
        let name = that.data.userInfo.nickName;
        //添加到云数据库
        that.addImageList(name, time, imageUrl);
      },
      fail: function (res) {
        console.log("上传失败");
        util.showTip('第' + (index + 1) + '张照片上传失败！');
      },
      complete: function(res) {
        if ((index + 1) == length) {
          //如果是最后一张
          wx.hideLoading();
        }else {
          //否则，传下一张
          index = index + 1;
          that.uploadImages(openId, index, images, length);
        }
      }
    });
  },
  addImageList: function (name,time,url){
    console.log(util.formatTime(time, "Y-M-D h:m:s"));
    //获得数据库引用
    const db = wx.cloud.database();
    //把上传的图片添加到数据库
    db.collection("imageList").add({
      data:{
        uploader: name,
        time: util.formatTime(time, "Y-M-D h:m:s"),
        imageUrl: url
      },
      success: function(res){
        console.log("相片添加到数据库成功");
      },
      fail: function(res){
        console.log("相片添加到数据库失败");
      }
    });
  },
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onTapDayWeather() {
    wx.showToast()
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      //全局应用已有用户信息
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
