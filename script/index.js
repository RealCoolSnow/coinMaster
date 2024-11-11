const { delay } = require('lang');

module.exports =  class TASK {
    constructor(){
        this.loop = false // 轮询
        this.switch = false // 任务执行开关
        this.init()
        this.list = [] // 任务队列
    }

    async init(){
        while(true){
            if(this.switch) {
                const task = this.list.shift()
                if(this.loop) this.add(task) // 轮询
                if(task) {

                    console.log(`开始(${task.name})`)
                    const fn = task.handler.bind(task.obj)
                    let result = await fn()
                    if(result) {
                        console.log(`${task.name}完成！`)
                    } else {
                        console.error(`${task.name}失败!`)
                    }

                } else {
                    await delay(1000)
                }
            } else {
                await delay(1000)
            }
        }
    }

    // 开始执行
  async start(){
    console.log(`脚本已启动`)
    this.switch = true
  }

  // 停止
  stop(){
    console.log(`脚本已停止`)
    this.switch = false
    this.loop = false
    this.list = []
  }

  // 添加任务
  add(task){
    this.list.push(task)
  }
}