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

==================================================*/

'use strict';

const DisplayLocations = (() => {

    /*==================================================
        INTERNAL
    ==================================================*/

    let container = null;

    let initialized = false;

    /*
     * Locations which have been checked by the manager
     * but do not yet have a valid placement.
     *
     * This is UI-only state.
     *
     * It MUST NOT be persisted.
     */
    const pendingSelections = new Set();

    /*==================================================
        CONSTANTS
    ==================================================*/

    /*
     * Tab 2 / Tab 4 presentation rule.
     *
     * Four cards are displayed on every page.
     *
     * Page/Card are Presentation values only.
     *
     * Backend continues to receive sortOrder.
     */
    const CARDS_PER_PAGE = 4;

    /*==================================================
        INIT
    ==================================================*/

    function init(options = {}) {

        if (initialized) {
            return true;
        }

        container =
            options.container ||
            document.querySelector(
                '.cars-display-locations-info'
            );

        if (!container) {

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

    function handleChange(event) {

        const target = event.target;

        if (!target) {
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

            handleLocationChange(target);

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

            handlePlacementChange(target);

        }

    }

    /*==================================================
        LOCATION CHANGE
    ==================================================*/

    function handleLocationChange(checkbox) {

        const location =
            normalizeLocation(
                checkbox.value
            );

        if (!location) {

            syncUI();

            return;
        }

        /*==============================================
            UNSELECT
        ==============================================*/

        if (!checkbox.checked) {

            pendingSelections.delete(location);

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
         * If the location already has an assignment,
         * the checkbox simply represents that assignment.
         *
         * No pending state is required.
         */
        if (
            DisplayLocationsState.isSelected(
                location
            )
        ) {

            pendingSelections.delete(location);

            syncUI();

            return;
        }

        /*
         * New selection.
         *
         * The manager must now choose a placement.
         */
        pendingSelections.add(location);

        syncUI();

    }

    /*==================================================
        PLACEMENT CHANGE
    ==================================================*/

    function handlePlacementChange(input) {

        const location =
            resolveControlLocation(input);

        if (!location) {

            syncUI();

            return;
        }

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
            findLocationItem(location);

        if (!item) {

            syncUI();

            return;
        }

        const placementType =
            resolvePlacementType(item);

        /*==============================================
            POSITION
        ==============================================*/

        if (
            placementType ===
            'position'
        ) {

            const sortOrder =
                readPositionSortOrder(item);

            if (sortOrder === null) {

                syncUI();

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
                readPageCardSortOrder(item);

            if (sortOrder === null) {

                syncUI();

                return;
            }

            applyPlacement(
                location,
                sortOrder,
                stateSelected
            );

            return;
        }

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
            !Number.isInteger(sortOrder) ||
            sortOrder < 1
        ) {

            syncUI();

            return;
        }

        /*==============================================
            EXISTING ASSIGNMENT
        ==============================================*/

        if (stateSelected) {

            DisplayLocationsState.updateSortOrder(
                location,
                sortOrder
            );

            pendingSelections.delete(
                location
            );

            syncUI();

            return;
        }

        /*==============================================
            NEW ASSIGNMENT
        ==============================================*/

        DisplayLocationsState.select(
            location,
            sortOrder
        );

        pendingSelections.delete(
            location
        );

        syncUI();

    }

    /*==================================================
        SYNC UI
    ==================================================*/

    function syncUI() {

        if (!container) {
            return;
        }

        const checkboxes =
            container.querySelectorAll(
                'input[name="display_locations"]'
            );

        checkboxes.forEach(
            syncLocationCheckbox
        );

        const items =
            container.querySelectorAll(
                '[data-display-location]'
            );

        items.forEach(
            syncLocationItem
        );

    }

    /*==================================================
        SYNC CHECKBOX
    ==================================================*/

    function syncLocationCheckbox(checkbox) {

        const location =
            normalizeLocation(
                checkbox.value
            );

        if (!location) {
            return;
        }

        const selected =
            DisplayLocationsState.isSelected(
                location
            );

        const pending =
            isPendingSelection(
                location
            );

        /*
         * Existing State assignment is always checked.
         *
         * Pending selection is also visually checked,
         * but it remains unsaved until placement is supplied.
         */
        checkbox.checked =
            selected ||
            pending;

    }

    /*==================================================
        SYNC LOCATION ITEM
    ==================================================*/

    function syncLocationItem(item) {

        const location =
            resolveItemLocation(item);

        if (!location) {
            return;
        }

        const selected =
            DisplayLocationsState.isSelected(
                location
            );

        const pending =
            isPendingSelection(
                location
            );

        const active =
            selected ||
            pending;

        item.classList.toggle(
            'is-selected',
            active
        );

        item.classList.toggle(
            'is-pending',
            pending
        );

        item.classList.toggle(
            'is-assigned',
            selected
        );

        updatePlacementControls(
            item,
            active
        );

        if (selected) {

            const assignment =
                getAssignment(
                    location
                );

            if (assignment) {

                writeAssignmentToUI(
                    item,
                    assignment.sortOrder
                );

            }

        }

        if (pending) {

            markPendingPlacement(
                item
            );

        }

    }

    /*==================================================
        PLACEMENT CONTROLS
    ==================================================*/

    function updatePlacementControls(
        item,
        enabled
    ) {

        const controls =
            item.querySelectorAll(
                '[data-display-placement]'
            );

        controls.forEach(
            control => {

                control.disabled =
                    !enabled;

                control.setAttribute(
                    'aria-disabled',
                    String(!enabled)
                );

            }
        );

    }

    /*==================================================
        WRITE ASSIGNMENT TO UI
    ==================================================*/

    function writeAssignmentToUI(
        item,
        sortOrder
    ) {

        const placementType =
            resolvePlacementType(item);

        if (
            placementType ===
            'position'
        ) {

            writePositionToUI(
                item,
                sortOrder
            );

            return;
        }

        if (
            placementType ===
            'page-card'
        ) {

            writePageCardToUI(
                item,
                sortOrder
            );

        }

    }

    /*==================================================
        POSITION UI
    ==================================================*/

    function writePositionToUI(
        item,
        sortOrder
    ) {

        const input =
            item.querySelector(
                '[data-display-placement="position"]'
            );

        if (!input) {
            return;
        }

        input.value =
            String(sortOrder);

    }

    /*==================================================
        PAGE + CARD UI
    ==================================================*/

    function writePageCardToUI(
        item,
        sortOrder
    ) {

        const placement =
            sortOrderToPageCard(
                sortOrder
            );

        if (!placement) {
            return;
        }

        const pageInput =
            item.querySelector(
                '[data-display-placement="page"]'
            );

        const cardInput =
            item.querySelector(
                '[data-display-placement="card"]'
            );

        if (pageInput) {

            pageInput.value =
                String(
                    placement.page
                );

        }

        if (cardInput) {

            cardInput.value =
                String(
                    placement.card
                );

        }

    }

    /*==================================================
        PENDING PLACEMENT
    ==================================================*/

    function markPendingPlacement(item) {

        const message =
            item.querySelector(
                '[data-display-placement-message]'
            );

        if (!message) {
            return;
        }

        message.hidden = false;

    }

    function clearPendingPlacement(item) {

        const message =
            item.querySelector(
                '[data-display-placement-message]'
            );

        if (!message) {
            return;
        }

        message.hidden = true;

    }

    /*==================================================
        READ POSITION
    ==================================================*/

    function readPositionSortOrder(item) {

        const input =
            item.querySelector(
                '[data-display-placement="position"]'
            );

        if (!input) {
            return null;
        }

        const value =
            Number(
                input.value
            );

        if (
            !Number.isInteger(value) ||
            value < 1
        ) {

            return null;
        }

        return value;

    }

    /*==================================================
        READ PAGE + CARD
    ==================================================*/

    function readPageCardSortOrder(item) {

        const pageInput =
            item.querySelector(
                '[data-display-placement="page"]'
            );

        const cardInput =
            item.querySelector(
                '[data-display-placement="card"]'
            );

        if (
            !pageInput ||
            !cardInput
        ) {

            return null;
        }

        const page =
            Number(
                pageInput.value
            );

        const card =
            Number(
                cardInput.value
            );

        if (
            !Number.isInteger(page) ||
            page < 1
        ) {

            return null;
        }

        if (
            !Number.isInteger(card) ||
            card < 1 ||
            card > CARDS_PER_PAGE
        ) {

            return null;
        }

        return pageCardToSortOrder(
            page,
            card
        );

    }

    /*==================================================
        PAGE + CARD → SORT ORDER
    ==================================================*/

    function pageCardToSortOrder(
        page,
        card
    ) {

        if (
            !Number.isInteger(page) ||
            page < 1
        ) {

            return null;
        }

        if (
            !Number.isInteger(card) ||
            card < 1 ||
            card > CARDS_PER_PAGE
        ) {

            return null;
        }

        return (
            (
                page - 1
            ) *
            CARDS_PER_PAGE
        ) + card;

    }

    /*==================================================
        SORT ORDER → PAGE + CARD
    ==================================================*/

    function sortOrderToPageCard(
        sortOrder
    ) {

        if (
            !Number.isInteger(sortOrder) ||
            sortOrder < 1
        ) {

            return null;
        }

        const page =
            Math.floor(
                (
                    sortOrder - 1
                ) /
                CARDS_PER_PAGE
            ) + 1;

        const card =
            (
                (
                    sortOrder - 1
                ) %
                CARDS_PER_PAGE
            ) + 1;

        return {
            page,
            card
        };

    }

    /*==================================================
        LOCATION ITEM
    ==================================================*/

    function findLocationItem(
        location
    ) {

        if (!container) {
            return null;
        }

        const items =
            container.querySelectorAll(
                '[data-display-location]'
            );

        for (
            const item of items
        ) {

            if (
                resolveItemLocation(
                    item
                ) === location
            ) {

                return item;
            }

        }

        return null;

    }

    function resolveItemLocation(
        item
    ) {

        if (!item) {
            return null;
        }

        const value =
            item.dataset.displayLocation;

        return normalizeLocation(
            value
        );

    }

    function resolveControlLocation(
        control
    ) {

        if (!control) {
            return null;
        }

        const direct =
            control.dataset.location;

        if (direct) {

            return normalizeLocation(
                direct
            );

        }

        const item =
            control.closest(
                '[data-display-location]'
            );

        return resolveItemLocation(
            item
        );

    }

    /*==================================================
        PLACEMENT TYPE
    ==================================================*/

    function resolvePlacementType(
        item
    ) {

        if (!item) {
            return null;
        }

        const type =
            item.dataset.placementType;

        if (
            type ===
            'position'
        ) {

            return 'position';
        }

        if (
            type ===
            'page-card'
        ) {

            return 'page-card';
        }

        /*
         * Support explicit child controls when the
         * parent metadata is not present.
         */

        if (
            item.querySelector(
                '[data-display-placement="position"]'
            )
        ) {

            return 'position';
        }

        if (
            item.querySelector(
                '[data-display-placement="page"]'
            ) &&
            item.querySelector(
                '[data-display-placement="card"]'
            )
        ) {

            return 'page-card';
        }

        return null;

    }

    /*==================================================
        ASSIGNMENT
    ==================================================*/

    function getAssignment(
        location
    ) {

        if (
            typeof DisplayLocationsState
                .getWorking !==
            'function'
        ) {

            return null;
        }

        const working =
            DisplayLocationsState.getWorking();

        if (!Array.isArray(working)) {
            return null;
        }

        return (
            working.find(
                assignment =>
                    assignment &&
                    normalizeLocation(
                        assignment.location
                    ) === location
            ) ||
            null
        );

    }

    /*==================================================
        PENDING
    ==================================================*/

    function isPendingSelection(
        location
    ) {

        return pendingSelections.has(
            normalizeLocation(
                location
            )
        );

    }

    /*==================================================
        NORMALIZE
    ==================================================*/

    function normalizeLocation(
        value
    ) {

        if (
            typeof value !==
            'string'
        ) {

            return null;
        }

        const normalized =
            value.trim();

        return normalized ||
            null;

    }

    /*==================================================
        VALIDATION
    ==================================================*/

    function hasPendingSelections() {

        return (
            pendingSelections.size >
            0
        );

    }

    function getPendingLocations() {

        return Array.from(
            pendingSelections
        );

    }

    /*==================================================
        VALIDATE BEFORE SAVE
    ==================================================*/

    function validateBeforeSave() {

        if (
            !hasPendingSelections()
        ) {

            return {
                valid: true,
                locations: []
            };

        }

        const locations =
            getPendingLocations();

        return {
            valid: false,
            locations,
            message:
                'برای محل نمایش انتخاب‌شده، ابتدا جایگاه نمایش را مشخص کنید.'
        };

    }

    /*==================================================
        RESET PENDING
    ==================================================*/

    function clearPendingSelections() {

        pendingSelections.clear();

        syncUI();

    }

    /*==================================================
        REFRESH
    ==================================================*/

    function refresh() {

        syncUI();

    }

    /*==================================================
        PUBLIC
    ==================================================*/

    return {

        init,

        refresh,

        syncUI,

        validateBeforeSave,

        hasPendingSelections,

        getPendingLocations,

        clearPendingSelections,

        pageCardToSortOrder,

        sortOrderToPageCard

    };

})();
