#!/usr/bin/env zx

const exitWithError = (message, err) => {
  console.log(message)
  console.log(err)
  process.exit(1)
}

const getEnvOrFail = (name) => {
  const v = process.env[name]
  if (!v || v === "") {
    exitWithError(`Cannot get env var '${name}'`)
  }
  return v
}

const deployStack = async (stackName) => {
  const args = [
    "-f",
    "--require-approval",
    "never",
  ]
  
  try {
    await $`cdk deploy ${stackName} ${args} `
  } catch (error) {
    process.exit(1)
  }
}

await deployStack(`cdkcfbg-cert`)

await deployStack(`cdkcfbg-onecf-infra`)
await deployStack(`cdkcfbg-onecf-blue`)
await deployStack(`cdkcfbg-onecf-green`)

await deployStack(`cdkcfbg-twocf-infra`)
await deployStack(`cdkcfbg-twocf-blue`)
await deployStack(`cdkcfbg-twocf-green`)
