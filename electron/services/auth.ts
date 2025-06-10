import { Conf } from 'electron-conf'

interface ConfigSchema extends Record<string, any> {
    foo?: number;
    bar?: string;
}

const schema = {
    type: 'object',
    properties: {
        foo: {
            type: 'number',
            maximum: 10,
            minimum: 0,
            default: 5,
            nullable: true
        },
        bar: {
            type: 'string',
            maxLength: 100,
            nullable: true
        }
    },
    required: [],
    additionalProperties: true
} as const;


const migrations = [
    {
        version: 1,
        hook: (conf: any, version: number): void => {
            conf.set('foo', 5)  // 显式设置合法默认值
            console.log(`migrate from ${version} to 1`)
        }
    },
    {
        version: 2,
        hook: (conf: any, version: number): void => {
            conf.set('bar', 'world')
            console.log(`migrate from ${version} to 2`)
        }
    },
    {
        version: 3,
        hook: (conf: any, version: number): void => {
            const lastValue = conf.get('bar')
            conf.set('bar', 'hello, '+ lastValue)
            console.log(`migrate from ${version} to 3`) // migrate from 0 to 1
        }
    }
]

let conf: Conf<ConfigSchema>;
try {
    conf = new Conf({
        name: 'user-config',
        schema,
        migrations
    })
} catch (e) {
    console.error('Configuration initialization failed:', e)
    process.exit(1)
}

export const getUserConfig = (): string => {
    return (conf as any).path
}

export const setUserConfig = (config: Partial<ConfigSchema>): void => {
    // 强制验证所有输入
    const validatedConfig: Partial<ConfigSchema> = {
        foo: Math.min(10, Math.max(0, Number(config.foo) || 5)),
        ...config
    }
    conf.store = {
        ...conf.store,
        ...validatedConfig
    }
}