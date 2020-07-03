'use strict'

const { Service } = require('egg')
const nodemailer = require('nodemailer')
const path = require('path')
const fse = require('fs-extra')

const userEmail = '15710150558@163.com'
const transporter = nodemailer
  .createTransport({
    service: '163',
    secureConnection: true,
    auth: {
      user: userEmail,
      pass: 'YY319279424',
    },
  })

class ToolService extends Service {
  // 发送邮箱验证码
  async sendMail({ email, subject, text, html }) {
    const mailOptions = {
      from: userEmail,
      cc: userEmail,
      to: email,
      subject,
      text,
      html,
    }
    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (err) {
      console.log('email send error', err)
      return false
    }
  }

  // 合并文件
  async mergefile(filePath, hash, size) {
    // 切片文件夹 /public/[hash]
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, hash)
    // 读取切片文件夹中的切片
    let chunks = await fse.readdir(chunkDir)
    // 文件根据-后缀index排序 => 方便按顺序进行合成
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    // 所有切片所在路径组成的组数 ['/public/[hash]-0', ''/public/[hash]-1', ...]
    chunks = chunks.map(cp => path.resolve(chunkDir, cp))
    // 将所有切片进行合成
    await this.mergeChunks(chunks, filePath, chunkDir, size)
  }
  /**
   * 合成chunks
   * @param {Array} chunksPath 切片所在路径组成的数组
   * @param {String} filePath 单个切片文件路径
   * @param {String} chunkDir 所有切片文件夹路径
   * @param {Number} size 单个切片大小
   */
  async mergeChunks (chunksPath, filePath, chunkDir, size) {
    const pipStream = (chunkPath, writeStream) =>
      new Promise(resolve => {
        const readStream = fse.createReadStream(chunkPath)
        readStream.on('end', () => {
          // 合成一个切片 => 删除改切片
          fse.unlinkSync(chunkPath)
          resolve()
        })
        // 读取到一个切片 => 合成改切片
        readStream.pipe(writeStream)
      })
    // 合成所有的切片 => 返回一个合成好的文件
    await Promise.all(
      chunksPath.map((chunkPath, index) => {
        return pipStream(chunkPath, fse.createWriteStream(filePath, {
          start: index * size,
          end: (index + 1) * size,
        }))
      })
    )
    // 合成完所有切片 => 删除所有切片所在的文件夹
    await fse.remove(chunkDir)
  }
}

module.exports = ToolService
