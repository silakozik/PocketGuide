import { Injectable } from '@nestjs/common';
import { NormalizedPOI, RawFoursquareVenue, RawGooglePlace, RawGTFSStop } from '@pocketguide/types';
import { mapFoursquareToPOI, mapGoogleToPOI, mapGtfsToPOI } from './mappers';
import { filterDuplicates } from './deduplicator';

// Eğer Drizzle DB'si provider olarak projede ayarlandıysa inject edilebilir:
// import { pois } from '@pocketguide/database';

@Injectable()
export class IngestionService {
    // constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

    public processFoursquare(rawItems: RawFoursquareVenue[], existingDbPois: NormalizedPOI[] = []): NormalizedPOI[] {
        const mapped = rawItems.map(mapFoursquareToPOI);
        return filterDuplicates(mapped, existingDbPois);
    }

    public processGoogle(rawItems: RawGooglePlace[], existingDbPois: NormalizedPOI[] = []): NormalizedPOI[] {
        const mapped = rawItems.map(mapGoogleToPOI);
        return filterDuplicates(mapped, existingDbPois);
    }

    public processGtfs(rawItems: RawGTFSStop[], existingDbPois: NormalizedPOI[] = []): NormalizedPOI[] {
        const mapped = rawItems.map(mapGtfsToPOI);
        return filterDuplicates(mapped, existingDbPois);
    }

    /**
     * Takes fully cleaned and deduplicated POIs and saves them to PostgreSQL via Drizzle.
     * @param uniquePois - Array of NormalizedPOIs ready for insertion
     */
    public async bulkInsertToDb(uniquePois: NormalizedPOI[]): Promise<void> {
        if (uniquePois.length === 0) {
            console.log('No new unique POIs to insert.');
            return;
        }

        /*
        Example Drizzle Insertion Logic:
        
        await this.db
            .insert(pois)
            .values(uniquePois)
            .onConflictDoNothing({ target: pois.sourceId }); // Prevent DB level duplicates if any
            
        console.log(`Successfully inserted ${uniquePois.length} new POIs into Database.`);
        */
        console.log(`[DRY RUN] Veritabanına ${uniquePois.length} adet yeni (benzersiz) POI kaydedildi.`);
    }
}
