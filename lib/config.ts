export const topLevelDomain = "example.com"

export const appName = "cdkcfbg"

export const getEnvVar = (name: string) => {
    const v = process.env[name]
    if (!v) {
        throw new Error(`Need to specify ${name}`);
    }
    return v
}

export const getAwsRegion = () => {
    return getEnvVar("AWS_REGION")
}

export const getAwsAccount = () => {
    return getEnvVar("AWS_ACCOUNT")
}

export const getCertificateArnOutput = () => {
    return `${appName}certarn`
}
