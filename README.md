# aws-lambda_aws-billing-notification-to-slack
AWS Lambda(Node.js)でAWSの利用金額をSlackに投げる（構成をTerraformで作る）

## 使い方
1. 事前準備
	* Local
		* node をインストール
		* terraform をインストール
	* AWS（請求レポートの設定）
		1. [S3 Management Console](https://console.aws.amazon.com/s3/home "https://console.aws.amazon.com/s3/home") で請求レポート用のS3 バケットを作成
		1. [Billing Management Console](https://console.aws.amazon.com/billing/home?#/preferences "https://console.aws.amazon.com/billing/home?#/preferences") の「請求レポートを受け取る」をONにして作成したS3 バケット名を入力
		1. アクセス権限を付与
			* 入力欄すぐ下の「ポリシー」の中身をコピー
			* S3 バケットのプロパティ→アクセス許可→バケットポリシーの編集に貼付け
		1. 「検証」→「有効なバケット」となればOK
1. lambda用scriptを作成
	1. `cd 01_create-script-file`
	1. `cp terraform.tfvars.sample terraform.tfvars`
	1. `terraform.tfvars` に設定を書き込む
		* [**必須**] `bucket' (請求レポートを保存する設定をしたS3 バケット名)
		* [**必須**] `slack_webhook_url`
		* [任意] `channel` (投稿先チャンネル名)
		* [任意] `username` (投稿表示名)
		* [任意] `icon_emoji` (アイコン)
	1. `terraform apply`
1. 作成されたscriptをzip
	1. `cd 02_zip-index.js`
	1. `index.js` ファイルをzip圧縮して `index.zip` にする
1. lamnda関数を作成
	1. `cd 03_create-lambda-function`
	1. `cp terraform.tfvars.sample terraform.tfvars`
	1. `terraform.tfvars` に設定を書き込む
		* aws_access_key
		* aws_secret_key
		* region (lambda関数を置く)
	1. `terraform apply`
