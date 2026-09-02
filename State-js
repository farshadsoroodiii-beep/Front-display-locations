admin-panel\js\modules\cars\display-locations\state.js
/*==================================================
    DISPLAY LOCATIONS STATE

    Cars Admin Module

    Responsibility:
    - Store Display Locations baseline
    - Store Display Locations working state
    - Manage Location assignments
    - Manage sortOrder / placement
    - Manage dirty detection
    - Discard working changes
    - Commit working state as new baseline

    Does NOT:
    - DOM access
    - Rendering
    - API
    - Fetch
    - Backend logic
    - Database logic
    - Save logic
    - Widget-specific UI rules
    - Page calculation
    - Card calculation
    - Placement validation

    Architecture:
    IIFE Namespace

    State Model:

        baseline
        working

    Assignment Model:

        {
            location: "section-slug",
            sortOrder: 1
        }

    Database Mapping:

        section_slug
              ↓
        location

        sort_order
              ↓
        sortOrder

    IMPORTANT:

    - A Location can be selected without the caller
      providing a placement.
    - When no placement is supplied, State assigns
      the first available positive sortOrder.
    - sortOrder must be unique within the current
      Display Locations working state.
    - Page / Card are NOT persisted as independent
      State properties.
    - Page / Card calculation remains outside this
      State module and belongs to a future phase.

==================================================*/

'use strict';

const DisplayLocationsState = (() => {

    /*==================================================
        INTERNAL STATE
    ==================================================*/

    let state = {

        baseline: [],

        working: []

    };

    /*==================================================
        NORMALIZE SORT ORDER
    ==================================================*/

    function normalizeSortOrder(
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
        NORMALIZE ASSIGNMENT
    ==================================================*/

    function normalizeAssignment(
        assignment
    ) {

        if (
            !assignment ||
            typeof assignment !== 'object' ||
            Array.isArray(assignment)
        ) {

            return null;

        }

        let location =
            assignment.location;

        if (
            typeof location !== 'string'
        ) {

            location =
                assignment.section_slug;

        }

        location =
            normalizeLocation(
                location
            );

        if (
            !location
        ) {

            return null;

        }

        let sortOrder =
            assignment.sortOrder;

        if (
            sortOrder === undefined ||
            sortOrder === null
        ) {

            sortOrder =
                assignment.sort_order;

        }

        const normalizedSortOrder =
            normalizeSortOrder(
                sortOrder
            );

        if (
            normalizedSortOrder === null
        ) {

            return null;

        }

        return {

            location,

            sortOrder:
                normalizedSortOrder

        };

    }

    /*==================================================
        NORMALIZE ASSIGNMENTS
    ==================================================*/

    function normalizeAssignments(
        assignments
    ) {

        if (
            !Array.isArray(assignments)
        ) {

            return [];

        }

        const normalized = [];

        const locations =
            new Set();

        const sortOrders =
            new Set();

        assignments.forEach(
            assignment => {

                const normalizedAssignment =
                    normalizeAssignment(
                        assignment
                    );

                if (
                    !normalizedAssignment
                ) {

                    return;

                }

                /*
                 * One assignment per Location.
                 */

                if (
                    locations.has(
                        normalizedAssignment.location
                    )
                ) {

                    return;

                }

                /*
                 * One assignment per sortOrder.
                 */

                if (
                    sortOrders.has(
                        normalizedAssignment.sortOrder
                    )
                ) {

                    return;

                }

                locations.add(
                    normalizedAssignment.location
                );

                sortOrders.add(
                    normalizedAssignment.sortOrder
                );

                normalized.push(
                    normalizedAssignment
                );

            }
        );

        normalized.sort(
            compareAssignments
        );

        return normalized;

    }

    /*==================================================
        COMPARE ASSIGNMENTS
    ==================================================*/

    function compareAssignments(
        a,
        b
    ) {

        if (
            a.sortOrder !==
            b.sortOrder
        ) {

            return (
                a.sortOrder -
                b.sortOrder
            );

        }

        return a.location.localeCompare(
            b.location
        );

    }

    /*==================================================
        CLONE ASSIGNMENT
    ==================================================*/

    function cloneAssignment(
        assignment
    ) {

        return {

            location:
                assignment.location,

            sortOrder:
                assignment.sortOrder

        };

    }

    /*==================================================
        CLONE ASSIGNMENTS
    ==================================================*/

    function cloneAssignments(
        assignments
    ) {

        return assignments.map(
            cloneAssignment
        );

    }

    /*==================================================
        SORT WORKING
    ==================================================*/

    function sortWorking() {

        state.working.sort(
            compareAssignments
        );

    }

    /*==================================================
        GET NEXT AVAILABLE SORT ORDER
    ==================================================*/

    function getNextAvailableSortOrder() {

        const usedSortOrders =
            new Set(

                state.working.map(
                    assignment =>
                        assignment.sortOrder
                )

            );

        let sortOrder = 1;

        while (
            usedSortOrders.has(
                sortOrder
            )
        ) {

            sortOrder++;

        }

        return sortOrder;

    }

    /*==================================================
        IS SORT ORDER AVAILABLE
    ==================================================*/

    function isSortOrderAvailable(
        sortOrder,
        ignoredLocation = null
    ) {

        const normalizedSortOrder =
            normalizeSortOrder(
                sortOrder
            );

        if (
            normalizedSortOrder === null
        ) {

            return false;

        }

        const normalizedIgnoredLocation =
            normalizeLocation(
                ignoredLocation
            );

        return !state.working.some(
            assignment => {

                if (
                    normalizedIgnoredLocation &&
                    assignment.location ===
                        normalizedIgnoredLocation
                ) {

                    return false;

                }

                return (
                    assignment.sortOrder ===
                    normalizedSortOrder
                );

            }
        );

    }

    /*==================================================
        SET BASELINE
    ==================================================*/

    function setBaseline(
        assignments = []
    ) {

        const normalizedAssignments =
            normalizeAssignments(
                assignments
            );

        state.baseline =
            cloneAssignments(
                normalizedAssignments
            );

        state.working =
            cloneAssignments(
                normalizedAssignments
            );

        return true;

    }

    /*==================================================
        GET BASELINE
    ==================================================*/

    function getBaseline() {

        return cloneAssignments(
            state.baseline
        );

    }

    /*==================================================
        SET WORKING
    ==================================================*/

    function setWorking(
        assignments = []
    ) {

        const normalizedAssignments =
            normalizeAssignments(
                assignments
            );

        state.working =
            cloneAssignments(
                normalizedAssignments
            );

        return true;

    }

    /*==================================================
        GET WORKING
    ==================================================*/

    function getWorking() {

        return cloneAssignments(
            state.working
        );

    }

    /*==================================================
        GET ASSIGNMENT
    ==================================================*/

    function getAssignment(
        location
    ) {

        const normalizedLocation =
            normalizeLocation(
                location
            );

        if (
            !normalizedLocation
        ) {

            return null;

        }

        const assignment =
            state.working.find(
                item =>
                    item.location ===
                    normalizedLocation
            );

        if (
            !assignment
        ) {

            return null;

        }

        return cloneAssignment(
            assignment
        );

    }

    /*==================================================
        GET BASELINE ASSIGNMENT
    ==================================================*/

    function getBaselineAssignment(
        location
    ) {

        const normalizedLocation =
            normalizeLocation(
                location
            );

        if (
            !normalizedLocation
        ) {

            return null;

        }

        const assignment =
            state.baseline.find(
                item =>
                    item.location ===
                    normalizedLocation
            );

        if (
            !assignment
        ) {

            return null;

        }

        return cloneAssignment(
            assignment
        );

    }

    /*==================================================
        IS SELECTED
    ==================================================*/

    function isSelected(
        location
    ) {

        return Boolean(
            getAssignment(
                location
            )
        );

    }

    /*==================================================
        SELECT
    ==================================================*/

    function select(
        location,
        placement
    ) {

        const normalizedLocation =
            normalizeLocation(
                location
            );

        if (
            !normalizedLocation
        ) {

            return false;

        }

        if (
            isSelected(
                normalizedLocation
            )
        ) {

            return false;

        }

        let sortOrder;

        /*
         * Explicit placement supplied by caller.
         */

        if (
            placement !== undefined &&
            placement !== null
        ) {

            if (
                typeof placement === "object"
            ) {

                sortOrder =
                    placement.sortOrder;

                if (
                    sortOrder === undefined
                ) {

                    sortOrder =
                        placement.sort_order;

                }

            } else {

                sortOrder =
                    placement;

            }

            sortOrder =
                normalizeSortOrder(
                    sortOrder
                );

            if (
                sortOrder === null
            ) {

                return false;

            }

            /*
             * Explicit sortOrder cannot collide
             * with another working assignment.
             */

            if (
                !isSortOrderAvailable(
                    sortOrder
                )
            ) {

                return false;

            }

        } else {

            /*
             * No placement supplied.
             *
             * State owns the default assignment and
             * chooses the first available sortOrder.
             */

            sortOrder =
                getNextAvailableSortOrder();

        }

        state.working.push({

            location:
                normalizedLocation,

            sortOrder

        });

        sortWorking();

        return true;

    }

    /*==================================================
        UNSELECT
    ==================================================*/

    function unselect(
        location
    ) {

        const normalizedLocation =
            normalizeLocation(
                location
            );

        if (
            !normalizedLocation
        ) {

            return false;

        }

        const index =
            state.working.findIndex(
                assignment =>
                    assignment.location ===
                    normalizedLocation
            );

        if (
            index === -1
        ) {

            return false;

        }

        state.working.splice(
            index,
            1
        );

        return true;

    }

    /*==================================================
        TOGGLE
    ==================================================*/

    function toggle(
        location,
        placement
    ) {

        if (
            isSelected(
                location
            )
        ) {

            unselect(
                location
            );

            return false;

        }

        return select(
            location,
            placement
        );

    }

    /*==================================================
        SET SORT ORDER
    ==================================================*/

    function setSortOrder(
        location,
        sortOrder
    ) {

        const normalizedLocation =
            normalizeLocation(
                location
            );

        if (
            !normalizedLocation
        ) {

            return false;

        }

        const normalizedSortOrder =
            normalizeSortOrder(
                sortOrder
            );

        if (
            normalizedSortOrder === null
        ) {

            return false;

        }

        const assignment =
            state.working.find(
                item =>
                    item.location ===
                    normalizedLocation
            );

        if (
            !assignment
        ) {

            return false;

        }

        /*
         * The requested sortOrder must be free,
         * except for the current assignment itself.
         */

        if (
            !isSortOrderAvailable(
                normalizedSortOrder,
                normalizedLocation
            )
        ) {

            return false;

        }

        assignment.sortOrder =
            normalizedSortOrder;

        sortWorking();

        return true;

    }

    /*==================================================
        SET PLACEMENT
    ==================================================*/

    function setPlacement(
        location,
        sortOrder
    ) {

        return setSortOrder(
            location,
            sortOrder
        );

    }

    /*==================================================
        GET SORT ORDER
    ==================================================*/

    function getSortOrder(
        location
    ) {

        const assignment =
            getAssignment(
                location
            );

        if (
            !assignment
        ) {

            return null;

        }

        return assignment.sortOrder;

    }

    /*==================================================
        IS DIRTY
    ==================================================*/

    function isDirty() {

        const baseline =
            normalizeAssignments(
                state.baseline
            );

        const working =
            normalizeAssignments(
                state.working
            );

        if (
            baseline.length !==
            working.length
        ) {

            return true;

        }

        for (
            let index = 0;
            index < baseline.length;
            index++
        ) {

            const baselineItem =
                baseline[index];

            const workingItem =
                working[index];

            if (
                baselineItem.location !==
                workingItem.location
            ) {

                return true;

            }

            if (
                baselineItem.sortOrder !==
                workingItem.sortOrder
            ) {

                return true;

            }

        }

        return false;

    }

    /*==================================================
        DISCARD
    ==================================================*/

    function discard() {

        state.working =
            cloneAssignments(
                state.baseline
            );

        return true;

    }

    /*==================================================
        COMMIT
    ==================================================*/

    function commit() {

        state.baseline =
            cloneAssignments(
                state.working
            );

        return true;

    }

    /*==================================================
        RESET
    ==================================================*/

    function reset() {

        state = {

            baseline: [],

            working: []

        };

    }

    /*==================================================
        PUBLIC API
    ==================================================*/

    return {

        setBaseline,

        getBaseline,

        setWorking,

        getWorking,

        getAssignment,

        getBaselineAssignment,

        isSelected,

        select,

        unselect,

        toggle,

        setSortOrder,

        setPlacement,

        getSortOrder,

        isDirty,

        discard,

        commit,

        reset

    };

})();
