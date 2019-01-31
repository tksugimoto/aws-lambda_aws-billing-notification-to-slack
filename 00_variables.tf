# AWS APIキー変数設定
variable "aws_access_key" {}

variable "aws_secret_key" {}

# 名前のPrefix
variable "prefix" {}

# リージョン
variable "region" {}

# 請求レポートを保存しているバケット名
variable "bucket" {}

# Slack WebhookのURL
variable "slack_webhook_url" {}

# Slack 投稿先チャンネル
# format: "#channel-name"
# デフォルト（空文字）はWebhookのデフォルト値
variable "channel" {
  default = ""
}

# Slack 通知のユーザー表示
# デフォルト（空文字）はWebhookのデフォルト値
# 既知の問題: 半角スペース以降は無視
variable "username" {
  default = ""
}

# Slack 通知のアイコン
# format: ":icon_name:"
# デフォルト（空文字）はWebhookのデフォルト値
variable "icon_emoji" {
  default = ""
}
