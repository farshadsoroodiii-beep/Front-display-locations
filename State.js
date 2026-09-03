admin-panel\js\modules\cars\display-locations\state.js
/*==================================================
    DISPLAY LOCATIONS STATE

    Cars Admin Module

    Responsibility:
    - Store Display Locations baseline
    - Store Display Locations working state
    - Manage Location assignments
    - Manage Display Group rules
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

    Display Groups:

        VIP:
            slider-vip

        TAB 2:
            new-cars
            used-cars

        TAB 4:
            sedan
            suv
            truck
            van

    Display Group Rule:

        A car may exist in all three Display Groups.

        A car may have only ONE Location
        inside each Display Group.

        Therefore:

            slider-vip
            +
            new-cars
            +
            suv

        is valid.

        But:

            new-cars
            +
            used-cars

        is invalid.

        And:

            sedan
            +
            suv

        is invalid.

    Sort Order Rule:

        sortOrder is unique PER Location.

        Example:

            suv   -> 4
            sedan -> 4

        is allowed by sortOrder because these are
        different Display Locations.

        However, the same car cannot hold both
        suv and sedan because both belong to TAB 4.

    IMPORTANT:

    - A Location can be selected without the caller
      providing a placement.
    - When no placement is supplied, State assigns
      the first available positive sortOrder for
      that Location.
    - Page / Card are NOT persisted as independent
      State properties.
    - Page / Card calculation remains outside this
      State module.
    - Display Group is an internal rule and is NOT
      persisted in the State assignment model.

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
        DISPLAY GROUPS
    ==================================================*/

    const DISPLAY_GROUPS = {

        VIP: new Set([
            'slider-vip'
        ]),

        TAB2: new Set([
            'new-cars',
            'used-cars'
        ]),

        TAB4: new Set([
            'sedan',
            'suv',
            'truck',
            'van'
        ])

    };

    /*==================================================
        GET DISPLAY GROUP
    ==================================================*/

    function getGroupForLocation(
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

        if (
            DISPLAY_GROUPS.VIP.has(
                normalizedLocation
            )
        ) {

            return 'VIP';

        }

        if (
            DISPLAY_GROUPS.TAB2.has(
                normalizedLocation
            )
        ) {

            return 'TAB2';

        }

        if (
            DISPLAY_GROUPS.TAB4.has(
                normalizedLocation
            )
        ) {

            return 'TAB4';

        }

        return null;

    }

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

                locations.add(
                    normalizedAssignment.location
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
        GET GROUP ASSIGNMENT
    ==================================================*/

    function getGroupAssignment(
        location
    ) {

        const group =
            getGroupForLocation(
                location
            );

        if (
            !group
        ) {

            return null;

        }

        return (
            state.working.find(
                assignment =>
                    getGroupForLocation(
                        assignment.location
                    ) === group
            ) || null
        );

    }

    /*==================================================
        HAS LOCATION IN GROUP
    ==================================================*/

    function hasLocationInGroup(
        location
    ) {

        return Boolean(
            getGroupAssignment(
                location
            )
        );

    }

    /*==================================================
        IS LOCATION ALLOWED
    ==================================================*/

    function isLocationAllowed(
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

        const group =
            getGroupForLocation(
                normalizedLocation
            );

        /*
         * Unknown locations are not blocked by a
         * Display Group rule.
         *
         * Existing location values can therefore
         * still be normalized safely without
         * inventing a backend section registry here.
         */

        if (
            !group
        ) {

            return true;

        }

        const groupAssignment =
            getGroupAssignment(
                normalizedLocation
            );

        /*
         * No assignment in this group.
         */

        if (
            !groupAssignment
        ) {

            return true;

        }

        /*
         * The current Location itself is allowed.
         */

        return (
            groupAssignment.location ===
            normalizedLocation
        );

    }

    /*==================================================
        GET NEXT AVAILABLE SORT ORDER
        FOR A SPECIFIC LOCATION
    ==================================================*/

    function getNextAvailableSortOrder(
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

        const usedSortOrders =
            new Set(

                state.working
                    .filter(
                        assignment =>
                            assignment.location ===
                            normalizedLocation
                    )
                    .map(
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
        FOR A SPECIFIC LOCATION
    ==================================================*/

    function isSortOrderAvailable(
        location,
        sortOrder,
        ignoredLocation = null
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

        const normalizedIgnoredLocation =
            normalizeLocation(
                ignoredLocation
            );

        return !state.working.some(
            assignment => {

                /*
                 * Position uniqueness is scoped
                 * to the same Display Location.
                 */

                if (
                    assignment.location !==
                    normalizedLocation
                ) {

                    return false;

                }

                /*
                 * Ignore the current assignment when
                 * changing its own placement.
                 */

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

        /*
         * Already selected.
         */

        if (
            isSelected(
                normalizedLocation
            )
        ) {

            return false;

        }

        /*
         * A Location belonging to a known Display Group
         * may replace the currently selected Location
         * in that same group.
         */

        const group =
            getGroupForLocation(
                normalizedLocation
            );

        const existingGroupAssignment =
            group
                ? getGroupAssignment(
                    normalizedLocation
                )
                : null;

        /*
         * Determine the requested sortOrder before
         * replacing the existing Group assignment.
         */

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
             * Position uniqueness is checked against
             * the target Location only.
             *
             * Since the target Location is not currently
             * selected, no existing assignment should
             * normally collide here.
             */

            if (
                !isSortOrderAvailable(
                    normalizedLocation,
                    sortOrder
                )
            ) {

                return false;

            }

        } else {

            /*
             * No placement supplied.
             *
             * Position is selected independently for
             * the target Location.
             */

            sortOrder =
                getNextAvailableSortOrder(
                    normalizedLocation
                );

        }

        /*
         * Replace the previous Location in the same
         * Display Group only after the new assignment
         * has passed all validation.
         */

        if (
            existingGroupAssignment
        ) {

            const existingIndex =
                state.working.findIndex(
                    assignment =>
                        assignment.location ===
                        existingGroupAssignment.location
                );

            if (
                existingIndex !== -1
            ) {

                state.working.splice(
                    existingIndex,
                    1
                );

            }

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
         * The requested sortOrder must be free
         * inside this Location, except for the
         * current assignment itself.
         */

        if (
            !isSortOrderAvailable(
                normalizedLocation,
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

        reset,

        getGroupForLocation,

        hasLocationInGroup,

        isLocationAllowed

    };

})();
