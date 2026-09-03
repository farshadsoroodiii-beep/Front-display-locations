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
    - State ownership

    State Owner:
    DisplayLocationsState

    State Model:

        {
            location,
            sortOrder
        }

    IMPORTANT:
    - Every Location is an independent display namespace.
    - The same sortOrder may exist in different Locations.
    - A Location can be selected independently.
    - A Location can have only one assignment.
    - Placement belongs to the selected Location.
    - Page / Card are Presentation-layer values only.
    - Page / Card are converted to/from sortOrder.
    - Page / Card are NOT stored independently in State.

    Examples:

        SUV
            Page 1 / Card 4
            ↓
            sortOrder = 4

        Sedan
            Page 1 / Card 4
            ↓
            sortOrder = 4

        Both are valid.

    Architecture:

        User Interaction
              ↓
        DisplayLocations
              ↓
        DisplayLocationsState
              ↓
        Working State

        State
          ↓
        syncUI()
          ↓
        UI

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

    /*
     * Tab 4 presentation rule.
     *
     * Four cards are displayed on every page.
     *
     * This rule belongs to the Presentation layer.
     * It does NOT belong to State or Backend.
     */

    const CARDS_PER_PAGE = 4;

    /*
     * A checked Location may temporarily exist in the UI
     * while the manager is choosing its placement.
     *
     * This is presentation-only state. It is NOT persisted
     * in DisplayLocationsState and therefore cannot become
     * a saved assignment until a valid placement is supplied.
     */

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
            PLACEMENT CONTROL
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
            SELECT / PENDING PLACEMENT
        ==============================================*/

        /*
         * Selection alone does not create a Domain
         * assignment. The manager must first provide a
         * valid placement.
         *
         * The checkbox remains visually selected only while
         * the UI is collecting that placement. This pending
         * state belongs to the connector, not State.
         */

        syncPendingSelectionUI(
            location,
            true
        );

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
         * Placement can be changed either for an existing
         * State assignment or for a checkbox selection that
         * is currently waiting for its first placement.
         */

        const stateSelected =
            DisplayLocationsState.isSelected(
                location
            );

        const pendingSelected =
            isPendingSelection(
                location
            );

        if (
            !stateSelected &&
            !pendingSelected
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

                if (
                    pendingSelected
                ) {

                    syncPendingSelectionUI(
                        location,
                        true
                    );

                } else {

                    syncUI();

                }

                return;

            }

            applyPlacement(
                location,
                sortOrder,
                stateSelected
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

                if (
                    pendingSelected
                ) {

                    syncPendingSelectionUI(
                        location,
                        true
                    );

                } else {

                    syncUI();

                }

                return;

            }

            applyPlacement(
                location,
                sortOrder,
                stateSelected
            );

            return;

        }

        /*==============================================
            UNKNOWN TYPE
        ==============================================*/

        syncUI();

    }

    /*==================================================
        APPLY PLACEMENT
    ==================================================*/

    function applyPlacement(
        location,
        sortOrder,
        stateSelected
    ) {

        if (
            stateSelected
        ) {

            updateSortOrder(
                location,
                sortOrder
            );

            return;

        }

        const selected =
            DisplayLocationsState.select(
                location,
                sortOrder
            );

        if (
            !selected
        ) {

            syncUI();

            syncPendingSelectionUI(
                location,
                true
            );

            return;

        }

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

        /*
         * State owns placement validity.
         *
         * If State rejects the requested placement,
         * immediately restore the authoritative State
         * value into the UI.
         */

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

            Page 1 / Card 4
                ↓
            ((1 - 1) * 4) + 4
                ↓
            4

            Page 2 / Card 3
                ↓
            ((2 - 1) * 4) + 3
                ↓
            7

    ==================================================*/

    function readPageCardSortOrder(
        item
    ) {

        const pageControl =
            item.querySelector(
                '[data-display-placement="page"]'
            );

        const cardControl =
            item.querySelector(
                '[data-display-placement="position"]'
            );

        if (
            !pageControl ||
            !cardControl
        ) {

            return null;

        }

        const page =
            normalizePositiveInteger(
                pageControl.value
            );

        const card =
            normalizeCardPosition(
                cardControl.value
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
            control &&
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

        /*
         * Primary lookup:
         *
         *     data-location
         */

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

        /*
         * Fallback lookup:
         *
         *     checkbox value
         */

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
        PENDING SELECTION HELPERS
    ==================================================*/

    function isPendingSelection(
        location
    ) {

        const item =
            findLocationItem(
                location
            );

        if (
            !item
        ) {

            return false;

        }

        const checkbox =
            item.querySelector(
                'input[name="display_locations"]'
            );

        return Boolean(
            checkbox &&
            checkbox.checked &&
            !DisplayLocationsState.isSelected(
                location
            )
        );

    }

    function syncPendingSelectionUI(
        location,
        selected
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

        const checkbox =
            item.querySelector(
                'input[name="display_locations"]'
            );

        if (
            checkbox
        ) {

            checkbox.checked =
                Boolean(selected);

        }

        const controls =
            item.querySelectorAll(
                '[data-display-placement]'
            );

        controls.forEach(
            control => {

                control.disabled =
                    !selected;

            }
        );

        item.classList.toggle(
            'is-selected',
            Boolean(selected)
        );

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
                'Display LocationsState is not loaded.'
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

                    checkbox.checked =
                        false;

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

        State contains:

            {
                location,
                sortOrder
            }

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

            const cardControl =
                item.querySelector(
                    '[data-display-placement="position"]'
                );

            if (
                pageControl &&
                page !== null
            ) {

                pageControl.value =
                    String(
                        page
                    );

            }

            if (
                cardControl &&
                card !== null
            ) {

                cardControl.value =
                    String(
                        card
                    );

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
            number >
            CARDS_PER_PAGE
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
