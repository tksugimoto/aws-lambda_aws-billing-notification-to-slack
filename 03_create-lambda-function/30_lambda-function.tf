data "archive_file" "source_code" {
  type        = "zip"
  source_file = "../02_zip-index.js/index.js"
  output_path = "../02_zip-index.js/index.zip"
}

resource "aws_lambda_function" "notification" {
	depends_on = ["null_resource.wait_ready_role"]
	function_name = "${var.prefix}"
	role = "${aws_iam_role.iam_for_lambda.arn}"
	runtime = "nodejs4.3"
	handler = "index.handler"
	timeout = 10
	filename = "../02_zip-index.js/index.zip"
	source_code_hash = "${data.archive_file.source_code.output_base64sha256}"
    environment {
        variables = {
            bucket            = "${var.bucket}"
            slack_webhook_url = "${var.slack_webhook_url}"
            channel           = "${var.channel}"
            username          = "${var.username}"
            icon_emoji        = "${var.icon_emoji}"
        }
    }
}

# sleep入れないとなぜかエラーになるため（おまじない）
/*
aws_lambda_function.notification: Still creating... (10s elapsed)
aws_lambda_function.notification: Still creating... (20s elapsed)
aws_lambda_function.notification: Still creating... (30s elapsed)
aws_lambda_function.notification: Still creating... (40s elapsed)
aws_lambda_function.notification: Still creating... (50s elapsed)
Error applying plan:

1 error(s) occurred:

* aws_lambda_function.notification: Error creating Lambda function: InvalidParameterValueExcept ion: The role defined for the function cannot be assumed by Lambda.
        status code: 400, request id: ********-****-****-****-************

*/
resource "null_resource" "wait_ready_role" {
	depends_on = [
		"aws_iam_role_policy.aws_lambda_basic_execution",
		"aws_iam_role_policy.amazon_s3_read_only_access"
	]
	provisioner "local-exec" {
		command = "sleep 10"
	}
}
