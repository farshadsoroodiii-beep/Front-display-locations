admin-panel\js\modules\cars\display-locations\display-locations.js
/*==================================================
    CARS DISPLAY LOCATIONS

    Cars Admin Module

    Responsibility:
    - Connect Display Locations UI to State
    - Bind checkbox change events
    - Bind placement change events
    - Sync checkbox UI from State
    - Sync placement UI from State
    - Enable / disable placement controls
    - Convert Page + Card <-> sortOrder
    - Update Working State through State API

    Does NOT:
    - API
    - Fetch
    - Save
    - Submit
    - Backend Persistence
    - Dirty Detection
    - Validation
    - Location Metadata

    State Owner:
    DisplayLocationsState

    State Model:

        {
            location,
            sortOrder
        }

    Placement Model:

        Position-only:

            sortOrder
                ↕
            position

        Page + Card:

            sortOrder
                ↕
            page + card

    Tab 4:

        Page + Card
              ↓
        sortOrder

        sortOrder
              ↓
        Page + Card

    Page/Card are Presentation-layer values.

    They are NOT persisted independently.

    Architecture:

        User Interaction
              ↓
        display-locations.js
              ↓
        DisplayLocationsState
              ↓
        Working State

        State
          ↓
        syncUI()
          ↓
        UI

    IMPORTANT:

    Location selection does NOT require the user
    to enter Placement first.

    When a new Location is selected without an
    existing placement value, the Controller uses:

        sortOrder = 1

    as the initial Working State value.

    For Page + Card locations:

        sortOrder = 1
            ↓
        Page 1 / Card 1

==================================================*/

'use strict';

const DisplayLocations = (() => {

    /*==================================================
        INTERNAL
    ==================================================*/

    let container = null;

    let initialized = false;

    /*==================================================
        CONSTANTS
    ==================================================*/

    const DEFAULT_SORT_ORDER = 1;

    /*
     * Tab 4 currently displays four cards per page.
     *
     * This is a Presentation-layer rule.
     *
     * It does NOT belong to DisplayLocationsState
     * or the backend persistence model.
     */

    const CARDS_PER_PAGE = 4;

    /*==================================================
        INIT
    ==================================================*/

    function init(
        options = {}
    ) {

        if (
            initialized
        ) {

            return true;

        }

        container =
            options.container ||
            document.querySelector(
                '.cars-display-locations-info'
            );

        if (
            !container
        ) {

            console.error(
                'Display Locations: Container not found.'
            );

            return false;

        }

        if (
            typeof DisplayLocationsState ===
                'undefined'
        ) {

            console.error(
                'DisplayLocationsState is not loaded.'
            );

            return false;

        }

        bindEvents();

        syncUI();

        initialized = true;

        console.log(
            'Display Locations initialized.'
        );

        return true;

    }

    /*==================================================
        BIND EVENTS
    ==================================================*/

    function bindEvents() {

        container.addEventListener(
            'change',
            handleChange
        );

    }

    /*==================================================
        CHANGE HANDLER
    ==================================================*/

    function handleChange(
        event
    ) {

        const target =
            event.target;

        if (
            !target
        ) {

            return;

        }

        /*==============================================
            LOCATION CHECKBOX
        ==============================================*/

        if (
            target.matches(
                'input[name="display_locations"]'
            )
        ) {

            handleLocationChange(
                target
            );

            return;

        }

        /*==============================================
            PLACEMENT INPUT
        ==============================================*/

        if (
            target.matches(
                '[data-display-placement]'
            )
        ) {

            handlePlacementChange(
                target
            );

        }

    }

    /*==================================================
        LOCATION CHANGE
    ==================================================*/

    function handleLocationChange(
        checkbox
    ) {

        const location =
            normalizeLocation(
                checkbox.value
            );

        if (
            !location
        ) {

            syncUI();

            return;

        }

        /*==============================================
            UNSELECT
        ==============================================*/

        if (
            !checkbox.checked
        ) {

            DisplayLocationsState.unselect(
                location
            );

            syncUI();

            return;

        }

        /*==============================================
            SELECT
        ==============================================*/

        /*
         * The Location can be selected even when
         * the Placement controls are still empty.
         *
         * If a valid placement already exists in the
         * UI, preserve it.
         *
         * Otherwise use the safe default:
         *
         *     sortOrder = 1
         */

        const sortOrder =
            readSortOrderFromUI(
                location
            ) ??
            DEFAULT_SORT_ORDER;

        const selected =
            DisplayLocationsState.select(
                location,
                sortOrder
            );

        /*
         * State remains authoritative.
         */

        if (
            !selected &&
            !DisplayLocationsState.isSelected(
                location
            )
        ) {

            syncUI();

            return;

        }

        syncUI();

    }

    /*==================================================
        PLACEMENT CHANGE
    ==================================================*/

    function handlePlacementChange(
        input
    ) {

        const location =
            resolveControlLocation(
                input
            );

        if (
            !location
        ) {

            syncUI();

            return;

        }

        /*
         * Placement can only be changed for a
         * selected Location.
         */

        if (
            !DisplayLocationsState.isSelected(
                location
            )
        ) {

            syncUI();

            return;

        }

        const item =
            findLocationItem(
                location
            );

        if (
            !item
        ) {

            syncUI();

            return;

        }

        const placementType =
            resolvePlacementType(
                item
            );

        /*==============================================
            POSITION ONLY
        ==============================================*/

        if (
            placementType ===
            'position'
        ) {

            const sortOrder =
                readPositionSortOrder(
                    item
                );

            if (
                sortOrder === null
            ) {

                syncUI();

                return;

            }

            updateSortOrder(
                location,
                sortOrder
            );

            return;

        }

        /*==============================================
            PAGE + CARD
        ==============================================*/

        if (
            placementType ===
            'page-card'
        ) {

            const sortOrder =
                readPageCardSortOrder(
                    item
                );

            if (
                sortOrder === null
            ) {

                syncUI();

                return;

            }

            updateSortOrder(
                location,
                sortOrder
            );

            return;

        }

        /*
         * Unknown placement type.
         */

        syncUI();

    }

    /*==================================================
        UPDATE STATE SORT ORDER
    ==================================================*/

    function updateSortOrder(
        location,
        sortOrder
    ) {

        const updated =
            DisplayLocationsState.setSortOrder(
                location,
                sortOrder
            );

        if (
            !updated
        ) {

            syncUI();

            return false;

        }

        syncUI();

        return true;

    }

    /*==================================================
        READ SORT ORDER FROM UI
    ==================================================

        This function determines the Placement model
        of the specific Location and converts its UI
        values into the State representation.

        Position-only:

            position
                ↓
            sortOrder

        Page + Card:

            page + card
                ↓
            sortOrder
    ==================================================*/

    function readSortOrderFromUI(
        location
    ) {

        const item =
            findLocationItem(
                location
            );

        if (
            !item
        ) {

            return null;

        }

        const placementType =
            resolvePlacementType(
                item
            );

        if (
            placementType ===
            'position'
        ) {

            return readPositionSortOrder(
                item
            );

        }

        if (
            placementType ===
            'page-card'
        ) {

            return readPageCardSortOrder(
                item
            );

        }

        return null;

    }

    /*==================================================
        READ POSITION SORT ORDER
    ==================================================*/

    function readPositionSortOrder(
        item
    ) {

        const positionControl =
            item.querySelector(
                '[data-display-placement="position"]'
            );

        if (
            !positionControl
        ) {

            return null;

        }

        return normalizePositiveInteger(
            positionControl.value
        );

    }

    /*==================================================
        READ PAGE + CARD SORT ORDER
    ==================================================

        Formula:

            sortOrder =
                ((page - 1) * CARDS_PER_PAGE) + card

        Example:

            page = 2
            card = 3

            sortOrder =
                ((2 - 1) * 4) + 3
                = 7
    ==================================================*/

    function readPageCardSortOrder(
        item
    ) {

        const pageControl =
            item.querySelector(
                '[data-display-placement="page"]'
            );

        const positionControl =
            item.querySelector(
                '[data-display-placement="position"]'
            );

        if (
            !pageControl ||
            !positionControl
        ) {

            return null;

        }

        const page =
            normalizePositiveInteger(
                pageControl.value
            );

        const card =
            normalizeCardPosition(
                positionControl.value
            );

        if (
            page === null ||
            card === null
        ) {

            return null;

        }

        return (
            ((page - 1) *
                CARDS_PER_PAGE) +
            card
        );

    }

    /*==================================================
        RESOLVE CONTROL LOCATION
    ==================================================*/

    function resolveControlLocation(
        control
    ) {

        if (
            control.dataset &&
            typeof control.dataset.location ===
                'string'
        ) {

            const location =
                normalizeLocation(
                    control.dataset.location
                );

            if (
                location
            ) {

                return location;

            }

        }

        const parent =
            control.closest(
                '[data-location]'
            );

        if (
            parent
        ) {

            const location =
                normalizeLocation(
                    parent.dataset.location
                );

            if (
                location
            ) {

                return location;

            }

        }

        const item =
            control.closest(
                '.display-location-item'
            );

        if (
            item
        ) {

            const checkbox =
                item.querySelector(
                    'input[name="display_locations"]'
                );

            if (
                checkbox
            ) {

                return normalizeLocation(
                    checkbox.value
                );

            }

        }

        return null;

    }

    /*==================================================
        FIND LOCATION ITEM
    ==================================================*/

    function findLocationItem(
        location
    ) {

        if (
            !container
        ) {

            return null;

        }

        const normalizedLocation =
            normalizeLocation(
                location
            );

        if (
            !normalizedLocation
        ) {

            return null;

        }

        const dataLocationItems =
            container.querySelectorAll(
                '[data-location]'
            );

        for (
            const item of dataLocationItems
        ) {

            if (
                normalizeLocation(
                    item.dataset.location
                ) ===
                normalizedLocation
            ) {

                return item;

            }

        }

        const checkboxes =
            container.querySelectorAll(
                'input[name="display_locations"]'
            );

        for (
            const checkbox of checkboxes
        ) {

            if (
                normalizeLocation(
                    checkbox.value
                ) ===
                normalizedLocation
            ) {

                return checkbox.closest(
                    '.display-location-item'
                );

            }

        }

        return null;

    }

    /*==================================================
        RESOLVE PLACEMENT TYPE
    ==================================================

        HTML contract:

            data-placement-type="position"

        or:

            data-placement-type="page-card"
    ==================================================*/

    function resolvePlacementType(
        item
    ) {

        if (
            !item
        ) {

            return null;

        }

        const type =
            item.dataset
                ? item.dataset.placementType
                : null;

        if (
            type === 'position'
        ) {

            return 'position';

        }

        if (
            type === 'page-card'
        ) {

            return 'page-card';

        }

        return null;

    }

    /*==================================================
        SYNC UI
    ==================================================*/

    function syncUI() {

        if (
            !container
        ) {

            return;

        }

        if (
            typeof DisplayLocationsState ===
                'undefined'
        ) {

            console.error(
                'DisplayLocationsState is not loaded.'
            );

            return;

        }

        const checkboxes =
            container.querySelectorAll(
                'input[name="display_locations"]'
            );

        checkboxes.forEach(
            checkbox => {

                const location =
                    normalizeLocation(
                        checkbox.value
                    );

                if (
                    !location
                ) {

                    checkbox.checked = false;

                    return;

                }

                const assignment =
                    DisplayLocationsState.getAssignment(
                        location
                    );

                checkbox.checked =
                    Boolean(
                        assignment
                    );

                syncLocationItem(
                    location,
                    assignment
                );

            }
        );

    }

    /*==================================================
        SYNC LOCATION ITEM
    ==================================================*/

    function syncLocationItem(
        location,
        assignment
    ) {

        const item =
            findLocationItem(
                location
            );

        if (
            !item
        ) {

            return;

        }

        const selected =
            Boolean(
                assignment
            );

        syncItemSelection(
            item,
            selected
        );

        syncItemPlacement(
            item,
            assignment
        );

    }

    /*==================================================
        SYNC ITEM SELECTION
    ==================================================*/

    function syncItemSelection(
        item,
        selected
    ) {

        if (
            !item
        ) {

            return;

        }

        const checkbox =
            item.querySelector(
                'input[name="display_locations"]'
            );

        if (
            checkbox
        ) {

            checkbox.checked =
                selected;

        }

        item.classList.toggle(
            'is-selected',
            selected
        );

    }

    /*==================================================
        SYNC ITEM PLACEMENT
    ==================================================

        State contains only sortOrder.

        Position-only:

            sortOrder
                ↓
            position

        Page + Card:

            sortOrder
                ↓
            page + card
    ==================================================*/

    function syncItemPlacement(
        item,
        assignment
    ) {

        if (
            !item
        ) {

            return;

        }

        const controls =
            item.querySelectorAll(
                '[data-display-placement]'
            );

        /*==============================================
            NOT SELECTED
        ==============================================*/

        if (
            !assignment
        ) {

            controls.forEach(
                control => {

                    control.disabled =
                        true;

                }
            );

            return;

        }

        /*==============================================
            SELECTED
        ==============================================*/

        controls.forEach(
            control => {

                control.disabled =
                    false;

            }
        );

        const placementType =
            resolvePlacementType(
                item
            );

        /*==============================================
            POSITION ONLY
        ==============================================*/

        if (
            placementType ===
            'position'
        ) {

            const positionControl =
                item.querySelector(
                    '[data-display-placement="position"]'
                );

            if (
                positionControl
            ) {

                positionControl.value =
                    String(
                        assignment.sortOrder
                    );

            }

            return;

        }

        /*==============================================
            PAGE + CARD
        ==============================================*/

        if (
            placementType ===
            'page-card'
        ) {

            const page =
                calculatePage(
                    assignment.sortOrder
                );

            const card =
                calculateCard(
                    assignment.sortOrder
                );

            const pageControl =
                item.querySelector(
                    '[data-display-placement="page"]'
                );

            const positionControl =
                item.querySelector(
                    '[data-display-placement="position"]'
                );

            if (
                pageControl
            ) {

                pageControl.value =
                    String(page);

            }

            if (
                positionControl
            ) {

                positionControl.value =
                    String(card);

            }

        }

    }

    /*==================================================
        CALCULATE PAGE
    ==================================================*/

    function calculatePage(
        sortOrder
    ) {

        const normalizedSortOrder =
            normalizePositiveInteger(
                sortOrder
            );

        if (
            normalizedSortOrder === null
        ) {

            return null;

        }

        return Math.ceil(
            normalizedSortOrder /
            CARDS_PER_PAGE
        );

    }

    /*==================================================
        CALCULATE CARD
    ==================================================*/

    function calculateCard(
        sortOrder
    ) {

        const normalizedSortOrder =
            normalizePositiveInteger(
                sortOrder
            );

        if (
            normalizedSortOrder === null
        ) {

            return null;

        }

        return (
            (
                normalizedSortOrder - 1
            ) %
            CARDS_PER_PAGE
        ) + 1;

    }

    /*==================================================
        NORMALIZE LOCATION
    ==================================================*/

    function normalizeLocation(
        value
    ) {

        if (
            typeof value !== 'string'
        ) {

            return null;

        }

        const location =
            value.trim();

        if (
            !location
        ) {

            return null;

        }

        return location;

    }

    /*==================================================
        NORMALIZE POSITIVE INTEGER
    ==================================================*/

    function normalizePositiveInteger(
        value
    ) {

        const number =
            Number(value);

        if (
            !Number.isInteger(number)
        ) {

            return null;

        }

        if (
            number < 1
        ) {

            return null;

        }

        return number;

    }

    /*==================================================
        NORMALIZE CARD POSITION
    ==================================================

        Tab 4 currently supports:

            Card 1
            Card 2
            Card 3
            Card 4
    ==================================================*/

    function normalizeCardPosition(
        value
    ) {

        const number =
            normalizePositiveInteger(
                value
            );

        if (
            number === null
        ) {

            return null;

        }

        if (
            number > CARDS_PER_PAGE
        ) {

            return null;

        }

        return number;

    }

    /*==================================================
        REFRESH
    ==================================================*/

    function refresh() {

        syncUI();

        return true;

    }

    /*==================================================
        DESTROY
    ==================================================*/

    function destroy() {

        if (
            !container ||
            !initialized
        ) {

            return;

        }

        container.removeEventListener(
            'change',
            handleChange
        );

        container = null;

        initialized = false;

    }

    /*==================================================
        PUBLIC API
    ==================================================*/

    return {

        init,

        refresh,

        destroy

    };

})();
