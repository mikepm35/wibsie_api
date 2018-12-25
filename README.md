## Wibsie API

**Version control**
* 'dev' is dev branch, 'master' is prod branch

**Deploying**
* merge all changes in dev first, check stage in yaml file
* deploy using `sls deploy --stage dev`
* run tests against api
* checkout master, merge dev, check stage in yaml file
* deploy using `sls deploy --stage prod`
* run tests against api
