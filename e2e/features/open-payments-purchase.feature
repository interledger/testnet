Feature: Open Payments purchase via a Mock Open Payments Client App

  As a developer who made a recent change to the codebase
  I want a Mock Open Payments Client App running in the e2e test environment
  to be able to initiate, approve and verify an Open Payments workflow
  so that I can easily verify the consistency of the Open Payments features.

  Scenario: Mock Open Payments Client App makes a simple purchase
    Given an EUR merchant user with developer keys configured
    And an EUR customer user with 100 EUR deposited into their account
    And a running Mock Open Payments Client App initiated with the merchant keys
    When the customer initiates a payment of 9.99 EUR through the MOPCA
    Then the customer should be asked to verify the payment
    And the customer should be informed about the success of the payment
    When the merchant logs into their account and views transactions
    Then a recent incoming transaction of 9.99 EUR should be visible
