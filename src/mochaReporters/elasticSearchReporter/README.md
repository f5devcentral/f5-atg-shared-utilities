# Install
```
npm install @f5devcentral/atg-shared-utilities
```

# Usage
+ Define at least the required environment variables
    + ESR_ELASTIC_SEARCH_HOST
    + ESR_PRODUCT
    + ESR_TEST_TYPE
+ Define any optional environment variables. See the elasticSearchReporter class comments for full details.
+ Specify this as the reporter when calling mocha
```
mocha --reporter atg-shared-utilities/src/mochaReporters/elasticSearchReporter/elasticSearchReporter.js <path_to_tests>
```

# Example for calling from Gitlab CI/CD
```
integration_test:
    script:
        - export ESR_ELASTIC_SEARCH_HOST=<ip_address:port of elastic search host>
        - export ESR_PRODUCT=my_product
        - export ESR_TEST_TYPE=integration
        - export ESR_TEST_RUN_ID=${CI_JOB_ID}
        - export ESR_TEST_RUN_WEB_URL=${CI_JOB_URL}
        - export ESR_BIG_IP_VERSION=15.1.0
        - export ESR_PRODUCT_VERSION=$(node -e "console.log(require('./package.json').version)" | cut -d '-' -f1)
        - mocha --reporter atg-shared-utilities/src/mochaReporters/elasticSearchReporter/elasticSearchReporter.js test
```