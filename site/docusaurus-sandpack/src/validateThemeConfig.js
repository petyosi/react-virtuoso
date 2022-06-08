const { Joi } = require('@docusaurus/utils-validation')

const Schema = Joi.object({
  sandpack: Joi.object({
    theme: Joi.any(),
  }).label('themeConfig.sandpack'),
})
exports.Schema = Schema

exports.validateThemeConfig = function ({ validate, themeConfig }) {
  console.log(themeConfig)
  return validate(Schema, themeConfig)
}
