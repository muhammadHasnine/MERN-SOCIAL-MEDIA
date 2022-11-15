const nodeMailer = require('nodemailer');
exports.sendEmail = async(Options)=>{
    const transporter = nodeMailer.createTransport({
        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        auth: {
          user: process.env.SMPT_MAIL,
          pass: process.env.SMPT_PASSWORD,
        },
    })
    const mailOptions = {
        from:process.env.SMPT_MAIL,
        to:Options.email,
        subject:Options.subject,
        text:Options.message
    }
    await transporter.sendMail(mailOptions)
}