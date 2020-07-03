'use strict'
const BaseController = require('./base')
const md5 = require('md5')
const jwt = require('jsonwebtoken')

const HashSalt = ':My@123!'

// Login 注册参数校验规则
const createRule = {
  email: { type: 'email' },
  nickname: { type: 'string' },
  password: { type: 'string' },
  captcha: { type: 'string' },
}

class UserController extends BaseController {
  // login 登录
  async login() {
    const { ctx, app } = this
    const { email, captcha, password, emailcode } = ctx.request.body
    console.log('ctx.request.body =>', ctx.request.body)
    // 校验图片验证码
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('图片验证码错误')
    }
    // 校验邮箱验证码
    if (emailcode !== ctx.session.emailcode) {
      console.log(
        'emailcode =>',
        emailcode,
        'ctx.session.emailcode=>',
        ctx.session.emailcode
      )
      return this.error('邮箱验证码错误')
    }
    const user = await ctx.model.User.findOne({
      email,
      password: md5(password + HashSalt),
    })
    if (!user) {
      return this.error('用户名或密码错误')
    }
    // 用户的信息加密成token并返回
    const token = jwt.sign({ _id: user._id, email }, app.config.jwt.secret, {
      expiresIn: '1h',
    })
    this.success({ token, email, nickname: user.nickname })
  }
  // register 注册
  async register() {
    const { ctx } = this
    try {
      // 校验传递参数
      ctx.validate(createRule)
    } catch (err) {
      return this.error('参数校验失败', -1, err.errors)
    }
    const { email, nickname, password, captcha } = ctx.request.body

    // 校验验证码
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      this.error('验证码错误')
    }
    // 校验邮箱不能重复
    if (await this.checkEmail(email)) {
      this.error('邮箱重复')
    } else {
      const ret = await this.ctx.model.User.create({
        email,
        nickname,
        password: md5(password + HashSalt),
      })

      if (ret._id) {
        this.message('注册成功')
      }
    }
    // this.success({ name: 'kkb' })
  }
  // 检查邮箱是否存在
  async checkEmail(email) {
    const user = await this.ctx.model.User.findOne({ email })
    return user
  }
  // 校验用户名是否存在
  async verify(nickname) {
    const user = await this.ctx.model.User.findOne({ nickname })
    return user
  }
  // 获取用户信息
  async info() {
    const { ctx } = this
    const { email } = ctx.state
    const user = await this.checkEmail(email)
    this.success(user)
  }
}

module.exports = UserController
