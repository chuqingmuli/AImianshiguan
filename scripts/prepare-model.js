const fs = require('fs');
const path = require('path');
const https = require('https');

// 创建模型目录
const modelsDir = path.join(__dirname, '../models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Kokoro-TTS模型下载地址（从Hugging Face下载）
const modelUrls = [
  {
    url: 'https://huggingface.co/Xenova/kokoro-82M/resolve/main/model.onnx',
    filename: 'kokoro-82M.onnx'
  },
  {
    url: 'https://huggingface.co/Xenova/kokoro-82M/resolve/main/voices.json',
    filename: 'voices.json'
  }
];

async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(modelsDir, filename);
    
    // 如果文件已存在，跳过下载
    if (fs.existsSync(filePath)) {
      console.log(`模型文件 ${filename} 已存在，跳过下载`);
      resolve();
      return;
    }
    
    console.log(`正在下载 ${filename}...`);
    
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`模型文件 ${filename} 下载完成`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // 删除不完整的文件
      reject(err);
    });
  });
}

async function downloadModels() {
  try {
    console.log('开始下载Kokoro-TTS模型文件...');
    
    for (const model of modelUrls) {
      await downloadFile(model.url, model.filename);
    }
    
    console.log('所有模型文件下载完成！');
  } catch (error) {
    console.error('模型下载失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行下载
if (require.main === module) {
  downloadModels();
}

module.exports = { downloadModels };
