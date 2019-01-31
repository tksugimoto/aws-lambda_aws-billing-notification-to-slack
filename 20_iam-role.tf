resource "aws_iam_role" "iam_for_lambda" {
  name               = "${var.prefix}-iam_for_lambda"
  assume_role_policy = "${file("./iam-role/assume_role_policy/trust_lambda.json")}"
}

resource "aws_iam_role_policy_attachment" "aws_lambda_basic_execution_attach" {
  role       = "${aws_iam_role.iam_for_lambda.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "amazon_s3_read_only_access_attach" {
  role       = "${aws_iam_role.iam_for_lambda.name}"
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}
