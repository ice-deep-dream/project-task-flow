/**
 * 描述: 请求处理工具类
 */
const ERROR_CODE = [
    {
        type: "通用API",
        className: "服务器错误",
        classCode: 50,
        code: 50000,
        describe: "",
        message: "",
        messageEN: "server error!"
    },
    {
        type: "通用API",
        className: "参数错误",
        classCode: 12,
        code: 12000,
        describe: "",
        message: "参数错误！",
        messageEN: "invalid request error!"
    },
    {
        type: "通用API",
        className: "数据处理",
        classCode: 12,
        code: 92001,
        describe: "",
        message: "",
        messageEN: ""
    },
    {
        type: "通用API",
        className: "服务器错误",
        classCode: 50,
        code: 50000,
        describe: "",
        message: "",
        messageEN: ""
    },
    {
        type: "通用API",
        className: "文件",
        classCode: 16,
        code: 16000,
        describe: "",
        message: "",
        messageEN: ""
    },
    {
        type: "通用API",
        className: "文件",
        classCode: 16,
        code: 17000,
        describe: "",
        message: "文件路径有误",
        messageEN: "文件路径有误"
    },
    {
        type: "通用API",
        className: "文件",
        classCode: 16,
        code: 16000,
        describe: "",
        message: "文件过大，部分文件下载成功！",
        messageEN: "文件过大，部分文件下载成功！"
    },
    {
        type: "通用API",
        className: "文件",
        classCode: 16,
        code: 16000,
        describe: "",
        message: "文件下载失败！",
        messageEN: "文件下载失败！"
    },
    {
        type: "飞书API",
        className: "应用凭证",
        classCode: 90,
        code: 90000,
        describe: "",
        message: "",
        messageEN: ""
    },
    {
        type: "飞书API",
        className: "应用凭证",
        classCode: 90,
        code: 90001,
        describe: "",
        message: "",
        messageEN: ""
    },
    {
        type: "飞书插件",
        className: "多维表",
        classCode: 30,
        code: 30000,
        describe: "",
        message: "",
        messageEN: ""
    }
];

// 成功响应类型
export type SuccessCode = {
    code: number;
    data: string | object | [];
    message: string;
};

/**
 * 定义错误代码的类型
 * 这个类型用于标准化错误的描述方式，便于在系统中统一处理和识别错误
 * 每个错误代码都包含一系列可选的描述信息，这些信息提供了错误的上下文和详细说明
 */
export type ErrorCode = {
    type?: string; // 错误类型（例如服务器）
    className?: string; // 错误发生的类名，用于精确定位错误分类（例如参数、文件、数据库等）
    classCode?: number; // 类错误代码，与className一起使用，进一步细化错误分类
    code: number; // 错误代码，每个错误都有一个唯一的代码标识
    describe?: string; // 错误描述，提供错误的详细说明或数据
    message?: string; // 错误消息，用户可读的错误说明或建议
    messageEN?: string; // 英文错误消息，提供英文版本的错误说明，便于国际化
}

// 请求结果类型
export type RequestCode = SuccessCode | ErrorCode

/**
 * 请求成功
 * @param data
 */
export function successRequest(data: string | object | []): SuccessCode {
    return {code: 0, data, message: '成功!'};
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 请求失败
 * @param code
 * @param message
 * @param data
 */
export function errorRequest(code: number, message?: string, data?:any): ErrorCode {
    const serverErrorCode = ERROR_CODE.find((errorCode) => errorCode.code === code);
    if (serverErrorCode) {
        return {
            code: serverErrorCode.code,
            message: (message ? " Error: " + message : serverErrorCode.message),
            describe: data,
        };
    } else {
        return {
            code: 10000,
            message: message || "unknown error!",
            describe: data,
        };
    }

}
