Feature: User Login API

  Scenario: Successful login with valid credentials
    Given the user has the following credentials
      | username  | password  |
      | validUser | validPass |
    When the user sends a POST request to  with the credentials and OTP not enabled
    And the response should contain a valid JWT token
    And Also response should contain refresh token

  Scenario: Unsuccessful login with invalid credentials
    Given the user has the following credentials
      | username    | password    |
      | invalidUser | invalidPass |
    When the user sends a POST request to  with the credentials
    And the response should contain an error message "Invalid credentials"

  Scenario: Successful login with valid credential and OTP enabled
    Given the user has the following credentials
      | username  | password  |
      | validUser | validPass |
    When the user sends a POST request to  with the credentials and OTP enabled
    And Also response should contain twoFA flag as true

  Scenario: Successful login with OTP
    Given the user has the following credentials
      | OTP       |
      | valid OTP |
    When WHen provided OTP is valid
    And the response should contain a valid JWT token
    And Also response should contain refresh token

  Scenario: Account lock after four unsuccessful login attempts
    Given the user has the following credentials
      | username | password  |
      | testUser | wrongPass |
    When the user sends a POST request with the credentials four times
    Then the response should contain an error message "Account locked for 30 minutes"

  Scenario: Successful login creates session and tracks user IP
    Given the user has the following credentials
      | username  | password  |
      | validUser | validPass |
    When the user sends a POST request with the credentials
    Then the response should contain a token and refreshToken
    And a session should be created with the user's IP address
    And the user's failed login attempt count should be reset to 0