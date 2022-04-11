import { promises } from "dns"
import { Request } from "./interfaces"

export const percentGreenDomainToken = "<PERCENT_GREEN_DOMAIN>"
export const blueBNToken = "<BLUE_BUCKET_NAME>"
export const greenBNToken = "<GREEN_BUCKET_NAME>"

const b = "blue"
const g = "green"

const bp = "/_blue"
const gp = "/_green"

const logDebug = false
const l = (s: any) => { if (logDebug) console.log(s) }
const lJ = (s: any) => { if (logDebug) console.log(JSON.stringify(s)) }

let lastPercentage: number = 0
let lastRetrieved: Date | null = null

const fetchFromDns = async () => {
    try {
        const data = await promises.resolveTxt(percentGreenDomainToken)
        const v = parseInt(data[0][0])
        lastPercentage = v
        lastRetrieved = new Date()
        l(`retrieved ${v} from dns`)
        return v
    } catch (error) {
        console.log(error)
        return 0
    }
}

type GetGreenPercentage = () => Promise<number>
const getGreenPercentFromDns: GetGreenPercentage = async () => {
    if (!lastRetrieved) {
        return await fetchFromDns()
    }
    const now = new Date()

    var limit = new Date(lastRetrieved.valueOf());
    limit.setSeconds(limit.getSeconds() + 5)

    if (now.valueOf() < limit.valueOf()) {
        return lastPercentage
    }
    return await fetchFromDns()
}

type GetUserPercentage = (ipAddress: string) => number
const getUserPercentFromIpAddress: GetUserPercentage = (ipAddress: string) => {
    // this probably isn't distributed evenly, but oh well...
    let total = 1
    for (let i = 0; i < ipAddress.length; i++) {
        const code = ipAddress.charCodeAt(i);
        total = total + code * i
    }
    const mod100 = total % 100
    const userValue = mod100 + 1
    l(`${ipAddress} -> ${total} -> ${mod100}`)
    return userValue
}

const rwIndex = (url: string) => {
    if (url === "/") return "/index.html"
    if (url === bp || url === `${bp}/`) return `${bp}/index.html`
    if (url === gp || url === `${gp}/`) return `${gp}/index.html`
    return url
}

export const handleRequest = async (request: Request, getGreenPercent: GetGreenPercentage, getUserPercent: GetUserPercentage) => {
    if (!request.origin) {
        console.log(`origin not present, can't rewrite!!`)
        return request
    }

    let colour: string | null = null

    const url: string = rwIndex(request.uri)
    request.uri = url

    let newUrl: string | null = null

    if (url.startsWith(bp)) {
        newUrl = url.substring(bp.length)
        colour = b
    }

    if (url.startsWith(gp)) {
        newUrl = url.substring(gp.length)
        colour = g
    }

    if (newUrl) {
        l(`Changing ${url} to ${newUrl}`)
        request.uri = newUrl
    }

    if (!colour) {
        const percentGreen = await getGreenPercent()
        const userPercent = getUserPercent(request.clientIp)
        colour = userPercent > percentGreen ? "blue" : "green"
    }

    let bucketDomain = colour === b ? `${blueBNToken}.s3.amazonaws.com` : `${greenBNToken}.s3.amazonaws.com`

    if (request.origin.s3) {
        request.origin.s3.domainName = bucketDomain;
    }
    if (request.origin.custom) {
        l(`Replacing domain with ${bucketDomain}`)
        request.origin.custom.domainName = bucketDomain;
    }
    request.headers.host = [{ key: 'host', value: bucketDomain }];

    return request
}

export const handler = (event: any, context: any, callback: any) => {
    const request: Request = event.Records[0].cf.request
    lJ(request)
    handleRequest(
        request,
        getGreenPercentFromDns,
        getUserPercentFromIpAddress)
        .then(request => {
            lJ(request)
            callback(null, request)
        })
}
// do not remove end marker as is used to reduce the lambda code size.
//end