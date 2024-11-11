<template>
  <van-row>
    <van-nav-bar title="金币收割鸡" @click-right="maskVisible=true">
      <template #right>
        <van-icon name="info" size="24" color="#cdcdcd" />
      </template>
    </van-nav-bar>

    <!-- 弹窗 -->
    <van-action-sheet v-model="maskVisible" title="v1.0.0">
      <div class="tip">
        本软件仅作技术学习与交流，请勿贩卖或用于非法用途！！！<br/>
        软件问题以及更多有趣的免费软件欢迎关注B站UP主：
        <span>@技师老杨</span>，或添加微信：job884
      </div>
    </van-action-sheet>

    <van-notice-bar
      left-icon="volume-o"
      text="使用脚本前请设置无障碍和悬浮窗权限！"
    />

    <van-cell center title="无障碍">
      <template #right-icon>
        <van-switch v-model="accessibility" size="24" @click="setAccessibility" />
      </template>
    </van-cell>
    <van-cell center title="悬浮窗">
      <template #right-icon>
        <van-switch v-model="overlays" size="24" @click="setOverlays"/>
      </template>
    </van-cell>

    <div class="box">
      <div class="item" v-for="item in appList">
        <van-image width="48" height="48" :src="'./assets/'+item.code+'.png'" />
        <span class="name">{{item.title}}（v{{item.version}}）</span>
        <van-icon name="stop-circle" color="red" size="30" @click="stop" v-if="item.title == curApp" />
        <van-icon name="play-circle" color="green" size="30" @click="start(item)" v-else />
      </div>
    </div>
  </van-row>
</template>
<script>
export default {
  data() {
    return {
      accessibility: false,
      overlays: false,
      maskVisible: false,
      appList: [
        {
          title: '抖音极速版',
          version: '31.7.0',
          code: 'dy'
        },
        {
          title: '快手极速版',
          version: '12.9.20.8822',
          code: 'ks'
        },
        {
          title: '百度极速版',
          version: '6.36.0.10',
          code: 'bd'
        },
        {
          title: '头条搜索极速版',
          version: '10.0.6.0',
          code: 'tt'
        },
        {
          title: '趣头条',
          version: '3.20.63',
          code: 'qtt'
        },
        {
          title: '喜马拉雅极速版',
          version: '3.3.23.3',
          code: 'xmly'
        },
        {
          title: '悟空浏览器',
          version: '12.5.8',
          code: 'wk'
        },
        {
          title: 'UC浏览器',
          version: '16.5.7.1308',
          code: 'uc'
        }
      ],
      curApp: ''
    };
  },
  created() {
    // 监听来自脚本端的消息  
    window.addEventListener('message', event => {
      var data = event.data;
      if (data.action === 'stopTask') {  
          this.curApp = ''
      }  
    });
  },
  mounted() {
    this.checkAuth()
  },
  destroyed() {
    window.removeEventListener('message')
  },
  methods: {
    // 查询权限
    async checkAuth(){
      const { accessibility, overlays } = await $autojs.invoke("checkAuth")
      this.accessibility = accessibility
      this.overlays = overlays
    },
    async start (item) {
      const result = await $autojs.invoke("startTask", item);
      if(result) {
        this.curApp = item.title
      } else {
        this.$toast({
          message: '开发中',
          icon: 'fire',
        })
      }
    },
    stop () {
      $autojs.send("stopTask");
      this.curApp = ''
    },
    // 开启无障碍
    async setAccessibility(){
      this.checkAuth()
      if(!this.accessibility) {
        await $autojs.invoke("setAccessibility");
        this.checkAuth()
      }
    },
    // 开启悬浮窗
    async setOverlays(){
      this.checkAuth()
      if(!this.overlays) {
        await $autojs.invoke("setOverlays");
      }
    }
  },
};
</script>