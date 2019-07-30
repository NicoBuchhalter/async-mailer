const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const axios = require("axios");
const { getEmail, updateEmail } = require("./DBService");
const { getTemplate } = require("./WCHService");
const moment = require("moment");

const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const mailOptions = (to, subject, html) => ({
  from: process.env.SMTP_FROM,
  to,
  subject,
  html
});

const readHTMLFile = async (url, variables) => {
  return axios
    .get(url)
    .then(resp => {
      return handlebars.compile(resp.data)(variables);
    })
    .catch(err => {
      throw new Error(err);
    });
};

const equalArrays = (arr1, arr2) => {
  return JSON.stringify(arr1.sort()) === JSON.stringify(arr2.sort());
};

const sendEmail = async id => {
  const emailData = await getEmail(id);
  const template = await getTemplate(emailData.templateId);

  if (!equalArrays(Object.keys(emailData.variables), template.variables)) {
    console.log("Didnt send email. Missing variables");
    updateEmail(id, {
      sent: false,
      sentAt: moment().format(),
      error: "Missing variables",
      sentTimes: (emailData.sentTimes || 0) + 1
    });
    return (emailData.sentTimes || 0) < 4 ? false : true;
  } else {
    const html = await readHTMLFile(template.url, emailData.variables);
    const options = mailOptions(emailData.to, template.subject, html);
    return smtpTransport
      .sendMail(options)
      .then(resp => {
        console.log("Email correctly sent to " + emailData.to);
        updateEmail(id, {
          sent: true,
          sentAt: moment().format(),
          sentTimes: (emailData.sentTimes || 0) + 1
        });
        return true;
      })
      .catch(error => {
        console.log("Didnt send email. SMTP error");
        updateEmail(id, {
          sent: false,
          sentAt: moment().format(),
          error: "Failed trying to send email",
          sentTimes: (emailData.sentTimes || 0) + 1
        });
        return (emailData.sentTimes || 0) < 4 ? false : true;
      });
  }
};

module.exports = {
  sendEmail
};
