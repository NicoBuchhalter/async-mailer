const axios = require("axios");

const documentUrl = id =>
  `${process.env.WCH_URL}/api/${
    process.env.WCH_API_KEY
  }/delivery/v1/search?q=string1:${id}&fq=classification:(content)&fq=type:EmailTemplate&sort=lastModified%20desc`;

const templateUrl = id =>
  `${process.env.WCH_URL}/api/${
    process.env.WCH_API_KEY
  }/delivery/v1/content/${id}`;

const getTemplate = async templateId => {
  return axios
    .get(documentUrl(templateId))
    .then(documentResponse => {
      return axios
        .get(templateUrl(documentResponse.data.documents[0].id))
        .then(templateResponse => {
          return {
            url:
              process.env.WCH_URL + templateResponse.data.elements.template.url,
            subject: templateResponse.data.elements.asunto.value,
            variables: templateResponse.data.elements.variables.value.split(";")
          };
        });
    })
    .catch(err => {
      throw new Error(err);
    });
};

module.exports = {
  getTemplate
};
