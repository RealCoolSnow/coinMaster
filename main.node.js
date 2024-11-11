"ui";

const ui = require('ui');
const { readFile } = require('fs').promises;
const fs = require('fs');
const path = require('path');
const app = require('app');
const { showDialog } = require("dialogs");
const { createWindow, canDrawOverlays, manageDrawOverlays, FLAG_KEEP_SCREEN_ON, FLAG_NOT_FOCUSABLE } = require('floating_window');
const { showToast } = require('toast');
const { device } = require('device');
const { accessibility } = require('accessibility');
const TASK = require('./script/index');
const task = new TASK()
const KS = require('./script/modules/ks');


// (async()=>{
//   const ks = new KS()
//   console.log(await ks.viewLive())
// })()
// return

let window = null
let webview = null
let jsBridge = null
let fnObj = null

// 创建日志弹窗
async function createWin() {
  
  if (window) {
    showToast('请先关闭运行任务');
    return false
  }

  // 创建悬浮窗
  window = createWindow({
    context: accessibility.service,
    initialPosition: {
      x: 0,
      y: 0
    },
    initialSize: {
      width: device.screenWidth / 2,
      height: 950
    },
    layoutNoLimit: false
  });

  window.addFlags(FLAG_KEEP_SCREEN_ON)
  window.addFlags(FLAG_NOT_FOCUSABLE)


  return true
}

// 设置弹窗页面
async function setViewFromXml(title, fns) {
  // 从xml设置View
  let xml = `
    <column>
      <row id="dragHandle" bg="#000000" padding="5" gravity="center">
          <text text="${title}" textColor="#ffffff" textSize="14" width="0" layout_weight="1" gravity="center_horizontal" />         
          <img id="close" w="26" h="26" src="@drawable/ic_close_black_48dp" tint="#ffffff" bg="?selectableItemBackground"/>
      </row>
      <globalconsole alpha="0.8" id="console" h="*" layout_weight="1" bg="#000000" paddingLeft="2" paddingRight="2" />
      <column bg="#333333" alpha="0.8" paddingTop="1">
    `
  for (let j = 0; j < fns.length; j++) {
    let fnItem = fns[j]
    xml += `<row marginTop="${j == 0 ? 0 : 1}">`
    for (let i = 0; i < fnItem.length; i++) {
      let item = fnItem[i]
      xml += `<button id="btn${j}${i}" h="40" bg="#000000" textColor="#ffffff" layout_weight="1" text="${item.name}" textSize="12" marginLeft="${i == 0 ? 0 : 1}"/>`
    }
    xml += `</row>`
  }

  xml += `
    <row marginTop="1">
      <button id="run" h="40" bg="#000000" textColor="#ffffff" layout_weight="1" text="一键执行" textSize="12" />
    </row>
  </column>
</column>
`

  window.setViewFromXml(xml);

  const log = window.view.findView('console');
  log.setColor('D', '#999999')

  // 绑定方法
  for (let j = 0; j < fns.length; j++) {
    let fnItem = fns[j]
    for (let i = 0; i < fnItem.length; i++) {
      const item = fnItem[i]
      window.view.binding[`btn${j}${i}`].on('click', () => {
        task.add(item)
      })
    }
  }

  // 获取用于拖拽的View
  const { dragHandle, close, run } = window.view.binding;

  // 启用拖拽手势，拖动该View可以拖动窗口
  window.enableDrag(dragHandle);

  // 关闭按钮点击时关闭悬浮窗
  close.on("click", () => {
    window.close();
    task.stop()
    fnObj.clear()
    webview.evaluateJavascript(`  
      (function() {
          window.postMessage({  
              action: 'stopTask'
          }, '*');  
      })();  
    `, null);
  });

  // 一键执行
  run.on("click", () => {
    for (let fnItem of fns) {
      for (let item of fnItem) {
        task.add(item)
      }
    }
    task.loop = true
  });


  await window.show();
  return true
}

// Web文件夹
const webRoot = path.join(__dirname, 'web');
// Web网页首页url
const indexUrl = `file://${webRoot}/index.html`;
// 保存vue2-sfc-loader文件的路径
const sfcLoaderFile = path.join(webRoot, 'js/vue2-sfc-loader@0.8.4.js')


function downloadFile(url, file) {
  const util = require('util');
  const stream = require('stream');
  const pipeline = util.promisify(stream.pipeline);
  const axios = require('axios').default;
  const EventEmitter = require('events').EventEmitter;
  const emitter = new EventEmitter();

  (async () => {
    try {
      const response = await axios.get(url, {
        responseType: 'stream',
      });
      const totalSize = parseInt(response.headers['content-length']);
      let receivedSize = 0;
      await pipeline(response.data, new stream.Transform({
        transform(chunk, encoding, callback) {
          receivedSize += chunk.length;
          this.push(chunk);
          callback();

          const progress = typeof (totalSize) === 'number' && totalSize >= 0 ? receivedSize / totalSize : -1;
          emitter.emit('progress', progress, receivedSize, totalSize);
        }
      }), fs.createWriteStream(file));
    } catch (e) {
      emitter.emit('error', e);
      return;
    }
    emitter.emit('success', file);
  })();

  return emitter;
}

// 显示Web的界面
class WebActivity extends ui.Activity {
  get initialStatusBar() { return { color: '#000000', light: false } }

  get layoutXml() {
    return `<vertical><webview id="web" w="*" h="*"/></vertical>`
  }

  onContentViewSet(contentView) {
    webview = contentView.findView('web');
    this.setupWebView(webview);

    // 如果sfc loader文件已经存在，直接加载网页
    if (fs.existsSync(sfcLoaderFile)) {
      webview.clearCache(true)
      // console.log('loadUrl:', indexUrl);
      webview.loadUrl(indexUrl);
      return;
    }
    // 否则先下载，再加载
    this.downloadSfcFile().then(() => {
      console.log('loadUrl:', indexUrl);
      webview.loadUrl(indexUrl);
    })
  }

  async downloadSfcFile() {
    return new Promise(async (resolve, reject) => {
      const dialog = await showDialog({
        title: "正在下载vue2-sfc-loader.js",
        progress: { max: 100, showMinMax: true },
        cancelable: false,
      });
      const tmpFile = sfcLoaderFile + '.tmp';
      downloadFile('https://unpkg.com/vue3-sfc-loader@0.8.4/dist/vue2-sfc-loader.js', tmpFile)
        .on("progress", (progress) => {
          dialog.setProgress(parseInt(progress * 100));
        })
        .on("success", () => {
          dialog.dismiss();
          fs.renameSync(tmpFile, sfcLoaderFile);
          resolve();
        })
        .on("error", (err) => {
          dialog.dismiss();
          this.finish();
          console.error(err);
          reject(err);
        });
    });
  }

  setupWebView(webview) {

    // 监听WebView的控制台消息，打印到控制台
    webview.on('console_message', (event, msg) => {
      console.log(`${path.basename(msg.sourceId())}:${msg.lineNumber()}: ${msg.message()}`);
    });

    jsBridge = webview.jsBridge;

    // 处理读取本地文件的请求
    jsBridge.handle('fetch', async (event, args) => {
      return await readFile(path.resolve(path.join(webRoot, args.path)), { encoding: 'utf-8' });
    });

    // 开始任务
    jsBridge.handle('startTask', async (event, item) => {
      const { title, code } = item
      switch (code) {
        case 'ks':
          const ks = new KS()
          fnObj = ks
          const fns = [
            [
              { name: '看视频', handler: ks.viewVideo, obj: ks },
              { name: '看直播', handler: ks.viewLive, obj: ks },
              { name: '看广告', handler: ks.viewAd, obj: ks }
            ],
            [
              { name: '饭补广告', handler: ks.viewAdF, obj: ks },
              { name: '饭补直播', handler: ks.viewLiveF, obj: ks },
              { name: '逛街广告', handler: ks.viewAdG, obj: ks }
            ],
            [
              { name: '搜索任务', handler: ks.search, obj: ks },
              { name: '短剧任务', handler: ks.viewPlaylet, obj: ks },
              { name: '逛街任务', handler: ks.shopping, obj: ks }
            ]
          ]
          await setViewFromXml(title, fns)
          await ks.launch()
          task.start()
          return true
        default:
          return false
      }
    });

    // 停止任务
    jsBridge.on('stopTask', () => {
      window && window.close();
      task.stop()
      fnObj.clear()
    });

    // 查询权限
    jsBridge.handle('checkAuth', async () => {
      let res = { accessibility: accessibility.enabled, overlays: canDrawOverlays() }
      return res
    });

    // 等待启用无障碍服务
    jsBridge.handle('setAccessibility', async () => {
      return await accessibility.enableService({
        toast: true
      })
    });

    // 设置悬浮窗
    jsBridge.handle('setOverlays', async () => {
      manageDrawOverlays()
      return true
    });

  }
}

(async()=>{
  await createWin()
  ui.setMainActivity(WebActivity);
  ui.activityLifecycle.on('all_activities_destroyed', () => {
    process.exit();
  });
})()