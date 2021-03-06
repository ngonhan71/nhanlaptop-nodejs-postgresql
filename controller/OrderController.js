const {queryDatabase} = require('../model/database');
const orderModel = require('../model/Order')
const helper = require('../helper');
const { transporter } = require('../services/nodemailer')

class OrderController {

    async getRevenueForChart(req, res) {
        try {
            const data = await orderModel.getRevenueLifeTime()
            
            res.json({
                status: 'success',
                data
            })

        } catch (error) {
            res.json({
                status: 'error',
                error
            })
        }
    }

    async getBestSellerForChart(req, res) {
        try {
            const { limit } = req.query
            const data = await orderModel.findBestSellerProduct({limit: limit})
            
            res.json({
                status: 'success',
                data
            })

        } catch (error) {
            res.json({
                status: 'error',
                error
            })
        }
    }

    async getOrderForChart(req, res) {
        try {
            
            let sql = `select count(*) as count, DATE(created_at) as date from tblorder 
                        GROUP by DATE(created_at)
                        ORDER BY DATE(created_at)`
            let data = await queryDatabase(sql)
            
            res.json({
                status: 'success',
                data
            })

        } catch (error) {
            res.json({
                status: 'error',
                error
            })
        }
    }

    async getOrder(req, res) {
        try {
            
            let user = ''
            if (req.user) {
                user = req.user
            } 

            let data = await orderModel.getAll()
            
            res.json({
                status: 'success',
                length: data.length,
                data
            })

        } catch (error) {
            res.json({
                status: 'error',
                error
            })
        }
    }

    async getOrderById(req, res) {
        try {
            
            const user = req.user

            const { id } = req.params

            let data = []
            if (user.role < 1) {
                
                data = await orderModel.findByIdAndCustomerId({
                    id: id,
                    customerId: user.userId
                })
                
            } else {
                data = await orderModel.findById(id)
            }
            
            res.json({
                status: 'success',
                data,
                totalCart: data[0]['total_order'],
                statusCart: data[0]['status']
            })

        } catch (error) {
            res.json({
                status: 'error',
                error
            })
        }
    }

    async createOrder(req, res) {
        try {
            
            let user = ''
            if (req.user) {
                user = req.user
            } 

            const userId = user.userId

            const { fullName, phoneNumber, email, fullAddress, total, payMethod, cart } = req.body
            
            const orderId = helper.randomString(10)

            const result = await orderModel.create({
                orderId, userId, fullName, phoneNumber, email, fullAddress, total, payMethod, cart
            })

            const htmlProducts = JSON.parse(cart).map(product => {
                const totalItem = product.quantity * product.productPrice
                return `<div style="font-size: 16px">
                            <img style="width: 200px;" src="${product.productThumbnail}" alt="" />
                            <p>T??n s???n ph???m: ${product.productName}</p>
                            <p>S??? l?????ng: ${product.quantity}</p>
                            <p>Th??nh ti???n: ${totalItem}</p>
                        </div>`
            })

            const resultSendMail = await transporter.sendMail({
                from: '"NHAN LAPTOP" <project.php.nhncomputer@gmail.com>',
                to: email,
                subject: `[NHAN LAPTOP] ???? nh???n ????n h??ng ${orderId}`,
                html: ` <h3>Xin ch??o ${fullName},</h3>
                        <h3>C???m ??n b???n ???? ?????t h??ng t???i NHAN LAPTOP</h3>
                        <h3>????n h??ng ???????c giao ?????n:</h3>
                        <p>H??? v?? t??n: ${fullName}</p>
                        <p>?????a ch???: ${fullAddress}</p>
                        <p>??i???n tho???i: ${phoneNumber}</p>
                        <p>Email: ${email}</p>
                        <h2>Ki???n h??ng</h2>
                        <div>${htmlProducts}</div>
                        <h2> T???ng gi?? tr??? ????n h??ng: ${helper.formatPrice(total)} VN??</h2>
                        <p>Tr??n tr???ng,</p>
                        <p><b>NHAN LAPTOP</b></p>`
            })

            console.log(resultSendMail)
            
            res.json({
                status: 'success',
                result
            })

        } catch (error) {
            res.json({
                status: 'error',
                error
            })
        }
    }

    async updateStatusOrder(req, res) {
        try {
            
            const { id } = req.params

            const { status } = req.body

            const result = await orderModel.updateStatus({
                id,
                status
            })

            res.json({
                status: 'success',
                message: 'Thay ?????i th??nh c??ng!'
            })

        } catch (error) {
            res.json({
                status: 'error',
                error
            })
        }
    }

   
}

module.exports = new OrderController;


