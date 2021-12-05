
import connect from '../api/bus'

import fs from 'fs'

// 修改播放列表中的某一项
export const changeVideoList = ({
    commit,
    state
}, video) => {
    // 复制一份新的播放列表
    const videoList = state.videoList.slice()
    // 复制一份新的默认排序列表
    // const oldVideoList = state.oldVideoList.slice()
    // 找出传递进来的视频在列表中的索引
    const index = videoList.findIndex(i => i.id == video.id)
    // const oldIndex = oldVideoList.findIndex(i => i.id == video.id)
    // 修改列表
    videoList[index] = video
    // oldVideoList[oldIndex] = video
    commit('changeList', videoList)
    // commit('changeOldList', oldVideoList)
}
