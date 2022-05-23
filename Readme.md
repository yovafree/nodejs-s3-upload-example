# Example: Upload files to S3 from NodeJS

Instructions:

1. Restore packages:

	```shell
	npm i
	```
2. Rename the .env.example file and configure it with your AWS credentials.

3.  Start the project

	```shell
	npm start
	```

4. You can use Swagger to run a test. You will need to go to the address: http://localhost:3000/documentation

5. Making a call to the Endpoint http://localhost:3000/generate will execute the creation of an excel file, upload it to S3 and generate a temporary download link (in console).