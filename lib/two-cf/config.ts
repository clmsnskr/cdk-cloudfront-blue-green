import { appName, topLevelDomain } from "../config"

export interface TwoCfColourConfig {
    distributionIdOutput: string
    distributionDomainOutput: string
    siteBucketNameOutput: string
    domainNames: string[]
    colourDomain: string
}

export interface TwoCfConfig {
    blue: TwoCfColourConfig
    green: TwoCfColourConfig
    switchFunctionAssetPath: string
}

const getTwoCfColourConfig = (colour: string, wwwDomain: string) => {
    const colourDomain = `twocf-${colour}.${topLevelDomain}`
    const config: TwoCfColourConfig = {
        colourDomain,
        domainNames: [
            colourDomain,
            wwwDomain
        ],
        distributionDomainOutput: `${appName}${colour}distdomain`,
        distributionIdOutput: `${appName}${colour}distid`,
        siteBucketNameOutput: `${appName}${colour}bucketname`,
    }
    return config
}

export const getTwoCfConfig = () => {
    const config: TwoCfConfig = {
        blue: getTwoCfColourConfig("blue", `www.${topLevelDomain}`),
        green: getTwoCfColourConfig("green", `*.${topLevelDomain}`),
        switchFunctionAssetPath: "./lib/two-cf/switch/index.js",
    }
    return config
}
