<template>
  <div class="footer-container">
    <div v-if="currentVideo" class="video-progress">
      <video-progress />
    </div>
    <div class="footer">
      <div class="left">
        <span @click="openFile" :title="$t('common.openFile')" class="fa fa-folder-open-o"></span>
        <span v-if="currentVideo" class="video-time">{{getCurrentTime}} / {{getTotalTime}}</span>
      </div>
      <div class="middle">
        <span
          :style="{'color':currentVideo?'':'#454548'}"
          :title="$t('common.stop')"
          class="fa fa-stop"
          @click="stop"
        ></span>
        <span
          :style="{'color':(videoList.length<=1)?'#454548':''}"
          @click="prev"
          :title="$t('common.previous')"
          class="fa fa-step-backward"
        ></span>
        <span
          @click.stop="switchPlaying(true)"
          v-if="!isPlaying"
          :title="$t('common.play')"
          class="fa fa-play-circle-o"
          style="font-size: 50px;"
        ></span>
        <span
          v-if="isPlaying"
          :title="$t('common.suspend')"
          class="fa fa-pause-circle-o"
          style="font-size: 50px;"
          @click.stop="switchPlaying(false)"
        ></span>
        <span
          :style="{'color':(videoList.length<=1)?'#454548':''}"
          @click="next"
          :title="$t('common.next')"
          class="fa fa-step-forward"
        ></span>
        <span
          :title="$t('common.mute')"
          v-if="isVolumeOn"
          style="width: 40px;height: 20px;"
          @click.stop="setVolume(false)"
          class="fa fa-volume-up"
        ></span>
        <span
          :title="$t('common.cancelMute')"
          v-if="!isVolumeOn"
          style="width: 40px;height: 20px;"
          @click.stop="setVolume(true)"
          class="fa fa-volume-off"
        ></span>
        <voice-progress ref="progress" width="62px" />
      </div>
      <div class="right">
        <span
          :style="{'color':currentVideo?'':'#454548'}"
          @click="fullScreen"
          :title="isFullScreen?$t('common.exitScreen'):$t('common.fullScreen')"
          class="fa fa-expand my-expand"
        ></span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from "vuex";
import { formatTime } from "../api/util";
import Mousetrap from "mousetrap";
import OpenDialog from "../api/OpenDialog";
import connect from "../api/bus";
const openDialog = new OpenDialog();

export default {
  name: "my-footer",
  data() {
    return {
      // 是否展开播放模式列表菜单
    };
  },
  mounted() {
    this.initGlobalShortcut();
    window.addEventListener("click", this.onClick);
    connect.$on("deleteCurrentVideo", () => {
      this.stop();
    });
  },
  methods: {
    ...mapMutations([
      "setIsVolumeOn",
      "setPlaying",
      "setCurrentVideo",
      "setCurrentVideoIndex",
      "setFullScreen",
      "setSpeed",
    //   "setOldVideo",
    ]),
    // 点击音量图标，开启或者关闭
    setVolume(flag) {
      // 音量一开始0，再点一次恢复还是0，音量图标应该还是关闭
      if (
        flag &&
        this.volumePercent == 0 &&
        this.$refs.progress.oldInWidth == 0
      ) {
        return;
      }
      this.setIsVolumeOn(flag);
    },
    // 切换播放状态，播放或者暂停
    switchPlaying(flag) {
      if (flag && !this.currentVideo) {
        //播放状态，但是当前没有视频被暂停
        if (this.videoList.length == 0) {
          return;
        }
        if (this.oldVideo) {
          //点击停止按钮后，被停止前的视频被保存下来
          // 把被保存的视频设置为当前播放的视频，即还原被停止前的视频状态
          this.setCurrentVideo(this.oldVideo);
        } else {
          //没有视频被保存下来
          // 把播放列表中的第一项设置为当前播放的视频
          this.setCurrentVideo(this.videoList[0]);
        }
      }
      // 设置播放状态
      this.setPlaying(flag);
    },
    onClick() {
      // 隐藏播放模式列表菜单
    },
    // 停止播放
    stop() {
        // 当前没有视频正在播放
        if (!this.currentVideo) {
            return;
        }
        // 保存当前视频
        // this.setOldVideo(
        //     Object.assign({}, this.currentVideo, {
        //     currentTime: this.currentTime
        //     })
        // );
        // 清空当前正在播放的视频
        this.setCurrentVideo(null);
        // 停止播放
        this.setPlaying(false);
        // 退出全屏
        if (this.isFullScreen) {
            this.setFullScreen(false);
        }
    },
    // 下一个视频
    next() {
      // 当播放列表中只有一个视频或者没有
      if (this.videoList.length <= 1) {
        return;
      }
      // 当前视频索引是最后一个
      if (this.videoList.length - 1 == this.currentVideoIndex) {
        // 设置视频索引为第一个
        this.setCurrentVideoIndex(0);
      } else {
        // 否则视频索引加一
        let index = this.currentVideoIndex + 1;
        this.setCurrentVideoIndex(index);
      }
    },
    // 上一个视频
    prev() {
      // 当播放列表中只有一个视频或者没有
      if (this.videoList.length <= 1) {
        return;
      }
      if (this.currentVideoIndex == 0) {
        //当前视频索引是第一个
        // 设置当前视频索引的最后一个
        this.setCurrentVideoIndex(this.videoList.length - 1);
      } else {
        // 视频索引减一
        let index = this.currentVideoIndex - 1;
        this.setCurrentVideoIndex(index);
      }
    },
    // 进入或者退出全屏
    fullScreen() {
      if (!this.currentVideo) {
        return;
      }
      this.setFullScreen(!this.isFullScreen);
    },
    // 监听空格键
    onSpaceKeyUp() {
      if (!this.currentVideo) {
        return;
      }
      this.switchPlaying(!this.isPlaying);
    },
    // 监听esc键
    onEscKeyUp() {
      if (!this.currentVideo) {
        return;
      }
      if (this.isFullScreen == true) {
        this.setFullScreen(false);
      }
    },
    // 监听ctrl+r组合键
    onCtrlAndRKeyUp() {
      if (!this.currentVideo && this.speed == 1) {
        return;
      }
      this.setSpeed(1);
    },
    // 初始化快捷键
    initGlobalShortcut() {
      // 监听快捷键
      Mousetrap.bind("space", () => {
        this.onSpaceKeyUp();
        // 返回 false 以防止默认行为，并阻止事件冒泡
        return false;
      });
      Mousetrap.bind("esc", () => {
        this.onEscKeyUp();
        return false;
      });
      Mousetrap.bind("r", () => {
        this.onCtrlAndRKeyUp();
        return false;
      });
    },
    // 打开文件
    openFile() {
      openDialog.openFile();
    },
  },
  computed: {
    ...mapGetters([
      "isVolumeOn",
      "isPlaying",
      "currentVideo",
      "currentVideoIndex",
      "videoList",
      "oldVideo",
      "currentTime",
      "totalTime",
      "isFullScreen",
      "theme",
      "volumePercent",
    ]),
    // 当前视频播放状态
    getCurrentTime() {
      // 格式化事件
      return formatTime(this.currentTime);
    },
    // 当前视频总时长
    getTotalTime() {
      // 格式化时间
      return formatTime(this.totalTime);
    },
  },
  watch: {
    currentVideoIndex(newVal) {
      if (newVal == null || newVal == -1) {
        return;
      }
    //   if (!this.oldVideo) {
    //     // 设置当前播放的视频
    //     this.setCurrentVideo(this.videoList[newVal]);
    //     this.setPlaying(true);
    //     return;
    //   }
      // 视频索引发生变化时查找出索引对应的视频
      const currentVideo = this.videoList[newVal];
      // 判断是否为同一首歌，排序可能会使当前歌曲索引改变
    //   if (this.oldVideo.id == currentVideo.id) {
    //     return;
    //   }
      // 设置当前播放的视频
      this.setCurrentVideo(currentVideo);
    },
    videoList(newVal) {
      if (newVal.length == 0) {
        this.stop();
        // this.setOldVideo(null);
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener("click", this.onClick);
    connect.$off("deleteCurrentVideo");
  }
};
</script>

<style scoped lang="less">
.footer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  .video-progress {
    width: 100%;
    padding: 0 5px;
  }
}

.footer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 10px;
  position: relative;
  width: 100%;
  span {
    font-size: 18px;
    color: white;
    cursor: pointer;
    &:hover:not(.video-time) {
      color: #5dee00;
    }
    &.video-time {
      font-size: 14px;
      max-height: 19px;
      width: 150px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      left: 80px;
    }
  }
  .left {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    span {
      padding: 0 10px;
    }
  }
  .middle {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    z-index: 10;
    span {
      padding: 0 10px;
    }
    .progress {
      background-color: #cccccc;
    }
  }
  .right {
    display: flex;
    flex-direction: row;
    align-items: center;
    span {
      padding: 0 10px;
    }
  }
}

.my-expand {
  transform: rotate(90deg);
}
</style>