import { spawn } from 'child_process';
import path from 'path';
import { app } from 'electron'

// const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('import.meta.url====', import.meta.url)
console.log('process.resourcesPath====', process.resourcesPath)
console.log('process.cwd()====', process.cwd())

const getServerPath = () => {
    if (process.env.NODE_ENV === 'development') {
        const __dirname = process.cwd();
        return path.join(__dirname, '/electron/server/mock/index.js')
    } else {
        return path.join(__dirname, '/electron/server/mock/index.js')
    }
}

// 启动 HTTP 服务子进程
function startServer() {
    const child = spawn(
        'node',
        [getServerPath()], // 执行 server.js
        {
            env: {
                ...process.env,       // 继承父进程环境变量
                PORT: '4000'          // 自定义环境变量（覆盖父进程 PORT）
            },
            stdio: 'pipe'          // 分离 stdio 流
        }
    );

    // 2. 处理子进程输出
    child.stdout.on('data', (data) => {
        console.log(`[子进程 stdout] ${data}`);
    });

    child.stderr.on('data', (data) => {
        console.error(`[子进程 stderr] ${data}`);
    });

    // 3. 处理子进程事件
    child.on('error', (err) => {
        console.error('[父进程] 启动子进程失败:', err);
    });

    child.on('exit', (code, signal) => {
        console.log(`[父进程] 子进程退出，code=${code}, signal=${signal}`);
    });

    // 4. 父进程退出时终止子进程
    process.on('SIGINT', () => {
        console.log('[父进程] 收到终止信号，清理子进程...');
        child.kill(); // 发送 SIGTERM
        process.exit();
    });
}

export default startServer;