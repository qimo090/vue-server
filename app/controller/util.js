'use strict'

const svgCaptcha = require('svg-captcha')
const fse = require('fs-extra')
const path = require('path')
const BaseController = require('./base')

class UtilController extends BaseController {
  // 图片验证码
  async captcha() {
    const { ctx } = this
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      height: 40,
      width: 100,
      noise: 3,
    })
    console.log('captcha =>', captcha.text)
    ctx.session.captcha = captcha.text
    ctx.response.type = 'image/svg+xml'
    ctx.body = captcha.data
  }
  // 发送邮件验证码
  async sendcode() {
    const { ctx } = this
    const email = ctx.query.email
    const code = Math.random().toString().slice(2, 6)
    console.log('email:', email, 'code:', code)
    ctx.session.emailcode = code

    const subject = '验证码'
    const text = ''
    const html = `<h2>小社区<a href="baidu.com"><span>${code}</span></a></h2>`

    const hasSend = await this.service.tools.sendMail({
      email,
      subject,
      text,
      html,
    })
    if (hasSend) {
      this.success('发送成功')
    } else {
      this.error('发送失败')
    }
  }
  // 文件上传
  async uploadfile() {
    // /public/hash/(hash+index)
    // 测试：上传文件切片有概率出错
    if (Math.random() < 0.1) {
      this.ctx.status = 500
      return
    }
    const { ctx } = this
    const file = ctx.request.files[0]
    const { hash, name } = ctx.request.body

    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)
    // const filePath = path.resolve() // 文件最终存储的位置，合并之后的
    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath)
    }

    await fse.move(file.filepath, `${chunkPath}/${name}`)

    this.message('切片上传成功')
  }
  // 文件chunks合并
  async mergefile() {
    const { ext, hash, size } = this.ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    await this.ctx.service.tools.mergefile(filePath, hash, size)
    this.success({
      url: `/public/${hash}.${ext}`,
    })
  }
  // 根据文件内容hash检测是否已存在
  async checkfile() {
    const { ctx } = this
    const { hash, ext } = ctx.request.body
    const filepath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)

    let uploaded = false
    let uploadedList = []
    if (fse.existsSync(filepath)) {
      uploaded = true
    } else {
      uploadedList = await this.getUploadedList(
        path.resolve(this.config.UPLOAD_DIR, hash)
      )
    }
    this.success({
      uploaded,
      uploadedList,
    })
  }
  // 获取已上传切片数组
  async getUploadedList(dir) {
    return fse.existsSync(dir)
      ? (await fse.readdir(dir)).filter(name => name[0] !== '.')
      : []
  }
}

module.exports = UtilController
