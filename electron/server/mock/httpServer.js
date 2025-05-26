import Koa from 'koa'
import Router from 'koa-router'
import Mock from 'mockjs'
import bodyParser from 'koa-bodyparser'
const app = new Koa();
const router = new Router();
const PORT = process.env.PORT || 3000;

// 解析请求体（支持 POST）
app.use(bodyParser());

// 模拟用户列表接口
router.get('/api/users', (ctx) => {
    console.log('用户接口请求参数：', ctx.request.query);
    const data = Mock.mock({
        'list|5': [{ id: '@id', name: '@cname', age: '@integer(20,60)' }]
    });
    ctx.body = { code: 200, data };
});

// 模拟登录接口（POST）
router.post('/api/login', (ctx) => {
    const { username, password } = ctx.request.body;
    if (username === 'admin' && password === '123456') {
        ctx.body = { code: 200, token: Mock.mock('@guid') };
    } else {
        ctx.body = { code: 401, message: '认证失败' };
    }
});

app.use(router.routes());
app.listen(PORT, () => console.log(`Http Server running on port ${PORT},这段文字可以在父进程看到`));

export default app