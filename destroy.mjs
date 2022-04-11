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

const destroyStack = async (stackName) => {
  const args = [
    "-f",
  ]
  
  try {
    await $`cdk destroy ${stackName} ${args} `
  } catch (error) {
    process.exit(1)
  }
}

// await destroyStack(`cdkcfbg-cert`)

// await destroyStack(`cdkcfbg-onecf-route`)

// await destroyStack(`cdkcfbg-onecf-blue`)
// await destroyStack(`cdkcfbg-onecf-green`)

// await destroyStack(`cdkcfbg-onecf-infra`)



// await destroyStack(`cdkcfbg-twocf-route`)

// await destroyStack(`cdkcfbg-twocf-blue`)
// await destroyStack(`cdkcfbg-twocf-green`)

// await destroyStack(`cdkcfbg-twocf-infra`)
