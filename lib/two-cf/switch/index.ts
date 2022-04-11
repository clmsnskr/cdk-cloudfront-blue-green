const AWS = require('aws-sdk')
export const handler = (event: any, context: any) => {
    const colour: string = event.colour
    if (!colour) {
        throw new Error("Need to specify colour!")
    }
    const isBlue = colour.toLowerCase() === "blue"

    const distributionId = process.env.BLUE_DIST_ID
    if (!distributionId) {
        throw new Error("Environment needs BLUE_DIST_ID")
    }
    const wwwDomain = process.env.WWW_DOMAIN
    if (!wwwDomain) {
        throw new Error("Environment needs WWW_DOMAIN")
    }

    const cloudfront = new AWS.CloudFront();
    // https://javascript.hotexamples.com/examples/aws-sdk/CloudFront/updateDistribution/javascript-cloudfront-updatedistribution-method-examples.html
    cloudfront.getDistribution({ Id: distributionId }, function (err: any, res: any) {
        if (err) {
            console.log(err, err.stack);
            return
        }

        let hasDoneSomething = false

        const dist = res.Distribution.DistributionConfig
        const aliases: string[] = dist.Aliases.Items
        if(isBlue){
            console.log("Deploy blue")
            if(!aliases.includes(wwwDomain)){
                console.log("www domain not present, add!")
                hasDoneSomething = true
                aliases.push(wwwDomain)
                dist.Aliases.Quantity++
            }
        } else {
            console.log("Deploy green")
            if(aliases.includes(wwwDomain)){
                console.log("www domain is present, remove!")
                hasDoneSomething = true
                dist.Aliases.Items = aliases.filter(x => x !== wwwDomain)
                dist.Aliases.Quantity--
            }
        }

        var params = {
            Id: distributionId,
            DistributionConfig: dist,
            IfMatch: res.ETag
        };
        if(hasDoneSomething){
            cloudfront.updateDistribution(params, function (err: any, data: any) {
                if (err) console.log(err, err.stack);
                else console.log(data);
            });
        } else {
            console.log("Do nothing, no change needed.")
        }
    });
}
// do not remove end marker as is used to reduce the lambda code size.
//end