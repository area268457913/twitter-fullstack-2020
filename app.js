const express = require('express')
const handlebars = require('express-handlebars')
const helpers = require('./_helpers');

const app = express()
const port = 3000
const db = require('./models')
const User = db.User
const bcrypt = require('bcryptjs')
const flash = require('connect-flash')
const session = require('express-session')
app.use(express.urlencoded({ extended: true }))
app.engine('handlebars', handlebars()) // Handlebars 註冊樣板引擎
app.set('view engine', 'handlebars') // 設定使用 Handlebars 做為樣板引擎
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }))
app.use(flash())
const passport = require('./config/passport')
app.use(passport.initialize())
app.use(passport.session())

// 把 req.flash 放到 res.locals 裡面
app.use((req, res, next) => {
    res.locals.success_messages = req.flash('success_messages')
    res.locals.error_messages = req.flash('error_messages')
    res.locals.user = req.user
    next()
})

// 前台認證 middleware
const authenticated = (req, res, next) => {
    console.log('authenticated 測試')
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/signin')
}

// 後台認證 middleware
const authenticatedAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.isAdmin) { return next() }
        return res.redirect('/')
    }
    res.redirect('/signin')
}




app.get('/', authenticated, (req, res) => {
    res.render('main', {})
})


// 前台登入
app.get('/signin', (req, res) => {
    res.render('signin', {})
})

// 登入認證
app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/')
})


// 個人帳戶設定
app.get('/setting', authenticated, (req, res) => {
    res.render('setting', {})
})

// 註冊 get
app.get('/signup', (req, res) => {
    res.render('signup', {})
})

// 註冊 post
app.post('/signup', (req, res) => {
    // confirm password
    if (req.body.passwordCheck !== req.body.password) {
        req.flash('error_messages', '兩次密碼輸入不同！')
        return res.redirect('/signup')
    } else {
        User.findOne({ where: { email: req.body.email } }).then(user => {
            if (user) {
                req.flash('error_messages', '信箱重複！')
                return res.redirect('/signup')
            } else {
                User.create({
                    name: req.body.name,
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
                }).then(user => {
                    req.flash('success_messages', '成功註冊帳號！')
                    return res.redirect('/signin')
                })
            }
        })
    }
})

// 登出
app.get('/logout', (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
})

// 後台 ================================================================================================ //

app.get('/admin/signin', (req, res) => {
    res.render('admin/signin', {})
})

app.get('', (req, res) => {

})






app.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = app
