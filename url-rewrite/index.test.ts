import { blueBNToken, greenBNToken, handleRequest } from './index'
import { Request } from './interfaces'

describe("request tests", () => {
    const blueDomainName = `${blueBNToken}.s3.amazonaws.com`
    const greenDomainName = `${greenBNToken}.s3.amazonaws.com`

    const blueRequest = (uri: string) => {
        return {
            uri,
            clientIp: "1.2.3.4",
            headers: {
                host: []
            },
            origin: {
                custom: {
                    domainName: blueDomainName
                }
            }
        }
    }

    const greenRequest = (uri: string) => {
        return {
            uri,
            clientIp: "1.2.3.4",
            headers: {
                host: []
            },
            origin: {
                custom: {
                    domainName: greenDomainName
                }
            }
        }
    }

    const getUser = (s: string) => 50

    describe("blue prefix request tests", () => {
        const getBlue = async () => Promise.resolve(0)

        test('rewrites domainName to blue from /_blue/ and url to base', async () => {
            const request: Request = greenRequest("/_blue/")

            const actualRequest = await handleRequest(request, getBlue, getUser)

            expect(actualRequest.origin?.custom?.domainName).toBe(blueDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

        test('maintains blue domain name from /_blue/ and url to base', async () => {
            const request: Request = blueRequest("/_blue/")

            const actualRequest = await handleRequest(request, getBlue, getUser)

            expect(actualRequest.origin?.custom?.domainName).toBe(blueDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

    })

    describe("green prefix request tests", () => {
        const getBlue = async () => Promise.resolve(0)

        test('rewrites domainName to green from /_green/ and url to base', async () => {
            const request: Request = blueRequest("/_green/")

            const actualRequest = await handleRequest(request, getBlue, getUser)

            expect(actualRequest.origin?.custom?.domainName).toBe(greenDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

        test('maintains green domain name from /_green/ and url to base', async () => {
            const request: Request = greenRequest("/_green/")

            const actualRequest = await handleRequest(request, getBlue, getUser)

            expect(actualRequest.origin?.custom?.domainName).toBe(greenDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

    })

    describe("no prefix request tests", () => {
        const getBlue = async () => Promise.resolve(0)
        const getGreen = async () => Promise.resolve(100)
        const getHalfAndHalf = async () => Promise.resolve(50)

        test('rewrites domainName to blue from / when user is over dns', async () => {
            const request: Request = greenRequest("/")

            const actualRequest = await handleRequest(request, getHalfAndHalf, () => 51)

            expect(actualRequest.origin?.custom?.domainName).toBe(blueDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

        test('maintains domainName when user is under dns value', async () => {
            const request: Request = greenRequest("/")

            const actualRequest = await handleRequest(request, getHalfAndHalf, () => 49)

            expect(actualRequest.origin?.custom?.domainName).toBe(greenDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

        test('rewrites domainName to blue from green when dns is full blue', async () => {
            const request: Request = greenRequest("/")

            const actualRequest = await handleRequest(request, getBlue, () => 40)

            expect(actualRequest.origin?.custom?.domainName).toBe(blueDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

        test('rewrites domainName to green from blue when dns is full green', async () => {
            const request: Request = blueRequest("/")

            const actualRequest = await handleRequest(request, getGreen, () => 40)

            expect(actualRequest.origin?.custom?.domainName).toBe(greenDomainName)
            expect(actualRequest.uri).toBe("/index.html")
        })

    })

})
