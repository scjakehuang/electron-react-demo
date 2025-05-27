import { Conf } from 'electron-conf/main'

const schema = {
    type: 'object',
    properties: {
        foo: {
            type: 'number',
            maxLength: 10,
            nullable: true
        },
        bar: {
            type: 'string',
            maxLength: 100,
            nullable: true
        }
    }
}
const migrations = [
    {
        version: 1,
        hook: (conf, version): void => {
            conf.set('foo', 100)
            console.log(`migrate from ${version} to 1`) // migrate from 0 to 1
        }
    },
    {
        version: 2,
        hook: (conf, version): void => {
            conf.set('bar', 'world')
            console.log(`migrate from ${version} to 2`) // migrate from 0 to 1
        }
    },
    {
        version: 2,
        hook: (conf, version): void => {
            conf.set('bar', 'world')
            console.log(`migrate from ${version} to 2`) // migrate from 0 to 1
        }
    },
    {
        version: 3,
        hook: (conf, version): void => {
            const lastValue = conf.get('bar')
            conf.set('bar', 'hello, '+ lastValue)
            console.log(`migrate from ${version} to 3`) // migrate from 0 to 1
        }
    }
]

let conf:any
try {
    conf = new Conf({ name: 'user-config', schema, migrations })
} catch (e) {
    console.log(e)
}

export const getUserConfig = () => {
    return conf.fileName
}

export const setUserConfig = (config: any) => {
    return conf.set('foo', config)
}