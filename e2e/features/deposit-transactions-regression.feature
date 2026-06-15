Feature: Deposit transaction regressions
  As a wallet user
  I want deposits to create one transaction and a correct balance delta
  So that transaction history and balances stay consistent

  Scenario: Iframe deposit creates a single transaction row with matching balance delta
    Given I am a verified and logged-in wallet user
    When I open the EUR default account for deposit checks
    And I record the current account balance
    And I record the current transactions count
    And I complete a deposit of 11.00 EUR via the GateHub iframe
    And I open the transactions page for deposit checks
    Then the transaction count should increase by exactly 1
    When I wait 10 seconds and refresh transactions
    Then the transaction count should still increase by exactly 1
    And the latest transaction amount should match the deposit amount
    And the account balance increase should match the deposit amount

  Scenario: Local dialog deposit creates a single transaction row with matching balance delta
    Given I am a verified and logged-in wallet user
    When I open the EUR default account for deposit checks
    And I record the current account balance
    And I record the current transactions count
    And I complete a deposit of 11.00 EUR via the local dialog
    And I open the transactions page for deposit checks
    Then the transaction count should increase by exactly 1
    When I wait 10 seconds and refresh transactions
    Then the transaction count should still increase by exactly 1
    And the latest transaction amount should match the deposit amount
    And the account balance increase should match the deposit amount
