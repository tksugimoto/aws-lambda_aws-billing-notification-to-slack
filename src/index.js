const {
    parse: parseUrl,
} = require('url');
const https = require('https');
const AWS = require('aws-sdk');

/**** 設定ここから ****/
const bucket = process.env.bucket;
const slackWebhookUrl = process.env.slack_webhook_url;
const channel = process.env.channel || '';
const username = process.env.username || '';
const iconEmoji = process.env.icon_emoji || '';
/**** 設定ここまで ****/

const sts = new AWS.STS();
const s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
	Promise.resolve()
	.then(getAccountId)
	.then(getLatestBillingCsvKey)
	.then(getBillingData)
	.then(postToSlack)
	.catch(callback);
};

function getAccountId() {
	console.log('============= getCallerIdentity =============');
	return sts.getCallerIdentity().promise().then(data => {
		const accountId = data.Account;
		console.log(`accountId: ${accountId}`);
		return accountId;
	});
}

function getLatestBillingCsvKey(accountId) {
	console.log('============= listObjectsV2 =============');
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
	return s3.listObjectsV2(params).promise().then(data => {
		console.log(`KeyCount: ${data.KeyCount}`);
		const latestBillingCsv = data.Contents.filter(content => {
			return content.Key.includes('-aws-billing-csv-');
		}).slice(-1)[0];
		console.log(`latestBillingCsv: ${latestBillingCsv.Key}`);
		return latestBillingCsv.Key;
	});
}

function getBillingData(billingCsvKey) {
	console.log('============= getObject =============');
	const params = {
		Bucket: bucket,
		Key: billingCsvKey,
	};
	return s3.getObject(params).promise().then(data => {
		const csv = data.Body.toString();
		console.log(`ContentLength: ${data.ContentLength}`);
		console.log(`LastModified: ${data.LastModified}`);
		console.log('============= Body =============');
		const matrix = csv.split('\n').filter(s => s.length).map(line => {
			// 最初と最後の「'」を削除
			// TODO: 「'」のエスケープに対応
			return line.slice(1, -1).split('","');
		});

		const ColIndex = [
			0,	// Row name
			-3,	// InvoiceTotal
			-2,	// StatementTotal
		].map(n => n < 0 ? n + matrix.length : n);

		const RowIndex = [
			3, // RecordType
			28, // TotalCost
		];
		const text = matrix.filter((_, index) => {
			return ColIndex.includes(index);
		}).map(row => {
			return RowIndex.map(i => {
				return row[i];
			}).join(', ');
		}).join('\n');

		const lastModified = new Date(data.LastModified);
		const lastModifiedText = `lastModified: ${lastModified.toLocaleString()}`;
		return lastModifiedText + '\n' + text;
	});
}

function postToSlack(text) {
	const options = parseUrl(slackWebhookUrl);
	options.method = 'POST';

	const body = JSON.stringify({
		channel,
		username,
		icon_emoji: iconEmoji,
		text,
	});

	return new Promise((resolve, reject) => {
		https.request(options, res => {
			res.on('data', chunk => {
				const statusCode = res.statusCode;
				const result = statusCode === 200 ? 'OK' : `NG(${statusCode})`;
				console.log(`[${result}] ${chunk.toString()}`);
			})
			.on('error', reject)
			.on('end', resolve);
		})
		.on('error', reject)
		.end(body);
	});
}
