'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app
  const jwt = app.middleware.jwt({ app })

  router.get('/', controller.home.index)

  // 图片验证码
  router.get('/captcha', controller.util.captcha)
  // 邮箱验证码
  router.get('/sendcode', controller.util.sendcode)
  // 文件上传
  router.post('/uploadfile', controller.util.uploadfile)
  // 文件chunks合并
  router.post('/mergefile', controller.util.mergefile)
  // 检查该文件是否已存在
  router.post('/checkfile', controller.util.checkfile)

  router.group({ name: 'user', prefix: '/user' }, router => {
    const { info, register, login, verify } = controller.user

    router.post('/register', register)
    router.post('/login', login)
    router.get('/verify', verify)
    router.get('/info', jwt, info)
  })
}
