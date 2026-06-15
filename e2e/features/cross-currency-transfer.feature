Feature: Cross-currency payment transfers
  As a wallet user
  I want to send payments between accounts in different currencies
  So that I can transfer value across currency boundaries

  Scenario: User can navigate to send page and select accounts
    Given I am a verified and logged-in wallet user
    When I navigate to the send page
    And I select a source account
    Then I should see the wallet address selector
    When I select a wallet address
    Then I should see the recipient address input field
