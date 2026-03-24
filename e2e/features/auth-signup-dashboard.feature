Feature: Wallet authentication onboarding
  As a new wallet user
  I want to sign up, verify my email, complete KYC, and reach my default account
  So that I can access my wallet dashboard

  Scenario: New user completes signup, verification, login, KYC, and account access
    Given I am a new unique wallet user
    When I open the signup page
    And I complete the signup form
    And I submit signup
    Then I should see signup confirmation
    When I open the verification link from backend logs
    Then I should see verification success
    When I continue to login
    And I login with my new credentials
    And I complete KYC if I am redirected to KYC
    Then I should see the accounts dashboard
    When I open the EUR default account
    Then I should see the account balance page
