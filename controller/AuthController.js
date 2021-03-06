const customerModel = require('../model/Customer')
const helper = require('../helper');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { transporter } = require('../services/nodemailer')

class AuthController {

    getRegister (req, res) {
        let user = ''
        if (req.user) {
            return res.redirect('back')
        } 
        res.render('pages/register', {
            user,
            helper
        })
    }

    async postRegister (req, res) {
        const { email, name, password } = req.body
        
        const customer = await customerModel.findByEmail(email)
        
        if (customer) {
            return res.json({
                status: 'error',
            })
        } else {
            
            try {
                const hashPassword = await bcrypt.hash(password, 10)
                const customerId = helper.randomString(10)
             
                const result = await customerModel.create({
                    customerId,
                    email,
                    name,
                    hashPassword
                })
                
                res.status(201).json({
                    status: 'success'     
                })

            } catch (error) {
                res.json({
                    status: 'error',
                    message: error
                })
            }

        }
    }

    getLogin (req, res) {
        let user = ''
        if (req.user) {
            return res.redirect('back')
        } 
        res.render('pages/login', {
            user,
            helper,
            success: req.flash('success'),
            error: req.flash('error')
        })
    }

    async postLogin (req, res) {
        try {
            const { email, password } = req.body

            const customer = await customerModel.findByEmail(email)
            
            if (customer) {
                const customerId = customer['customer_id']
                const passwordInDatabase = customer['password']
                const checkPassword = await bcrypt.compare(password, passwordInDatabase)

                if (checkPassword) {
                    const accessToken = jwt.sign({ userId: customerId }, process.env.JWT_SECRET, { expiresIn: '1h' })
                    res.cookie("token", accessToken, {
                        httpOnly: true,
                        maxAge: 1000 * 60 * 60,
                    });
                    return res.json({
                        status: 'success'
                    })
                } else {
                    return res.json({
                        status: 'error',
                        message: 'T??i kho???n ho???c m???t kh???u kh??ng ????ng!'
                    })   
                }
            } else {
                return res.json({
                    status: 'error',
                    message: 'T??i kho???n ho???c m???t kh???u kh??ng ????ng!'
                })  
            }
            
        } catch (error) {
            res.json({
                status: 'error',
                message: error
            })
        }
      
       
    }

    getForgotPassword (req, res) {
        let user = ''
        if (req.user) {
            return res.redirect('back')
        } 
        res.render('pages/forgot-password', {
            user,
            helper,
            success: req.flash('success'),
            error: req.flash('error')
        })
    }

    async handleForgotPassword(req, res) {

        try {
            const { email } = req.body

            const customer = await customerModel.findByEmail(email)
            
            if (customer) {
                const customerId = customer['customer_id']
                const code =  helper.randomString(50)

                const result = await customerModel.updateCodeToResetPassword({
                    code: code,
                    customerId: customerId
                })

                const  { error } = result

                if (!error) {

                    const link = `${process.env.URL_SERVER}/auth/reset-password/${code}`

                    const resultSendMail = await transporter.sendMail({
                        from: '"NHANLAPTOP" <project.php.nhncomputer@gmail.com>',
                        to: email,
                        subject: `[NHANLAPTOP] H??y ?????t l???i m???t kh???u t??i kho???n c???a b???n`,
                        html: ` <h2>Xin ch??o b???n ${customer.full_name},</h2>
                                <p>Ch??ng t??i bi???t r???ng b???n ???? m???t m???t kh???u NHANLAPTOP c???a m??nh.</p>
                                <p>
                                    Nh??ng ?????ng lo l???ng, b???n c?? th??? truy c???p link sau ????? ?????t l???i m???t kh???u c???a m??nh:
                                </p>
                                <a href="${link}"><h3>?????t l???i m???t kh???u</h3></a>
                                <p>Tr??n tr???ng,</p>
                                <p><b>NHANLAPTOP</b></p>`
                    })

                    req.flash('success', `H??y ki???m tra email ????? nh???n ???????c link ?????t l???i m???t kh???u.
                                            C?? th??? m???t m???t v??i ph??t, ki???m tra c??? trong th?? m???c spam`)
                    return res.redirect('back') 

                }


            } else {
                req.flash('error', 'T??i kho???n kh??ng t???n t???i!')
                return res.redirect('back') 
            }
            
        } catch (error) {
            console.log('err', error)
            req.flash('error', 'C?? l???i x???y ra!')
            return res.redirect('back') 
        }

    }

    getResetPassword (req, res) {
        let user = ''
        if (req.user) {
            return res.redirect('back')
        } 
        const { code } = req.params

        res.render('pages/reset-password', {
            user,
            helper,
            code,
            success: req.flash('success'),
            error: req.flash('error')
        })
    }


    logout(req, res) {
        const token = req.cookies.token

        if (token) {
            res.clearCookie('token')
            return res.redirect('/auth/login')
        }
        return res.redirect('/auth/login')
    }

    
   
}

module.exports = new AuthController;


