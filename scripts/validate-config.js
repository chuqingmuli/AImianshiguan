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
  
  if (isValid) {
    console.log(`✅ ${filePath} is valid!`)
  }
  
  return isValid
}

function main() {
  console.log('🚀 CodeCanvas Configuration Validation')
  console.log('=' .repeat(45))
  
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
  
  console.log('\n' + '=' .repeat(45))
  
  if (allValid) {
    console.log('🎉 All configuration files are valid!')
    process.exit(0)
  } else {
    console.log('❌ Some configuration files have issues!')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { validateEnvFile, readEnvFile }
