## Unsolved

### Needed before beta

-   Transaction form isn't auto-refreshing on exit

### Can wait

-   Switch SortOrder to use arrays for all items [transaction_id, item_id ...]
-   Switch "create new transaction" button to add row to grid
-   When saving changes and a transaction's date changes, it should be added at the top of the list for that date.
    This will require some sortOrder magic and querying when saving.
-   Clean up JGrid system to support percentages better
-   Add better category/account management systems
-   Switch preferred column widths to localStorage instead of DB

#

#

#

#

#

#

## Solved

-   Cat / Act managers should take focus on popup
-   Add different signup/login methods
-   Make sure that data methods don't have any cross-user overlap (they shouldn't)
-   Add error reporting mechanism
-   Phase out old Category/Account managers + implement new ones
-   Update Category / Account Managers
-   Add save check for "Create New Transaction"
-   Save button should work on reorders alone
-   Set up all needed data/save methods
-   Set up SimpleValues options for:
    time period (past two weeks, since last item in category (e.x. income), this month)
-   GridNav not working when a row is folded- add a check for disabled inputs
-   Add delete tiles option
-   Pretty up the popups
-   Make pop-out scrollbar not appear when not needed: https://i.imgur.com/sAXGkIZ.gif
-   Get transaction data (db and changed) into dashboard component for other items
-   Make TransactionManager card resizable, where the grid always takes up 100%.
-   Disable grid while saving
-   Allow enter/arrow navigation in grid
-   Add key listeners for saving
-   Show "Today" and "Yesterday" on dates
-   fix this bug https://imgur.com/NO91QLm
-   TransactionManager - Add control to delete rows
-   TransactionManager - Add control to delete transaction items
-   TransactionManager - Set up history system
-   TransactionManager - NEXT: move transaction reorder logic to sortOrder
-   TransactionManager - Set up PendingChange system
-   TransactionManager - remove datasets
-   TransactionManager - STRESS TEST RESORTING (esp when scrollheight overflows)
-   TransactionManager - Add control to fold/unfold multi-rows
-   TransactionManager - Add control to resort multi-rows
-   TransactionManager - Make margins when resorting fit row size exactly ( + use linear transitions for less wobbling)
-   TransactionManager - Make Transaction resorting limited to the row
-   TransactionManager - Add control to resort rows
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
