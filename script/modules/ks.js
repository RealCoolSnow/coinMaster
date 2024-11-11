const app = require('app');
const { select, back, currentActivity, swipe, clickText, click, inputText } = require('accessibility');
const { delay } = require('lang');

module.exports =  class KS {
    constructor(){
        this.stop = false
    }

    clear(){
        this.stop = true
    }

    // 启动app
    async launch(){
        try {
            console.log('启动APP')
            app.launch('com.kuaishou.nebula')
            const next = await select({ text: '跳过', clickable: true }).findFirstOrNull({ timeout: 2000 })
            next && next.click()
            const tabZq = await select({ desc: '去赚钱', clickable: true }).findFirstOrNull({ timeout: 2000 })
            if(!tabZq) throw new Error('切换页面失败，请手动切换至’去赚钱‘页面')
            tabZq.click()
            console.log('启动APP完成')
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 回到初始页面
    async backHome(){
        try {
            let times = 5
            while(times--) {
                if(currentActivity() == 'com.yxcorp.gifshow.HomeActivity') {
                    const tabZq = await select({ desc: '去赚钱', clickable: true }).findFirstOrNull({ timeout: 5000 })
                    if(tabZq){
                        tabZq.click()
                        await delay(2000)
                    }
                    break
                }
                back()
                await delay(1000)
                const text = await select({ text: /(退出|放弃)/ }).findFirstOrNull({ timeout: 2000 })
                if(text) {
                    const bounds = text.boundsInScreen
                    if(bounds) {
                        const x = parseInt(bounds.left + (bounds.right-bounds.left)/2)
                        const y = parseInt(bounds.top + (bounds.bottom-bounds.top)/2)
                        await click(x, y)
                    }
                }
            }
            return currentActivity() == 'com.yxcorp.gifshow.HomeActivity'
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 签到
    async signIn(){
        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            const signBtn = await select({ text: '立即签到', clickable: true }).findFirstOrNull({ timeout: 3000 })
            signBtn && signBtn.click()
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 开宝箱
    async openBox(){
        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            // 点击开宝箱
            const openBtn = await select({ text: /^点可领/, clickable: true }).findFirstOrNull({ timeout: 3000 })
            if(!openBtn) throw new Error('开宝箱失败')
            openBtn.click()
            await delay(1000)
            // 关闭弹窗
            const tipText = await select({ text: /个宝箱可开启/ }).findFirstOrNull({ timeout: 3000 })
            if(tipText) {
                const closeBtn = await select({ className: 'android.widget.Image', clickable: true }).from(tipText.parent.parent.parent.parent).findFirstOrNull({ timeout: 3000 })
                closeBtn && closeBtn.click()
            }
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 看直播
    async viewLive(count=5){
        const _this = this
        const view = async(index)=>{
            try {
                if(index !== undefined) {
                    // 进入直播间
                    const nick = await select({ id: 'nick' }).findAtOrNull(index, { timeout: 3000 })
                    if(nick) {
                        nick.parent.click()
                    } else {
                        return false
                    }
                }
                let maxTimes = 5
                while(maxTimes-- && !_this.stop) {
                    await delay(1000)
                    // 检测是否完成任务
                    const nick = await select({ id: 'neo_count_down_text' }).findFirstOrNull({ timeout: 3000 })
                    if(nick) {
                        if(nick.text == '已领取') {
                            break
                        } else {
                            maxTimes = 5
                        }
                    }
                }
                //  退出
                back()
                await delay(500)
                // 检测是否有额外任务
                const againBtn = await select({ text: '领取奖励', clickable: true }).findFirstOrNull({ timeout: 3000 })
                if(againBtn) {
                    againBtn.click()
                    await delay(1000)
                    return await view()
                }
                // 检测是否有关注弹窗
                const exitText = await select({ text:  /退出/ }).findFirstOrNull({ timeout: 3000 })
                if(exitText) exitText.parent.click()
                await delay(1000)
                return true
            } catch (error) {
                console.error(error.message)
                return false
            }
        }

        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log(`看${count}个直播`)
            const liveText = await select({ text: /直播领金币/ }).findFirstOrNull({ timeout: 3000 })
            if(!liveText) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            liveText.parent.click()
            await delay(2000)
            // 获取剩余次数
            let leftTimes = 0
            const countText = await select({ id: 'progress_display', text: /已完成/ }).findFirstOrNull({ timeout: 3000 })
            if(countText) {
                let textArr = countText.text.split('已完成')[1].split('/')
                leftTimes = parseInt(textArr[1]) - parseInt(textArr[0])
            }
            count = leftTimes > count ? count : leftTimes
            const totalCount = count
            while(count-- && !_this.stop) {
                console.log(`第${totalCount-count}个`)
                await view(totalCount-count-1)
            }
            back()
            await delay(500)
            // 关闭弹窗
            const closeBtn = await select({ text: /(放弃|退出)/ }).findFirstOrNull({ timeout: 3000 })
            closeBtn && closeBtn.click()
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 看视频
    async viewVideo(time=5){
        const _this = this
        let totalTimes = 0
        async function view(){
            try {
                const times = 5000 + Math.random() * 10000
                await delay(times)
                totalTimes += times
                return true
            } catch (error) {
                console.error(error.message)
                return false
            }
        }

        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log(`看${time}分钟视频`)
            const videoText = await select({ text: /看视频赚/ }).findFirstOrNull({ timeout: 3000 })
            if(!videoText) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            videoText.parent.click()
            await delay(2000)
            while(totalTimes < time*60000 && !_this.stop) {
                await view()
                await swipe(850,1500,850,200,200)
                console.log(`已看${parseInt(totalTimes/1000)}秒`)
            }
            back()
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 看广告
    async viewAd(count=5){
        const _this = this
        const view = async(join=true)=>{
            try {
                if(join) {
                    const adText = await select({ text: /看广告得/ }).findFirstOrNull({ timeout: 3000 })
                    if(!adText) throw new Error('未找到入口，任务失败')
                    adText.parent.click()
                }
                let maxTimes = 5
                while(maxTimes-- && !_this.stop) {
                    await delay(1000)
                    // 检测是否完成任务
                    const nick = await select({ id: 'video_countdown' }).findFirstOrNull({ timeout: 3000 })
                    if(nick) {
                        if(nick.text.includes('已成功领取')) {
                            break
                        } else {
                            maxTimes = 5
                        }
                    }
                }
                //  退出
                back()
                await delay(500)
                // 检测是否有额外广告
                const againBtn = await select({ id: 'again_medium_icon_dialog_ensure_text', text: '领取奖励', clickable: true }).findFirstOrNull({ timeout: 3000 })
                if(againBtn) {
                    againBtn.click()
                    await delay(1000)
                    return await view(false)
                }
                // 检测是否有任务弹窗
                const exitText = await select({ text: /放弃/ }).findFirstOrNull({ timeout: 3000 })
                if(exitText) exitText.click()
                await delay(1000)
                return true
            } catch (error) {
                console.error(error.message)
                return false
            }
        }

        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log(`看${count}个广告`)
            const totalCount = count
            while(count-- && !_this.stop) {
                console.log(`第${totalCount-count}个`)
                await view()
            }
            return true
        } catch (error) {
            console.error( error.message)
            return false
        }
    }

    // 饭补入口看广告
    async viewAdF(count=5){
        const _this = this
        const view = async(join=true)=>{
            try {
                if(join) {
                    const videoText = await select({ text: '看视频' }).findFirstOrNull({ timeout: 3000 })
                    if(!videoText) throw new Error('未找到入口，任务失败')
                    videoText.parent.click()
                }
                let maxTimes = 5
                while(maxTimes-- && !_this.stop) {
                    await delay(1000)
                    // 检测是否完成任务
                    const nick = await select({ id: 'video_countdown' }).findFirstOrNull({ timeout: 3000 })
                    if(nick) {
                        if(nick.text.includes('已成功领取')) {
                            break
                        } else {
                            maxTimes = 5
                        }
                    }
                }
                //  退出
                back()
                await delay(500)
                // 检测是否有额外广告
                const againBtn = await select({ id: 'again_medium_icon_dialog_ensure_text', text: '领取奖励', clickable: true }).findFirstOrNull({ timeout: 3000 })
                if(againBtn) {
                    againBtn.click()
                    await delay(1000)
                    return await view(false)
                }
                // 检测是否有任务弹窗
                const exitText = await select({ text: /放弃/ }).findFirstOrNull({ timeout: 3000 })
                if(exitText) exitText.click()
                await delay(1000)
                return true
            } catch (error) {
                console.error(error.message)
                return false
            }
        }

        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log(`看${5}个饭补入口广告`)
            // 进去饭补页面
            const fbText = await select({ text: '到饭点领饭补' }).findFirstOrNull({ timeout: 3000 })
            if(!fbText) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            fbText.parent.click()
            await delay(3000)
            // 领饭补
            const getBtn = await select({ text: /领取饭补/ }).findFirstOrNull({ timeout: 3000 })
            if(getBtn) {
                getBtn.parent.click()
                await delay(2000)
            }
            const totalCount = count
            while(count-- && !_this.stop) {
                console.log(`第${totalCount-count}个`)
                await view()
            }
            back()
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 饭补入口看直播
    async viewLiveF(count=5){
        const _this = this
        const view = async (index)=>{
            try {
                if(index !== undefined) {
                    // 进入直播间
                    const nick = await select({ id: 'nick' }).findAtOrNull(index, { timeout: 3000 })
                    if(nick) {
                        nick.parent.click()
                    } else {
                        return false
                    }
                }
                let maxTimes = 5
                while(maxTimes-- && !_this.stop) {
                    await delay(1000)
                    // 检测是否完成任务
                    const nick = await select({ id: 'neo_count_down_text' }).findFirstOrNull({ timeout: 3000 })
                    if(nick) {
                        if(nick.text == '已领取') {
                            break
                        } else {
                            maxTimes = 5
                        }
                    } 
                }
                //  退出
                back()
                await delay(500)
                // 检测是否有额外任务
                const againBtn = await select({ id: 'again_dialog_ensure_text', text: '领取奖励', clickable: true }).findFirstOrNull({ timeout: 3000 })
                if(againBtn) {
                    againBtn.click()
                    await delay(1000)
                    return await view()
                }
                
                // 检测是否有弹窗
                const exitText = await select({ text: /(退出|放弃)/ }).findFirstOrNull({ timeout: 3000 })
                if(exitText) exitText.parent.click()
                await delay(1000)
                return true
            } catch (error) {
                console.error(error.message)
                return false
            }
        }

        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log(`看${count}个饭补入口直播`)
            // 进去饭补页面
            const fbText = await select({ text: '到饭点领饭补' }).findFirstOrNull({ timeout: 3000 })
            if(!fbText) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            fbText.parent.click()
            await delay(3000)
            // 领饭补
            const getBtn = await select({ text: /领取饭补/ }).findFirstOrNull({ timeout: 3000 })
            if(getBtn) {
                getBtn.parent.click()
                await delay(2000)
            } 
            const videoText = await select({ text: '看直播' }).findFirstOrNull({ timeout: 3000 })
            videoText && videoText.parent.click()
            await delay(2000)
            // 获取剩余次数
            let leftTimes = 0
            const countText = await select({ id: 'progress_display', text: /已完成/ }).findFirstOrNull({ timeout: 3000 })
            if(countText) {
                let textArr = countText.text.split('已完成')[1].split('/')
                leftTimes = parseInt(textArr[1]) - parseInt(textArr[0])
            }
            count = leftTimes > count ? count : leftTimes
            const totalCount = count
            while(count-- && !_this.stop) {
                console.log(`第${totalCount-count}个`)
                await view(count)
            }
            back()
            await delay(500)
            // 关闭弹窗
            const closeBtn = await select({ text: /(放弃|退出)/ }).findFirstOrNull({ timeout: 3000 })
            closeBtn && closeBtn.click()
            await delay(500)
            back()
            await delay(500)
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 逛街入口看广告
    async viewAdG(count=5){
        const _this = this
        const view = async(join=true)=>{
            try {
                if(join) {
                    const videoText = await select({ text: '观看视频' }).findFirstOrNull({ timeout: 3000 })
                    if(!videoText) throw new Error('未找到入口，任务失败')
                    videoText.parent.click()
                }
                let maxTimes = 5
                while(maxTimes-- && !_this.stop) {
                    await delay(1000)
                    // 检测是否完成任务
                    const nick = await select({ id: 'video_countdown' }).findFirstOrNull({ timeout: 3000 })
                    if(nick) {
                        console.log(nick.text)
                        if(nick.text.includes('已成功领取')) {
                            break
                        } else {
                            maxTimes = 5
                        }
                    } else {
                        console.log(null)
                    }
                }
                //  退出
                back()
                await delay(500)
                // 检测是否有额外广告
                const againBtn = await select({ text: '领取奖励' }).findFirstOrNull({ timeout: 3000 })
                if(againBtn) {
                    againBtn.click()
                    await delay(1000)
                    return await view(false)
                }
                // 检测是否有任务弹窗
                const exitText = await select({ text: /放弃/ }).findFirstOrNull({ timeout: 3000 })
                if(exitText) exitText.click()
                await delay(1000)
                return true
            } catch (error) {
                console.error(error.message)
                return false
            }
        }

        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log(`看${count}个逛街广告`)
            // 进去逛街页面
            const gjText = await select({ text: '去逛街', clickable: true }).findFirstOrNull({ timeout: 3000 })
            if(!gjText) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            gjText.click()
            await delay(3000)
            const totalCount = count
            while(count-- && !_this.stop) {
                console.log(`第${totalCount-count}个`)
                await view()
            }
            back()
            await delay(500)
            // 关闭弹窗
            const fq = await select({ text: /(放弃|退出)/ }).findFirstOrNull({ timeout: 3000 })
            if(fq) {
                const bounds = fq.boundsInScreen
                if(bounds) {
                    const x = parseInt(bounds.left + (bounds.right-bounds.left)/2)
                    const y = parseInt(bounds.top + (bounds.bottom-bounds.top)/2)
                    await click(x, y)
                }
            }
            await delay(500)
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 搜索
    async search(){
        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log('搜索任务')
            // 进去搜索页面
            const search = await select({ text: '去搜索', clickable: true }).findFirstOrNull({ timeout: 3000 })
            if(!search) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            const content = await select({ text: /赚金币/ }).from(search.parent).findFirstOrNull({ timeout: 3000 })
            if(!content) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            const keyword = content.text.replace('搜索“','').replace('”赚金币', '')
            search.click()
            await delay(2000)
            // 搜索
            await inputText(keyword)
            const swarchBtn = await select({ text: '搜索', clickable: true }).findFirstOrNull({ timeout: 3000 })
            swarchBtn && swarchBtn.click()
            await delay(1000)
            back()
            await delay(500)
            back()
            await delay(500)
            console.log('搜索任务完成')
            return true
        } catch (error) {
            console.error('搜索出错', error.message)
            return false
        }
    }

    // 短剧
    async viewPlaylet(){
        const _this = this
        try {
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log('看短剧')
            // 进去短剧页面
            const inBtn = await select({ text: '看短剧', clickable: true }).findFirstOrNull({ timeout: 3000 })
            if(!inBtn) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            inBtn.click()
            await delay(2000)
            // 获取初始任务数量
            let count = 0
            let total = 0
            const textUi = await select({ text: /\/5/ }).findFirstOrNull({ timeout: 3000 })
            if(textUi) {
                const arr = textUi.text.split('/')
                count = parseInt(arr[0])
                total = parseInt(arr[1])
            }
            // 等待任务数量+1
            while(count < total && !_this.stop) {
                await delay(5000)
                const textUi = await select({ text: /\/5/ }).findFirstOrNull({ timeout: 3000 })
                if(textUi) {
                    const arr = textUi.text.split('/')
                    const curCount = parseInt(arr[0])
                    if(curCount > count) {
                        await swipe(850,1500,850,100,200)
                        count = curCount
                    }
                }
            }
            back()
            await delay(500)
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }

    // 逛街
    async shopping(){
        const _this = this
        try {
            async function view(){
                try {
                    // 滑动屏幕
                    let times = 0
                    while(!_this.stop) {
                        if(Math.random() < 0.7) {
                            await swipe(850,1000,850,800,500)
                        } else {
                            await swipe(850,800,850,1000,500)
                        }
                        
                        await delay(2000)
                        times += 2
                        if(times >= 90) break
                    }
                    return true
                } catch (error) {
                    console.error(error.message)
                    return false
                }
            }
            if(!await this.backHome()) throw new Error('请切换至“去赚钱“页面')
            console.log('逛街任务')
            // 进去逛街页面
            const inBtn = await select({ text: '去逛街', clickable: true }).findFirstOrNull({ timeout: 3000 })
            if(!inBtn) throw new Error('为找到入口按钮，请切换至“去赚钱”页面')
            inBtn.click()
            await delay(2000)
            // 获取初始任务数量
            let count = 0
            let total = 0
            const textUi = await select({ text: /逛街领奖励，已领/ }).findFirstOrNull({ timeout: 3000 })
            if(textUi) {
                const arr = textUi.text.replace('逛街领奖励，已领','').replace('次','').split('/')
                count = parseInt(arr[0])
                total = parseInt(arr[1])
            }
            
            // 等待任务数量+1
            while(count < total && !_this.stop) {
                console.log(`共${total}个，第${count+1}个`)
                await view()
                const textUi = await select({ text: /逛街领奖励，已领/ }).findFirstOrNull({ timeout: 3000 })
                if(textUi) {
                    const arr = textUi.text.replace('逛街领奖励，已领','').replace('次','').split('/')
                    count = parseInt(arr[0])
                }
            }
            back()
            await delay(500)
            return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    }
}