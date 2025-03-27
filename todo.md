# Unsolved

-   Allow esc key for popups and tutorial

### High Priority

-   Switch "create new transaction" button to add row to grid
    -   DateRow section
    -   Transaction count = 0 section
-   Make history system work for all types of changes in the dashboard
    -   Types of changes to track:
        value changes
        sort order changes
        deleted items / transactions
        created items / transactions
        tile changes (movement, config, size, generally anything in the TileData structure)
        tile creations
        tile deletions

### Medium Priority

-   Clean up JGrid system to support percentages better
    -   CHARISSA: Fix width of the date picker to be full by default
-   Switch preferred column widths to localStorage instead of DB
-   CHARISSA: InitialSetup - Fix padding on "welcome" stage, maybe make the module's width/height dynamic based on content
    -   Either add an "exit" button (with default categories/accounts) OR make this fullscreen so it doesn't "feel" like a popup
    -   Look at stuff like Monday, Jira, ClickUp for reference ideas
    -   PROPER ERROR DISPLAY for no categories/accounts filled out, instead of button title
-   CHARISSA: Some HTML inputs seem to still have default borders (at least on chrome macos)
    -   JNumberAccounting
    -   Test others

### Low Priority

-   CHARISSA: Add hover effects for jstyle='invisible' buttons
-   CHARISSA: Make empty border thickness consistent between JRadio and JCheckbox
-   CHARISSA: Add more padding between "stages" and text in tutorial
    -   https://i.imgur.com/2eIBSkz.png
-   CHARISSA: Add padding between "Sign in with Temporary Account" and text on login pages
    -   https://i.imgur.com/KSvgkaZ.png
-   Switch SortOrder to use arrays for all items [transaction_id, item_id ...]
-   When saving changes and a transaction's date changes, it should be added at the top of the list for that date. This will require some sortOrder magic and querying when saving.
-   Add Theme system
-   Standardize margins/padding to CSS variables

    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #
    [//]: #

# Solved

-   Add some welcome text
-   Add a recruiter welcome page /recruiter-login, with a link to create temp account
-   History buttons don't seem to be working
-   Make better discard changes confirm form
-   Add "Tutorial / Setup" sequence
    -   Basic intro page
    -   Set up categories
    -   Set up accounts
    -   Quick UI Guide
-   Add data.clearchanges method + sortorder clear
-   Remove delete confirm for tiles
-   Fix mouse position when moving tiles around
-   Redirect home to login page
-   Set up tutorial system
    -   Add a SimpleTile to the default user stuff
    -   Add a system that highlights different parts of the window and explains them
-   Transaction form isn't auto-refreshing on exit. Seems to happen when entering the first item? idk
-   Cat / Act managers should take focus on popup
-   Add different signup/login methods
-   Make sure that data methods don't have any cross-user overlap (they shouldn't)
-   Add error reporting mechanism
-   Add better category/account management systems
-   Phase out old Category/Account managers + implement new ones
-   Update Category / Account Managers
-   Add save check for "Create New Transaction"
-   Save button should work on reorders alone
-   Set up all needed data/save methods
-   Set up SimpleValues options for:
    -   time period (past two weeks, since last item in category (e.x. income), this month)
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
