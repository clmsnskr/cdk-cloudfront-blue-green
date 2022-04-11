import { appName, topLevelDomain } from "../config"

export interface OneCfColourConfig {
    siteBucketNameOutput: string
}

export interface OneCfConfig {
    wwwDomain: string
    rootDomain: string
    urlRewriteAssetPath: string
    switchFunctionAssetPath: string
    distributionIdOutput: string
    distributionDomainOutput: string
    blue: OneCfColourConfig
    green: OneCfColourConfig
}

const getOneCfColourConfig = (colour: string) => {
    const config: OneCfColourConfig = {
        siteBucketNameOutput: `${appName}${colour}sitebucket`,
    }
    return config
}

export const getOneCfConfig = () => {
    const config: OneCfConfig = {
        // would be just topLevelDomain if proper app
        rootDomain: `root-onecf.${topLevelDomain}`,
        // would be  www.topLevelDomain if proper app
        wwwDomain: `www-onecf.${topLevelDomain}`,
        urlRewriteAssetPath: "./url-rewrite/index.js",
        switchFunctionAssetPath: "./lib/one-cf/switch/index.js",
        distributionDomainOutput: `${appName}distdomain`,
        distributionIdOutput: `${appName}distid`,
        blue: getOneCfColourConfig("blue"),
        green: getOneCfColourConfig("green")
    }
    return config
}
