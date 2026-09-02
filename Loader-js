admin-panel\js\modules\cars\display-locations\loader.js
/*==================================================
    DISPLAY LOCATIONS LOADER

    Cars Admin Module

    Responsibility:
    - Receive authoritative Display Locations data
    - Validate the response structure
    - Delegate backend-to-state mapping to Mapper
    - Initialize DisplayLocationsState baseline

    No:
    - DOM access
    - Rendering
    - Checkbox handling
    - API definition
    - Fetch
    - Save logic
    - Backend persistence
    - Edit Session lifecycle
    - Placement calculation
    - Page / Card calculation
    - Backend field mapping

    Architecture:
    IIFE Module

    Data Flow:

        API / Integration
                ↓
        response.locations[]
                ↓
        DisplayLocationsMapper
                ↓
        {
            location,
            sortOrder
        }
                ↓
        DisplayLocationsState.setBaseline()
                ↓
        baseline[]
        working[]

==================================================*/

'use strict';

const DisplayLocationsLoader = (() => {

    /*==================================================
        LOAD
    ==================================================*/

    /**
     * Loads authoritative Display Location
     * assignments into DisplayLocationsState.
     *
     * This function does not fetch data.
     *
     * The response must already have been received
     * by the Integration / API layer.
     */
    function load(
        response
    ) {

        /*==============================================
            STATE AVAILABILITY
        ==============================================*/

        if (
            typeof DisplayLocationsState ===
                'undefined'
        ) {

            throw new Error(
                'DisplayLocationsState is not loaded.'
            );

        }

        /*==============================================
            MAPPER AVAILABILITY
        ==============================================*/

        if (
            typeof DisplayLocationsMapper ===
                'undefined'
        ) {

            throw new Error(
                'DisplayLocationsMapper is not loaded.'
            );

        }

        if (
            typeof DisplayLocationsMapper
                .mapLocations !==
                'function'
        ) {

            throw new Error(
                'DisplayLocationsMapper.mapLocations is not available.'
            );

        }

        /*==============================================
            RESPONSE VALIDATION
        ==============================================*/

        if (
            !response ||
            typeof response !== 'object' ||
            Array.isArray(response)
        ) {

            throw new Error(
                'Display Locations Loader: Invalid response.'
            );

        }

        if (
            !Array.isArray(
                response.locations
            )
        ) {

            throw new Error(
                'Display Locations Loader: Locations data is missing.'
            );

        }

        /*==============================================
            MAP BACKEND DATA
        ==============================================*/

        const assignments =
            DisplayLocationsMapper.mapLocations(
                response.locations
            );

        /*==============================================
            INITIALIZE STATE
        ==============================================*/

        DisplayLocationsState.setBaseline(
            assignments
        );

        /*==============================================
            DEBUG
        ==============================================*/

        console.log(
            'Display Locations State initialized.',
            DisplayLocationsState.getBaseline()
        );

        return true;

    }

    /*==================================================
        PUBLIC API
    ==================================================*/

    return {

        load

    };

})();
