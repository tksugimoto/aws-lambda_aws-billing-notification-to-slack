
resource "aws_s3_bucket_notification" "bucket_notification" {
	bucket = "${var.bucket}"

	lambda_function {
		lambda_function_arn = "${aws_lambda_function.notification.arn}"
		events = ["s3:ObjectCreated:*"]
		filter_suffix = ".csv"
	}
}

resource "aws_lambda_permission" "allow_s3_to_call_notification" {
	statement_id = "AllowExecutionFromS3Bucket"
	action = "lambda:InvokeFunction"
	function_name = "${aws_lambda_function.notification.function_name}"
	principal = "s3.amazonaws.com"
	source_arn = "arn:aws:s3:::${var.bucket}"
}
