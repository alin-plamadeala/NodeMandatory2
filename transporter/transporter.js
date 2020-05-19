const nodemailer = require("nodemailer");
require("dotenv").config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

module.exports.resetPassword = function (link, email) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Password reset",
    html: `You have requested a password reset<br>
     If you want to reset the password, follow the instructions on this link
     <br>${link}<br>
    <br>
    If you did not request a password reset, just ignore this message.
        `,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};
