/*
 * ECLIPTALIS - Persistent Villager Profiles
 *
 * One ID = one person. Appearance, home, workplace and personality
 * stay attached to that villager instead of being randomized on refresh.
 */

export const VILLAGER_PROFILES = [
    {
        id: 1,
        name: "Tomas",
        gender: "male",
        ageGroup: "adult",
        personality: "farmer",
        homeId: "home_north",
        workplaceId: "farm_01",
        appearance: {
            outfit: "farmerVest",
            primaryColor: 0x6b4b2a,
            secondaryColor: 0xb59a6a,
            trouserColor: 0x39332b,
            hairStyle: "short",
            hairColor: 0x241b16,
            height: 1.03
        }
    },
    {
        id: 2,
        name: "Mara",
        gender: "female",
        ageGroup: "adult",
        personality: "homemaker",
        homeId: "home_west",
        workplaceId: null,
        appearance: {
            outfit: "apron",
            primaryColor: 0x59664a,
            secondaryColor: 0xb9aa88,
            trouserColor: 0x51463c,
            hairStyle: "bun",
            hairColor: 0x3a261d,
            height: 0.98
        }
    },
    {
        id: 3,
        name: "Elias",
        gender: "male",
        ageGroup: "adult",
        personality: "villager",
        homeId: "home_east",
        workplaceId: null,
        appearance: {
            outfit: "villageTunic",
            primaryColor: 0x34495a,
            secondaryColor: 0x7b705d,
            trouserColor: 0x302d2a,
            hairStyle: "side",
            hairColor: 0x1d1917,
            height: 1.00
        }
    },
    {
        id: 4,
        name: "Elise",
        gender: "female",
        ageGroup: "adult",
        personality: "waterBearer",
        homeId: "home_south",
        workplaceId: "well",
        appearance: {
            outfit: "villageDress",
            primaryColor: 0x67445b,
            secondaryColor: 0x9c8877,
            trouserColor: 0x433943,
            hairStyle: "long",
            hairColor: 0x2f211b,
            height: 1.01
        }
    },
    {
        id: 5,
        name: "Finn",
        gender: "male",
        ageGroup: "child",
        personality: "child",
        homeId: "home_north",
        workplaceId: null,
        appearance: {
            outfit: "childTunic",
            primaryColor: 0x786844,
            secondaryColor: 0xb3a37a,
            trouserColor: 0x443d32,
            hairStyle: "crop",
            hairColor: 0x4a3222,
            height: 0.90
        }
    },
    {
        id: 6,
        name: "Nell",
        gender: "female",
        ageGroup: "child",
        personality: "child",
        homeId: "home_west",
        workplaceId: null,
        appearance: {
            outfit: "childDress",
            primaryColor: 0x76566a,
            secondaryColor: 0xa58d78,
            trouserColor: 0x4b4146,
            hairStyle: "bob",
            hairColor: 0x35251d,
            height: 0.88
        }
    }
];

export function getVillagerProfile(id) {
    return VILLAGER_PROFILES.find((profile) => profile.id === id) || null;
}
