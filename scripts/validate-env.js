const fs = require('fs')
const path = require('path')

// Required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'COZE_API_KEY',
  'COZE_BOT_ID_JAVA',
  'COZE_BOT_ID_WEB',
]

function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    const envVars = {}
    
    lines.forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const [, key, value] = match
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
      }
    })
    
    return envVars
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message)
    return null
  }
}

function validateEnvFile(filePath) {
  console.log(`\n🔍 Validating ${filePath}...`)
  
  const envVars = readEnvFile(filePath)
  
  if (!envVars) {
    console.log(`❌ ${filePath} not found or empty`)
    return false
  }
  
  let isValid = true
  
  requiredEnvVars.forEach(varName => {
    if (!envVars[varName]) {
      console.log(`❌ Missing: ${varName}`)
      isValid = false
    } else {
      console.log(`✅ Found: ${varName}`)
    }
  })
  
  // Additional validations
  if (envVars.COZE_API_KEY && !envVars.COZE_API_KEY.startsWith('pat_')) {
    console.log('❌ COZE_API_KEY should start with "pat_"')
    isValid = false
  }
  
  if (envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET.length < 32) {
    console.log('⚠️  NEXTAUTH_SECRET should be at least 32 characters long')
  }
  
  if (isValid) {
    console.log(`✅ ${filePath} is valid!`)
  }
  
  return isValid
}

function main() {
  console.log('🚀 CodeCanvas Environment Validation')
  console.log('=' .repeat(40))
  
  // Only validate actual environment files, not example files
  const envFiles = [
    '.env',
    '.env.local'
  ]
  
  let allValid = true
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const isValid = validateEnvFile(filePath)
      allValid = allValid && isValid
    } else {
      console.log(`\nℹ️  ${file} not found`)
    }
  })
  
  // Check example file for documentation purposes
  const exampleFilePath = path.join(process.cwd(), '.env.example')
  if (fs.existsSync(exampleFilePath)) {
    console.log(`\nℹ️  Checking .env.example for reference...`)
    const exampleEnvVars = readEnvFile(exampleFilePath)
    if (exampleEnvVars) {
      requiredEnvVars.forEach(varName => {
        if (!exampleEnvVars[varName]) {
          console.log(`⚠️  .env.example is missing: ${varName}`)
        }
      })
    }
  }
  
  console.log('\n' + '=' .repeat(40))
  
  if (allValid) {
    console.log('🎉 All environment files are valid!')
    process.exit(0)
  } else {
    console.log('❌ Some environment files have issues!')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { validateEnvFile, readEnvFile }