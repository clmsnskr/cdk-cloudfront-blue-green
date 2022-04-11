
export interface Host {
    key: string
    value: string
}

export interface Headers {
    host?: Host[]
}

export interface OriginObj {
    domainName: string
}

export interface Origin {
    custom?: OriginObj
    s3?: OriginObj
}

export interface Request {
    uri: string
    headers: Headers
    clientIp: string
    origin?: Origin
}

