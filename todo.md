-   TransactionManager

    -   Add control to delete rows
    -   Add control to delete transaction items
    -   Set up history system

    -   fix this bug https://imgur.com/NO91QLm
    -   fix this https://i.imgur.com/sAXGkIZ.gif

-   Switch preferred column widths to localStorage instead of DB

-   TransactionManager
    -   Set up PendingChange system
    -   remove datasets
    -   STRESS TEST RESORTING (esp when scrollheight overflows)
    -   Add control to fold/unfold multi-rows
    -   Add control to resort multi-rows
    -   Make margins when resorting fit row size exactly ( + use linear transitions for less wobbling)
    -   Make Transaction resorting limited to the row
    -   Add control to resort rows
-   Phase out namespace type system- accounts
-   Create CategoryManager
-   Add undo/redo buttons in AccountManager
-   Add 'invisible' JButton style
-   add proper CTRL+Z system for tables
-   add global css variables for highlights
-   add global css variables for box-shadow colors in JForm items
-   **add error handling for AccountManager**
-   add inline math to JAccountingInput using math.js
-   Fix highlights for moving around items in AccountManager
-   Figure out a refactor system for AccountManager to isolate the code into smaller files
    -   Maybe make each resorter into a component?
        -   e.x. <Resorter sortIndex={} setSortOrder={} ...etc>
-   fix header cells overextending in AccountManager table when shrunk
