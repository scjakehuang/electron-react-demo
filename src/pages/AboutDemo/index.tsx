// const Ajv2020 = require("ajv/dist/2020")
import Ajv2020 from "ajv/dist/2020"
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
        </div>
    )
}

export default About