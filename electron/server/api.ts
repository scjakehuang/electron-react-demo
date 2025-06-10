import Koa from 'koa'
import Router from 'koa-router'
import bodyParser from 'koa-bodyparser'
import { Context } from 'koa'

interface TicketRequest {
  ticketName: string;
  checkResult: boolean;
  machineId: string;
  stationId: string;
}

const app = new Koa()
const router = new Router()

app.use(bodyParser())

// 存储检票结果
let checkResults: Array<{
  ticketName: string;
  checkResult: boolean;
  timestamp: Date;
  machineId: string;
  stationId: string;
}> = []

// 检票接口
router.post('/api/check-ticket', (ctx: Context) => {
  const body = ctx.request.body as Partial<TicketRequest>
  const { ticketName, checkResult, machineId, stationId } = body

  if (!ticketName || !machineId || !stationId || checkResult === undefined) {
    ctx.status = 400
    ctx.body = { error: '缺少必要参数' }
    return
  }

  // 记录检票结果
  checkResults.push({
    ticketName,
    checkResult: Boolean(checkResult),
    timestamp: new Date(),
    machineId,
    stationId
  });

  // 返回统计数据
  const successCount = checkResults.filter(r => r.checkResult).length;
  const machineCount = checkResults.filter(r =>
    r.machineId === machineId
  ).length;
  const stationCount = checkResults.filter(r =>
    r.stationId === stationId
  ).length;

  ctx.body = {
    ticketName,
    checkResult: Boolean(checkResult),
    successCount,
    machineCount,
    stationCount
  };
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
