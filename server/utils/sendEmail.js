import nodemailer from 'nodemailer';

//async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function(email,subject,message){
    //create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host : process.env.SMTP_HOST,
        port : process.env.SMTP_PORT,
        secure : false, // true for 465, false for other ports
        auth : {
            user : process.env.SMTP_USERNAME,
            pass : process.env.SMTP_PASSWORD,  
        },
    });

    // Send mail with defined transport object 
    await transporter.sendMail({
        from : process.env.SMTP_FORM_MAIL, //sender Address
        to: email, //user email
        subject: subject, 
        html: message
    });
};

export {sendEmail}