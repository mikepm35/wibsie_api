## Wibsie API

Wibsie is an application that uses machine learning to predict comfort levels.  This API provides foundational data management for users, experiences, locations, and weatherreports.

API is deployed using Serverless to AWS Services: Lambda, API Gateway, and DynamoDB


**Version control**
* 'dev' is dev branch, 'master' is prod branch

**Deploying**
* merge all changes in dev first, check stage in yaml file
* deploy using `sls deploy --stage dev`
* run tests against api
* checkout master, merge dev, check stage in yaml file
* deploy using `sls deploy --stage prod`
* run tests against api
