var util = require('../../utils/util.js');

// pages/album/album.js

//获取应用实例
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */ 
  data: {
    pageIndex: 1,
    pageSize: 5,
    pageCount: 0,
    total: 0,
    dataList: []
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this;
    //根据openId找属于用户的图片列表
    let openId = app.globalData.openId;
    const db = wx.cloud.database();
    db.collection("imageList").where({ _openid: openId }).count({
      success: function (res) {
        console.log("获取相片列表总数成功" + res.total);
        if (that.data.total != res.total) {
          //如果有数据刷新，重新加载第一页
          wx.pageScrollTo({
            scrollTop: 0
          });
          that.data.pageIndex = 1;
          that.fetchImageList("刷新中");
        }
      }
    });   
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    //下拉刷新图片列表
    this.data.pageIndex = 1;
    this.fetchImageList("刷新中");
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.pageIndex < this.data.pageCount) {
      //如果没到最后一页，页码加1，并加载新的一页图片列表数据
      this.data.pageIndex = this.data.pageIndex + 1;
      this.fetchImageList("加载中");
    } else {
      util.showTip('没有更多照片了');
    }
    console.log(this.data.pageIndex)
  },
  fetchImageList: function (title) {
    let that = this;
    //根据openId找属于用户的图片列表
    let openId = app.globalData.openId;
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;   
    const db = wx.cloud.database();
    //先计算总数，才可以进行分页
    db.collection("imageList").where({ _openid: openId}).count({
      success: function (res) {
        console.log("获取相片列表总数成功" + res.total);
        let pageCount = Math.ceil(res.total / pageSize);
        let total = res.total;
        //根据不同需求的抓取显示不同的进程提示
        wx.showLoading({
          title: title,
        });
        //分页获取图片列表内容
        db.collection("imageList").where({ _openid: openId }).skip((pageIndex - 1) * pageSize).limit(pageSize).orderBy('time', 'desc').get({
          success: function (res) {
            console.log("获取相片列表成功");
            //选获取原先的图片列表
            let tempImageList = that.data.dataList;         
            if (that.data.pageIndex == 1) {
              //如果要显示第一页，无需拼接图片列表数据
              tempImageList = res.data;
              //处理下拉情况
              wx.stopPullDownRefresh();
            }else {
              //否则，拼接新的图片列表数据
              tempImageList = tempImageList.concat(res.data);
            }
            //更新数据
            that.setData({
              pageCount: pageCount,
              total: total,
              dataList: tempImageList
            });
          },
          fail: function (res) {
            console.log("获取相片列表失败");
          },
          complete: function (res) {
            wx.hideLoading();
          }
        });
      },
      fail: function (res) {
        console.log("获取相片列表总数失败");
      }
    });
  },
  deleteImage: function (event) {
    let that = this;
    //询问用户是否删除
    wx.showModal({
      title: '提示',
      content: '确定要删除该照片吗？',
      success: function (res) {
        if (res.confirm) {
          //确定删除
          wx.showLoading({
            title: '删除中',
          });
          //获得图片在数据库的id
          let id = event.target.dataset.id;
          const db = wx.cloud.database();
          //从数据库删除该记录
          db.collection('imageList').doc(id).remove({
            success: function (res) {
              console.log("删除照片记录成功");
              //获得图片在存储的fileId，先获取imageurl
              let imageUrl = event.target.dataset.imageurl;
              let fileId = util.getFileId(imageUrl);
              //从存储真正删除该图片
              wx.cloud.deleteFile({
                fileList: [fileId],
                success: function (res) {
                  console.log("删除照片成功");
                },
                fail: function (res) {
                  console.log("删除照片失败");
                }
              });
              wx.hideLoading();
              //根据id更新图片列表
              that.updateImages(id);
            },
            fail: function (res) {
              console.log("删除照片记录失败");
              wx.hideLoading();
            }
          });
        }
      }
    });
  },
  updateImages: function(id) {
    let that = this;
    //删除后更新图片列表
    let list = that.data.dataList;
    let dataList = null;
    //去掉删除的
    for (let i = 0; i < list.length; i++) {
      if (list[i]._id == id) {
        let dataList1 = list.slice(0, i);
        let dataList2 = list.slice(i + 1, list.length);
        dataList = dataList1.concat(dataList2);
        break;
      }
    }
    //加载一张新的图片加入当前图片列表
    let openId = app.globalData.openId;
    let pageIndex = that.data.pageIndex;
    let pageSize = that.data.pageSize;  
    const db = wx.cloud.database();
    //更新总数，页数，还有图片列表
    db.collection("imageList").where({ _openid: openId }).count({
      success: function (res) {
        console.log("获取相片列表总数成功" + res.total);
        let pageCount = Math.ceil(res.total / pageSize);
        let total = res.total;
        if ((dataList.length + 1) <= res.total) {
          //如果还有未加载数据，则从数据库取一条数据补充当前页
          //根据不同需求的抓取显示不同的进程提示
          wx.showLoading({
            title: '刷新中',
          });
          //分页获取图片列表内容，因为是当前页补充一条新数据，所以跳过pageIndex * pageSize - 1条
          db.collection("imageList").where({ _openid: openId }).skip(pageIndex * pageSize - 1).limit(1).orderBy('time', 'desc').get({
            success: function (res) {
              console.log("获取相片列表成功");
              //把获得的新数据加到尾部
              dataList = dataList.concat(res.data);
              //更新数据
              that.setData({
                pageCount: pageCount,
                total: total,
                dataList: dataList
              });
            },
            fail: function (res) {
              console.log("获取相片列表失败");
            },
            complete: function (res) {
              wx.hideLoading();
            }
          });
        }else {
          //没有还未加载数据
          that.setData({
            pageCount: pageCount,
            total: total,
            dataList: dataList
          });
        }
      },
      fail: function (res) {
        console.log("获取相片列表总数失败");
      }
    });  
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})