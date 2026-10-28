const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/order");

let salt_key = process.env.SALT_KEY
let merchant_id = process.env.MERCHANT_ID

exports.createPhonePeOrder = async (data) => {
    console.log("Order Request:", data);
    // replace http://localhost:8000 with  https://foodapp-backend-si51.onrender.com

    // replace http://localhost:5173/ with https://foodportdelivery.netlify.app

    const merchantTransactionId = data.transactionId;
    const existingOrder =
        await Order.findOne({
            transactionId: merchantTransactionId,
        });

    if (!existingOrder) {
        await Order.create({
            userId: data.userId,
            transactionId: merchantTransactionId,
            customerName: data.name,
            customerPhone: data.number,
            amount: data.amount,
            orderItems: data.orderItems,
            orderAddress: data.address,
            paymentStatus: "PENDING",
            orderStatus: "PENDING",
        });
    }
    const obj = {
        merchantId: merchant_id,
        merchantTransactionId: merchantTransactionId,
        name: data.name,
        amount: data.amount * 100,
        redirectUrl: `https://foodapp-backend-si51.onrender.com/api/payment/status/?id=${merchantTransactionId}`,
        redirectMode: 'POST',
        callbackUrl: `https://foodapp-backend-si51.onrender.com/api/payment/status/?id=${merchantTransactionId}`,
        mobileNumber: data.number,
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };
    const payload = JSON.stringify(obj);
    const payloadMain = Buffer.from(payload).toString('base64');
    const keyIndex = 1;
    const string = payloadMain + '/pg/v1/pay' + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    // const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
    const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"

    const options = {
        method: 'POST',
        url: prod_URL,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum
        },
        data: {
            request: payloadMain
        }
    };
    const response = await axios.request(options);

    return response.data;
}

exports.verifyPayment = async (req, res) => {
    const merchantTransactionId = req.query.id
    const merchantId = merchant_id

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + "###" + keyIndex;

    const options = {
        method: 'GET',
        url: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`,
        headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'X-MERCHANT-ID': `${merchantId}`
        }
    };

    // CHECK PAYMENT STATUS
    const response = await axios.request(options);

    if (response.data.success === true) {
        console.log("payment completed", response.data);
        await Order.findOneAndUpdate(
            {
                transactionId: merchantTransactionId,
            },
            {
                paymentStatus: "SUCCESS",
                orderStatus: "PLACED",
                phonePeTransactionId:
                    response.data.data.transactionId,

                paymentResponse: response.data,
            }
        );
        res.cookie("orderData", JSON.stringify(response.data), {
            httpOnly: false,      // allow frontend JS access
            secure: false,        // true only in HTTPS production
            sameSite: "lax"
        });

        const orderId = response.data.data.transactionId;
        // const orderId = "12345";
        console.log("orderIDs", orderId);

        const url = `https://foodportdelivery.netlify.app/ordersummary?orderId=${orderId}`
        return res.redirect(url)
    } else {
        await Order.findOneAndUpdate(
            { transactionId: merchantTransactionId },
            {
                paymentStatus: "FAILED",
                orderStatus: "FAILED",
            }
        );
        const url = `https://foodportdelivery.netlify.app/failure`
        return res.redirect(url)
    }

}