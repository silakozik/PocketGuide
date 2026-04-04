export function sanitizeString(str: string): string {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/[^\w\sğüşıöç]/gi, '') // Keep Turkish letters and alphanumeric
        .trim()
        .replace(/\s+/g, ' ');
}

export function calculateLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1) // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

export function getStringSimilarity(a: string, b: string): number {
    const s1 = sanitizeString(a);
    const s2 = sanitizeString(b);
    
    if (s1 === s2) return 1.0;
    
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = calculateLevenshteinDistance(s1, s2);
    // Return a ratio between 0.0 and 1.0 where 1.0 is a perfect match
    return (maxLen - distance) / maxLen;
}
