const AWS = require('aws-sdk')

const getEnv = (name: string): string => {
    const v = process.env[name]
    if (!v) { throw new Error(`Environment needs ${name}`) }
    return v
}

const getPercent = (n: string) => {
    const parsed = parseInt(n);
    if (isNaN(parsed)) { return 0; }
    if (parsed > 100) { return 100 }
    if (parsed < 0) { return 0 }
    return parsed
}

export const handler = (event: any, context: any, callback: any) => {
    let value = event.percentGreen
    if (!value) {
        throw new Error("Need to specify percentGreen!")
    }
    value = getPercent(value)

    const domain = getEnv("PERCENT_GREEN_DOMAIN")
    const hostedZoneId = getEnv("HOSTED_ZONE_ID")

    const r53 = new AWS.Route53()
    const getRecord = (action: string) => {
        return {
            HostedZoneId: hostedZoneId,
            ChangeBatch: {
                Changes: [
                    {
                        Action: action,
                        ResourceRecordSet: {
                            Name: domain,
                            Type: 'TXT',
                            ResourceRecords: [{ Value: `"${value}"` }],
                            TTL: 60,
                        },
                    }
                ],
            },
        };
    }

    const modify = getRecord("UPSERT")
    r53.changeResourceRecordSets(modify, (err: any) => {
        if (err) {
            console.log("Got an err, try create");
            console.log(err);
            const create = getRecord("CREATE")
            r53.changeResourceRecordSets(create, (err: any) => {
                if (err) {
                    console.log("Got a second err");
                    return callback(err);
                }
                console.log('Done');
            });
        } else {
            console.log('done');
        }
    });
}
// do not remove end marker as is used to reduce the lambda code size.
//end