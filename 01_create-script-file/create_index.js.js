const argv = process.argv.slice(2);
const template_values = {};
argv.forEach(arg => {
	if (arg.match(/^([^=]+)=(.*)$/)) {
		const key =RegExp.$1;
		const value =RegExp.$2;
		template_values[key] = value;
	}
});

const template_keys = [
	"bucket",
	"slack_webhook_url",
	"channel",
	"username",
	"icon_emoji"
];

const fs = require("fs");
const template_file_name = "./templates/lambda_billing-report-to-slack-using-https.js";
fs.readFile(template_file_name, "utf8", (err, template) => {
	if (!err) {
		const script = template_keys.reduce((text, key) => {
			return text.replace(`%${key}%`, template_values[key] || "");
		}, template);

		fs.writeFile("../02_zip-index.js/index.js", script);
	}
});
