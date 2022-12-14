# API Testing
The main type of testing used for the API right now is End to End (E2E) testing, meaning I'm not testing
individual units of the application, instead I'm testing the API functionality itself via HTTP requests & responses.

These tests can be largely described like this:  
`Given the application is in a predefined state, When I make this API request, Then I should get this API response` 

This approach lets me test that the application **functionality itself** works as it should.  
Unit tests can then be used to test code paths that can't be reached with e2e tests easily and also to test isolated feature/services where appropriate.

## Test File Locations
Test files follow the pattern `<name>.e2e.test.ts` or `<name>.unit.test.ts` and should be added near the code
that they are testing rather than being seperated in the `tests` folder.  
The `tests` folder can then be used for common test functionality designed to be used throughout other feature tests.  

## Test Data
Test data is populated in `tests/test-data.ts` and this is used by most tests as the initial state of the application
database.

### Setup and Teardown
All E2E tests make use of the `TestHelper` class found in `projects/server/tests/e2e/test-helper.ts` which encapsulates creating an application to test, and exposes helper methods
for use in tests such as `beforeAll`, `beforeEach` and `afterAll`.

## E2E Test Guidelines
- Every test should be able to be run separately. In practice this means not relying on things like database content
outside of individual test setup/teardown functions.
- Tests should be written against public interfaces not internals where possible. This means that tests are more
resilient against refactors and internal changes.
