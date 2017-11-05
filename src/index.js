const https = require("https");
const AWS = require("aws-sdk");

/**** 設定ここから ****/
const bucket = process.env.bucket;
const slack_webhook_url = process.env.slack_webhook_url;
const channel = process.env.channel || "";
const username = process.env.username || "";
const icon_emoji = process.env.icon_emoji || "";
/**** 設定ここまで ****/

const sts = new AWS.STS();
const s3 = new AWS.S3();

exports.handler = () => {
	Promise.resolve()
	.then(getAccountId)
	.then(getLatestBillingCsvKey)
	.then(getBillingData)
	.then(postToSlack);
};

function getAccountId() {
	return new Promise(resolve => {
		console.log("============= getCallerIdentity =============");
		const startTime = Date.now();
		sts.getCallerIdentity((err, data) => {
			console.log(Date.now() - startTime);
			if (err) {
				console.log(err, err.stack);
			} else {
				const accountId = data.Account;
				console.log(JSON.stringify(data, "", "    "));
				resolve(accountId);
			}
		});
	});
}

function getLatestBillingCsvKey(accountId) {
	return new Promise(resolve => {
		console.log("============= listObjectsV2 =============");
		const params = {
			Bucket: bucket,
		};
		if (accountId) {
			params.Prefix = `${accountId}-aws-billing-csv-`;
			const today = new Date();
			const year = today.getFullYear();
			const month = today.getMonth();
			// 去年の前月から取得する
			//   ※ month: 1月 == 0
			//   ※ 同じ年にすると1月になったばかりはレポートが作成されて無い場合がある（？）
			params.StartAfter = `${accountId}-aws-billing-csv-${year - 1}-${month}`;
		}
		const startTime = Date.now();
		s3.listObjectsV2(params, (err, data) => {
			console.log(Date.now() - startTime);
			if (err) {
				console.log(`[${err.code}] ${err.message}`);
				console.log(JSON.stringify(err, "", "    "));
				// console.log(err, err.stack);
			} else {
				console.log(`KeyCount: ${data.KeyCount}`);
				data.Contents.filter(content => {
					return content.Key.includes("-aws-billing-csv-");
				}).slice(-1).forEach(content => {
					console.log(content);
					resolve(content.Key);
				});
			}
		});
	});
}

function getBillingData(billingCsvKey) {
	return new Promise(resolve => {
		console.log("============= getObject =============");
		const params = {
			Bucket: bucket,
			Key: billingCsvKey,
		};
		const startTime = Date.now();
		s3.getObject(params, (err, data) => {
			console.log(Date.now() - startTime);
			if (err) {
				console.log(`[${err.code}] ${err.message}`);
				console.log(JSON.stringify(err, "", "    "));
				// console.log(err, err.stack);
			} else {
				const csv = data.Body.toString();
				delete data.Body;
				console.log(JSON.stringify(data, "", "    "));
				console.log("============= Body =============");
				const matrix = csv.split("\n").filter(s => s.length).map(line => {
					// 最初と最後の「"」を削除
					// TODO: 「"」のエスケープに対応
					return line.slice(1, -1).split('","');
				});

				const ColIndex = [
					0,	// Row name
					-3,	// InvoiceTotal
					-2,	// StatementTotal
				];
				const RowIndex = [
					3, // RecordType
					28, // TotalCost
				];
				const text = matrix.filter((_, index, matrix) => {
					return ColIndex.some(i => {
						return (index - i) % matrix.length === 0;
					});
				}).map(row => {
					return RowIndex.map(i => {
						return row[i];
					}).join(", ");
				}).join("\n");

				const lastModified = new Date(data.LastModified);
				const lastModifiedText = `lastModified: ${lastModified.toLocaleString()}`;
				resolve(lastModifiedText + "\n" + text);
			}
		});
	});
}

function postToSlack(text) {
	if (slack_webhook_url.match(/^https:[/][/]([^/]+)(.*)$/)) {
		const host = RegExp.$1;
		const path = RegExp.$2;
		const options = {
			host,
			path,
			method: "POST",
		};
		const req = https.request(options, res => {
			res.on("data", chunk => {
				const statusCode = res.statusCode;
				const result = statusCode === 200 ? "OK" : `NG(${statusCode})`;
				console.log(`[${result}] ${chunk.toString()}`);
			}).on('error', e => {
				console.log("ERROR:" + e.stack);
			});
		});

		const body = JSON.stringify({
			channel,
			username,
			icon_emoji,
			text,
		});

		req.write(body);

		req.end();
	}
}
