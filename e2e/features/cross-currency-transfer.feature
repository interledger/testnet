# Skipped while the wallet backend is part-way through the move from Rafiki v1
# to Rhyza (Rafiki v2).
#
# Since #2250, wallet addresses are created through the Rhyza admin API
# (rhyzaAdminClient.createWalletAddress). Quotes, receivers, and incoming and
# outgoing payments still go through Rafiki v1 GraphQL. No local stack runs
# both: `pnpm local:setup` (used by the E2E workflow) starts Rafiki v1 only,
# and `pnpm local:up:rhyza` replaces Rafiki v1 with Rhyza. So the default EUR
# wallet address is never created, and both scenarios fail before a payment
# is made.
#
# Remove the @skip tag when the payment flow also runs on Rhyza and the E2E
# workflow starts the Rhyza stack.
@skip
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

  Scenario: User can send a cross-currency payment
    Given I am a verified and logged-in wallet user
    And I have a source wallet address configured backed by a EUR account
    And I've deposited 100.00 EUR into my EUR account
    And I have a second wallet address configured backed by a USD account
    
    When I navigate to the send page
    And I select the EUR source account by wallet address
    And I select the USD destination account by wallet address
    And I enter a payment amount of 10.00 EUR
    And I submit the payment
    Then I should see a confirmation page with the payment details
    Then I should see a success message indicating the payment was sent
    When I navigate to the transactions page of my EUR account
    Then I should see a new transaction with a debit of 10.00 EUR
    When I navigate to the transactions page of my USD account
    Then I should see a new transaction with a credit of the equivalent USD amount