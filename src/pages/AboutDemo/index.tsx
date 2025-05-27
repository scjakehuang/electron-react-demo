// const Ajv2020 = require("ajv/dist/2020")
import Ajv2020 from "ajv/dist/2020"
import { randomInt } from "crypto"
const ajv = new Ajv2020({
    code: {
        source: false
    }
})


const About = () => {
    return (
        <div>
            <button onClick={() => {
                const schema = {
                    type: "object",
                    properties: {
                        foo: { type: "integer" },
                        bar: { type: "string" }
                    },
                    required: ["foo"],
                    additionalProperties: false
                }
                const validate = ajv.compile(schema)
                const data = {
                    bar: "abc"
                }
                const valid = validate(data)
                if (!valid) {
                    console.error(validate.errors)
                } else {
                    console.log('成功')
                }

            }}>测试JSON scheme</button>
            <button onClick={() => {
                console.log('web socket 测试')
                const ws = new WebSocket('ws://localhost:4000');
                console.log(ws)
                ws.onerror = (e) => {
                    console.log('连接失败', e)
                }
                ws.onopen = () => {
                    console.log('连接成功');
                    ws.send('hello world');
                };
                // 修正类型错误，WebSocket 的 onmessage 事件处理函数只接受一个 MessageEvent 类型的参数
                ws.onmessage = (e: MessageEvent<any>) => {
                    console.log('客户端收到消息', e.data);
                };

            }}>web socket 测试</button>
            <button onClick={async () => {
                try {
                    const result = await window.electronApi.userConfig('get')
                    console.log('获取config', result)
                } catch (error) {
                    console.log(error)
                }
            }}>
                获取User Config
            </button>
            <button onClick={async () => {
                try {
                    const result = await window.electronApi.userConfig('set', Math.floor(Math.random() *100))
                    console.log('获取config', result)
                } catch (error) {
                    console.log(error)
                }
            }}>
                设置User Config
            </button>
        </div>
    )
}

export default About