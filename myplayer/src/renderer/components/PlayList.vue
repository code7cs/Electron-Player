<template>
  <div
    ref="playList"
    :id="currentVideo ? 'position':''"
    class="playList"
    :style="{'height':currentVideo?`${playListHeight}px`:'100%','color':theme.textColor}"
  >
    <div class="my-arrow" v-show="isShowArrow">
      <span
        @click="hideList"
        v-show="!isHidenList"
        :title="$t('common.packUpList')"
        class="fa fa-arrow-circle-o-right"
      ></span>
      <!-- <span
        @click="hideList"
        v-show="!isHidenList&&isFullScreen"
        :title="$t('common.packUpList')"
        class="fa fa-arrow-circle-o-right"
      ></span> -->
      <span
        @click="hideList"
        v-show="isHidenList"
        :title="$t('common.unrollList')"
        class="fa fa-arrow-circle-o-left"
      ></span>
    </div>
    <div class="content-container" v-show="!isHidenList">
      <div class="top">
        <span>{{$t('common.playList')}}</span>
        <div class="file" v-show="isShowOther && videoList.length==0">
          <div class="no-file">
            <span class="fa fa-file-o"></span>
            <p>{{$t('common.noDocuments')}}</p>
          </div>
          <div :style="{'border': `1px solid ${theme.textColor}`}" class="open-file">
            <div @click="openFile" class="flexrowcenter">
              <span class="fa fa-folder-open-o"></span>
              <span>{{$t('common.addFile')}}</span>
            </div>
            <span @click.stop="showMenu" class="fa fa-angle-down"></span>
            <ul :style="{'background-color':theme.bgColor}" v-show="isShowFileMenu" class="my-file">
              <li :class="theme.hover" @click="openFolder">
                <span class="fa fa-file-excel-o"></span>
                {{$t('common.addFolder')}}
              </li>
              <li :class="theme.hover">
                <span class="fa fa-link"></span>
                {{$t('common.addUrl')}}
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        class="list-content"
        :style="{'height':`${playListHeight-40}px`}"
      >
        <div style="padding-bottom: 10px;">
          <ListItem
            :item="video"
            v-for="(video,index) in videoList"
            :key="index"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from "vuex";
import connect from "../api/bus.js";
import OpenDialog from "../api/OpenDialog";
import { remote } from "electron";

const openDialog = new OpenDialog();
const { Menu } = remote;

export default {
  name: "play-list",
  props: {
    // 是否显示列表最左边的按钮
    isShowArrow: {
      type: Boolean,
      default: false
    },
    // 列表高度
    playListHeight: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      // 是否显示添加文件菜单
      isShowFileMenu: false,
      // 是否隐藏播放列表
      isHidenList: false,
      // 是否隐藏其他
      isShowOther: true,
      // 定时器时间
      time: 3000
    };
  },
  mounted() {
    // 保存列表原有的的宽度
    this.savePlayListWidth = 300;
    // 定时器
    this.playListTimer = null;
    this.initEventListener();
    this.initListener();
  },
  methods: {
    ...mapMutations([
      "setCurrentVideo",
      "setPlaying",
      "clearVideoList"
    ]),
    // 开启定时器
    createSetTimeOut() {
      if (this.playListTimer) {
        clearTimeout(this.playListTimer);
      }
      this.playListTimer = setTimeout(this.createTimeOut, this.time);
    },
    initEventListener() {
      this.$refs.playList.addEventListener("mouseleave", this.onMouseLeave);
      this.$refs.playList.addEventListener("mouseenter", this.onMouseEnter);
      window.addEventListener("click", this.onClick);
    },
    // 初始化事件监听器
    initListener() {
      // 非全屏的时候显示头部和尾部
      connect.$on("showFooterAndHeader", () => {
        this.showFooterAndHeader();
      });
      // 全屏的时候隐藏头部和尾部
      connect.$on("hideFooterAndHeader", () => {
        this.hideFooterAndHeader();
      });

      connect.$on("showPlayList", () => {
        if (!this.isHidenList) {
          return;
        }
        this.hideList();
        if (!this.currentVideo) {
          return;
        }
        this.createSetTimeOut();
      });
    },
    // 移除事件监听器
    removeListener() {
      connect.$off("showFooterAndHeader");
      connect.$off("hideFooterAndHeader");
      connect.$off("showPlayList");
    },
    // 显示或者隐藏列表最中间菜单
    showMenu() {
      if (!this.isShowFileMenu) {
        document.body.click();
      }
      this.isShowFileMenu = !this.isShowFileMenu;
    },
    onClick() {
      // 隐藏列表最中间的菜单
      this.isShowFileMenu = false;
    },
    // 隐藏或者显示播放列表
    hideList() {
      this.isHidenList = !this.isHidenList;
    },
    // 定时器方法
    createTimeOut() {
      if (!this.currentVideo) {
        //当前没有正在播放的视频就不用隐藏列表
        clearTimeout(this.playListTimer);
        return;
      }
      this.hideList();
      clearTimeout(this.playListTimer);
    },
    onMouseEnter() {
      if (
        this.playListTimer &&
        this.currentVideo &&
        !this.isHidenList
      ) {
        clearTimeout(this.playListTimer);
      }
    },
    onMouseLeave(e) {
      if (this.playListTimer) {
        clearTimeout(this.playListTimer);
      }
      if (!this.currentVideo) {
        return;
      }
      if (!e) {
        return;
      }
      if (this.currentVideo && !this.isHidenList) {
        this.createSetTimeOut();
      }
    },
    // 非全屏的时候显示头部和脚部，调整播放列表高度
    showFooterAndHeader() {
      if (this.currentVideo) {
        this.resetPositionToOriginal();
        this.setPlayListHeight(`${this.playListHeight}px`);
      } else {
        //不存在播放歌曲说明是点击停止按钮后退出全屏的
        this.resetPositionToZero();
        this.setPlayListHeight(`${this.playListHeight}px`);
      }
    },
    // 全屏的时候隐藏头部和脚部，调整播放列表高度
    hideFooterAndHeader() {
      this.resetPositionToZero();
      this.setPlayListHeight("100%");
    },
    // 把列表定位置为0
    resetPositionToZero() {
      this.$refs.playList.style.top = "0";
      this.$refs.playList.style.bottom = "0";
    },
    // 把列表定位恢复为原样
    resetPositionToOriginal() {
      this.$refs.playList.style.top = "37px";
      this.$refs.playList.style.bottom = "56px";
    },
    // 设置列表高度
    setPlayListHeight(height) {
      this.$refs.playList.style.height = height;
    },
    // 打开文件
    openFile() {
      openDialog.openFile();
    },
    // 打开文件夹
    openFolder() {
      openDialog.openFolder();
    },
  },
  computed: {
    ...mapGetters([
      "currentVideo",
      "videoList",
      "isFullScreen",
      "isPlaying",
      "theme"
    ]),
  },
  watch: {
    isFullScreen(newVal) {
      if (!newVal) {
        //从全屏切换回非全屏的时候需要显示头部和尾部
        this.showFooterAndHeader();
      }
    },
    currentVideo(newVal) {
      if (!newVal) {
        this.resetPositionToZero();
        this.setPlayListHeight(`${this.playListHeight}px`);
      } else {
        if (!this.isFullScreen) {
          this.resetPositionToOriginal();
        }
      }
    },
    isPlaying(newVal) {
      // if (newVal) {
      //   this.resetPositionToZero();
      // }
      if (newVal && !this.isHidenList) {
        this.createSetTimeOut();
      }
    }
  },
  beforeDestroy() {
    if (this.playListTimer) {
      clearTimeout(this.playListTimer);
    }
    this.$refs.playList.removeEventListener("mouseleave", this.onMouseLeave);
    this.$refs.playList.removeEventListener("mouseenter", this.onMouseEnter);
    window.removeEventListener("click", this.onClick);
    this.removeListener();
  }
};
</script>

<style scoped lang="less">
#position {
  position: fixed;
  top: 36px;
  bottom: 56px;
  right: 0;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  .my-arrow {
    background-color: rgba(0, 0, 0, 0.7);
  }
}

.playList {
  height: 100%;
  border-left: 1px solid #2f2f31;
  position: relative;
  .content-container {
    height: 100%;
    overflow: hidden;
    position: relative;
    width: 300px;
  }
  .my-arrow {
    position: absolute;
    top: 50%;
    left: -31px;
    transform: translateY(-50%);
    width: 30px;
    height: 66px;
    line-height: 66px;
    text-align: center;
    border: 1px solid #303031;
    border-right: none;
    cursor: pointer;
    &:hover {
      border: 1px solid #45b000;
      border-right: none;
      > span {
        color: #45b000;
      }
    }
    > span {
      width: 100%;
      line-height: 66px;
    }
  }
  .top {
    padding: 15px 15px 5px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    > span {
      font-size: 15px;
    }
    .my-icon {
      display: flex;
      flex-direction: row;
      align-items: center;
      font-size: 15px;
      position: relative;
      > span {
        cursor: pointer;
        &:hover {
          color: #1bb017;
        }
      }
      > span + span {
        margin-left: 10px;
      }
      > .delete {
        font-size: 14px;
      }
    }
  }
  .file {
    flex: 1;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    .no-file {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      > span {
        font-size: 50px;
        margin-bottom: 10px;
      }
      margin-bottom: 30px;
    }
    .open-file {
      position: relative;
      width: 150px;
      height: 40px;
      border-radius: 40px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-around;
      padding: 5px;
      .my-file {
        z-index: -1;
        position: absolute;
        top: 45px;
        left: 0;
        width: 100%;
        border-radius: 5px;
        &:before {
          content: "";
          height: 0;
          width: 0;
          position: absolute;
          top: -10px;
          left: 23px;
          border: 5px solid transparent;
          border-bottom-color: #252527;
        }
        > li {
          width: 100%;
          height: 40px;
          padding: 10px 15px;
          color: #878788;
          border-radius: 5px;
          cursor: pointer;
          &:hover {
            color: #5dee00;
          }
        }
      }
      > div {
        cursor: pointer;
        span:nth-child(1) {
          padding-right: 10px;
        }
        &:hover {
          color: #5dee00;
        }
      }
      > span {
        font-size: 20px;
        border-left: 1px solid #818181;
        padding-left: 10px;
        cursor: pointer;
        &:hover {
          color: #5dee00;
        }
      }
    }
  }
}

.list-content {
  overflow: auto;
}
.top {
  max-height: 40px;
  transition: width 1s;
  overflow: hidden;
}

.extend-menu {
  position: absolute;
  right: 5px;
  top: 40px;
  z-index: 5;
  width: 100px;
  color: #878788;
  padding: 3px 0;
  border-radius: 5px;
  > .line {
    border-bottom: 1px solid #878788;
  }
  &:after {
    content: "";
    position: absolute;
    left: 80%;
    top: -10px;
    height: 0;
    width: 0;
    border: 5px solid transparent;
    border-bottom-color: greenyellow;
  }
  > li {
    height: 30px;
    text-align: center;
    line-height: 30px;
    font-size: 12px;
    cursor: pointer;
    &:hover {
      color: #1bb017;
      > span {
        color: #1bb017;
      }
    }
    > span {
      font-size: 10px;
      padding: 0;
      margin-left: -10px;
    }
  }
}
</style>