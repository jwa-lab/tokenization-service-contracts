# Changelog

## 0.1.0

-   Complete overhaul of the contracts. Warehouse and Inventory are now merged
    into one contract with 2 bigmaps. Instances don't live in a new contract but in a collocated bigmap.
    The goal was to reduce the cost of operation and the code's complexity.
-   Update cost estimation script
-   Upgrade to Taquito 10

## 0.0.14

-   Add missing type for transfer_item method

## 0.0.13

-   Fix npm package entrypoint

## 0.0.12

-   Add transfer_item entrypoint to inventory

## 0.0.11

-   No changes in the contracts
-   Removed truffle for testing and deploying
-   Remove migrations scripts and contract
-   Upgrade to Florence
-   Add scripts to estimate cost of standard operations
