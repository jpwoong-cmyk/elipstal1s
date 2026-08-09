/*
 * ECLIPTALIS - Villager Personality / Routine Rules
 *
 * This file describes behaviour. ingame_town.js remains responsible
 * for Three.js rendering and A* movement.
 */

export const TOWN_LOCATIONS = {
    home_north: { x: 0.0, z: -5.0 },
    home_west:  { x: -6.2, z: 0.0 },
    home_east:  { x: 6.4, z: 0.0 },
    home_south: { x: 0.0, z: 6.3 },

    well:       { x: 0.0, z: 1.0 },
    town_west:  { x: -3.7, z: 2.8 },
    town_east:  { x: 3.7, z: 2.8 },
    town_north: { x: 0.0, z: -1.8 },
    town_south: { x: 0.0, z: 4.2 },

    farm_01:    { x: 7.4, z: 6.2 }
};

export const PERSONALITY_RULES = {
    farmer: {
        routine(profile) {
            return [
                profile.homeId,
                profile.workplaceId || "farm_01",
                profile.workplaceId || "farm_01",
                "well",
                profile.workplaceId || "farm_01",
                profile.homeId
            ];
        }
    },

    homemaker: {
        routine(profile) {
            return [
                profile.homeId,
                "well",
                "town_west",
                profile.homeId,
                "town_north",
                profile.homeId
            ];
        }
    },

    waterBearer: {
        routine(profile) {
            return [
                profile.homeId,
                "well",
                profile.homeId,
                "well",
                "town_east",
                profile.homeId
            ];
        }
    },

    villager: {
        routine(profile) {
            return [
                profile.homeId,
                "town_north",
                "town_east",
                "well",
                "town_west",
                profile.homeId
            ];
        }
    },

    child: {
        routine(profile) {
            return [
                profile.homeId,
                "town_west",
                "town_south",
                "town_east",
                profile.homeId
            ];
        }
    }
};

export function getRoutineForVillager(profile) {
    const rule =
        PERSONALITY_RULES[profile.personality] ||
        PERSONALITY_RULES.villager;

    return rule.routine(profile).filter(Boolean);
}

export function getTownLocation(locationId) {
    return TOWN_LOCATIONS[locationId] || null;
}
