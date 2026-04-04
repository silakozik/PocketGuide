import { NormalizedPOI } from '@pocketguide/types';
import { calculateDistance } from './utils/geo.util';
import { getStringSimilarity } from './utils/string.util';

const DISTANCE_THRESHOLD_METERS = 50; // 50 meters
const STRING_SIMILARITY_THRESHOLD = 0.8; // 80% similar

/**
 * Checks if two NormalizedPOIs are considered duplicates.
 */
export function isDuplicate(poiA: NormalizedPOI, poiB: NormalizedPOI): boolean {
    const distance = calculateDistance(poiA.lat, poiA.lng, poiB.lat, poiB.lng);
    
    // If they are further apart than the threshold, they are definitely not the same place
    if (distance > DISTANCE_THRESHOLD_METERS) {
        return false;
    }

    const similarity = getStringSimilarity(poiA.name, poiB.name);
    
    // If names are highly similar and they are close geographically, its a duplicate.
    if (similarity >= STRING_SIMILARITY_THRESHOLD) {
        return true;
    }
    
    return false;
}

/**
 * Given an array of new POIs and existing POIs in DB, returns only new POIs 
 * that are NOT duplicates of existing ones.
 */
export function filterDuplicates(
    newPois: NormalizedPOI[], 
    existingDbPois: NormalizedPOI[]
): NormalizedPOI[] {
    const uniquePois: NormalizedPOI[] = [];

    for (const newPoi of newPois) {
        let duplicateFound = false;

        // Check against existing DB records
        for (const existingPoi of existingDbPois) {
            if (isDuplicate(newPoi, existingPoi)) {
                duplicateFound = true;
                break;
            }
        }

        // Check against already processed unique records in the current batch
        if (!duplicateFound) {
            for (const uniquePoi of uniquePois) {
                if (isDuplicate(newPoi, uniquePoi)) {
                    duplicateFound = true;
                    break;
                }
            }
        }

        if (!duplicateFound) {
            uniquePois.push(newPoi);
        }
    }

    return uniquePois;
}
