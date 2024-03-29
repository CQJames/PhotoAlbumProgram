//app.js
App({
  onLaunch: function () {
    //初始化云
    wx.cloud.init({
      env: "cyy-tpzv0",
      traceUser: true
    });
    //获取openId
    this.getOpenId();
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    // 登录
    wx.login({
      success: function (res) {
      }
    });
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  getOpenId() {
    // 获取用户openid
    let that = this;
    wx.cloud.callFunction({
      name: 'getOpenId',
      complete: res => {
        console.log('云函数获取到的openid: ', res.result.openId);
        that.globalData.openId = res.result.openId;
      }
    })
  },
  globalData: {
    userInfo: null,
    openId: ""
  }
})