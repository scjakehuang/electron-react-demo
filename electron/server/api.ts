import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import { Context } from 'koa'

interface TicketRequest {
  /** 闸机指令代码 (必须参数)  81-无效指令 82-直接开闸指令【暂时没有用】 83缓冲开闸指令*/
  cmd?: number; // Made optional to align with Partial<TicketRequest> usage, but guarded by `if (!cmd)`

  /** 允许通行人数 (0表示不限) */
  personnum?: number;

  /** 第一行显示内 (支持普通/安卓闸机)  票名称 */
  line1?: string;

  /** 第二行显示内容 (支持普通/安卓闸机) 已检票数/已购票数 */
  line2?: string;

  /** 第三行显示内容 (支持普通/安卓闸机) */
  line3?: string;

  /** 第四行显示内容 (仅安卓闸机有效) */
  line4?: string;

  /** 第五行显示内容 (仅安卓闸机有效)  闸机设备名称 */
  line5?: string;

  /** 语音提示文件路径/内容 */
  voice?: string;

  /**
   * 显示图片文件名 (仅安卓闸机有效)
   * 要求：图片必须存在于闸机监控电脑指定目录
   */
  filename?: string;

  /**
   * 人数显示开关：  本站今日已检票数
   * - 0: 不显示
   * - 1: 显示
   * (仅普通闸机有效)
   */
  showcount?: number;

  /** 人数统计标题 (例："今日入场") */
  title?: string;

  /** 已通行人数统计值  本机今日已检票数 */
  entrycount?: number;
  // 可以选择性地添加新字段，但保持向后兼容
}

// 声明一个回调函数类型，用于向主进程通知新的检票结果
let ticketUpdateCallback: ((data: any) => void) | null = null;

// 提供设置回调函数的方法，供主进程调用
export const setTicketUpdateCallback = (callback: (data: any) => void) => {
  ticketUpdateCallback = callback;
  console.log('已设置检票更新回调函数');
};

const app = new Koa()
const router = new Router()

app.use(bodyParser())

// 存储检票结果
let checkResults: Array<{
  ticketName: string;
  checkResult: boolean;
}> = []

// 检票接口
router.post('/api/check-ticket', (ctx: Context) => {
  const body = ctx.request.body as TicketRequest // Use the more specific TicketRequest
  const { cmd, personnum, line1, line2, line3, line4, line5, voice, filename, showcount, entrycount, title} = body

  if (!cmd) {
    ctx.status = 400
    ctx.body = { error: '缺少必要参数: cmd' }
    return
  }

  // 记录检票结果
  checkResults.push({
    ticketName: line1 || '未知票种', // 添加默认值防止undefined
    // 如果cmd=82或者cmd=83，则认为是有效票 否则认为是无效票
    checkResult: Boolean(cmd === 82 || cmd === 83),
  });


  const responseData = {
    cmd: cmd,
    personnum: personnum || 0,
    line1: line1 || '',
    line2: line2 || '',
    line3: line3 || '',
    line4: line4 || '',
    line5: line5 || '', // Corrected typo from line4 to line5 and added default
    voice: voice || '',
    filename: filename || '',
    showcount: showcount || 0,
    title: title || '',
    entrycount: entrycount || 0
  };

  // 通知主进程有新的检票数据
  if (ticketUpdateCallback) {
    console.log('通知主进程新的检票数据:', responseData);
    ticketUpdateCallback(responseData);
  }

  ctx.body = responseData;
});

// 获取服务器端口
const PORT = process.env.API_PORT || 3001;

// 启动服务器
export const startApiServer = () => {
  app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT, () => {
    console.log(`检票API服务已启动，端口: ${PORT}`);
  });
};